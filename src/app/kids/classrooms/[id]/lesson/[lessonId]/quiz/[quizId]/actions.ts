"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  collectQuizAnswers,
  gradeQuizAnswer,
  parseCustomQuestion,
  parseTeacherGrade,
  scoreQuizResponses,
  teacherGradeToCorrect,
} from "@/lib/kids/quiz";
import { requireClassroomStaff } from "@/lib/kids/staff";

export type QuizSubmitState = {
  error?: string;
  success?: string;
  correct?: number;
  graded?: number;
};

export async function submitQuizAnswers(
  _prev: QuizSubmitState,
  formData: FormData
): Promise<QuizSubmitState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const quizId = String(formData.get("quizId") ?? "");
  const childId = String(formData.get("childId") ?? "");

  if (!classroomId || !lessonId || !quizId || !childId) {
    return { error: "Choose who is answering, then try again." };
  }

  const { data: child } = await supabase
    .from("child_profiles")
    .select("id, display_name")
    .eq("id", childId)
    .eq("parent_user_id", user.id)
    .maybeSingle();
  if (!child) return { error: "That child profile was not found." };

  const { data: enrollment } = await supabase
    .from("classroom_enrollments")
    .select("classroom_id")
    .eq("classroom_id", classroomId)
    .eq("child_profile_id", childId)
    .maybeSingle();
  if (!enrollment) {
    return { error: "This child is not enrolled in this classroom." };
  }

  const { data: lobby } = await supabase
    .from("session_lobby")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("child_profile_id", childId)
    .eq("status", "admitted")
    .maybeSingle();
  if (!lobby) {
    return { error: "This child must be admitted to the live session first." };
  }

  const { data: quiz } = await supabase
    .from("lesson_quizzes")
    .select("id, closed_at")
    .eq("id", quizId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (!quiz) return { error: "Quiz not found." };
  if (quiz.closed_at) return { error: "This quiz is closed." };

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, question_type, correct_answer")
    .eq("quiz_id", quizId);
  if (!questions || questions.length === 0) {
    return { error: "This quiz has no questions yet." };
  }

  const { answers, missing } = collectQuizAnswers(
    formData,
    questions.map((q) => q.id)
  );
  if (missing.length > 0) {
    return { error: "Answer every question before submitting." };
  }

  const rows = questions.map((question) => {
    const answer = answers.get(question.id) ?? "";
    return {
      question_id: question.id,
      child_profile_id: childId,
      answer,
      is_correct: gradeQuizAnswer({
        questionType: question.question_type,
        correctAnswer: question.correct_answer,
        submitted: answer,
      }),
      submitted_at: new Date().toISOString(),
    };
  });

  const { data: existing } = await supabase
    .from("quiz_responses")
    .select("id, question_id")
    .eq("child_profile_id", childId)
    .in(
      "question_id",
      questions.map((q) => q.id)
    );

  const existingByQuestion = new Map(
    (existing ?? []).map((row) => [row.question_id, row.id])
  );
  const toInsert = rows.filter((row) => !existingByQuestion.has(row.question_id));
  const toUpdate = rows.filter((row) => existingByQuestion.has(row.question_id));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("quiz_responses").insert(toInsert);
    if (error) return { error: error.message };
  }

  for (const row of toUpdate) {
    const id = existingByQuestion.get(row.question_id);
    if (!id) continue;
    const { error } = await supabase
      .from("quiz_responses")
      .update({
        answer: row.answer,
        is_correct: row.is_correct,
        submitted_at: row.submitted_at,
      })
      .eq("id", id)
      .eq("child_profile_id", childId);
    if (error) return { error: error.message };
  }

  const score = scoreQuizResponses(rows);
  const path = `/kids/classrooms/${classroomId}/lesson/${lessonId}/quiz/${quizId}`;
  revalidatePath(path);
  revalidatePath(`/kids/classrooms/${classroomId}/lesson/${lessonId}`);

  const scoreText =
    score.graded > 0
      ? ` ${score.correct} of ${score.graded} auto-graded answers are correct.`
      : " The teacher can review the written answers.";

  return {
    success: `Answers saved for ${child.display_name}.${scoreText}`,
    correct: score.correct,
    graded: score.graded,
  };
}

function quizPath(classroomId: string, lessonId: string, quizId: string) {
  return `/kids/classrooms/${classroomId}/lesson/${lessonId}/quiz/${quizId}`;
}

