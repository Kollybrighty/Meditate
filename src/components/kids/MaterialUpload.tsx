"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  uploadLessonMaterial,
  type LessonActionState,
} from "@/app/kids/classrooms/[id]/lesson/[lessonId]/session-actions";

type Material = {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at: string;
};

const initialState: LessonActionState = {};

export default function MaterialUpload({
  classroomId,
  materials,
}: {
  classroomId: string;
  materials: Material[];
}) {
  const [state, formAction, pending] = useActionState(uploadLessonMaterial, initialState);

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-6">
      <h2 className="font-semibold text-sky-900">Teaching materials</h2>
      <p className="mt-1 text-sm text-stone-600">
        Upload your own PDFs, images, or DOCX files for this classroom (max 10 MB).
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="classroomId" value={classroomId} />
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Material title
          </label>
          <Input id="title" name="title" required placeholder="David worksheet" />
        </div>
        <div>
          <label htmlFor="file" className="mb-1 block text-sm font-medium">
            File
          </label>
          <input
            id="file"
            name="file"
            type="file"
            required
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,application/pdf,image/*"
            className="block w-full text-sm text-stone-600"
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Uploading…" : "Upload material"}
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

      <ul className="mt-6 space-y-2">
        {materials.length === 0 ? (
          <li className="text-sm text-stone-500">No uploaded materials yet.</li>
        ) : (
          materials.map((m) => (
            <li key={m.id}>
              <a
                href={m.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-sky-100 px-4 py-3 hover:bg-sky-50"
              >
                <span className="font-medium text-stone-800">{m.title}</span>
                <span className="text-xs uppercase text-stone-500">{m.file_type}</span>
              </a>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
