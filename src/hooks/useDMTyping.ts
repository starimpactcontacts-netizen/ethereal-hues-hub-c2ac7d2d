import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useDMTyping(conversationId: string | null) {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);

  // Listen for typing status changes
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`dm-typing-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dm_typing_status',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          // Refetch typing users
          const { data } = await supabase
            .from('dm_typing_status' as any)
            .select('username, user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', user.id);
          
          if (data) {
            setTypingUsers((data as any[]).map(d => d.username));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  // Clean up typing status on unmount
  useEffect(() => {
    return () => {
      if (conversationId && user) {
        supabase
          .from('dm_typing_status' as any)
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }
    };
  }, [conversationId, user]);

  const setTyping = useCallback(() => {
    if (!conversationId || !user || !profile) return;

    const username = (profile as any).display_name || profile.username || 'Someone';

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      supabase
        .from('dm_typing_status' as any)
        .upsert({
          conversation_id: conversationId,
          user_id: user.id,
          username,
          started_at: new Date().toISOString(),
        } as any, { onConflict: 'conversation_id,user_id' });
    }

    // Reset the timeout
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTypingRef.current = false;
      supabase
        .from('dm_typing_status' as any)
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    }, 3000);
  }, [conversationId, user, profile]);

  const clearTyping = useCallback(() => {
    if (!conversationId || !user) return;
    isTypingRef.current = false;
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    supabase
      .from('dm_typing_status' as any)
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
  }, [conversationId, user]);

  return { typingUsers, setTyping, clearTyping };
}
