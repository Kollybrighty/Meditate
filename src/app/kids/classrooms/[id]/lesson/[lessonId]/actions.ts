"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function endKidsLesson(classroomId: string, lessonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("kids_lessons")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
    })
    .eq("id", lessonId)
    .eq("classroom_id", classroomId)
    .eq("host_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/kids/classrooms/${classroomId}`);
  revalidatePath(`/kids/classrooms/${classroomId}/lesson/${lessonId}`);
  redirect(`/kids/classrooms/${classroomId}`);
}
