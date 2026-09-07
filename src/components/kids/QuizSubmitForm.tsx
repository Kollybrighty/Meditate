"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  submitQuizAnswers,
  type QuizSubmitState,
} from "@/app/kids/classrooms/[id]/lesson/[lessonId]/quiz/[quizId]/actions";
import {
  quizChoiceLabel,
  quizChoiceOptions,
} from "@/lib/kids/quiz";

export type QuizQuestion = {
  id: string;
  question_text: string;
  question_type: string;
  options: unknown;
};

export type QuizChildOption = {
  id: string;
  display_name: string;
};

type ExistingAnswer = {
  answer: string;
  is_correct: boolean | null;
};

const initialState: QuizSubmitState = {};

export default function QuizSubmitForm({
  classroomId,
  lessonId,
  quizId,
  questions,
  childrenOptions,
  existingByChild,
  quizClosed,
}: {
  classroomId: string;
  lessonId: string;
  quizId: string;
  questions: QuizQuestion[];
  childrenOptions: QuizChildOption[];
  existingByChild: Record<string, Record<string, ExistingAnswer>>;
  quizClosed: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    submitQuizAnswers,
    initialState
  );
  const defaultChildId = childrenOptions[0]?.id ?? "";
  const [selectedChildId, setSelectedChildId] = useState(defaultChildId);
  const existingByQuestion = existingByChild[selectedChildId] ?? {};
  const hasExisting = Object.keys(existingByQuestion).length > 0;

  if (childrenOptions.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        Admit a child to the session before they can submit answers.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="classroomId" value={classroomId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="quizId" value={quizId} />
      {quizClosed ? (
        <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
          This quiz is closed. You can review answers you already sent.
        </p>
      ) : null}

      {childrenOptions.length === 1 ? (
        <input type="hidden" name="childId" value={defaultChildId} />
      ) : (
        <div>
          <label htmlFor="childId" className="mb-1 block text-sm font-medium">
            Answering as
          </label>
          <select
            id="childId"
            name="childId"
            required
            value={selectedChildId}
            onChange={(event) => setSelectedChildId(event.target.value)}
            className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
          >
            {childrenOptions.map((child) => (
              <option key={child.id} value={child.id}>
                {child.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {questions.map((question, index) => {
        const choices = quizChoiceOptions(question.question_type, question.options);
        const existing = existingByQuestion[question.id];
        return (
          <section
            key={question.id}
            className="rounded-xl border border-sky-200 bg-white p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Question {index + 1} · {question.question_type.replace(/_/g, " ")}
            </p>
            <h2 className="mt-2 font-semibold text-stone-900">
              {question.question_text}
            </h2>

            {choices.length > 0 ? (
              <fieldset className="mt-4 space-y-2">
                <legend className="sr-only">{question.question_text}</legend>
                {choices.map((choice) => (
                  <label
                    key={choice}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50"
                  >
                    <input
                      type="radio"
                      name={`answer-${question.id}`}
                      value={choice}
                      required
                      disabled={quizClosed}
                      key={`${selectedChildId}-${question.id}-${choice}`}
                      defaultChecked={existing?.answer === choice}
                      className="h-4 w-4"
                    />
                    {quizChoiceLabel(question.question_type, choice)}
                  </label>
                ))}
              </fieldset>
            ) : (
              <div className="mt-4">
                <label
                  htmlFor={`answer-${question.id}`}
                  className="mb-1 block text-sm font-medium"
                >
                  Your answer
                </label>
                <Textarea
                  id={`answer-${question.id}`}
                  name={`answer-${question.id}`}
                  required
                  rows={3}
                  disabled={quizClosed}
                  key={`${selectedChildId}-${question.id}`}
                  defaultValue={existing?.answer ?? ""}
                  placeholder="Write a short answer"
                />
              </div>
            )}

            {existing ? (
              <p className="mt-3 text-sm text-stone-600">
                {existing.is_correct === true
                  ? "Saved answer: correct."
                  : existing.is_correct === false
                    ? "Saved answer: not quite — you can change it and submit again."
                    : "Saved. The teacher will review this written answer."}
              </p>
            ) : null}
          </section>
        );
      })}

      {quizClosed ? null : (
        <Button type="submit" disabled={pending}>
          {pending
            ? "Submitting…"
            : hasExisting
              ? "Update answers"
              : "Submit answers"}
        </Button>
      )}
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
