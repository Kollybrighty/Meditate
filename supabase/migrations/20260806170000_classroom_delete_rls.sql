-- Allow classroom hosts to delete their classrooms

DROP POLICY IF EXISTS "Classrooms deletable by host" ON classrooms;

CREATE POLICY "Classrooms deletable by host" ON classrooms
  FOR DELETE
  USING (host_id = auth.uid());
