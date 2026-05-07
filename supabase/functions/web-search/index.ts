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

interface Source { title: string; url: string; snippet: string; sourceType?: string }

async function ddgSearch(query: string, max = 10): Promise<Source[]> {
  try {
    const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" },
    });
    const html = await r.text();
    const out: Source[] = [];
    // Match each result block, then extract link + snippet within it
    const blockRe = /<div[^>]*class="[^"]*result\b[^"]*"[\s\S]*?(?=<div[^>]*class="[^"]*result\b|<\/div>\s*<\/div>\s*<\/div>)/g;
    const blocks = html.match(blockRe) || [];
    for (const b of blocks) {
      if (out.length >= max) break;
      const linkM = b.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (!linkM) continue;
      const url = unwrapDdg(linkM[1]);
      const title = decode(linkM[2]);
      if (!title || !/^https?:/.test(url)) continue;
      // skip obvious junk
      if (/duckduckgo\.com\/y\.js/.test(url)) continue;
      const snipM = b.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/)
        || b.match(/<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      const snippet = snipM ? decode(snipM[1]) : "";
      // dedupe by host+path
      if (out.some((s) => s.url === url)) continue;
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
    const title = j?.[1]?.[0];
    const url = j?.[3]?.[0];
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query } = await req.json();
    if (!query) throw new Error("No query");

    const aboutEgreed = isAboutEgreed(query);

    // Run sources in parallel
    const [web, wiki, ia] = await Promise.all([
      ddgSearch(query, 10),
      wikipediaSummary(query),
      archiveOrgSearch(query, 3),
    ]);

    const sources: Source[] = [];
    if (wiki) sources.push(wiki);
    sources.push(...web);
    sources.push(...ia);

    // For top 3 web results, attach a Wayback snapshot link (in case the live page disappears)
    await Promise.all(sources.slice(0, 3).map(async (s) => {
      if (s.sourceType === "web") {
        const wb = await waybackArchive(s.url);
        if (wb) s.snippet += ` (Archived: ${wb})`;
      }
    }));

    const lines: string[] = [];
    if (aboutEgreed) lines.push(EGREED_KNOWLEDGE, "");
    lines.push(`Synthesized sources for "${query}" — cite as [n]:`, "");
    sources.forEach((s, i) => {
      lines.push(`[${i + 1}] (${s.sourceType}) ${s.title}`);
      lines.push(`    ${s.url}`);
      if (s.snippet) lines.push(`    ${s.snippet}`);
      lines.push("");
    });
    lines.push("Instruction to assistant: Synthesize a clear, professional, human-quality answer using ONLY the above sources. Resolve contradictions, drop low-quality results, and add inline citations like [1], [2]. End with a short 'Sources' list.");

    const answer = lines.join("\n");
    return new Response(JSON.stringify({ success: true, answer, sources, query }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("web-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