export async function closeQuiz(
  _prev: QuizSubmitState,
  formData: FormData
): Promise<QuizSubmitState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const quizId = String(formData.get("quizId") ?? "");
  const reopen = formData.get("reopen") === "true";

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };

  const { error } = await supabase
    .from("lesson_quizzes")
    .update({ closed_at: reopen ? null : new Date().toISOString() })
    .eq("id", quizId)
    .eq("lesson_id", lessonId);

  if (error) return { error: error.message };
  revalidatePath(quizPath(classroomId, lessonId, quizId));
  revalidatePath(`/kids/classrooms/${classroomId}/lesson/${lessonId}`);
  return { success: reopen ? "Quiz reopened." : "Quiz closed." };
}

export async function addCustomQuizQuestion(
  _prev: QuizSubmitState,
  formData: FormData
): Promise<QuizSubmitState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const quizId = String(formData.get("quizId") ?? "");

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };

  const parsed = parseCustomQuestion({
    questionText: String(formData.get("questionText") ?? ""),
    questionType: String(formData.get("questionType") ?? ""),
    optionsText: String(formData.get("optionsText") ?? ""),
    correctAnswer: String(formData.get("correctAnswer") ?? ""),
  });
  if (!parsed.ok) return { error: parsed.error };

  const { data: quiz } = await supabase
    .from("lesson_quizzes")
    .select("id, quiz_source, closed_at")
    .eq("id", quizId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (!quiz) return { error: "Quiz not found." };
  if (quiz.closed_at) return { error: "Reopen the quiz before adding questions." };

  const { error } = await supabase.from("quiz_questions").insert({
    quiz_id: quizId,
    question_text: parsed.question.question_text,
    question_type: parsed.question.question_type,
    options: parsed.question.options,
    correct_answer: parsed.question.correct_answer,
    source: parsed.question.source,
    pool_question_id: null,
  });
  if (error) return { error: error.message };

  if (quiz.quiz_source === "auto_pool") {
    await supabase
      .from("lesson_quizzes")
      .update({ quiz_source: "hybrid" })
      .eq("id", quizId);
  }

  revalidatePath(quizPath(classroomId, lessonId, quizId));
  return { success: "Question added." };
}

export async function gradeQuizResponse(
  _prev: QuizSubmitState,
  formData: FormData
): Promise<QuizSubmitState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const quizId = String(formData.get("quizId") ?? "");
  const responseId = String(formData.get("responseId") ?? "");
  const grade = parseTeacherGrade(String(formData.get("grade") ?? ""));

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };
  if (!responseId || !grade) return { error: "Choose a grade." };

  const { error } = await supabase
    .from("quiz_responses")
    .update({
      teacher_grade: grade,
      is_correct: teacherGradeToCorrect(grade),
      graded_by: user.id,
      graded_at: new Date().toISOString(),
    })
    .eq("id", responseId);

  if (error) return { error: error.message };
  revalidatePath(quizPath(classroomId, lessonId, quizId));
  return { success: "Grade saved." };
}

export async function updateQuizQuestion(
  _prev: QuizSubmitState,
  formData: FormData
): Promise<QuizSubmitState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const quizId = String(formData.get("quizId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };
  if (!questionId) return { error: "Missing question." };

  const parsed = parseCustomQuestion({
    questionText: String(formData.get("questionText") ?? ""),
    questionType: String(formData.get("questionType") ?? ""),
    optionsText: String(formData.get("optionsText") ?? ""),
    correctAnswer: String(formData.get("correctAnswer") ?? ""),
  });
  if (!parsed.ok) return { error: parsed.error };

  const { data: question } = await supabase
    .from("quiz_questions")
    .select("id")
    .eq("id", questionId)
    .eq("quiz_id", quizId)
    .maybeSingle();
  if (!question) return { error: "Question not found." };

  const { error } = await supabase
    .from("quiz_questions")
    .update({
      question_text: parsed.question.question_text,
      question_type: parsed.question.question_type,
      options: parsed.question.options,
      correct_answer: parsed.question.correct_answer,
      source: "teacher_custom",
      pool_question_id: null,
    })
    .eq("id", questionId)
    .eq("quiz_id", quizId);

  if (error) return { error: error.message };
  revalidatePath(quizPath(classroomId, lessonId, quizId));
  return { success: "Question updated." };
}

export async function deleteQuizQuestion(
  _prev: QuizSubmitState,
  formData: FormData
): Promise<QuizSubmitState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const quizId = String(formData.get("quizId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };
  if (!questionId) return { error: "Missing question." };

  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("id", questionId)
    .eq("quiz_id", quizId);

  if (error) return { error: error.message };
  revalidatePath(quizPath(classroomId, lessonId, quizId));
  return { success: "Question deleted." };
}
