import { describe, expect, it } from "vitest";
import { canPerformMemberAction } from "./member-actions";

const base = {
  actorUserId: "admin-1",
  actorIsAdmin: true,
  groupCreatorId: "owner-1",
  targetUserId: "member-1",
  targetRole: "member",
};

describe("canPerformMemberAction", () => {
  it("lets an admin promote a member", () => {
    expect(canPerformMemberAction({ ...base, action: "promote" })).toEqual({
      ok: true,
    });
  });

  it("blocks promoting an admin", () => {
    const result = canPerformMemberAction({
      ...base,
      action: "promote",
      targetRole: "admin",
    });
    expect(result.ok).toBe(false);
  });

  it("blocks kicking the creator", () => {
    const result = canPerformMemberAction({
      ...base,
      action: "kick",
      targetUserId: "owner-1",
      targetRole: "owner",
    });
    expect(result.ok).toBe(false);
  });

  it("lets a member leave", () => {
    expect(
      canPerformMemberAction({
        action: "leave",
        actorUserId: "member-1",
        actorIsAdmin: false,
        groupCreatorId: "owner-1",
        targetUserId: "member-1",
        targetRole: "member",
      })
    ).toEqual({ ok: true });
  });

  it("blocks the creator from leaving", () => {
    const result = canPerformMemberAction({
      action: "leave",
      actorUserId: "owner-1",
      actorIsAdmin: true,
      groupCreatorId: "owner-1",
      targetUserId: "owner-1",
      targetRole: "owner",
    });
    expect(result.ok).toBe(false);
  });

  it("blocks a regular member from kicking", () => {
    const result = canPerformMemberAction({
      ...base,
      action: "kick",
      actorUserId: "member-2",
      actorIsAdmin: false,
    });
    expect(result.ok).toBe(false);
  });
});
