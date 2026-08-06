import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChildrenClient from "./ChildrenClient";
import { Button } from "@/components/ui/Button";

export default async function ChildrenPage() {
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

  const { data: enrollments } =
    childIds.length > 0
      ? await supabase
          .from("classroom_enrollments")
          .select("child_profile_id, classrooms(id, name, slug)")
          .in("child_profile_id", childIds)
      : { data: [] as { child_profile_id: string; classrooms: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null }[] };

  const classroomMap = new Map<
    string,
    { id: string; name: string; slug: string; childNames: string[] }
  >();

  for (const row of enrollments ?? []) {
    const classroom = Array.isArray(row.classrooms) ? row.classrooms[0] : row.classrooms;
    if (!classroom) continue;
    const child = (children ?? []).find((c) => c.id === row.child_profile_id);
    const existing = classroomMap.get(classroom.id);
    if (existing) {
      if (child && !existing.childNames.includes(child.display_name)) {
        existing.childNames.push(child.display_name);
      }
    } else {
      classroomMap.set(classroom.id, {
        id: classroom.id,
        name: classroom.name,
        slug: classroom.slug,
        childNames: child ? [child.display_name] : [],
      });
    }
  }

  const enrolledClassrooms = [...classroomMap.values()];

  const liveByClassroom = new Map<string, { id: string; title: string }>();
  if (enrolledClassrooms.length > 0) {
    const { data: liveLessons } = await supabase
      .from("kids_lessons")
      .select("id, title, classroom_id")
      .in(
        "classroom_id",
        enrolledClassrooms.map((c) => c.id)
      )
      .eq("status", "active");
    for (const lesson of liveLessons ?? []) {
      liveByClassroom.set(lesson.classroom_id, { id: lesson.id, title: lesson.title });
    }
  }

  return (
    <div className="min-h-screen bg-sky-50">
      {enrolledClassrooms.length > 0 ? (
        <section className="mx-auto max-w-2xl px-4 pt-10">
          <div className="rounded-xl border border-sky-200 bg-white p-6">
            <h2 className="font-semibold text-sky-900">Enrolled classrooms</h2>
            <ul className="mt-3 space-y-3">
              {enrolledClassrooms.map((classroom) => {
                const live = liveByClassroom.get(classroom.id);
                return (
                  <li
                    key={classroom.id}
                    className="rounded-lg border border-sky-100 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone-900">{classroom.name}</p>
                        <p className="text-sm text-stone-500">
                          {classroom.childNames.join(", ")}
                          {live ? ` · Live: ${live.title}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/kids/classrooms/${classroom.id}`}>
                          <Button size="sm" variant={live ? "primary" : "outline"}>
                            {live ? "Join live session" : "Open classroom"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
      <ChildrenClient childrenList={children ?? []} />
    </div>
  );
}
