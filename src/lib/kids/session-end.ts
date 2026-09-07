import type { SupabaseClient } from "@supabase/supabase-js";

export async function completeKidsSession(
  supabase: SupabaseClient,
  classroomId: string,
  lessonId: string
): Promise<{ error?: string }> {
  const now = new Date().toISOString();

  const { error: lessonError } = await supabase
    .from("kids_lessons")
    .update({
      status: "completed",
      ended_at: now,
    })
    .eq("id", lessonId)
    .eq("classroom_id", classroomId);

  if (lessonError) return { error: lessonError.message };

  const { error: lobbyError } = await supabase
    .from("session_lobby")
    .update({ status: "left" })
    .eq("classroom_id", classroomId)
    .eq("lesson_id", lessonId)
    .in("status", ["waiting", "admitted"]);

  if (lobbyError) return { error: lobbyError.message };

  const { error: handsError } = await supabase
    .from("raised_hands")
    .update({
      status: "dismissed",
      dismissed_at: now,
      dismissed_by: "teacher",
    })
    .eq("lesson_id", lessonId)
    .in("status", ["raised", "called_on"]);

  if (handsError) return { error: handsError.message };

  const { error: quizError } = await supabase
    .from("lesson_quizzes")
    .update({ closed_at: now })
    .eq("lesson_id", lessonId)
    .is("closed_at", null);

  if (quizError) return { error: quizError.message };

  return {};
}

export function revalidateEndedSession(classroomId: string, lessonId: string) {
  return [
    `/kids/classrooms/${classroomId}`,
    `/kids/classrooms/${classroomId}/lesson/${lessonId}`,
    "/kids/join",
    "/kids",
  ];
}
