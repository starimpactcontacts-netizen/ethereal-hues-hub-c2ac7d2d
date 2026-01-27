import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, ChevronDown, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/hooks/useGuestMode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { toast } from "sonner";
import VerifiedBadge from "./VerifiedBadge";

interface TournamentMessage {
  id: string;
  tournament_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message_text: string;
  created_at: string;
}

interface VerifiedUsers {
  [userId: string]: boolean;
}

interface TournamentChatProps {
  tournamentId: string;
  tournamentName: string;
}

export default function TournamentChat({ tournamentId, tournamentName }: TournamentChatProps) {
  const { user, profile, isAdmin, isDev } = useAuth();
  const { isGuest } = useGuestMode();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TournamentMessage[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUsers>({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastReadRef = useRef<number>(0);

  const canModerate = isAdmin || isDev;

  // Fetch verified status for users
  const fetchVerifiedStatus = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("id, verification_status")
      .in("id", userIds);
    
    if (data) {
      const verified: VerifiedUsers = {};
      data.forEach((p) => {
        verified[p.id] = p.verification_status === true;
      });
      setVerifiedUsers((prev) => ({ ...prev, ...verified }));
    }
  };

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tournament_messages")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching tournament messages:", error);
      } else {
        const msgs = (data as TournamentMessage[]) || [];
        setMessages(msgs);
        lastReadRef.current = Date.now();
        
        // Fetch verified status for all unique users
        const uniqueUserIds = [...new Set(msgs.map((m) => m.user_id))];
        fetchVerifiedStatus(uniqueUserIds);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [tournamentId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`tournament-chat-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tournament_messages",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          const newMsg = payload.new as TournamentMessage;
          setMessages((prev) => [...prev, newMsg]);
          
          // Fetch verified status for new user if not already known
          if (!verifiedUsers[newMsg.user_id]) {
            fetchVerifiedStatus([newMsg.user_id]);
          }
          
          // Increment unread count if chat is closed and message isn't from current user
          if (!isOpen && newMsg.user_id !== user?.id) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tournament_messages",
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, isOpen, user?.id]);

  // Auto-scroll when chat is open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Clear unread when opening
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      lastReadRef.current = Date.now();
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isGuest) {
      toast.error("Sign in to chat");
      return;
    }

    if (!newMessage.trim() || !user || !profile) return;

    setSending(true);
    const displayUsername = (profile as any).display_name || profile.username || "Anonymous";

    const { error } = await supabase.from("tournament_messages").insert({
      tournament_id: tournamentId,
      user_id: user.id,
      username: displayUsername,
      avatar_url: profile.avatar_url,
      message_text: newMessage.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const canDeleteOwnMessage = (createdAt: string) => {
    const messageTime = new Date(createdAt).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return now - messageTime < fiveMinutes;
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("tournament_messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      toast.error("Failed to delete message");
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    }
  };

  const formatTime = (dateString: string) => format(new Date(dateString), "HH:mm");

  return (
    <div className="mt-4 border border-border rounded-xl overflow-hidden bg-surface-1">
      {/* Header - Always visible, clickable to expand/collapse */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-background/50 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-gold" />
          <span className="text-sm font-medium">Lobby Chat</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {messages.length}
          </span>
          {unreadCount > 0 && !isOpen && (
            <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Expandable Chat Area */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Messages */}
            <div className="h-[200px] overflow-y-auto p-3 space-y-2 bg-background/30">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-6 h-6 text-muted-foreground/50 mb-1" />
                  <p className="text-xs text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.user_id === user?.id;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 group ${isOwnMessage ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="w-6 h-6 shrink-0">
                        <AvatarImage src={message.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-muted">
                          {message.username?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[75%] ${isOwnMessage ? "text-right" : ""}`}>
                        <div className={`flex items-center gap-1 mb-0.5 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                          <span className="text-[11px] font-medium text-foreground/80">{message.username}</span>
                          {verifiedUsers[message.user_id] && (
                            <VerifiedBadge size="sm" />
                          )}
                          <span className="text-[9px] text-muted-foreground">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isOwnMessage && (canModerate || canDeleteOwnMessage(message.created_at)) && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          <div
                            className={`inline-block px-2.5 py-1 rounded-xl text-xs ${
                              isOwnMessage
                                ? "bg-gold/20 text-gold border border-gold/30 rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                          >
                            {message.message_text}
                          </div>
                          {!isOwnMessage && canModerate && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-2 border-t border-border bg-background/50">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isGuest ? "Sign in to chat" : "Type a message..."}
                  className="flex-1 h-9 text-sm bg-background border-border"
                  disabled={sending || isGuest}
                  maxLength={300}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim() || sending}
                  className="bg-gold hover:bg-gold/90 text-background h-9 px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}