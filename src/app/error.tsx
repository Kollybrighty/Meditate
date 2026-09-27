"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportBrowserError } from "@/lib/errors/report-client";
import { Button } from "@/components/ui/Button";

export default function AppError({
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
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-gold">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">
          This page could not be shown
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          The problem was recorded. You can try again, or go back to the home page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/">
            <Button type="button" variant="outline">
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
