"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  startKidsLesson,
  type ClassroomActionState,
} from "@/app/kids/classrooms/[id]/actions";

const initialState: ClassroomActionState = {};

export default function StartLessonForm({ classroomId }: { classroomId: string }) {
  const [state, formAction, pending] = useActionState(startKidsLesson, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="classroomId" value={classroomId} />
      <div className="min-w-[220px] flex-1">
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Lesson title
        </label>
        <Input id="title" name="title" placeholder="David and Goliath" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Starting…" : "Start session"}
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
