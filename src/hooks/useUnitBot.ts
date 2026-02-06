import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface BotCommand {
  id: string;
  crew_id: string;
  channel_id: string;
  message_id: string | null;
  command_type: "poll" | "event" | "reminder" | "welcome" | "rules" | "embed";
  title: string;
  description: string | null;
  data: Record<string, unknown>;
  created_by: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface PollVote {
  id: string;
  command_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
}

export function useUnitBot(crewId: string | undefined, channelId: string | undefined, botName?: string) {
  const { user, profile } = useAuth();
  const [sending, setSending] = useState(false);

  const displayName = botName || "Unit App";

  // Post a bot message to the channel
  const postBotMessage = useCallback(async (text: string) => {
    if (!crewId || !channelId || !user) return null;

    const { data, error } = await supabase
      .from("crew_channel_messages")
      .insert({
        channel_id: channelId,
        crew_id: crewId,
        user_id: user.id,
        username: displayName,
        display_name: displayName,
        avatar_url: null,
        message_text: text,
        is_bot: true,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to post bot message");
      return null;
    }
    return data;
  }, [crewId, channelId, user, displayName]);

  // Create a poll
  const createPoll = useCallback(async (title: string, options: string[], durationHours?: number) => {
    if (!crewId || !channelId || !user) return null;
    setSending(true);

    // Post the bot message first
    const messageText = `📊 **POLL: ${title}**\n${options.map((o, i) => `${getEmojiForIndex(i)} ${o}`).join("\n")}\n\n_Vote below!_`;
    const message = await postBotMessage(messageText);

    if (!message) {
      setSending(false);
      return null;
    }

    // Create the command record
    const { data, error } = await supabase
      .from("unit_bot_commands")
      .insert({
        crew_id: crewId,
        channel_id: channelId,
        message_id: message.id,
        command_type: "poll",
        title,
        data: { options },
        created_by: user.id,
        expires_at: durationHours
          ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
          : null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create poll");
      setSending(false);
      return null;
    }

    toast.success("Poll created!");
    setSending(false);
    return data;
  }, [crewId, channelId, user, postBotMessage]);

  // Create an event
  const createEvent = useCallback(async (title: string, description: string, eventTime: string) => {
    if (!crewId || !channelId || !user) return null;
    setSending(true);

    const eventDate = new Date(eventTime);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });
    const formattedTime = eventDate.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit",
    });

    const messageText = `📅 **EVENT: ${title}**\n${description}\n\n🕐 ${formattedDate} at ${formattedTime}\n\n_React with ✅ if you're attending!_`;
    const message = await postBotMessage(messageText);

    if (!message) {
      setSending(false);
      return null;
    }

    const { data, error } = await supabase
      .from("unit_bot_commands")
      .insert({
        crew_id: crewId,
        channel_id: channelId,
        message_id: message.id,
        command_type: "event",
        title,
        description,
        data: { event_time: eventTime },
        created_by: user.id,
        expires_at: eventTime,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create event");
      setSending(false);
      return null;
    }

    toast.success("Event scheduled!");
    setSending(false);
    return data;
  }, [crewId, channelId, user, postBotMessage]);

  // Create a reminder
  const createReminder = useCallback(async (message: string) => {
    if (!crewId || !channelId || !user) return null;
    setSending(true);

    const messageText = `🔔 **REMINDER**\n${message}`;
    await postBotMessage(messageText);

    toast.success("Reminder posted!");
    setSending(false);
    return true;
  }, [crewId, channelId, user, postBotMessage]);

  // Post rules
  const postRules = useCallback(async (rules: string[]) => {
    if (!crewId || !channelId || !user) return null;
    setSending(true);

    const messageText = `📋 **UNIT RULES**\n${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
    await postBotMessage(messageText);

    toast.success("Rules posted!");
    setSending(false);
    return true;
  }, [crewId, channelId, user, postBotMessage]);

  // Post a custom embed message
  const postEmbed = useCallback(async (title: string, body: string) => {
    if (!crewId || !channelId || !user) return null;
    setSending(true);

    const messageText = title.trim()
      ? `**${title.trim()}**\n${body.trim()}`
      : body.trim();
    await postBotMessage(messageText);

    toast.success("Message posted!");
    setSending(false);
    return true;
  }, [crewId, channelId, user, postBotMessage]);

  // Vote on a poll
  const votePoll = useCallback(async (commandId: string, optionIndex: number) => {
    if (!user) return false;

    await supabase
      .from("unit_bot_poll_votes")
      .delete()
      .eq("command_id", commandId)
      .eq("user_id", user.id);

    const { error } = await supabase
      .from("unit_bot_poll_votes")
      .insert({
        command_id: commandId,
        user_id: user.id,
        option_index: optionIndex,
      });

    if (error) {
      toast.error("Failed to vote");
      return false;
    }

    return true;
  }, [user]);

  return {
    createPoll,
    createEvent,
    createReminder,
    postRules,
    postEmbed,
    postBotMessage,
    votePoll,
    sending,
  };
}

function getEmojiForIndex(index: number): string {
  const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  return emojis[index] || `${index + 1}.`;
}
