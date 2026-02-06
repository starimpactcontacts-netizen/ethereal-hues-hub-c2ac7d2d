import { useState, useEffect, useRef, useCallback } from "react";
import { Hash, Megaphone, Send, Smile, MoreVertical, Trash2, Pin, BookOpen, Lock } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useXP, XP_REWARDS } from "@/hooks/useXP";
import { useGuestMode } from "@/hooks/useGuestMode";
import { ChannelMessage, CrewChannel } from "@/hooks/useCrewChannels";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GifPicker from "@/components/loopgate/GifPicker";
import MentionAutocomplete from "@/components/loopgate/MentionAutocomplete";
import RichMessageContent from "@/components/loopgate/RichMessageContent";
import CrewTypingIndicator from "@/components/loopgate/CrewTypingIndicator";
import MessageReactions from "@/components/loopgate/MessageReactions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface ChannelChatViewProps {
  channel: CrewChannel;
  crewId: string;
  messages: ChannelMessage[];
  onSendMessage: (text: string) => Promise<unknown>;
  onMarkAsRead: () => void;
  typingUsers: string[];
  onTyping: () => void;
  isOfficer?: boolean;
  crewName?: string;
}

interface MessageGroup {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  messages: ChannelMessage[];
  firstMessageTime: Date;
}

function groupMessages(messages: ChannelMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];

  messages.forEach((message) => {
    const lastGroup = groups[groups.length - 1];
    const messageTime = new Date(message.created_at);

    if (lastGroup && lastGroup.user_id === message.user_id) {
      const timeDiff = messageTime.getTime() - lastGroup.firstMessageTime.getTime();
      if (timeDiff < 5 * 60 * 1000) {
        lastGroup.messages.push(message);
        return;
      }
    }

    groups.push({
      user_id: message.user_id,
      username: message.username,
      display_name: message.display_name,
      avatar_url: message.avatar_url,
      messages: [message],
      firstMessageTime: messageTime,
    });
  });

  return groups;
}

function formatMessageDate(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  text: <Hash className="w-5 h-5" />,
  announcement: <Megaphone className="w-5 h-5" />,
  rules: <BookOpen className="w-5 h-5" />,
};

