"use client";

import { useEffect } from "react";
import { flushProgressQueue } from "@/lib/offline/progress-queue";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .catch(() => {
        // Offline features stay optional if the worker cannot register.
      });

    void flushProgressQueue();
    const onOnline = () => {
      void flushProgressQueue();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
