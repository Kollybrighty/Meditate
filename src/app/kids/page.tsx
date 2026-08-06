import Link from "next/link";
import { Baby } from "lucide-react";

export default function KidsHomePage() {
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
        <p className="text-sky-700">Learn God&apos;s word. Have fun together.</p>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/kids/classrooms/new"
            className="rounded-xl border-2 border-sky-200 bg-white p-6 hover:border-sky-400"
          >
            <h2 className="font-semibold text-sky-900">Host a classroom</h2>
            <p className="mt-1 text-sm text-stone-600">Create a Kids Bible lesson for your church.</p>
          </Link>
          <Link
            href="/kids/children"
            className="rounded-xl border-2 border-sky-200 bg-white p-6 hover:border-sky-400"
          >
            <h2 className="font-semibold text-sky-900">Enroll a child</h2>
            <p className="mt-1 text-sm text-stone-600">Register your child in a teacher&apos;s classroom.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
