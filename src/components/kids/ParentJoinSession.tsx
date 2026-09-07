"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  requestJoinSession,
  leaveLobby,
  type LobbyActionState,
} from "@/app/kids/lobby-actions";
import { useRealtimeRefresh } from "@/components/kids/useRealtimeRefresh";

type ChildOption = {
  id: string;
  display_name: string;
};

type LobbyEntry = {
  id: string;
  child_profile_id: string;
  status: string;
  child_profiles?: { display_name: string } | { display_name: string }[] | null;
};

const initialState: LobbyActionState = {};

function childName(entry: LobbyEntry) {
  const cp = entry.child_profiles;
  if (Array.isArray(cp)) return cp[0]?.display_name ?? "Child";
  return cp?.display_name ?? "Child";
}

export default function ParentJoinSession({
  classroomId,
  lessonId,
  lessonTitle,
  childrenOptions,
  lobbyEntries,
}: {
  classroomId: string;
  lessonId: string;
  lessonTitle: string;
  childrenOptions: ChildOption[];
  lobbyEntries: LobbyEntry[];
}) {
  const [requestState, requestAction, requestPending] = useActionState(
    requestJoinSession,
    initialState
  );
  const [leaveState, leaveAction, leavePending] = useActionState(leaveLobby, initialState);

  useRealtimeRefresh({
    channel: `parent-lobby:${lessonId}`,
    table: "session_lobby",
    filter: `lesson_id=eq.${lessonId}`,
  });

  const admitted = lobbyEntries.filter((e) => e.status === "admitted");
  const waiting = lobbyEntries.filter((e) => e.status === "waiting");
  const availableChildren = childrenOptions.filter(
    (c) => !lobbyEntries.some((e) => e.child_profile_id === c.id && e.status !== "left")
  );

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="font-semibold text-sky-900">Join live session</h2>
      <p className="mt-1 text-sm text-stone-600">
        Live now: <span className="font-medium">{lessonTitle}</span>. Request to join, then wait
        for the teacher to admit your child.
      </p>

      {admitted.length > 0 ? (
        <div className="mt-4 space-y-3">
          {admitted.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
            >
              <p className="text-sm text-emerald-900">
                <span className="font-medium">{childName(entry)}</span> is admitted
              </p>
              <div className="flex gap-2">
                <Link href={`/kids/classrooms/${classroomId}/lesson/${lessonId}`}>
                  <Button size="sm">Enter live session</Button>
                </Link>
                <form action={leaveAction}>
                  <input type="hidden" name="lobbyId" value={entry.id} />
                  <input type="hidden" name="classroomId" value={classroomId} />
                  <input type="hidden" name="lessonId" value={lessonId} />
                  <Button type="submit" size="sm" variant="outline" disabled={leavePending}>
                    Leave
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {waiting.length > 0 ? (
        <div className="mt-4 space-y-2">
          {waiting.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
            >
              <p className="text-sm text-amber-900">
                <span className="font-medium">{childName(entry)}</span> — waiting for teacher
              </p>
              <form action={leaveAction}>
                <input type="hidden" name="lobbyId" value={entry.id} />
                <input type="hidden" name="classroomId" value={classroomId} />
                <input type="hidden" name="lessonId" value={lessonId} />
                <Button type="submit" size="sm" variant="outline" disabled={leavePending}>
                  Cancel request
                </Button>
              </form>
            </div>
          ))}
        </div>
      ) : null}

      {availableChildren.length > 0 ? (
        <form action={requestAction} className="mt-4 space-y-3">
          <input type="hidden" name="classroomId" value={classroomId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          <label htmlFor="childId" className="block text-sm font-medium">
            Request join for
          </label>
          <select
            id="childId"
            name="childId"
            required
            className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
          >
            {availableChildren.map((child) => (
              <option key={child.id} value={child.id}>
                {child.display_name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={requestPending}>
            {requestPending ? "Sending…" : "Request to join"}
          </Button>
        </form>
      ) : childrenOptions.length === 0 ? (
        <p className="mt-4 text-sm text-stone-600">
          Enroll a child first (step 2) on{" "}
          <Link href="/kids/children" className="font-medium text-sky-700 hover:underline">
            Enroll a child
          </Link>
          .
        </p>
      ) : null}

      {requestState.error || leaveState.error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {requestState.error || leaveState.error}
        </p>
      ) : null}
      {requestState.success || leaveState.success ? (
        <p className="mt-3 text-sm text-emerald-700" role="status">
          {requestState.success || leaveState.success}
        </p>
      ) : null}
    </section>
  );
}
