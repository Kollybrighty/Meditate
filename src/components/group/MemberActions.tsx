"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  updateGroupMember,
  type MemberManageState,
} from "@/app/groups/[id]/actions";

const initialState: MemberManageState = {};

export default function MemberActions({
  groupId,
  targetUserId,
  targetName,
  canPromote,
  canDemote,
  canKick,
}: {
  groupId: string;
  targetUserId: string;
  targetName: string;
  canPromote: boolean;
  canDemote: boolean;
  canKick: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateGroupMember,
    initialState
  );

  if (!canPromote && !canDemote && !canKick) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {canPromote ? (
        <form action={formAction}>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="targetUserId" value={targetUserId} />
          <input type="hidden" name="action" value="promote" />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            Make admin
          </Button>
        </form>
      ) : null}
      {canDemote ? (
        <form action={formAction}>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="targetUserId" value={targetUserId} />
          <input type="hidden" name="action" value="demote" />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            Remove admin
          </Button>
        </form>
      ) : null}
      {canKick ? (
        <form
          action={formAction}
          onSubmit={(event) => {
            if (!window.confirm(`Remove ${targetName} from this group?`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="targetUserId" value={targetUserId} />
          <input type="hidden" name="action" value="kick" />
          <Button type="submit" size="sm" variant="ghost" disabled={pending}>
            Remove
          </Button>
        </form>
      ) : null}
      {state.error ? (
        <p className="w-full text-xs text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="w-full text-xs text-emerald-700">{state.success}</p>
      ) : null}
    </div>
  );
}

export function LeaveGroupButton({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateGroupMember,
    initialState
  );

  return (
    <form
      action={formAction}
      className="mt-8"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Leave this group? You can rejoin with an invite later."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="targetUserId" value={userId} />
      <input type="hidden" name="action" value="leave" />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Leaving…" : "Leave group"}
      </Button>
      {state.error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
