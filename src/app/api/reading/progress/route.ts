import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { groupId?: string; progressDate?: string; completed?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const groupId = body.groupId?.trim();
  const progressDate = body.progressDate?.trim();
  const completed = Boolean(body.completed);

  if (!groupId || !progressDate) {
    return NextResponse.json({ error: "Missing reading date." }, { status: 400 });
  }

  if (completed) {
    const { error } = await supabase
      .from("reading_progress")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("progress_date", progressDate);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const { error } = await supabase.from("reading_progress").insert({
      user_id: user.id,
      group_id: groupId,
      progress_date: progressDate,
    });
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
