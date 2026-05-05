import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trash2, Upload, BookOpen, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Doc {
  id: string;
  title: string;
  content: string;
  source_url: string | null;
  created_at: string;
}

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    load();
  }, [isAuthenticated]);

  const load = async () => {
    const { data } = await supabase
      .from("knowledge_documents")
      .select("id,title,content,source_url,created_at")
      .order("created_at", { ascending: false });
    setDocs(data || []);
  };

  const addDoc = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase.from("knowledge_documents").insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      source_url: url.trim() || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setTitle(""); setContent(""); setUrl("");
    toast.success("Added to EgreedAI knowledge base");
    load();
  };

  const importFromUrl = async () => {
    if (!url.trim()) return toast.error("Enter a URL first");
    setCrawling(true);
    try {
      // Use a free CORS-friendly text extractor (Jina Reader)
      const res = await fetch(`https://r.jina.ai/${url.trim()}`);
      const text = await res.text();
      if (!text || text.length < 50) throw new Error("No content extracted");
      const firstLine = text.split("\n").find((l) => l.trim().length > 5)?.slice(0, 80) || url;
      setTitle(firstLine);
      setContent(text.slice(0, 50000));
      toast.success("Content imported — review and click Add");
    } catch (e) {
      toast.error("Failed to fetch URL");
    } finally {
      setCrawling(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setTitle(file.name);
    setContent(text.slice(0, 50000));
  };

  const remove = async (id: string) => {
    await supabase.from("knowledge_documents").delete().eq("id", id);
    toast.success("Removed");
    load();
  };

  return (
    <div className="min-h-screen bg-background gradient-bg p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              EgreedAI Knowledge Base
            </h1>
            <p className="text-sm text-muted-foreground">
              Train your AI with your own documents — answers will be grounded in your data.
            </p>
          </div>
        </div>

        <Card className="p-5 mb-6 space-y-3 glass">
          <h2 className="font-medium">Add new document</h2>
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Import from URL (optional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button variant="secondary" onClick={importFromUrl} disabled={crawling}>
              {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              <span className="ml-2 hidden sm:inline">Fetch</span>
            </Button>
          </div>
          <div className="flex gap-2">
            <label className="flex-1">
              <input type="file" accept=".txt,.md,.json,.csv" className="hidden" onChange={handleFile} />
              <Button variant="outline" className="w-full pointer-events-none">
                <Upload className="w-4 h-4 mr-2" /> Upload .txt / .md / .json
              </Button>
            </label>
          </div>
          <Textarea
            placeholder="Paste content, notes, documentation, or any text EgreedAI should learn from..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />
          <Button onClick={addDoc} disabled={loading || !title || !content} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Knowledge Base"}
          </Button>
        </Card>

        <div className="space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground">
            Your documents ({docs.length})
          </h2>
          {docs.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No documents yet.</p>
          )}
          {docs.map((d) => (
            <Card key={d.id} className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{d.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {d.content.slice(0, 200)}
                </p>
                {d.source_url && (
                  <a href={d.source_url} target="_blank" rel="noreferrer"
                     className="text-xs text-primary hover:underline mt-1 inline-block">
                    {d.source_url}
                  </a>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(d.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
