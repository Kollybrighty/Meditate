-- Allow admins to set/edit reading plan start date; fix group update RLS

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS start_date DATE;

CREATE OR REPLACE FUNCTION public.is_group_owner(gid uuid)
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
      AND role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = gid
      AND created_by = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Groups updatable by owner" ON groups;

CREATE POLICY "Groups updatable by owner" ON groups
  FOR UPDATE
  USING (public.is_group_owner(id))
  WITH CHECK (public.is_group_owner(id));
