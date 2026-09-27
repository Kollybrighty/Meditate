import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requireSupabaseEnv } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/safe-path";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathWithSearch = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  requestHeaders.set("x-pathname", pathWithSearch);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  let user = null;
  try {
    const { url, anonKey } = requireSupabaseEnv();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  } catch {
    user = null;
  }

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");

  if (!user && (
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/notifications")
  )) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    if (next) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
