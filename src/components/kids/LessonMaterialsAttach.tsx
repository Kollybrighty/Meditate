"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  attachLessonMaterial,
  type LessonActionState,
} from "@/app/kids/classrooms/[id]/lesson/[lessonId]/session-actions";
import MaterialUpload from "@/components/kids/MaterialUpload";

type Material = {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at?: string;
};

const initialState: LessonActionState = {};

export default function LessonMaterialsAttach({
  classroomId,
  lessonId,
  materials,
  linkedIds,
  isStaff,
}: {
  classroomId: string;
  lessonId: string;
  materials: Material[];
  linkedIds: string[];
  isStaff: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    attachLessonMaterial,
    initialState
  );
  const linked = new Set(linkedIds);
  const shown =
    linkedIds.length > 0
      ? materials.filter((item) => linked.has(item.id))
      : materials;
  const unlinked = materials.filter((item) => !linked.has(item.id));

  return (
    <div className="mt-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-sky-900">
          {linkedIds.length > 0 ? "Materials for this lesson" : "Classroom uploads"}
        </h3>
        {shown.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {shown.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3">
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block flex-1 rounded-lg border border-sky-100 px-4 py-3 hover:bg-sky-50"
                >
                  <span className="font-medium text-stone-800">{item.title}</span>
                  <span className="ml-2 text-xs uppercase text-stone-500">
                    {item.file_type}
                  </span>
                </a>
                {isStaff && linked.has(item.id) ? (
                  <form action={formAction}>
                    <input type="hidden" name="classroomId" value={classroomId} />
                    <input type="hidden" name="lessonId" value={lessonId} />
                    <input type="hidden" name="materialId" value={item.id} />
                    <input type="hidden" name="attach" value="false" />
                    <Button type="submit" size="sm" variant="outline" disabled={pending}>
                      Unlink
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            No files on this lesson yet. Upload one below.
          </p>
        )}

        {isStaff && unlinked.length > 0 ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-stone-700">
              Attach a file already in this classroom
            </p>
            <ul className="mt-2 space-y-2">
              {unlinked.map((item) => (
                <li key={item.id}>
                  <form action={formAction} className="flex items-center justify-between gap-3">
                    <input type="hidden" name="classroomId" value={classroomId} />
                    <input type="hidden" name="lessonId" value={lessonId} />
                    <input type="hidden" name="materialId" value={item.id} />
                    <span className="text-sm text-stone-700">{item.title}</span>
                    <Button type="submit" size="sm" variant="outline" disabled={pending}>
                      Attach
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {state.error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="mt-3 text-sm text-emerald-700" role="status">
            {state.success}
          </p>
        ) : null}
      </div>

      {isStaff ? (
        <MaterialUpload
          classroomId={classroomId}
          lessonId={lessonId}
          materials={shown}
          showList={false}
        />
      ) : null}
    </div>
  );
}
