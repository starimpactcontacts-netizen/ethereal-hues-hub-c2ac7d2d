import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCrewMembership } from './useCrewMembership';
import { toast } from 'sonner';

// Sound URLs - different tones for different notification types
const SOUNDS = {
  message: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Soft ping
  alert: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Alert tone
  success: 'https://assets.mixkit.co/active_storage/sfx/2872/2872-preview.mp3', // Success chime
  urgent: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3', // Urgent tone
};

type SoundType = keyof typeof SOUNDS;

interface CrewMessage {
  id: string;
  crew_id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  message_text: string;
  created_at: string;
}

interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
}

interface TournamentParticipant {
  tournament_id: string;
  user_id: string;
  is_ready: boolean;
}

export function useGlobalNotifications() {
  const { user } = useAuth();
  const { memberships } = useCrewMembership(user?.id);
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    message: null,
    alert: null,
    success: null,
    urgent: null,
  });
  const currentPathRef = useRef<string>(window.location.pathname);

  // Initialize audio elements
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.25;
      audio.preload = 'auto';
      audioRefs.current[key as SoundType] = audio;
    });

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
        }
      });
    };
  }, []);

  // Track current path
  useEffect(() => {
    const checkPath = setInterval(() => {
      currentPathRef.current = window.location.pathname;
    }, 300);
    return () => clearInterval(checkPath);
  }, []);

  const playSound = useCallback((type: SoundType) => {
    const audio = audioRefs.current[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Autoplay blocked - that's okay
      });
    }
  }, []);

  // ========== CREW CHAT NOTIFICATIONS ==========
  useEffect(() => {
    if (!user || memberships.length === 0) return;

    const crewMap = new Map<string, string>();
    memberships.forEach((m) => {
      if (m.crew) crewMap.set(m.crew_id, m.crew.name);
    });
    const crewIds = memberships.map((m) => m.crew_id);

    const channel = supabase
      .channel('global-crew-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crew_messages' },
        (payload) => {
          const msg = payload.new as CrewMessage;
          if (msg.user_id === user.id) return;
          if (!crewIds.includes(msg.crew_id)) return;
          if (currentPathRef.current.includes(`/units/${msg.crew_id}/chat`)) return;

          playSound('message');
          const displayName = msg.display_name || msg.username;
          const crewName = crewMap.get(msg.crew_id) || 'Unit';
          const isGif = msg.message_text.includes('tenor.com') || msg.message_text.includes('.gif');
          const preview = isGif ? '🖼️ Sent a GIF' : msg.message_text.slice(0, 50) + (msg.message_text.length > 50 ? '...' : '');

          toast(`💬 ${displayName}`, {
            description: `${crewName}: ${preview}`,
            action: {
              label: 'View',
              onClick: () => (window.location.href = `/units/${msg.crew_id}/chat`),
            },
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, memberships, playSound]);

  // ========== DIRECT MESSAGE NOTIFICATIONS ==========
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-dm-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        async (payload) => {
          const msg = payload.new as DirectMessage;
          if (msg.sender_id === user.id) return;
          if (currentPathRef.current.includes(`/messages/${msg.conversation_id}`)) return;

          // Fetch sender info
          const { data: senderData } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          playSound('message');
          const senderName = senderData?.display_name || senderData?.username || 'Someone';
          const isGif = msg.message_text.includes('tenor.com') || msg.message_text.includes('.gif');
          const preview = isGif ? '🖼️ Sent a GIF' : msg.message_text.slice(0, 50) + (msg.message_text.length > 50 ? '...' : '');

          toast(`📩 ${senderName}`, {
            description: preview,
            action: {
              label: 'Reply',
              onClick: () => (window.location.href = `/messages/${msg.conversation_id}`),
            },
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playSound]);

  // ========== SYSTEM NOTIFICATIONS (from notifications table) ==========
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-system-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const notif = payload.new as Notification;
          
          // Determine sound and emoji based on type
          let emoji = '🔔';
          let sound: SoundType = 'alert';
          
          switch (notif.type) {
            case 'tournament_started':
            case 'tournament_scored':
              emoji = '🏆';
              sound = 'urgent';
              break;
            case 'submission_judged':
            case 'review_complete':
              emoji = '⭐';
              sound = 'success';
              break;
            case 'rank_changed':
              emoji = '📈';
              sound = 'success';
              break;
            case 'house_accepted':
            case 'house_invited':
              emoji = '🏠';
              sound = 'success';
              break;
            case 'achievement':
              emoji = '🎖️';
              sound = 'success';
              break;
            case 'event_starting':
              emoji = '⏰';
              sound = 'urgent';
              break;
            case 'battle_invite':
              emoji = '⚔️';
              sound = 'urgent';
              break;
             case 'connection_request':
               emoji = '🤝';
               sound = 'alert';
               break;
             case 'connection_accepted':
               emoji = '🎉';
               sound = 'success';
               break;
          }

          playSound(sound);
          
          const data = notif.data as { event_id?: string; tournament_id?: string; battle_id?: string };
           const connectionData = notif.data as { sender_id?: string; user_id?: string };
 
          toast(`${emoji} ${notif.title}`, {
            description: notif.message,
             action: connectionData?.sender_id
               ? { label: 'View Profile', onClick: () => (window.location.href = `/editor/${connectionData.sender_id}`) }
               : connectionData?.user_id
               ? { label: 'View Profile', onClick: () => (window.location.href = `/editor/${connectionData.user_id}`) }
               : data?.battle_id
              ? { label: 'View Battle', onClick: () => (window.location.href = `/battle/${data.battle_id}`) }
              : data?.tournament_id
              ? { label: 'View', onClick: () => (window.location.href = `/sanctioned/${data.tournament_id}`) }
              : data?.event_id
              ? { label: 'View', onClick: () => (window.location.href = `/event/${data.event_id}`) }
              : undefined,
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playSound]);

  // ========== TOURNAMENT READY-UP NOTIFICATIONS ==========
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tournament-participant-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sanctioned_tournament_participants', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const participant = payload.new as TournamentParticipant;
          
          // Fetch tournament info
          const { data: tournament } = await supabase
            .from('sanctioned_tournaments')
            .select('name, status, start_date')
            .eq('id', participant.tournament_id)
            .single();

          if (tournament?.status === 'lobby') {
            // Tournament is in lobby, remind about ready-up
            if (!participant.is_ready) {
              playSound('alert');
              toast('⚔️ Ready Up!', {
                description: `${tournament.name} is filling up! Don't miss your spot.`,
                action: {
                  label: 'Go',
                  onClick: () => (window.location.href = `/sanctioned/${participant.tournament_id}`),
                },
                duration: 8000,
              });
            }
          }
        }
      )
      .subscribe();

    // Also listen for tournament status changes
    const tournamentChannel = supabase
      .channel('tournament-status-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sanctioned_tournaments' },
        async (payload) => {
          const tournament = payload.new as { id: string; name: string; status: string };
          
          // Check if user is a participant
          const { data: participation } = await supabase
            .from('sanctioned_tournament_participants')
            .select('id')
            .eq('tournament_id', tournament.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!participation) return;

          if (tournament.status === 'active') {
            playSound('urgent');
            toast('🚀 Tournament Started!', {
              description: `${tournament.name} has begun! Submit your edit now.`,
              action: {
                label: 'Enter',
                onClick: () => (window.location.href = `/sanctioned/${tournament.id}`),
              },
              duration: 10000,
            });
          } else if (tournament.status === 'lobby') {
            playSound('alert');
            toast('🎮 Lobby Open!', {
              description: `${tournament.name} lobby is now open. Ready up!`,
              action: {
                label: 'Join',
                onClick: () => (window.location.href = `/sanctioned/${tournament.id}`),
              },
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(tournamentChannel);
    };
  }, [user, playSound]);

  return { playSound };
}
