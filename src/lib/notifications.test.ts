import { describe, expect, it } from "vitest";
import { notificationCopy, notificationHref } from "./notifications";
import { safeNextPath } from "./safe-path";

describe("notifications", () => {
  it("links questions and replies to the thread", () => {
    expect(
      notificationHref({
        type: "forum_question",
        groupId: "g1",
        referenceId: "p1",
      })
    ).toBe("/groups/g1/forum/p1");
    expect(
      notificationHref({
        type: "forum_reply",
        groupId: "g1",
        referenceId: "p1",
      })
    ).toBe("/groups/g1/forum/p1");
  });

  it("describes forum events", () => {
    expect(notificationCopy("forum_question").title).toBe("New question");
    expect(notificationCopy("forum_reply").title).toBe("New reply");
  });

  it("links kids lobby alerts to the live session", () => {
    expect(
      notificationHref({
        type: "kids_lobby",
        groupId: null,
        classroomId: "c1",
        referenceId: "l1",
      })
    ).toBe("/kids/classrooms/c1/lesson/l1");
    expect(notificationCopy("kids_lobby").title).toBe("Child waiting in lobby");
  });
});

describe("safeNextPath", () => {
  it("allows in-app paths used after password reset", () => {
    expect(safeNextPath("/reset-password")).toBe("/reset-password");
    expect(safeNextPath("/notifications")).toBe("/notifications");
    expect(safeNextPath("https://evil.example")).toBe(null);
    expect(safeNextPath("/login")).toBe(null);
  });
});
