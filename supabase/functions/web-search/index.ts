import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EGREED_KNOWLEDGE = `
[Authoritative facts about Egreed Technology — official site: https://egreedtech.org]
- Legal name: Egreed Technology LTD (Egreed Technology, EgreedTech).
- Registered IT consulting & software company, Kigali, Rwanda. Serves Rwanda & East Africa.
- Registered with RDB on May 4, 2026.
- CEO / Founder: Brayan Bayishime Shema. WhatsApp: +250 795 822 290.
- RDB-licensed services: School Management Systems; Web & Software Development; Hosting & Cloud; Data Processing; IT Consulting & System Design; Computer Training.
- Other offerings: AI/ML consulting, Data Analytics & BI, Cloud Migration, Cybersecurity, Infra Mgmt, IT Strategy, Mobile Apps, Custom Software, Website/App Mgmt, Pro IT Training, Corporate Workshops.
- Mission: Empower businesses through innovative digital solutions.
- 50+ projects delivered, 98% client satisfaction, 24/7 support.
- EgreedAI is the AI assistant built BY Egreed Technology.
`.trim();

function isAboutEgreed(q: string): boolean {
  return /\b(egreed|egreedtech|egreed tech|egreed technology|brayan bayishime|egreedai)\b/i.test(q);
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function decode(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function unwrapDdg(href: string): string {
  try {
    if (href.startsWith("//")) href = "https:" + href;
    const u = new URL(href, "https://duckduckgo.com");
    const real = u.searchParams.get("uddg");
    if (real) return decodeURIComponent(real);
    return u.toString();
  } catch {
    return href;
  }
}

interface Source { title: string; url: string; snippet: string; sourceType?: string; quality?: number }

// ---------- Cache + dedupe + rate-limit (in-memory, per-instance) ----------
type CacheEntry = { at: number; payload: any };
const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const CACHE_MAX = 200;
const INFLIGHT = new Map<string, Promise<any>>();

const RL = new Map<string, number[]>(); // ip -> timestamps
const RL_WINDOW_MS = 60_000;
const RL_MAX = 20; // per IP per minute

function normKey(q: string) { return q.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 256); }

function cacheGet(k: string) {
  const e = CACHE.get(k);
  if (!e) return null;
  if (Date.now() - e.at > CACHE_TTL_MS) { CACHE.delete(k); return null; }
  return e.payload;
}
function cacheSet(k: string, payload: any) {
  if (CACHE.size >= CACHE_MAX) {
    const oldest = [...CACHE.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) CACHE.delete(oldest[0]);
  }
  CACHE.set(k, { at: Date.now(), payload });
}
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (RL.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (arr.length >= RL_MAX) { RL.set(ip, arr); return true; }
  arr.push(now); RL.set(ip, arr); return false;
}

// ---------- Quality scoring ----------
const LOW_QUALITY_HOSTS = /(pinterest\.|quora\.|reddit\.com\/r\/|answers\.yahoo|ehow\.|fandom\.com|wikihow\.com)/i;
function scoreSource(s: Source, q: string): number {
  let n = 0;
  const text = `${s.title} ${s.snippet}`.toLowerCase();
  const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  for (const t of terms) if (text.includes(t)) n += 2;
  if (s.snippet.length > 80) n += 2;
  if (s.snippet.length > 200) n += 1;
  if (/^https:/.test(s.url)) n += 1;
  if (LOW_QUALITY_HOSTS.test(s.url)) n -= 3;
  if (s.sourceType === "encyclopedia") n += 4;
  if (s.sourceType === "archive") n += 2;
  return n;
}

async function ddgSearch(query: string, max = 10): Promise<Source[]> {
  try {
    const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" },
    });
    const html = await r.text();
    const out: Source[] = [];
    const blockRe = /<div[^>]*class="[^"]*result\b[^"]*"[\s\S]*?(?=<div[^>]*class="[^"]*result\b|<\/div>\s*<\/div>\s*<\/div>)/g;
    const blocks = html.match(blockRe) || [];
    const seenHosts = new Set<string>();
    for (const b of blocks) {
      if (out.length >= max) break;
      const linkM = b.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (!linkM) continue;
      const url = unwrapDdg(linkM[1]);
      const title = decode(linkM[2]);
      if (!title || !/^https?:/.test(url)) continue;
      if (/duckduckgo\.com\/y\.js/.test(url)) continue;
      const snipM = b.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/)
        || b.match(/<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      const snippet = snipM ? decode(snipM[1]) : "";
      // dedupe
      let host = ""; try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
      const dedupeKey = host + "|" + title.toLowerCase().slice(0, 60);
      if (seenHosts.has(dedupeKey)) continue;
      seenHosts.add(dedupeKey);
      out.push({ title, url, snippet, sourceType: "web" });
    }
    return out;
  } catch (e) {
    console.error("ddg failed:", e);
    return [];
  }
}

async function wikipediaSummary(query: string): Promise<Source | null> {
  try {
    const sr = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&format=json&search=${encodeURIComponent(query)}`, { headers: { "User-Agent": UA } });
    const j = await sr.json();
    const title = j?.[1]?.[0]; const url = j?.[3]?.[0];
    if (!title || !url) return null;
    const sm = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { headers: { "User-Agent": UA } });
    const sj = await sm.json();
    return { title: `Wikipedia: ${title}`, url, snippet: sj?.extract || "", sourceType: "encyclopedia" };
  } catch { return null; }
}

async function waybackArchive(url: string): Promise<string | null> {
  try {
    const r = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`, { headers: { "User-Agent": UA } });
    const j = await r.json();
    return j?.archived_snapshots?.closest?.url || null;
  } catch { return null; }
}

