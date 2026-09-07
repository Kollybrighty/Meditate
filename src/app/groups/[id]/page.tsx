import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import QRCodeDisplay from "@/components/group/QRCodeDisplay";
import ShareInvite from "@/components/group/ShareInvite";
import StartDateEditor from "@/components/group/StartDateEditor";
import InviteUrl from "@/components/group/InviteUrl";
import { appBaseUrl } from "@/lib/app-url";
import { getGroupContext } from "@/lib/groups";
import {
  formatReadingRange,
  readingForDate,
  todayIso,
} from "@/lib/bible/plan";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { group, isAdmin } = await getGroupContext(id);
  const supabase = await createClient();

  const { count: memberCount } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", id);

  const today = todayIso(group.timezone || "UTC");
  const todaysReading =
    group.start_date
      ? readingForDate({
          readingScope: group.reading_scope,
          planType: group.plan_type,
          startDate: group.start_date,
          date: today,
        })
      : null;

  const joinUrl = `${await appBaseUrl()}/join/${encodeURIComponent(group.slug)}`;

  return (
    <>
      <h1 className="text-2xl font-bold">{group.name}</h1>
      <p className="mt-1 capitalize text-stone-600">
        {group.reading_scope.replace(/_/g, " ")} · {group.plan_type}
        {memberCount != null ? ` · ${memberCount} member${memberCount === 1 ? "" : "s"}` : ""}
      </p>

      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-semibold">Today&apos;s reading</h2>
        {todaysReading && todaysReading.chapters.length > 0 ? (
          <>
            <p className="mt-2 text-stone-800">
              {formatReadingRange(todaysReading.chapters)}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Day {todaysReading.dayIndex + 1}
            </p>
            <Link href={`/groups/${id}/read`} className="mt-4 inline-block">
              <Button>Open today&apos;s reading</Button>
            </Link>
          </>
        ) : group.start_date ? (
          <p className="mt-2 text-sm text-stone-600">
            There is no scheduled reading for today. The plan may not have
            started yet, or it may have finished.
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-600">
            {isAdmin
              ? "Set a plan start date so the group can begin daily reading."
              : "Waiting for a group admin to set the plan start date."}
          </p>
        )}
      </section>

      <StartDateEditor
        groupId={id}
        startDate={group.start_date ?? null}
        canEdit={isAdmin}
      />

      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-semibold">Invite members</h2>
        <p className="mt-1 text-sm text-stone-600">
          Share this link or QR code. Anyone who opens it can join and will
          immediately get reading, members, and the Q&amp;A forum.
        </p>
        <InviteUrl url={joinUrl} />
        <ShareInvite url={joinUrl} groupName={group.name} />
        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
          <QRCodeDisplay url={joinUrl} />
        </div>
      </section>
    </>
  );
}
