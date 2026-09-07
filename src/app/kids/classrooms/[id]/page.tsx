import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/Button";
import QRCodeDisplay from "@/components/group/QRCodeDisplay";
import ShareInvite from "@/components/group/ShareInvite";
import StartLessonForm from "@/components/kids/StartLessonForm";
import MaterialUpload from "@/components/kids/MaterialUpload";
import TeacherLobbyPanel from "@/components/kids/TeacherLobbyPanel";
import DeleteClassroomButton from "@/components/kids/DeleteClassroomButton";
import ClassroomManageMenu from "@/components/kids/ClassroomManageMenu";
import InviteUrl from "@/components/group/InviteUrl";
import { appBaseUrl } from "@/lib/app-url";
import { isClassroomStaff } from "@/lib/kids/staff";
import CoTeacherPanel, { type ClassroomTeacher } from "@/components/kids/CoTeacherPanel";

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

  const isOwner = classroom.host_id === user.id;
  const isStaff = await isClassroomStaff(supabase, id, user.id, classroom.host_id);

  // Parents join live sessions from /kids/join — keep this page for teachers.
  if (!isStaff) {
    redirect(`/kids/join?classroom=${id}`);
  }

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

  let lobbyEntries: {
    id: string;
    child_profile_id: string;
    status: string;
    joined_at: string;
    child_profiles?:
      | { display_name: string; age: number | null }
      | { display_name: string; age: number | null }[]
      | null;
  }[] = [];

  if (activeLesson) {
    const { data } = await supabase
      .from("session_lobby")
      .select("id, child_profile_id, status, joined_at, child_profiles(display_name, age)")
      .eq("classroom_id", id)
      .eq("lesson_id", activeLesson.id)
      .in("status", ["waiting", "admitted"])
      .order("joined_at", { ascending: true });
    lobbyEntries = (data as typeof lobbyEntries) ?? [];
  }

  const { data: materials } = await supabase
    .from("lesson_materials")
    .select("id, title, file_url, file_type, created_at")
    .eq("classroom_id", id)
    .order("created_at", { ascending: false });

  const { data: teacherRows } = await supabase.rpc("list_classroom_teachers", {
    cid: id,
  });
  const teachers: ClassroomTeacher[] = [...((teacherRows ?? []) as ClassroomTeacher[])];
  if (!teachers.some((row) => row.user_id === classroom.host_id)) {
    teachers.unshift({
      user_id: classroom.host_id,
      role: "host",
      full_name: "Host",
      username: "",
    });
  }

  const enrollInviteUrl = `${await appBaseUrl()}/kids/join/${encodeURIComponent(classroom.slug)}`;

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="border-b border-sky-200 bg-white px-6 py-4">
        <Link href="/kids/host" className="text-sm text-sky-700 hover:underline">
          ← Your classrooms
        </Link>
        <div className="mt-2 flex items-center gap-1">
          <ClassroomManageMenu
            classroomId={id}
            classroomName={classroom.name}
            canManage={isOwner}
          />
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
              <Link href={`/kids/classrooms/${id}/lesson/${activeLesson.id}`}>
                <Button>Open live session</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-3">
              <p className="mb-3 text-sm text-stone-600">
                No active session. Start one when you&apos;re ready to teach.
              </p>
              <StartLessonForm classroomId={id} />
            </div>
          )}
        </section>

        {activeLesson ? (
          <TeacherLobbyPanel
            classroomId={id}
            lessonId={activeLesson.id}
            lobbyEntries={lobbyEntries}
          />
        ) : null}

        <MaterialUpload classroomId={id} materials={materials ?? []} />

        <section className="rounded-xl border border-sky-200 bg-white p-6">
          <h2 className="font-semibold text-sky-900">Invite families to enroll</h2>
          <p className="mt-1 text-sm text-stone-600">
            Share this link so parents can enroll once (step 2). They join live sessions later
            from Join a class.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Enrolled children: {enrollmentCount ?? 0}
          </p>
          <InviteUrl url={enrollInviteUrl} className="bg-sky-50" />
          <ShareInvite
            url={enrollInviteUrl}
            groupName={classroom.name}
            shareLabel="Kids classroom"
          />
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
            <QRCodeDisplay url={enrollInviteUrl} />
          </div>
        </section>

        <CoTeacherPanel
          classroomId={id}
          teachers={teachers}
          hostId={classroom.host_id}
          isOwner={isOwner}
        />

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

        <section className="rounded-xl border border-sky-200 bg-white p-6">
          <h2 className="font-semibold text-sky-900">Classroom settings</h2>
          <p className="mt-1 text-sm text-stone-600">
            {isOwner
              ? "Rename this class with the pencil next to the title, or delete it below. Deleting removes enrollments and lessons."
              : "Only the classroom host can rename or delete this class."}
          </p>
          {isOwner ? (
            <div className="mt-4">
              <DeleteClassroomButton classroomId={id} classroomName={classroom.name} />
            </div>
          ) : null}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/kids/host">
            <Button variant="outline">Your classrooms</Button>
          </Link>
          <Link href="/kids">
            <Button variant="outline">Kids home</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
