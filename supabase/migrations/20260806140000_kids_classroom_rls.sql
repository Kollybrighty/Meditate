-- Kids classroom RLS so hosts can create classrooms and start sessions

CREATE OR REPLACE FUNCTION public.is_classroom_host(cid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classrooms
    WHERE id = cid
      AND host_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.classroom_members
    WHERE classroom_id = cid
      AND user_id = auth.uid()
      AND role IN ('host', 'teacher')
  );
$$;

DROP POLICY IF EXISTS "Classrooms viewable by host or enrolled parent" ON classrooms;
DROP POLICY IF EXISTS "Classrooms insertable by host" ON classrooms;
DROP POLICY IF EXISTS "Classrooms updatable by host" ON classrooms;
DROP POLICY IF EXISTS "Classroom members viewable by host or self" ON classroom_members;
DROP POLICY IF EXISTS "Classroom members insertable by host or self" ON classroom_members;
DROP POLICY IF EXISTS "Kids lessons viewable by host or enrolled parent" ON kids_lessons;
DROP POLICY IF EXISTS "Kids lessons insertable by host" ON kids_lessons;
DROP POLICY IF EXISTS "Kids lessons updatable by host" ON kids_lessons;
DROP POLICY IF EXISTS "Classroom enrollments by parent or host" ON classroom_enrollments;

ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classrooms viewable by host or enrolled parent" ON classrooms
  FOR SELECT
  USING (
    host_id = auth.uid()
    OR public.is_classroom_host(id)
    OR EXISTS (
      SELECT 1
      FROM classroom_enrollments ce
      JOIN child_profiles cp ON cp.id = ce.child_profile_id
      WHERE ce.classroom_id = classrooms.id
        AND cp.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Classrooms insertable by host" ON classrooms
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Classrooms updatable by host" ON classrooms
  FOR UPDATE
  USING (public.is_classroom_host(id))
  WITH CHECK (public.is_classroom_host(id));

CREATE POLICY "Classroom members viewable by host or self" ON classroom_members
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_classroom_host(classroom_id));

CREATE POLICY "Classroom members insertable by host or self" ON classroom_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_classroom_host(classroom_id)
      OR EXISTS (
        SELECT 1 FROM public.classrooms c
        WHERE c.id = classroom_id AND c.host_id = auth.uid()
      )
    )
  );

CREATE POLICY "Kids lessons viewable by host or enrolled parent" ON kids_lessons
  FOR SELECT
  USING (
    public.is_classroom_host(classroom_id)
    OR EXISTS (
      SELECT 1
      FROM classroom_enrollments ce
      JOIN child_profiles cp ON cp.id = ce.child_profile_id
      WHERE ce.classroom_id = kids_lessons.classroom_id
        AND cp.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Kids lessons insertable by host" ON kids_lessons
  FOR INSERT
  WITH CHECK (host_id = auth.uid() AND public.is_classroom_host(classroom_id));

CREATE POLICY "Kids lessons updatable by host" ON kids_lessons
  FOR UPDATE
  USING (host_id = auth.uid() AND public.is_classroom_host(classroom_id))
  WITH CHECK (host_id = auth.uid() AND public.is_classroom_host(classroom_id));

CREATE POLICY "Classroom enrollments by parent or host" ON classroom_enrollments
  FOR ALL
  USING (
    public.is_classroom_host(classroom_id)
    OR EXISTS (
      SELECT 1 FROM child_profiles cp
      WHERE cp.id = child_profile_id
        AND cp.parent_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_classroom_host(classroom_id)
    OR EXISTS (
      SELECT 1 FROM child_profiles cp
      WHERE cp.id = child_profile_id
        AND cp.parent_user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.find_classroom_by_invite(invite text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  age_range text,
  invite_code text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT c.id, c.name, c.slug, c.age_range, c.invite_code
  FROM public.classrooms c
  WHERE c.invite_code = invite
     OR c.slug = invite
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_classroom_by_invite(text) TO authenticated;
