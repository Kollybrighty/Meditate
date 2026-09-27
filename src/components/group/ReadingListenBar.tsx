"use client";

import { useEffect, useRef } from "react";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ReadingChapter } from "@/lib/bible/plan";
import { fetchPassage } from "@/lib/bible/passage";
import { buildReadingItems } from "@/lib/bible/reading-follow";
import {
  isReadingLoadCurrent,
  isReadingSupported,
  pauseReading,
  resumeReading,
  setReadingLoading,
  startReading,
  stopReading,
  useReadingPlayer,
} from "@/lib/bible/reading-player";
import { useBibleVersion } from "@/components/group/BibleVersionSelect";
import { formatInAppVersionList, hasInAppText } from "@/lib/bible/versions";

export default function ReadingListenBar({
  chapters,
  groupId,
}: {
  chapters: ReadingChapter[];
  groupId: string;
}) {
  const { version } = useBibleVersion();
  const player = useReadingPlayer();
  const inApp = hasInAppText(version);

  const versionRef = useRef(version.id);
  useEffect(() => {
    if (versionRef.current === version.id) return;
    versionRef.current = version.id;
    stopReading();
  }, [version.id]);

  async function playFrom(startIndex: number) {
    if (!isReadingSupported()) return;
    const returnHref = `${window.location.pathname}${window.location.search}`;
    const token = setReadingLoading({
      groupId,
      returnHref,
      versionId: version.id,
    });

    const loaded = [];
    for (let i = startIndex; i < chapters.length; i += 1) {
      const chapter = chapters[i];
      const passage = await fetchPassage(chapter.book, chapter.chapter, version.id);
      loaded.push({
        book: chapter.book,
        chapter: chapter.chapter,
        verses: passage.verses ?? [],
      });
    }

    if (!isReadingLoadCurrent(token)) return;

    startReading({
      items: buildReadingItems(loaded),
      groupId,
      returnHref,
      versionId: version.id,
    });
  }

  if (chapters.length === 0) return null;

  if (!inApp) {
    return (
      <div className="mt-4 rounded-lg border border-stone-100 bg-stone-50 p-4">
        <p className="text-sm font-medium text-stone-800">Listen</p>
        <p className="mt-1 text-xs text-stone-500">
          In-app listen is available for {formatInAppVersionList()}. Switch
          versions above, or read this edition on Bible Gateway.
        </p>
      </div>
    );
  }

  const active = player.status !== "idle";

  return (
    <div className="mt-4 rounded-lg border border-stone-100 bg-stone-50 p-4">
      <p className="text-sm font-medium text-stone-800">Listen</p>
      <p className="mt-1 text-xs text-stone-500">
        Reads this day&apos;s {version.name} text on this device. Pause any time
        and the page follows along as it reads. Audio keeps going if you leave
        this page — use Pause or the bar at the bottom to continue.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!active || player.status === "loading" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void playFrom(0)}
            disabled={player.status === "loading"}
          >
            <Play className="mr-1 h-4 w-4" />
            {player.status === "loading" ? "Loading…" : "Listen to this day"}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={player.status === "paused" ? resumeReading : pauseReading}
            >
              {player.status === "paused" ? (
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
            <Button type="button" size="sm" variant="secondary" onClick={stopReading}>
              <Square className="mr-1 h-4 w-4" />
              Stop
            </Button>
          </>
        )}
      </div>
      {player.label ? (
        <p className="mt-2 text-xs text-stone-600">Now reading {player.label}</p>
      ) : null}
      {player.error ? (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {player.error}
        </p>
      ) : null}
    </div>
  );
}
