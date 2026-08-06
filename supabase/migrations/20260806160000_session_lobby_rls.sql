-- Session lobby RLS for kids live join requests

ALTER TABLE public.session_lobby ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lobby readable by parent or host" ON session_lobby;
DROP POLICY IF EXISTS "Lobby insertable by parent" ON session_lobby;
DROP POLICY IF EXISTS "Lobby updatable by parent or host" ON session_lobby;

CREATE POLICY "Lobby readable by parent or host" ON session_lobby
  FOR SELECT
  USING (
    public.is_classroom_host(classroom_id)
    OR EXISTS (
      SELECT 1 FROM child_profiles cp
      WHERE cp.id = child_profile_id
        AND cp.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Lobby insertable by parent" ON session_lobby
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM child_profiles cp
      WHERE cp.id = child_profile_id
        AND cp.parent_user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM classroom_enrollments ce
      WHERE ce.classroom_id = session_lobby.classroom_id
        AND ce.child_profile_id = session_lobby.child_profile_id
    )
  );

CREATE POLICY "Lobby updatable by parent or host" ON session_lobby
  FOR UPDATE
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

-- One active lobby row per child per lesson (waiting/admitted)
CREATE UNIQUE INDEX IF NOT EXISTS session_lobby_child_lesson_active_idx
  ON public.session_lobby (lesson_id, child_profile_id)
  WHERE status IN ('waiting', 'admitted');
