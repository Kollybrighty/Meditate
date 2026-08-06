"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  selectCharacter,
  type LessonActionState,
} from "@/app/kids/classrooms/[id]/lesson/[lessonId]/session-actions";

type Character = {
  id: string;
  name: string;
  testament: string;
  personality_traits: string[] | unknown;
  story_summary: string;
};

const initialState: LessonActionState = {};

export default function CharacterPicker({
  classroomId,
  lessonId,
  characters,
}: {
  classroomId: string;
  lessonId: string;
  characters: Character[];
}) {
  const [state, formAction, pending] = useActionState(selectCharacter, initialState);

  const oldTestament = characters.filter((c) => c.testament === "old");
  const newTestament = characters.filter((c) => c.testament === "new");

  function TraitList({ traits }: { traits: string[] | unknown }) {
    const list = Array.isArray(traits) ? (traits as string[]) : [];
    if (list.length === 0) return null;
    return (
      <p className="mt-1 text-xs text-sky-700">{list.join(" · ")}</p>
    );
  }

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="font-semibold text-sky-900">Choose a Bible character</h2>
      <p className="mt-1 text-sm text-stone-600">
        Pick who you will teach about in this session.
      </p>
      {state.error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <div className="mt-6 space-y-6">
        {[
          { label: "Old Testament", items: oldTestament },
          { label: "New Testament", items: newTestament },
        ].map((group) => (
          <div key={group.label}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-800">
              {group.label}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.items.map((character) => (
                <form key={character.id} action={formAction}>
                  <input type="hidden" name="classroomId" value={classroomId} />
                  <input type="hidden" name="lessonId" value={lessonId} />
                  <input type="hidden" name="characterId" value={character.id} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-xl border border-sky-100 bg-sky-50/50 p-4 text-left transition hover:border-sky-400 hover:bg-sky-50 disabled:opacity-60"
                  >
                    <span className="font-semibold text-sky-900">{character.name}</span>
                    <TraitList traits={character.personality_traits} />
                    <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                      {character.story_summary}
                    </p>
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
      {pending ? <p className="mt-3 text-sm text-stone-500">Selecting…</p> : null}
    </section>
  );
}
