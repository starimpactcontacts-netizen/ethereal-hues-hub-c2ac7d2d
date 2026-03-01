import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loopy-chat`;

export function useLoopyChat() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const saveQueueRef = useRef<Message[]>([]);

  const displayName = profile?.display_name || profile?.username || '';

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('loopy_conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);
    if (data) setConversations(data);
  }, [user]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('loopy_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
    setActiveConversationId(convId);
    setLoadingHistory(false);
  }, []);

  // Create new conversation
  const startNewChat = useCallback(async () => {
    if (!user) return;
    const greeting: Message = {
      role: 'assistant',
      content: `yoo wsg${displayName ? ` ${displayName}` : ''}. ask me whatever about loopgate — battles, units, rankings, all that. i got u`
    };

    const { data } = await supabase
      .from('loopy_conversations')
      .insert({ user_id: user.id, title: 'New Chat' })
      .select('id')
      .single();

    if (data) {
      // Save greeting
      await supabase.from('loopy_messages').insert({
        conversation_id: data.id,
        role: 'assistant',
        content: greeting.content
      });
      setActiveConversationId(data.id);
      setMessages([greeting]);
      loadConversations();
    }
  }, [user, displayName, loadConversations]);

  // Continue most recent conversation
  const continueLastChat = useCallback(async () => {
    if (conversations.length > 0) {
      await loadMessages(conversations[0].id);
    } else {
      await startNewChat();
    }
  }, [conversations, loadMessages, startNewChat]);

  // Save message to DB
  const saveMessage = useCallback(async (convId: string, msg: Message) => {
    await supabase.from('loopy_messages').insert({
      conversation_id: convId,
      role: msg.role,
      content: msg.content
    });
    // Update conversation title from first user message
    if (msg.role === 'user') {
      const title = msg.content.length > 40 ? msg.content.slice(0, 37) + '...' : msg.content;
      await supabase
        .from('loopy_conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', convId);
    }
  }, []);

  // Send message with streaming
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming || !activeConversationId) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setStreaming(true);

    // Save user message
    saveMessage(activeConversationId, userMsg);

    let assistantContent = '';
    const convId = activeConversationId;

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length === allMessages.length + 1) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev.slice(0, allMessages.length), { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'loopy crashed 💀' }));
        updateAssistant(err.error || 'bruh something broke try again');
        setStreaming(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) { updateAssistant('no response'); setStreaming(false); return; }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* partial json */ }
        }
      }
    } catch {
      updateAssistant('ngl something went wrong try again');
    }

    // Save assistant response
    if (assistantContent) {
      saveMessage(convId, { role: 'assistant', content: assistantContent });
    }
    setStreaming(false);
    loadConversations();
  }, [messages, streaming, activeConversationId, saveMessage, loadConversations]);

  // Delete a conversation
  const deleteConversation = useCallback(async (convId: string) => {
    await supabase.from('loopy_conversations').delete().eq('id', convId);
    if (activeConversationId === convId) {
      setActiveConversationId(null);
      setMessages([]);
    }
    loadConversations();
  }, [activeConversationId, loadConversations]);

  // Load conversations on mount
  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  return {
    conversations,
    activeConversationId,
    messages,
    streaming,
    loadingHistory,
    displayName,
    sendMessage,
    startNewChat,
    continueLastChat,
    loadMessages,
    deleteConversation,
  };
}
