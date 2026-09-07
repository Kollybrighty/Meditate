import { describe, expect, it } from "vitest";
import { shouldCreateOffer } from "./live";

describe("shouldCreateOffer", () => {
  it("picks one peer so both sides do not offer", () => {
    expect(shouldCreateOffer("b", "a")).toBe(true);
    expect(shouldCreateOffer("a", "b")).toBe(false);
  });
});
