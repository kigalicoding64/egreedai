// Creator Intelligence — ingestion pipeline.
// Fetches a source (upload | url | github | api | pdf | doc | text),
// chunks it, embeds each chunk via Lovable AI Gateway,
// versions and stores the results in the creator knowledge brain,
// and writes an audit log entry. Creator-only.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMBED_MODEL = "openai/text-embedding-3-small"; // 1536 dims
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 150;
const MAX_CHUNKS = 400;

function chunkText(text: string): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length && out.length < MAX_CHUNKS) {
    const end = Math.min(clean.length, i + CHUNK_SIZE);
    let slice = clean.slice(i, end);
    if (end < clean.length) {
      const lastBreak = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "), slice.lastIndexOf("\n"));
      if (lastBreak > CHUNK_SIZE * 0.5) slice = slice.slice(0, lastBreak + 1);
    }
    out.push(slice.trim());
    i += Math.max(1, slice.length - CHUNK_OVERLAP);
  }
  return out.filter((c) => c.length > 30);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function githubToRaw(url: string): string {
  // github.com/{o}/{r}/blob/{branch}/{path} → raw.githubusercontent.com/{o}/{r}/{branch}/{path}
  return url.replace(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i,
    "https://raw.githubusercontent.com/$1/$2/$3/$4");
}

async function fetchSourceContent(source: any, admin: any): Promise<{ text: string; meta: Record<string, unknown> }> {
  const kind = source.kind as string;
  const meta: Record<string, unknown> = { kind };

  if (kind === "text" || kind === "upload") {
    if (source.raw_content) return { text: source.raw_content, meta };
    if (source.config?.storage_path) {
      const { data, error } = await admin.storage.from("creator-knowledge").download(source.config.storage_path);
      if (error) throw new Error(`storage download: ${error.message}`);
      const buf = new Uint8Array(await data.arrayBuffer());
      // best-effort text decode (works for txt, md, json, csv, code files)
      const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      return { text, meta: { ...meta, bytes: buf.length } };
    }
    return { text: "", meta };
  }

  if (kind === "url" || kind === "doc") {
    const r = await fetch(source.url, { redirect: "follow" });
    if (!r.ok) throw new Error(`fetch url ${r.status}`);
    const ct = r.headers.get("content-type") || "";
    const body = await r.text();
    const text = ct.includes("html") ? stripHtml(body) : body;
    return { text, meta: { ...meta, contentType: ct, bytes: body.length } };
  }

  if (kind === "github") {
    const raw = githubToRaw(source.url);
    const r = await fetch(raw);
    if (!r.ok) throw new Error(`github ${r.status}`);
    const text = await r.text();
    return { text, meta: { ...meta, raw } };
  }

  if (kind === "api") {
    const r = await fetch(source.url, {
      method: source.config?.method || "GET",
      headers: source.config?.headers || {},
    });
    if (!r.ok) throw new Error(`api ${r.status}`);
    const text = await r.text();
    return { text, meta: { ...meta, contentType: r.headers.get("content-type") } };
  }

  if (kind === "pdf") {
    // Basic text-only ingestion. For scanned PDFs the creator can paste raw_content.
    if (source.raw_content) return { text: source.raw_content, meta };
    const r = await fetch(source.url);
    if (!r.ok) throw new Error(`pdf ${r.status}`);
    // Naive extraction: keep printable ASCII sequences.
    const buf = new Uint8Array(await r.arrayBuffer());
    const raw = new TextDecoder("latin1").decode(buf);
    const text = raw.replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
    return { text, meta: { ...meta, bytes: buf.length } };
  }

  return { text: source.raw_content || "", meta };
}

async function embedBatch(inputs: string[], lovableKey: string): Promise<number[][]> {
  // Send one request per chunk to stay under provider caps and keep it simple.
  const out: number[][] = [];
  for (const input of inputs) {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
      body: JSON.stringify({ model: EMBED_MODEL, input }),
    });
    if (!r.ok) throw new Error(`embed ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    out.push(j?.data?.[0]?.embedding ?? []);
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const user = userData.user;

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: isCreator, error: roleErr } = await admin.rpc("is_creator", { _user_id: user.id });
    if (roleErr || !isCreator) {
      return new Response(JSON.stringify({ error: "Forbidden — creators only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { source_id } = await req.json();
    if (!source_id) throw new Error("source_id required");

    const { data: source, error: srcErr } = await admin
      .from("creator_knowledge_sources").select("*").eq("id", source_id).maybeSingle();
    if (srcErr || !source) throw new Error("source not found");

    // mark indexing
    await admin.from("creator_knowledge_sources").update({ status: "indexing" }).eq("id", source_id);

    // fetch content
    const { text, meta } = await fetchSourceContent(source, admin);
    if (!text || text.length < 30) {
      await admin.from("creator_knowledge_sources").update({ status: "failed" }).eq("id", source_id);
      throw new Error("no usable content extracted");
    }

    // chunk + embed
    const chunks = chunkText(text);
    if (!chunks.length) {
      await admin.from("creator_knowledge_sources").update({ status: "failed" }).eq("id", source_id);
      throw new Error("no chunks produced");
    }
    const embeddings = await embedBatch(chunks, LOVABLE_API_KEY);

    // new version — deactivate old, insert new
    const newVersion = (source.current_version ?? 0) + 1;
    await admin.from("creator_knowledge_chunks")
      .update({ active: false }).eq("source_id", source_id);

    const rows = chunks.map((content, idx) => ({
      source_id, version: newVersion, active: true, chunk_index: idx,
      content, tokens: Math.round(content.length / 4),
      embedding: embeddings[idx] as any,
      metadata: { ...meta, offset: idx },
    }));
    // insert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const slice = rows.slice(i, i + 50);
      const { error: insErr } = await admin.from("creator_knowledge_chunks").insert(slice);
      if (insErr) throw new Error(`insert chunks: ${insErr.message}`);
    }

    // version snapshot
    await admin.from("creator_knowledge_versions").insert({
      source_id, version: newVersion, chunk_count: chunks.length,
      snapshot: { title: source.title, url: source.url, kind: source.kind, bytes: text.length, meta },
      created_by: user.id,
    });

    // confidence = simple heuristic based on content length & chunk yield
    const confidence = Math.min(0.99, 0.4 + Math.min(0.5, chunks.length / 100));

    await admin.from("creator_knowledge_sources").update({
      status: "indexed",
      current_version: newVersion,
      last_ingested_at: new Date().toISOString(),
      confidence,
    }).eq("id", source_id);

    await admin.from("creator_audit_log").insert({
      actor: user.id, actor_email: user.email, action: "ingest",
      target_type: "knowledge_source", target_id: source_id,
      metadata: { version: newVersion, chunks: chunks.length, bytes: text.length },
    });

    return new Response(JSON.stringify({
      success: true, version: newVersion, chunks: chunks.length, confidence,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[creator-ingest] error", (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
