
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','creator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_roles" ON public.user_roles;
CREATE POLICY "users_read_own_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_super_admin_email(_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(coalesce(_email,'')) IN ('egreedtechnology@gmail.com');
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_creator(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text; BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  IF public.is_super_admin_email(_email) THEN RETURN true; END IF;
  RETURN public.has_role(_user_id,'creator') OR public.has_role(_user_id,'admin');
END $$;

CREATE OR REPLACE FUNCTION public.grant_super_admin_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_super_admin_email(NEW.email) THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id,'admin')
      ON CONFLICT (user_id,role) DO NOTHING;
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id,'creator')
      ON CONFLICT (user_id,role) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_super_admin_role();

INSERT INTO public.user_roles(user_id, role)
SELECT u.id, 'admin'::public.app_role FROM auth.users u
WHERE public.is_super_admin_email(u.email) ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles(user_id, role)
SELECT u.id, 'creator'::public.app_role FROM auth.users u
WHERE public.is_super_admin_email(u.email) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.creator_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'global',
  identity text DEFAULT '',
  mission text DEFAULT '',
  personality text DEFAULT '',
  global_instructions text DEFAULT '',
  constitutional_principles text DEFAULT '',
  reasoning_policies text DEFAULT '',
  response_style text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  version int NOT NULL DEFAULT 1,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scope, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_config TO authenticated;
GRANT ALL ON public.creator_config TO service_role;
ALTER TABLE public.creator_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creators_read_config" ON public.creator_config FOR SELECT TO authenticated USING (public.is_creator(auth.uid()));
CREATE POLICY "creators_insert_config" ON public.creator_config FOR INSERT TO authenticated WITH CHECK (public.is_creator(auth.uid()));
CREATE POLICY "creators_update_config" ON public.creator_config FOR UPDATE TO authenticated USING (public.is_creator(auth.uid()));
CREATE POLICY "creators_delete_config" ON public.creator_config FOR DELETE TO authenticated USING (public.is_creator(auth.uid()));

INSERT INTO public.creator_config (scope, identity, mission, personality, global_instructions, constitutional_principles, reasoning_policies, response_style, active, version)
SELECT 'global',
  'EgreedAI — an Africa-first AI assistant built and owned by Egreed Technology.',
  'Empower Africans (especially Rwandans) with practical, friendly, and trustworthy AI.',
  'Warm, personal, practical, humble; speaks English, French, Kinyarwanda naturally.',
  'Never expose sources, URLs, or citation lists. Detect Kinyarwanda automatically and reply in Kinyarwanda when the user writes in it.',
  'Be honest, safe, respectful of African cultures, protect user privacy, refuse harmful requests.',
  'Think carefully before answering hard tasks; prefer clarity over verbosity.',
  'Friendly, concise, no citations, no URLs, no "Source:" markers.',
  true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.creator_config);

CREATE TABLE IF NOT EXISTS public.creator_knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'global',
  scope_ref uuid,
  kind text NOT NULL,
  title text NOT NULL,
  url text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_content text,
  status text NOT NULL DEFAULT 'pending',
  approval_state text NOT NULL DEFAULT 'pending',
  confidence numeric(4,3) DEFAULT 0.000,
  schedule text,
  last_ingested_at timestamptz,
  current_version int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_knowledge_sources TO authenticated;
GRANT ALL ON public.creator_knowledge_sources TO service_role;
ALTER TABLE public.creator_knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cks_r" ON public.creator_knowledge_sources FOR SELECT TO authenticated USING (public.is_creator(auth.uid()));
CREATE POLICY "cks_i" ON public.creator_knowledge_sources FOR INSERT TO authenticated WITH CHECK (public.is_creator(auth.uid()));
CREATE POLICY "cks_u" ON public.creator_knowledge_sources FOR UPDATE TO authenticated USING (public.is_creator(auth.uid()));
CREATE POLICY "cks_d" ON public.creator_knowledge_sources FOR DELETE TO authenticated USING (public.is_creator(auth.uid()));

CREATE TABLE IF NOT EXISTS public.creator_knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.creator_knowledge_sources(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  chunk_index int NOT NULL,
  content text NOT NULL,
  tokens int,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_knowledge_chunks TO authenticated;
GRANT ALL ON public.creator_knowledge_chunks TO service_role;
ALTER TABLE public.creator_knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ckc_r" ON public.creator_knowledge_chunks FOR SELECT TO authenticated USING (public.is_creator(auth.uid()));
CREATE POLICY "ckc_i" ON public.creator_knowledge_chunks FOR INSERT TO authenticated WITH CHECK (public.is_creator(auth.uid()));
CREATE POLICY "ckc_u" ON public.creator_knowledge_chunks FOR UPDATE TO authenticated USING (public.is_creator(auth.uid()));
CREATE POLICY "ckc_d" ON public.creator_knowledge_chunks FOR DELETE TO authenticated USING (public.is_creator(auth.uid()));

CREATE INDEX IF NOT EXISTS ckc_embed_idx ON public.creator_knowledge_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS ckc_source_idx ON public.creator_knowledge_chunks(source_id, active);

CREATE TABLE IF NOT EXISTS public.creator_knowledge_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.creator_knowledge_sources(id) ON DELETE CASCADE,
  version int NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  chunk_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_knowledge_versions TO authenticated;
GRANT ALL ON public.creator_knowledge_versions TO service_role;
ALTER TABLE public.creator_knowledge_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ckv_r" ON public.creator_knowledge_versions FOR SELECT TO authenticated USING (public.is_creator(auth.uid()));
CREATE POLICY "ckv_i" ON public.creator_knowledge_versions FOR INSERT TO authenticated WITH CHECK (public.is_creator(auth.uid()));
CREATE POLICY "ckv_u" ON public.creator_knowledge_versions FOR UPDATE TO authenticated USING (public.is_creator(auth.uid()));

CREATE TABLE IF NOT EXISTS public.creator_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid REFERENCES auth.users(id),
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.creator_audit_log TO authenticated;
GRANT ALL ON public.creator_audit_log TO service_role;
ALTER TABLE public.creator_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cal_r" ON public.creator_audit_log FOR SELECT TO authenticated USING (public.is_creator(auth.uid()));
CREATE POLICY "cal_i" ON public.creator_audit_log FOR INSERT TO authenticated WITH CHECK (public.is_creator(auth.uid()));

CREATE OR REPLACE FUNCTION public.match_creator_knowledge(
  query_embedding vector(1536),
  match_count int DEFAULT 6,
  min_similarity float DEFAULT 0.2
)
RETURNS TABLE(id uuid, source_id uuid, content text, similarity float, source_title text, source_kind text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.source_id, c.content,
         1 - (c.embedding <=> query_embedding) AS similarity,
         s.title, s.kind
  FROM public.creator_knowledge_chunks c
  JOIN public.creator_knowledge_sources s ON s.id = c.source_id
  WHERE c.active AND s.status = 'indexed' AND s.approval_state = 'approved'
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) >= min_similarity
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count
$$;

DROP TRIGGER IF EXISTS trg_cc_updated ON public.creator_config;
CREATE TRIGGER trg_cc_updated BEFORE UPDATE ON public.creator_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_cks_updated ON public.creator_knowledge_sources;
CREATE TRIGGER trg_cks_updated BEFORE UPDATE ON public.creator_knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
