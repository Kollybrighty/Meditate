import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChildrenClient from "./ChildrenClient";

export default async function ChildrenPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: children } = await supabase
    .from("child_profiles")
    .select("id, display_name, age")
    .eq("parent_user_id", user.id)
    .order("created_at", { ascending: true });

  const childIds = (children ?? []).map((c) => c.id);

  type EnrollmentRow = {
    child_profile_id: string;
    classrooms:
      | { id: string; name: string }
      | { id: string; name: string }[]
      | null;
  };

  const { data: enrollments } =
    childIds.length > 0
      ? await supabase
          .from("classroom_enrollments")
          .select("child_profile_id, classrooms(id, name)")
          .in("child_profile_id", childIds)
      : { data: [] as EnrollmentRow[] };

  const enrollmentSummaries = (enrollments ?? []).map((row) => {
    const classroom = Array.isArray(row.classrooms) ? row.classrooms[0] : row.classrooms;
    const child = (children ?? []).find((c) => c.id === row.child_profile_id);
    return {
      key: `${row.child_profile_id}-${classroom?.id ?? "x"}`,
      childName: child?.display_name ?? "Child",
      classroomName: classroom?.name ?? "Classroom",
      classroomId: classroom?.id ?? null,
    };
  });

  return (
    <ChildrenClient
      childrenList={children ?? []}
      defaultInvite={invite ?? ""}
      enrollmentSummaries={enrollmentSummaries}
    />
  );
}
