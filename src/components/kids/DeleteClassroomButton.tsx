"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  deleteClassroom,
  type ClassroomActionState,
} from "@/app/kids/classrooms/[id]/actions";

const initialState: ClassroomActionState = {};

export default function DeleteClassroomButton({
  classroomId,
  classroomName,
}: {
  classroomId: string;
  classroomName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteClassroom, initialState);

  useEffect(() => {
    if (state.error) setConfirming(false);
  }, [state.error]);

  if (!confirming) {
    return (
      <div className="space-y-2">
        <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
          Delete classroom
        </Button>
        {state.error ? (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-900">
        Delete <span className="font-medium">{classroomName}</span>? This removes the class,
        enrollments, and lessons. This cannot be undone.
      </p>
      <div className="flex flex-wrap gap-2">
        <form action={formAction}>
          <input type="hidden" name="classroomId" value={classroomId} />
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Deleting…" : "Yes, delete class"}
          </Button>
        </form>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
