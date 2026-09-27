import { DEFAULT_NLT_BIBLE_ID } from "@/lib/bible/versions";

const API_BIBLE_HOST = "https://api.scripture.api.bible/v1";

/** USFM book IDs used by API.Bible, keyed by this app's canon names. */
export const API_BIBLE_BOOK_IDS: Record<string, string> = {
  Genesis: "GEN",
  Exodus: "EXO",
  Leviticus: "LEV",
  Numbers: "NUM",
  Deuteronomy: "DEU",
  Joshua: "JOS",
  Judges: "JDG",
  Ruth: "RUT",
  "1 Samuel": "1SA",
  "2 Samuel": "2SA",
  "1 Kings": "1KI",
  "2 Kings": "2KI",
  "1 Chronicles": "1CH",
  "2 Chronicles": "2CH",
  Ezra: "EZR",
  Nehemiah: "NEH",
  Esther: "EST",
  Job: "JOB",
  Psalms: "PSA",
  Proverbs: "PRO",
  Ecclesiastes: "ECC",
  "Song of Solomon": "SNG",
  Isaiah: "ISA",
  Jeremiah: "JER",
  Lamentations: "LAM",
  Ezekiel: "EZK",
  Daniel: "DAN",
  Hosea: "HOS",
  Joel: "JOL",
  Amos: "AMO",
  Obadiah: "OBA",
  Jonah: "JON",
  Micah: "MIC",
  Nahum: "NAM",
  Habakkuk: "HAB",
  Zephaniah: "ZEP",
  Haggai: "HAG",
  Zechariah: "ZEC",
  Malachi: "MAL",
  Matthew: "MAT",
  Mark: "MRK",
  Luke: "LUK",
  John: "JHN",
  Acts: "ACT",
  Romans: "ROM",
  "1 Corinthians": "1CO",
  "2 Corinthians": "2CO",
  Galatians: "GAL",
  Ephesians: "EPH",
  Philippians: "PHP",
  Colossians: "COL",
  "1 Thessalonians": "1TH",
  "2 Thessalonians": "2TH",
  "1 Timothy": "1TI",
  "2 Timothy": "2TI",
  Titus: "TIT",
  Philemon: "PHM",
  Hebrews: "HEB",
  James: "JAS",
  "1 Peter": "1PE",
  "2 Peter": "2PE",
  "1 John": "1JN",
  "2 John": "2JN",
  "3 John": "3JN",
  Jude: "JUD",
  Revelation: "REV",
};

export type ApiBibleVerse = {
  verse: number;
  text: string;
};

export type ApiBibleChapter = {
  reference: string;
  text: string;
  verses: ApiBibleVerse[];
};

type ApiBibleJsonNode = {
  name?: string;
  type?: string;
  text?: string;
  attrs?: { number?: string; sid?: string };
  items?: ApiBibleJsonNode[];
  content?: ApiBibleJsonNode[] | string;
};

export function apiBibleBookId(book: string): string | null {
  return API_BIBLE_BOOK_IDS[book.trim()] ?? null;
}

export function apiBibleChapterId(book: string, chapter: number): string | null {
  const bookId = apiBibleBookId(book);
  if (!bookId || !Number.isInteger(chapter) || chapter < 1) return null;
  return `${bookId}.${chapter}`;
}

export function nltBibleId(): string {
  return process.env.API_BIBLE_NLT_ID?.trim() || DEFAULT_NLT_BIBLE_ID;
}

export function parseApiBibleContent(content: unknown): ApiBibleVerse[] {
  if (Array.isArray(content) || (content && typeof content === "object")) {
    const fromJson = versesFromJson(content as ApiBibleJsonNode | ApiBibleJsonNode[]);
    if (fromJson.length) return fromJson;
  }

  const html = typeof content === "string" ? content : "";
  if (!html.trim()) return [];

  const fromMarks = versesFromHtmlMarks(html);
  if (fromMarks.length) return fromMarks;

  return versesFromBracketText(stripMarkup(html));
}

