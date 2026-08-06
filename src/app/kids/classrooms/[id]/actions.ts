"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ClassroomActionState = {
  error?: string;
  success?: string;
};

export async function startKidsLesson(
  _prev: ClassroomActionState,
  formData: FormData
): Promise<ClassroomActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = formData.get("classroomId") as string;
  const title = ((formData.get("title") as string) || "").trim() || "Kids Bible lesson";

  if (!classroomId) return { error: "Classroom is required." };

  // End any currently active lesson for this classroom
  await supabase
    .from("kids_lessons")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("classroom_id", classroomId)
    .eq("status", "active");

  const { data: lesson, error } = await supabase
    .from("kids_lessons")
    .insert({
      classroom_id: classroomId,
      title,
      host_id: user.id,
      lesson_type: "custom",
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!lesson) return { error: "Failed to start lesson." };

  revalidatePath(`/kids/classrooms/${classroomId}`);
  redirect(`/kids/classrooms/${classroomId}/lesson/${lesson.id}`);
}

export async function deleteClassroom(
  _prev: ClassroomActionState,
  formData: FormData
): Promise<ClassroomActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = formData.get("classroomId") as string;
  if (!classroomId) return { error: "Classroom is required." };

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, host_id, name")
    .eq("id", classroomId)
    .maybeSingle();

  if (!classroom) return { error: "Classroom not found." };
  if (classroom.host_id !== user.id) {
    return { error: "Only the classroom host can delete this class." };
  }

  const { error } = await supabase.from("classrooms").delete().eq("id", classroomId);

  if (error) return { error: error.message };

  revalidatePath("/kids/host");
  revalidatePath("/kids");
  revalidatePath("/kids/join");
  revalidatePath("/kids/children");
  redirect("/kids/host");
}
