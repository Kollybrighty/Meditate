import type { SupabaseClient } from "@supabase/supabase-js";

export type StaffClassroom = {
  id: string;
  name: string;
  slug: string;
  age_range: string | null;
  host_id: string;
  isOwner: boolean;
};

export async function isClassroomStaff(
  supabase: SupabaseClient,
  classroomId: string,
  userId: string,
  hostId?: string | null
): Promise<boolean> {
  if (hostId && hostId === userId) return true;
  const { data } = await supabase
    .from("classroom_members")
    .select("role")
    .eq("classroom_id", classroomId)
    .eq("user_id", userId)
    .in("role", ["host", "teacher"])
    .maybeSingle();
  return Boolean(data);
}

export async function requireClassroomStaff(
  supabase: SupabaseClient,
  classroomId: string,
  userId: string
): Promise<{ ok: true; isOwner: boolean } | { ok: false; error: string }> {
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, host_id")
    .eq("id", classroomId)
    .maybeSingle();
  if (!classroom) return { ok: false, error: "Classroom not found." };
  const staff = await isClassroomStaff(
    supabase,
    classroomId,
    userId,
    classroom.host_id
  );
  if (!staff) return { ok: false, error: "Only teachers can do that." };
  return { ok: true, isOwner: classroom.host_id === userId };
}

export async function listStaffClassrooms(
  supabase: SupabaseClient,
  userId: string
): Promise<StaffClassroom[]> {
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase
      .from("classrooms")
      .select("id, name, slug, age_range, host_id")
      .eq("host_id", userId),
    supabase
      .from("classroom_members")
      .select("role, classrooms(id, name, slug, age_range, host_id)")
      .eq("user_id", userId)
      .in("role", ["host", "teacher"]),
  ]);

  const map = new Map<string, StaffClassroom>();
  for (const row of owned ?? []) {
    map.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug,
      age_range: row.age_range,
      host_id: row.host_id,
      isOwner: true,
    });
  }
  for (const row of memberships ?? []) {
    const classroom = Array.isArray(row.classrooms)
      ? row.classrooms[0]
      : row.classrooms;
    if (!classroom) continue;
    if (map.has(classroom.id)) continue;
    map.set(classroom.id, {
      id: classroom.id,
      name: classroom.name,
      slug: classroom.slug,
      age_range: classroom.age_range,
      host_id: classroom.host_id,
      isOwner: classroom.host_id === userId,
    });
  }
  return [...map.values()];
}
