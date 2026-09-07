-- Adult groups: join by invite, read fellow profiles, and lock study tables behind membership.

CREATE OR REPLACE FUNCTION public.find_group_by_invite(invite text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  reading_scope text,
  plan_type text,
  start_date date
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT g.id, g.name, g.slug, g.reading_scope, g.plan_type, g.start_date
  FROM public.groups g
  WHERE g.invite_code = invite
     OR g.slug = invite
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_group_by_invite(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.join_group_by_invite(invite text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g public.groups%ROWTYPE;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO g
  FROM public.groups
  WHERE groups.invite_code = invite
     OR groups.slug = invite
  LIMIT 1;

  IF g.id IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (g.id, uid, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN QUERY SELECT g.id, g.name, g.slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_group_by_invite(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.shares_group_with(other uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members a
    JOIN public.group_members b ON a.group_id = b.group_id
    WHERE a.user_id = auth.uid()
      AND b.user_id = other
  );
$$;

GRANT EXECUTE ON FUNCTION public.shares_group_with(uuid) TO authenticated;

DROP POLICY IF EXISTS "Profiles viewable by owner" ON profiles;
DROP POLICY IF EXISTS "Profiles viewable by owner or fellow members" ON profiles;

CREATE POLICY "Profiles viewable by owner or fellow members" ON profiles
  FOR SELECT
  USING (auth.uid() = id OR public.shares_group_with(id));

ALTER TABLE public.daily_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Assignments viewable by members" ON daily_assignments;
DROP POLICY IF EXISTS "Assignments writable by owners" ON daily_assignments;
CREATE POLICY "Assignments viewable by members" ON daily_assignments
  FOR SELECT
  USING (public.is_group_member(group_id));
CREATE POLICY "Assignments writable by owners" ON daily_assignments
  FOR ALL
  USING (public.is_group_owner(group_id))
  WITH CHECK (public.is_group_owner(group_id));

DROP POLICY IF EXISTS "Progress viewable by members" ON reading_progress;
DROP POLICY IF EXISTS "Progress insertable by self" ON reading_progress;
DROP POLICY IF EXISTS "Progress deletable by self" ON reading_progress;
CREATE POLICY "Progress viewable by members" ON reading_progress
  FOR SELECT
  USING (public.is_group_member(group_id));
CREATE POLICY "Progress insertable by self" ON reading_progress
  FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_group_member(group_id));
CREATE POLICY "Progress deletable by self" ON reading_progress
  FOR DELETE
  USING (user_id = auth.uid() AND public.is_group_member(group_id));

DROP POLICY IF EXISTS "Posts viewable by members" ON forum_posts;
DROP POLICY IF EXISTS "Posts insertable by members" ON forum_posts;
DROP POLICY IF EXISTS "Posts deletable by author or owner" ON forum_posts;
CREATE POLICY "Posts viewable by members" ON forum_posts
  FOR SELECT
  USING (public.is_group_member(group_id));
CREATE POLICY "Posts insertable by members" ON forum_posts
  FOR INSERT
  WITH CHECK (author_id = auth.uid() AND public.is_group_member(group_id));
CREATE POLICY "Posts deletable by author or owner" ON forum_posts
  FOR DELETE
  USING (author_id = auth.uid() OR public.is_group_owner(group_id));

DROP POLICY IF EXISTS "Replies viewable by members" ON forum_replies;
DROP POLICY IF EXISTS "Replies insertable by members" ON forum_replies;
DROP POLICY IF EXISTS "Replies deletable by author" ON forum_replies;
CREATE POLICY "Replies viewable by members" ON forum_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_posts p
      WHERE p.id = post_id AND public.is_group_member(p.group_id)
    )
  );
CREATE POLICY "Replies insertable by members" ON forum_replies
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.forum_posts p
      WHERE p.id = post_id AND public.is_group_member(p.group_id)
    )
  );
CREATE POLICY "Replies deletable by author" ON forum_replies
  FOR DELETE
  USING (author_id = auth.uid());
