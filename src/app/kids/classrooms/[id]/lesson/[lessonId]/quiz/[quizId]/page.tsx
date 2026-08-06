import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

  const isHost = classroom.host_id === user.id;

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
          {isHost ? "Teacher view · review answers with the class" : "Quiz time"}
        </p>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-6 py-10">
        {(questions ?? []).map((q, index) => {
          const options = Array.isArray(q.options) ? (q.options as string[]) : [];
          return (
            <section
              key={q.id}
              className="rounded-xl border border-sky-200 bg-white p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Question {index + 1} · {q.question_type.replace(/_/g, " ")}
              </p>
              <h2 className="mt-2 font-semibold text-stone-900">{q.question_text}</h2>
              {options.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {options.map((opt) => (
                    <li
                      key={opt}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        isHost && q.correct_answer === opt
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-stone-200 bg-stone-50 text-stone-700"
                      }`}
                    >
                      {opt}
                      {isHost && q.correct_answer === opt ? " ✓" : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              {q.question_type === "true_false" && isHost ? (
                <p className="mt-3 text-sm text-emerald-800">
                  Answer: {q.correct_answer ?? "—"}
                </p>
              ) : null}
              {q.question_type === "short_answer" ? (
                <p className="mt-3 text-sm text-stone-600">
                  {isHost
                    ? "Discuss answers together and grade as a class."
                    : "Share your answer with your teacher."}
                </p>
              ) : null}
            </section>
          );
        })}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={`/kids/classrooms/${id}/lesson/${lessonId}`}>
            <Button variant="outline">Back to lesson</Button>
          </Link>
          <Link href={`/kids/classrooms/${id}`}>
            <Button variant="secondary">Classroom</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
