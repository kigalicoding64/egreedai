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

// Free search: DuckDuckGo HTML endpoint — no key required.
async function ddgSearch(query: string, max = 8) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; EgreedAI/1.0)",
      "Accept": "text/html",
    },
  });
  const html = await r.text();
  const results: { title: string; url: string; snippet: string }[] = [];
  const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && results.length < max) {
    let href = m[1];
    try {
      const u = new URL(href, "https://duckduckgo.com");
      const real = u.searchParams.get("uddg");
      if (real) href = decodeURIComponent(real);
    } catch {}
    const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    results.push({ url: href, title: strip(m[2]), snippet: strip(m[3]) });
  }
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query } = await req.json();
    if (!query) throw new Error("No query");

    const aboutEgreed = isAboutEgreed(query);
    const sources = await ddgSearch(query, 8).catch(() => []);

    const lines: string[] = [];
    if (aboutEgreed) lines.push(EGREED_KNOWLEDGE, "");
    lines.push(`Top web results for "${query}":`, "");
    sources.forEach((s, i) => {
      lines.push(`[${i + 1}] ${s.title}`);
      lines.push(`    ${s.url}`);
      if (s.snippet) lines.push(`    ${s.snippet}`);
      lines.push("");
    });

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
