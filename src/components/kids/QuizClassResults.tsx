"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { quizChoiceLabel, scoreQuizResponses } from "@/lib/kids/quiz";
import {
  gradeQuizResponse,
  type QuizSubmitState,
} from "@/app/kids/classrooms/[id]/lesson/[lessonId]/quiz/[quizId]/actions";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  correct_answer: string | null;
  options: unknown;
};

type ResponseRow = {
  id: string;
  question_id: string;
  child_profile_id: string;
  answer: string;
  is_correct: boolean | null;
  teacher_grade: string | null;
  child_name: string;
};

const initialState: QuizSubmitState = {};

export default function QuizClassResults({
  classroomId,
  lessonId,
  quizId,
  questions,
  responses,
}: {
  classroomId: string;
  lessonId: string;
  quizId: string;
  questions: Question[];
  responses: ResponseRow[];
}) {
  const [state, formAction, pending] = useActionState(
    gradeQuizResponse,
    initialState
  );
  const byChild = new Map<string, { name: string; rows: ResponseRow[] }>();

  for (const row of responses) {
    const existing = byChild.get(row.child_profile_id);
    if (existing) {
      existing.rows.push(row);
    } else {
      byChild.set(row.child_profile_id, { name: row.child_name, rows: [row] });
    }
  }

  const children = Array.from(byChild.entries());

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="font-semibold text-sky-900">Class answers</h2>
      {children.length === 0 ? (
        <p className="mt-2 text-sm text-stone-600">
          No answers yet. Students submit from this page after they are admitted.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {children.map(([childId, group]) => {
            const score = scoreQuizResponses(group.rows);
            return (
              <li
                key={childId}
                className="rounded-lg border border-sky-100 bg-sky-50/40 px-4 py-3"
              >
                <p className="font-medium text-stone-900">{group.name}</p>
                <p className="text-sm text-stone-600">
                  {score.graded > 0
                    ? `${score.correct} of ${score.graded} graded correct`
                    : "Written answers to review"}
                </p>
                <ul className="mt-3 space-y-3 text-sm">
                  {questions.map((question, index) => {
                    const response = group.rows.find(
                      (row) => row.question_id === question.id
                    );
                    const needsGrade =
                      Boolean(response) &&
                      (question.question_type === "short_answer" ||
                        response?.is_correct === null);
                    return (
                      <li key={question.id} className="text-stone-700">
                        <span className="font-medium">Q{index + 1}.</span>{" "}
                        {response
                          ? quizChoiceLabel(question.question_type, response.answer)
                          : "No answer"}
                        {response?.teacher_grade
                          ? ` · ${response.teacher_grade}`
                          : response?.is_correct === true
                            ? " · correct"
                            : response?.is_correct === false
                              ? " · incorrect"
                              : response
                                ? " · review"
                                : ""}
                        {needsGrade && response ? (
                          <form action={formAction} className="mt-2 flex flex-wrap gap-2">
                            <input type="hidden" name="classroomId" value={classroomId} />
                            <input type="hidden" name="lessonId" value={lessonId} />
                            <input type="hidden" name="quizId" value={quizId} />
                            <input type="hidden" name="responseId" value={response.id} />
                            <Button
                              type="submit"
                              name="grade"
                              value="correct"
                              size="sm"
                              disabled={pending}
                            >
                              Correct
                            </Button>
                            <Button
                              type="submit"
                              name="grade"
                              value="partial"
                              size="sm"
                              variant="outline"
                              disabled={pending}
                            >
                              Partial
                            </Button>
                            <Button
                              type="submit"
                              name="grade"
                              value="incorrect"
                              size="sm"
                              variant="secondary"
                              disabled={pending}
                            >
                              Incorrect
                            </Button>
                          </form>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
      {state.error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mt-3 text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}
    </section>
  );
}
