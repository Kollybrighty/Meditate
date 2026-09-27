import {
  DEFAULT_BIBLE_VERSION_ID,
  getBibleVersion,
} from "@/lib/bible/versions";

export type PassagePayload = {
  reference: string;
  text?: string;
  verses: { verse: number; text: string }[];
  translation: string;
  copyright?: string;
  error?: string;
  gatewayOnly?: boolean;
};

export function passageRequestUrl(
  book: string,
  chapter: number,
  translation: string = DEFAULT_BIBLE_VERSION_ID
): string {
  const params = new URLSearchParams({
    book,
    chapter: String(chapter),
    translation,
  });
  return `/api/bible/passage?${params.toString()}`;
}

export function passagePlainText(data: PassagePayload): string {
  if (data.verses?.length) {
    return data.verses.map((v) => v.text.trim()).join(" ");
  }
  return (data.text ?? "").trim();
}

export async function fetchPassage(
  book: string,
  chapter: number,
  translation: string = DEFAULT_BIBLE_VERSION_ID
): Promise<PassagePayload> {
  const version = getBibleVersion(translation);
  const reference = `${book} ${chapter}`;
  try {
    const res = await fetch(passageRequestUrl(book, chapter, version.id), {
      credentials: "same-origin",
    });
    const json = (await res.json()) as PassagePayload;
    if (!res.ok || json.error) {
      return {
        reference,
        verses: [],
        translation: json.translation || version.name,
        error: json.error || "Could not load",
        gatewayOnly: json.gatewayOnly,
      };
    }
    return json;
  } catch {
    return {
      reference,
      verses: [],
      translation: version.name,
      error: "Could not load",
    };
  }
}
