"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  updateGroupStartDate,
  type UpdateStartDateState,
} from "@/app/groups/[id]/actions";

type StartDateEditorProps = {
  groupId: string;
  startDate: string | null;
  canEdit: boolean;
};

const initialState: UpdateStartDateState = {};

export default function StartDateEditor({
  groupId,
  startDate,
  canEdit,
}: StartDateEditorProps) {
  const [state, formAction, pending] = useActionState(
    updateGroupStartDate,
    initialState
  );

  const formatted = startDate
    ? new Date(`${startDate}T00:00:00`).toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not set yet";

  if (!canEdit) {
    return (
      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-semibold">Plan start date</h2>
        <p className="mt-2 text-stone-700">{formatted}</p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
      <h2 className="font-semibold">Plan start date</h2>
      <p className="mt-1 text-sm text-stone-600">
        Set when the group is ready to begin. You can change this later.
      </p>
      <p className="mt-3 text-sm text-stone-700">
        Current: <span className="font-medium">{formatted}</span>
      </p>
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="groupId" value={groupId} />
        <div>
          <label htmlFor="startDate" className="mb-1 block text-sm font-medium">
            Start date
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={startDate ?? ""}
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : startDate ? "Update date" : "Set start date"}
        </Button>
      </form>
      {state.error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mt-3 text-sm text-emerald-700" role="status">
          Start date saved.
        </p>
      ) : null}
    </section>
  );
}
