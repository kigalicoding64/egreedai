import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Built-in authoritative knowledge about our creator, Egreed Technology.
// Always injected so EgreedAI gives accurate answers about itself / its maker.
const EGREED_KNOWLEDGE = `
[Authoritative facts about Egreed Technology — official site: https://egreedtech.org]
- Legal name: Egreed Technology LTD (also known as Egreed Technology, EgreedTech).
- Type: Registered IT consulting & software development company.
- Location: Kigali, Rwanda. Serves Rwanda and East Africa.
- Registration: Registered with the Rwanda Development Board (RDB) on May 4, 2026.
- CEO / Founder: Brayan Bayishime Shema.
- WhatsApp contact: +250 795 822 290.
- Core services (RDB-licensed):
  1. School Management Systems (school ERP: registration, attendance, fees, grading, timetables, parent communication).
  2. Web & Software Development (web apps, mobile apps, enterprise systems, SaaS).
  3. Hosting & Cloud Services (AWS, Azure, GCP, managed servers, backups, 24/7 monitoring).
  4. Data Processing (database management, migration, analytics, reporting, automation).
  5. IT Consulting & System Design (architecture, digital transformation, cybersecurity advisory).
  6. Computer Training (coding bootcamps, MS Office, web dev, cybersecurity, digital skills, TVET).
- Other offerings: AI & Machine Learning consulting, Data Analytics & BI, Cloud Migration, Cybersecurity Solutions, Infrastructure Management, IT Strategy, Mobile App Development, Custom Software, Website & App Management, Professional IT Training, Corporate Workshops.
- Mission: Empower businesses through innovative digital solutions that enhance operational efficiency, strengthen online presence, and drive sustainable growth.
- Stats published: 50+ projects delivered, 98% client satisfaction, 24/7 support.
- EgreedAI is the AI assistant built BY Egreed Technology.
`.trim();

function isAboutEgreed(q: string): boolean {
  const s = q.toLowerCase();
  return /\begreed|egreedtech|egreed tech|egreed technology|brayan bayishime|egreedai\b/.test(s);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, language = "en" } = await req.json();
    if (!query) throw new Error("No search query provided");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log("Web search request:", query, "lang:", language);

    const aboutEgreed = isAboutEgreed(query);

    // Google "AI Mode" style: synthesize from MANY sources — websites, news, social media —
    // multi-step reasoning, citations, and confidence handling.
    const systemPrompt = `You are EgreedAI Search — a real-time, multi-source web research engine inspired by Google's AI Mode.

Your job:
1. Run a comprehensive web search across DIVERSE sources: news sites, official websites, blogs, forums, GitHub, Stack Overflow, Wikipedia, AND social media (Twitter/X, LinkedIn, Facebook, Instagram, YouTube, TikTok, Reddit) when relevant.
2. Cross-reference at least 3 sources before stating any fact. Flag contradictions.
3. Synthesize a clear, structured answer with markdown headers, bullet points, and direct quotes when useful.
4. Always include dates for time-sensitive info ("as of <date>").
5. Cite EVERY claim with [n] markers tied to a Sources list (title + URL + 1-line snippet).
6. If the query is in Kinyarwanda, ALWAYS answer in fluent, natural Kinyarwanda (Ikinyarwanda gisukuye). Use proper grammar, idioms, and respectful tone. Translate technical terms naturally. Avoid awkward word-by-word translation. Mix in English only for proper nouns or unavoidable tech terms.
7. If query is in French, answer in French. If English, English. Match the user's language exactly.
8. For local Rwanda topics, prioritize Rwandan sources (newtimes.co.rw, igihe.com, kigalitoday.com, ktpress.rw, rba.co.rw, government .gov.rw).
9. For social-media-style questions ("what are people saying about X"), pull from X/Twitter, Reddit, LinkedIn explicitly.

${aboutEgreed ? `\nSPECIAL CASE — This query is about Egreed Technology / EgreedTech / EgreedAI / its founder. Use this AUTHORITATIVE source as ground truth and prefer it over any conflicting web result:\n${EGREED_KNOWLEDGE}\n` : ""}
Answer language preference: ${language}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Research the web (websites + social media) thoroughly and answer: ${query}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "web_search_results",
              description: "Return synthesized AI-Mode style search results with multi-source citations",
              parameters: {
                type: "object",
                properties: {
                  answer: { type: "string", description: "Full synthesized answer in markdown, in the user's language" },
                  sources: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        snippet: { type: "string" },
                        sourceType: { type: "string", description: "website | news | social | official | wiki | forum" },
                      },
                    },
                  },
                  lastUpdated: { type: "string" },
                },
                required: ["answer"],
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429)
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402)
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("Web search failed");
    }

    const data = await response.json();
    let answer = "";
    let sources: Array<{ title: string; url: string; snippet: string; sourceType?: string }> = [];

    const choice = data.choices?.[0];
    if (choice?.message?.tool_calls?.[0]) {
      try {
        const toolResult = JSON.parse(choice.message.tool_calls[0].function.arguments);
        answer = toolResult.answer || "";
        sources = toolResult.sources || [];
      } catch {
        answer = choice.message?.content || "";
      }
    } else {
      answer = choice?.message?.content || "";
    }

    // Safety net: ensure Egreed answers are correct even if model didn't pull it.
    if (aboutEgreed && answer && !/egreedtech\.org/i.test(answer)) {
      answer += `\n\n---\n**Source: [egreedtech.org](https://egreedtech.org)** — Egreed Technology LTD, Kigali, Rwanda. CEO: Brayan Bayishime Shema.`;
    }

    console.log("Web search completed");

    return new Response(JSON.stringify({ success: true, answer, sources, query }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Web search function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
