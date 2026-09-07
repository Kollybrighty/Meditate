"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  addCustomQuizQuestion,
  closeQuiz,
  type QuizSubmitState,
} from "@/app/kids/classrooms/[id]/lesson/[lessonId]/quiz/[quizId]/actions";

const initialState: QuizSubmitState = {};

export default function QuizTeacherTools({
  classroomId,
  lessonId,
  quizId,
  quizClosed,
}: {
  classroomId: string;
  lessonId: string;
  quizId: string;
  quizClosed: boolean;
}) {
  const [closeState, closeAction, closing] = useActionState(closeQuiz, initialState);
  const [addState, addAction, adding] = useActionState(
    addCustomQuizQuestion,
    initialState
  );
  const [questionType, setQuestionType] = useState("multiple_choice");

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="font-semibold text-sky-900">Teacher quiz tools</h2>
      <p className="mt-1 text-sm text-stone-600">
        Add your own questions, then close the quiz when everyone has answered.
      </p>

      <form action={closeAction} className="mt-4">
        <input type="hidden" name="classroomId" value={classroomId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="quizId" value={quizId} />
        <input type="hidden" name="reopen" value={quizClosed ? "true" : "false"} />
        <Button type="submit" size="sm" variant={quizClosed ? "outline" : "secondary"} disabled={closing}>
          {closing ? "Saving…" : quizClosed ? "Reopen quiz" : "Close quiz"}
        </Button>
      </form>
      {closeState.error ? (
        <p className="mt-2 text-sm text-red-700">{closeState.error}</p>
      ) : null}
      {closeState.success ? (
        <p className="mt-2 text-sm text-emerald-700">{closeState.success}</p>
      ) : null}

      {quizClosed ? (
        <p className="mt-4 text-sm text-stone-500">
          Reopen the quiz to add more questions.
        </p>
      ) : (
        <form action={addAction} className="mt-6 space-y-3 border-t border-sky-100 pt-4">
          <input type="hidden" name="classroomId" value={classroomId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="quizId" value={quizId} />
          <h3 className="text-sm font-semibold text-sky-900">Add a question</h3>
          <div>
            <label htmlFor="questionText" className="mb-1 block text-sm font-medium">
              Question
            </label>
            <Input id="questionText" name="questionText" required placeholder="What did David take with him?" />
          </div>
          <div>
            <label htmlFor="questionType" className="mb-1 block text-sm font-medium">
              Type
            </label>
            <select
              id="questionType"
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
                <label htmlFor="optionsText" className="mb-1 block text-sm font-medium">
                  Choices (one per line)
                </label>
                <Textarea
                  id="optionsText"
                  name="optionsText"
                  rows={4}
                  placeholder={"A sling\nA sword\nA chariot"}
                />
              </div>
              <div>
                <label htmlFor="correctAnswer" className="mb-1 block text-sm font-medium">
                  Correct choice (must match a line above)
                </label>
                <Input id="correctAnswer" name="correctAnswer" placeholder="A sling" />
              </div>
            </>
          ) : null}
          {questionType === "true_false" ? (
            <div>
              <label htmlFor="correctAnswerTf" className="mb-1 block text-sm font-medium">
                Correct answer
              </label>
              <select
                id="correctAnswerTf"
                name="correctAnswer"
                className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
                defaultValue="true"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          ) : null}
          <Button type="submit" size="sm" disabled={adding}>
            {adding ? "Adding…" : "Add question"}
          </Button>
          {addState.error ? (
            <p className="text-sm text-red-700" role="alert">
              {addState.error}
            </p>
          ) : null}
          {addState.success ? (
            <p className="text-sm text-emerald-700" role="status">
              {addState.success}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}
