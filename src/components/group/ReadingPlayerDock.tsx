"use client";

import Link from "next/link";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  pauseReading,
  resumeReading,
  stopReading,
  useReadingPlayer,
} from "@/lib/bible/reading-player";

export default function ReadingPlayerDock() {
  const player = useReadingPlayer();

  if (player.status === "idle") return null;

  return (
    <>
    <div className="h-24" aria-hidden />
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto w-full max-w-4xl rounded-xl border border-stone-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gold">
              {player.status === "loading"
                ? "Loading passage"
                : player.status === "paused"
                  ? "Paused"
                  : "Now reading"}
            </p>
            <p className="truncate text-sm font-medium text-stone-900">
              {player.label || "Bible reading"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {player.returnHref ? (
              <Link
                href={player.returnHref}
                className="text-sm font-medium text-gold hover:underline"
              >
                Show passage
              </Link>
            ) : null}
            {player.status === "paused" ? (
              <Button type="button" size="sm" onClick={resumeReading}>
                <Play className="mr-1 h-4 w-4" />
                Resume
              </Button>
            ) : player.status === "playing" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={pauseReading}
              >
                <Pause className="mr-1 h-4 w-4" />
                Pause
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="secondary" onClick={stopReading}>
              <Square className="mr-1 h-4 w-4" />
              Stop
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
