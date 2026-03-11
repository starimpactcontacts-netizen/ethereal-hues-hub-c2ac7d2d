import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PresenceState {
  user_id: string;
  username: string;
  avatar_url: string | null;
  online_at: string;
  status: "online" | "arena" | "gqt" | "idle";
  channel_id?: string;
}

export function useChannelPresence(crewId: string | undefined, channelId: string | undefined) {
  const { user, profile } = useAuth();
  const [onlineMembers, setOnlineMembers] = useState<PresenceState[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track presence for the crew (not per channel, to show all online in unit)
  useEffect(() => {
    if (!crewId || !user || !profile) return;

    channelRef.current = supabase.channel(`crew-presence-${crewId}`);

    channelRef.current
      .on("presence", { event: "sync" }, () => {
        const state = channelRef.current?.presenceState<PresenceState>();
        if (!state) return;

        const members: PresenceState[] = [];
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            if (!members.find((m) => m.user_id === presence.user_id)) {
              members.push(presence);
            }
          });
        });

        setOnlineMembers(members);
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user_id !== user.id && payload.channel_id === channelId) {
          setTypingUsers((prev) => {
            if (!prev.includes(payload.username)) {
              return [...prev, payload.username];
            }
            return prev;
          });

          // Remove after 3 seconds
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== payload.username));
          }, 3000);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channelRef.current?.track({
            user_id: user.id,
            username: profile.display_name || profile.username,
            avatar_url: profile.avatar_url,
            online_at: new Date().toISOString(),
            status: "online",
            channel_id: channelId,
          });
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [crewId, channelId, user, profile]);

  // Update presence when channel changes
  useEffect(() => {
    if (!channelRef.current || !user || !profile || !channelId) return;

    channelRef.current.track({
      user_id: user.id,
      username: profile.display_name || profile.username,
      avatar_url: profile.avatar_url,
      online_at: new Date().toISOString(),
      status: "online",
      channel_id: channelId,
    });
  }, [channelId, user, profile]);

  // Broadcast typing with debounce
  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !user || !profile || !channelId) return;

    // Debounce - don't send if we recently sent
    if (typingTimeoutRef.current) return;

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: user.id,
        username: profile.display_name || profile.username,
        channel_id: channelId,
      },
    });

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  }, [channelId, user, profile]);

  // Update status (for arena/gqt/idle)
  const updateStatus = useCallback(
    async (status: "online" | "arena" | "gqt" | "idle") => {
      if (!channelRef.current || !user || !profile) return;

      await channelRef.current.track({
        user_id: user.id,
        username: profile.display_name || profile.username,
        avatar_url: profile.avatar_url,
        online_at: new Date().toISOString(),
        status,
        channel_id: channelId,
      });
    },
    [channelId, user, profile]
  );

  return {
    onlineMembers,
    typingUsers,
    broadcastTyping,
    updateStatus,
    onlineCount: onlineMembers.length,
  };
}
