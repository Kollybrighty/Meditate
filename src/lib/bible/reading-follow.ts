export type ReadingPlayItem = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

export type ReadingChapterText = {
  book: string;
  chapter: number;
  verses: { verse: number; text: string }[];
};

export function chapterElementId(book: string, chapter: number) {
  return `reading-chapter-${book.replace(/\s+/g, "-")}-${chapter}`;
}

export function verseElementId(book: string, chapter: number, verse: number) {
  return `reading-verse-${book.replace(/\s+/g, "-")}-${chapter}-${verse}`;
}

export function formatNowReading(item: ReadingPlayItem | null): string {
  if (!item) return "";
  if (item.verse < 1) return `${item.book} ${item.chapter}`;
  return `${item.book} ${item.chapter}:${item.verse}`;
}

export function matchesChapter(
  item: ReadingPlayItem | null,
  book: string,
  chapter: number
) {
  return Boolean(item && item.book === book && item.chapter === chapter);
}

export function buildReadingItems(
  chapters: ReadingChapterText[]
): ReadingPlayItem[] {
  const items: ReadingPlayItem[] = [];
  for (const chapter of chapters) {
    items.push({
      book: chapter.book,
      chapter: chapter.chapter,
      verse: 0,
      text: `${chapter.book}, chapter ${chapter.chapter}.`,
    });
    for (const verse of chapter.verses) {
      const text = verse.text.trim();
      if (!text) continue;
      items.push({
        book: chapter.book,
        chapter: chapter.chapter,
        verse: verse.verse,
        text,
      });
    }
  }
  return items;
}
