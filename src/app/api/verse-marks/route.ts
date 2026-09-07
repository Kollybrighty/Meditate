import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nextVerseMark, type VerseMarkType } from "@/lib/verse-marks";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const version = request.nextUrl.searchParams.get("version")?.trim();
  const book = request.nextUrl.searchParams.get("book")?.trim();
  const chapterRaw = request.nextUrl.searchParams.get("chapter")?.trim();
  const chapter = chapterRaw ? Number(chapterRaw) : NaN;

  if (!version || !book || Number.isNaN(chapter)) {
    return NextResponse.json({ marks: [] });
  }

  const { data, error } = await supabase
    .from("verse_marks")
    .select("verse, mark_type")
    .eq("user_id", user.id)
    .eq("version", version)
    .eq("book", book)
    .eq("chapter", chapter);

  if (error) {
    return NextResponse.json({ marks: [] });
  }

  return NextResponse.json({
    marks: (data ?? []).map((row) => ({
      verse: row.verse as number,
      markType: row.mark_type as VerseMarkType,
    })),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: {
    version?: string;
    book?: string;
    chapter?: number;
    verse?: number;
    current?: VerseMarkType | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const version = body.version?.trim();
  const book = body.book?.trim();
  const chapter = Number(body.chapter);
  const verse = Number(body.verse);
  if (!version || !book || Number.isNaN(chapter) || Number.isNaN(verse) || verse < 1) {
    return NextResponse.json({ error: "Missing verse." }, { status: 400 });
  }

  const next = nextVerseMark(body.current ?? null);

  if (!next) {
    const { error } = await supabase
      .from("verse_marks")
      .delete()
      .eq("user_id", user.id)
      .eq("version", version)
      .eq("book", book)
      .eq("chapter", chapter)
      .eq("verse", verse);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ markType: null });
  }

  const { error } = await supabase.from("verse_marks").upsert(
    {
      user_id: user.id,
      version,
      book,
      chapter,
      verse,
      mark_type: next,
      color: next === "highlight" ? "#FDE68A" : "#B8860B",
    },
    { onConflict: "user_id,version,book,chapter,verse" }
  );

  if (error) {
    await supabase
      .from("verse_marks")
      .delete()
      .eq("user_id", user.id)
      .eq("version", version)
      .eq("book", book)
      .eq("chapter", chapter)
      .eq("verse", verse);
    const { error: insertError } = await supabase.from("verse_marks").insert({
      user_id: user.id,
      version,
      book,
      chapter,
      verse,
      mark_type: next,
      color: next === "highlight" ? "#FDE68A" : "#B8860B",
    });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }
  }
  return NextResponse.json({ markType: next });
}
