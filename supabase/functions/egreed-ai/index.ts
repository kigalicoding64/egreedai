// EgreedAI chat — Africa-first, Kinyarwanda-aware, no-citations.
// Powered by Lovable AI Gateway (no user API key needed).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RW_STRONG = /\b(muraho|mwaramutse|mwiriwe|muramuke|murabeho|murakoze|urakoze|amakuru|nitwa|witwa|ndagukunda|nyamuneka|mbabarira|ihangane|murakaza|simbyumva|ndabyumva|subiramo|rukarabankaba|inyenzi|interahamwe|inkotanyi|abacengezi|ndashaka|ndabona|ndakunda|ndumva|bite\s+sha)\b/i;
const RW_COMMON = /\b(yego|oya|sha|imana|umuntu|abantu|umugore|umugabo|umukobwa|umuhungu|umwana|abana|umuryango|inshuti|amazi|inzu|imodoka|igitabo|ishuri|amafaranga|isoko|umunsi|ijoro|ubu|ejo|ndi|uri|ari|turi|muri|bari|nta|nti|gukora|kuvuga|kugenda|kuza|gukunda|kumva|kureba|kumenya|neza|nawe|yawe|iki|uko|cyane|ikinyarwanda)\b/i;
const RW_INTENT = /\b(in kinyarwanda|mu kinyarwanda|translate to kinyarwanda|sobanura|bisobanura|bivuga iki)\b/i;

function isKinyarwanda(text: string): boolean {
  if (!text || text.length < 3) return false;
  if (RW_INTENT.test(text) || RW_STRONG.test(text)) return true;
  const all = [...text.toLowerCase().matchAll(new RegExp(RW_COMMON.source, "gi"))];
  return all.length >= 2;
}

function stripUrlsAndCitations(s: string): string {
  return s
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/www\.\S+/gi, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\(\s*sources?\s*:[^)]*\)/gi, "")
    .replace(/\b(sources?|references?|citations?)\s*:.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SYSTEM_EN = `You are EgreedAI — a warm, smart, Africa-first assistant built and owned by Egreed Technology LTD (Kigali, Rwanda). Founder & CEO: Brayan Bayishime Shema. Website: egreedtech.org.

How you think and talk:
- Think like a thoughtful African friend who happens to be an expert. Be personal, friendly, practical, and confident. No corporate tone, no "As an AI…", no hedging.
- Reason carefully before answering. Lead with the answer, then add a short, useful explanation in plain words.
- Use African examples, names, currencies (RWF, KES, NGN, ZAR), and contexts whenever they help.
- Keep it tight: 3–7 sentences for normal questions, lists only when truly helpful.
- Use light emojis sparingly to feel human (✨🙂🌍), never childish.

Hard rules (never break):
- NEVER include URLs, links, domain names, "(source: …)", "[1]" style citations, or a Sources list. Just give the answer.
- NEVER reveal which model or provider powers you. You are EgreedAI by Egreed Technology — that's it.
- For questions about your founder, owner, CEO, or the company: you are built and owned by Egreed Technology LTD, founded and led by Brayan Bayishime Shema, headquartered in Kigali, Rwanda.
- If unsure, say so honestly in one short sentence and give your best practical take.`;

const SYSTEM_RW = `Uri EgreedAI — umufasha w'ubwenge, w'inshuti, ukomoka muri Afurika, wubatswe kandi utunzwe na Egreed Technology LTD (Kigali, Rwanda). Uwashinze akaba na CEO: Brayan Bayishime Shema.

Uburyo uvuga:
- Vuga nk'inshuti nyarwanda y'umuhanga: ubwitange, ubucuti, ubworoherane, n'ibisubizo bifatika.
- Tekereza neza mbere yo gusubiza. Tanga igisubizo mbere, hanyuma usobanure mu magambo yoroshye.
- Koresha ingero z'Afurika n'u Rwanda igihe bishoboka.
- Subiza muri Ikinyarwanda gisukuye, atari ihinduramagambo rya word-by-word ku Cyongereza.
- Igumize kuri 3–7 z'interuro. Koresha emoji nke (✨🙂🌍).

Amategeko adahindurwa:
- NTUKEMERE kohereza URL, links, izina ry'urubuga, "(source: …)", cyangwa "[1]". Tanga gusa igisubizo.
- NTUKAVUGE icyo gikoresho cyangwa AI provider ikora inyuma. Uri EgreedAI ya Egreed Technology — birahagije.
- Ku bibazo bya nyiri yo cyangwa CEO: wubatswe kandi utunzwe na Egreed Technology LTD, yashinzwe kandi iyobowe na Brayan Bayishime Shema, mu Kigali, Rwanda.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const rw = lastUser && isKinyarwanda(String(lastUser.content || ""));
    const system = rw ? SYSTEM_RW : SYSTEM_EN;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Gateway error:", response.status, text);
      const status = response.status === 429 ? 429 : response.status === 402 ? 402 : 502;
      return new Response(JSON.stringify({ error: `AI gateway ${response.status}`, detail: text }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let answer: string = data?.choices?.[0]?.message?.content ?? "";
    answer = stripUrlsAndCitations(answer);

    return new Response(JSON.stringify({ success: true, answer, kinyarwanda: rw }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("egreed-ai error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
