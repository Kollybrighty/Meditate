import { describe, expect, it } from "vitest";
import { notificationEmailContent, passwordResetContent } from "./resend";

describe("passwordResetContent", () => {
  it("includes the reset link in text and html", () => {
    const message = passwordResetContent("https://example.com/auth/callback?next=/reset-password&code=abc");
    expect(message.subject).toMatch(/password/i);
    expect(message.text).toContain("https://example.com/auth/callback?next=/reset-password&code=abc");
    expect(message.html).toContain("https://example.com/auth/callback?next=/reset-password&amp;code=abc");
    expect(message.html).not.toContain("&code=");
  });
});

describe("notificationEmailContent", () => {
  it("points the reader at the in-app notice", () => {
    const message = notificationEmailContent({
      title: "New question",
      preview: "Someone posted a question in your group.",
      url: "https://example.com/groups/1/forum/2",
    });
    expect(message.subject).toBe("New question");
    expect(message.text).toContain("https://example.com/groups/1/forum/2");
  });
});
