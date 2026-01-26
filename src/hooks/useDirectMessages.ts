import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count_1: number;
  unread_count_2: number;
  created_at: string;
  // Joined data
  other_user?: {
    id: string;
    username: string;
    avatar_url: string | null;
    activity_status: string | null;
  };
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  read_at: string | null;
  created_at: string;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Fetch other user profiles
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conv) => {
          const otherId = conv.participant_1_id === user.id 
            ? conv.participant_2_id 
            : conv.participant_1_id;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, activity_status')
            .eq('id', otherId)
            .maybeSingle();

          return {
            ...conv,
            other_user: profile || undefined
          } as Conversation;
        })
      );

      setConversations(enrichedConversations);
      
      // Calculate total unread
      const unread = enrichedConversations.reduce((sum, conv) => {
        const myUnread = conv.participant_1_id === user.id 
          ? conv.unread_count_1 
          : conv.unread_count_2;
        return sum + myUnread;
      }, 0);
      setTotalUnread(unread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return { conversations, loading, totalUnread, refetch: fetchConversations };
}

export function useDirectMessages(conversationId: string | null) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      if (user) {
        await supabase.rpc('mark_conversation_read', {
          p_conversation_id: conversationId,
          p_user_id: user.id
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as DirectMessage]);
          
          // Mark as read if we're viewing
          if (user) {
            supabase.rpc('mark_conversation_read', {
              p_conversation_id: conversationId,
              p_user_id: user.id
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const sendMessage = async (text: string) => {
    if (!user || !profile || !conversationId || !text.trim()) return false;

    setSending(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message_text: text.trim()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, sendMessage, refetch: fetchMessages };
}

export function useStartConversation() {
  const { user } = useAuth();

  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) {
      toast.error('Please sign in to send messages');
      return null;
    }

    if (user.id === otherUserId) {
      toast.error("You can't message yourself");
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_user_1: user.id,
        p_user_2: otherUserId
      });

      if (error) throw error;
      return data as string;
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
      return null;
    }
  };

  return { startConversation };
}
