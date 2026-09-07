"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ReadingChapter } from "@/lib/bible/plan";
import { formatPassage } from "@/lib/bible/plan";
import { fetchPassage, passagePlainText } from "@/lib/bible/passage";
import {
  isSpeechSupported,
  speakEnglish,
  stopSpeech,
} from "@/lib/bible/speech";
import { useBibleVersion } from "@/components/group/BibleVersionSelect";
import { hasInAppText } from "@/lib/bible/versions";

type Status = "idle" | "loading" | "playing" | "paused";

export default function ReadingListenBar({
  chapters,
}: {
  chapters: ReadingChapter[];
}) {
  const { version } = useBibleVersion();
  const inApp = hasInAppText(version);
  const [status, setStatus] = useState<Status>("idle");
  const [current, setCurrent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    cancelledRef.current = true;
    stopSpeech();
    setStatus("idle");
    setCurrent("");
  }, [version.id]);

  function stop() {
    cancelledRef.current = true;
    stopSpeech();
    setStatus("idle");
    setCurrent("");
  }

  function pauseOrResume() {
    if (!isSpeechSupported()) return;
    if (status === "playing") {
      window.speechSynthesis.pause();
      setStatus("paused");
      return;
    }
    if (status === "paused") {
      window.speechSynthesis.resume();
      setStatus("playing");
    }
  }

  async function playFrom(startIndex: number) {
    if (!isSpeechSupported()) {
      setError("This browser cannot read aloud.");
      return;
    }
    cancelledRef.current = false;
    setError(null);
    setStatus("loading");

    for (let i = startIndex; i < chapters.length; i += 1) {
      if (cancelledRef.current) return;
      const chapter = chapters[i];
      setCurrent(formatPassage(chapter));
      const passage = await fetchPassage(chapter.book, chapter.chapter, version.id);
      const text = passagePlainText(passage);
      if (!text || cancelledRef.current) continue;

      setStatus("playing");
      const result = await speakEnglish(`${formatPassage(chapter)}. ${text}`);
      if (result === "stopped" || cancelledRef.current) return;
    }

    if (!cancelledRef.current) {
      setStatus("idle");
      setCurrent("");
    }
  }

  if (chapters.length === 0) return null;

  if (!inApp) {
    return (
      <div className="mt-4 rounded-lg border border-stone-100 bg-stone-50 p-4">
        <p className="text-sm font-medium text-stone-800">Listen</p>
        <p className="mt-1 text-xs text-stone-500">
          In-app listen is available for the World English Bible and King James
          Version. Switch versions above, or read this edition on Bible Gateway.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-stone-100 bg-stone-50 p-4">
      <p className="text-sm font-medium text-stone-800">Listen</p>
      <p className="mt-1 text-xs text-stone-500">
        Reads this day&apos;s {version.name} text on this device. Save for
        offline first if you want to listen without a connection.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {status === "idle" || status === "loading" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void playFrom(0)}
            disabled={status === "loading"}
          >
            <Play className="mr-1 h-4 w-4" />
            {status === "loading" ? "Loading…" : "Listen to this day"}
          </Button>
        ) : (
          <>
            <Button type="button" size="sm" variant="outline" onClick={pauseOrResume}>
              {status === "paused" ? (
                <>
                  <Play className="mr-1 h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="mr-1 h-4 w-4" />
                  Pause
                </>
              )}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={stop}>
              <Square className="mr-1 h-4 w-4" />
              Stop
            </Button>
          </>
        )}
      </div>
      {current ? (
        <p className="mt-2 text-xs text-stone-600">Now reading {current}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
