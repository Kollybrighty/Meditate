"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Baby } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  createChildProfile,
  enrollChild,
  type ChildActionState,
} from "./actions";

const initialState: ChildActionState = {};

type Child = {
  id: string;
  display_name: string;
  age: number | null;
};

type EnrollmentSummary = {
  key: string;
  childName: string;
  classroomName: string;
  classroomId: string | null;
};

export default function ChildrenClient({
  childrenList,
  defaultInvite = "",
  enrollmentSummaries = [],
}: {
  childrenList: Child[];
  defaultInvite?: string;
  enrollmentSummaries?: EnrollmentSummary[];
}) {
  const [createState, createAction, createPending] = useActionState(
    createChildProfile,
    initialState
  );
  const [enrollState, enrollAction, enrollPending] = useActionState(
    enrollChild,
    initialState
  );

  return (
    <div className="min-h-screen bg-sky-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Link href="/kids" className="text-sm text-sky-700 hover:underline">
            ← Kids home
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <Baby className="h-8 w-8 text-sky-500" />
            <h1 className="text-2xl font-bold text-sky-900">Enroll a child</h1>
          </div>
          <p className="mt-1 text-stone-600">
            Step 2 — add your child and enroll them once. After that, use{" "}
            <Link href="/kids/join" className="font-medium text-sky-700 hover:underline">
              Join a class
            </Link>{" "}
            for live sessions.
          </p>
        </div>

        <section className="rounded-xl border border-sky-200 bg-white p-6">
          <h2 className="font-semibold text-sky-900">Add a child</h2>
          <form action={createAction} className="mt-4 space-y-4">
            {createState.error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {createState.error}
              </p>
            ) : null}
            {createState.success ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {createState.success}
              </p>
            ) : null}
            <div>
              <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
                Display name
              </label>
              <Input id="displayName" name="displayName" required placeholder="Ada" />
            </div>
            <div>
              <label htmlFor="age" className="mb-1 block text-sm font-medium">
                Age <span className="font-normal text-stone-500">(optional)</span>
              </label>
              <Input id="age" name="age" type="number" min={1} max={18} />
            </div>
            <Button type="submit" disabled={createPending}>
              {createPending ? "Saving…" : "Add child"}
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-sky-200 bg-white p-6">
          <h2 className="font-semibold text-sky-900">Enroll in a classroom</h2>
          <p className="mt-1 text-sm text-stone-600">
            Use the teacher&apos;s invite code or slug. You only need to do this once per
            classroom.
          </p>
          {childrenList.length === 0 ? (
            <p className="mt-2 text-sm text-stone-600">Add a child first, then enroll them.</p>
          ) : (
            <form action={enrollAction} className="mt-4 space-y-4">
              {enrollState.error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {enrollState.error}
                </p>
              ) : null}
              {enrollState.success ? (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <p>{enrollState.success}</p>
                  <Link
                    href="/kids/join"
                    className="mt-1 inline-block font-medium underline"
                  >
                    Go to Join a class →
                  </Link>
                </div>
              ) : null}
              <div>
                <label htmlFor="childId" className="mb-1 block text-sm font-medium">
                  Child
                </label>
                <select
                  id="childId"
                  name="childId"
                  required
                  className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
                >
                  {childrenList.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.display_name}
                      {child.age ? ` (${child.age})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="invite" className="mb-1 block text-sm font-medium">
                  Classroom invite code or slug
                </label>
                <Input
                  id="invite"
                  name="invite"
                  required
                  defaultValue={defaultInvite}
                  placeholder="sunday-kids-ab12cd"
                />
              </div>
              <Button type="submit" disabled={enrollPending}>
                {enrollPending ? "Enrolling…" : "Enroll child"}
              </Button>
            </form>
          )}
        </section>

        <section className="rounded-xl border border-sky-200 bg-white p-6">
          <h2 className="font-semibold text-sky-900">Your children</h2>
          {childrenList.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {childrenList.map((child) => (
                <li
                  key={child.id}
                  className="rounded-lg border border-sky-100 px-4 py-3 text-stone-800"
                >
                  {child.display_name}
                  {child.age ? (
                    <span className="ml-2 text-sm text-stone-500">Age {child.age}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-500">No children added yet.</p>
          )}
        </section>

        {enrollmentSummaries.length > 0 ? (
          <section className="rounded-xl border border-sky-200 bg-white p-6">
            <h2 className="font-semibold text-sky-900">Saved enrollments</h2>
            <p className="mt-1 text-sm text-stone-600">
              Already enrolled — use Join a class when a session is live.
            </p>
            <ul className="mt-3 space-y-2">
              {enrollmentSummaries.map((row) => (
                <li
                  key={row.key}
                  className="rounded-lg border border-sky-100 px-4 py-3 text-sm text-stone-800"
                >
                  <span className="font-medium">{row.childName}</span>
                  {" → "}
                  {row.classroomName}
                </li>
              ))}
            </ul>
            <Link href="/kids/join" className="mt-4 inline-block">
              <Button variant="outline">Join a class</Button>
            </Link>
          </section>
        ) : null}
      </div>
    </div>
  );
}
