
DROP POLICY IF EXISTS "creator_read_storage" ON storage.objects;
CREATE POLICY "creator_read_storage" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'creator-knowledge' AND public.is_creator(auth.uid()));
DROP POLICY IF EXISTS "creator_write_storage" ON storage.objects;
CREATE POLICY "creator_write_storage" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'creator-knowledge' AND public.is_creator(auth.uid()));
DROP POLICY IF EXISTS "creator_update_storage" ON storage.objects;
CREATE POLICY "creator_update_storage" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'creator-knowledge' AND public.is_creator(auth.uid()));
DROP POLICY IF EXISTS "creator_delete_storage" ON storage.objects;
CREATE POLICY "creator_delete_storage" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'creator-knowledge' AND public.is_creator(auth.uid()));
