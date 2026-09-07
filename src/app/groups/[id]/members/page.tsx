import { createClient } from "@/lib/supabase/server";
import { getGroupContext } from "@/lib/groups";
import { displayName, profilesByIds } from "@/lib/profiles";
import { canPerformMemberAction } from "@/lib/member-actions";
import MemberActions, { LeaveGroupButton } from "@/components/group/MemberActions";
import {
  addUtcDays,
  formatReadingRange,
  readingForDate,
  todayIso,
} from "@/lib/bible/plan";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { group, userId, isAdmin } = await getGroupContext(id);
  const supabase = await createClient();
  const today = todayIso(group.timezone || "UTC");

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at")
    .eq("group_id", id)
    .order("joined_at", { ascending: true });

  const list = members ?? [];
  const authors = await profilesByIds(
    supabase,
    list.map((m) => m.user_id)
  );

  const { data: todayProgress } = await supabase
    .from("reading_progress")
    .select("user_id")
    .eq("group_id", id)
    .eq("progress_date", today);

  const completedIds = new Set((todayProgress ?? []).map((p) => p.user_id));

  const { data: recentProgress } = await supabase
    .from("reading_progress")
    .select("user_id, progress_date")
    .eq("group_id", id)
    .gte("progress_date", addUtcDays(today, -6))
    .lte("progress_date", today);

  const days = Array.from({ length: 7 }, (_, i) => addUtcDays(today, i - 6));
  const progressByUser = new Map<string, Set<string>>();
  for (const row of recentProgress ?? []) {
    const set = progressByUser.get(row.user_id) ?? new Set<string>();
    set.add(row.progress_date);
    progressByUser.set(row.user_id, set);
  }

  const todaysReading = group.start_date
    ? readingForDate({
        readingScope: group.reading_scope,
        planType: group.plan_type,
        startDate: group.start_date,
        date: today,
      })
    : null;

  const doneCount = list.filter((m) => completedIds.has(m.user_id)).length;

  return (
    <>
      <h1 className="text-2xl font-bold">Members & progress</h1>
      <p className="mt-1 text-stone-600">
        {list.length} member{list.length === 1 ? "" : "s"}
        {todaysReading && todaysReading.chapters.length > 0
          ? ` · today: ${formatReadingRange(todaysReading.chapters)}`
          : ""}
      </p>
      {todaysReading && todaysReading.chapters.length > 0 ? (
        <p className="mt-2 text-sm text-stone-500">
          {doneCount} of {list.length} finished today&apos;s reading.
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {list.map((member) => {
          const profile = authors.get(member.user_id);
          const week = progressByUser.get(member.user_id) ?? new Set<string>();
          const doneToday = completedIds.has(member.user_id);
          const name = displayName(profile);
          const promote = canPerformMemberAction({
            action: "promote",
            actorUserId: userId,
            actorIsAdmin: isAdmin,
            groupCreatorId: group.created_by,
            targetUserId: member.user_id,
            targetRole: member.role,
          });
          const demote = canPerformMemberAction({
            action: "demote",
            actorUserId: userId,
            actorIsAdmin: isAdmin,
            groupCreatorId: group.created_by,
            targetUserId: member.user_id,
            targetRole: member.role,
          });
          const kick = canPerformMemberAction({
            action: "kick",
            actorUserId: userId,
            actorIsAdmin: isAdmin,
            groupCreatorId: group.created_by,
            targetUserId: member.user_id,
            targetRole: member.role,
          });
          return (
            <li
              key={member.user_id}
              className="rounded-xl border border-stone-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-900">
                    {name}
                    {member.user_id === userId ? " (you)" : ""}
                  </p>
                  <p className="text-sm text-stone-500">
                    {profile?.username ? `@${profile.username} · ` : ""}
                    {member.role}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    doneToday
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {doneToday ? "Read today" : "Not yet today"}
                </span>
              </div>
              <div className="mt-4 flex gap-1" aria-label="Last 7 days">
                {days.map((day) => {
                  const done = week.has(day);
                  return (
                    <span
                      key={day}
                      title={`${day}${done ? " — completed" : ""}`}
                      className={`h-2.5 flex-1 rounded-full ${
                        done ? "bg-gold" : "bg-stone-200"
                      }`}
                    />
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-stone-400">Last 7 days</p>
              <MemberActions
                groupId={id}
                targetUserId={member.user_id}
                targetName={name}
                canPromote={promote.ok}
                canDemote={demote.ok}
                canKick={kick.ok}
              />
            </li>
          );
        })}
      </ul>
      {userId === group.created_by ? (
        <p className="mt-8 text-sm text-stone-500">
          You created this group. To leave, delete it from the dashboard.
        </p>
      ) : (
        <LeaveGroupButton groupId={id} userId={userId} />
      )}
    </>
  );
}
