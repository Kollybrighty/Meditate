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

export default function ChildrenClient({ childrenList }: { childrenList: Child[] }) {
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
            <h1 className="text-2xl font-bold text-sky-900">My children</h1>
          </div>
        </div>

        <section className="rounded-xl border border-sky-200 bg-white p-6">
          <h2 className="font-semibold text-sky-900">Add a child</h2>
          <form action={createAction} className="mt-4 space-y-4">
            {createState.error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{createState.error}</p>
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
          {childrenList.length === 0 ? (
            <p className="mt-2 text-sm text-stone-600">Add a child first, then enroll them.</p>
          ) : (
            <form action={enrollAction} className="mt-4 space-y-4">
              {enrollState.error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{enrollState.error}</p>
              ) : null}
              {enrollState.success ? (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {enrollState.success}
                </p>
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
                <Input id="invite" name="invite" required placeholder="sunday-kids-ab12cd" />
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
      </div>
    </div>
  );
}
