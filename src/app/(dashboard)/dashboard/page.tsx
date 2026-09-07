import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/app/(auth)/actions";
import { BookOpen, Users, Baby, Plus } from "lucide-react";
import JoinInviteForm from "@/components/group/JoinInviteForm";
import GroupManageMenu from "@/components/group/GroupManageMenu";
import ClassroomManageMenu from "@/components/kids/ClassroomManageMenu";
import NotificationBell from "@/components/nav/NotificationBell";
import { listStaffClassrooms } from "@/lib/kids/staff";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: groups } = await supabase
    .from("group_members")
    .select("role, groups(id, name, slug, reading_scope, plan_type)")
    .eq("user_id", user.id);

  const classrooms = await listStaffClassrooms(supabase, user.id);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <span className="text-lg font-semibold text-earth">Meditate</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-600">
              {profile?.full_name || user.email}
            </span>
            <NotificationBell />
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="mt-1 text-stone-600">Welcome back, {profile?.full_name || "friend"}.</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <BookOpen className="h-5 w-5 text-gold" />
                Bible study groups
              </h2>
              <Link href="/groups/new">
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  New group
                </Button>
              </Link>
            </div>
            {groups && groups.length > 0 ? (
              <ul className="space-y-2">
                {groups.map((g) => {
                  const group = Array.isArray(g.groups) ? g.groups[0] : g.groups;
                  if (!group) return null;
                  return (
                    <li key={group.id}>
                      <div className="flex items-stretch rounded-lg border border-stone-100 hover:border-gold/30 hover:bg-gold/5">
                        {g.role === "owner" || g.role === "admin" ? (
                          <div className="flex items-center pl-1">
                            <GroupManageMenu
                              groupId={group.id}
                              groupName={group.name}
                            />
                          </div>
                        ) : null}
                        <Link
                          href={`/groups/${group.id}`}
                          className="min-w-0 flex-1 p-4"
                        >
                          <span className="font-medium">{group.name}</span>
                          <span className="ml-2 text-xs text-stone-500">
                            {group.reading_scope.replace(/_/g, " ")} · {group.plan_type}
                          </span>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">
                No groups yet. Create one or join via an invite link.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Baby className="h-5 w-5 text-sky-500" />
                Kids classrooms
              </h2>
              <Link href="/kids/classrooms/new">
                <Button size="sm" variant="secondary">
                  <Plus className="mr-1 h-4 w-4" />
                  New classroom
                </Button>
              </Link>
            </div>
            {classrooms.length > 0 ? (
              <ul className="space-y-2">
                {classrooms.map((c) => (
                  <li key={c.id}>
                    <div className="flex items-stretch rounded-lg border border-stone-100 hover:border-sky-200 hover:bg-sky-50">
                      <div className="flex items-center pl-1">
                        <ClassroomManageMenu
                          classroomId={c.id}
                          classroomName={c.name}
                          canManage={c.isOwner}
                        />
                      </div>
                      <Link
                        href={`/kids/classrooms/${c.id}`}
                        className="min-w-0 flex-1 p-4"
                      >
                        {c.name}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">
                No classrooms yet. Host a Kids Bible lesson for your church.
              </p>
            )}
            <Link
              href="/kids"
              className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline"
            >
              Go to Kids section →
            </Link>
          </section>
        </div>

        <section className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white p-6">
          <Users className="mx-auto h-8 w-8 text-stone-400" />
          <p className="mt-2 text-center text-sm text-stone-600">
            Have an invite? Join a group to unlock today&apos;s reading, members,
            and the Q&amp;A forum.
          </p>
          <JoinInviteForm />
        </section>
      </main>
    </div>
  );
}
