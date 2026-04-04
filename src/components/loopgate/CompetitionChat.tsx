import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Image as ImageIcon, Reply, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GifPicker from "./GifPicker";

interface Message {
  id: string;
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

function isGifUrl(text: string): boolean {
  return /\.(gif|gifv)(\?|$)/i.test(text) || text.includes("tenor.com") || text.includes("giphy.com") || text.includes("media.tenor");
}

const teko = { fontFamily: "Teko, sans-serif" };

export default function CompetitionChat({ competitionId }: { competitionId: string }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; text: string } | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("competition_messages" as any)
        .select("*")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data) setMessages(data as any as Message[]);
    };
    fetch();

    const channel = supabase
      .channel(`comp-chat-${competitionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "competition_messages",
        filter: `competition_id=eq.${competitionId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [competitionId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
  };

  const scrollToBottom = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || !profile || sending) return;
    setSending(true);

    const payload: any = {
      competition_id: competitionId,
      user_id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      message_text: msg,
    };
    if (replyTo) {
      payload.reply_to_id = replyTo.id;
      payload.reply_to_username = replyTo.username;
      payload.reply_to_text = replyTo.text;
    }

    await supabase.from("competition_messages" as any).insert(payload);
    if (!text) setInput("");
    setReplyTo(null);
    setSending(false);
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const renderText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((p, i) =>
      p.startsWith("@") ? (
        <button key={i} onClick={() => navigate(`/u/${p.slice(1)}`)} className="text-red-400 font-bold hover:underline">{p}</button>
      ) : <span key={i}>{p}</span>
    );
  };

  return (
    <div className="bg-surface-1 border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <MessageCircle className="w-3.5 h-3.5 text-red-400" />
        <span className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-foreground" style={teko}>
          Live Chat
        </span>
        <span className="text-[9px] text-muted-foreground/50 font-bold">{messages.length}</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="h-72 overflow-y-auto px-3 py-2 space-y-1.5 relative">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30">
            <MessageCircle className="w-8 h-8 mb-2" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Be the first to chat</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group flex gap-2 ${msg.is_system ? "justify-center" : ""}`}
            >
              {msg.is_system ? (
                <span className="text-[10px] text-muted-foreground/40 italic">{msg.message_text}</span>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-surface-2 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                    {msg.avatar_url ? (
                      <img src={msg.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-bold text-foreground/50">{msg.username[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.reply_to_username && (
                      <div className="flex items-center gap-1 text-[8px] text-muted-foreground/40 mb-0.5">
                        <Reply className="w-2 h-2 rotate-180" />
                        <span>replying to <span className="font-bold">@{msg.reply_to_username}</span></span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1.5">
                      <button onClick={() => navigate(`/u/${msg.username}`)} className="text-[10px] font-bold text-foreground/80 hover:text-foreground hover:underline shrink-0">
                        {msg.username}
                      </button>
                      <span className="text-[8px] text-muted-foreground/30">{formatTime(msg.created_at)}</span>
                    </div>
                    {isGifUrl(msg.message_text) ? (
                      <img src={msg.message_text} alt="GIF" className="max-w-[180px] mt-1 rounded border border-white/[0.06]" loading="lazy" />
                    ) : (
                      <p className="text-[11px] text-foreground/70 break-words leading-relaxed">{renderText(msg.message_text)}</p>
                    )}
                  </div>
                  {user && (
                    <button
                      onClick={() => {
                        setReplyTo({ id: msg.id, username: msg.username, text: isGifUrl(msg.message_text) ? "GIF" : msg.message_text.slice(0, 50) });
                        inputRef.current?.focus();
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/20 hover:text-red-400 transition-all shrink-0"
                    >
                      <Reply className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {showScrollBtn && (
          <button onClick={scrollToBottom} className="sticky bottom-2 left-1/2 -translate-x-1/2 bg-red-500/80 backdrop-blur-sm text-white p-1.5 rounded-full shadow-lg z-10">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* GIF Picker */}
      {showGif && (
        <div className="border-t border-white/[0.06]">
          <GifPicker onSelect={(url) => { setShowGif(false); handleSend(url); }} onClose={() => setShowGif(false)} />
        </div>
      )}

      {/* Reply bar */}
      {replyTo && (
        <div className="px-3 py-1.5 bg-red-500/[0.06] border-t border-red-500/10 flex items-center gap-2">
          <Reply className="w-3 h-3 text-red-400 rotate-180 shrink-0" />
          <span className="text-[10px] text-muted-foreground truncate flex-1">
            Replying to <span className="font-bold text-red-400">@{replyTo.username}</span>
          </span>
          <button onClick={() => setReplyTo(null)} className="text-muted-foreground/40 hover:text-foreground">✕</button>
        </div>
      )}

      {/* Input */}
      {user ? (
        <div className="p-2 border-t border-white/[0.06] flex gap-2">
          <button
            onClick={() => setShowGif(!showGif)}
            className={`h-8 w-8 flex items-center justify-center shrink-0 rounded-lg border transition-colors ${
              showGif ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-surface-2 border-white/[0.06] text-muted-foreground/50 hover:text-foreground"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder={replyTo ? `Reply to @${replyTo.username}...` : "Say something..."}
            className="flex-1 h-8 px-3 text-xs bg-surface-2 border border-white/[0.06] rounded-lg text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-white/20"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="h-8 px-3 rounded-lg bg-red-500 text-white disabled:opacity-20 transition-all hover:bg-red-400 flex items-center justify-center"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="p-3 border-t border-white/[0.06] text-center">
          <button onClick={() => navigate("/start")} className="text-[11px] font-bold text-red-400 hover:underline">
            Sign in to chat
          </button>
        </div>
      )}
    </div>
  );
}
