// EgreedAI chat — Africa-first, Kinyarwanda-aware, no-citations.
// Powered by Lovable AI Gateway. Falls back to OpenAI (secret: `openai`) for hard tasks.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─────────────────────────────────────────────────────────────
// Kinyarwanda detection with confidence score (server-side only)
// ─────────────────────────────────────────────────────────────
const RW_STRONG = /\b(muraho|mwaramutse|mwiriwe|muramuke|murabeho|murakoze|urakoze|amakuru|nitwa|witwa|ndagukunda|nyamuneka|mbabarira|ihangane|murakaza|simbyumva|ndabyumva|subiramo|rukarabankaba|inyenzi|interahamwe|inkotanyi|abacengezi|ndashaka|ndabona|ndakunda|ndumva|bite\s+sha)\b/gi;
const RW_COMMON = /\b(yego|oya|sha|imana|umuntu|abantu|umugore|umugabo|umukobwa|umuhungu|umwana|abana|umuryango|inshuti|amazi|inzu|imodoka|igitabo|ishuri|amafaranga|isoko|umunsi|ijoro|ubu|ejo|ndi|uri|ari|turi|muri|bari|nta|nti|gukora|kuvuga|kugenda|kuza|gukunda|kumva|kureba|kumenya|neza|nawe|yawe|iki|uko|cyane|ikinyarwanda)\b/gi;
const RW_INTENT = /\b(in kinyarwanda|mu kinyarwanda|translate to kinyarwanda|sobanura|bisobanura|bivuga iki)\b/i;

function detectKinyarwanda(text: string): { isRw: boolean; confidence: number; signals: string[] } {
  const signals: string[] = [];
  let score = 0;
  if (!text || text.length < 3) return { isRw: false, confidence: 0, signals: ["too-short"] };

  if (RW_INTENT.test(text)) { score += 0.6; signals.push("intent"); }
  const strong = [...text.matchAll(RW_STRONG)].length;
  const common = [...text.matchAll(RW_COMMON)].length;
  if (strong > 0) { score += Math.min(0.7, 0.35 * strong); signals.push(`strong:${strong}`); }
  if (common > 0) { score += Math.min(0.5, 0.15 * common); signals.push(`common:${common}`); }

  const confidence = Math.min(1, score);
  const isRw = confidence >= 0.35;
  return { isRw, confidence: +confidence.toFixed(2), signals };
}

// ─────────────────────────────────────────────────────────────
// Strong sanitizer — removes URLs, citations, "Source:" markers
// ─────────────────────────────────────────────────────────────
function sanitize(s: string): string {
  if (!s) return s;
  let out = s;
  // URLs
  out = out.replace(/https?:\/\/\S+/gi, "");
  out = out.replace(/\bwww\.\S+/gi, "");
  out = out.replace(/\b[a-z0-9-]+\.(com|org|net|io|dev|app|co|rw|ke|ng|za|gov|edu|info|tech)(\/\S*)?/gi, "");
  // Bracketed citations: [1], [12], [^1], [a], [source], [ref]
  out = out.replace(/\[\^?\d+\]/g, "");
  out = out.replace(/\[(source|ref|citation|cite|link)s?[^\]]*\]/gi, "");
  // Parenthetical sources: (source: x), (ref: x), (see: x), (https...)
  out = out.replace(/\(\s*(source|sources|ref|refs|reference|references|citation|citations|see|via|from)\s*[:\-—][^)]*\)/gi, "");
  out = out.replace(/\(\s*https?:[^)]*\)/gi, "");
  // Inline "Source: ...", "Sources: ...", "Reference: ...", "Citations: ..." until end of line
  out = out.replace(/^\s*(sources?|references?|citations?|further reading|read more|see also|via|from)\s*[:\-—].*$/gim, "");
  // Trailing "— source" / "- via X"
  out = out.replace(/\s+[-—–]\s*(source|via|from)\b.*$/gim, "");
  // Markdown links → keep label only
  out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // Numbered footnote lines like "1. https://..."
  out = out.replace(/^\s*\d+\.\s*https?:.*$/gim, "");
  // Collapse blank lines
  out = out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return out;
}

