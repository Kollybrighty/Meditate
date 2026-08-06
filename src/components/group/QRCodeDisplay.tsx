"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QRCodeDisplay({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(url, { width: 200, margin: 2 }).then(setDataUrl);
  }, [url]);

  if (!dataUrl) return <div className="h-[200px] w-[200px] animate-pulse rounded bg-stone-200" />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dataUrl} alt="QR code for group invite link" className="rounded-lg border border-stone-200" />
  );
}
