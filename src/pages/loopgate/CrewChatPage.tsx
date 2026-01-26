import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Trash2, Hash, Users, MoreVertical, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageTransition from "@/components/loopgate/PageTransition";
import CrewTypingIndicator from "@/components/loopgate/CrewTypingIndicator";
import GifPicker from "@/components/loopgate/GifPicker";
import MentionAutocomplete from "@/components/loopgate/MentionAutocomplete";
import RichMessageContent from "@/components/loopgate/RichMessageContent";
import { useCrewPresence } from "@/hooks/useCrewPresence";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { useGuestMode } from "@/hooks/useGuestMode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  message_text: string;
  created_at: string;
}

interface Crew {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface MessageGroup {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  messages: Message[];
  firstMessageTime: Date;
}

function groupMessages(messages: Message[]): MessageGroup[] {
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

export default function CrewChatPage() {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const { user, profile, isAdmin, isDev } = useAuth();
  const { isGuest } = useGuestMode();
  const canModerate = isAdmin || isDev;
  const [crew, setCrew] = useState<Crew | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { typingUsers, broadcastTyping, onlineCount } = useCrewPresence(crewId);

  useEffect(() => {
    if (crewId) {
      fetchInitialData();
    }
  }, [crewId]);

  useEffect(() => {
    if (!crewId) return;

    const channel = supabase
      .channel(`crew-chat-${crewId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crew_messages",
          filter: `crew_id=eq.${crewId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "crew_messages",
          filter: `crew_id=eq.${crewId}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crewId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchInitialData = async () => {
    if (!crewId) return;

    setLoading(true);

    const { data: crewData, error: crewError } = await supabase
      .from("crews")
      .select("id, name, avatar_url")
      .eq("id", crewId)
      .single();

    if (crewError || !crewData) {
      console.error("Error fetching crew:", crewError);
      navigate("/crews");
      return;
    }

    setCrew(crewData);

    const { data: messagesData, error: messagesError } = await supabase
      .from("crew_messages")
      .select("*")
      .eq("crew_id", crewId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!messagesError && messagesData) {
      setMessages(messagesData);
    }

    setLoading(false);
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || newMessage;
    
    if (isGuest) {
      toast.error("Sign in to send messages");
      return;
    }
    
    if (!user || !profile || !crewId || !text.trim()) return;

    setSending(true);

    const displayUsername = profile.display_name || profile.username || "Anonymous";

    const { error } = await supabase.from("crew_messages").insert({
      crew_id: crewId,
      user_id: user.id,
      username: displayUsername,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      message_text: text.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
      setShowGifPicker(false);
    }

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
    broadcastTyping();

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
    
    const newText = 
      textBeforeCursor.slice(0, mentionStart) + 
      `@${username} ` + 
      textAfterCursor;
    
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
      // Let MentionAutocomplete handle arrow keys and enter
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
    const { error } = await supabase
      .from("crew_messages")
      .delete()
      .eq("id", messageId);
    
    if (error) {
      toast.error("Failed to delete message");
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success("Message deleted");
    }
  };

  if (loading || !crew) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  const messageGroups = groupMessages(messages);

  const messagesByDate = messageGroups.reduce((acc, group) => {
    const dateKey = formatMessageDate(group.firstMessageTime);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(group);
    return acc;
  }, {} as Record<string, MessageGroup[]>);

  return (
    <div className="fixed inset-0 bg-background flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Discord-style Header */}
      <div className="bg-card/95 backdrop-blur-md border-b border-border shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => navigate(`/crews/${crewId}`)} 
              className="p-1.5 -ml-1 rounded-lg hover:bg-muted/50 transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-muted/80 flex items-center justify-center">
                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="leading-none">
                <h1 className="text-sm font-semibold">general</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">{crew.name}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-2 py-1 rounded-full bg-muted/40">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>{onlineCount}</span>
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div 
        ref={scrollAreaRef} 
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Hash className="w-7 h-7 text-muted-foreground/70" />
            </div>
            <h3 className="text-base font-semibold mb-1">Welcome to #general!</h3>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              This is the beginning of your crew's chat. Say hi! 👋
            </p>
          </div>
        ) : (
          <div className="py-2">
            {Object.entries(messagesByDate).map(([dateKey, groups]) => (
              <div key={dateKey}>
                {/* Date Divider */}
                <div className="flex items-center gap-3 px-3 py-2 my-1">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                    {dateKey}
                  </span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                
                {/* Message Groups */}
                {groups.map((group) => (
                  <div 
                    key={`${group.user_id}-${group.firstMessageTime.getTime()}`}
                    className="group/msggroup hover:bg-muted/20 transition-colors px-3 py-1"
                  >
                    <div className="flex gap-2.5">
                      {/* Avatar */}
                      <Avatar 
                        className="w-9 h-9 shrink-0 cursor-pointer active:scale-95 transition-transform"
                        onClick={() => navigate(`/u/${group.username}`)}
                      >
                        <AvatarImage src={group.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                          {(group.display_name || group.username || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Messages */}
                      <div className="flex-1 min-w-0">
                        {/* Header with name and time */}
                        <div className="flex items-baseline gap-1.5 mb-0.5">
                          <span 
                            className="font-semibold text-[13px] hover:underline cursor-pointer"
                            onClick={() => navigate(`/u/${group.username}`)}
                          >
                            {group.display_name || group.username}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            {format(group.firstMessageTime, "h:mm a")}
                          </span>
                        </div>
                        
                        {/* Message texts */}
                        {group.messages.map((message) => {
                          const isOwn = message.user_id === user?.id;
                          const canDelete = canModerate || (isOwn && canDeleteOwnMessage(message.created_at));
                          
                          return (
                            <div 
                              key={message.id} 
                              className="group/msg flex items-start gap-1.5 py-0.5"
                            >
                              <div className="text-[13px] text-foreground/90 leading-relaxed break-words flex-1">
                                <RichMessageContent content={message.message_text} />
                              </div>
                              
                              {/* Message actions */}
                              {canDelete && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="opacity-0 group-hover/msg:opacity-100 p-1 rounded hover:bg-muted/50 transition-all shrink-0">
                                      <MoreVertical className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-32">
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="text-destructive focus:text-destructive text-xs"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1.5" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      <CrewTypingIndicator typingUsers={typingUsers} />

      {/* Discord-style Input - Fixed at bottom */}
      <div className="bg-background border-t border-border/50 p-2.5 shrink-0">
        <div className="relative">
          {/* GIF Picker */}
          {showGifPicker && crewId && (
            <GifPicker
              onSelect={handleGifSelect}
              onClose={() => setShowGifPicker(false)}
            />
          )}
          
          {/* Mention Autocomplete */}
          {showMentions && crewId && (
            <MentionAutocomplete
              crewId={crewId}
              searchQuery={mentionQuery}
              onSelect={handleMentionSelect}
              visible={showMentions}
            />
          )}
          
          <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg px-1">
            {/* GIF Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowGifPicker(!showGifPicker)}
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              <span className="text-[10px] font-bold">GIF</span>
            </Button>
            
            {/* Input */}
            <Input
              ref={inputRef}
              placeholder="Message #general"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-0 h-10 text-[13px] focus-visible:ring-0 placeholder:text-muted-foreground/50"
              disabled={sending}
            />
            
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleSendMessage()}
              disabled={sending || !newMessage.trim()}
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary disabled:opacity-30 hover:bg-transparent"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
