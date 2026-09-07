export type VerseMarkType = "highlight" | "underline";

export function nextVerseMark(
  current: VerseMarkType | null | undefined
): VerseMarkType | null {
  if (current === "highlight") return "underline";
  if (current === "underline") return null;
  return "highlight";
}

export function verseMarkKey(
  version: string,
  book: string,
  chapter: number,
  verse: number
): string {
  return `${version}:${book}:${chapter}:${verse}`;
}
