export type QuizQuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer";

export function normalizeQuizAnswer(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

export function quizChoiceOptions(
  questionType: string,
  options: unknown
): string[] {
  if (Array.isArray(options)) {
    const listed = options.filter((item): item is string => typeof item === "string");
    if (listed.length > 0) return listed;
  }
  if (questionType === "true_false") return ["true", "false"];
  return [];
}

export function quizChoiceLabel(questionType: string, value: string): string {
  if (questionType === "true_false") {
    if (value.toLowerCase() === "true") return "True";
    if (value.toLowerCase() === "false") return "False";
  }
  return value;
}

export function gradeQuizAnswer(options: {
  questionType: string;
  correctAnswer: string | null;
  submitted: string;
}): boolean | null {
  if (options.questionType === "short_answer") return null;
  if (!options.correctAnswer?.trim()) return null;
  return (
    normalizeQuizAnswer(options.submitted) ===
    normalizeQuizAnswer(options.correctAnswer)
  );
}

export function scoreQuizResponses(
  responses: { is_correct: boolean | null }[]
): { correct: number; graded: number; total: number } {
  const graded = responses.filter((row) => row.is_correct !== null).length;
  const correct = responses.filter((row) => row.is_correct === true).length;
  return { correct, graded, total: responses.length };
}

export function collectQuizAnswers(
  formData: FormData,
  questionIds: string[]
): { answers: Map<string, string>; missing: string[] } {
  const answers = new Map<string, string>();
  const missing: string[] = [];

  for (const id of questionIds) {
    const raw = formData.get(`answer-${id}`);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      missing.push(id);
      continue;
    }
    answers.set(id, value);
  }

  return { answers, missing };
}

export type ParsedCustomQuestion = {
  question_text: string;
  question_type: QuizQuestionType;
  options: string[] | null;
  correct_answer: string | null;
  source: "teacher_custom";
};

export function parseCustomQuestion(input: {
  questionText: string;
  questionType: string;
  optionsText: string;
  correctAnswer: string;
}): { ok: true; question: ParsedCustomQuestion } | { ok: false; error: string } {
  const question_text = input.questionText.trim();
  if (!question_text) return { ok: false, error: "Write the question first." };

  const questionType = input.questionType.trim();
  if (
    questionType !== "multiple_choice" &&
    questionType !== "true_false" &&
    questionType !== "short_answer"
  ) {
    return { ok: false, error: "Choose a question type." };
  }

  if (questionType === "short_answer") {
    return {
      ok: true,
      question: {
        question_text,
        question_type: "short_answer",
        options: null,
        correct_answer: null,
        source: "teacher_custom",
      },
    };
  }

  if (questionType === "true_false") {
    const correct = normalizeQuizAnswer(input.correctAnswer);
    if (correct !== "true" && correct !== "false") {
      return { ok: false, error: "Mark the true/false answer." };
    }
    return {
      ok: true,
      question: {
        question_text,
        question_type: "true_false",
        options: ["true", "false"],
        correct_answer: correct,
        source: "teacher_custom",
      },
    };
  }

  const options = input.optionsText
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (options.length < 2) {
    return { ok: false, error: "Add at least two answer choices." };
  }
  const correct_answer = input.correctAnswer.trim();
  if (!correct_answer || !options.includes(correct_answer)) {
    return {
      ok: false,
      error: "The correct answer must match one of the choices exactly.",
    };
  }
  return {
    ok: true,
    question: {
      question_text,
      question_type: "multiple_choice",
      options,
      correct_answer,
      source: "teacher_custom",
    },
  };
}

export type TeacherGrade = "correct" | "partial" | "incorrect";

export function parseTeacherGrade(raw: string): TeacherGrade | null {
  if (raw === "correct" || raw === "partial" || raw === "incorrect") return raw;
  return null;
}

export function teacherGradeToCorrect(grade: TeacherGrade): boolean | null {
  if (grade === "correct") return true;
  if (grade === "incorrect") return false;
  return null;
}

export function quizOptionsText(options: unknown): string {
  if (!Array.isArray(options)) return "";
  return options.filter((item): item is string => typeof item === "string").join("\n");
}
