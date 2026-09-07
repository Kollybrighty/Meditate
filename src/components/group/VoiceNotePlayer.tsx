"use client";

import { Mic } from "lucide-react";

export default function VoiceNotePlayer({ src }: { src: string }) {
  return (
    <div className="mt-3">
      <p className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-stone-600">
        <Mic className="h-3.5 w-3.5" />
        Voice note
      </p>
      <audio className="h-10 w-full max-w-md" controls preload="metadata" src={src} />
    </div>
  );
}
