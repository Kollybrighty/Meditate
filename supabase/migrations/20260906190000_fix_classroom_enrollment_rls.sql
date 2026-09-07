-- Fix infinite recursion: child_profiles host policy must not SELECT
-- classroom_enrollments under RLS (enrollments already SELECT child_profiles).

CREATE OR REPLACE FUNCTION public.is_enrolled_in_hosted_classroom(child_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classroom_enrollments ce
    WHERE ce.child_profile_id = child_id
      AND public.is_classroom_host(ce.classroom_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_enrolled_in_hosted_classroom(uuid) TO authenticated;

DROP POLICY IF EXISTS "Child profiles viewable by classroom host" ON child_profiles;
CREATE POLICY "Child profiles viewable by classroom host"
  ON child_profiles
  FOR SELECT
  USING (public.is_enrolled_in_hosted_classroom(id));
