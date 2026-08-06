"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Baby } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClassroom, type CreateClassroomState } from "./actions";

const initialState: CreateClassroomState = {};

export default function NewClassroomPage() {
  const [state, formAction, pending] = useActionState(createClassroom, initialState);

  return (
    <div className="min-h-screen bg-sky-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Link href="/kids/host" className="mb-6 inline-flex items-center gap-2 text-sm text-sky-700 hover:underline">
          ← Your classrooms
        </Link>
        <div className="mb-6 flex items-center gap-3">
          <Baby className="h-10 w-10 text-sky-500" />
          <h1 className="text-2xl font-bold text-sky-900">Host a classroom</h1>
        </div>

        <form action={formAction} className="space-y-5 rounded-xl border border-sky-200 bg-white p-8 shadow-sm">
          {state.error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {state.error}
            </p>
          ) : null}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Classroom name
            </label>
            <Input id="name" name="name" required placeholder="Sunday Kids Class" />
          </div>
          <div>
            <label htmlFor="ageRange" className="mb-1 block text-sm font-medium">
              Age range <span className="font-normal text-stone-500">(optional)</span>
            </label>
            <Input id="ageRange" name="ageRange" placeholder="Ages 6–10" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Create classroom"}
          </Button>
        </form>
      </div>
    </div>
  );
}
