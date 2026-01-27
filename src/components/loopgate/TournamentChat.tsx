import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, ChevronDown, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/hooks/useGuestMode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { toast } from "sonner";

interface TournamentMessage {
  id: string;
  tournament_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message_text: string;
  created_at: string;
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
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastReadRef = useRef<number>(0);

  const canModerate = isAdmin || isDev;

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
        setMessages((data as TournamentMessage[]) || []);
        lastReadRef.current = Date.now();
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
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gold text-background shadow-lg shadow-gold/30 flex items-center justify-center ${
          isOpen ? "hidden" : ""
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-16 right-4 left-4 z-50 bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "60vh", height: "400px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface-1 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium truncate max-w-[180px]">
                  {tournamentName}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({messages.length})
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ height: "calc(100% - 110px)" }}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground/70">Be the first to chat!</p>
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
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarImage src={message.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {message.username?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[70%] ${isOwnMessage ? "text-right" : ""}`}>
                        <div className={`flex items-baseline gap-1.5 mb-0.5 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                          <span className="text-xs font-medium">{message.username}</span>
                          <span className="text-[10px] text-muted-foreground">
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
                            className={`inline-block px-3 py-1.5 rounded-2xl text-sm ${
                              isOwnMessage
                                ? "bg-gold text-background rounded-br-sm"
                                : "bg-muted rounded-bl-sm"
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
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-surface-1">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-background"
                  disabled={sending || isGuest}
                  maxLength={300}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || sending}
                  className="bg-gold hover:bg-gold/90 text-background shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}