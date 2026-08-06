"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ChildActionState = {
  error?: string;
  success?: string;
};

export async function createChildProfile(
  _prev: ChildActionState,
  formData: FormData
): Promise<ChildActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = (formData.get("displayName") as string)?.trim();
  const ageRaw = (formData.get("age") as string | null)?.trim();
  const age = ageRaw ? Number(ageRaw) : null;

  if (!displayName) return { error: "Child display name is required." };
  if (ageRaw && (Number.isNaN(age) || age! < 1 || age! > 18)) {
    return { error: "Age must be between 1 and 18." };
  }

  const { error } = await supabase.from("child_profiles").insert({
    parent_user_id: user.id,
    display_name: displayName,
    age,
  });

  if (error) return { error: error.message };

  revalidatePath("/kids/children");
  revalidatePath("/kids/join");
  revalidatePath("/kids");
  return { success: "Child profile created." };
}

export async function enrollChild(
  _prev: ChildActionState,
  formData: FormData
): Promise<ChildActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const childId = formData.get("childId") as string;
  const invite = (formData.get("invite") as string)?.trim();

  if (!childId || !invite) {
    return { error: "Choose a child and enter a classroom invite code or slug." };
  }

  const { data: child } = await supabase
    .from("child_profiles")
    .select("id")
    .eq("id", childId)
    .eq("parent_user_id", user.id)
    .maybeSingle();

  if (!child) return { error: "Child profile not found." };

  const { data: classrooms, error: lookupError } = await supabase.rpc(
    "find_classroom_by_invite",
    { invite }
  );

  if (lookupError) return { error: lookupError.message };

  const classroom = Array.isArray(classrooms) ? classrooms[0] : classrooms;
  if (!classroom) return { error: "No classroom found for that invite." };

  const { error } = await supabase.from("classroom_enrollments").insert({
    classroom_id: classroom.id,
    child_profile_id: child.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This child is already enrolled in that classroom." };
    }
    return { error: error.message };
  }

  revalidatePath("/kids/children");
  revalidatePath("/kids/join");
  revalidatePath("/kids");
  return {
    success: `Enrolled in ${classroom.name}. Next: Join a class when a session is live.`,
  };
}
