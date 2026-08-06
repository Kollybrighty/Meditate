"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createGroup } from "./actions";

const SCOPES = [
  { value: "full_bible", label: "Genesis to Revelation" },
  { value: "old_testament", label: "Old Testament only" },
  { value: "new_testament", label: "New Testament only" },
  { value: "chronological", label: "Chronological order" },
];

const ALL_DURATIONS = [
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "yearly", label: "Yearly" },
];

const NT_DURATIONS = [
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
];

export default function NewGroupPage() {
  const [scope, setScope] = useState("full_bible");
  const durations = scope === "new_testament" ? NT_DURATIONS : ALL_DURATIONS;

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-gold">
          ← Back to dashboard
        </Link>
        <div className="mb-6 flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <h1 className="text-2xl font-bold text-earth">Create Bible study group</h1>
        </div>

        <form action={createGroup} className="space-y-5 rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Group name (must be unique)
            </label>
            <Input id="name" name="name" required placeholder="Grace Church Bible Study" />
          </div>

          <div>
            <label htmlFor="readingScope" className="mb-1 block text-sm font-medium">
              Reading scope
            </label>
            <select
              id="readingScope"
              name="readingScope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            >
              {SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="planType" className="mb-1 block text-sm font-medium">
              Duration
            </label>
            <select
              id="planType"
              name="planType"
              defaultValue="yearly"
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            >
              {durations.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            {scope === "new_testament" && (
              <p className="mt-1 text-xs text-amber-700">
                NT-only groups are limited to 3 or 6 month plans.
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Create group
          </Button>
        </form>
      </div>
    </div>
  );
}
