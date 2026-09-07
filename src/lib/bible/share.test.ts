import { describe, expect, it } from "vitest";
import { formatVerseForForum, formatVerseShare } from "./share";

describe("formatVerseShare", () => {
  it("includes reference, version, and text", () => {
    expect(
      formatVerseShare({
        book: "John",
        chapter: 3,
        verse: 16,
        text: "  For God so loved the world.  ",
        versionAbbreviation: "KJV",
      })
    ).toBe("John 3:16 (KJV)\nFor God so loved the world.");
  });
});

describe("formatVerseForForum", () => {
  it("leaves room to add a question under the citation", () => {
    const out = formatVerseForForum({
      book: "Psalm",
      chapter: 23,
      verse: 1,
      text: "The Lord is my shepherd; I shall not want.",
      versionAbbreviation: "WEB",
    });
    expect(out.startsWith("Psalm 23:1 (WEB)")).toBe(true);
    expect(out.endsWith("\n\n")).toBe(true);
  });
});
