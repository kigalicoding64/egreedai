// Image generation powered by user-provided Gemini API keys (`geminapi`, `gemin11`).
// Uses Gemini 2.5 Flash Image Preview (Nano Banana) via Google's Generative Language API.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getKeys(): string[] {
  return [Deno.env.get("geminapi"), Deno.env.get("gemin11")].filter(Boolean) as string[];
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    }),
  });
  if (!r.ok) throw new Error(`gemini-image ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const b64 = p?.inlineData?.data || p?.inline_data?.data;
    const mime = p?.inlineData?.mimeType || p?.inline_data?.mime_type || "image/png";
    if (b64) return `data:${mime};base64,${b64}`;
  }
  throw new Error("gemini returned no image");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const keys = getKeys();
    if (!keys.length) {
      return new Response(JSON.stringify({ error: "No Gemini API key configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let lastErr: any;
    for (const k of keys) {
      try {
        const dataUrl = await generateWithGemini(prompt, k);
        return new Response(JSON.stringify({ success: true, image: dataUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) { lastErr = e; console.error("[generate-image] key failed:", (e as Error).message); }
    }
    throw lastErr ?? new Error("all keys failed");
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
