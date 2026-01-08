import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Globe, Users, Crown, Shield, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { toast } from "sonner";

interface ArenaMessage {
  id: string;
  arena_id: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message_text: string;
  created_at: string;
}

const arenaInfo: Record<number, { title: string; icon: React.ElementType }> = {
  1: { title: "Global Arena", icon: Globe },
  2: { title: "Open League Arena", icon: Users },
  3: { title: "Pro League Arena", icon: Crown },
  4: { title: "Elite Arena", icon: Shield },
};

export default function ArenaChatPage() {
  const { arenaId } = useParams<{ arenaId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ArenaMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const numericArenaId = parseInt(arenaId || "1", 10);
  const arena = arenaInfo[numericArenaId] || arenaInfo[1];
  const Icon = arena.icon;

  // Check league access
  useEffect(() => {
    const userLeague = profile?.league?.toLowerCase() || "open";

    if (numericArenaId === 3 && userLeague !== "pro" && userLeague !== "elite") {
      toast.error("You don't have access to Pro League Arena");
      navigate("/arenas");
      return;
    }

    if (numericArenaId === 4 && userLeague !== "elite") {
      toast.error("You don't have access to Elite Arena");
      navigate("/arenas");
      return;
    }
  }, [numericArenaId, profile?.league, navigate]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("arena_messages")
        .select("*")
        .eq("arena_id", numericArenaId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [numericArenaId]);

  // Subscribe to realtime updates (INSERT and DELETE)
  useEffect(() => {
    const channel = supabase
      .channel(`arena-${numericArenaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "arena_messages",
          filter: `arena_id=eq.${numericArenaId}`,
        },
        (payload) => {
          const newMsg = payload.new as ArenaMessage;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "arena_messages",
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          setMessages((prev) => prev.filter(msg => msg.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [numericArenaId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user || !profile) {
      return;
    }

    setSending(true);

    // Use display_name if available, otherwise username
    const displayUsername = (profile as any).display_name || profile.username || "Anonymous";

    const { error } = await supabase.from("arena_messages").insert({
      arena_id: numericArenaId,
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

  // Admin message deletion
  const { isAdmin } = useAuth();
  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("arena_messages")
      .delete()
      .eq("id", messageId);
    
    if (error) {
      toast.error("Failed to delete message");
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success("Message deleted");
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/arenas")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{arena.title}</h1>
            <p className="text-xs text-muted-foreground">
              {messages.length} messages
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Icon className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground/70">
              Be the first to say something!
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.user_id === user?.id;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
                className={`flex gap-3 group ${isOwnMessage ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={message.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {message.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`max-w-[75%] ${isOwnMessage ? "text-right" : ""}`}
                >
                  <div
                    className={`flex items-baseline gap-2 mb-1 ${
                      isOwnMessage ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span className="text-sm font-medium">{message.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div
                    className={`inline-block px-3 py-2 rounded-2xl ${
                      isOwnMessage
                        ? "bg-gold text-black rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message_text}
                    </p>
                  </div>
                  {/* Admin delete button */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="ml-2 p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4 pb-safe">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
            maxLength={500}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sending}
            className="bg-gold hover:bg-gold/90 text-black shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
