import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Users, Lock, Image as ImageIcon, Reply } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

function isGifUrl(text: string): boolean {
  return /\.(gif|gifv)(\?|$)/i.test(text) || text.includes("tenor.com") || text.includes("giphy.com");
}

export default function BattleChat({ battleId, challengerId, opponentId, judgeId }: BattleChatProps) {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<BattleMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"public" | "private">("public");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, tab]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleReply = (msg: BattleMessage) => {
    const previewText = isGifUrl(msg.message_text) ? "GIF" : msg.message_text.slice(0, 60);
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
    const insertPayload: any = {
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

    const { error } = await supabase.from("battle_messages").insert(insertPayload);

    if (error) {
      toast.error("Failed to send message");
    } else {
      if (!text) setInput("");
      setReplyTo(null);
    }
    setSending(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    setShowGifPicker(false);
    handleSend(gifUrl);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getRoleBadge = (userId: string) => {
    if (userId === judgeId) return <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1">JUDGE</span>;
    if (userId === challengerId) return <span className="text-[8px] bg-red-500/20 text-red-400 px-1">RED</span>;
    if (userId === opponentId) return <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1">BLUE</span>;
    return null;
  };

  const getNameColor = (userId: string) => {
    if (userId === challengerId) return "text-red-400";
    if (userId === opponentId) return "text-sky-400";
    if (userId === judgeId) return "text-purple-400";
    return "text-foreground";
  };

  const renderMessageText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <button key={i} onClick={() => navigate(`/u/${username}`)} className="text-primary font-bold hover:underline">
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-black/40 border border-white/[0.07] overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-white/[0.06]">
        <button
          onClick={() => { setTab("public"); setReplyTo(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            tab === "public"
              ? "text-white/80 border-b-2 border-white/30"
              : "text-white/30 hover:text-white/50"
          }`}
        >
          <Users className="w-3 h-3" />
          Battle Chat
        </button>
        {isParticipant && (
          <button
            onClick={() => { setTab("private"); setReplyTo(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              tab === "private"
                ? "text-white/80 border-b-2 border-white/30"
                : "text-white/30 hover:text-white/50"
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
          {messages.map((msg) => {
            const isRed = msg.user_id === challengerId;
            const isBlue = msg.user_id === opponentId;
            const isRight = isBlue;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 group ${msg.is_system ? "justify-center" : isRight ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.is_system ? (
                  <span className="text-[10px] text-muted-foreground/50 italic px-2 py-0.5 text-center">
                    {msg.message_text}
                  </span>
                ) : (
                  <>
                    <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                      <AvatarImage src={msg.avatar_url || ""} />
                      <AvatarFallback className={`text-[8px] ${isRed ? "bg-red-900/60 text-red-300" : isBlue ? "bg-blue-900/60 text-blue-300" : "bg-white/10 text-white/60"}`}>
                        {msg.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`min-w-0 max-w-[72%] flex flex-col ${isRight ? "items-end" : "items-start"}`}>
                      {/* Reply context */}
                      {msg.reply_to_username && (
                        <div className={`flex items-center gap-1 text-[9px] text-muted-foreground/40 mb-0.5 ${isRight ? "flex-row-reverse" : ""}`}>
                          <Reply className="w-2.5 h-2.5 rotate-180" />
                          <span>@{msg.reply_to_username}</span>
                        </div>
                      )}
                      {/* Name + badge + time */}
                      <div className={`flex items-center gap-1 mb-0.5 ${isRight ? "flex-row-reverse" : ""}`}>
                        <button
                          onClick={() => handleMention(msg.username)}
                          className={`text-[10px] font-bold ${getNameColor(msg.user_id)} hover:underline`}
                        >
                          {msg.username}
                        </button>
                        {getRoleBadge(msg.user_id)}
                        <span className="text-[8px] text-muted-foreground/40">{formatTime(msg.created_at)}</span>
                      </div>
                      {/* Bubble */}
                      <div className="relative">
                        {isGifUrl(msg.message_text) ? (
                          <img
                            src={msg.message_text}
                            alt="GIF"
                            className="max-w-[160px] rounded-[8px]"
                            loading="lazy"
                          />
                        ) : (
                          <p className={`text-xs px-2.5 py-1.5 rounded-[10px] break-words leading-relaxed ${
                            isRed
                              ? "bg-red-500/[0.12] text-white/85 rounded-tl-[3px]"
                              : isBlue
                              ? "bg-blue-500/[0.12] text-white/85 rounded-tr-[3px]"
                              : "bg-white/[0.06] text-white/70"
                          }`}>
                            {renderMessageText(msg.message_text)}
                          </p>
                        )}
                        {user && (
                          <button
                            onClick={() => handleReply(msg)}
                            className={`absolute top-0 ${isRight ? "-left-5" : "-right-5"} opacity-0 group-hover:opacity-100 active:opacity-100 p-0.5 text-muted-foreground/30 hover:text-white/60 transition-all`}
                          >
                            <Reply className="w-3 h-3 rotate-180" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* GIF Picker */}
      {showGifPicker && (
        <div className="border-t border-border">
          <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
        </div>
      )}

      {/* Reply bar + Input */}
      {user && (tab === "public" || isParticipant) && (
        <div className="border-t border-white/[0.06]">
          {replyTo && (
            <ChatReplyBar
              username={replyTo.username}
              text={replyTo.text}
              onClear={() => setReplyTo(null)}
              accentColor={tab === "public" ? "red" : "purple"}
            />
          )}
          <div className="p-2 flex gap-1.5">
            <button
              onClick={() => setShowGifPicker(!showGifPicker)}
              className={`h-8 w-8 flex items-center justify-center shrink-0 rounded-[6px] transition-colors ${
                showGifPicker ? "bg-white/10 text-white/80" : "bg-white/[0.05] text-white/30 hover:text-white/60"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={replyTo ? `Reply to @${replyTo.username}...` : (tab === "public" ? "Say something..." : "Fighter chat...")}
              className="flex-1 h-8 text-xs bg-white/[0.05] border-white/[0.07] text-white placeholder:text-white/25 rounded-[6px]"
            />
            <Button
              size="sm"
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="h-8 px-3 bg-white/10 hover:bg-white/15 text-white/80 rounded-[6px]"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
