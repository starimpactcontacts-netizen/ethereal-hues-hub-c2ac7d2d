import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Reply, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import GifPicker from "./GifPicker";
import ChatReplyBar from "./ChatReplyBar";
import { useNavigate } from "react-router-dom";
import SmartUsername from "./SmartUsername";
import ChatBubble from "./ChatBubble";

interface CashBattleMessage {
  id: string;
  battle_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message_text: string;
  is_system: boolean;
  created_at: string;
  reply_to_id: string | null;
  reply_to_username: string | null;
  reply_to_text: string | null;
}

interface Props {
  battleId: string;
  challengerId: string;
  opponentId: string | null;
}

function isGifUrl(text: string): boolean {
  return /\.(gif|gifv)(\?|$)/i.test(text) || text.includes("tenor.com") || text.includes("giphy.com");
}

export default function CashBattleChat({ battleId, challengerId, opponentId }: Props) {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<CashBattleMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("cash_battle_messages" as any)
        .select("*")
        .eq("battle_id", battleId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data as any);
    };
    fetch();

    const channel = supabase
      .channel(`cash-battle-chat-${battleId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cash_battle_messages", filter: `battle_id=eq.${battleId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as any]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [battleId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleReply = (msg: CashBattleMessage) => {
    const previewText = isGifUrl(msg.message_text) ? "GIF" : msg.message_text.slice(0, 60);
    setReplyTo({ id: msg.id, username: msg.username, text: previewText });
    inputRef.current?.focus();
  };

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || !profile || sending) return;
    setSending(true);

    const insertPayload: any = {
      battle_id: battleId,
      user_id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      message_text: msgText,
    };
    if (replyTo) {
      insertPayload.reply_to_id = replyTo.id;
      insertPayload.reply_to_username = replyTo.username;
      insertPayload.reply_to_text = replyTo.text;
    }

    const { error } = await supabase.from("cash_battle_messages" as any).insert(insertPayload);
    if (error) toast.error("Failed to send");
    else { if (!text) setInput(""); setReplyTo(null); }
    setSending(false);
  };

  const getNameColor = (userId: string) => {
    if (userId === challengerId) return "text-blue-400";
    if (userId === opponentId) return "text-red-400";
    return "text-white";
  };

  const getRoleBadge = (userId: string) => {
    if (userId === challengerId) return <span className="text-[8px] px-1 rounded bg-blue-500/20 text-blue-400 font-bold">BLUE</span>;
    if (userId === opponentId) return <span className="text-[8px] px-1 rounded bg-red-500/20 text-red-400 font-bold">RED</span>;
    return null;
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const renderText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <button key={i} onClick={() => navigate(`/u/${part.slice(1)}`)} className="text-blue-400 font-bold hover:underline">{part}</button>
      ) : <span key={i}>{part}</span>
    );
  };

  return (
    <div style={{ background: "rgba(10,10,12,0.95)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[11px] font-black text-white uppercase tracking-wider" style={{ fontFamily: "Teko, sans-serif" }}>Live Chat</span>
        <span className="text-[9px] text-zinc-600 ml-auto">{messages.length} msgs</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-56 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="w-5 h-5 text-zinc-700 mb-1.5" />
            <span className="text-[10px] text-zinc-600">Be the first to comment</span>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 group">
              {msg.is_system ? (
                <span className="text-[10px] text-zinc-600 italic mx-auto py-0.5">{msg.message_text}</span>
              ) : (
                <>
                  <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                    <AvatarImage src={msg.avatar_url || ""} />
                    <AvatarFallback className="text-[8px]" style={{ background: "rgba(255,255,255,0.05)" }}>{msg.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    {msg.reply_to_username && (
                      <div className="flex items-center gap-1 text-[9px] text-zinc-600 mb-0.5">
                        <Reply className="w-2.5 h-2.5 rotate-180" />
                        <span>replying to</span>
                        <span className="font-bold">@{msg.reply_to_username}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold ${getNameColor(msg.user_id)}`}>
                            <SmartUsername userId={msg.user_id} username={msg.username} />
                          </span>
                          {getRoleBadge(msg.user_id)}
                          <span className="text-[8px] text-zinc-700">{formatTime(msg.created_at)}</span>
                        </div>
                        {isGifUrl(msg.message_text) ? (
                          <img src={msg.message_text} alt="GIF" className="max-w-[180px] mt-1 rounded-lg" loading="lazy" />
                        ) : (
                          <ChatBubble userId={msg.user_id}>
                            <p className="text-[11px] text-zinc-300 break-words">{renderText(msg.message_text)}</p>
                          </ChatBubble>
                        )}
                      </div>
                      {user && (
                        <button onClick={() => handleReply(msg)} className="opacity-0 group-hover:opacity-100 active:opacity-100 p-1 text-zinc-700 hover:text-blue-400 transition-all shrink-0 touch-manipulation">
                          <Reply className="w-3 h-3 rotate-180" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* GIF Picker */}
      {showGifPicker && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <GifPicker onSelect={(url) => { setShowGifPicker(false); handleSend(url); }} onClose={() => setShowGifPicker(false)} />
        </div>
      )}

      {/* Input */}
      {user && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {replyTo && <ChatReplyBar username={replyTo.username} text={replyTo.text} onClear={() => setReplyTo(null)} accentColor="blue" />}
          <div className="p-2 flex gap-2">
            <button
              onClick={() => setShowGifPicker(!showGifPicker)}
              className="h-8 w-8 flex items-center justify-center shrink-0 rounded-lg transition-colors"
              style={{ background: showGifPicker ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={replyTo ? `Reply to @${replyTo.username}...` : "Say something..."}
              className="flex-1 h-8 text-xs bg-white/[0.03] border-white/8 text-white placeholder:text-white/20 rounded-lg"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="h-8 px-3 rounded-lg flex items-center justify-center disabled:opacity-30 transition-all"
              style={{ background: "linear-gradient(135deg, #3b82f6, #ef4444)" }}
            >
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
