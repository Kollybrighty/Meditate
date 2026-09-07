-- Forum voice notes: private storage for group members

ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS voice_note_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('forum-voice-notes', 'forum-voice-notes', false, 5242880)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Forum voice notes select by members" ON storage.objects;
DROP POLICY IF EXISTS "Forum voice notes insert by members" ON storage.objects;
DROP POLICY IF EXISTS "Forum voice notes delete by owner" ON storage.objects;

CREATE POLICY "Forum voice notes select by members"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'forum-voice-notes'
    AND public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Forum voice notes insert by members"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'forum-voice-notes'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Forum voice notes delete by owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'forum-voice-notes'
    AND owner = auth.uid()
  );
