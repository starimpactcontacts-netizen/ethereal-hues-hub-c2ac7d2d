import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns unread message count for the given event chat for the current user.
 * Polls + realtime subscription on event_messages so the badge stays live.
 */
export function useEventChatUnread(eventId: string | undefined) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const compute = async () => {
      // Get last_read_at (or epoch if never read)
      let lastRead = "1970-01-01T00:00:00.000Z";
      if (user) {
        const { data } = await supabase
          .from("event_chat_reads")
          .select("last_read_at")
          .eq("user_id", user.id)
          .eq("event_id", eventId)
          .maybeSingle();
        if (data?.last_read_at) lastRead = data.last_read_at;
      }
      const { count } = await supabase
        .from("event_messages")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .gt("created_at", lastRead);
      if (!cancelled) setUnread(count || 0);
    };

    compute();

    const ch = supabase
      .channel(`event-unread-${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_messages", filter: `event_id=eq.${eventId}` },
        () => compute(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [eventId, user?.id]);

  return { unread, reset: () => setUnread(0) };
}