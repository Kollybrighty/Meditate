"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyGroupMembers } from "@/lib/notify-group";
import { uploadForumVoiceNote } from "@/lib/forum-voice";

export type ForumState = {
  error?: string;
};

function voiceFileFromForm(formData: FormData): File | null {
  const value = formData.get("voiceNote");
  if (value instanceof File && value.size > 0) return value;
  return null;
}

export async function createForumPost(
  _prev: ForumState,
  formData: FormData
): Promise<ForumState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupId = formData.get("groupId") as string;
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  const voiceFile = voiceFileFromForm(formData);

  if (!groupId) return { error: "Group is missing." };
  if (!body && !voiceFile) {
    return { error: "Write a question or record a voice note." };
  }

  let voicePath: string | null = null;
  if (voiceFile) {
    const uploaded = await uploadForumVoiceNote({
      groupId,
      userId: user.id,
      file: voiceFile,
    });
    if ("error" in uploaded) return { error: uploaded.error };
    voicePath = uploaded.path;
  }

  const payload = {
    group_id: groupId,
    author_id: user.id,
    type: "question" as const,
    body: body || "Voice note",
    voice_note_url: voicePath,
  };

  let { data: post, error } = await supabase
    .from("forum_posts")
    .insert(payload)
    .select("id")
    .single();

  if (error && voicePath && /voice_note_url/i.test(error.message)) {
    const retry = await supabase
      .from("forum_posts")
      .insert({
        group_id: groupId,
        author_id: user.id,
        type: "question",
        body: body || "Voice note",
      })
      .select("id")
      .single();
    post = retry.data;
    error = retry.error;
  }

  if (error) return { error: error.message };
  if (!post) return { error: "Could not post." };

  await notifyGroupMembers({
    groupId,
    type: "forum_question",
    referenceId: post.id,
    actorId: user.id,
  });

  revalidatePath(`/groups/${groupId}/forum`);
  redirect(`/groups/${groupId}/forum/${post.id}`);
}

export async function createForumReply(
  _prev: ForumState,
  formData: FormData
): Promise<ForumState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupId = formData.get("groupId") as string;
  const postId = formData.get("postId") as string;
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  const voiceFile = voiceFileFromForm(formData);

  if (!groupId || !postId) return { error: "Post is missing." };
  if (!body && !voiceFile) {
    return { error: "Write a reply or record a voice note." };
  }

  const { data: post } = await supabase
    .from("forum_posts")
    .select("id, group_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post || post.group_id !== groupId) {
    return { error: "Post is missing." };
  }

  let voicePath: string | null = null;
  if (voiceFile) {
    const uploaded = await uploadForumVoiceNote({
      groupId,
      userId: user.id,
      file: voiceFile,
    });
    if ("error" in uploaded) return { error: uploaded.error };
    voicePath = uploaded.path;
  }

  const { error } = await supabase.from("forum_replies").insert({
    post_id: postId,
    author_id: user.id,
    body: body || null,
    voice_note_url: voicePath,
  });

  if (error) return { error: error.message };

  await notifyGroupMembers({
    groupId,
    type: "forum_reply",
    referenceId: postId,
    actorId: user.id,
  });

  revalidatePath(`/groups/${groupId}/forum`);
  revalidatePath(`/groups/${groupId}/forum/${postId}`);
  return {};
}
