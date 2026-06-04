import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Lock, Reply, Flame, Camera, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import GifPicker from "./GifPicker";
import ChatReplyBar from "./ChatReplyBar";
import { useNavigate } from "react-router-dom";

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
  reply_to_id: string | null;
  reply_to_username: string | null;
  reply_to_text: string | null;
}

interface BattleChatProps {
  battleId: string;
  challengerId: string;
  opponentId: string | null;
  judgeId: string | null;
}

function isMediaUrl(text: string): boolean {
  return (
    /\.(jpg|jpeg|png|webp|gif|gifv)(\?|$)/i.test(text) ||
    text.includes("tenor.com") ||
    text.includes("giphy.com") ||
    text.includes(".supabase.co/storage")
  );
}

export default function BattleChat({ battleId, challengerId, opponentId, judgeId }: BattleChatProps) {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<BattleMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"public" | "private">("public");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isParticipant = user?.id === challengerId || user?.id === opponentId || user?.id === judgeId;

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

    return () => { supabase.removeChannel(channel); };
  }, [battleId, tab]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleReply = (msg: BattleMessage) => {
    const previewText = isMediaUrl(msg.message_text) ? "📷 Photo" : msg.message_text.slice(0, 60);
    setReplyTo({ id: msg.id, username: msg.username, text: previewText });
    inputRef.current?.focus();
  };

  const handleMention = (username: string) => {
    setInput(prev => prev + `@${username} `);
    inputRef.current?.focus();
  };

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || !profile || sending) return;

    setSending(true);
    const insertPayload: Record<string, unknown> = {
      battle_id: battleId,
      user_id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      message_text: msgText,
      is_public: tab === "public",
    };
    if (replyTo) {
      insertPayload.reply_to_id = replyTo.id;
      insertPayload.reply_to_username = replyTo.username;
      insertPayload.reply_to_text = replyTo.text;
    }

    const { error } = await supabase.from("battle_messages").insert(insertPayload as any);
    if (error) {
      toast.error("Failed to send message");
    } else {
      if (!text) setInput("");
      setReplyTo(null);
    }
    setSending(false);
  };

  const handleImageUpload = async (file: File) => {
    if (!profile) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8 MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${battleId}/${Date.now()}-${profile.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("battle-chat-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (uploadError) {
      toast.error("Failed to upload photo");
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("battle-chat-images").getPublicUrl(path);
    await handleSend(publicUrl);
    setUploading(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    setShowGifPicker(false);
    handleSend(gifUrl);
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getNameColor = (userId: string) => {
    if (userId === challengerId) return "text-red-400";
    if (userId === opponentId) return "text-[#38bdf8]";
    if (userId === judgeId) return "text-purple-400";
    return "text-white/60";
  };

  const getBadge = (userId: string) => {
    if (userId === judgeId)
      return <span className="text-[8px] font-bold tracking-widest text-purple-400/70 uppercase">JUDGE</span>;
    if (userId === challengerId)
      return <span className="text-[8px] font-bold tracking-widest text-red-400/70 uppercase">RED</span>;
    if (userId === opponentId)
      return <span className="text-[8px] font-bold tracking-widest text-sky-400/70 uppercase">BLUE</span>;
    return null;
  };

  const renderText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const uname = part.slice(1);
        return (
          <button key={i} onClick={() => navigate(`/u/${uname}`)} className="text-[#D4A857] font-semibold hover:underline">
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ background: "rgba(8,8,10,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Tabs */}
      <div className="flex shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => { setTab("public"); setReplyTo(null); }}
          className={`flex-1 relative flex items-center justify-center gap-1.5 py-3 text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${
            tab === "public" ? "text-white" : "text-white/25 hover:text-white/40"
          }`}
        >
          <Flame className="w-3 h-3" />
          Battle Chat
          {tab === "public" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D4A857]" />
          )}
        </button>
        {isParticipant && (
          <button
            onClick={() => { setTab("private"); setReplyTo(null); }}
            className={`flex-1 relative flex items-center justify-center gap-1.5 py-3 text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${
              tab === "private" ? "text-white" : "text-white/25 hover:text-white/40"
            }`}
          >
            <Lock className="w-3 h-3" />
            Fighter Chat
            {tab === "private" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-400" />
            )}
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 h-64 overflow-y-auto py-2" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <MessageSquare className="w-5 h-5 text-white/10" />
            <span className="text-[10px] text-white/20 uppercase tracking-widest">
              {tab === "public" ? "Hype the battle" : "Fighters only"}
            </span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isRed = msg.user_id === challengerId;
            const isBlue = msg.user_id === opponentId;

            if (msg.is_system) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-4 py-1.5"
                >
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                  <span className="text-[9px] text-white/20 uppercase tracking-widest shrink-0">{msg.message_text}</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="group flex items-start gap-3.5 px-4 py-3 hover:bg-white/[0.02] transition-colors relative"
                style={{
                  borderLeft: isRed
                    ? "2px solid rgba(239,68,68,0.35)"
                    : isBlue
                    ? "2px solid rgba(56,189,248,0.35)"
                    : "2px solid transparent",
                }}
              >
                {/* Avatar */}
                <div
                  className="w-[44px] h-[44px] rounded-full shrink-0 mt-[1px] overflow-hidden flex items-center justify-center text-[13px] font-bold"
                  style={{
                    background: isRed
                      ? "rgba(239,68,68,0.15)"
                      : isBlue
                      ? "rgba(56,189,248,0.15)"
                      : "rgba(255,255,255,0.08)",
                    color: isRed ? "#f87171" : isBlue ? "#38bdf8" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {msg.avatar_url ? (
                    <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    msg.username[0].toUpperCase()
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Reply context */}
                  {msg.reply_to_username && (
                    <div className="flex items-center gap-1 mb-1 text-[12px] text-white/20 leading-none">
                      <Reply className="w-3.5 h-3.5 rotate-180 shrink-0" />
                      <span className="truncate">@{msg.reply_to_username}: {msg.reply_to_text}</span>
                    </div>
                  )}

                  {/* Name line */}
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <button
                      onClick={() => handleMention(msg.username)}
                      className={`text-[15px] font-bold leading-none hover:underline ${getNameColor(msg.user_id)}`}
                    >
                      @{msg.username}
                    </button>
                    {getBadge(msg.user_id)}
                    <span className="text-[12px] text-white/15 leading-none">{formatTime(msg.created_at)}</span>
                  </div>

                  {/* Message / media */}
                  {isMediaUrl(msg.message_text) ? (
                    <img
                      src={msg.message_text}
                      alt=""
                      className="mt-1 rounded-[6px] max-w-[200px] max-h-[160px] object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <p className="text-[18px] text-white/80 break-words leading-snug">
                      {renderText(msg.message_text)}
                    </p>
                  )}
                </div>

                {/* Reply button on hover */}
                {user && (
                  <button
                    onClick={() => handleReply(msg)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/20 hover:text-white/50"
                  >
                    <Reply className="w-3 h-3 rotate-180" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* GIF Picker */}
      {showGifPicker && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
        </div>
      )}

      {/* Input area */}
      {user && (tab === "public" || isParticipant) ? (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {replyTo && (
            <ChatReplyBar
              username={replyTo.username}
              text={replyTo.text}
              onClear={() => setReplyTo(null)}
              accentColor={tab === "public" ? "red" : "purple"}
            />
          )}
          <div className="flex items-center gap-1.5 p-2">
            {/* Photo upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || sending}
              className="h-8 w-8 shrink-0 rounded-[6px] flex items-center justify-center transition-colors text-white/25 hover:text-white/60 disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            {/* GIF */}
            <button
              type="button"
              onClick={() => setShowGifPicker(!showGifPicker)}
              className={`h-8 px-2 shrink-0 rounded-[6px] text-[9px] font-black tracking-widest transition-colors ${
                showGifPicker ? "text-[#D4A857] bg-[#D4A857]/10" : "text-white/20 hover:text-white/50"
              }`}
              style={{ background: showGifPicker ? undefined : "rgba(255,255,255,0.05)" }}
            >
              GIF
            </button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={replyTo ? `↩ @${replyTo.username}` : "Hype the battle..."}
              className="flex-1 h-8 text-[12px] text-white placeholder:text-white/20 border-0 rounded-[6px] focus-visible:ring-0"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="h-8 w-8 shrink-0 rounded-[6px] flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ background: "rgba(212,168,87,0.9)" }}
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <Send className="w-3.5 h-3.5 text-black" />}
            </button>
          </div>
        </div>
      ) : !user ? (
        <div className="p-3 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => navigate("/login")}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            Sign in to join the chat
          </button>
        </div>
      ) : null}
    </div>
  );
}
