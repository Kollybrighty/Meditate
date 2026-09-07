"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  addClassroomTeacher,
  removeClassroomTeacher,
  type ClassroomActionState,
} from "@/app/kids/classrooms/[id]/actions";

export type ClassroomTeacher = {
  user_id: string;
  role: string;
  full_name: string;
  username: string;
};

const initialState: ClassroomActionState = {};

export default function CoTeacherPanel({
  classroomId,
  teachers,
  hostId,
  isOwner,
}: {
  classroomId: string;
  teachers: ClassroomTeacher[];
  hostId: string;
  isOwner: boolean;
}) {
  const [addState, addAction, adding] = useActionState(
    addClassroomTeacher,
    initialState
  );
  const [removeState, removeAction, removing] = useActionState(
    removeClassroomTeacher,
    initialState
  );

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="font-semibold text-sky-900">Teachers</h2>
      <p className="mt-1 text-sm text-stone-600">
        Co-teachers can run live sessions, admit children, and grade quizzes.
      </p>

      <ul className="mt-4 space-y-2">
        {teachers.map((teacher) => (
          <li
            key={teacher.user_id}
            className="flex items-center justify-between gap-3 rounded-lg border border-sky-100 px-4 py-3"
          >
            <div>
              <p className="font-medium text-stone-800">
                {teacher.full_name || teacher.username}
              </p>
              <p className="text-xs uppercase tracking-wide text-sky-700">
                {teacher.user_id === hostId ? "Host" : teacher.role}
              </p>
            </div>
            {isOwner && teacher.user_id !== hostId ? (
              <form action={removeAction}>
                <input type="hidden" name="classroomId" value={classroomId} />
                <input type="hidden" name="teacherId" value={teacher.user_id} />
                <Button type="submit" size="sm" variant="outline" disabled={removing}>
                  Remove
                </Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>

      {isOwner ? (
        <form action={addAction} className="mt-4 space-y-3">
          <input type="hidden" name="classroomId" value={classroomId} />
          <label htmlFor="teacher-handle" className="block text-sm font-medium">
            Add co-teacher by email or username
          </label>
          <Input
            id="teacher-handle"
            name="handle"
            required
            placeholder="teacher@church.org"
          />
          <Button type="submit" size="sm" disabled={adding}>
            {adding ? "Adding…" : "Add co-teacher"}
          </Button>
        </form>
      ) : null}

      {addState.error || removeState.error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {addState.error || removeState.error}
        </p>
      ) : null}
      {addState.success || removeState.success ? (
        <p className="mt-3 text-sm text-emerald-700" role="status">
          {addState.success || removeState.success}
        </p>
      ) : null}
    </section>
  );
}
