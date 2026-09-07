"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ReadingChapter } from "@/lib/bible/plan";
import { passageRequestUrl } from "@/lib/bible/passage";
import { useBibleVersion } from "@/components/group/BibleVersionSelect";
import { hasInAppText } from "@/lib/bible/versions";

const CACHE = "meditate-reading-v1";

export default function OfflineReadingBar({
  chapters,
  pageUrls,
}: {
  chapters: ReadingChapter[];
  pageUrls: string[];
}) {
  const [online, setOnline] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { version } = useBibleVersion();
  const inApp = hasInAppText(version);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    setSaved(false);
  }, [version.id]);

  async function saveOffline() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const origin = window.location.origin;
      if ("caches" in window) {
        const cache = await caches.open(CACHE);
        await Promise.all(
          pageUrls.map(async (path) => {
            const url = new URL(path, origin).toString();
            const res = await fetch(url, { credentials: "same-origin" });
            if (res.ok) await cache.put(url, res.clone());
          })
        );
      }
      for (const chapter of chapters) {
        const path = passageRequestUrl(chapter.book, chapter.chapter, version.id);
        const url = new URL(path, origin).toString();
        const res = await fetch(url, { credentials: "same-origin" });
        if (!res.ok) continue;
        if ("caches" in window) {
          const cache = await caches.open(CACHE);
          await cache.put(url, res.clone());
        }
      }
      setSaved(true);
    } catch {
      setError("Could not save this reading. Try again while online.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => void saveOffline()}
        disabled={saving || !online || !inApp}
      >
        <Download className="mr-1 h-4 w-4" />
        {saving ? "Saving…" : "Save for offline"}
      </Button>
      {!inApp ? (
        <p className="text-xs text-stone-500">
          Save for offline is available for WEB and KJV.
        </p>
      ) : !online ? (
        <p className="text-xs text-amber-800">
          You are offline. Saved passages can still be read and heard.
        </p>
      ) : saved ? (
        <p className="text-xs text-emerald-700">
          Saved on this device. You can read and listen without a connection.
        </p>
      ) : (
        <p className="text-xs text-stone-500">
          Save while online to keep this day (and nearby days) on this device.
        </p>
      )}
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
