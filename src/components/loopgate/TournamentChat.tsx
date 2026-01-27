import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Trash2 } from "lucide-react";
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
    <>
      {/* Floating Chat Button - Fixed position, right side, above bottom nav */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 z-40 w-12 h-12 rounded-full bg-gold text-background shadow-lg shadow-gold/30 flex items-center justify-center"
          style={{ bottom: "calc(56px + env(safe-area-inset-bottom) + 16px)" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Compact Chat Panel - Fixed, 1/4 width on desktop, wider on mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed right-4 z-50 w-72 sm:w-80 bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
            style={{ 
              bottom: "calc(56px + env(safe-area-inset-bottom) + 16px)",
              maxHeight: "320px"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-surface-1 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gold" />
                <span className="text-xs font-medium">Lobby Chat</span>
                <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {messages.length}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Messages - Compact scrollable area */}
            <div className="h-[180px] overflow-y-auto p-2 space-y-1.5 bg-background/80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-5 h-5 text-muted-foreground/50 mb-1" />
                  <p className="text-[10px] text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.user_id === user?.id;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: isOwnMessage ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-1.5 group ${isOwnMessage ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="w-5 h-5 shrink-0">
                        <AvatarImage src={message.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px] bg-muted">
                          {message.username?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[80%] ${isOwnMessage ? "text-right" : ""}`}>
                        <div className={`flex items-center gap-1 mb-0.5 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                          <span className="text-[10px] font-medium text-foreground/80">{message.username}</span>
                          {verifiedUsers[message.user_id] && <VerifiedBadge size="sm" />}
                          <span className="text-[8px] text-muted-foreground">{formatTime(message.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {isOwnMessage && (canModerate || canDeleteOwnMessage(message.created_at)) && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <div
                            className={`inline-block px-2 py-1 rounded-lg text-[11px] leading-tight ${
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
                              <Trash2 className="w-2.5 h-2.5" />
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

            {/* Input - Compact */}
            <form onSubmit={handleSendMessage} className="p-2 border-t border-border bg-surface-1">
              <div className="flex gap-1.5">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isGuest ? "Sign in" : "Message..."}
                  className="flex-1 h-8 text-xs bg-background border-border"
                  disabled={sending || isGuest}
                  maxLength={300}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim() || sending}
                  className="bg-gold hover:bg-gold/90 text-background h-8 w-8 p-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}