export default function ChannelChatView({
  channel,
  crewId,
  messages,
  onSendMessage,
  onMarkAsRead,
  typingUsers,
  onTyping,
  isOfficer = false,
  crewName,
}: ChannelChatViewProps) {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isDev } = useAuth();
  const { awardCappedXP } = useXP();
  const { isGuest } = useGuestMode();
  const canModerate = isAdmin || isDev || isOfficer;

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when viewing
  useEffect(() => {
    onMarkAsRead();
  }, [channel.id, onMarkAsRead]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || newMessage;

    if (isGuest) {
      toast.error("Sign in to send messages");
      return;
    }

    if (!user || !profile || !text.trim()) return;

    // Check if channel is locked (announcements/rules)
    if (channel.is_locked && !isOfficer) {
      toast.error("Only officers can post in this channel");
      return;
    }

    setSending(true);
    await onSendMessage(text.trim());
    setNewMessage("");
    setShowGifPicker(false);

    // Award XP for unit chat
    awardCappedXP(XP_REWARDS.crew_chat, "crew_chat", `Message in #${channel.name}`);
    setSending(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    handleSendMessage(gifUrl);
    setShowGifPicker(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    setNewMessage(value);
    setCursorPosition(position);
    onTyping();

    // Check for @mention trigger
    const textBeforeCursor = value.slice(0, position);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setShowMentions(true);
      setMentionQuery(mentionMatch[1]);
    } else {
      setShowMentions(false);
      setMentionQuery("");
    }
  };

  const handleMentionSelect = (username: string) => {
    const textBeforeCursor = newMessage.slice(0, cursorPosition);
    const textAfterCursor = newMessage.slice(cursorPosition);
    const mentionStart = textBeforeCursor.lastIndexOf("@");

    const newText = textBeforeCursor.slice(0, mentionStart) + `@${username} ` + textAfterCursor;

    setNewMessage(newText);
    setShowMentions(false);
    setMentionQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      if (e.key === "Escape") {
        setShowMentions(false);
        return;
      }
      if (["ArrowUp", "ArrowDown", "Tab", "Enter"].includes(e.key)) {
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canDeleteOwnMessage = (createdAt: string) => {
    const messageTime = new Date(createdAt).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return now - messageTime < fiveMinutes;
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase.from("crew_channel_messages").delete().eq("id", messageId);

    if (error) {
      toast.error("Failed to delete message");
    } else {
      toast.success("Message deleted");
    }
  };

  const messageGroups = groupMessages(messages);

  const messagesByDate = messageGroups.reduce(
    (acc, group) => {
      const dateKey = formatMessageDate(group.firstMessageTime);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(group);
      return acc;
    },
    {} as Record<string, MessageGroup[]>
  );

  const channelIcon = CHANNEL_ICONS[channel.channel_type] || CHANNEL_ICONS.text;
  const canPost = !channel.is_locked || isOfficer;

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Channel Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3 shrink-0">
        <span className="text-muted-foreground/70">{channelIcon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{channel.name}</span>
            {channel.is_locked && <Lock className="w-3 h-3 text-muted-foreground/50" />}
          </div>
          {channel.description && (
            <p className="text-xs text-muted-foreground/60 truncate max-w-md">
              {channel.description}
            </p>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              {channelIcon}
            </div>
            <h3 className="font-semibold mb-1">Welcome to #{channel.name}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {channel.description || "This is the start of the channel."}
            </p>
          </div>
        ) : (
          <div className="py-3">
            {Object.entries(messagesByDate).map(([dateKey, groups]) => (
              <div key={dateKey}>
                {/* Date Divider */}
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">
                    {dateKey}
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>

                {/* Message Groups */}
                {groups.map((group) => (
                  <div
                    key={`${group.user_id}-${group.firstMessageTime.getTime()}`}
                    className="group/msggroup hover:bg-muted/10 px-4 py-2"
                  >
                    <div className="flex gap-3">
                      <Avatar
                        className="w-10 h-10 shrink-0 cursor-pointer"
                        onClick={() => navigate(`/u/${group.username}`)}
                      >
                        <AvatarImage src={group.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-sm font-medium">
                          {(group.display_name || group.username || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-sm font-semibold hover:underline cursor-pointer"
                            onClick={() => navigate(`/u/${group.username}`)}
                          >
                            {group.display_name || group.username}
                          </span>
                          <span className="text-[11px] text-muted-foreground/50">
                            {format(group.firstMessageTime, "h:mm a")}
                          </span>
                        </div>

                        {group.messages.map((message) => {
                          const isOwn = message.user_id === user?.id;
                          const canDelete =
                            canModerate || (isOwn && canDeleteOwnMessage(message.created_at));

                          return (
                            <div
                              key={message.id}
                              className="group/msg mt-0.5"
                            >
                              <div className="flex items-start gap-2">
                                <div className="text-sm text-foreground/90 leading-relaxed break-words flex-1">
                                  <RichMessageContent content={message.message_text} />
                                </div>
                                {canDelete && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="opacity-0 group-hover/msg:opacity-100 p-1 rounded hover:bg-muted/50 shrink-0 transition-opacity">
                                        <MoreVertical className="w-4 h-4 text-muted-foreground/50" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32">
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="text-destructive text-xs"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                              {/* Emoji Reactions */}
                              <MessageReactions 
                                messageId={message.id} 
                                messageTable="crew_channel_messages" 
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      <CrewTypingIndicator typingUsers={typingUsers} />

      {/* Input Area */}
      <div className="bg-background border-t border-border/40 px-4 py-3 shrink-0 relative">
        {/* GIF Picker */}
        {showGifPicker && (
          <div className="absolute bottom-full left-0 right-0 px-4 pb-2">
            <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
          </div>
        )}
        {showMentions && (
          <MentionAutocomplete
            crewId={crewId}
            searchQuery={mentionQuery}
            onSelect={handleMentionSelect}
            visible={showMentions}
          />
        )}

        {canPost ? (
          <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowGifPicker(!showGifPicker)}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-transparent shrink-0"
            >
              <span className="text-[10px] font-bold">GIF</span>
            </Button>

            <Input
              ref={inputRef}
              placeholder={`Message #${channel.name}`}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-0 h-10 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50"
              disabled={sending}
            />

            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleSendMessage()}
              disabled={sending || !newMessage.trim()}
              className="h-9 w-9 text-muted-foreground hover:text-primary disabled:opacity-30 hover:bg-transparent shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 inline-block mr-2" />
            Only officers can post in this channel
          </div>
        )}
      </div>
    </div>
  );
}