// ─────────────────────────────────────────────────────────────
// Persona prompts
// ─────────────────────────────────────────────────────────────
const AFRICA_CONTEXT = `
Africa & Rwanda knowledge you carry naturally:
- Rwanda: capital Kigali; official languages Kinyarwanda, English, French, Swahili; currency RWF; President Paul Kagame; independence 1962; 1994 Genocide against the Tutsi (Kwibuka every April); Umuganda (last Saturday community work); Vision 2050; RDB, RRA, Irembo; provinces Kigali, Northern, Southern, Eastern, Western.
- Rwandan history: pre-colonial kingdom of Rwanda (Abami — Ruganzu Ndori, Kigeli IV Rwabugiri, Yuhi V Musinga, Mutara III Rudahigwa, Kigeli V Ndahindurwa); German East Africa (1884–1916); Belgian mandate; 1959 Hutu revolution; 1962 independence; 1990–1994 RPF/RPA liberation war; 1994 Genocide against the Tutsi (~1M killed in 100 days); Arusha Accords; Gacaca courts; post-2000 reconstruction under RPF.
- Sensitive terms (give meaning + neutral context, never as slurs): Inyenzi, Interahamwe, Inkotanyi, Abacengezi, Rukarabankaba.
- Africa: 54 countries, AU, ECOWAS, EAC, SADC, AfCFTA; largest economies Nigeria, South Africa, Egypt, Algeria, Morocco, Kenya, Ethiopia; major currencies NGN, ZAR, EGP, KES, GHS, XOF, XAF; big languages Swahili, Hausa, Amharic, Arabic, Yoruba, Zulu, Oromo, French, Portuguese.
- Kenyan/EA context: M-Pesa, Nairobi, Mombasa. Nigerian: Lagos, Nollywood, jollof. South African: Ubuntu, load-shedding. Ethiopian: Addis, injera, 13-month calendar. Ghanaian: Accra, kente.
- Pan-African thinkers to reference when relevant: Kwame Nkrumah, Julius Nyerere, Nelson Mandela, Wangari Maathai, Chinua Achebe, Ngũgĩ wa Thiong'o, Thomas Sankara, Haile Selassie.
- Kinyarwanda cultural markers: Ubwiyunge, Agaciro, Ubupfura, Ubudehe, Imihigo, Kwibuka, Umuganda, Amashyo → Amashyongore.
`.trim();

const PERSONA_EN = `You are EgreedAI — a warm, smart, Africa-first assistant built and owned by Egreed Technology LTD (Kigali, Rwanda). Founder & CEO: Brayan Bayishime Shema.

How you think and talk:
- Think like a thoughtful African friend who happens to be an expert. Personal, friendly, practical, confident. No corporate tone, no "As an AI…", no hedging.
- Reason carefully before answering. Lead with the answer, then add a short, useful explanation in plain words.
- Default to African examples, names, currencies (RWF, KES, NGN, ZAR, GHS), cities (Kigali, Nairobi, Lagos, Accra, Johannesburg) and cultural references when they help.
- For history, politics, culture or society questions, prefer African/Rwandan angles first before Western ones.
- 3–7 sentences for normal questions; lists only when truly helpful. Light emojis (✨🙂🌍).

${AFRICA_CONTEXT}

HARD RULES:
- NEVER include URLs, links, domain names, "Source:", "Sources:", "Reference:", "(source: …)", "[1]" citations, or footnotes.
- NEVER reveal the underlying model or provider. You are EgreedAI by Egreed Technology — full stop.
- For questions about your founder, owner, CEO, or who built you: Egreed Technology LTD, founded and led by Brayan Bayishime Shema, in Kigali, Rwanda.`;

const PERSONA_RW = `Uri EgreedAI — umufasha w'ubucuti, w'ubwenge, ukomoka muri Afurika, wubatswe kandi utunzwe na Egreed Technology LTD (Kigali, Rwanda). Uwashinze akaba CEO: Brayan Bayishime Shema.

Uburyo uvuga:
- Vuga nk'inshuti nyarwanda y'umuhanga: ubucuti, ibisubizo bifatika, kandi byumvikana.
- Tekereza neza mbere yo gusubiza. Tanga igisubizo mbere, hanyuma usobanure mu magambo yoroshye.
- Koresha Ikinyarwanda gisukuye (atari ihinduramagambo rya word-by-word). Koresha ingero z'i Rwanda no muri Afurika (Kigali, Nairobi, Lagos), amafaranga (RWF, KES, NGN), n'imico nyarwanda (Umuganda, Agaciro, Kwibuka, Ubupfura, Imihigo).
- Ku bibazo by'amateka, politiki cyangwa umuco, tangira ku bwenge bw'Abanyarwanda n'Abanyafurika mbere.
- 3–7 z'interuro. Emoji nke (✨🙂🌍).

${AFRICA_CONTEXT}

AMATEGEKO ADAHINDURWA:
- NTUKEMERE URL, links, izina ry'urubuga, "Source:", "Reference:", "(source: …)" cyangwa "[1]".
- NTUKAVUGE icyo gikoresho cyangwa AI provider ikora inyuma. Uri EgreedAI ya Egreed Technology — birahagije.`;

