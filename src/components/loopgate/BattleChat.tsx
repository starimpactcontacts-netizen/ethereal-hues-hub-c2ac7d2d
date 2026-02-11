import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Users, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BattleMessage {
  id: string;
  battle_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message_text: string;
  is_public: boolean;
  is_system: boolean;
  created_at: string;
}

interface BattleChatProps {
  battleId: string;
  challengerId: string;
  opponentId: string | null;
  judgeId: string | null;
}

export default function BattleChat({ battleId, challengerId, opponentId, judgeId }: BattleChatProps) {
  const { profile, user } = useAuth();
  const [messages, setMessages] = useState<BattleMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"public" | "private">("public");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isParticipant = user?.id === challengerId || user?.id === opponentId || user?.id === judgeId;

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      let query = supabase
        .from("battle_messages")
        .select("*")
        .eq("battle_id", battleId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (tab === "public") {
        query = query.eq("is_public", true);
      } else {
        query = query.eq("is_public", false);
      }

      const { data } = await query;
      if (data) setMessages(data as BattleMessage[]);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`battle-chat-${battleId}-${tab}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "battle_messages",
          filter: `battle_id=eq.${battleId}`,
        },
        (payload) => {
          const msg = payload.new as BattleMessage;
          if ((tab === "public" && msg.is_public) || (tab === "private" && !msg.is_public)) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, tab]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !profile || sending) return;

    setSending(true);
    const { error } = await supabase.from("battle_messages").insert({
      battle_id: battleId,
      user_id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      message_text: input.trim(),
      is_public: tab === "public",
    });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setInput("");
    }
    setSending(false);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-surface-1 border border-border overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("public")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            tab === "public"
              ? "text-red-400 border-b-2 border-red-500 bg-red-500/5"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-3 h-3" />
          Spectator Chat
        </button>
        {isParticipant && (
          <button
            onClick={() => setTab("private")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              tab === "private"
                ? "text-purple-400 border-b-2 border-purple-500 bg-purple-500/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="w-3 h-3" />
            Fighter Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-64 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="w-6 h-6 mb-2 opacity-30" />
            <span className="text-[10px] uppercase tracking-wider">
              {tab === "public" ? "Be the first to comment" : "Fighter-only chat"}
            </span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.is_system ? "justify-center" : ""}`}
            >
              {msg.is_system ? (
                <span className="text-[10px] text-muted-foreground italic bg-surface-2 px-3 py-1 rounded-full">
                  {msg.message_text}
                </span>
              ) : (
                <>
                  <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                    <AvatarImage src={msg.avatar_url || ""} />
                    <AvatarFallback className="text-[8px] bg-surface-2">
                      {msg.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold ${
                        msg.user_id === challengerId ? "text-red-400" :
                        msg.user_id === opponentId ? "text-sky-400" :
                        msg.user_id === judgeId ? "text-purple-400" :
                        "text-foreground"
                      }`}>
                        {msg.username}
                      </span>
                      {msg.user_id === judgeId && (
                        <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1 rounded">JUDGE</span>
                      )}
                      {(msg.user_id === challengerId || msg.user_id === opponentId) && (
                        <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded">FIGHTER</span>
                      )}
                      <span className="text-[8px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                    </div>
                    <p className="text-xs text-foreground/90 break-words">{msg.message_text}</p>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      {user && (tab === "public" || isParticipant) && (
        <div className="border-t border-border p-2 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={tab === "public" ? "Chat as spectator..." : "Fighter chat..."}
            className="flex-1 h-8 text-xs bg-background border-border"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={`h-8 px-3 ${tab === "public" ? "bg-red-500 hover:bg-red-600" : "bg-purple-500 hover:bg-purple-600"} text-white`}
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
