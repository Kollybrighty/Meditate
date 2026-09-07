import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { findGroupByInvite } from "@/lib/group-invite";
import { formatLongDate } from "@/lib/dates";
import JoinGroupButton from "../JoinGroupButton";
import { switchAccountForInvite } from "../actions";

export default async function JoinGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invite = decodeURIComponent(slug);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const group = await findGroupByInvite(invite);
  if (!group) notFound();

  let alreadyMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();
    alreadyMember = Boolean(membership);
  }

  const next = `/join/${encodeURIComponent(invite)}`;
  const scopeLabel = String(group.reading_scope).replace(/_/g, " ");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <Logo className="h-10 w-10" />
          <span className="text-lg font-semibold text-earth">Meditate</span>
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-gold">
          Group invite
        </p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">{group.name}</h1>
        <p className="mt-1 capitalize text-stone-600">
          {scopeLabel} · {group.plan_type}
        </p>
        {group.start_date ? (
          <p className="mt-2 text-sm text-stone-500">
            Plan starts {formatLongDate(group.start_date)}
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            Start date has not been set yet.
          </p>
        )}

        {alreadyMember ? (
          <>
            <p className="mt-4 text-stone-600">
              You&apos;re already in this group. A new member needs their own
              account — sign out below, then create or sign in as them.
            </p>
            <div className="mt-6 space-y-3">
              <Link href={`/groups/${group.id}`}>
                <Button className="w-full">Enter group</Button>
              </Link>
              <form action={switchAccountForInvite}>
                <input type="hidden" name="invite" value={invite} />
                <Button type="submit" variant="outline" className="w-full">
                  Join with a different account
                </Button>
              </form>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 text-stone-600">
              Join this Bible study group to get today&apos;s reading, see
              members and progress, and take part in the Q&amp;A forum.
            </p>
            <div className="mt-6 space-y-3">
              {user ? (
                <JoinGroupButton invite={invite} groupName={group.name} />
              ) : (
                <>
                  <Link href={`/register?next=${encodeURIComponent(next)}`}>
                    <Button className="w-full">Create an account to join</Button>
                  </Link>
                  <Link href={`/login?next=${encodeURIComponent(next)}`}>
                    <Button variant="outline" className="w-full">
                      Sign in to join
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </>
        )}

        <Link
          href="/dashboard"
          className="mt-6 block text-center text-sm text-stone-500 hover:text-gold"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
