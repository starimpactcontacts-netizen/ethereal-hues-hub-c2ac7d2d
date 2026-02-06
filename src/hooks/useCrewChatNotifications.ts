import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCrewMembership } from './useCrewMembership';
import { toast } from 'sonner';

// Notification sound - using a simple ping sound
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

interface CrewMessage {
  id: string;
  crew_id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  message_text: string;
  created_at: string;
}

export function useCrewChatNotifications() {
  const { user } = useAuth();
  const { memberships } = useCrewMembership(user?.id);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPathRef = useRef<string>(window.location.pathname);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.3; // 30% volume
    audioRef.current.preload = 'auto';
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Track current path
  useEffect(() => {
    const handleLocationChange = () => {
      currentPathRef.current = window.location.pathname;
    };
    
    // Listen to popstate for browser navigation
    window.addEventListener('popstate', handleLocationChange);
    
    // Create a simple observer for path changes
    const checkPath = setInterval(() => {
      if (currentPathRef.current !== window.location.pathname) {
        currentPathRef.current = window.location.pathname;
      }
    }, 500);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(checkPath);
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        // Autoplay may be blocked - that's okay
        console.debug('Could not play notification sound:', err);
      });
    }
  }, []);

  const showNotification = useCallback((message: CrewMessage, crewName: string) => {
    // Don't notify for own messages
    if (message.user_id === user?.id) return;
    
    // Don't notify if user is already on that crew's chat page
    if (currentPathRef.current.includes(`/units/${message.crew_id}/chat`)) return;

    // Play sound
    playNotificationSound();

    // Show toast notification
    const displayName = message.display_name || message.username;
    const previewText = message.message_text.length > 50 
      ? message.message_text.substring(0, 50) + '...' 
      : message.message_text;
    
    // Check if it's a GIF
    const isGif = message.message_text.includes('tenor.com') || message.message_text.includes('.gif');
    
    toast(
      `${displayName} in ${crewName}`,
      {
        description: isGif ? '🖼️ Sent a GIF' : previewText,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = `/units/${message.crew_id}/chat`;
          },
        },
        duration: 4000,
      }
    );
  }, [user?.id, playNotificationSound]);

  // Subscribe to all crew chats the user is a member of
  useEffect(() => {
    if (!user || memberships.length === 0) return;

    // Create a map of crew IDs to crew names
    const crewMap = new Map<string, string>();
    memberships.forEach((m) => {
      if (m.crew) {
        crewMap.set(m.crew_id, m.crew.name);
      }
    });

    const crewIds = memberships.map((m) => m.crew_id);
    
    // Subscribe to all crew message inserts
    const channel = supabase
      .channel('global-crew-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crew_messages',
        },
        (payload) => {
          const message = payload.new as CrewMessage;
          
          // Check if this message is for one of the user's crews
          if (crewIds.includes(message.crew_id)) {
            const crewName = crewMap.get(message.crew_id) || 'Crew';
            showNotification(message, crewName);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, memberships, showNotification]);

  return {
    playNotificationSound,
  };
}
