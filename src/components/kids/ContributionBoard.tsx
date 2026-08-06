"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  addBoardContribution,
  type LessonActionState,
} from "@/app/kids/classrooms/[id]/lesson/[lessonId]/session-actions";

type Contribution = {
  id: string;
  body: string;
  is_teacher: boolean | null;
  created_at: string;
};

const initialState: LessonActionState = {};

export default function ContributionBoard({
  classroomId,
  lessonId,
  isHost,
  contributions,
}: {
  classroomId: string;
  lessonId: string;
  isHost: boolean;
  contributions: Contribution[];
}) {
  const [state, formAction, pending] = useActionState(addBoardContribution, initialState);

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="font-semibold text-sky-900">Contribution panel</h2>
      <p className="mt-1 text-sm text-stone-600">
        Share thoughts, questions, or prayer points during the lesson.
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="classroomId" value={classroomId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="isTeacher" value={isHost ? "true" : "false"} />
        <label htmlFor="body" className="mb-1 block text-sm font-medium">
          Add a contribution
        </label>
        <Input id="body" name="body" required placeholder="What stood out in this story?" />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Post"}
        </Button>
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

      <ul className="mt-6 space-y-3">
        {contributions.length === 0 ? (
          <li className="text-sm text-stone-500">No contributions yet.</li>
        ) : (
          contributions.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-sky-100 bg-sky-50/40 px-4 py-3"
            >
              <p className="text-stone-800">{item.body}</p>
              <p className="mt-1 text-xs text-stone-500">
                {item.is_teacher ? "Teacher" : "Family"} ·{" "}
                {new Date(item.created_at).toLocaleString()}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
