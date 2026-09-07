-- Kids live session: lobby alerts, raised hands, co-teachers, board share, quiz grading

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS notifications_classroom_id_idx
  ON public.notifications (classroom_id);

CREATE OR REPLACE FUNCTION public.is_classroom_owner(cid uuid)
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
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_classroom_owner(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_classroom_staff(
  p_classroom_id uuid,
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
  IF NOT (
    public.is_classroom_host(p_classroom_id)
    OR EXISTS (
      SELECT 1
      FROM public.session_lobby sl
      JOIN public.child_profiles cp ON cp.id = sl.child_profile_id
      WHERE sl.classroom_id = p_classroom_id
        AND cp.parent_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.classroom_enrollments ce
      JOIN public.child_profiles cp ON cp.id = ce.child_profile_id
      WHERE ce.classroom_id = p_classroom_id
        AND cp.parent_user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  INSERT INTO public.notifications (user_id, classroom_id, type, reference_id)
  SELECT DISTINCT staff.user_id, p_classroom_id, p_type, p_reference_id
  FROM (
    SELECT c.host_id AS user_id
    FROM public.classrooms c
    WHERE c.id = p_classroom_id
    UNION
    SELECT cm.user_id
    FROM public.classroom_members cm
    WHERE cm.classroom_id = p_classroom_id
      AND cm.role IN ('host', 'teacher')
  ) staff
  WHERE staff.user_id <> auth.uid();

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_classroom_staff(uuid, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_classroom_user(
  p_classroom_id uuid,
  p_user_id uuid,
  p_type text,
  p_reference_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_classroom_owner(p_classroom_id) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF p_user_id = auth.uid() THEN
    RETURN 0;
  END IF;

  INSERT INTO public.notifications (user_id, classroom_id, type, reference_id)
  VALUES (p_user_id, p_classroom_id, p_type, p_reference_id);
  RETURN 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_classroom_user(uuid, uuid, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.find_user_id_by_handle(handle text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.id
  FROM public.profiles p
  WHERE lower(p.email) = lower(trim(handle))
     OR lower(p.username) = lower(trim(handle))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_user_id_by_handle(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_classroom_teachers(cid uuid)
RETURNS TABLE (
  user_id uuid,
  role text,
  full_name text,
  username text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT cm.user_id, cm.role, p.full_name, p.username
  FROM public.classroom_members cm
  JOIN public.profiles p ON p.id = cm.user_id
  WHERE cm.classroom_id = cid
    AND public.is_classroom_host(cid);
$$;

GRANT EXECUTE ON FUNCTION public.list_classroom_teachers(uuid) TO authenticated;

DROP POLICY IF EXISTS "Kids lessons updatable by host" ON kids_lessons;
CREATE POLICY "Kids lessons updatable by host" ON kids_lessons
  FOR UPDATE
  USING (public.is_classroom_host(classroom_id))
  WITH CHECK (public.is_classroom_host(classroom_id));

DROP POLICY IF EXISTS "Classroom members insertable by host or self" ON classroom_members;
DROP POLICY IF EXISTS "Classroom members insertable by host" ON classroom_members;
CREATE POLICY "Classroom members insertable by host" ON classroom_members
  FOR INSERT
  WITH CHECK (
    public.is_classroom_owner(classroom_id)
    OR (
      user_id = auth.uid()
      AND public.is_classroom_owner(classroom_id)
    )
  );

DROP POLICY IF EXISTS "Classroom members deletable by owner" ON classroom_members;
CREATE POLICY "Classroom members deletable by owner" ON classroom_members
  FOR DELETE
  USING (
    public.is_classroom_owner(classroom_id)
    AND user_id <> (
      SELECT c.host_id FROM public.classrooms c WHERE c.id = classroom_id
    )
  );

ALTER TABLE public.raised_hands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Raised hands readable" ON raised_hands;
DROP POLICY IF EXISTS "Raised hands insertable by parent" ON raised_hands;
DROP POLICY IF EXISTS "Raised hands updatable by parent or host" ON raised_hands;

CREATE POLICY "Raised hands readable" ON raised_hands
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.kids_lessons kl
      WHERE kl.id = lesson_id
        AND (
          public.is_classroom_host(kl.classroom_id)
          OR EXISTS (
            SELECT 1 FROM public.child_profiles cp
            WHERE cp.id = raised_hands.child_profile_id
              AND cp.parent_user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Raised hands insertable by parent" ON raised_hands
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = child_profile_id
        AND cp.parent_user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.session_lobby sl
      WHERE sl.lesson_id = raised_hands.lesson_id
        AND sl.child_profile_id = raised_hands.child_profile_id
        AND sl.status = 'admitted'
    )
  );

CREATE POLICY "Raised hands updatable by parent or host" ON raised_hands
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.kids_lessons kl
      WHERE kl.id = lesson_id
        AND (
          public.is_classroom_host(kl.classroom_id)
          OR EXISTS (
            SELECT 1 FROM public.child_profiles cp
            WHERE cp.id = raised_hands.child_profile_id
              AND cp.parent_user_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kids_lessons kl
      WHERE kl.id = lesson_id
        AND (
          public.is_classroom_host(kl.classroom_id)
          OR EXISTS (
            SELECT 1 FROM public.child_profiles cp
            WHERE cp.id = raised_hands.child_profile_id
              AND cp.parent_user_id = auth.uid()
          )
        )
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS raised_hands_active_idx
  ON public.raised_hands (lesson_id, child_profile_id)
  WHERE status IN ('raised', 'called_on');

DROP POLICY IF EXISTS "Board contributions by lesson access" ON board_contributions;
CREATE POLICY "Board contributions by lesson access" ON board_contributions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.kids_lessons kl
      WHERE kl.id = lesson_id
        AND (
          public.is_classroom_host(kl.classroom_id)
          OR (
            (
              visibility = 'class'
              OR author_id = auth.uid()
            )
            AND EXISTS (
              SELECT 1
              FROM public.classroom_enrollments ce
              JOIN public.child_profiles cp ON cp.id = ce.child_profile_id
              WHERE ce.classroom_id = kl.classroom_id
                AND cp.parent_user_id = auth.uid()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Board contributions updatable by host" ON board_contributions;
CREATE POLICY "Board contributions updatable by host" ON board_contributions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.kids_lessons kl
      WHERE kl.id = lesson_id
        AND public.is_classroom_host(kl.classroom_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kids_lessons kl
      WHERE kl.id = lesson_id
        AND public.is_classroom_host(kl.classroom_id)
    )
  );

DROP POLICY IF EXISTS "Quiz responses by parent or host" ON quiz_responses;
DROP POLICY IF EXISTS "Quiz responses readable by parent or host" ON quiz_responses;
DROP POLICY IF EXISTS "Quiz responses insertable by parent" ON quiz_responses;
DROP POLICY IF EXISTS "Quiz responses updatable by parent or host" ON quiz_responses;

CREATE POLICY "Quiz responses readable by parent or host" ON quiz_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = child_profile_id AND cp.parent_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.quiz_questions qq
      JOIN public.lesson_quizzes lq ON lq.id = qq.quiz_id
      JOIN public.kids_lessons kl ON kl.id = lq.lesson_id
      WHERE qq.id = question_id
        AND public.is_classroom_host(kl.classroom_id)
    )
  );

CREATE POLICY "Quiz responses insertable by parent" ON quiz_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = child_profile_id AND cp.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Quiz responses updatable by parent or host" ON quiz_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = child_profile_id AND cp.parent_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.quiz_questions qq
      JOIN public.lesson_quizzes lq ON lq.id = qq.quiz_id
      JOIN public.kids_lessons kl ON kl.id = lq.lesson_id
      WHERE qq.id = question_id
        AND public.is_classroom_host(kl.classroom_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = child_profile_id AND cp.parent_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.quiz_questions qq
      JOIN public.lesson_quizzes lq ON lq.id = qq.quiz_id
      JOIN public.kids_lessons kl ON kl.id = lq.lesson_id
      WHERE qq.id = question_id
        AND public.is_classroom_host(kl.classroom_id)
    )
  );

ALTER TABLE public.session_lobby REPLICA IDENTITY FULL;
ALTER TABLE public.raised_hands REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_lobby;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.raised_hands;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
