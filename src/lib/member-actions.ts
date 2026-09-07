export type MemberRole = "owner" | "admin" | "member";

export type MemberAction = "leave" | "kick" | "promote" | "demote";

export function canPerformMemberAction(options: {
  action: MemberAction;
  actorUserId: string;
  actorIsAdmin: boolean;
  groupCreatorId: string;
  targetUserId: string;
  targetRole: string;
}): { ok: true } | { ok: false; error: string } {
  const {
    action,
    actorUserId,
    actorIsAdmin,
    groupCreatorId,
    targetUserId,
    targetRole,
  } = options;
  const targetIsCreator = targetUserId === groupCreatorId;

  if (action === "leave") {
    if (targetUserId !== actorUserId) {
      return { ok: false, error: "You can only leave for yourself." };
    }
    if (targetIsCreator) {
      return {
        ok: false,
        error: "The group creator cannot leave. Delete the group instead.",
      };
    }
    return { ok: true };
  }

  if (!actorIsAdmin) {
    return { ok: false, error: "Only a group admin can do that." };
  }

  if (targetUserId === actorUserId) {
    return { ok: false, error: "Use leave to remove yourself from the group." };
  }

  if (targetIsCreator) {
    return { ok: false, error: "The group creator cannot be changed or removed." };
  }

  if (action === "kick") {
    return { ok: true };
  }

  if (action === "promote") {
    if (targetRole === "admin" || targetRole === "owner") {
      return { ok: false, error: "That member is already an admin." };
    }
    return { ok: true };
  }

  if (action === "demote") {
    if (targetRole !== "admin") {
      return { ok: false, error: "That member is not an admin." };
    }
    return { ok: true };
  }

  return { ok: false, error: "Unknown action." };
}
