import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/Button";
import QRCodeDisplay from "@/components/group/QRCodeDisplay";
import ShareInvite from "@/components/group/ShareInvite";
import StartLessonForm from "@/components/kids/StartLessonForm";
import MaterialUpload from "@/components/kids/MaterialUpload";
import ParentJoinSession from "@/components/kids/ParentJoinSession";
import TeacherLobbyPanel from "@/components/kids/TeacherLobbyPanel";

function appBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("*")
    .eq("id", id)
    .single();

  if (!classroom) notFound();

  const isHost = classroom.host_id === user.id;

  const { data: activeLesson } = await supabase
    .from("kids_lessons")
    .select("id, title, status, started_at")
    .eq("classroom_id", id)
    .eq("status", "active")
    .maybeSingle();

  const { data: recentLessons } = await supabase
    .from("kids_lessons")
    .select("id, title, status, started_at, ended_at")
    .eq("classroom_id", id)
    .order("started_at", { ascending: false })
    .limit(5);

  const { count: enrollmentCount } = await supabase
    .from("classroom_enrollments")
    .select("*", { count: "exact", head: true })
    .eq("classroom_id", id);

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
  const isEnrolledParent = enrolledChildren.length > 0;

  let lobbyEntries: {
    id: string;
    child_profile_id: string;
    status: string;
    joined_at: string;
    child_profiles?: { display_name: string; age: number | null } | null;
  }[] = [];

  if (activeLesson && (isHost || isEnrolledParent)) {
    const { data } = await supabase
      .from("session_lobby")
      .select("id, child_profile_id, status, joined_at, child_profiles(display_name, age)")
      .eq("classroom_id", id)
      .eq("lesson_id", activeLesson.id)
      .in("status", ["waiting", "admitted"])
      .order("joined_at", { ascending: true });
    lobbyEntries = (data as typeof lobbyEntries) ?? [];
  }

  const parentLobbyEntries = isHost
    ? []
    : lobbyEntries.filter((e) => enrolledChildIds.includes(e.child_profile_id));

  const { data: materials } = isHost
    ? await supabase
        .from("lesson_materials")
        .select("id, title, file_url, file_type, created_at")
        .eq("classroom_id", id)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; title: string; file_url: string; file_type: string; created_at: string }[] };

  const joinUrl = `${appBaseUrl()}/kids/join/${classroom.slug}`;

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="border-b border-sky-200 bg-white px-6 py-4">
        <Link href="/kids" className="text-sm text-sky-700 hover:underline">
          ← Kids home
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Baby className="h-8 w-8 text-sky-500" />
          <h1 className="text-2xl font-bold text-sky-900">{classroom.name}</h1>
        </div>
        {classroom.age_range ? (
          <p className="text-sky-700">{classroom.age_range}</p>
        ) : null}
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        <section className="rounded-xl border border-sky-200 bg-white p-6">
          <h2 className="font-semibold text-sky-900">Kids session</h2>
          {activeLesson ? (
            <div className="mt-3 space-y-3">
              <p className="text-stone-700">
                Active lesson: <span className="font-medium">{activeLesson.title}</span>
              </p>
              {isHost ? (
                <Link href={`/kids/classrooms/${id}/lesson/${activeLesson.id}`}>
                  <Button>Open live session</Button>
                </Link>
              ) : null}
            </div>
          ) : isHost ? (
            <div className="mt-3">
              <p className="mb-3 text-sm text-stone-600">
                No active session. Start one when you&apos;re ready to teach.
              </p>
              <StartLessonForm classroomId={id} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone-600">
              Waiting for the teacher to start a session.
            </p>
          )}
        </section>

        {activeLesson && isHost ? (
          <TeacherLobbyPanel
            classroomId={id}
            lessonId={activeLesson.id}
            lobbyEntries={lobbyEntries}
          />
        ) : null}

        {activeLesson && isEnrolledParent ? (
          <ParentJoinSession
            classroomId={id}
            lessonId={activeLesson.id}
            lessonTitle={activeLesson.title}
            childrenOptions={enrolledChildren}
            lobbyEntries={parentLobbyEntries}
          />
        ) : null}

        {isHost ? (
          <section className="rounded-xl border border-sky-200 bg-white p-6">
            <h2 className="font-semibold text-sky-900">Invite families</h2>
            <p className="mt-1 text-sm text-stone-600">
              Share this link or QR so parents can enroll their children.
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Enrolled children: {enrollmentCount ?? 0}
            </p>
            <div className="mt-4 break-all rounded-lg bg-sky-50 p-3 font-mono text-sm">
              {joinUrl}
            </div>
            <ShareInvite
              url={joinUrl}
              groupName={classroom.name}
              shareLabel="Kids classroom"
            />
            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
              <QRCodeDisplay url={joinUrl} />
            </div>
          </section>
        ) : null}

        {isHost ? (
          <MaterialUpload classroomId={id} materials={materials ?? []} />
        ) : null}

        <section className="rounded-xl border border-sky-200 bg-white p-6">
          <h2 className="font-semibold text-sky-900">Recent lessons</h2>
          {recentLessons && recentLessons.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {recentLessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    href={`/kids/classrooms/${id}/lesson/${lesson.id}`}
                    className="flex items-center justify-between rounded-lg border border-sky-100 px-4 py-3 hover:bg-sky-50"
                  >
                    <span className="font-medium text-stone-800">{lesson.title}</span>
                    <span className="text-xs uppercase tracking-wide text-stone-500">
                      {lesson.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-500">No lessons yet.</p>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
          <Link href="/kids/children">
            <Button variant="outline">My children</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
