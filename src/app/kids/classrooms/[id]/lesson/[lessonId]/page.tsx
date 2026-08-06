import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/Button";
import EndLessonButton from "@/components/kids/EndLessonButton";
import CharacterPicker from "@/components/kids/CharacterPicker";
import ContributionBoard from "@/components/kids/ContributionBoard";
import NextToQuizButton from "@/components/kids/NextToQuizButton";
import TeacherLobbyPanel from "@/components/kids/TeacherLobbyPanel";
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

  const { data: myChildren } = await supabase
    .from("child_profiles")
    .select("id, display_name")
    .eq("parent_user_id", user.id);

  const enrolledChildIds: string[] = [];
  if (myChildren && myChildren.length > 0) {
    const { data: enrollments } = await supabase
      .from("classroom_enrollments")
      .select("child_profile_id")
      .eq("classroom_id", id)
      .in(
        "child_profile_id",
        myChildren.map((c) => c.id)
      );
    for (const e of enrollments ?? []) {
      enrolledChildIds.push(e.child_profile_id);
    }
  }
  const enrolledChildren = (myChildren ?? []).filter((c) =>
    enrolledChildIds.includes(c.id)
  );

  const { data: lobbyRows } = await supabase
    .from("session_lobby")
    .select(
      "id, child_profile_id, status, joined_at, child_profiles(display_name, age)"
    )
    .eq("classroom_id", id)
    .eq("lesson_id", lessonId)
    .in("status", ["waiting", "admitted"])
    .order("joined_at", { ascending: true });

  const lobbyEntries = (lobbyRows ?? []) as LobbyEntry[];
  const parentLobbyEntries = lobbyEntries.filter((e) =>
    enrolledChildIds.includes(e.child_profile_id)
  );
  const hasAdmittedChild = parentLobbyEntries.some((e) => e.status === "admitted");
  const canViewSession = isHost || hasAdmittedChild;

  const { data: characters } = await supabase
    .from("bible_characters")
    .select("id, name, testament, personality_traits, story_summary")
    .order("name", { ascending: true });

  let selectedCharacter = null;
  if (lesson.character_id) {
    const { data } = await supabase
      .from("bible_characters")
      .select("*")
      .eq("id", lesson.character_id)
      .single();
    selectedCharacter = data;
  }

  const { data: materials } = await supabase
    .from("lesson_materials")
    .select("id, title, file_url, file_type, created_at")
    .eq("classroom_id", id)
    .order("created_at", { ascending: false });

  const { data: contributions } = await supabase
    .from("board_contributions")
    .select("id, body, is_teacher, created_at")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false });

  const { data: openQuiz } = await supabase
    .from("lesson_quizzes")
    .select("id")
    .eq("lesson_id", lessonId)
    .is("closed_at", null)
    .maybeSingle();

  const traits = Array.isArray(selectedCharacter?.personality_traits)
    ? (selectedCharacter.personality_traits as string[])
    : [];
  const scriptures = Array.isArray(selectedCharacter?.key_scriptures)
    ? (selectedCharacter.key_scriptures as string[])
    : [];

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

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        {lesson.status === "active" ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Session is live.
          </p>
        ) : (
          <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
            This session has ended.
          </p>
        )}

        {isHost && lesson.status === "active" ? (
          <TeacherLobbyPanel
            classroomId={id}
            lessonId={lessonId}
            lobbyEntries={lobbyEntries}
          />
        ) : null}

        {!isHost &&
        enrolledChildren.length > 0 &&
        lesson.status === "active" &&
        !canViewSession ? (
          <ParentJoinSession
            classroomId={id}
            lessonId={lessonId}
            lessonTitle={lesson.title}
            childrenOptions={enrolledChildren}
            lobbyEntries={parentLobbyEntries}
          />
        ) : null}

        {!isHost && !canViewSession ? (
          <section className="rounded-xl border border-sky-200 bg-white p-6">
            <h2 className="font-semibold text-sky-900">Waiting room</h2>
            <p className="mt-2 text-stone-600">
              {enrolledChildren.length === 0
                ? "Enroll a child in this classroom, then request to join the live session."
                : "Request to join above, then wait for the teacher to admit your child before entering the lesson."}
            </p>
            <Link href={`/kids/classrooms/${id}`} className="mt-4 inline-block">
              <Button variant="outline">Back to classroom</Button>
            </Link>
          </section>
        ) : null}

        {canViewSession && !lesson.character_id && isHost && lesson.status === "active" ? (
          <CharacterPicker
            classroomId={id}
            lessonId={lessonId}
            characters={characters ?? []}
          />
        ) : null}

        {canViewSession && !lesson.character_id && !isHost ? (
          <section className="rounded-xl border border-sky-200 bg-white p-6">
            <h2 className="font-semibold text-sky-900">Waiting for teacher</h2>
            <p className="mt-2 text-stone-600">
              You&apos;re in the session. The teacher is choosing a Bible character.
            </p>
          </section>
        ) : null}

        {canViewSession && selectedCharacter ? (
          <>
            <section className="rounded-xl border border-sky-200 bg-white p-6">
              <h2 className="font-semibold text-sky-900">
                Teaching materials · {selectedCharacter.name}
              </h2>
              <p className="mt-1 text-sm capitalize text-sky-700">
                {selectedCharacter.testament} Testament
              </p>
              {traits.length > 0 ? (
                <p className="mt-3 text-sm text-stone-700">
                  <span className="font-medium">Traits: </span>
                  {traits.join(", ")}
                </p>
              ) : null}
              {scriptures.length > 0 ? (
                <p className="mt-2 text-sm text-stone-700">
                  <span className="font-medium">Key scriptures: </span>
                  {scriptures.join(", ")}
                </p>
              ) : null}
              <div className="mt-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-sky-900">Story</h3>
                  <p className="mt-1 text-stone-700">{selectedCharacter.story_summary}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-sky-900">Life application</h3>
                  <p className="mt-1 text-stone-700">
                    {selectedCharacter.life_application_template}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-sky-900">
                  Classroom uploads
                </h3>
                {materials && materials.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {materials.map((m) => (
                      <li key={m.id}>
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg border border-sky-100 px-4 py-3 hover:bg-sky-50"
                        >
                          <span className="font-medium text-stone-800">{m.title}</span>
                          <span className="ml-2 text-xs uppercase text-stone-500">
                            {m.file_type}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-stone-500">
                    No uploaded materials yet. Teachers can add files from the classroom page.
                  </p>
                )}
              </div>
            </section>

            <ContributionBoard
              classroomId={id}
              lessonId={lessonId}
              isHost={isHost}
              contributions={contributions ?? []}
            />

            {isHost && lesson.status === "active" ? (
              <section className="rounded-xl border border-sky-200 bg-white p-6">
                <h2 className="font-semibold text-sky-900">Ready for quiz?</h2>
                <p className="mt-1 text-sm text-stone-600">
                  When teaching is complete, continue to the quiz.
                </p>
                <div className="mt-4">
                  {openQuiz ? (
                    <Link href={`/kids/classrooms/${id}/lesson/${lessonId}/quiz/${openQuiz.id}`}>
                      <Button>Open quiz</Button>
                    </Link>
                  ) : (
                    <NextToQuizButton classroomId={id} lessonId={lessonId} />
                  )}
                </div>
              </section>
            ) : openQuiz && canViewSession ? (
              <Link href={`/kids/classrooms/${id}/lesson/${lessonId}/quiz/${openQuiz.id}`}>
                <Button>Go to quiz</Button>
              </Link>
            ) : null}
          </>
        ) : null}

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
