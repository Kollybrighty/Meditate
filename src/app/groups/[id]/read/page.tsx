import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupContext } from "@/lib/groups";
import {
  addUtcDays,
  formatReadingRange,
  parseChapters,
  planBounds,
  readingForDate,
  todayIso,
} from "@/lib/bible/plan";
import { formatLongDate } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import OfflineReadingBar from "@/components/group/OfflineReadingBar";
import ReadingListenBar from "@/components/group/ReadingListenBar";
import {
  BibleVersionProvider,
  BibleVersionSelect,
} from "@/components/group/BibleVersionSelect";
import { ChapterReader, MarkCompleteButton } from "./ReadingActions";
import type { ReadingChapter } from "@/lib/bible/plan";

export default async function TodayReadingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date: dateParam } = await searchParams;
  const { group, userId, isAdmin } = await getGroupContext(id);
  const supabase = await createClient();
  const today = todayIso(group.timezone || "UTC");
  const selectedDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  if (!group.start_date) {
    return (
      <>
        <h1 className="text-2xl font-bold">Today&apos;s reading</h1>
        <p className="mt-3 text-stone-600">
          {isAdmin
            ? "Set a plan start date on the group page to generate daily readings."
            : "This group does not have a start date yet. Daily reading will appear once an admin sets one."}
        </p>
        <Link href={`/groups/${id}`} className="mt-6 inline-block">
          <Button variant="outline">Back to group</Button>
        </Link>
      </>
    );
  }

  const bounds = planBounds(
    group.start_date,
    group.plan_type,
    group.reading_scope
  );

  let reading = readingForDate({
    readingScope: group.reading_scope,
    planType: group.plan_type,
    startDate: group.start_date,
    date: selectedDate,
  });

  const { data: stored } = await supabase
    .from("daily_assignments")
    .select("books, chapters, assignment_date")
    .eq("group_id", id)
    .eq("assignment_date", selectedDate)
    .maybeSingle();

  if (stored) {
    const chapters = parseChapters(stored.chapters);
    reading = {
      dayIndex: reading?.dayIndex ?? 0,
      date: stored.assignment_date,
      books: stored.books ?? [],
      chapters,
    };
  }

  const { data: progress } = await supabase
    .from("reading_progress")
    .select("id")
    .eq("group_id", id)
    .eq("user_id", userId)
    .eq("progress_date", selectedDate)
    .maybeSingle();

  const completed = Boolean(progress);
  const prevDate = addUtcDays(selectedDate, -1);
  const nextDate = addUtcDays(selectedDate, 1);
  const canPrev = selectedDate > bounds.startDate;
  const canNext = selectedDate < bounds.endDate;
  const beforeStart = selectedDate < bounds.startDate;
  const afterEnd = selectedDate > bounds.endDate;

  const displayDate = formatLongDate(selectedDate);

  const upcomingChapters = (() => {
    const map = new Map<string, ReadingChapter>();
    for (const chapter of reading?.chapters ?? []) {
      map.set(`${chapter.book}-${chapter.chapter}`, chapter);
    }
    if (!group.start_date) return [...map.values()];
    for (let i = 1; i <= 7; i += 1) {
      const date = addUtcDays(selectedDate, i);
      if (date > bounds.endDate) break;
      const next = readingForDate({
        readingScope: group.reading_scope,
        planType: group.plan_type,
        startDate: group.start_date,
        date,
      });
      for (const chapter of next?.chapters ?? []) {
        map.set(`${chapter.book}-${chapter.chapter}`, chapter);
      }
    }
    return [...map.values()];
  })();

  const pageUrls = [
    `/groups/${id}/read`,
    ...Array.from({ length: 8 }, (_, i) => {
      const date = addUtcDays(selectedDate, i);
      return `/groups/${id}/read?date=${date}`;
    }),
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {selectedDate === today ? "Today's reading" : "Daily reading"}
          </h1>
          <p className="mt-1 text-stone-600">{displayDate}</p>
        </div>
        <div className="flex gap-2">
          {canPrev ? (
            <Link href={`/groups/${id}/read?date=${prevDate}`}>
              <Button variant="outline" size="sm">
                Previous
              </Button>
            </Link>
          ) : null}
          {selectedDate !== today ? (
            <Link href={`/groups/${id}/read`}>
              <Button variant="outline" size="sm">
                Today
              </Button>
            </Link>
          ) : null}
          {canNext ? (
            <Link href={`/groups/${id}/read?date=${nextDate}`}>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {beforeStart ? (
        <p className="mt-6 text-stone-600">
          This plan starts on {formatLongDate(bounds.startDate)}. Come back then,
          or open the first day when it begins.
        </p>
      ) : afterEnd ? (
        <p className="mt-6 text-stone-600">
          This plan ended on {formatLongDate(bounds.endDate)}. You can still
          revisit earlier days.
        </p>
      ) : reading && reading.chapters.length > 0 ? (
        <>
          <BibleVersionProvider>
            <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
              <p className="text-sm font-medium uppercase tracking-wide text-gold">
                Day {reading.dayIndex + 1} of {bounds.days}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-stone-900">
                {formatReadingRange(reading.chapters)}
              </h2>
              <BibleVersionSelect />
              <div className="mt-4">
                <MarkCompleteButton
                  groupId={id}
                  progressDate={selectedDate}
                  completed={completed}
                />
              </div>
              {completed ? (
                <p className="mt-2 text-sm text-emerald-700">Marked complete.</p>
              ) : null}
              <ReadingListenBar chapters={reading.chapters} groupId={id} />
              <OfflineReadingBar chapters={upcomingChapters} pageUrls={pageUrls} />
            </section>
            <div className="mt-6">
              <ChapterReader chapters={reading.chapters} groupId={id} />
            </div>
          </BibleVersionProvider>
        </>
      ) : (
        <p className="mt-6 text-stone-600">No chapters are scheduled for this day.</p>
      )}
    </>
  );
}
