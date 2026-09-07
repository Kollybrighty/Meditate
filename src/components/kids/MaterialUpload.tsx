"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  deleteLessonMaterial,
  uploadLessonMaterial,
  type LessonActionState,
} from "@/app/kids/classrooms/[id]/lesson/[lessonId]/session-actions";

type Material = {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at?: string;
};

const initialState: LessonActionState = {};

export default function MaterialUpload({
  classroomId,
  lessonId,
  materials,
  showList = true,
}: {
  classroomId: string;
  lessonId?: string;
  materials: Material[];
  showList?: boolean;
}) {
  const [state, formAction, pending] = useActionState(uploadLessonMaterial, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteLessonMaterial,
    initialState
  );

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="font-semibold text-sky-900">
        {lessonId ? "Upload a file" : "Teaching materials"}
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Upload PDFs, images, or DOCX files{lessonId ? " for this lesson" : " for this classroom"}{" "}
        (max 10 MB).
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="classroomId" value={classroomId} />
        {lessonId ? <input type="hidden" name="lessonId" value={lessonId} /> : null}
        <div>
          <label htmlFor={`title-${classroomId}`} className="mb-1 block text-sm font-medium">
            Material title
          </label>
          <Input
            id={`title-${classroomId}`}
            name="title"
            required
            placeholder="Daniel worksheet"
          />
        </div>
        <div>
          <label htmlFor={`file-${classroomId}`} className="mb-1 block text-sm font-medium">
            File
          </label>
          <input
            id={`file-${classroomId}`}
            name="file"
            type="file"
            required
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,application/pdf,image/*"
            className="block w-full text-sm text-stone-600"
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Uploading…" : lessonId ? "Upload to this lesson" : "Upload material"}
        </Button>
        {state.error ? (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-700" role="status">
            {state.success}
          </p>
        ) : null}
      </form>

      {showList ? (
        <ul className="mt-6 space-y-2">
          {materials.length === 0 ? (
            <li className="text-sm text-stone-500">No uploaded materials yet.</li>
          ) : (
            materials.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-sky-100 px-4 py-3"
              >
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 hover:underline"
                >
                  <span className="font-medium text-stone-800">{m.title}</span>
                  <span className="ml-2 text-xs uppercase text-stone-500">{m.file_type}</span>
                </a>
                <form action={deleteAction}>
                  <input type="hidden" name="classroomId" value={classroomId} />
                  {lessonId ? <input type="hidden" name="lessonId" value={lessonId} /> : null}
                  <input type="hidden" name="materialId" value={m.id} />
                  <Button type="submit" size="sm" variant="outline" disabled={deleting}>
                    Delete
                  </Button>
                </form>
              </li>
            ))
          )}
        </ul>
      ) : null}
      {deleteState.error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {deleteState.error}
        </p>
      ) : null}
    </section>
  );
}
