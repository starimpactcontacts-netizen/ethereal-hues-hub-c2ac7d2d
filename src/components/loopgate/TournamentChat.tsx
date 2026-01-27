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
    <div className="relative shrink-0">
      {/* Compact Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gold/10 border border-gold/30 hover:bg-gold/20 transition-colors"
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

      {/* Dropdown Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-72 bg-background border border-border rounded-lg shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-surface-1 border-b border-border">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-bold text-foreground">Lobby Chat</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-0.5 hover:bg-muted rounded">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-[180px] overflow-y-auto p-2 space-y-1 bg-background/80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-[10px] text-muted-foreground">Loading...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[10px] text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.user_id === user?.id;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-1.5 group hover:bg-muted/30 px-1 py-0.5 rounded"
                    >
                      <Avatar className="w-5 h-5 shrink-0">
                        <AvatarImage src={message.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px] bg-muted">
                          {message.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-semibold ${isOwn ? "text-gold" : "text-foreground"}`}>
                            {message.username}
                          </span>
                          {verifiedUsers[message.user_id] && <VerifiedBadge size="sm" />}
                          <span className="text-[8px] text-muted-foreground">{formatTime(message.created_at)}</span>
                          {((isOwn && canDeleteOwnMessage(message.created_at)) || canModerate) && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="ml-auto p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-foreground/90 break-words leading-tight">
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
            <form onSubmit={handleSendMessage} className="p-2 border-t border-border bg-surface-1">
              <div className="flex gap-1.5">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isGuest ? "Sign in" : "Message..."}
                  className="flex-1 h-7 text-[11px] bg-background border-border"
                  disabled={sending || isGuest}
                  maxLength={300}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim() || sending}
                  className="bg-gold hover:bg-gold/90 text-background h-7 w-7 p-0"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}