import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useChannelUnread(crewId: string | undefined) {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchUnreadCounts = useCallback(async () => {
    if (!crewId || !user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("get_channel_unread_counts", {
      p_user_id: user.id,
      p_crew_id: crewId,
    });

    if (!error && data) {
      const counts: Record<string, number> = {};
      (data as { channel_id: string; unread_count: number }[]).forEach((row) => {
        counts[row.channel_id] = row.unread_count;
      });
      setUnreadCounts(counts);
    }

    setLoading(false);
  }, [crewId, user]);

  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // Subscribe to new messages to update counts in realtime
  useEffect(() => {
    if (!crewId || !user) return;

    const channel = supabase
      .channel(`crew-channel-unread-${crewId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crew_channel_messages",
        },
        (payload) => {
          const newMessage = payload.new as { channel_id: string; user_id: string; crew_id: string };
          
          // Only update if it's for this crew and not from current user
          if (newMessage.crew_id === crewId && newMessage.user_id !== user.id) {
            setUnreadCounts((prev) => ({
              ...prev,
              [newMessage.channel_id]: (prev[newMessage.channel_id] || 0) + 1,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crewId, user]);

  // Mark a channel as read
  const markChannelAsRead = useCallback(
    async (channelId: string) => {
      if (!crewId || !user) return;

      // Using type assertion as the table was just created
      const { error } = await (supabase.from("crew_channel_reads" as unknown as "crew_members") as unknown as ReturnType<typeof supabase.from>).upsert(
        {
          user_id: user.id,
          channel_id: channelId,
          crew_id: crewId,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,channel_id" }
      );

      if (!error) {
        setUnreadCounts((prev) => ({
          ...prev,
          [channelId]: 0,
        }));
      }
    },
    [crewId, user]
  );

  // Get total unread for the crew
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return {
    unreadCounts,
    totalUnread,
    loading,
    markChannelAsRead,
    refresh: fetchUnreadCounts,
  };
}
