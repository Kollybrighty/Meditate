"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { parseGroupInvite } from "@/lib/safe-path";

export default function JoinInviteForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invite = parseGroupInvite(value);
    if (!invite) {
      setError("Paste an invite link or code.");
      return;
    }
    setError(null);
    router.push(`/join/${encodeURIComponent(invite)}`);
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="invite" className="mb-1 block text-sm font-medium">
            Invite link or code
          </label>
          <Input
            id="invite"
            name="invite"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste invite link"
          />
        </div>
        <Button type="submit" size="sm">
          Join group
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
