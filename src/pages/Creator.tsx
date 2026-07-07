import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsCreator } from "@/hooks/useIsCreator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Shield, Brain, BookOpen, GitBranch, ScrollText, Upload, Link2, Github, Zap,
  CheckCircle2, XCircle, RefreshCw, Play, Trash2, FileText, LogOut,
} from "lucide-react";

type Config = {
  id?: string; scope: string; identity: string; mission: string; personality: string;
  global_instructions: string; constitutional_principles: string; reasoning_policies: string;
  response_style: string; active: boolean; version: number;
};

const EMPTY_CFG: Config = {
  scope: "global", identity: "", mission: "", personality: "",
  global_instructions: "", constitutional_principles: "", reasoning_policies: "",
  response_style: "", active: true, version: 1,
};

type Source = {
  id: string; scope: string; kind: string; title: string; url: string | null;
  status: string; approval_state: string; confidence: number | null;
  schedule: string | null; last_ingested_at: string | null; current_version: number;
  raw_content?: string | null; config?: any; created_at: string;
};

export default function Creator() {
  const nav = useNavigate();
  const { loading, isCreator, email } = useIsCreator();
  const [cfg, setCfg] = useState<Config>(EMPTY_CFG);
  const [sources, setSources] = useState<Source[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [ingestingId, setIngestingId] = useState<string | null>(null);

  // Add-source form
  const [newSrc, setNewSrc] = useState({
    kind: "url", title: "", url: "", raw_content: "", schedule: "manual",
  });

  useEffect(() => {
    if (!loading && !isCreator) nav("/");
  }, [loading, isCreator, nav]);

  useEffect(() => { if (isCreator) refresh(); }, [isCreator]);

  async function refresh() {
    const [{ data: c }, { data: s }, { data: v }, { data: a }] = await Promise.all([
      supabase.from("creator_config").select("*").eq("active", true).eq("scope", "global").order("version", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("creator_knowledge_sources").select("*").order("created_at", { ascending: false }),
      supabase.from("creator_knowledge_versions").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("creator_audit_log").select("*").order("at", { ascending: false }).limit(100),
    ]);
    if (c) setCfg(c as any); else setCfg(EMPTY_CFG);
    setSources((s as any) || []);
    setVersions((v as any) || []);
    setAudit((a as any) || []);
  }

  async function saveConfig() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    // Deactivate the current active version, insert a new one with version+1
    const nextVersion = (cfg.version ?? 0) + 1;
    await supabase.from("creator_config").update({ active: false }).eq("scope", "global").eq("active", true);
    const { error } = await supabase.from("creator_config").insert({
      scope: "global", identity: cfg.identity, mission: cfg.mission, personality: cfg.personality,
      global_instructions: cfg.global_instructions, constitutional_principles: cfg.constitutional_principles,
      reasoning_policies: cfg.reasoning_policies, response_style: cfg.response_style,
      active: true, version: nextVersion, updated_by: user?.id,
    });
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      await supabase.from("creator_audit_log").insert({
        actor: user?.id, actor_email: user?.email, action: "config_save",
        target_type: "creator_config", metadata: { version: nextVersion },
      });
      toast({ title: `Identity v${nextVersion} saved`, description: "EgreedAI will use this on the next reply." });
    }
    setSaving(false);
    refresh();
  }

  async function addSource() {
    if (!newSrc.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (newSrc.kind !== "text" && !newSrc.url.trim() && !newSrc.raw_content.trim()) {
      toast({ title: "URL or pasted content required", variant: "destructive" }); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error, data } = await supabase.from("creator_knowledge_sources").insert({
      kind: newSrc.kind, title: newSrc.title, url: newSrc.url || null,
      raw_content: newSrc.raw_content || null, schedule: newSrc.schedule,
      status: "pending", approval_state: "pending", created_by: user?.id,
    }).select().single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    await supabase.from("creator_audit_log").insert({
      actor: user?.id, actor_email: user?.email, action: "source_create",
      target_type: "knowledge_source", target_id: data.id, metadata: { kind: newSrc.kind, title: newSrc.title },
    });
    setNewSrc({ kind: "url", title: "", url: "", raw_content: "", schedule: "manual" });
    toast({ title: "Source added", description: "Approve it, then ingest." });
    refresh();
  }

  async function uploadFile(file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user?.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("creator-knowledge").upload(path, file);
    if (upErr) { toast({ title: "Upload failed", description: upErr.message, variant: "destructive" }); return; }
    const { error, data } = await supabase.from("creator_knowledge_sources").insert({
      kind: "upload", title: file.name, url: null, raw_content: null,
      config: { storage_path: path, size: file.size, mime: file.type },
      schedule: "manual", status: "pending", approval_state: "pending", created_by: user?.id,
    }).select().single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    await supabase.from("creator_audit_log").insert({
      actor: user?.id, actor_email: user?.email, action: "source_upload",
      target_type: "knowledge_source", target_id: data.id, metadata: { path, size: file.size },
    });
    toast({ title: "File uploaded", description: file.name });
    refresh();
  }

  async function setApproval(id: string, state: "approved" | "rejected") {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("creator_knowledge_sources").update({
      approval_state: state, approved_by: user?.id,
    }).eq("id", id);
    await supabase.from("creator_audit_log").insert({
      actor: user?.id, actor_email: user?.email, action: `approval_${state}`,
      target_type: "knowledge_source", target_id: id,
    });
    refresh();
  }

  async function ingest(id: string) {
    setIngestingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/creator-ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ source_id: id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Ingest failed");
      toast({ title: `Indexed v${j.version}`, description: `${j.chunks} chunks • confidence ${(j.confidence * 100).toFixed(0)}%` });
    } catch (e: any) {
      toast({ title: "Ingest failed", description: e.message, variant: "destructive" });
    }
    setIngestingId(null);
    refresh();
  }

  async function rollback(sourceId: string, targetVersion: number) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("creator_knowledge_chunks").update({ active: false }).eq("source_id", sourceId);
    await supabase.from("creator_knowledge_chunks").update({ active: true }).eq("source_id", sourceId).eq("version", targetVersion);
    await supabase.from("creator_knowledge_sources").update({ current_version: targetVersion }).eq("id", sourceId);
    await supabase.from("creator_audit_log").insert({
      actor: user?.id, actor_email: user?.email, action: "rollback",
      target_type: "knowledge_source", target_id: sourceId, metadata: { to_version: targetVersion },
    });
    toast({ title: `Rolled back to v${targetVersion}` });
    refresh();
  }

  async function deleteSource(id: string) {
    if (!confirm("Delete this source and all its chunks?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("creator_knowledge_sources").delete().eq("id", id);
    await supabase.from("creator_audit_log").insert({
      actor: user?.id, actor_email: user?.email, action: "source_delete",
      target_type: "knowledge_source", target_id: id,
    });
    refresh();
  }

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!isCreator) {
    return (
      <div className="min-h-screen grid place-items-center p-8">
        <Card className="max-w-md p-8 text-center space-y-3">
          <Shield className="w-10 h-10 mx-auto text-destructive" />
          <h1 className="text-xl font-semibold">Creator access only</h1>
          <p className="text-sm text-muted-foreground">This console is restricted to authorized EgreedAI creators.</p>
          <Button onClick={() => nav("/")} variant="outline">Back to app</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-10 bg-background/70">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-500 grid place-items-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold">EgreedAI Creator Console</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Shield className="w-3 h-3" /> {email} · super-admin
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => nav("/")}><LogOut className="w-4 h-4 mr-1" /> Exit</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="identity"><Brain className="w-4 h-4 mr-1" />Identity</TabsTrigger>
            <TabsTrigger value="knowledge"><BookOpen className="w-4 h-4 mr-1" />Brain</TabsTrigger>
            <TabsTrigger value="approvals"><CheckCircle2 className="w-4 h-4 mr-1" />Approvals</TabsTrigger>
            <TabsTrigger value="versions"><GitBranch className="w-4 h-4 mr-1" />Versions</TabsTrigger>
            <TabsTrigger value="audit"><ScrollText className="w-4 h-4 mr-1" />Audit</TabsTrigger>
          </TabsList>

          {/* IDENTITY */}
          <TabsContent value="identity">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Identity, Mission & Constitution</h2>
                  <p className="text-sm text-muted-foreground">
                    Currently active: <Badge variant="secondary">v{cfg.version}</Badge>
                  </p>
                </div>
                <Button onClick={saveConfig} disabled={saving}>
                  {saving ? "Saving…" : "Save as new version"}
                </Button>
              </div>

              {([
                ["identity", "Identity", "Who EgreedAI is (one paragraph)."],
                ["mission", "Mission", "Why EgreedAI exists and who it serves."],
                ["personality", "Personality", "Voice, tone, quirks, cultural texture."],
                ["global_instructions", "Global Instructions", "Rules applied to every response (no URLs, Kinyarwanda auto-detect, etc.)."],
                ["constitutional_principles", "Constitutional Principles", "Non-negotiables (safety, honesty, respect for African cultures)."],
                ["reasoning_policies", "Reasoning Policies", "How EgreedAI should think before answering."],
                ["response_style", "Response Style", "Formatting, length, emojis, examples."],
              ] as const).map(([key, label, hint]) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                  <Textarea
                    value={(cfg as any)[key] || ""}
                    onChange={(e) => setCfg({ ...cfg, [key]: e.target.value } as any)}
                    className="min-h-[100px] font-mono text-sm"
                  />
                </div>
              ))}
            </Card>
          </TabsContent>

          {/* KNOWLEDGE */}
          <TabsContent value="knowledge" className="space-y-6">
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Zap className="w-5 h-5 text-primary" />Add to the Knowledge Brain</h2>
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <Label>Kind</Label>
                  <Select value={newSrc.kind} onValueChange={(v) => setNewSrc({ ...newSrc, kind: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">Website URL</SelectItem>
                      <SelectItem value="doc">Documentation URL</SelectItem>
                      <SelectItem value="github">GitHub file/blob</SelectItem>
                      <SelectItem value="api">API endpoint (JSON/text)</SelectItem>
                      <SelectItem value="pdf">PDF URL</SelectItem>
                      <SelectItem value="text">Pasted text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Title</Label>
                  <Input value={newSrc.title} onChange={(e) => setNewSrc({ ...newSrc, title: e.target.value })} placeholder="e.g. Rwanda Vision 2050" />
                </div>
                <div>
                  <Label>Schedule</Label>
                  <Select value={newSrc.schedule} onValueChange={(v) => setNewSrc({ ...newSrc, schedule: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {newSrc.kind !== "text" && (
                <div>
                  <Label>URL</Label>
                  <Input value={newSrc.url} onChange={(e) => setNewSrc({ ...newSrc, url: e.target.value })} placeholder="https://…" />
                </div>
              )}
              {(newSrc.kind === "text" || newSrc.kind === "pdf") && (
                <div>
                  <Label>Pasted content (optional for PDFs when the URL isn't text-extractable)</Label>
                  <Textarea value={newSrc.raw_content} onChange={(e) => setNewSrc({ ...newSrc, raw_content: e.target.value })} className="min-h-[120px]" />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={addSource}>
                  {newSrc.kind === "url" && <Link2 className="w-4 h-4 mr-1" />}
                  {newSrc.kind === "github" && <Github className="w-4 h-4 mr-1" />}
                  {newSrc.kind === "text" && <FileText className="w-4 h-4 mr-1" />}
                  Add source
                </Button>
                <div className="text-xs text-muted-foreground">— or —</div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                  <Button variant="outline" asChild><span><Upload className="w-4 h-4 mr-1" /> Upload document</span></Button>
                </label>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-3">All sources ({sources.length})</h3>
              <div className="space-y-2">
                {sources.length === 0 && <p className="text-sm text-muted-foreground">No sources yet.</p>}
                {sources.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border/60">
                    <Badge variant="outline" className="uppercase text-[10px]">{s.kind}</Badge>
                    <div className="flex-1 min-w-[180px]">
                      <div className="font-medium text-sm">{s.title}</div>
                      {s.url && <div className="text-xs text-muted-foreground truncate max-w-[420px]">{s.url}</div>}
                    </div>
                    <StatusBadge status={s.status} />
                    <ApprovalBadge state={s.approval_state} />
                    {s.confidence != null && <Badge variant="secondary">{Math.round((s.confidence as any) * 100)}%</Badge>}
                    <Badge variant="outline">v{s.current_version}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => ingest(s.id)} disabled={ingestingId === s.id || s.approval_state !== "approved"}>
                      {ingestingId === s.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteSource(s.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* APPROVALS */}
          <TabsContent value="approvals">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-3">Approval queue</h2>
              <div className="space-y-2">
                {sources.filter((s) => s.approval_state === "pending").length === 0 && (
                  <p className="text-sm text-muted-foreground">No sources awaiting approval.</p>
                )}
                {sources.filter((s) => s.approval_state === "pending").map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                    <Badge variant="outline" className="uppercase text-[10px]">{s.kind}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{s.title}</div>
                      {s.url && <div className="text-xs text-muted-foreground truncate">{s.url}</div>}
                    </div>
                    <Button size="sm" onClick={() => setApproval(s.id, "approved")}><CheckCircle2 className="w-4 h-4 mr-1" />Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => setApproval(s.id, "rejected")}><XCircle className="w-4 h-4 mr-1" />Reject</Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* VERSIONS */}
          <TabsContent value="versions">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-3">Version history</h2>
              <div className="space-y-2">
                {versions.length === 0 && <p className="text-sm text-muted-foreground">No versions yet.</p>}
                {versions.map((v) => {
                  const src = sources.find((s) => s.id === v.source_id);
                  return (
                    <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                      <Badge variant="outline">v{v.version}</Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{src?.title || v.source_id}</div>
                        <div className="text-xs text-muted-foreground">{v.chunk_count} chunks · {new Date(v.created_at).toLocaleString()}</div>
                      </div>
                      {src && src.current_version !== v.version && (
                        <Button size="sm" variant="outline" onClick={() => rollback(v.source_id, v.version)}>
                          <GitBranch className="w-4 h-4 mr-1" /> Roll back
                        </Button>
                      )}
                      {src?.current_version === v.version && <Badge className="bg-primary">Active</Badge>}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* AUDIT */}
          <TabsContent value="audit">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-3">Audit log ({audit.length})</h2>
              <div className="space-y-1 max-h-[600px] overflow-auto">
                {audit.map((a) => (
                  <div key={a.id} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-3 py-2 rounded border border-border/40 text-sm">
                    <Badge variant="outline" className="text-[10px]">{a.action}</Badge>
                    <div className="min-w-0">
                      <div className="truncate">{a.actor_email || a.actor || "system"}</div>
                      {a.metadata && Object.keys(a.metadata).length > 0 && (
                        <div className="text-[11px] text-muted-foreground truncate">{JSON.stringify(a.metadata)}</div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</div>
                  </div>
                ))}
                {audit.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    indexing: "bg-amber-500/20 text-amber-500 border-amber-500/40",
    indexed: "bg-emerald-500/20 text-emerald-500 border-emerald-500/40",
    failed: "bg-destructive/20 text-destructive border-destructive/40",
    archived: "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={map[status] || ""}>{status}</Badge>;
}
function ApprovalBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    approved: "bg-primary/20 text-primary border-primary/40",
    rejected: "bg-destructive/20 text-destructive border-destructive/40",
  };
  return <Badge variant="outline" className={map[state] || ""}>{state}</Badge>;
}
