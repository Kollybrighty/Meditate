"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeRefresh(options: {
  channel: string;
  table: string;
  filter: string;
  enabled?: boolean;
}) {
  const router = useRouter();
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    const channel = supabase
      .channel(options.channel)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: options.table,
          filter: options.filter,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, options.channel, options.filter, options.table, router]);
}
