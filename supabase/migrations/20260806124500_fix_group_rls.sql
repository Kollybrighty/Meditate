-- Fix infinite recursion in group_members RLS + allow group creation

CREATE OR REPLACE FUNCTION public.is_group_member(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = gid
      AND user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Groups viewable by members" ON groups;
DROP POLICY IF EXISTS "Groups insertable by creator" ON groups;
DROP POLICY IF EXISTS "Group members viewable by members" ON group_members;
DROP POLICY IF EXISTS "Group members insertable by self" ON group_members;

CREATE POLICY "Groups viewable by members" ON groups
  FOR SELECT
  USING (created_by = auth.uid() OR public.is_group_member(id));

CREATE POLICY "Groups insertable by creator" ON groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group members viewable by members" ON group_members
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_group_member(group_id));

CREATE POLICY "Group members insertable by self" ON group_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_group_member(group_id)
      OR EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_id AND g.created_by = auth.uid()
      )
    )
  );
