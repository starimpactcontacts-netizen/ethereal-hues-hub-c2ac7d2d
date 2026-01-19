import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PresenceState {
  user_id: string;
  username: string;
  avatar_url: string | null;
  online_at: string;
  status?: "online" | "arena" | "gqt" | "idle";
}

export function useCrewPresence(crewId: string | undefined) {
  const { user, profile } = useAuth();
  const [onlineMembers, setOnlineMembers] = useState<PresenceState[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Track presence
  useEffect(() => {
    if (!crewId || !user || !profile) return;

    const channel = supabase.channel(`crew-presence-${crewId}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
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
      .on("presence", { event: "join" }, ({ newPresences }) => {
        // Handle join
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        // Handle leave
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user_id !== user.id) {
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
          await channel.track({
            user_id: user.id,
            username: profile.display_name || profile.username,
            avatar_url: profile.avatar_url,
            online_at: new Date().toISOString(),
            status: "online",
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crewId, user, profile]);

  // Broadcast typing
  const broadcastTyping = useCallback(() => {
    if (!crewId || !user || !profile) return;
    
    const channel = supabase.channel(`crew-presence-${crewId}`);
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: user.id,
        username: profile.display_name || profile.username,
      },
    });
  }, [crewId, user, profile]);

  return {
    onlineMembers,
    typingUsers,
    broadcastTyping,
    onlineCount: onlineMembers.length,
  };
}
