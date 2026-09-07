"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  deleteGroup,
  renameGroup,
  type GroupManageState,
} from "@/app/groups/[id]/actions";

const initialState: GroupManageState = {};

export default function GroupManageMenu({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renameState, renameAction, renaming] = useActionState(
    renameGroup,
    initialState
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteGroup,
    initialState
  );

  useEffect(() => {
    if (renameState.success) {
      setOpen(false);
      setConfirmDelete(false);
    }
  }, [renameState.success]);

  useEffect(() => {
    if (deleteState.error) setConfirmDelete(false);
  }, [deleteState.error]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={`Edit or delete ${groupName}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setConfirmDelete(false);
        }}
        className="rounded-lg p-2 text-stone-500 hover:bg-gold/10 hover:text-gold"
      >
        {open ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
          <form action={renameAction} className="space-y-2">
            <input type="hidden" name="groupId" value={groupId} />
            <label htmlFor={`rename-${groupId}`} className="text-xs font-medium text-stone-600">
              Group name
            </label>
            <Input
              id={`rename-${groupId}`}
              name="name"
              required
              defaultValue={groupName}
              className="py-2 text-sm"
            />
            <Button type="submit" size="sm" className="w-full" disabled={renaming}>
              {renaming ? "Saving…" : "Save name"}
            </Button>
            {renameState.error ? (
              <p className="text-xs text-red-700" role="alert">
                {renameState.error}
              </p>
            ) : null}
          </form>
          <div className="mt-3 border-t border-stone-100 pt-3">
            {confirmDelete ? (
              <form action={deleteAction} className="space-y-2">
                <input type="hidden" name="groupId" value={groupId} />
                <p className="text-xs text-red-800">
                  Delete {groupName}? Members, reading, and Q&amp;A will be
                  removed. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={deleting}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="text-xs font-medium text-red-700 hover:underline"
                onClick={() => setConfirmDelete(true)}
              >
                Delete group
              </button>
            )}
            {deleteState.error ? (
              <p className="mt-2 text-xs text-red-700" role="alert">
                {deleteState.error}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
