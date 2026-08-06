import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function HostClassroomsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id, name, age_range, slug, created_at")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const liveByClassroom = new Map<string, { id: string; title: string }>();
  if (classroomIds.length > 0) {
    const { data: liveLessons } = await supabase
      .from("kids_lessons")
      .select("id, title, classroom_id")
      .in("classroom_id", classroomIds)
      .eq("status", "active");
    for (const lesson of liveLessons ?? []) {
      liveByClassroom.set(lesson.classroom_id, { id: lesson.id, title: lesson.title });
    }
  }

  return (
    <div className="min-h-screen bg-sky-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Link href="/kids" className="text-sm text-sky-700 hover:underline">
            ← Kids home
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <Baby className="h-8 w-8 text-sky-500" />
            <h1 className="text-2xl font-bold text-sky-900">Host a classroom</h1>
          </div>
          <p className="mt-1 text-stone-600">
            Step 1 — create a classroom, start a live session, and admit children from the lobby.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/kids/classrooms/new">
            <Button>Create classroom</Button>
          </Link>
        </div>

        <section className="rounded-xl border border-sky-200 bg-white p-6">
          <h2 className="font-semibold text-sky-900">Your classrooms</h2>
          {classrooms && classrooms.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {classrooms.map((classroom) => {
                const live = liveByClassroom.get(classroom.id);
                return (
                  <li
                    key={classroom.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-100 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-stone-900">{classroom.name}</p>
                      <p className="text-sm text-stone-500">
                        {classroom.age_range ?? "All ages"}
                        {live ? ` · Live: ${live.title}` : ""}
                      </p>
                    </div>
                    <Link href={`/kids/classrooms/${classroom.id}`}>
                      <Button size="sm" variant={live ? "primary" : "outline"}>
                        {live ? "Open live session" : "Open classroom"}
                      </Button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-500">
              No classrooms yet. Create one to start hosting.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
