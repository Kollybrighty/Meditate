"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { joinGroupByInvite, type JoinGroupState } from "./actions";

const initialState: JoinGroupState = {};

export default function JoinGroupButton({
  invite,
  groupName,
}: {
  invite: string;
  groupName: string;
}) {
  const [state, formAction, pending] = useActionState(
    joinGroupByInvite,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="invite" value={invite} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Joining…" : `Join ${groupName}`}
      </Button>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
