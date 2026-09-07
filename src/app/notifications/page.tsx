import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/app/(auth)/actions";
import { formatDateTime } from "@/lib/dates";
import { notificationCopy, notificationHref } from "@/lib/notifications";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "./actions";
import NotificationBell from "@/components/nav/NotificationBell";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  const { data: items, error } = await supabase
    .from("notifications")
    .select("id, type, group_id, classroom_id, reference_id, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = error ? [] : items ?? [];
  const unread = list.filter((row) => !row.read_at).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <span className="text-lg font-semibold text-earth">Meditate</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="mt-1 text-stone-600">
              {unread === 0
                ? "You are up to date."
                : `${unread} unread ${unread === 1 ? "update" : "updates"}.`}
            </p>
          </div>
          {unread > 0 ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" size="sm" variant="outline">
                Mark all read
              </Button>
            </form>
          ) : null}
        </div>

        <ul className="mt-6 space-y-3">
          {list.length === 0 ? (
            <li className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
              <Bell className="mb-2 h-5 w-5 text-stone-400" />
              No notifications yet. You will be notified when someone posts in
              Q&amp;A, or when a child is waiting in a Kids lobby.
            </li>
          ) : (
            list.map((item) => {
              const copy = notificationCopy(item.type);
              const href = notificationHref({
                type: item.type,
                groupId: item.group_id,
                classroomId: item.classroom_id,
                referenceId: item.reference_id,
              });
              return (
                <li key={item.id}>
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="href" value={href} />
                    <button
                      type="submit"
                      className={`w-full rounded-xl border p-5 text-left ${
                        item.read_at
                          ? "border-stone-200 bg-white"
                          : "border-gold/30 bg-gold/5"
                      }`}
                    >
                      <p className="font-medium text-stone-900">{copy.title}</p>
                      <p className="mt-1 text-sm text-stone-600">{copy.preview}</p>
                      <p className="mt-2 text-xs text-stone-400">
                        {formatDateTime(item.created_at)}
                      </p>
                    </button>
                  </form>
                </li>
              );
            })
          )}
        </ul>
      </main>
    </div>
  );
}
