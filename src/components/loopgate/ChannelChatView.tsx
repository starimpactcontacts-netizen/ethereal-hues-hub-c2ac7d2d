import { useState, useEffect, useRef, useCallback } from "react";
import { Hash, Megaphone, Send, MoreVertical, Trash2, Pin, BookOpen, Lock, Users, Settings, ChevronLeft } from "lucide-react";
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
import PinnedMessagesPanel from "@/components/loopgate/PinnedMessagesPanel";
import BotMessageBadge from "@/components/loopgate/BotMessageBadge";
import UnitBotCommandMenu from "@/components/loopgate/UnitBotCommandMenu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
  botName?: string;
  botAvatarUrl?: string;
  onShowMembers?: () => void;
  onShowPermissions?: () => void;
  showBackOnMobile?: boolean;
  onBack?: () => void;
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
  botName = "Unit Bot",
  botAvatarUrl,
  onShowMembers,
  onShowPermissions,
  showBackOnMobile = false,
  onBack,
}: ChannelChatViewProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
  const [showPinned, setShowPinned] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Count pinned messages
  const pinnedCount = messages.filter((m) => m.is_pinned).length;

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

    if (channel.is_locked && !isOfficer) {
      toast.error("Only officers can post in this channel");
      return;
    }

    setSending(true);
    await onSendMessage(text.trim());
    setNewMessage("");
    setShowGifPicker(false);

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
    return now - messageTime < 5 * 60 * 1000;
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase.from("crew_channel_messages").delete().eq("id", messageId);
    if (error) {
      toast.error("Failed to delete message");
    } else {
      toast.success("Message deleted");
    }
  };

  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    const { error } = await supabase
      .from("crew_channel_messages")
      .update({ is_pinned: !isPinned })
      .eq("id", messageId);

    if (error) {
      toast.error("Failed to update pin");
    } else {
      toast.success(isPinned ? "Message unpinned" : "Message pinned!");
    }
  };

  const handleUnpinFromPanel = async (messageId: string) => {
    await handlePinMessage(messageId, true);
    // Panel will refetch on its own
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

  // Mobile message action drawer content
  const MobileMessageActions = ({ message, isPinned, canDelete }: { message: ChannelMessage; isPinned: boolean; canDelete: boolean }) => (
    <div className="p-4 space-y-1">
      {canModerate && (
        <button
          onClick={() => handlePinMessage(message.id, isPinned)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/30 transition-colors text-sm"
        >
          <Pin className="w-4 h-4 text-gold" />
          {isPinned ? "Unpin Message" : "Pin Message"}
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => handleDeleteMessage(message.id)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/10 transition-colors text-sm text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          Delete Message
        </button>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Enhanced Channel Header */}
      <div className="px-3 py-2.5 border-b border-border/50 flex items-center gap-2 shrink-0">
        {showBackOnMobile && onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0 -ml-1"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
        
        <span className="text-muted-foreground/70 shrink-0">{channelIcon}</span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate">{channel.name}</span>
            {channel.is_locked && <Lock className="w-3 h-3 text-muted-foreground/50 shrink-0" />}
          </div>
          {channel.description && (
            <p className="text-[11px] text-muted-foreground/50 truncate">{channel.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Pinned messages button */}
          {pinnedCount > 0 && (
            <button
              onClick={() => setShowPinned(!showPinned)}
              className={cn(
                "p-1.5 rounded-lg transition-colors flex items-center gap-1",
                showPinned ? "bg-gold/10 text-gold" : "hover:bg-muted/50 text-muted-foreground"
              )}
            >
              <Pin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{pinnedCount}</span>
            </button>
          )}

          {/* Members toggle (desktop only) */}
          {!isMobile && onShowMembers && (
            <button
              onClick={onShowMembers}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
            >
              <Users className="w-4 h-4" />
            </button>
          )}

          {/* Bot command menu for officers */}
          {isOfficer && (
            <UnitBotCommandMenu crewId={crewId} channelId={channel.id} isOfficer={isOfficer} botName={botName} />
          )}

          {/* Permissions (officer only) */}
          {isOfficer && onShowPermissions && (
            <button
              onClick={onShowPermissions}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              {channelIcon}
            </div>
            <h3 className="font-semibold text-sm mb-1">Welcome to #{channel.name}</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              {channel.description || "This is the start of the channel. Say something!"}
            </p>
          </div>
        ) : (
          <div className="py-3">
            {Object.entries(messagesByDate).map(([dateKey, groups]) => (
              <div key={dateKey}>
                {/* Date Divider */}
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="flex-1 h-px bg-border/30" />
                  <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">
                    {dateKey}
                  </span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>

                {/* Message Groups */}
                {groups.map((group) => (
                  <div
                    key={`${group.user_id}-${group.firstMessageTime.getTime()}`}
                    className="group/msggroup hover:bg-muted/5 px-4 py-1.5"
                  >
                    <div className="flex gap-2.5">
                      <Avatar
                        className={cn(
                          "w-9 h-9 shrink-0",
                          group.messages[0]?.is_bot ? "ring-2 ring-primary/30" : "cursor-pointer"
                        )}
                        onClick={() => !group.messages[0]?.is_bot && navigate(`/u/${group.username}`)}
                      >
                        {group.messages[0]?.is_bot ? (
                          botAvatarUrl ? (
                            <>
                              <AvatarImage src={botAvatarUrl} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">🤖</AvatarFallback>
                            </>
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">🤖</AvatarFallback>
                          )
                        ) : (
                          <>
                            <AvatarImage src={group.avatar_url || undefined} />
                            <AvatarFallback className="bg-muted text-xs font-medium">
                              {(group.display_name || group.username || "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[13px] font-semibold hover:underline cursor-pointer",
                              group.messages[0]?.is_bot && "text-primary"
                            )}
                            onClick={() => !group.messages[0]?.is_bot && navigate(`/u/${group.username}`)}
                          >
                            {group.messages[0]?.is_bot ? botName : (group.display_name || group.username)}
                          </span>
                          {group.messages[0]?.is_bot && <BotMessageBadge />}
                          <span className="text-[10px] text-muted-foreground/40">
                            {format(group.firstMessageTime, "h:mm a")}
                          </span>
                        </div>

                        {group.messages.map((message) => {
                          const isOwn = message.user_id === user?.id;
                          const canDelete = canModerate || (isOwn && canDeleteOwnMessage(message.created_at));
                          const isPinned = message.is_pinned;

                          return (
                            <div key={message.id} className="group/msg mt-0.5">
                              <div className="flex items-start gap-1.5">
                                {/* Pin indicator */}
                                {isPinned && (
                                  <Pin className="w-3 h-3 text-gold/60 shrink-0 mt-1" />
                                )}
                                
                                <div className="text-[13px] text-foreground/85 leading-relaxed break-words flex-1">
                                  <RichMessageContent content={message.message_text} />
                                </div>
                                
                                {/* Desktop: hover actions */}
                                {!isMobile && (canDelete || canModerate) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="opacity-0 group-hover/msg:opacity-100 p-1 rounded hover:bg-muted/50 shrink-0 transition-opacity">
                                        <MoreVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36">
                                      {canModerate && (
                                        <DropdownMenuItem
                                          onClick={() => handlePinMessage(message.id, !!isPinned)}
                                          className="text-xs"
                                        >
                                          <Pin className="w-3.5 h-3.5 mr-2 text-gold" />
                                          {isPinned ? "Unpin" : "Pin"}
                                        </DropdownMenuItem>
                                      )}
                                      {canDelete && (
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteMessage(message.id)}
                                          className="text-destructive text-xs"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}

                                {/* Mobile: long-press via drawer */}
                                {isMobile && (canDelete || canModerate) && (
                                  <Drawer>
                                    <DrawerTrigger asChild>
                                      <button className="p-1 rounded hover:bg-muted/50 shrink-0 touch-manipulation">
                                        <MoreVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
                                      </button>
                                    </DrawerTrigger>
                                    <DrawerContent>
                                      <MobileMessageActions
                                        message={message}
                                        isPinned={!!isPinned}
                                        canDelete={canDelete}
                                      />
                                    </DrawerContent>
                                  </Drawer>
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

        {/* Pinned Messages Panel (desktop overlay) */}
        {!isMobile && (
          <PinnedMessagesPanel
            channelId={channel.id}
            channelName={channel.name}
            isOpen={showPinned}
            onClose={() => setShowPinned(false)}
            isOfficer={isOfficer}
            onUnpin={handleUnpinFromPanel}
          />
        )}
      </div>

      {/* Typing Indicator */}
      <CrewTypingIndicator typingUsers={typingUsers} />

      {/* Input Area */}
      <div className="bg-background border-t border-border/30 px-3 py-2.5 shrink-0 relative">
        {/* GIF Picker */}
        {showGifPicker && (
          <div className="absolute bottom-full left-0 right-0 px-3 pb-2">
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
          <div className="flex items-center gap-1.5 bg-muted/30 rounded-xl px-3">
            {/* Bot command menu moved to channel header */}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowGifPicker(!showGifPicker)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent shrink-0"
            >
              <span className="text-[9px] font-bold">GIF</span>
            </Button>

            <Input
              ref={inputRef}
              placeholder={`Message #${channel.name}`}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-0 h-9 text-[13px] focus-visible:ring-0 placeholder:text-muted-foreground/40"
              disabled={sending}
            />

            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleSendMessage()}
              disabled={sending || !newMessage.trim()}
              className="h-8 w-8 text-muted-foreground hover:text-primary disabled:opacity-20 hover:bg-transparent shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5 inline-block mr-1.5" />
            Only officers can post in this channel
          </div>
        )}
      </div>

      {/* Mobile Pinned Messages - Bottom Sheet */}
      {isMobile && showPinned && (
        <PinnedMessagesPanel
          channelId={channel.id}
          channelName={channel.name}
          isOpen={showPinned}
          onClose={() => setShowPinned(false)}
          isOfficer={isOfficer}
          onUnpin={handleUnpinFromPanel}
        />
      )}
    </div>
  );
}
