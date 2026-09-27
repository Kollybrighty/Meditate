import { describe, expect, it } from "vitest";
import { configuredSecret } from "./secrets";

describe("configuredSecret", () => {
  it("rejects empty values and template placeholders", () => {
    expect(configuredSecret(undefined)).toBeNull();
    expect(configuredSecret("  ")).toBeNull();
    expect(configuredSecret("your-bible-api-key")).toBeNull();
    expect(configuredSecret("your-resend-api-key")).toBeNull();
  });

  it("keeps a real value", () => {
    expect(configuredSecret(" re_live_123 ")).toBe("re_live_123");
  });
});
