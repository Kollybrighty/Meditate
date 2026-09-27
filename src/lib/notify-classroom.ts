import { emailNotice } from "@/lib/email/deliver";
import { isResendConfigured } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function classroomStaffIds(classroomId: string): Promise<string[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const [{ data: classroom }, { data: members }] = await Promise.all([
    admin.from("classrooms").select("host_id").eq("id", classroomId).maybeSingle(),
    admin
      .from("classroom_members")
      .select("user_id")
      .eq("classroom_id", classroomId)
      .in("role", ["host", "teacher"]),
  ]);
  const userIds = new Set<string>();
  if (classroom?.host_id) userIds.add(classroom.host_id);
  for (const row of members ?? []) userIds.add(row.user_id);
  return [...userIds];
}

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

  let recipientIds: string[] = [];
  if (error) {
    recipientIds = (await classroomStaffIds(options.classroomId)).filter(
      (id) => id !== options.actorId
    );
    if (recipientIds.length === 0) return;
    const admin = createAdminClient();
    if (!admin) return;
    const rows = recipientIds.map((user_id) => ({
      user_id,
      classroom_id: options.classroomId,
      type: options.type,
      reference_id: options.referenceId,
    }));
    const { error: insertError } = await admin.from("notifications").insert(rows);
    if (insertError) return;
  }

  if (!isResendConfigured()) return;
  if (recipientIds.length === 0) {
    recipientIds = await classroomStaffIds(options.classroomId);
  }
  await emailNotice({
    userIds: recipientIds,
    actorId: options.actorId,
    type: options.type,
    classroomId: options.classroomId,
    referenceId: options.referenceId,
  });
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

  if (error) {
    const admin = createAdminClient();
    if (!admin) return;
    const { error: insertError } = await admin.from("notifications").insert({
      user_id: options.userId,
      classroom_id: options.classroomId,
      type: options.type,
      reference_id: options.referenceId,
    });
    if (insertError) return;
  }

  await emailNotice({
    userIds: [options.userId],
    actorId: options.actorId,
    type: options.type,
    classroomId: options.classroomId,
    referenceId: options.referenceId,
  });
}
