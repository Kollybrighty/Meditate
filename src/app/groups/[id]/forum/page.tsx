import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupContext } from "@/lib/groups";
import { displayName, profilesByIds } from "@/lib/profiles";
import { formatDateTime } from "@/lib/dates";
import { NewQuestionForm } from "./ForumForms";

export default async function ForumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getGroupContext(id);
  const supabase = await createClient();

  const firstSelect = await supabase
    .from("forum_posts")
    .select("id, body, created_at, author_id, voice_note_url")
    .eq("group_id", id)
    .eq("type", "question")
    .order("created_at", { ascending: false });

  const posts =
    firstSelect.error && /voice_note_url/i.test(firstSelect.error.message)
      ? (
          await supabase
            .from("forum_posts")
            .select("id, body, created_at, author_id")
            .eq("group_id", id)
            .eq("type", "question")
            .order("created_at", { ascending: false })
        ).data
      : firstSelect.data;

  const list = (posts ?? []).map((post) => ({
    ...post,
    voice_note_url:
      "voice_note_url" in post
        ? (post as { voice_note_url?: string | null }).voice_note_url
        : null,
  }));
  const authors = await profilesByIds(
    supabase,
    list.map((p) => p.author_id)
  );

  const postIds = list.map((p) => p.id);
  const replyCounts = new Map<string, number>();
  if (postIds.length > 0) {
    const { data: replies } = await supabase
      .from("forum_replies")
      .select("post_id")
      .in("post_id", postIds);
    for (const row of replies ?? []) {
      replyCounts.set(row.post_id, (replyCounts.get(row.post_id) ?? 0) + 1);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Q&amp;A forum</h1>
      <p className="mt-1 text-stone-600">
        Ask questions about the reading. Replies can be text or a voice note.
      </p>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <NewQuestionForm groupId={id} />
      </section>

      <ul className="mt-6 space-y-3">
        {list.length === 0 ? (
          <li className="text-sm text-stone-500">No questions yet. Be the first.</li>
        ) : (
          list.map((post) => {
            const replies = replyCounts.get(post.id) ?? 0;
            return (
              <li key={post.id}>
                <Link
                  href={`/groups/${id}/forum/${post.id}`}
                  className="block rounded-xl border border-stone-200 bg-white p-5 hover:border-gold/40 hover:bg-gold/5"
                >
                  <p className="text-stone-900">{post.body}</p>
                  <p className="mt-2 text-xs text-stone-500">
                    {displayName(authors.get(post.author_id))} ·{" "}
                    {formatDateTime(post.created_at)} · {replies}{" "}
                    {replies === 1 ? "reply" : "replies"}
                    {post.voice_note_url ? " · Voice note" : ""}
                  </p>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </>
  );
}
