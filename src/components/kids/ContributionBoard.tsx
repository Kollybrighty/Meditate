"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  addBoardContribution,
  shareBoardContribution,
  type LessonActionState,
} from "@/app/kids/classrooms/[id]/lesson/[lessonId]/session-actions";

type Contribution = {
  id: string;
  body: string;
  is_teacher: boolean | null;
  visibility: string;
  is_pinned: boolean | null;
  shared_by_teacher: boolean | null;
  created_at: string;
};

const initialState: LessonActionState = {};

export default function ContributionBoard({
  classroomId,
  lessonId,
  isStaff,
  contributions,
}: {
  classroomId: string;
  lessonId: string;
  isStaff: boolean;
  contributions: Contribution[];
}) {
  const [state, formAction, pending] = useActionState(
    addBoardContribution,
    initialState
  );
  const [shareState, shareAction, sharing] = useActionState(
    shareBoardContribution,
    initialState
  );

  const sorted = [...contributions].sort((a, b) => {
    if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) {
      return a.is_pinned ? -1 : 1;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="font-semibold text-sky-900">Contribution panel</h2>
      <p className="mt-1 text-sm text-stone-600">
        Share thoughts, questions, or prayer points during the lesson. Family posts
        stay with the teacher until they are shared with the class.
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="classroomId" value={classroomId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="isTeacher" value={isStaff ? "true" : "false"} />
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
        {sorted.length === 0 ? (
          <li className="text-sm text-stone-500">No contributions yet.</li>
        ) : (
          sorted.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-sky-100 bg-sky-50/40 px-4 py-3"
            >
              <p className="text-stone-800">{item.body}</p>
              <p className="mt-1 text-xs text-stone-500">
                {item.is_teacher ? "Teacher" : "Family"}
                {item.is_pinned ? " · pinned" : ""}
                {item.visibility === "teacher_only" ? " · teacher only" : " · shared"}
                {" · "}
                {new Date(item.created_at).toLocaleString()}
              </p>
              {isStaff && !item.is_teacher ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={shareAction}>
                    <input type="hidden" name="classroomId" value={classroomId} />
                    <input type="hidden" name="lessonId" value={lessonId} />
                    <input type="hidden" name="contributionId" value={item.id} />
                    <input
                      type="hidden"
                      name="share"
                      value={item.visibility === "class" ? "false" : "true"}
                    />
                    <Button type="submit" size="sm" variant="outline" disabled={sharing}>
                      {item.visibility === "class" ? "Hide from class" : "Share with class"}
                    </Button>
                  </form>
                  <form action={shareAction}>
                    <input type="hidden" name="classroomId" value={classroomId} />
                    <input type="hidden" name="lessonId" value={lessonId} />
                    <input type="hidden" name="contributionId" value={item.id} />
                    <input
                      type="hidden"
                      name="pin"
                      value={item.is_pinned ? "false" : "true"}
                    />
                    <Button type="submit" size="sm" variant="outline" disabled={sharing}>
                      {item.is_pinned ? "Unpin" : "Pin"}
                    </Button>
                  </form>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
      {shareState.error ? (
        <p className="mt-3 text-sm text-red-700">{shareState.error}</p>
      ) : null}
    </section>
  );
}
