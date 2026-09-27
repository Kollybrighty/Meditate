import { NextRequest, NextResponse } from "next/server";
import {
  ApiBibleError,
  fetchApiBibleChapter,
  nltBibleId,
} from "@/lib/bible/api-bible";
import {
  DEFAULT_BIBLE_VERSION_ID,
  getBibleVersion,
  type BibleVersion,
} from "@/lib/bible/versions";
import { logAppError } from "@/lib/errors/report";
import { configuredSecret } from "@/lib/secrets";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
};

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

  if (version.bibleApiId) {
    return fetchBibleApiCom(version, book, chapter);
  }

  if (version.apiBibleId) {
    return fetchApiBible(version, book, chapter);
  }

  return NextResponse.json(
    {
      error: "This edition is not available in the in-app reader.",
      translation: version.name,
      gatewayOnly: true,
    },
    { status: 404 }
  );
}

async function fetchBibleApiCom(
  version: BibleVersion,
  book: string,
  chapter: number
) {
  const passage = `${book} ${chapter}`;
  const url = `https://bible-api.com/${encodeURIComponent(passage)}?translation=${encodeURIComponent(
    version.bibleApiId!
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
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    logAppError({
      source: "bible",
      message: error instanceof Error ? error.message : "Passage could not be loaded",
      path: "/api/bible/passage",
    });
    return NextResponse.json(
      { error: "Passage could not be loaded", translation: version.name },
      { status: 502 }
    );
  }
}

async function fetchApiBible(
  version: BibleVersion,
  book: string,
  chapter: number
) {
  const apiKey = configuredSecret(process.env.BIBLE_API_KEY);
  if (!apiKey) {
    return gatewayEdition(version, book, chapter);
  }

  try {
    const data = await fetchApiBibleChapter(
      version.id === "nlt" ? nltBibleId() : version.apiBibleId!,
      book,
      chapter,
      apiKey
    );
    return NextResponse.json(
      {
        reference: data.reference,
        text: data.text,
        verses: data.verses,
        translation: version.name,
        copyright: version.copyright,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    if (error instanceof ApiBibleError && (error.status === 401 || error.status === 403)) {
      logAppError({
        source: "bible",
        message: `${version.abbreviation} was refused by API.Bible`,
        path: `/api/bible/passage`,
      });
      return gatewayEdition(version, book, chapter);
    }
    const message =
      error instanceof ApiBibleError
        ? error.message
        : "Passage could not be loaded";
    const status = error instanceof ApiBibleError && error.status >= 400
      ? error.status === 400
        ? 400
        : 502
      : 502;
    if (status >= 500) {
      logAppError({ source: "bible", message, path: "/api/bible/passage" });
    }
    return NextResponse.json(
      { error: message, translation: version.name },
      { status }
    );
  }
}

function gatewayEdition(version: BibleVersion, book: string, chapter: number) {
  return NextResponse.json({
    reference: `${book} ${chapter}`,
    verses: [],
    translation: version.name,
    gatewayOnly: true,
  });
}
