"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClassroomStaff } from "@/lib/kids/staff";
import { completeKidsSession, revalidateEndedSession } from "@/lib/kids/session-end";

export async function endKidsLesson(classroomId: string, lessonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) throw new Error(staff.error);

  const result = await completeKidsSession(supabase, classroomId, lessonId);
  if (result.error) throw new Error(result.error);

  for (const path of revalidateEndedSession(classroomId, lessonId)) {
    revalidatePath(path);
  }
  redirect(`/kids/classrooms/${classroomId}`);
}
