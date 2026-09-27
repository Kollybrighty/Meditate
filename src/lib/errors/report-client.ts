"use client";

export function reportBrowserError(error: { message?: string; digest?: string }) {
  void fetch("/api/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: error.message || "Unknown error",
      path: window.location.pathname,
      digest: error.digest,
    }),
  }).catch(() => undefined);
}
