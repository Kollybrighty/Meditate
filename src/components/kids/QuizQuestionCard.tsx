"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  deleteQuizQuestion,
  updateQuizQuestion,
  type QuizSubmitState,
} from "@/app/kids/classrooms/[id]/lesson/[lessonId]/quiz/[quizId]/actions";
import {
  quizChoiceLabel,
  quizChoiceOptions,
  quizOptionsText,
} from "@/lib/kids/quiz";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  options: unknown;
  correct_answer: string | null;
};

const initialState: QuizSubmitState = {};

export default function QuizQuestionCard({
  classroomId,
  lessonId,
  quizId,
  question,
  index,
}: {
  classroomId: string;
  lessonId: string;
  quizId: string;
  question: Question;
  index: number;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [questionType, setQuestionType] = useState(question.question_type);
  const [updateState, updateAction, updating] = useActionState(
    updateQuizQuestion,
    initialState
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteQuizQuestion,
    initialState
  );
  const options = quizChoiceOptions(question.question_type, question.options);

  useEffect(() => {
    if (updateState.success) setEditing(false);
  }, [updateState.success]);

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
        Question {index + 1} · {question.question_type.replace(/_/g, " ")}
      </p>

      {editing ? (
        <form action={updateAction} className="mt-3 space-y-3">
          <input type="hidden" name="classroomId" value={classroomId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="quizId" value={quizId} />
          <input type="hidden" name="questionId" value={question.id} />
          <div>
            <label
              htmlFor={`edit-text-${question.id}`}
              className="mb-1 block text-sm font-medium"
            >
              Question
            </label>
            <Input
              id={`edit-text-${question.id}`}
              name="questionText"
              required
              defaultValue={question.question_text}
            />
          </div>
          <div>
            <label
              htmlFor={`edit-type-${question.id}`}
              className="mb-1 block text-sm font-medium"
            >
              Type
            </label>
            <select
              id={`edit-type-${question.id}`}
              name="questionType"
              value={questionType}
              onChange={(event) => setQuestionType(event.target.value)}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
            >
              <option value="multiple_choice">Multiple choice</option>
              <option value="true_false">True / false</option>
              <option value="short_answer">Short answer</option>
            </select>
          </div>
          {questionType === "multiple_choice" ? (
            <>
              <div>
                <label
                  htmlFor={`edit-options-${question.id}`}
                  className="mb-1 block text-sm font-medium"
                >
                  Choices (one per line)
                </label>
                <Textarea
                  id={`edit-options-${question.id}`}
                  name="optionsText"
                  rows={4}
                  defaultValue={quizOptionsText(question.options)}
                />
              </div>
              <div>
                <label
                  htmlFor={`edit-correct-${question.id}`}
                  className="mb-1 block text-sm font-medium"
                >
                  Correct choice
                </label>
                <Input
                  id={`edit-correct-${question.id}`}
                  name="correctAnswer"
                  defaultValue={question.correct_answer ?? ""}
                />
              </div>
            </>
          ) : null}
          {questionType === "true_false" ? (
            <div>
              <label
                htmlFor={`edit-tf-${question.id}`}
                className="mb-1 block text-sm font-medium"
              >
                Correct answer
              </label>
              <select
                id={`edit-tf-${question.id}`}
                name="correctAnswer"
                className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
                defaultValue={question.correct_answer === "false" ? "false" : "true"}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={updating}>
              {updating ? "Saving…" : "Save question"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
          {updateState.error ? (
            <p className="text-sm text-red-700" role="alert">
              {updateState.error}
            </p>
          ) : null}
        </form>
      ) : (
        <>
          <h2 className="mt-2 font-semibold text-stone-900">{question.question_text}</h2>
          {options.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {options.map((opt) => (
                <li
                  key={opt}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    question.correct_answer === opt
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-stone-200 bg-stone-50 text-stone-700"
                  }`}
                >
                  {quizChoiceLabel(question.question_type, opt)}
                  {question.correct_answer === opt ? " ✓" : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {question.question_type === "short_answer" ? (
            <p className="mt-3 text-sm text-stone-600">
              Discuss written answers together and grade as a class.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {confirmDelete ? (
              <form action={deleteAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="classroomId" value={classroomId} />
                <input type="hidden" name="lessonId" value={lessonId} />
                <input type="hidden" name="quizId" value={quizId} />
                <input type="hidden" name="questionId" value={question.id} />
                <Button type="submit" size="sm" variant="secondary" disabled={deleting}>
                  {deleting ? "Deleting…" : "Confirm delete"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            )}
          </div>
          {deleteState.error ? (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {deleteState.error}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