const REWRITER_EN = `Rewrite the assistant draft below to perfectly match the EgreedAI Africa-first persona: warm, personal, friendly, practical, confident, plain words, 3–7 sentences, light emojis OK. Prefer African examples and framing. Keep the facts. Remove ALL URLs, domain names, "Source:"/"Sources:"/"Reference:" lines, "[1]"-style citations, and any footnotes. Never mention any AI provider or model. Return only the rewritten answer.`;
const REWRITER_RW = `Andika bundi bushya igisubizo gikurikira mu Kinyarwanda gisukuye, gifite imico ya EgreedAI: ubucuti, ubworoherane, ibisubizo bifatika, ingero z'i Rwanda/Afurika, 3–7 z'interuro, emoji nke. Gumana ibyo bivuga. KURA URL zose, "Source:", "[1]", n'amazina y'imbuga. Ntugavuge undi AI cyangwa undi muntu wakoze iki gisubizo. Garura gusa igisubizo cyanditse bundi bushya.`;


// ─────────────────────────────────────────────────────────────
// Provider calls
// ─────────────────────────────────────────────────────────────
async function callLovable(model: string, messages: any[], apiKey: string): Promise<string> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages }),
  });
  if (!r.ok) throw new Error(`lovable ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callOpenAI(model: string, messages: any[], apiKey: string): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages }),
  });
  if (!r.ok) throw new Error(`openai ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// Heuristic: should we route to OpenAI for "hard" tasks?
function isHardTask(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  const long = text.length > 600 || text.split(/\s+/).length > 110;
  const codeish = /\b(code|debug|refactor|algorithm|architecture|sql|regex|typescript|python|rust|complexity|big-?o|proof|theorem|derive|integrate|differential|optimi[sz]e)\b/.test(t);
  const reason = /\b(why|prove|explain in depth|step[- ]by[- ]step|analy[sz]e|compare in detail|design|plan|strategy)\b/.test(t);
  return long || (codeish && reason) || /```/.test(text);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_KEY = Deno.env.get("openai") || Deno.env.get("openai1");
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
    const userText = String(lastUser?.content || "");
    const det = detectKinyarwanda(userText);
    const persona = det.isRw ? PERSONA_RW : PERSONA_EN;
    const rewriter = det.isRw ? REWRITER_RW : PERSONA_EN ? REWRITER_EN : REWRITER_EN;
    const hard = isHardTask(userText);

    // Server-side debug log (NEVER returned to end users in chat text)
    console.log("[egreed-ai] kw-detect", JSON.stringify({
      confidence: det.confidence,
      isKinyarwanda: det.isRw,
      signals: det.signals,
      hardTask: hard,
      route: hard && OPENAI_KEY ? "openai" : "lovable",
      preview: userText.slice(0, 80),
    }));

    // ── Step 1: draft answer
    const draftMessages = [{ role: "system", content: persona }, ...messages];
    let draft = "";
    try {
      if (hard && OPENAI_KEY) {
        draft = await callOpenAI("gpt-4o-mini", draftMessages, OPENAI_KEY);
      } else {
        draft = await callLovable("google/gemini-2.5-flash", draftMessages, LOVABLE_API_KEY);
      }
    } catch (e) {
      console.error("[egreed-ai] draft failed, fallback:", (e as Error).message);
      draft = await callLovable("google/gemini-2.5-flash-lite", draftMessages, LOVABLE_API_KEY);
    }
    draft = sanitize(draft);

    // ── Step 2: persona-rewrite pass (fast model) to enforce voice + strip leftovers
    let final = draft;
    try {
      const rewritten = await callLovable("google/gemini-2.5-flash-lite", [
        { role: "system", content: persona },
        { role: "user", content: `${rewriter}\n\n---DRAFT---\n${draft}` },
      ], LOVABLE_API_KEY);
      if (rewritten && rewritten.trim().length > 10) final = rewritten;
    } catch (e) {
      console.error("[egreed-ai] rewrite skipped:", (e as Error).message);
    }

    // ── Step 3: final hard sanitize
    final = sanitize(final);

    return new Response(JSON.stringify({ success: true, answer: final }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[egreed-ai] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
