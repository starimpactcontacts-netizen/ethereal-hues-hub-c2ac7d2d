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
}

export default function TournamentChat({ tournamentId }: TournamentChatProps) {
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

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tournament_messages")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as TournamentMessage[]);
        lastReadRef.current = Date.now();
        const uniqueUserIds = [...new Set(data.map((m: any) => m.user_id))];
        fetchVerifiedStatus(uniqueUserIds);
      }
      setLoading(false);
    };
    fetchMessages();
  }, [tournamentId]);

  useEffect(() => {
    const channel = supabase
      .channel(`tournament-chat-${tournamentId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "tournament_messages",
        filter: `tournament_id=eq.${tournamentId}`,
      }, (payload) => {
        const newMsg = payload.new as TournamentMessage;
        setMessages((prev) => [...prev, newMsg]);
        if (!verifiedUsers[newMsg.user_id]) fetchVerifiedStatus([newMsg.user_id]);
        if (!isOpen && newMsg.user_id !== user?.id) setUnreadCount((prev) => prev + 1);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "tournament_messages" }, (payload) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== (payload.old as any).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tournamentId, isOpen, user?.id]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) { setUnreadCount(0); lastReadRef.current = Date.now(); }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) { toast.error("Sign in to chat"); return; }
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
    if (error) toast.error("Failed to send");
    else setNewMessage("");
    setSending(false);
  };

  const canDeleteOwnMessage = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < 5 * 60 * 1000;

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase.from("tournament_messages").delete().eq("id", messageId);
    if (error) toast.error("Failed to delete");
    else setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const formatTime = (dateString: string) => format(new Date(dateString), "HH:mm");

  return (
    <>
      {/* Compact Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gold/10 border border-gold/30 hover:bg-gold/20 transition-colors shrink-0"
      >
        <MessageCircle className="w-3.5 h-3.5 text-gold" />
        <span className="text-[10px] font-bold uppercase text-gold">Chat</span>
        {messages.length > 0 && (
          <span className="text-[9px] text-muted-foreground">({messages.length})</span>
        )}
        {unreadCount > 0 && (
          <span className="ml-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Fixed Overlay Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[100]"
              onClick={() => setIsOpen(false)}
            />
            {/* Chat Panel - Roblox style */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-3 right-3 z-[101] bg-background border border-gold/30 rounded-xl shadow-2xl overflow-hidden"
              style={{ 
                bottom: "calc(70px + env(safe-area-inset-bottom))",
                maxHeight: "45vh",
                maxWidth: "400px",
                marginLeft: "auto",
                marginRight: "auto"
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gold/20 to-gold/5 border-b border-gold/20">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gold" />
                  <span className="text-sm font-bold text-foreground">Lobby Chat</span>
                  <span className="text-xs text-muted-foreground">({messages.length})</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Messages */}
              <div className="h-[200px] overflow-y-auto p-3 space-y-2 bg-background">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground">No messages yet. Say hi!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.user_id === user?.id;
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2 group hover:bg-muted/30 px-2 py-1.5 rounded-lg"
                      >
                        <Avatar className="w-6 h-6 shrink-0">
                          <AvatarImage src={message.avatar_url || undefined} />
                          <AvatarFallback className="text-[9px] bg-muted">
                            {message.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold ${isOwn ? "text-gold" : "text-foreground"}`}>
                              {message.username}
                            </span>
                            {verifiedUsers[message.user_id] && <VerifiedBadge size="sm" />}
                            <span className="text-[10px] text-muted-foreground">{formatTime(message.created_at)}</span>
                            {((isOwn && canDeleteOwnMessage(message.created_at)) || canModerate) && (
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="ml-auto p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-foreground/90 break-words leading-relaxed">
                            {message.message_text}
                          </p>
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
                    placeholder={isGuest ? "Sign in to chat" : "Type a message..."}
                    className="flex-1 h-9 text-sm bg-background border-border"
                    disabled={sending || isGuest}
                    maxLength={300}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newMessage.trim() || sending}
                    className="bg-gold hover:bg-gold/90 text-background h-9 w-9 p-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}