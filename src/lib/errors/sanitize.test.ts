import { describe, expect, it } from "vitest";
import { sanitizeErrorMessage } from "./sanitize";

describe("sanitizeErrorMessage", () => {
  it("strips emails and JWTs before a report is stored", () => {
    const message = sanitizeErrorMessage(
      "Failed for ada@example.com token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.signature"
    );
    expect(message).not.toContain("ada@example.com");
    expect(message).not.toContain("eyJ");
    expect(message).toContain("[email]");
    expect(message).toContain("[token]");
  });
});
