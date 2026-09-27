export function supabasePublicUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

export function supabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const url = supabasePublicUrl();
  const anonKey = supabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error("MISSING_SUPABASE_ENV");
  }
  try {
    const parsed = new URL(url);
    if (process.env.VERCEL && /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname)) {
      throw new Error("LOCAL_SUPABASE_ON_VERCEL");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "LOCAL_SUPABASE_ON_VERCEL") {
      throw error;
    }
    throw new Error("INVALID_SUPABASE_URL");
  }
  return { url, anonKey };
}

export function authErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  if (raw === "MISSING_SUPABASE_ENV") {
    return "Sign-in is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  }
  if (raw === "LOCAL_SUPABASE_ON_VERCEL") {
    return "This deployment is pointed at a local database. Set NEXT_PUBLIC_SUPABASE_URL to your cloud Supabase project, then redeploy.";
  }
  if (raw === "INVALID_SUPABASE_URL") {
    return "NEXT_PUBLIC_SUPABASE_URL is not a valid URL.";
  }
  if (
    !raw ||
    /fetch failed|failed to fetch|ENOTFOUND|getaddrinfo|ECONNREFUSED|certificate/i.test(
      raw
    )
  ) {
    return "Can't reach the sign-in service. Your Supabase project URL may be wrong, or the project may be paused or deleted.";
  }
  return raw;
}
