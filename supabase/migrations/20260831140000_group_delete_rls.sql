-- Allow group owners/admins to delete a group they created.

DROP POLICY IF EXISTS "Groups deletable by owner" ON groups;

CREATE POLICY "Groups deletable by owner" ON groups
  FOR DELETE
  USING (public.is_group_owner(id));

CREATE OR REPLACE FUNCTION public.delete_owned_group(gid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_group_owner(gid) THEN
    RAISE EXCEPTION 'Only a group admin can delete this group';
  END IF;

  DELETE FROM public.groups WHERE id = gid;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_owned_group(uuid) TO authenticated;
