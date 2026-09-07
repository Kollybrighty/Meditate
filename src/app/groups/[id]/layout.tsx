import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import GroupNav from "@/components/group/GroupNav";
import NotificationBell from "@/components/nav/NotificationBell";
import { getGroupContext } from "@/lib/groups";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { group } = await getGroupContext(id);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-semibold text-earth">{group.name}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <GroupNav groupId={id} />
            <NotificationBell />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
    </div>
  );
}
