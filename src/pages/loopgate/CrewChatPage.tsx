import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Trash2, Hash, Users, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageTransition from "@/components/loopgate/PageTransition";
import CrewTypingIndicator from "@/components/loopgate/CrewTypingIndicator";
import CrewOnlineIndicator from "@/components/loopgate/CrewOnlineIndicator";
import { useCrewPresence } from "@/hooks/useCrewPresence";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
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

// Group messages by user and time (within 5 minutes)
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
    
    // Check if we should add to existing group
    if (lastGroup && lastGroup.user_id === message.user_id) {
      const timeDiff = messageTime.getTime() - lastGroup.firstMessageTime.getTime();
      if (timeDiff < 5 * 60 * 1000) { // Within 5 minutes
        lastGroup.messages.push(message);
        return;
      }
    }
    
    // Create new group
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Typing & presence
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

  const handleSendMessage = async () => {
    if (isGuest) {
      toast.error("Sign in to send messages");
      return;
    }
    
    if (!user || !profile || !crewId || !newMessage.trim()) return;

    setSending(true);

    const displayUsername = profile.display_name || profile.username || "Anonymous";

    const { error } = await supabase.from("crew_messages").insert({
      crew_id: crewId,
      user_id: user.id,
      username: displayUsername,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      message_text: newMessage.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  // Group messages by date
  const messagesByDate = messageGroups.reduce((acc, group) => {
    const dateKey = formatMessageDate(group.firstMessageTime);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(group);
    return acc;
  }, {} as Record<string, MessageGroup[]>);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Discord-style Header */}
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shrink-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(`/crews/${crewId}`)} 
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold leading-tight">general</h1>
                  <p className="text-[10px] text-muted-foreground">{crew.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted/50">
                <Users className="w-3.5 h-3.5" />
                <span>{onlineCount} online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Hash className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Welcome to #general!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                This is the beginning of your crew's chat history. Say hi! 👋
              </p>
            </div>
          ) : (
            <div className="py-4">
              {Object.entries(messagesByDate).map(([dateKey, groups]) => (
                <div key={dateKey}>
                  {/* Date Divider */}
                  <div className="flex items-center gap-4 px-4 py-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {dateKey}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  {/* Message Groups */}
                  {groups.map((group, groupIdx) => (
                    <div 
                      key={`${group.user_id}-${group.firstMessageTime.getTime()}`}
                      className="group/msggroup hover:bg-muted/30 transition-colors px-4 py-1"
                    >
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <Avatar 
                          className="w-10 h-10 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/u/${group.username}`)}
                        >
                          <AvatarImage src={group.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                            {(group.display_name || group.username || "?")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Messages */}
                        <div className="flex-1 min-w-0">
                          {/* Header with name and time */}
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span 
                              className="font-semibold text-sm hover:underline cursor-pointer"
                              onClick={() => navigate(`/u/${group.username}`)}
                            >
                              {group.display_name || group.username}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {format(group.firstMessageTime, "h:mm a")}
                            </span>
                          </div>
                          
                          {/* Message texts */}
                          {group.messages.map((message, msgIdx) => {
                            const isOwn = message.user_id === user?.id;
                            const canDelete = canModerate || (isOwn && canDeleteOwnMessage(message.created_at));
                            
                            return (
                              <div 
                                key={message.id} 
                                className="group/msg flex items-start gap-2 py-0.5"
                              >
                                <p className="text-sm text-foreground/90 leading-relaxed break-words flex-1">
                                  {message.message_text}
                                </p>
                                
                                {/* Message actions */}
                                {canDelete && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="opacity-0 group-hover/msg:opacity-100 p-1 rounded hover:bg-muted transition-all shrink-0">
                                        <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36">
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-2" />
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
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Typing Indicator */}
        <CrewTypingIndicator typingUsers={typingUsers} />

        {/* Discord-style Input */}
        <div className="sticky bottom-0 bg-background p-4 safe-bottom shrink-0">
          <div className="relative">
            <Input
              placeholder={`Message #general`}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                broadcastTyping();
              }}
              onKeyDown={handleKeyDown}
              className="pr-12 bg-muted/50 border-0 h-11 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/50"
              disabled={sending}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-primary disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
