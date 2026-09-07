import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroupContext } from "@/lib/groups";
import { displayName, profilesByIds } from "@/lib/profiles";
import { formatDateTime } from "@/lib/dates";
import { resolveVoiceUrl } from "@/lib/forum-voice";
import VoiceNotePlayer from "@/components/group/VoiceNotePlayer";
import { ReplyForm } from "../ForumForms";

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = await params;
  await getGroupContext(id);
  const supabase = await createClient();

  const firstPost = await supabase
    .from("forum_posts")
    .select("id, body, created_at, author_id, group_id, voice_note_url")
    .eq("id", postId)
    .eq("group_id", id)
    .maybeSingle();

  const post = firstPost.data
    ? firstPost.data
    : firstPost.error && /voice_note_url/i.test(firstPost.error.message)
      ? (
          await supabase
            .from("forum_posts")
            .select("id, body, created_at, author_id, group_id")
            .eq("id", postId)
            .eq("group_id", id)
            .maybeSingle()
        ).data
      : null;

  if (!post) notFound();

  const { data: replies } = await supabase
    .from("forum_replies")
    .select("id, body, created_at, author_id, voice_note_url")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const authors = await profilesByIds(supabase, [
    post.author_id,
    ...(replies ?? []).map((r) => r.author_id),
  ]);

  const postVoiceUrl = await resolveVoiceUrl(
    "voice_note_url" in post
      ? (post as { voice_note_url?: string | null }).voice_note_url
      : null
  );
  const replyVoiceUrls = new Map<string, string>();
  for (const reply of replies ?? []) {
    const url = await resolveVoiceUrl(reply.voice_note_url);
    if (url) replyVoiceUrls.set(reply.id, url);
  }

  return (
    <>
      <Link
        href={`/groups/${id}/forum`}
        className="text-sm text-stone-600 hover:text-gold"
      >
        ← All questions
      </Link>
      <article className="mt-4 rounded-xl border border-stone-200 bg-white p-6">
        {post.body ? (
          <p className="text-lg text-stone-900">{post.body}</p>
        ) : null}
        {postVoiceUrl ? <VoiceNotePlayer src={postVoiceUrl} /> : null}
        <p className="mt-3 text-xs text-stone-500">
          {displayName(authors.get(post.author_id))} ·{" "}
          {formatDateTime(post.created_at)}
        </p>
      </article>

      <ul className="mt-6 space-y-3">
        {(replies ?? []).length === 0 ? (
          <li className="text-sm text-stone-500">No replies yet.</li>
        ) : (
          (replies ?? []).map((reply) => (
            <li
              key={reply.id}
              className="rounded-xl border border-stone-100 bg-white px-5 py-4"
            >
              {reply.body ? (
                <p className="text-stone-800">{reply.body}</p>
              ) : null}
              {replyVoiceUrls.get(reply.id) ? (
                <VoiceNotePlayer src={replyVoiceUrls.get(reply.id)!} />
              ) : null}
              <p className="mt-2 text-xs text-stone-500">
                {displayName(authors.get(reply.author_id))} ·{" "}
                {formatDateTime(reply.created_at)}
              </p>
            </li>
          ))
        )}
      </ul>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <ReplyForm groupId={id} postId={postId} />
      </section>
    </>
  );
}
