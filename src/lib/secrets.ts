const PLACEHOLDER_SECRETS = new Set([
  "your-bible-api-key",
  "your-api-bible-key",
  "your-resend-api-key",
  "your-api-key",
]);

/** A real secret, or null when the env value is empty or still a template placeholder. */
export function configuredSecret(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || PLACEHOLDER_SECRETS.has(trimmed)) return null;
  return trimmed;
}
