"use client";

import { useRealtimeRefresh } from "@/components/kids/useRealtimeRefresh";

export default function KidsSessionGuard({
  lessonId,
  enabled,
}: {
  lessonId: string;
  enabled: boolean;
}) {
  useRealtimeRefresh({
    channel: `session-end:${lessonId}`,
    table: "session_lobby",
    filter: `lesson_id=eq.${lessonId}`,
    enabled,
  });
  return null;
}
