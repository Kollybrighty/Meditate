"use client";

import { useEffect } from "react";
import { reportBrowserError } from "@/lib/errors/report-client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportBrowserError(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#faf8f5",
          color: "#1c1917",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ color: "#b8860b", fontWeight: 600 }}>Something went wrong</p>
          <h1 style={{ fontSize: 28, margin: "8px 0" }}>Meditate hit an unexpected error</h1>
          <p style={{ color: "#57534e" }}>
            The problem was recorded. Try again, or return to the home page.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: "#b8860b",
                color: "white",
                border: 0,
                borderRadius: 8,
                padding: "10px 16px",
                font: "inherit",
              }}
            >
              Try again
            </button>
            {/* This file replaces the root layout, so the Next.js link component is not available. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ color: "#b8860b", alignSelf: "center" }}>
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
