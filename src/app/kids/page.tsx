import Link from "next/link";
import { Baby } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function KidsHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ count: hostedCount }, { data: children }] = await Promise.all([
    supabase
      .from("classrooms")
      .select("*", { count: "exact", head: true })
      .eq("host_id", user.id),
    supabase.from("child_profiles").select("id").eq("parent_user_id", user.id),
  ]);

  const childIds = (children ?? []).map((c) => c.id);
  let enrolledCount = 0;
  if (childIds.length > 0) {
    const { count } = await supabase
      .from("classroom_enrollments")
      .select("*", { count: "exact", head: true })
      .in("child_profile_id", childIds);
    enrolledCount = count ?? 0;
  }

  const steps = [
    {
      n: "1",
      href: "/kids/host",
      title: "Host a classroom",
      description: "Create a Kids Bible class, start live sessions, and admit children from the lobby.",
      meta:
        hostedCount && hostedCount > 0
          ? `${hostedCount} classroom${hostedCount === 1 ? "" : "s"} you host`
          : "For teachers",
    },
    {
      n: "2",
      href: "/kids/children",
      title: "Enroll a child",
      description: "Add your child once and enroll them in a classroom with an invite. Enrollment is one-time.",
      meta:
        enrolledCount > 0
          ? `${enrolledCount} enrollment${enrolledCount === 1 ? "" : "s"} saved`
          : "Do this once per classroom",
    },
    {
      n: "3",
      href: "/kids/join",
      title: "Join a class",
      description:
        "Pick a classroom you’re already enrolled in, request to join the live session, and wait in the lobby until the teacher admits you.",
      meta: "For live sessions",
    },
  ];

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="border-b border-sky-200 bg-white px-6 py-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-stone-600">
          ← Dashboard
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Baby className="h-8 w-8 text-sky-500" />
          <h1 className="text-2xl font-bold text-sky-900">Meditate Kids</h1>
        </div>
        <p className="mt-1 max-w-xl text-sky-700">
          Host → enroll once → join live. Each step has one job so nothing is repeated.
        </p>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.href}>
              <Link
                href={step.href}
                className="flex gap-4 rounded-xl border-2 border-sky-200 bg-white p-6 transition hover:border-sky-400"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-lg font-bold text-sky-800">
                  {step.n}
                </span>
                <div>
                  <h2 className="font-semibold text-sky-900">{step.title}</h2>
                  <p className="mt-1 text-sm text-stone-600">{step.description}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-sky-600">
                    {step.meta}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
