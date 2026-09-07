import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function notifyClassroomStaff(options: {
  classroomId: string;
  type: "kids_lobby" | "kids_teacher_invite";
  referenceId: string | null;
  actorId: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("notify_classroom_staff", {
    p_classroom_id: options.classroomId,
    p_type: options.type,
    p_reference_id: options.referenceId,
  });
  if (!error) return;

  const admin = createAdminClient();
  if (!admin) return;

  const [{ data: classroom }, { data: members }] = await Promise.all([
    admin.from("classrooms").select("host_id").eq("id", options.classroomId).maybeSingle(),
    admin
      .from("classroom_members")
      .select("user_id")
      .eq("classroom_id", options.classroomId)
      .in("role", ["host", "teacher"]),
  ]);

  const userIds = new Set<string>();
  if (classroom?.host_id) userIds.add(classroom.host_id);
  for (const row of members ?? []) userIds.add(row.user_id);
  userIds.delete(options.actorId);

  const rows = [...userIds].map((user_id) => ({
    user_id,
    classroom_id: options.classroomId,
    type: options.type,
    reference_id: options.referenceId,
  }));
  if (rows.length === 0) return;
  await admin.from("notifications").insert(rows);
}

export async function notifyClassroomUser(options: {
  classroomId: string;
  userId: string;
  type: "kids_teacher_invite";
  referenceId: string | null;
  actorId: string;
}) {
  if (options.userId === options.actorId) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("notify_classroom_user", {
    p_classroom_id: options.classroomId,
    p_user_id: options.userId,
    p_type: options.type,
    p_reference_id: options.referenceId,
  });
  if (!error) return;

  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("notifications").insert({
    user_id: options.userId,
    classroom_id: options.classroomId,
    type: options.type,
    reference_id: options.referenceId,
  });
}
