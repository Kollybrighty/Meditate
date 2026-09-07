import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPlan } from "@/lib/bible/plan";

type GroupPlan = {
  id: string;
  reading_scope: string;
  plan_type: string;
  start_date: string;
};

export async function syncDailyAssignments(
  supabase: SupabaseClient,
  group: GroupPlan
): Promise<string | null> {
  const plan = buildPlan({
    readingScope: group.reading_scope,
    planType: group.plan_type,
    startDate: group.start_date,
  });

  const { error: deleteError } = await supabase
    .from("daily_assignments")
    .delete()
    .eq("group_id", group.id);
  if (deleteError) return deleteError.message;

  const rows = plan.map((day) => ({
    group_id: group.id,
    assignment_date: day.date,
    books: day.books,
    chapters: day.chapters,
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error } = await supabase.from("daily_assignments").insert(chunk);
    if (error) return error.message;
  }

  return null;
}
