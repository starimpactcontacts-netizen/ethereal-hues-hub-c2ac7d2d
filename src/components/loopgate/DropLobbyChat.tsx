import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, Image as ImageIcon, Info, X, ChevronDown, Reply } from "lucide-react";
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

interface DropLobbyChatProps {
  dropId: string;
  accentColor?: string;
}

function isGifUrl(text: string): boolean {
  return /\.(gif|gifv)(\?|$)/i.test(text) || text.includes("tenor.com") || text.includes("giphy.com") || text.includes("media.tenor");
}

const QUICK_CHIPS = ["🔥", "W", "💀", "GG", "nah", "😭", "goated"];

export default function DropLobbyChat({ dropId }: DropLobbyChatProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dropId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('featured_drop_messages' as any)
        .select('*')
        .eq('drop_id', dropId)
        .order('created_at', { ascending: true })
        .limit(200);

      setMessages((data as unknown as Message[]) || []);
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`drop-chat-${dropId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'featured_drop_messages',
        filter: `drop_id=eq.${dropId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        if (!isAtBottom) setNewCount(c => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dropId]);

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setNewCount(0);
    }
  }, [messages, isAtBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setIsAtBottom(atBottom);
    if (atBottom) setNewCount(0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewCount(0);
  };

  const handleReply = (msg: Message) => {
    const previewText = isGifUrl(msg.message_text) ? "GIF" : msg.message_text.slice(0, 80);
    setReplyTo({ id: msg.id, username: msg.username, text: previewText });
    inputRef.current?.focus();
  };

  const handleMention = (username: string) => {
    setNewMessage(prev => prev + `@${username} `);
    inputRef.current?.focus();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !user || !profile) return;
    setIsSending(true);

    const insertPayload: any = {
      drop_id: dropId,
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      message_text: text.trim(),
    };

    if (replyTo) {
      insertPayload.reply_to_id = replyTo.id;
      insertPayload.reply_to_username = replyTo.username;
      insertPayload.reply_to_text = replyTo.text;
    }

    await supabase
      .from('featured_drop_messages' as any)
      .insert(insertPayload);

    setNewMessage("");
    setReplyTo(null);
    setIsSending(false);
    setShowGifPicker(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const handleGifSelect = (gifUrl: string) => {
    sendMessage(gifUrl);
  };

  const renderMessageText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <button
            key={i}
            onClick={() => navigate(`/u/${username}`)}
            className="text-red-400 font-semibold hover:underline"
          >
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="relative overflow-hidden flex flex-col rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-red-400" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-card animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">Live Chat</h3>
            <p className="text-[10px] text-muted-foreground">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Info panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-muted/30 border-b border-border/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground">About this chat</span>
                <button onClick={() => setShowInfo(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                King of the Hill lobby — talk trash, hype your edit, and vibe with the community. 
                Tap a name to @mention. Tap the arrow to reply.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-[300px] sm:h-72 overflow-y-auto px-3 py-3 space-y-3 relative"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground/60">No messages yet</p>
              <p className="text-[11px] text-muted-foreground/40 mt-0.5">Be the first to say something</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.user_id === user?.id;

              if (msg.is_system) {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center py-1"
                  >
                    <span className="text-[10px] text-muted-foreground/50 bg-muted/30 px-3 py-1 rounded-full">
                      {msg.message_text}
                    </span>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="group"
                >
                  <div className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <button
                      onClick={() => navigate(`/u/${msg.username}`)}
                      className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-muted/50 hover:ring-2 hover:ring-red-500/30 transition-all"
                    >
                      {msg.avatar_url ? (
                        <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                          {msg.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </button>

                    {/* Bubble */}
                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Name + time */}
                      <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <button
                          onClick={() => handleMention(msg.username)}
                          className="text-[11px] font-bold text-foreground hover:text-red-400 transition-colors"
                        >
                          {msg.username}
                        </button>
                        <span className="text-[9px] text-muted-foreground/50">{formatTime(msg.created_at)}</span>
                      </div>

                      {/* Reply context */}
                      {msg.reply_to_username && (
                        <div className={`flex items-start gap-1.5 mb-1.5 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/30 max-w-full ${isOwn ? 'self-end' : 'self-start'}`}>
                          <Reply className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5 rotate-180" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-red-400/70">@{msg.reply_to_username}</span>
                            {msg.reply_to_text && (
                              <p className="text-[10px] text-muted-foreground/50 truncate">{msg.reply_to_text}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Message content */}
                      <div className={`rounded-2xl px-3.5 py-2 ${
                        isOwn
                          ? 'bg-red-500 text-white rounded-br-md'
                          : 'bg-muted/50 text-foreground rounded-bl-md'
                      }`}>
                        {isGifUrl(msg.message_text) ? (
                          <img
                            src={msg.message_text}
                            alt="GIF"
                            className="max-w-[200px] max-h-[150px] rounded-lg object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <p className="text-[13px] leading-relaxed break-words">
                            {renderMessageText(msg.message_text)}
                          </p>
                        )}
                      </div>

                      {/* Reply action */}
                      {user && (
                        <button
                          onClick={() => handleReply(msg)}
                          className={`opacity-0 group-hover:opacity-100 active:opacity-100 flex items-center gap-1 mt-0.5 px-2 py-0.5 text-[9px] text-muted-foreground/40 hover:text-red-400 transition-all touch-manipulation ${isOwn ? 'self-end' : 'self-start'}`}
                        >
                          <Reply className="w-2.5 h-2.5 rotate-180" />
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />

        {/* New messages indicator */}
        {!isAtBottom && newCount > 0 && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[11px] font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-red-500/20 z-10"
          >
            <ChevronDown className="w-3.5 h-3.5" /> {newCount} new
          </button>
        )}
      </div>

      {/* GIF Picker */}
      <AnimatePresence>
        {showGifPicker && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 280 }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border/30"
          >
            <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply bar + Chips + Input */}
      {user ? (
        <div className="border-t border-border/30">
          {/* Reply indicator */}
          {replyTo && (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border-b border-border/20">
              <Reply className="w-3.5 h-3.5 text-red-400 shrink-0 rotate-180" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-red-400">@{replyTo.username}</span>
                <p className="text-[10px] text-muted-foreground/60 truncate">{replyTo.text}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick chips */}
          <div className="px-3 pt-2.5 pb-1 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                disabled={isSending}
                className="shrink-0 px-3 py-1 bg-muted/40 hover:bg-red-500/15 rounded-full text-[12px] font-medium text-muted-foreground hover:text-red-400 transition-all active:scale-95 touch-manipulation"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="px-3 pb-3 pt-1.5 flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setShowGifPicker(!showGifPicker)}
              className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all touch-manipulation ${
                showGifPicker
                  ? "bg-red-500/20 text-red-400"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyTo ? `Reply to @${replyTo.username}...` : "Say something..."}
              className="flex-1 bg-muted/30 rounded-full px-4 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
              maxLength={300}
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-400 disabled:opacity-30 disabled:hover:bg-red-500 text-white transition-all touch-manipulation active:scale-95"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      ) : (
        <div className="border-t border-border/30 p-4 text-center">
          <button
            onClick={() => navigate('/start')}
            className="text-[12px] text-red-400 font-semibold hover:underline"
          >
            Sign in to join the chat →
          </button>
        </div>
      )}
    </div>
  );
}