export async function fetchApiBibleChapter(
  bibleId: string,
  book: string,
  chapter: number,
  apiKey: string
): Promise<ApiBibleChapter> {
  const chapterId = apiBibleChapterId(book, chapter);
  if (!chapterId) {
    throw new ApiBibleError("Unknown book", 400);
  }

  const url = new URL(
    `${API_BIBLE_HOST}/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(chapterId)}`
  );
  url.searchParams.set("content-type", "html");
  url.searchParams.set("include-notes", "false");
  url.searchParams.set("include-titles", "false");
  url.searchParams.set("include-chapter-numbers", "false");
  url.searchParams.set("include-verse-numbers", "true");
  url.searchParams.set("include-verse-spans", "true");

  const res = await fetch(url, {
    headers: { "api-key": apiKey },
    next: { revalidate: 86400 },
  });

  if (res.status === 401 || res.status === 403) {
    throw new ApiBibleError(
      "This edition could not be opened in the app.",
      res.status
    );
  }
  if (!res.ok) {
    throw new ApiBibleError("Passage could not be loaded", res.status);
  }

  const body = (await res.json()) as {
    data?: { content?: unknown; reference?: string };
  };
  const verses = parseApiBibleContent(body.data?.content);
  if (!verses.length) {
    throw new ApiBibleError("Passage could not be loaded", 502);
  }

  return {
    reference: body.data?.reference ?? `${book} ${chapter}`,
    text: verses.map((verse) => verse.text).join(" "),
    verses,
  };
}

export class ApiBibleError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiBibleError";
    this.status = status;
  }
}

function versesFromJson(node: ApiBibleJsonNode | ApiBibleJsonNode[]): ApiBibleVerse[] {
  const verses: ApiBibleVerse[] = [];
  let current: ApiBibleVerse | null = null;

  const walk = (value: unknown) => {
    if (typeof value === "string") {
      if (current) current.text += value;
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;

    const item = value as ApiBibleJsonNode;
    if (item.name === "verse" || item.type === "verse") {
      const verse = verseNumberFromAttrs(item.attrs);
      if (verse) {
        current = { verse, text: "" };
        verses.push(current);
      }
    } else if (item.type === "text" && item.text && current) {
      current.text += item.text;
    }

    if (item.items) walk(item.items);
    if (item.content) walk(item.content);
    if (item.text && item.type !== "text" && item.name !== "verse" && current) {
      current.text += item.text;
    }
  };

  walk(node);
  return finalizeVerses(verses);
}

function verseNumberFromAttrs(attrs?: { number?: string; sid?: string }): number | null {
  const fromNumber = firstInteger(attrs?.number);
  if (fromNumber) return fromNumber;
  const sid = attrs?.sid ?? "";
  const tail = sid.split(".").pop();
  return firstInteger(tail);
}

function versesFromHtmlMarks(html: string): ApiBibleVerse[] {
  const marks: { start: number; contentStart: number; verse: number }[] = [];
  const spanRe =
    /<span\b(?=[^>]*\b(?:class="[^"]*\bv\b[^"]*"|data-number=))([^>]*)>([\s\S]*?)<\/span>/gi;
  let match: RegExpExecArray | null;
  while ((match = spanRe.exec(html))) {
    const attrs = match[1];
    if (/\bverse-span\b/i.test(attrs)) continue;
    const inner = match[2].replace(/<[^>]+>/g, "").trim();
    const verse =
      firstInteger(/data-number="([^"]+)"/i.exec(attrs)?.[1]) ??
      firstInteger(inner);
    if (!verse) continue;
    marks.push({
      start: match.index,
      contentStart: match.index + match[0].length,
      verse,
    });
  }

  const verses = marks.map((mark, index) => {
    const end = marks[index + 1]?.start ?? html.length;
    return {
      verse: mark.verse,
      text: stripMarkup(html.slice(mark.contentStart, end)),
    };
  });
  return finalizeVerses(verses);
}

function versesFromBracketText(text: string): ApiBibleVerse[] {
  const parts = text.split(/\[(\d+)\]\s*/);
  const verses: ApiBibleVerse[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const verse = Number(parts[i]);
    const body = normalizeSpace(parts[i + 1] ?? "");
    if (verse > 0 && body) verses.push({ verse, text: body });
  }
  return verses;
}

function finalizeVerses(verses: ApiBibleVerse[]): ApiBibleVerse[] {
  return verses
    .map((verse) => ({ verse: verse.verse, text: normalizeSpace(verse.text) }))
    .filter((verse) => verse.verse > 0 && verse.text);
}

function firstInteger(value: string | undefined): number | null {
  const match = value?.match(/(\d+)/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function stripMarkup(html: string): string {
  return normalizeSpace(
    decodeEntities(
      html
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/p>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
