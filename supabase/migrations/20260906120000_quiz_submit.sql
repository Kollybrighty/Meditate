-- Kids can submit one answer per question; hosts can read enrolled child names
-- without re-entering classroom_enrollments RLS (that loop blocked create class).

CREATE UNIQUE INDEX IF NOT EXISTS quiz_responses_question_child_idx
  ON public.quiz_responses (question_id, child_profile_id);

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
