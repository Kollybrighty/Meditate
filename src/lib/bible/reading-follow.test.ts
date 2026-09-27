import { describe, expect, it } from "vitest";
import {
  buildReadingItems,
  chapterElementId,
  formatNowReading,
  matchesChapter,
  verseElementId,
} from "./reading-follow";

describe("buildReadingItems", () => {
  it("adds a chapter intro then each verse", () => {
    const items = buildReadingItems([
      {
        book: "John",
        chapter: 3,
        verses: [
          { verse: 16, text: " For God so loved the world. " },
          { verse: 17, text: "   " },
        ],
      },
    ]);

    expect(items).toEqual([
      {
        book: "John",
        chapter: 3,
        verse: 0,
        text: "John, chapter 3.",
      },
      {
        book: "John",
        chapter: 3,
        verse: 16,
        text: "For God so loved the world.",
      },
    ]);
  });
});

describe("formatNowReading", () => {
  it("uses chapter only for the intro and verse numbers after that", () => {
    expect(
      formatNowReading({
        book: "Genesis",
        chapter: 1,
        verse: 0,
        text: "Genesis, chapter 1.",
      })
    ).toBe("Genesis 1");
    expect(
      formatNowReading({
        book: "Genesis",
        chapter: 1,
        verse: 3,
        text: "And God said, Let there be light.",
      })
    ).toBe("Genesis 1:3");
  });
});

describe("verseElementId", () => {
  it("makes a stable DOM id from the reference", () => {
    expect(chapterElementId("1 John", 4)).toBe("reading-chapter-1-John-4");
    expect(verseElementId("1 John", 4, 8)).toBe("reading-verse-1-John-4-8");
  });
});

describe("matchesChapter", () => {
  it("matches book and chapter only", () => {
    expect(
      matchesChapter(
        { book: "Psalm", chapter: 23, verse: 1, text: "The Lord is my shepherd." },
        "Psalm",
        23
      )
    ).toBe(true);
    expect(
      matchesChapter(
        { book: "Psalm", chapter: 23, verse: 1, text: "The Lord is my shepherd." },
        "Psalm",
        1
      )
    ).toBe(false);
  });
});
