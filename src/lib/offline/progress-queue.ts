export type QueuedProgress = {
  groupId: string;
  progressDate: string;
  completed: boolean;
};

const KEY = "meditate-progress-queue";

export function getProgressQueue(): QueuedProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedProgress[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function enqueueProgress(item: QueuedProgress) {
  const next = getProgressQueue().filter(
    (row) =>
      !(row.groupId === item.groupId && row.progressDate === item.progressDate)
  );
  next.push(item);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export async function flushProgressQueue(): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;
  const queue = getProgressQueue();
  if (queue.length === 0) return 0;

  const remaining: QueuedProgress[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      const res = await fetch("/api/reading/progress", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) synced += 1;
      else remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }

  window.localStorage.setItem(KEY, JSON.stringify(remaining));
  return synced;
}
