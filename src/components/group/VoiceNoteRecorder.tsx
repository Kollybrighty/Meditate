"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MAX_VOICE_SECONDS } from "@/lib/forum-voice-shared";

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function VoiceNoteRecorder({
  inputName,
  resetSignal,
}: {
  inputName: string;
  resetSignal?: number;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  function clearTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function reset() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    chunksRef.current = [];
    stopStream();
    clearTimer();
    clearPreview();
    setRecording(false);
    setSeconds(0);
    setError(null);
  }

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      stopStream();
      clearTimer();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // previewUrl is only for revoke on unmount of the latest blob
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetSignal === undefined) return;
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  function attachFile(blob: Blob) {
    const mime = blob.type || "audio/webm";
    const ext = mime.includes("mp4") ? "m4a" : "webm";
    const file = new File([blob], `voice-note.${ext}`, { type: mime });
    const input = fileRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    const url = URL.createObjectURL(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
  }

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser cannot record audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stopStream();
        clearTimer();
        setRecording(false);
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];
        if (blob.size > 0) attachFile(blob);
      };
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((value) => {
          const next = value + 1;
          if (next >= MAX_VOICE_SECONDS) {
            recorder.stop();
            return MAX_VOICE_SECONDS;
          }
          return next;
        });
      }, 1000);
    } catch {
      stopStream();
      setError("Microphone access was blocked. Allow it to record a voice note.");
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  return (
    <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
      <p className="text-sm font-medium text-stone-800">Voice note</p>
      <p className="mt-1 text-xs text-stone-500">
        Optional. Record up to 2 minutes. You can send a voice note with or
        without text.
      </p>
      <input
        ref={fileRef}
        type="file"
        name={inputName}
        accept="audio/*"
        className="hidden"
        aria-hidden="true"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {recording ? (
          <>
            <Button type="button" size="sm" variant="secondary" onClick={stopRecording}>
              <Square className="mr-1 h-4 w-4" />
              Stop {formatClock(seconds)}
            </Button>
            <span className="text-xs text-red-700">Recording</span>
          </>
        ) : previewUrl ? (
          <>
            <audio className="h-10 max-w-full" controls src={previewUrl} />
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              <Trash2 className="mr-1 h-4 w-4" />
              Remove
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={() => void startRecording()}>
            <Mic className="mr-1 h-4 w-4" />
            Record voice note
          </Button>
        )}
      </div>
      {error ? (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
