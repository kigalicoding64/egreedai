
-- Knowledge documents table for RAG
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own knowledge" ON public.knowledge_documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own knowledge" ON public.knowledge_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own knowledge" ON public.knowledge_documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own knowledge" ON public.knowledge_documents
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX knowledge_documents_user_id_idx ON public.knowledge_documents(user_id);
CREATE INDEX knowledge_documents_fts_idx ON public.knowledge_documents
  USING GIN (to_tsvector('english', title || ' ' || content));

CREATE TRIGGER update_knowledge_documents_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for source files
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-files', 'knowledge-files', false);

CREATE POLICY "Users view own knowledge files" ON storage.objects
  FOR SELECT USING (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own knowledge files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own knowledge files" ON storage.objects
  FOR DELETE USING (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);
