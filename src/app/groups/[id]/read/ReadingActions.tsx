"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Highlighter, MessageCircle, Play, Share2, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  toggleReadingComplete,
  type ReadingProgressState,
} from "../actions";
import type { ReadingChapter } from "@/lib/bible/plan";
import { formatPassage } from "@/lib/bible/plan";
import {
  fetchPassage,
  passagePlainText,
  type PassagePayload,
} from "@/lib/bible/passage";
import {
  enqueueProgress,
  flushProgressQueue,
  getProgressQueue,
} from "@/lib/offline/progress-queue";
import { isSpeechSupported, speakEnglish, stopSpeech } from "@/lib/bible/speech";
import { useBibleVersion } from "@/components/group/BibleVersionSelect";
import { bibleGatewayUrl, hasInAppText } from "@/lib/bible/versions";
import { cn } from "@/lib/utils";
import type { VerseMarkType } from "@/lib/verse-marks";
import { nextVerseMark } from "@/lib/verse-marks";
import {
  formatVerseForForum,
  formatVerseShare,
  saveForumQuote,
} from "@/lib/bible/share";

const initialState: ReadingProgressState = {};

export function MarkCompleteButton({
  groupId,
  progressDate,
  completed,
}: {
  groupId: string;
  progressDate: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    toggleReadingComplete,
    initialState
  );
  const [localCompleted, setLocalCompleted] = useState(completed);
  const [queued, setQueued] = useState(false);

  useEffect(() => {
    const queuedItem = getProgressQueue().find(
      (row) => row.groupId === groupId && row.progressDate === progressDate
    );
    if (queuedItem) {
      setLocalCompleted(!queuedItem.completed);
      setQueued(true);
    } else {
      setLocalCompleted(completed);
      setQueued(false);
    }
  }, [completed, groupId, progressDate]);

  useEffect(() => {
    const sync = async () => {
      const n = await flushProgressQueue();
      if (n) router.refresh();
    };
    window.addEventListener("online", sync);
    if (navigator.onLine) void sync();
    return () => window.removeEventListener("online", sync);
  }, [router]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (navigator.onLine) return;
    event.preventDefault();
    enqueueProgress({
      groupId,
      progressDate,
      completed: localCompleted,
    });
    setLocalCompleted(!localCompleted);
    setQueued(true);
  }

  return (
    <form action={formAction} onSubmit={onSubmit}>
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="progressDate" value={progressDate} />
      <input
        type="hidden"
        name="completed"
        value={localCompleted ? "true" : "false"}
      />
      <Button
        type="submit"
        variant={localCompleted ? "outline" : "primary"}
        disabled={pending}
      >
        {pending
          ? "Saving…"
          : localCompleted
            ? "Mark as unread"
            : "Mark as complete"}
      </Button>
      {queued ? (
        <p className="mt-2 text-sm text-stone-600">
          Saved on this device. It will sync when you are back online.
        </p>
      ) : null}
      {state.error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function ChapterReader({
  chapters,
  groupId,
}: {
  chapters: ReadingChapter[];
  groupId: string;
}) {
  const { version } = useBibleVersion();
  const [open, setOpen] = useState<string>(
    chapters[0] ? `${chapters[0].book}-${chapters[0].chapter}` : ""
  );

  return (
    <div className="space-y-3">
      {chapters.map((chapter) => {
        const key = `${chapter.book}-${chapter.chapter}`;
        const isOpen = open === key;
        return (
          <section
            key={key}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-3 text-left font-medium text-stone-900 hover:bg-stone-50"
              onClick={() => setOpen(isOpen ? "" : key)}
              aria-expanded={isOpen}
            >
              {formatPassage(chapter)}
              <span className="text-sm font-normal text-stone-500">
                {isOpen ? "Hide" : "Read"} · {version.abbreviation}
              </span>
            </button>
            {isOpen ? <ChapterBody chapter={chapter} groupId={groupId} /> : null}
          </section>
        );
      })}
    </div>
  );
}

function ChapterBody({
  chapter,
  groupId,
}: {
  chapter: ReadingChapter;
  groupId: string;
}) {
  const router = useRouter();
  const { version } = useBibleVersion();
  const [data, setData] = useState<PassagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [marks, setMarks] = useState<Record<number, VerseMarkType>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const inApp = hasInAppText(version);
  const gateway = bibleGatewayUrl(formatPassage(chapter), version);

  useEffect(() => {
    let cancelled = false;
    stopSpeech();
    setListening(false);

    if (!inApp) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchPassage(chapter.book, chapter.chapter, version.id).then((json) => {
      if (!cancelled) {
        setData(json);
        setLoading(false);
      }
    });
    const params = new URLSearchParams({
      version: version.id,
      book: chapter.book,
      chapter: String(chapter.chapter),
    });
    fetch(`/api/verse-marks?${params.toString()}`, { credentials: "same-origin" })
      .then(async (res) => {
        const json = (await res.json()) as {
          marks?: { verse: number; markType: VerseMarkType }[];
        };
        if (cancelled) return;
        const next: Record<number, VerseMarkType> = {};
        for (const row of json.marks ?? []) {
          next[row.verse] = row.markType;
        }
        setMarks(next);
      })
      .catch(() => {
        if (!cancelled) setMarks({});
      });
    return () => {
      cancelled = true;
      stopSpeech();
      setListening(false);
    };
  }, [chapter.book, chapter.chapter, version.id, inApp]);

  async function listenChapter() {
    if (!data || listening) return;
    if (!isSpeechSupported()) return;
    const text = passagePlainText(data);
    if (!text) return;
    setListening(true);
    await speakEnglish(`${formatPassage(chapter)}. ${text}`);
    setListening(false);
  }

  async function toggleMark(verse: number) {
    const current = marks[verse] ?? null;
    const res = await fetch("/api/verse-marks", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: version.id,
        book: chapter.book,
        chapter: chapter.chapter,
        verse,
        current,
      }),
    });
    const json = (await res.json()) as { markType?: VerseMarkType | null };
    if (!res.ok) return;
    setMarks((prev) => {
      const next = { ...prev };
      if (json.markType) next[verse] = json.markType;
      else delete next[verse];
      return next;
    });
  }

  function citationFor(verse: number) {
    const row = data?.verses.find((item) => item.verse === verse);
    if (!row) return null;
    return {
      book: chapter.book,
      chapter: chapter.chapter,
      verse,
      text: row.text,
      versionAbbreviation: version.abbreviation,
    };
  }

  async function copyVerse(verse: number) {
    const citation = citationFor(verse);
    if (!citation) return;
    const text = formatVerseShare(citation);
    try {
      await navigator.clipboard.writeText(text);
      setShareStatus("Copied. You can paste it in a message or email.");
    } catch {
      setShareStatus("Could not copy. Select the verse text and copy it.");
    }
  }

  async function shareVerse(verse: number) {
    const citation = citationFor(verse);
    if (!citation) return;
    const text = formatVerseShare(citation);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${citation.book} ${citation.chapter}:${citation.verse}`,
          text,
        });
        setShareStatus("Shared.");
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareStatus("Copied. Paste it wherever you want to share.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareStatus("Could not share from this browser. Try Copy instead.");
    }
  }

  function postVerseToForum(verse: number) {
    const citation = citationFor(verse);
    if (!citation) return;
    saveForumQuote(formatVerseForForum(citation));
    router.push(`/groups/${groupId}/forum`);
  }

  if (!inApp) {
    return (
      <div className="space-y-2 px-5 pb-5">
        <p className="text-sm font-medium text-stone-800">
          {version.abbreviation} · {version.name}
        </p>
        <p className="text-sm text-stone-600">
          This licensed edition is opened on Bible Gateway.
        </p>
        <a
          href={gateway}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-medium text-gold hover:underline"
        >
          Read {formatPassage(chapter)} in the {version.abbreviation}
        </a>
      </div>
    );
  }

  if (loading) {
    return <p className="px-5 pb-5 text-sm text-stone-500">Loading passage…</p>;
  }

  if (!data?.verses?.length) {
    return (
      <p className="px-5 pb-5 text-sm text-stone-600">
        The chapter text could not be loaded.{" "}
        <a href={gateway} target="_blank" rel="noopener noreferrer" className="font-medium text-gold hover:underline">
          Read {formatPassage(chapter)} on Bible Gateway
        </a>
      </p>
    );
  }

  return (
    <div className="space-y-3 px-5 pb-5">
      {isSpeechSupported() ? (
        <div>
          {listening ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                stopSpeech();
                setListening(false);
              }}
            >
              <Square className="mr-1 h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={() => void listenChapter()}>
              <Play className="mr-1 h-4 w-4" />
              Listen
            </Button>
          )}
        </div>
      ) : null}
      <p className="text-xs text-stone-500">
        Tap a verse, then copy, share, post it to Q&amp;A, or mark it.
      </p>
      {data.verses.map((verse) => {
        const mark = marks[verse.verse];
        const isSelected = selected === verse.verse;
        const markLabel = nextVerseMark(mark ?? null);
        return (
          <div key={verse.verse}>
            <button
              type="button"
              onClick={() => {
                setSelected(verse.verse);
                setShareStatus(null);
              }}
              className={cn(
                "block w-full rounded-md px-2 py-1 text-left text-stone-800 leading-relaxed transition-colors",
                mark === "highlight" && "bg-amber-100",
                mark === "underline" &&
                  "underline decoration-gold decoration-2 underline-offset-4",
                isSelected && "ring-2 ring-gold/50"
              )}
            >
              <sup className="mr-1 text-xs font-semibold text-gold">
                {verse.verse}
              </sup>
              {verse.text.trim()}
            </button>
            {isSelected ? (
              <div className="mt-1 mb-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void toggleMark(verse.verse)}
                >
                  <Highlighter className="mr-1 h-4 w-4" />
                  {markLabel === "highlight"
                    ? "Highlight"
                    : markLabel === "underline"
                      ? "Underline"
                      : "Clear mark"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void copyVerse(verse.verse)}
                >
                  <Copy className="mr-1 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void shareVerse(verse.verse)}
                >
                  <Share2 className="mr-1 h-4 w-4" />
                  Share
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => postVerseToForum(verse.verse)}
                >
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Post to Q&amp;A
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
      {shareStatus ? (
        <p className="text-xs text-emerald-700" role="status">
          {shareStatus}
        </p>
      ) : null}
      <p className="text-xs text-stone-500">
        {data.translation || `${version.name} (${version.abbreviation})`}.{" "}
        <a href={gateway} target="_blank" rel="noopener noreferrer" className="hover:underline">
          Open on Bible Gateway
        </a>
      </p>
    </div>
  );
}
