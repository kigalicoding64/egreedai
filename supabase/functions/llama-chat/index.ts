import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LLAMA_STACK_URL = Deno.env.get("LLAMA_STACK_URL");
    const LLAMA_STACK_API_KEY = Deno.env.get("LLAMA_STACK_API_KEY");
    const LLAMA_STACK_MODEL = Deno.env.get("LLAMA_STACK_MODEL") || "llama3.1";

    if (!LLAMA_STACK_URL) {
      return new Response(
        JSON.stringify({
          error: "LLAMA_STACK_URL is not configured. Add it in your project secrets to enable your self-hosted model.",
          notConfigured: true,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { messages, stream = true } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      throw new Error("messages array is required");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (LLAMA_STACK_API_KEY) {
      headers["Authorization"] = `Bearer ${LLAMA_STACK_API_KEY}`;
    }

    const body = JSON.stringify({
      model: LLAMA_STACK_MODEL,
      messages,
      stream,
    });

    const response = await fetch(LLAMA_STACK_URL, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Llama stack error:", response.status, text);
      return new Response(
        JSON.stringify({ error: `Llama stack returned ${response.status}: ${text}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (stream && response.body) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("llama-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
