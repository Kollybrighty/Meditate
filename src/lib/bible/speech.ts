export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let speechGeneration = 0;

export function stopSpeech() {
  speechGeneration += 1;
  if (typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
  }
}

export function pauseSpeech() {
  if (typeof window !== "undefined") {
    window.speechSynthesis?.pause();
  }
}

export function resumeSpeech() {
  if (typeof window !== "undefined") {
    window.speechSynthesis?.resume();
  }
}

export function isSpeechActive(): boolean {
  return Boolean(window.speechSynthesis?.speaking);
}

export function isEnginePaused(): boolean {
  return Boolean(window.speechSynthesis?.paused);
}

function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en-us")) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
  );
}

export function waitForVoices(): Promise<void> {
  if (window.speechSynthesis.getVoices().length > 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const finish = () => resolve();
    window.speechSynthesis.addEventListener("voiceschanged", finish, {
      once: true,
    });
    window.setTimeout(finish, 400);
  });
}

function chunkText(text: string, max = 1800): string[] {
  const parts: string[] = [];
  let remaining = text.trim();
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf(". ", max);
    if (cut < max / 2) cut = remaining.lastIndexOf(" ", max);
    if (cut < 1) cut = max;
    parts.push(remaining.slice(0, cut + 1).trim());
    remaining = remaining.slice(cut + 1).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

function speakChunk(text: string, generation: number): Promise<void> {
  return new Promise((resolve) => {
    if (generation !== speechGeneration) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    const voice = pickEnglishVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export async function speakEnglish(text: string): Promise<"done" | "stopped"> {
  if (!isSpeechSupported() || !text.trim()) return "stopped";
  const generation = ++speechGeneration;
  await waitForVoices();
  if (generation !== speechGeneration) return "stopped";

  for (const chunk of chunkText(text)) {
    if (generation !== speechGeneration) return "stopped";
    await speakChunk(chunk, generation);
  }

  return generation === speechGeneration ? "done" : "stopped";
}
