import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function ClassroomInvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/kids/join/${slug}`);

  const { data: classrooms } = await supabase.rpc("find_classroom_by_invite", {
    invite: slug,
  });

  const classroom = Array.isArray(classrooms) ? classrooms[0] : classrooms;
  if (!classroom) notFound();

  // If already enrolled, skip enroll and go straight to Join a class.
  const { data: myChildren } = await supabase
    .from("child_profiles")
    .select("id")
    .eq("parent_user_id", user.id);

  const childIds = (myChildren ?? []).map((c) => c.id);
  let alreadyEnrolled = false;
  if (childIds.length > 0) {
    const { data: enrollment } = await supabase
      .from("classroom_enrollments")
      .select("child_profile_id")
      .eq("classroom_id", classroom.id)
      .in("child_profile_id", childIds)
      .limit(1)
      .maybeSingle();
    alreadyEnrolled = Boolean(enrollment);
  }

  if (alreadyEnrolled) {
    redirect(`/kids/join?classroom=${classroom.id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-sky-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Baby className="h-8 w-8 text-sky-500" />
          <div>
            <h1 className="text-xl font-bold text-sky-900">{classroom.name}</h1>
            {classroom.age_range ? (
              <p className="text-sm text-sky-700">{classroom.age_range}</p>
            ) : null}
          </div>
        </div>
        <p className="text-stone-600">
          Enroll your child once in this classroom. After that, join live sessions from{" "}
          <strong>Join a class</strong>.
        </p>
        <p className="mt-3 break-all rounded-lg bg-sky-50 p-3 font-mono text-sm">
          {classroom.invite_code}
        </p>
        <p className="mt-2 text-xs text-stone-500">Or use slug: {classroom.slug}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/kids/children?invite=${encodeURIComponent(classroom.slug)}`}>
            <Button>Enroll a child</Button>
          </Link>
          <Link href="/kids">
            <Button variant="outline">Kids home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
