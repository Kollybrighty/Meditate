-- Notifications, verse marks, and group member management

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verse_marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications viewable by owner" ON notifications;
DROP POLICY IF EXISTS "Notifications updatable by owner" ON notifications;
CREATE POLICY "Notifications viewable by owner" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Notifications updatable by owner" ON notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Verse marks by owner" ON verse_marks;
DROP POLICY IF EXISTS "Verse marks insert by owner" ON verse_marks;
DROP POLICY IF EXISTS "Verse marks update by owner" ON verse_marks;
DROP POLICY IF EXISTS "Verse marks delete by owner" ON verse_marks;
CREATE POLICY "Verse marks by owner" ON verse_marks
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Verse marks insert by owner" ON verse_marks
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Verse marks update by owner" ON verse_marks
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Verse marks delete by owner" ON verse_marks
  FOR DELETE USING (user_id = auth.uid());

DELETE FROM public.verse_marks a
USING public.verse_marks b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.version = b.version
  AND a.book = b.book
  AND a.chapter = b.chapter
  AND a.verse = b.verse;

CREATE UNIQUE INDEX IF NOT EXISTS verse_marks_user_passage
  ON public.verse_marks (user_id, version, book, chapter, verse);

CREATE OR REPLACE FUNCTION public.notify_group_members(
  p_group_id uuid,
  p_type text,
  p_reference_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'Not a group member';
  END IF;

  INSERT INTO public.notifications (user_id, group_id, type, reference_id)
  SELECT gm.user_id, p_group_id, p_type, p_reference_id
  FROM public.group_members gm
  WHERE gm.group_id = p_group_id
    AND gm.user_id <> auth.uid();

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_group_members(uuid, text, uuid) TO authenticated;

DROP POLICY IF EXISTS "Members can leave group" ON group_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON group_members;

CREATE POLICY "Members can leave group" ON group_members
  FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update member roles" ON group_members
  FOR UPDATE
  USING (public.is_group_owner(group_id))
  WITH CHECK (public.is_group_owner(group_id));

CREATE POLICY "Admins can remove members" ON group_members
  FOR DELETE
  USING (public.is_group_owner(group_id) AND user_id <> auth.uid());
