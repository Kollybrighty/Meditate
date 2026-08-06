import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChildrenClient from "./ChildrenClient";

export default async function ChildrenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: children } = await supabase
    .from("child_profiles")
    .select("id, display_name, age")
    .eq("parent_user_id", user.id)
    .order("created_at", { ascending: true });

  return <ChildrenClient childrenList={children ?? []} />;
}
