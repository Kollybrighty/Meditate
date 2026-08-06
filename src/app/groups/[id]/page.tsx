import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import QRCodeDisplay from "@/components/group/QRCodeDisplay";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (!group) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const joinUrl = `${appUrl}/join/${group.slug}`;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="font-semibold text-earth">{group.name}</span>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="mt-1 text-stone-600 capitalize">
          {group.reading_scope.replace(/_/g, " ")} · {group.plan_type}
        </p>

        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold">Invite members</h2>
          <p className="mt-1 text-sm text-stone-600">Share this link or QR code with your group.</p>
          <div className="mt-4 break-all rounded-lg bg-stone-100 p-3 font-mono text-sm">
            {joinUrl}
          </div>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
            <QRCodeDisplay url={joinUrl} />
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/groups/${id}/members`}>
            <Button variant="outline">Members & progress</Button>
          </Link>
          <Link href={`/groups/${id}/forum`}>
            <Button variant="outline">Q&amp;A forum</Button>
          </Link>
          <Link href={`/groups/${id}/read`}>
            <Button>Today&apos;s reading</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
