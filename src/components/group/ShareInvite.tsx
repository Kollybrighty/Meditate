"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Check, Copy, Facebook, MessageCircle, Share2 } from "lucide-react";

type ShareInviteProps = {
  url: string;
  groupName: string;
  /** Defaults to Bible study group wording */
  shareLabel?: string;
};

export default function ShareInvite({
  url,
  groupName,
  shareLabel = "Bible study group",
}: ShareInviteProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const message = useMemo(
    () => `Join our ${shareLabel} "${groupName}" on Meditate: ${url}`,
    [groupName, shareLabel, url]
  );

  const encodedMessage = encodeURIComponent(message);
  const encodedUrl = encodeURIComponent(url);

  const links = {
    whatsapp: `https://wa.me/?text=${encodedMessage}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
  };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `Join ${groupName} on Meditate`,
        text: `Join our ${shareLabel} "${groupName}" on Meditate`,
        url,
      });
    } catch {
      // User cancelled share sheet
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium text-stone-700">Share invite</p>
      <div className="flex flex-wrap gap-2">
        <a href={links.whatsapp} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </a>
        <a href={links.facebook} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <Facebook className="h-4 w-4" />
            Facebook
          </Button>
        </a>
        <a href={links.x} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="outline" size="sm" className="gap-2">
            Share on X
          </Button>
        </a>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        {canNativeShare ? (
          <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={nativeShare}>
            <Share2 className="h-4 w-4" />
            More
          </Button>
        ) : null}
      </div>
    </div>
  );
}
