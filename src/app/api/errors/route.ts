import { NextRequest, NextResponse } from "next/server";
import { logAppError } from "@/lib/errors/report";
import { sanitizeErrorMessage } from "@/lib/errors/sanitize";

const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 20;

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many reports" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  const record = body as { message?: unknown; path?: unknown; digest?: unknown };
  const message =
    typeof record.message === "string" ? sanitizeErrorMessage(record.message) : "";
  if (!message) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  logAppError({
    source: "browser",
    message,
    path: typeof record.path === "string" ? record.path : undefined,
    digest: typeof record.digest === "string" ? record.digest : undefined,
  });
  return new NextResponse(null, { status: 204 });
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host.split(",")[0]?.trim();
  } catch {
    return false;
  }
}

function limited(ip: string): boolean {
  const now = Date.now();
  const current = hits.get(ip);
  if (!current || now > current.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_HITS;
}