async function archiveOrgSearch(query: string, max = 3): Promise<Source[]> {
  try {
    const r = await fetch(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier&fl[]=title&fl[]=description&rows=${max}&output=json`, { headers: { "User-Agent": UA } });
    const j = await r.json();
    const docs = j?.response?.docs || [];
    return docs.map((d: any) => ({
      title: `Internet Archive: ${d.title}`,
      url: `https://archive.org/details/${d.identifier}`,
      snippet: (d.description ? (Array.isArray(d.description) ? d.description.join(' ') : d.description) : '').slice(0, 280),
      sourceType: "archive",
    }));
  } catch { return []; }
}

// ---------- Programming / coding detection → GeeksforGeeks ----------
const CODE_HINTS = /\b(algorithm|algorithms|data structure|dsa|array|arrays|linked list|stack|queue|tree|binary tree|graph|hash|hashmap|recursion|sort|sorting|search|big[- ]?o|complexity|leetcode|interview|python|java\b|javascript|typescript|c\+\+|golang|rust\b|kotlin|php|sql|mysql|mongodb|react\b|node\.?js|django|flask|spring|api|rest|loop|function|class|oop|object[- ]oriented|pointer|memory|thread|concurrency|compile|debug|regex|json|xml|html|css|tailwind)\b/i;
function isCodeQuery(q: string): boolean { return CODE_HINTS.test(q); }

async function gfgSearch(query: string, max = 5): Promise<Source[]> {
  const res = await ddgSearch(`site:geeksforgeeks.org ${query}`, max);
  return res.map((s) => ({ ...s, sourceType: "geeksforgeeks" }));
}

// ---------- Friendly humanizer (no LLM, no citations) ----------
function cleanSnippet(s: string): string {
  return s
    .replace(/\(Archived:[^)]*\)/g, "")
    .replace(/\b(Wikipedia:|Internet Archive:|GeeksforGeeks[-:])\s*/gi, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function splitSentences(s: string): string[] {
  return s.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9"'])/).map((x) => x.trim()).filter((x) => x.length > 25 && x.length < 320);
}
function dedupeSentences(arr: string[]): string[] {
  const seen = new Set<string>(); const out: string[] = [];
  for (const s of arr) {
    const k = s.toLowerCase().replace(/[^a-z0-9 ]/g, "").slice(0, 80);
    if (seen.has(k)) continue; seen.add(k); out.push(s);
  }
  return out;
}
function humanize(query: string, ranked: Source[], opts: { code: boolean; egreed: boolean }): string {
  const top = ranked.slice(0, 6);
  const sentences = dedupeSentences(top.flatMap((s) => splitSentences(cleanSnippet(s.snippet || s.title))));
  const body = sentences.slice(0, opts.code ? 6 : 5).join(" ");

  const intros = opts.code
    ? ["Sure! Here's a clear way to think about it 👇", "Great question — let me walk you through it.", "Happy to help! Here's the gist:"]
    : ["Here's what I've got for you ✨", "Sure thing — here's a friendly rundown:", "Got it! Quick answer for you:"];
  const intro = intros[Math.floor(Math.random() * intros.length)];

  const egreedTag = opts.egreed
    ? "\n\n— from your friends at **Egreed Technology** 💚"
    : "";

  if (!body) {
    return `${intro}\n\nI couldn't pull a clean answer from the web this time, but try rephrasing your question and I'll dig again.${egreedTag}`;
  }
  return `${intro}\n\n${body}${egreedTag}`;
}

async function runSearch(query: string) {
  const aboutEgreed = isAboutEgreed(query);
  const codeQ = isCodeQuery(query);

  const [web, wiki, ia, gfg] = await Promise.all([
    ddgSearch(query, 8),
    wikipediaSummary(query),
    archiveOrgSearch(query, 2),
    codeQ ? gfgSearch(query, 5) : Promise.resolve([] as Source[]),
  ]);

  const all: Source[] = [];
  if (codeQ) all.push(...gfg);
  if (wiki) all.push(wiki);
  all.push(...web);
  all.push(...ia);

  for (const s of all) s.quality = scoreSource(s, query) + (s.sourceType === "geeksforgeeks" ? 5 : 0);

  let ranked = [...all].sort((a, b) => (b.quality || 0) - (a.quality || 0));

  const answer = humanize(query, ranked, { code: codeQ, egreed: aboutEgreed });
  return { success: true, answer, sources: ranked, query };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anon";
    if (rateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Rate limit: max 20 searches/min" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { query } = await req.json();
    if (!query || typeof query !== "string") throw new Error("No query");

    const key = normKey(query);
    const cached = cacheGet(key);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dedupe in-flight identical queries
    let promise = INFLIGHT.get(key);
    if (!promise) {
      promise = runSearch(query).finally(() => INFLIGHT.delete(key));
      INFLIGHT.set(key, promise);
    }
    const payload = await promise;
    cacheSet(key, payload);
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("web-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
