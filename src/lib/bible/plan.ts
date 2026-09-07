import { CANON, CHRONOLOGICAL_ORDER, type BibleBook } from "./canon";

export type ReadingChapter = {
  book: string;
  chapter: number;
};

export type DailyReading = {
  dayIndex: number;
  date: string;
  books: string[];
  chapters: ReadingChapter[];
};

export function planDayCount(planType: string): number {
  switch (planType) {
    case "3m":
      return 90;
    case "6m":
      return 180;
    case "12m":
    case "yearly":
      return 365;
    default:
      return 365;
  }
}

export function booksForScope(scope: string): BibleBook[] {
  if (scope === "old_testament") {
    return CANON.filter((b) => b.testament === "old");
  }
  if (scope === "new_testament") {
    return CANON.filter((b) => b.testament === "new");
  }
  if (scope === "chronological") {
    const byName = new Map(CANON.map((b) => [b.name, b]));
    return CHRONOLOGICAL_ORDER.map((name) => byName.get(name)).filter(
      (b): b is BibleBook => Boolean(b)
    );
  }
  return CANON;
}

export function flattenChapters(books: BibleBook[]): ReadingChapter[] {
  const out: ReadingChapter[] = [];
  for (const book of books) {
    for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
      out.push({ book: book.name, chapter });
    }
  }
  return out;
}

export function addUtcDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dayIndexOn(startDate: string, date: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const current = Date.parse(`${date}T00:00:00Z`);
  return Math.round((current - start) / 86_400_000);
}

export function todayIso(timeZone = "UTC"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function sliceForDay(
  chapters: ReadingChapter[],
  days: number,
  dayIndex: number
): ReadingChapter[] {
  if (dayIndex < 0 || dayIndex >= days || chapters.length === 0) return [];
  const base = Math.floor(chapters.length / days);
  const extra = chapters.length % days;
  let start = 0;
  for (let i = 0; i < dayIndex; i += 1) {
    start += i < extra ? base + 1 : base;
  }
  const count = dayIndex < extra ? base + 1 : base;
  return chapters.slice(start, start + count);
}

export function readingForDate(options: {
  readingScope: string;
  planType: string;
  startDate: string;
  date: string;
}): DailyReading | null {
  const chapters = flattenChapters(booksForScope(options.readingScope));
  const scheduledDays = Math.min(
    planDayCount(options.planType),
    Math.max(chapters.length, 1)
  );
  const idx = dayIndexOn(options.startDate, options.date);
  if (idx < 0 || idx >= scheduledDays) return null;

  const dayChapters = sliceForDay(chapters, scheduledDays, idx);
  const books = [...new Set(dayChapters.map((c) => c.book))];
  return {
    dayIndex: idx,
    date: options.date,
    books,
    chapters: dayChapters,
  };
}

export function buildPlan(options: {
  readingScope: string;
  planType: string;
  startDate: string;
}): DailyReading[] {
  const chapters = flattenChapters(booksForScope(options.readingScope));
  const scheduledDays = Math.min(
    planDayCount(options.planType),
    Math.max(chapters.length, 1)
  );
  const days: DailyReading[] = [];
  for (let i = 0; i < scheduledDays; i += 1) {
    const dayChapters = sliceForDay(chapters, scheduledDays, i);
    days.push({
      dayIndex: i,
      date: addUtcDays(options.startDate, i),
      books: [...new Set(dayChapters.map((c) => c.book))],
      chapters: dayChapters,
    });
  }
  return days;
}

export function parseChapters(raw: unknown): ReadingChapter[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      "book" in item &&
      "chapter" in item
    ) {
      const book = String((item as { book: unknown }).book);
      const chapter = Number((item as { chapter: unknown }).chapter);
      if (!book || Number.isNaN(chapter)) return [];
      return [{ book, chapter }];
    }
    return [];
  });
}

export function formatPassage(chapter: ReadingChapter): string {
  return `${chapter.book} ${chapter.chapter}`;
}

export function formatReadingRange(chapters: ReadingChapter[]): string {
  if (chapters.length === 0) return "No reading";
  if (chapters.length === 1) return formatPassage(chapters[0]);

  const parts: string[] = [];
  let runStart = chapters[0];
  let prev = chapters[0];

  const flush = () => {
    if (runStart.book === prev.book && runStart.chapter === prev.chapter) {
      parts.push(formatPassage(runStart));
    } else if (runStart.book === prev.book) {
      parts.push(`${runStart.book} ${runStart.chapter}–${prev.chapter}`);
    } else {
      parts.push(`${formatPassage(runStart)} – ${formatPassage(prev)}`);
    }
  };

  for (let i = 1; i < chapters.length; i += 1) {
    const current = chapters[i];
    const contiguous =
      current.book === prev.book && current.chapter === prev.chapter + 1;
    if (contiguous) {
      prev = current;
      continue;
    }
    flush();
    runStart = current;
    prev = current;
  }
  flush();
  return parts.join("; ");
}

export function planBounds(startDate: string, planType: string, readingScope: string) {
  const chapters = flattenChapters(booksForScope(readingScope));
  const days = Math.min(planDayCount(planType), Math.max(chapters.length, 1));
  return {
    startDate,
    endDate: addUtcDays(startDate, days - 1),
    days,
  };
}
