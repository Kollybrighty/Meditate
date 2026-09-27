import { afterEach, describe, expect, it } from "vitest";
import { authErrorMessage, requireSupabaseEnv } from "./config";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const originalVercel = process.env.VERCEL;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  process.env.VERCEL = originalVercel;
});

describe("requireSupabaseEnv", () => {
  it("returns trimmed url and key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = " https://abc.supabase.co ";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = " key ";
    delete process.env.VERCEL;
    expect(requireSupabaseEnv()).toEqual({
      url: "https://abc.supabase.co",
      anonKey: "key",
    });
  });

  it("rejects a localhost URL on Vercel", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "key";
    process.env.VERCEL = "1";
    expect(() => requireSupabaseEnv()).toThrow("LOCAL_SUPABASE_ON_VERCEL");
  });
});

describe("authErrorMessage", () => {
  it("turns fetch failed into a reachable-service message", () => {
    expect(authErrorMessage({ message: "fetch failed" })).toMatch(
      /Can't reach the sign-in service/
    );
  });
});
