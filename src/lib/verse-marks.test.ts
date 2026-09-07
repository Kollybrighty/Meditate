import { describe, expect, it } from "vitest";
import { nextVerseMark } from "./verse-marks";

describe("nextVerseMark", () => {
  it("cycles none → highlight → underline → none", () => {
    expect(nextVerseMark(null)).toBe("highlight");
    expect(nextVerseMark("highlight")).toBe("underline");
    expect(nextVerseMark("underline")).toBe(null);
  });
});
