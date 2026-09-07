import type { SupabaseClient } from "@supabase/supabase-js";

export type PublicProfile = {
  id: string;
  full_name: string;
  username: string;
};

export async function profilesByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, PublicProfile>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .in("id", unique);

  return new Map((data ?? []).map((p) => [p.id, p as PublicProfile]));
}

export function displayName(
  profile: PublicProfile | undefined,
  fallback = "Member"
): string {
  return profile?.full_name || profile?.username || fallback;
}
