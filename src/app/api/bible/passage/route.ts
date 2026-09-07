import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_BIBLE_VERSION_ID,
  getBibleVersion,
  hasInAppText,
} from "@/lib/bible/versions";

export async function GET(request: NextRequest) {
  const book = request.nextUrl.searchParams.get("book")?.trim();
  const chapterRaw = request.nextUrl.searchParams.get("chapter")?.trim();
  const chapter = chapterRaw ? Number(chapterRaw) : NaN;
  const version = getBibleVersion(
    request.nextUrl.searchParams.get("translation")?.trim() ||
      DEFAULT_BIBLE_VERSION_ID
  );

  if (!book || Number.isNaN(chapter) || chapter < 1) {
    return NextResponse.json({ error: "Invalid passage" }, { status: 400 });
  }

  if (!hasInAppText(version) || !version.bibleApiId) {
    return NextResponse.json(
      {
        error: "This edition is not available in the in-app reader.",
        translation: version.name,
        gatewayOnly: true,
      },
      { status: 404 }
    );
  }

  const passage = `${book} ${chapter}`;
  const url = `https://bible-api.com/${encodeURIComponent(passage)}?translation=${encodeURIComponent(
    version.bibleApiId
  )}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Passage could not be loaded", translation: version.name },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      reference?: string;
      text?: string;
      verses?: { verse: number; text: string }[];
      translation_name?: string;
    };
    return NextResponse.json(
      {
        reference: data.reference ?? passage,
        text: data.text ?? "",
        verses: data.verses ?? [],
        translation: data.translation_name ?? version.name,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Passage could not be loaded", translation: version.name },
      { status: 502 }
    );
  }
}
