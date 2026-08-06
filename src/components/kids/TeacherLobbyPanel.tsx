"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  admitLobbyChild,
  leaveLobby,
  type LobbyActionState,
} from "@/app/kids/lobby-actions";

type LobbyEntry = {
  id: string;
  status: string;
  joined_at: string;
  child_profiles?: { display_name: string; age: number | null } | { display_name: string; age: number | null }[] | null;
};

const initialState: LobbyActionState = {};

function childLabel(entry: LobbyEntry) {
  const cp = entry.child_profiles;
  const profile = Array.isArray(cp) ? cp[0] : cp;
  if (!profile) return "Child";
  return profile.age ? `${profile.display_name} (age ${profile.age})` : profile.display_name;
}

export default function TeacherLobbyPanel({
  classroomId,
  lessonId,
  lobbyEntries,
}: {
  classroomId: string;
  lessonId: string;
  lobbyEntries: LobbyEntry[];
}) {
  const [admitState, admitAction, admitPending] = useActionState(admitLobbyChild, initialState);
  const [leaveState, leaveAction, leavePending] = useActionState(leaveLobby, initialState);

  const waiting = lobbyEntries.filter((e) => e.status === "waiting");
  const admitted = lobbyEntries.filter((e) => e.status === "admitted");

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="font-semibold text-sky-900">Session lobby</h2>
      <p className="mt-1 text-sm text-stone-600">
        Admit children who request to join the live session.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-amber-800">Waiting ({waiting.length})</h3>
          {waiting.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">No join requests yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {waiting.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-stone-800">{childLabel(entry)}</p>
                    <p className="text-xs text-stone-500">
                      Requested {new Date(entry.joined_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={admitAction}>
                      <input type="hidden" name="lobbyId" value={entry.id} />
                      <input type="hidden" name="classroomId" value={classroomId} />
                      <input type="hidden" name="lessonId" value={lessonId} />
                      <Button type="submit" size="sm" disabled={admitPending}>
                        Admit
                      </Button>
                    </form>
                    <form action={leaveAction}>
                      <input type="hidden" name="lobbyId" value={entry.id} />
                      <input type="hidden" name="classroomId" value={classroomId} />
                      <input type="hidden" name="lessonId" value={lessonId} />
                      <Button type="submit" size="sm" variant="outline" disabled={leavePending}>
                        Dismiss
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-emerald-800">In session ({admitted.length})</h3>
          {admitted.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">No children admitted yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {admitted.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3"
                >
                  <p className="font-medium text-stone-800">{childLabel(entry)}</p>
                  <form action={leaveAction}>
                    <input type="hidden" name="lobbyId" value={entry.id} />
                    <input type="hidden" name="classroomId" value={classroomId} />
                    <input type="hidden" name="lessonId" value={lessonId} />
                    <Button type="submit" size="sm" variant="outline" disabled={leavePending}>
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {admitState.error || leaveState.error ? (
        <p className="mt-3 text-sm text-red-700">{admitState.error || leaveState.error}</p>
      ) : null}
      {admitState.success || leaveState.success ? (
        <p className="mt-3 text-sm text-emerald-700">{admitState.success || leaveState.success}</p>
      ) : null}
    </section>
  );
}
