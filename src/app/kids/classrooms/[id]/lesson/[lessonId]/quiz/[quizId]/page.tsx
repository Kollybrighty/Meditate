import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/Button";
import QuizSubmitForm from "@/components/kids/QuizSubmitForm";
import QuizClassResults from "@/components/kids/QuizClassResults";
import QuizTeacherTools from "@/components/kids/QuizTeacherTools";
import QuizQuestionCard from "@/components/kids/QuizQuestionCard";
import KidsSessionGuard from "@/components/kids/KidsSessionGuard";
import { isClassroomStaff } from "@/lib/kids/staff";

export default async function LessonQuizPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string; quizId: string }>;
}) {
  const { id, lessonId, quizId } = await params;
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

  const { data: quiz } = await supabase
    .from("lesson_quizzes")
    .select("*")
    .eq("id", quizId)
    .eq("lesson_id", lessonId)
    .single();
  if (!quiz) notFound();

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("id", { ascending: true });

  const isStaff = await isClassroomStaff(
    supabase,
    id,
    user.id,
    classroom.host_id
  );
  const quizClosed = Boolean(quiz.closed_at);
  const questionList = questions ?? [];
  const questionIds = questionList.map((q) => q.id);

  const { data: myChildren } = await supabase
    .from("child_profiles")
    .select("id, display_name")
    .eq("parent_user_id", user.id);

  const myChildIds = (myChildren ?? []).map((child) => child.id);
  let admittedChildren: { id: string; display_name: string }[] = [];

  if (myChildIds.length > 0) {
    const { data: lobby } = await supabase
      .from("session_lobby")
      .select("child_profile_id")
      .eq("lesson_id", lessonId)
      .eq("status", "admitted")
      .in("child_profile_id", myChildIds);
    const admittedIds = new Set((lobby ?? []).map((row) => row.child_profile_id));
    admittedChildren = (myChildren ?? []).filter((child) =>
      admittedIds.has(child.id)
    );
  }

  const { data: lesson } = await supabase
    .from("kids_lessons")
    .select("status")
    .eq("id", lessonId)
    .eq("classroom_id", id)
    .maybeSingle();

  if (!isStaff && lesson?.status !== "active") {
    redirect(`/kids/join?classroom=${id}`);
  }

  if (!isStaff && admittedChildren.length === 0) {
    redirect(`/kids/classrooms/${id}/lesson/${lessonId}`);
  }

  const { data: responseRows } =
    questionIds.length > 0
      ? await supabase
          .from("quiz_responses")
          .select(
            "id, question_id, child_profile_id, answer, is_correct, teacher_grade, child_profiles(display_name)"
          )
          .in("question_id", questionIds)
      : { data: [] };

  const classResponses = (responseRows ?? []).map((row) => {
    const profile = Array.isArray(row.child_profiles)
      ? row.child_profiles[0]
      : row.child_profiles;
    return {
      id: row.id,
      question_id: row.question_id,
      child_profile_id: row.child_profile_id,
      answer: row.answer,
      is_correct: row.is_correct,
      teacher_grade: row.teacher_grade,
      child_name: profile?.display_name ?? "Child",
    };
  });

  const existingByChild: Record<
    string,
    Record<string, { answer: string; is_correct: boolean | null }>
  > = {};
  for (const row of classResponses) {
    if (!admittedChildren.some((child) => child.id === row.child_profile_id)) {
      continue;
    }
    if (!existingByChild[row.child_profile_id]) {
      existingByChild[row.child_profile_id] = {};
    }
    existingByChild[row.child_profile_id][row.question_id] = {
      answer: row.answer,
      is_correct: row.is_correct,
    };
  }

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="border-b border-sky-200 bg-white px-6 py-4">
        <Link
          href={`/kids/classrooms/${id}/lesson/${lessonId}`}
          className="text-sm text-sky-700 hover:underline"
        >
          ← Back to lesson
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Baby className="h-8 w-8 text-sky-500" />
          <h1 className="text-2xl font-bold text-sky-900">{quiz.title}</h1>
        </div>
        <p className="text-sky-700">
          {isStaff
            ? "Teacher view · review answers with the class"
            : "Quiz time · pick an answer for each question"}
        </p>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-6 py-10">
        {!isStaff ? <KidsSessionGuard lessonId={lessonId} enabled /> : null}
        {isStaff ? (
          <>
            <QuizTeacherTools
              classroomId={id}
              lessonId={lessonId}
              quizId={quizId}
              quizClosed={quizClosed}
            />
            {questionList.map((q, index) => (
              <QuizQuestionCard
                key={q.id}
                classroomId={id}
                lessonId={lessonId}
                quizId={quizId}
                index={index}
                question={q}
              />
            ))}
            <QuizClassResults
              classroomId={id}
              lessonId={lessonId}
              quizId={quizId}
              questions={questionList}
              responses={classResponses}
            />
          </>
        ) : (
          <QuizSubmitForm
            classroomId={id}
            lessonId={lessonId}
            quizId={quizId}
            questions={questionList}
            childrenOptions={admittedChildren}
            existingByChild={existingByChild}
            quizClosed={quizClosed}
          />
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={`/kids/classrooms/${id}/lesson/${lessonId}`}>
            <Button variant="outline">Back to lesson</Button>
          </Link>
          <Link href={isStaff ? `/kids/classrooms/${id}` : `/kids/join?classroom=${id}`}>
            <Button variant="secondary">
              {isStaff ? "Classroom" : "Join a class"}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
