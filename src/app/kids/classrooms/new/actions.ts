"use server";

import { createClient } from "@/lib/supabase/server";
import { generateInviteCode, slugify } from "@/lib/utils";
import { redirect } from "next/navigation";

export type CreateClassroomState = {
  error?: string;
};

export async function createClassroom(
  _prev: CreateClassroomState,
  formData: FormData
): Promise<CreateClassroomState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const ageRange = (formData.get("ageRange") as string | null)?.trim() || null;

  if (!name) return { error: "Classroom name is required." };

  const slug = `${slugify(name)}-${generateInviteCode().slice(0, 6)}`;
  const inviteCode = generateInviteCode();

  const { data: classroom, error } = await supabase
    .from("classrooms")
    .insert({
      name,
      slug,
      age_range: ageRange,
      host_id: user.id,
      invite_code: inviteCode,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!classroom) return { error: "Failed to create classroom." };

  const { error: memberError } = await supabase.from("classroom_members").insert({
    classroom_id: classroom.id,
    user_id: user.id,
    role: "host",
  });

  if (memberError) return { error: memberError.message };

  redirect(`/kids/classrooms/${classroom.id}`);
}
