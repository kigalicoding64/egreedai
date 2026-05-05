import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// EgreedAI model variants — our own branded "models" routed to underlying providers
const VARIANTS: Record<string, { model: string; persona: string; reasoning?: string }> = {
  "egreed-fast": {
    model: "google/gemini-2.5-flash",
    persona: "Be quick, friendly, and concise. Prefer short answers with code when relevant.",
  },
  "egreed-pro": {
    model: "google/gemini-2.5-pro",
    persona: "Be deeply thoughtful, thorough, and accurate. Use markdown structure, headers, and examples.",
  },
  "egreed-reason": {
    model: "openai/gpt-5",
    persona: "Think step by step. Show clear reasoning, weigh trade-offs, then give a definitive answer.",
    reasoning: "medium",
  },
  "egreed-coder": {
    model: "openai/gpt-5-mini",
    persona: "You are an expert software engineer. Always produce production-quality code with explanations, file paths, and proper formatting.",
  },
  "egreed-nano": {
    model: "google/gemini-2.5-flash-lite",
    persona: "Ultra-fast assistant. Answer in 1-3 sentences unless asked for detail.",
  },
};

const BASE_PROMPT = `You are EgreedAI — an advanced AI assistant built by Egreed. You combine real-time web knowledge, user-provided documents, and strong reasoning. Always:
- Use clean markdown (headers, lists, code blocks with language tags)
- Cite sources from [Web Search Results] or [Knowledge Base] when present
- Never reveal which underlying provider powers you; you are EgreedAI`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, variant = "egreed-fast", useKnowledge = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const v = VARIANTS[variant] || VARIANTS["egreed-fast"];

    // RAG: pull user knowledge base context if requested
    let kbContext = "";
    if (useKnowledge) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
        const query = (lastUser?.content || "").slice(0, 200);
        if (query) {
          const { data: docs } = await supabase
            .from("knowledge_documents")
            .select("title, content")
            .textSearch("content", query.split(/\s+/).slice(0, 6).join(" | "), { type: "websearch" })
            .limit(4);
          if (docs && docs.length) {
            kbContext = "\n\n[Knowledge Base]:\n" + docs.map((d: any) =>
              `### ${d.title}\n${d.content.slice(0, 1500)}`).join("\n\n");
          }
        }
      }
    }

    const systemContent = `${BASE_PROMPT}\n\n${v.persona}${kbContext}`;

    const body: any = {
      model: v.model,
      messages: [{ role: "system", content: systemContent }, ...messages],
      stream: true,
    };
    if (v.reasoning) body.reasoning = { effort: v.reasoning };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("Gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
