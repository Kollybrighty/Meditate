"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyClassroomUser } from "@/lib/notify-classroom";
import { requireClassroomStaff } from "@/lib/kids/staff";
import { completeKidsSession } from "@/lib/kids/session-end";

export type ClassroomActionState = {
  error?: string;
  success?: string;
};

function revalidateClassroom(classroomId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/kids");
  revalidatePath("/kids/host");
  revalidatePath("/kids/join");
  revalidatePath("/kids/children");
  revalidatePath(`/kids/classrooms/${classroomId}`);
}

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

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };

  const { data: liveLessons } = await supabase
    .from("kids_lessons")
    .select("id")
    .eq("classroom_id", classroomId)
    .eq("status", "active");
  for (const live of liveLessons ?? []) {
    const ended = await completeKidsSession(supabase, classroomId, live.id);
    if (ended.error) return { error: ended.error };
  }

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
  revalidatePath("/kids/join");
  redirect(`/kids/classrooms/${classroomId}/lesson/${lesson.id}`);
}

export async function renameClassroom(
  _prev: ClassroomActionState,
  formData: FormData
): Promise<ClassroomActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = formData.get("classroomId") as string;
  const name = (formData.get("name") as string | null)?.trim();
  if (!classroomId) return { error: "Classroom is required." };
  if (!name) return { error: "Classroom name is required." };

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, host_id")
    .eq("id", classroomId)
    .maybeSingle();

  if (!classroom) return { error: "Classroom not found." };
  if (classroom.host_id !== user.id) {
    return { error: "Only the classroom host can rename this class." };
  }

  const { error } = await supabase
    .from("classrooms")
    .update({ name })
    .eq("id", classroomId)
    .eq("host_id", user.id);

  if (error) return { error: error.message };

  revalidateClassroom(classroomId);
  return { success: "Classroom name updated." };
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

  const { data: removed, error } = await supabase
    .from("classrooms")
    .delete()
    .eq("id", classroomId)
    .eq("host_id", user.id)
    .select("id");

  if (!error && removed && removed.length > 0) {
    revalidateClassroom(classroomId);
    redirect("/kids/host");
  }

  const admin = createAdminClient();
  if (admin) {
    const { data: adminRemoved, error: adminError } = await admin
      .from("classrooms")
      .delete()
      .eq("id", classroomId)
      .eq("host_id", user.id)
      .select("id");
    if (!adminError && adminRemoved && adminRemoved.length > 0) {
      revalidateClassroom(classroomId);
      redirect("/kids/host");
    }
    if (adminError) return { error: adminError.message };
  }

  return {
    error:
      error?.message ||
      "Could not delete this classroom. Try again, or run the classroom delete SQL in Supabase.",
  };
}

export async function addClassroomTeacher(
  _prev: ClassroomActionState,
  formData: FormData
): Promise<ClassroomActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const handle = String(formData.get("handle") ?? "").trim();
  if (!classroomId) return { error: "Classroom is required." };
  if (!handle) return { error: "Enter an email or username." };

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, host_id")
    .eq("id", classroomId)
    .maybeSingle();
  if (!classroom) return { error: "Classroom not found." };
  if (classroom.host_id !== user.id) {
    return { error: "Only the classroom host can add co-teachers." };
  }

  const { data: inviteeId, error: lookupError } = await supabase.rpc(
    "find_user_id_by_handle",
    { handle }
  );
  if (lookupError) return { error: lookupError.message };
  const teacherUserId = typeof inviteeId === "string" ? inviteeId : null;
  if (!teacherUserId) {
    return { error: "No Meditate account matches that email or username." };
  }
  if (teacherUserId === user.id) {
    return { error: "You are already the host of this classroom." };
  }

  const { error } = await supabase.from("classroom_members").insert({
    classroom_id: classroomId,
    user_id: teacherUserId,
    role: "teacher",
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "That person is already a teacher here." };
    }
    return { error: error.message };
  }

  await notifyClassroomUser({
    classroomId,
    userId: teacherUserId,
    type: "kids_teacher_invite",
    referenceId: classroomId,
    actorId: user.id,
  });

  revalidateClassroom(classroomId);
  revalidatePath("/notifications");
  return { success: "Co-teacher added." };
}

export async function removeClassroomTeacher(
  _prev: ClassroomActionState,
  formData: FormData
): Promise<ClassroomActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const teacherId = String(formData.get("teacherId") ?? "");
  if (!classroomId || !teacherId) return { error: "Missing teacher." };

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, host_id")
    .eq("id", classroomId)
    .maybeSingle();
  if (!classroom) return { error: "Classroom not found." };
  if (classroom.host_id !== user.id) {
    return { error: "Only the classroom host can remove co-teachers." };
  }
  if (teacherId === classroom.host_id) {
    return { error: "The host cannot be removed." };
  }

  const { error } = await supabase
    .from("classroom_members")
    .delete()
    .eq("classroom_id", classroomId)
    .eq("user_id", teacherId);

  if (error) return { error: error.message };
  revalidateClassroom(classroomId);
  return { success: "Co-teacher removed." };
}
