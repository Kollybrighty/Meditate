import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ParentJoinSession from "@/components/kids/ParentJoinSession";

type LobbyEntry = {
  id: string;
  child_profile_id: string;
  status: string;
  joined_at: string;
  child_profiles?:
    | { display_name: string; age: number | null }
    | { display_name: string; age: number | null }[]
    | null;
};

export default async function JoinClassPage({
  searchParams,
}: {
  searchParams: Promise<{ classroom?: string }>;
}) {
  const { classroom: classroomParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: children } = await supabase
    .from("child_profiles")
    .select("id, display_name")
    .eq("parent_user_id", user.id)
    .order("created_at", { ascending: true });

  const childIds = (children ?? []).map((c) => c.id);

  type EnrollmentRow = {
    child_profile_id: string;
    classrooms:
      | { id: string; name: string; slug: string }
      | { id: string; name: string; slug: string }[]
      | null;
  };

  const { data: enrollments } =
    childIds.length > 0
      ? await supabase
          .from("classroom_enrollments")
          .select("child_profile_id, classrooms(id, name, slug)")
          .in("child_profile_id", childIds)
      : { data: [] as EnrollmentRow[] };

  const classroomMap = new Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
      childIds: string[];
      childNames: string[];
    }
  >();

  for (const row of enrollments ?? []) {
    const classroom = Array.isArray(row.classrooms) ? row.classrooms[0] : row.classrooms;
    if (!classroom) continue;
    const child = (children ?? []).find((c) => c.id === row.child_profile_id);
    const existing = classroomMap.get(classroom.id);
    if (existing) {
      if (!existing.childIds.includes(row.child_profile_id)) {
        existing.childIds.push(row.child_profile_id);
      }
      if (child && !existing.childNames.includes(child.display_name)) {
        existing.childNames.push(child.display_name);
      }
    } else {
      classroomMap.set(classroom.id, {
        id: classroom.id,
        name: classroom.name,
        slug: classroom.slug,
        childIds: [row.child_profile_id],
        childNames: child ? [child.display_name] : [],
      });
    }
  }

  const enrolledClassrooms = [...classroomMap.values()];
  const selectedId =
    classroomParam && classroomMap.has(classroomParam)
      ? classroomParam
      : enrolledClassrooms[0]?.id ?? null;
  const selected = selectedId ? classroomMap.get(selectedId) : null;

  let activeLesson: { id: string; title: string } | null = null;
  let lobbyEntries: LobbyEntry[] = [];

  if (selected) {
    const { data: lesson } = await supabase
      .from("kids_lessons")
      .select("id, title")
      .eq("classroom_id", selected.id)
      .eq("status", "active")
      .maybeSingle();
    activeLesson = lesson;

    if (activeLesson) {
      const { data } = await supabase
        .from("session_lobby")
        .select(
          "id, child_profile_id, status, joined_at, child_profiles(display_name, age)"
        )
        .eq("classroom_id", selected.id)
        .eq("lesson_id", activeLesson.id)
        .in("status", ["waiting", "admitted"])
        .order("joined_at", { ascending: true });
      lobbyEntries = ((data ?? []) as LobbyEntry[]).filter((e) =>
        selected.childIds.includes(e.child_profile_id)
      );
    }
  }

  const enrolledChildren = (children ?? []).filter((c) =>
    selected ? selected.childIds.includes(c.id) : false
  );

  const liveByClassroom = new Map<string, string>();
  if (enrolledClassrooms.length > 0) {
    const { data: liveLessons } = await supabase
      .from("kids_lessons")
      .select("classroom_id, title")
      .in(
        "classroom_id",
        enrolledClassrooms.map((c) => c.id)
      )
      .eq("status", "active");
    for (const lesson of liveLessons ?? []) {
      liveByClassroom.set(lesson.classroom_id, lesson.title);
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
            <h1 className="text-2xl font-bold text-sky-900">Join a class</h1>
          </div>
          <p className="mt-1 text-stone-600">
            Step 3 — choose a classroom you already enrolled in, then request to join the live
            session and wait in the lobby.
          </p>
        </div>

        {enrolledClassrooms.length === 0 ? (
          <section className="rounded-xl border border-sky-200 bg-white p-6">
            <h2 className="font-semibold text-sky-900">No enrollments yet</h2>
            <p className="mt-2 text-sm text-stone-600">
              Enroll a child once (step 2), then come back here to join live sessions.
            </p>
            <Link href="/kids/children" className="mt-4 inline-block">
              <Button>Enroll a child</Button>
            </Link>
          </section>
        ) : (
          <>
            <section className="rounded-xl border border-sky-200 bg-white p-6">
              <h2 className="font-semibold text-sky-900">Your enrolled classrooms</h2>
              <ul className="mt-3 space-y-2">
                {enrolledClassrooms.map((classroom) => {
                  const isSelected = classroom.id === selectedId;
                  const liveTitle = liveByClassroom.get(classroom.id);
                  return (
                    <li key={classroom.id}>
                      <Link
                        href={`/kids/join?classroom=${classroom.id}`}
                        className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                          isSelected
                            ? "border-sky-400 bg-sky-50"
                            : "border-sky-100 hover:bg-sky-50"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-stone-900">{classroom.name}</p>
                          <p className="text-sm text-stone-500">
                            {classroom.childNames.join(", ")}
                            {liveTitle ? ` · Live: ${liveTitle}` : " · No live session"}
                          </p>
                        </div>
                        <span className="text-xs font-medium uppercase tracking-wide text-sky-700">
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            {selected && activeLesson ? (
              <ParentJoinSession
                classroomId={selected.id}
                lessonId={activeLesson.id}
                lessonTitle={activeLesson.title}
                childrenOptions={enrolledChildren}
                lobbyEntries={lobbyEntries}
              />
            ) : selected ? (
              <section className="rounded-xl border border-sky-200 bg-white p-6">
                <h2 className="font-semibold text-sky-900">{selected.name}</h2>
                <p className="mt-2 text-sm text-stone-600">
                  No live session right now. When the teacher starts one, request to join from
                  this page and wait in the lobby until they admit your child.
                </p>
              </section>
            ) : null}
          </>
        )}

        <p className="text-sm text-stone-500">
          Need to enroll in another classroom?{" "}
          <Link href="/kids/children" className="font-medium text-sky-700 hover:underline">
            Enroll a child
          </Link>
        </p>
      </div>
    </div>
  );
}
