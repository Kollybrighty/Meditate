"use client";

import { useActionState, useEffect, useRef } from "react";
import { Hand } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  raiseHand,
  updateRaisedHand,
  type LessonActionState,
} from "@/app/kids/classrooms/[id]/lesson/[lessonId]/session-actions";
import { useRealtimeRefresh } from "@/components/kids/useRealtimeRefresh";

export type RaisedHand = {
  id: string;
  child_profile_id: string;
  status: string;
  raised_at: string;
  child_name: string;
};

const initialState: LessonActionState = {};

export default function RaiseHandPanel({
  classroomId,
  lessonId,
  isStaff,
  admittedChildren,
  hands,
  lessonActive,
}: {
  classroomId: string;
  lessonId: string;
  isStaff: boolean;
  admittedChildren: { id: string; display_name: string }[];
  hands: RaisedHand[];
  lessonActive: boolean;
}) {
  const [raiseState, raiseAction, raisePending] = useActionState(
    raiseHand,
    initialState
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateRaisedHand,
    initialState
  );

  useRealtimeRefresh({
    channel: `hands:${lessonId}`,
    table: "raised_hands",
    filter: `lesson_id=eq.${lessonId}`,
    enabled: lessonActive,
  });

  const activeHands = hands.filter(
    (hand) => hand.status === "raised" || hand.status === "called_on"
  );

  const seenHands = useRef<Set<string>>(new Set());
  const ready = useRef(false);

  useEffect(() => {
    if (!isStaff) return;
    const raised = hands.filter((hand) => hand.status === "raised");
    if (!ready.current) {
      raised.forEach((hand) => seenHands.current.add(hand.id));
      ready.current = true;
      return;
    }
    if (typeof Notification === "undefined") return;
    for (const hand of raised) {
      if (seenHands.current.has(hand.id)) continue;
      seenHands.current.add(hand.id);
      if (Notification.permission === "granted") {
        new Notification("Hand raised", {
          body: `${hand.child_name} has a question.`,
          tag: `hand-${hand.id}`,
        });
      }
    }
  }, [hands, isStaff]);

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="flex items-center gap-2 font-semibold text-sky-900">
        <Hand className="h-5 w-5" />
        Raised hands
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        {isStaff
          ? "Call on a child or dismiss their hand."
          : "Raise a hand when you have a question."}
      </p>

      {!isStaff && lessonActive && admittedChildren.length > 0 ? (
        <form action={raiseAction} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="classroomId" value={classroomId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          {admittedChildren.length === 1 ? (
            <input type="hidden" name="childId" value={admittedChildren[0].id} />
          ) : (
            <div>
              <label htmlFor="raise-child" className="mb-1 block text-sm font-medium">
                Raise hand for
              </label>
              <select
                id="raise-child"
                name="childId"
                required
                className="rounded-lg border border-stone-300 px-3 py-2"
              >
                {admittedChildren.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button type="submit" size="sm" disabled={raisePending}>
            {raisePending ? "Raising…" : "Raise hand"}
          </Button>
        </form>
      ) : null}

      <ul className="mt-4 space-y-2">
        {activeHands.length === 0 ? (
          <li className="text-sm text-stone-500">No hands raised.</li>
        ) : (
          activeHands.map((hand) => (
            <li
              key={hand.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 ${
                hand.status === "called_on"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <p className="text-sm font-medium text-stone-800">
                {hand.child_name}
                <span className="ml-2 text-xs uppercase text-stone-500">
                  {hand.status === "called_on" ? "called on" : "waiting"}
                </span>
              </p>
              <div className="flex gap-2">
                {isStaff && hand.status === "raised" ? (
                  <form action={updateAction}>
                    <input type="hidden" name="classroomId" value={classroomId} />
                    <input type="hidden" name="lessonId" value={lessonId} />
                    <input type="hidden" name="handId" value={hand.id} />
                    <input type="hidden" name="status" value="called_on" />
                    <Button type="submit" size="sm" disabled={updatePending}>
                      Call on
                    </Button>
                  </form>
                ) : null}
                <form action={updateAction}>
                  <input type="hidden" name="classroomId" value={classroomId} />
                  <input type="hidden" name="lessonId" value={lessonId} />
                  <input type="hidden" name="handId" value={hand.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={isStaff ? "dismissed" : "lowered"}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    disabled={updatePending}
                  >
                    {isStaff ? "Dismiss" : "Lower hand"}
                  </Button>
                </form>
              </div>
            </li>
          ))
        )}
      </ul>

      {raiseState.error || updateState.error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {raiseState.error || updateState.error}
        </p>
      ) : null}
    </section>
  );
}
