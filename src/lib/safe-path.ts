export function safeNextPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const path = raw.trim();
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//") || path.includes("://")) return null;
  if (path.startsWith("/login") || path.startsWith("/register")) return null;
  return path;
}

export function parseGroupInvite(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const tryUrl = (value: string) => {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  };

  const fromUrl = tryUrl(trimmed) ?? tryUrl(`https://placeholder.local${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`);
  if (fromUrl) {
    const parts = fromUrl.pathname.split("/").filter(Boolean);
    const joinIdx = parts.findIndex((p) => p === "join");
    if (joinIdx >= 0 && parts[joinIdx + 1] && parts[joinIdx + 1] !== "kids") {
      return decodeURIComponent(parts[joinIdx + 1]);
    }
  }

  return trimmed;
}
