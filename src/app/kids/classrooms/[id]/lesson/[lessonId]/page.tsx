import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/Button";
import EndLessonButton from "@/components/kids/EndLessonButton";

export default async function LessonSessionPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, name, host_id")
    .eq("id", id)
    .single();

  if (!classroom) notFound();

  const { data: lesson } = await supabase
    .from("kids_lessons")
    .select("*")
    .eq("id", lessonId)
    .eq("classroom_id", id)
    .single();

  if (!lesson) notFound();

  const isHost = classroom.host_id === user.id;

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="border-b border-sky-200 bg-white px-6 py-4">
        <Link
          href={`/kids/classrooms/${id}`}
          className="text-sm text-sky-700 hover:underline"
        >
          ← {classroom.name}
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Baby className="h-8 w-8 text-sky-500" />
          <h1 className="text-2xl font-bold text-sky-900">{lesson.title}</h1>
        </div>
        <p className="capitalize text-sky-700">
          Session status: {lesson.status}
          {lesson.started_at
            ? ` · started ${new Date(lesson.started_at).toLocaleString()}`
            : ""}
        </p>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <section className="rounded-xl border border-sky-200 bg-white p-6">
          <h2 className="font-semibold text-sky-900">Live kids session</h2>
          <p className="mt-2 text-stone-600">
            This is your classroom session space. Bible character lessons, quizzes,
            and the contribution board will appear here as you continue building Meditate Kids.
          </p>
          {lesson.status === "active" ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Session is live. Families can join the classroom lobby from the invite link.
            </p>
          ) : (
            <p className="mt-4 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
              This session has ended.
            </p>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href={`/kids/classrooms/${id}`}>
            <Button variant="outline">Back to classroom</Button>
          </Link>
          {isHost && lesson.status === "active" ? (
            <EndLessonButton classroomId={id} lessonId={lessonId} />
          ) : null}
        </div>
      </main>
    </div>
  );
}
