import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FORUM_VOICE_BUCKET,
  MAX_VOICE_BYTES,
} from "@/lib/forum-voice-shared";

export {
  FORUM_VOICE_BUCKET,
  MAX_VOICE_BYTES,
  MAX_VOICE_SECONDS,
} from "@/lib/forum-voice-shared";

const AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/x-m4a",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/webm;codecs=opus",
]);

export function voiceFileExtension(mime: string): string {
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

export function isAllowedVoiceFile(file: File): boolean {
  if (file.size <= 0 || file.size > MAX_VOICE_BYTES) return false;
  if (!file.type) return true;
  if (AUDIO_TYPES.has(file.type)) return true;
  return file.type.startsWith("audio/");
}

export async function uploadForumVoiceNote(options: {
  groupId: string;
  userId: string;
  file: File;
}): Promise<{ path: string } | { error: string }> {
  if (!isAllowedVoiceFile(options.file)) {
    return { error: "Voice note must be an audio file under 5 MB." };
  }

  const ext = voiceFileExtension(options.file.type);
  const path = `${options.groupId}/${options.userId}/${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await options.file.arrayBuffer());
  const contentType = options.file.type || "audio/webm";

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(FORUM_VOICE_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });

  if (!error) return { path };

  const admin = createAdminClient();
  if (!admin) return { error: error.message };

  const existing = await admin.storage.getBucket(FORUM_VOICE_BUCKET);
  if (!existing.data) {
    await admin.storage.createBucket(FORUM_VOICE_BUCKET, {
      public: false,
      fileSizeLimit: MAX_VOICE_BYTES,
    });
  }

  const { error: adminError } = await admin.storage
    .from(FORUM_VOICE_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });

  if (adminError) return { error: adminError.message };
  return { path };
}

export async function resolveVoiceUrl(
  path: string | null | undefined
): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const admin = createAdminClient();
  const client = admin ?? (await createClient());
  const { data } = await client.storage
    .from(FORUM_VOICE_BUCKET)
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
