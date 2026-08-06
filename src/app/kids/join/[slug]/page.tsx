import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function JoinClassroomPage({
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
          To enroll a child, open <strong>My children</strong> and use this invite code:
        </p>
        <p className="mt-3 break-all rounded-lg bg-sky-50 p-3 font-mono text-sm">
          {classroom.invite_code}
        </p>
        <p className="mt-2 text-xs text-stone-500">Or use slug: {classroom.slug}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/kids/children">
            <Button>Enroll a child</Button>
          </Link>
          <Link href={`/kids/classrooms/${classroom.id}`}>
            <Button variant="outline">View classroom</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
