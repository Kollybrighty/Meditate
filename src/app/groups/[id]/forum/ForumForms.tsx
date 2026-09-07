"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import VoiceNoteRecorder from "@/components/group/VoiceNoteRecorder";
import { takeForumQuote } from "@/lib/bible/share";
import {
  createForumPost,
  createForumReply,
  type ForumState,
} from "./actions";

const initialState: ForumState = {};

export function NewQuestionForm({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(
    createForumPost,
    initialState
  );
  const [quote, setQuote] = useState("");

  useEffect(() => {
    const saved = takeForumQuote();
    if (saved) setQuote(saved);
  }, []);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="groupId" value={groupId} />
      <label htmlFor="body" className="block text-sm font-medium">
        Ask a question
      </label>
      <Textarea
        id="body"
        name="body"
        rows={quote ? 6 : 3}
        value={quote}
        onChange={(event) => setQuote(event.target.value)}
        placeholder="What stood out in today's reading? What are you wrestling with?"
      />
      <VoiceNoteRecorder inputName="voiceNote" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Posting…" : "Post question"}
      </Button>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function ReplyForm({
  groupId,
  postId,
}: {
  groupId: string;
  postId: string;
}) {
  const [state, formAction, pending] = useActionState(
    createForumReply,
    initialState
  );
  const [resetSignal, setResetSignal] = useState(0);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setResetSignal((value) => value + 1);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="postId" value={postId} />
      <label htmlFor="reply" className="block text-sm font-medium">
        Reply
      </label>
      <Textarea
        id="reply"
        name="body"
        rows={3}
        placeholder="Share a thought, scripture, or record a voice note below."
      />
      <VoiceNoteRecorder inputName="voiceNote" resetSignal={resetSignal} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Posting…" : "Post reply"}
      </Button>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
