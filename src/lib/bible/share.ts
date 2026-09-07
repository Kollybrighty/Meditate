export const FORUM_QUOTE_KEY = "meditate-forum-quote";

export function formatVerseShare(options: {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  versionAbbreviation: string;
}): string {
  const reference = `${options.book} ${options.chapter}:${options.verse}`;
  const version = options.versionAbbreviation.trim();
  const text = options.text.trim();
  const header = version ? `${reference} (${version})` : reference;
  return `${header}\n${text}`;
}

export function formatVerseForForum(options: {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  versionAbbreviation: string;
}): string {
  const citation = formatVerseShare(options);
  return `${citation}\n\n`;
}

export function saveForumQuote(quote: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(FORUM_QUOTE_KEY, quote);
}

export function takeForumQuote(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(FORUM_QUOTE_KEY);
  if (!value) return null;
  window.sessionStorage.removeItem(FORUM_QUOTE_KEY);
  return value;
}
