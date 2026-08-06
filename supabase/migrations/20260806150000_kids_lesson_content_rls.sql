-- Kids lesson content RLS: characters, materials, board, quizzes

ALTER TABLE public.bible_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_quiz_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_material_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bible characters readable" ON bible_characters;
DROP POLICY IF EXISTS "Quiz pool readable" ON character_quiz_pool;
DROP POLICY IF EXISTS "Lesson materials by host or enrolled" ON lesson_materials;
DROP POLICY IF EXISTS "Lesson material links by host or enrolled" ON lesson_material_links;
DROP POLICY IF EXISTS "Board contributions by lesson access" ON board_contributions;
DROP POLICY IF EXISTS "Lesson quizzes by lesson access" ON lesson_quizzes;
DROP POLICY IF EXISTS "Quiz questions by lesson access" ON quiz_questions;
DROP POLICY IF EXISTS "Quiz responses by parent or host" ON quiz_responses;

CREATE POLICY "Bible characters readable" ON bible_characters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Quiz pool readable" ON character_quiz_pool
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lesson materials by host or enrolled" ON lesson_materials
  FOR SELECT
  USING (
    public.is_classroom_host(classroom_id)
    OR EXISTS (
      SELECT 1
      FROM classroom_enrollments ce
      JOIN child_profiles cp ON cp.id = ce.child_profile_id
      WHERE ce.classroom_id = lesson_materials.classroom_id
        AND cp.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Lesson materials insertable by host" ON lesson_materials
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND public.is_classroom_host(classroom_id)
  );

CREATE POLICY "Lesson materials deletable by host" ON lesson_materials
  FOR DELETE
  USING (public.is_classroom_host(classroom_id));

CREATE POLICY "Lesson material links by host or enrolled" ON lesson_material_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM kids_lessons kl
      WHERE kl.id = lesson_id
        AND (
          public.is_classroom_host(kl.classroom_id)
          OR EXISTS (
            SELECT 1
            FROM classroom_enrollments ce
            JOIN child_profiles cp ON cp.id = ce.child_profile_id
            WHERE ce.classroom_id = kl.classroom_id
              AND cp.parent_user_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kids_lessons kl
      WHERE kl.id = lesson_id
        AND public.is_classroom_host(kl.classroom_id)
    )
  );

CREATE POLICY "Board contributions by lesson access" ON board_contributions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kids_lessons kl
      WHERE kl.id = lesson_id
        AND (
          public.is_classroom_host(kl.classroom_id)
          OR EXISTS (
            SELECT 1
            FROM classroom_enrollments ce
            JOIN child_profiles cp ON cp.id = ce.child_profile_id
            WHERE ce.classroom_id = kl.classroom_id
              AND cp.parent_user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Board contributions insertable" ON board_contributions
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM kids_lessons kl
      WHERE kl.id = lesson_id
        AND (
          public.is_classroom_host(kl.classroom_id)
          OR EXISTS (
            SELECT 1
            FROM classroom_enrollments ce
            JOIN child_profiles cp ON cp.id = ce.child_profile_id
            WHERE ce.classroom_id = kl.classroom_id
              AND cp.parent_user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Lesson quizzes by lesson access" ON lesson_quizzes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM kids_lessons kl
      WHERE kl.id = lesson_id
        AND (
          public.is_classroom_host(kl.classroom_id)
          OR EXISTS (
            SELECT 1
            FROM classroom_enrollments ce
            JOIN child_profiles cp ON cp.id = ce.child_profile_id
            WHERE ce.classroom_id = kl.classroom_id
              AND cp.parent_user_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM kids_lessons kl
      WHERE kl.id = lesson_id
        AND public.is_classroom_host(kl.classroom_id)
    )
  );

CREATE POLICY "Quiz questions by lesson access" ON quiz_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM lesson_quizzes lq
      JOIN kids_lessons kl ON kl.id = lq.lesson_id
      WHERE lq.id = quiz_id
        AND (
          public.is_classroom_host(kl.classroom_id)
          OR EXISTS (
            SELECT 1
            FROM classroom_enrollments ce
            JOIN child_profiles cp ON cp.id = ce.child_profile_id
            WHERE ce.classroom_id = kl.classroom_id
              AND cp.parent_user_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM lesson_quizzes lq
      JOIN kids_lessons kl ON kl.id = lq.lesson_id
      WHERE lq.id = quiz_id
        AND public.is_classroom_host(kl.classroom_id)
    )
  );

CREATE POLICY "Quiz responses by parent or host" ON quiz_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM child_profiles cp
      WHERE cp.id = child_profile_id AND cp.parent_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM quiz_questions qq
      JOIN lesson_quizzes lq ON lq.id = qq.quiz_id
      JOIN kids_lessons kl ON kl.id = lq.lesson_id
      WHERE qq.id = question_id
        AND public.is_classroom_host(kl.classroom_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM child_profiles cp
      WHERE cp.id = child_profile_id AND cp.parent_user_id = auth.uid()
    )
  );

-- Storage bucket for teacher uploads (public read of objects via signed/public URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kids-materials', 'kids-materials', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Kids materials public read" ON storage.objects;
DROP POLICY IF EXISTS "Kids materials host upload" ON storage.objects;
DROP POLICY IF EXISTS "Kids materials host delete" ON storage.objects;

CREATE POLICY "Kids materials public read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'kids-materials');

CREATE POLICY "Kids materials host upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kids-materials');

CREATE POLICY "Kids materials host delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'kids-materials' AND owner = auth.uid());
