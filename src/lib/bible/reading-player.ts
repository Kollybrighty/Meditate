"use client";

import { useSyncExternalStore } from "react";
import {
  formatNowReading,
  type ReadingPlayItem,
} from "@/lib/bible/reading-follow";
import {
  isEnginePaused,
  isSpeechActive,
  isSpeechSupported,
  pauseSpeech,
  resumeSpeech,
  stopSpeech,
  waitForVoices,
} from "@/lib/bible/speech";

export type ReadingPlayerStatus = "idle" | "loading" | "playing" | "paused";

export type ReadingPlayerState = {
  status: ReadingPlayerStatus;
  current: ReadingPlayItem | null;
  label: string;
  returnHref: string | null;
  groupId: string | null;
  versionId: string | null;
  error: string | null;
};

const idleState: ReadingPlayerState = {
  status: "idle",
  current: null,
  label: "",
  returnHref: null,
  groupId: null,
  versionId: null,
  error: null,
};

let state: ReadingPlayerState = idleState;
let queue: ReadingPlayItem[] = [];
let index = 0;
let session = 0;
let loadToken = 0;
let userPaused = false;
let keepAlive: number | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setState(patch: Partial<ReadingPlayerState>) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return idleState;
}

function clearKeepAlive() {
  if (keepAlive !== null) {
    window.clearInterval(keepAlive);
    keepAlive = null;
  }
}

function startKeepAlive() {
  clearKeepAlive();
  keepAlive = window.setInterval(() => {
    if (state.status !== "playing" || userPaused) return;
    if (isEnginePaused()) {
      resumeSpeech();
    }
  }, 8000);
}

function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en-us")) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
  );
}

function speakItem(
  text: string,
  generation: number
): Promise<"ended" | "stopped"> {
  return new Promise((resolve) => {
    if (generation !== session) {
      resolve("stopped");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    const voice = pickEnglishVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      resolve(generation === session ? "ended" : "stopped");
    };
    utterance.onerror = () => {
      resolve(generation === session && userPaused ? "ended" : "stopped");
    };
    window.speechSynthesis.speak(utterance);
  });
}

async function run(generation: number) {
  if (!isSpeechSupported()) {
    setState({
      status: "idle",
      error: "This browser cannot read aloud.",
    });
    return;
  }

  await waitForVoices();
  if (generation !== session) return;
  startKeepAlive();

  while (index < queue.length) {
    if (generation !== session) return;

    while (userPaused && generation === session) {
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
    if (generation !== session) return;

    const item = queue[index];
    setState({
      status: "playing",
      current: item,
      label: formatNowReading(item),
      error: null,
    });

    const result = await speakItem(item.text, generation);
    if (generation !== session) return;
    if (userPaused) continue;
    if (result === "stopped") return;
    index += 1;
  }

  if (generation === session) {
    clearKeepAlive();
    queue = [];
    index = 0;
    setState(idleState);
  }
}

export function useReadingPlayer() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setReadingLoading(meta: {
  groupId?: string;
  returnHref?: string;
  versionId?: string;
}) {
  loadToken += 1;
  setState({
    status: "loading",
    current: null,
    label: "",
    error: null,
    groupId: meta.groupId ?? state.groupId,
    returnHref: meta.returnHref ?? state.returnHref,
    versionId: meta.versionId ?? state.versionId,
  });
  return loadToken;
}

export function isReadingLoadCurrent(token: number) {
  return token === loadToken && state.status === "loading";
}

export function startReading(options: {
  items: ReadingPlayItem[];
  groupId?: string;
  returnHref?: string;
  versionId?: string;
}) {
  stopPlayback();
  if (options.items.length === 0) {
    setState({
      ...idleState,
      error: "There is no passage text to read aloud.",
    });
    return;
  }

  queue = options.items;
  index = 0;
  userPaused = false;
  session += 1;
  setState({
    status: "playing",
    current: options.items[0],
    label: formatNowReading(options.items[0]),
    returnHref: options.returnHref ?? null,
    groupId: options.groupId ?? null,
    versionId: options.versionId ?? null,
    error: null,
  });
  void run(session);
}

export function pauseReading() {
  if (state.status !== "playing") return;
  userPaused = true;
  pauseSpeech();
  setState({ status: "paused" });
  if (isSpeechActive() && !isEnginePaused()) {
    window.setTimeout(() => {
      if (userPaused && isSpeechActive() && !isEnginePaused()) {
        stopSpeech();
        session += 1;
      }
    }, 160);
  }
}

export function resumeReading() {
  if (state.status !== "paused") return;
  userPaused = false;
  setState({ status: "playing" });
  if (isEnginePaused()) {
    resumeSpeech();
    startKeepAlive();
    return;
  }
  session += 1;
  void run(session);
}

function stopPlayback() {
  userPaused = false;
  session += 1;
  queue = [];
  index = 0;
  clearKeepAlive();
  stopSpeech();
}

export function stopReading() {
  loadToken += 1;
  stopPlayback();
  setState(idleState);
}

export function isReadingSupported() {
  return isSpeechSupported();
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      state.status === "playing" &&
      !userPaused
    ) {
      resumeSpeech();
    }
  });
}
