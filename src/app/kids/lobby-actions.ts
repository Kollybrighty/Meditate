"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyClassroomStaff } from "@/lib/notify-classroom";
import { requireClassroomStaff } from "@/lib/kids/staff";

export type LobbyActionState = {
  error?: string;
  success?: string;
};

export async function requestJoinSession(
  _prev: LobbyActionState,
  formData: FormData
): Promise<LobbyActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = formData.get("classroomId") as string;
  const lessonId = formData.get("lessonId") as string;
  const childId = formData.get("childId") as string;

  if (!classroomId || !lessonId || !childId) {
    return { error: "Choose a child to request joining the session." };
  }

  const { data: child } = await supabase
    .from("child_profiles")
    .select("id, display_name")
    .eq("id", childId)
    .eq("parent_user_id", user.id)
    .maybeSingle();

  if (!child) return { error: "Child profile not found." };

  const { data: enrollment } = await supabase
    .from("classroom_enrollments")
    .select("classroom_id")
    .eq("classroom_id", classroomId)
    .eq("child_profile_id", childId)
    .maybeSingle();

  if (!enrollment) {
    return { error: "This child is not enrolled in this classroom." };
  }

  const { data: lesson } = await supabase
    .from("kids_lessons")
    .select("id, status")
    .eq("id", lessonId)
    .eq("classroom_id", classroomId)
    .eq("status", "active")
    .maybeSingle();

  if (!lesson) return { error: "No live session is available right now." };

  const { data: existing } = await supabase
    .from("session_lobby")
    .select("id, status")
    .eq("lesson_id", lessonId)
    .eq("child_profile_id", childId)
    .in("status", ["waiting", "admitted"])
    .maybeSingle();

  if (existing?.status === "admitted") {
    return { success: `${child.display_name} is already admitted. You can enter the session.` };
  }
  if (existing?.status === "waiting") {
    return { success: `Join request for ${child.display_name} is already waiting for teacher approval.` };
  }

  const { error } = await supabase.from("session_lobby").insert({
    classroom_id: classroomId,
    child_profile_id: childId,
    lesson_id: lessonId,
    status: "waiting",
  });

  if (error) return { error: error.message };

  await notifyClassroomStaff({
    classroomId,
    type: "kids_lobby",
    referenceId: lessonId,
    actorId: user.id,
  });

  revalidatePath(`/kids/classrooms/${classroomId}`);
  revalidatePath(`/kids/classrooms/${classroomId}/lesson/${lessonId}`);
  revalidatePath("/kids/join");
  revalidatePath("/notifications");
  return { success: `Join request sent for ${child.display_name}. Waiting for teacher approval.` };
}

export async function admitLobbyChild(
  _prev: LobbyActionState,
  formData: FormData
): Promise<LobbyActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const lobbyId = formData.get("lobbyId") as string;
  const classroomId = formData.get("classroomId") as string;
  const lessonId = formData.get("lessonId") as string;

  if (!lobbyId) return { error: "Missing lobby request." };

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };

  const { error } = await supabase
    .from("session_lobby")
    .update({
      status: "admitted",
      admitted_at: new Date().toISOString(),
    })
    .eq("id", lobbyId)
    .eq("classroom_id", classroomId)
    .eq("status", "waiting");

  if (error) return { error: error.message };

  revalidatePath(`/kids/classrooms/${classroomId}`);
  revalidatePath(`/kids/classrooms/${classroomId}/lesson/${lessonId}`);
  revalidatePath("/kids/join");
  return { success: "Child admitted to the live session." };
}

export async function leaveLobby(
  _prev: LobbyActionState,
  formData: FormData
): Promise<LobbyActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const lobbyId = formData.get("lobbyId") as string;
  const classroomId = formData.get("classroomId") as string;
  const lessonId = formData.get("lessonId") as string;

  const { error } = await supabase
    .from("session_lobby")
    .update({ status: "left" })
    .eq("id", lobbyId);

  if (error) return { error: error.message };

  revalidatePath(`/kids/classrooms/${classroomId}`);
  revalidatePath(`/kids/classrooms/${classroomId}/lesson/${lessonId}`);
  revalidatePath("/kids/join");
  return { success: "Left the session lobby." };
}
