import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface CrewChannel {
  id: string;
  crew_id: string;
  name: string;
  description: string | null;
  channel_type: "text" | "announcement" | "rules";
  category: string | null;
  category_order: number;
  channel_order: number;
  is_editor_only: boolean;
  min_tier_order: number;
  is_locked: boolean;
  created_at: string;
}

export interface ChannelMessage {
  id: string;
  channel_id: string;
  crew_id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  message_text: string;
  is_bot: boolean;
  is_pinned: boolean;
  created_at: string;
}

export function useCrewChannels(crewId: string | undefined) {
  const { user, profile } = useAuth();
  const [channels, setChannels] = useState<CrewChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    if (!crewId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("crew_channels")
      .select("*")
      .eq("crew_id", crewId)
      .order("category_order", { ascending: true })
      .order("channel_order", { ascending: true });

    if (!error && data) {
      // If no channels exist, seed defaults via DB function
      if (data.length === 0) {
        await supabase.rpc("ensure_default_channels", { p_crew_id: crewId });
        // Re-fetch after seeding
        const { data: seeded } = await supabase
          .from("crew_channels")
          .select("*")
          .eq("crew_id", crewId)
          .order("category_order", { ascending: true })
          .order("channel_order", { ascending: true });
        setChannels((seeded || []) as CrewChannel[]);
      } else {
        setChannels(data as CrewChannel[]);
      }
    }
    setLoading(false);
  }, [crewId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Group channels by category
  const channelsByCategory = channels.reduce((acc, channel) => {
    const category = channel.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(channel);
    return acc;
  }, {} as Record<string, CrewChannel[]>);

  // Create a channel
  const createChannel = useCallback(async (channel: Partial<CrewChannel>) => {
    if (!crewId) return null;

    const { data, error } = await supabase
      .from("crew_channels")
      .insert({
        crew_id: crewId,
        name: channel.name || "new-channel",
        description: channel.description,
        channel_type: channel.channel_type || "text",
        category: channel.category || "General",
        category_order: channel.category_order || 0,
        channel_order: channel.channel_order || channels.length,
        is_editor_only: channel.is_editor_only || false,
        min_tier_order: channel.min_tier_order || 0,
        is_locked: channel.is_locked || false,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create channel");
      return null;
    }

    toast.success("Channel created!");
    fetchChannels();
    return data;
  }, [crewId, channels.length, fetchChannels]);

  // Update a channel
  const updateChannel = useCallback(async (channelId: string, updates: Partial<CrewChannel>) => {
    const { error } = await supabase
      .from("crew_channels")
      .update(updates)
      .eq("id", channelId);

    if (error) {
      toast.error("Failed to update channel");
      return false;
    }

    toast.success("Channel updated!");
    fetchChannels();
    return true;
  }, [fetchChannels]);

  // Delete a channel
  const deleteChannel = useCallback(async (channelId: string) => {
    const { error } = await supabase
      .from("crew_channels")
      .delete()
      .eq("id", channelId);

    if (error) {
      toast.error("Failed to delete channel");
      return false;
    }

    toast.success("Channel deleted");
    fetchChannels();
    return true;
  }, [fetchChannels]);

  return {
    channels,
    channelsByCategory,
    loading,
    createChannel,
    updateChannel,
    deleteChannel,
    refresh: fetchChannels,
  };
}

// Hook for channel messages
export function useChannelMessages(channelId: string | undefined) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!channelId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("crew_channel_messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(data as ChannelMessage[]);
    }
    setLoading(false);
  }, [channelId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime
  useEffect(() => {
    if (!channelId) return;

    channelRef.current = supabase
      .channel(`channel-messages-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crew_channel_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChannelMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [channelId]);

  // Send a message
  const sendMessage = useCallback(async (crewId: string, text: string) => {
    if (!channelId || !user || !profile || !text.trim()) return null;

    const { data, error } = await supabase
      .from("crew_channel_messages")
      .insert({
        channel_id: channelId,
        crew_id: crewId,
        user_id: user.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        message_text: text.trim(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to send message");
      return null;
    }

    return data;
  }, [channelId, user, profile]);

  // Send a bot message (for officers)
  const sendBotMessage = useCallback(async (crewId: string, text: string) => {
    if (!channelId || !user || !text.trim()) return null;

    const { data, error } = await supabase
      .from("crew_channel_messages")
      .insert({
        channel_id: channelId,
        crew_id: crewId,
        user_id: user.id,
        username: "Unit Bot",
        display_name: "Unit Bot",
        avatar_url: null,
        message_text: text.trim(),
        is_bot: true,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to send bot message");
      return null;
    }

    return data;
  }, [channelId, user]);

  // Pin a message
  const togglePinMessage = useCallback(async (messageId: string, isPinned: boolean) => {
    const { error } = await supabase
      .from("crew_channel_messages")
      .update({ is_pinned: !isPinned })
      .eq("id", messageId);

    if (error) {
      toast.error("Failed to pin message");
      return false;
    }

    fetchMessages();
    return true;
  }, [fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    sendBotMessage,
    togglePinMessage,
    refresh: fetchMessages,
  };
}
