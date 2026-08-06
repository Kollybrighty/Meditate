-- Meditate core schema

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  church TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups (adult Bible study)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  reading_scope TEXT NOT NULL CHECK (reading_scope IN ('full_bible', 'old_testament', 'new_testament', 'chronological')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('3m', '6m', '12m', 'yearly')),
  start_date DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  invite_code TEXT UNIQUE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS daily_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  assignment_date DATE NOT NULL,
  books TEXT[] NOT NULL,
  chapters JSONB NOT NULL,
  memory_verse_ref TEXT,
  memory_verse_text TEXT,
  UNIQUE (group_id, assignment_date)
);

CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, group_id, progress_date)
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('question', 'admin_report')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT,
  voice_note_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verse_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  mark_type TEXT NOT NULL CHECK (mark_type IN ('underline', 'highlight')),
  color TEXT DEFAULT '#F59E0B',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  reference_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kids section
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  age INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  age_range TEXT,
  host_id UUID NOT NULL REFERENCES profiles(id),
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classroom_enrollments (
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (classroom_id, child_profile_id)
);

CREATE TABLE IF NOT EXISTS classroom_members (
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host', 'teacher')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (classroom_id, user_id)
);

CREATE TABLE IF NOT EXISTS bible_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  testament TEXT NOT NULL CHECK (testament IN ('old', 'new')),
  personality_traits JSONB NOT NULL DEFAULT '[]',
  key_scriptures JSONB NOT NULL DEFAULT '[]',
  story_summary TEXT NOT NULL,
  life_application_template TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS character_quiz_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES bible_characters(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB,
  correct_answer TEXT,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lesson_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image', 'docx')),
  file_size INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kids_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  character_id UUID REFERENCES bible_characters(id),
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('character', 'custom', 'combined')),
  title TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lesson_material_links (
  lesson_id UUID REFERENCES kids_lessons(id) ON DELETE CASCADE,
  material_id UUID REFERENCES lesson_materials(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, material_id)
);

CREATE TABLE IF NOT EXISTS session_lobby (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES kids_lessons(id),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'admitted', 'left')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  admitted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS board_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES kids_lessons(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  child_profile_id UUID REFERENCES child_profiles(id),
  body TEXT NOT NULL,
  is_teacher BOOLEAN DEFAULT FALSE,
  visibility TEXT NOT NULL DEFAULT 'teacher_only' CHECK (visibility IN ('teacher_only', 'class')),
  is_pinned BOOLEAN DEFAULT FALSE,
  shared_by_teacher BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raised_hands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES kids_lessons(id) ON DELETE CASCADE,
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'raised' CHECK (status IN ('raised', 'called_on', 'dismissed', 'lowered')),
  raised_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  dismissed_by TEXT CHECK (dismissed_by IN ('student', 'teacher'))
);

CREATE TABLE IF NOT EXISTS lesson_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES kids_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quiz_source TEXT NOT NULL CHECK (quiz_source IN ('auto_pool', 'teacher_custom', 'hybrid')),
  character_id UUID REFERENCES bible_characters(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  launched_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES lesson_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB,
  correct_answer TEXT,
  source TEXT NOT NULL CHECK (source IN ('pool', 'teacher_custom')),
  pool_question_id UUID REFERENCES character_quiz_pool(id)
);

CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN,
  teacher_grade TEXT CHECK (teacher_grade IN ('correct', 'partial', 'incorrect')),
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, church)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
    ),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'User'),
    NEW.raw_user_meta_data->>'church'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles viewable by owner" ON profiles;
DROP POLICY IF EXISTS "Profiles updatable by owner" ON profiles;
DROP POLICY IF EXISTS "Groups viewable by members" ON groups;
DROP POLICY IF EXISTS "Group members viewable by members" ON group_members;
DROP POLICY IF EXISTS "Child profiles by parent" ON child_profiles;
DROP POLICY IF EXISTS "Classrooms viewable by host or enrolled parent" ON classrooms;

CREATE POLICY "Profiles viewable by owner" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner" ON profiles FOR UPDATE USING (auth.uid() = id);

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

CREATE POLICY "Groups viewable by members" ON groups
  FOR SELECT
  USING (created_by = auth.uid() OR public.is_group_member(id));

CREATE POLICY "Groups insertable by creator" ON groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

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

CREATE POLICY "Groups updatable by owner" ON groups
  FOR UPDATE
  USING (public.is_group_owner(id))
  WITH CHECK (public.is_group_owner(id));

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

CREATE POLICY "Child profiles by parent" ON child_profiles FOR ALL USING (parent_user_id = auth.uid());

CREATE POLICY "Classrooms viewable by host or enrolled parent" ON classrooms FOR SELECT
  USING (
    host_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM classroom_enrollments ce
      JOIN child_profiles cp ON cp.id = ce.child_profile_id
      WHERE ce.classroom_id = classrooms.id AND cp.parent_user_id = auth.uid()
    )
  );
