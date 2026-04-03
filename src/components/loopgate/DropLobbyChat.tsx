import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, Image as ImageIcon, Info, X, ChevronDown, Reply } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GifPicker from "./GifPicker";
import ChatReplyBar from "./ChatReplyBar";

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
    const previewText = isGifUrl(msg.message_text) ? "GIF" : msg.message_text.slice(0, 60);
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

  // Render @mentions as tappable
  const renderMessageText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <button
            key={i}
            onClick={() => navigate(`/u/${username}`)}
            className="text-primary font-bold hover:underline"
          >
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="relative overflow-hidden flex flex-col border-2 border-foreground/[0.06]">
      <div className="h-[2px] bg-gradient-to-r from-red-500/60 via-red-500 to-red-500/60" />

      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between bg-gradient-to-r from-red-950/40 via-background to-background">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle className="w-4 h-4 text-red-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <span className="font-bold text-xs text-foreground uppercase tracking-[0.2em]" style={{ fontFamily: 'Teko, sans-serif', fontSize: '16px' }}>
            Live Chat
          </span>
          {messages.length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-black rounded-sm">
              {messages.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-6 h-6 flex items-center justify-center text-foreground/30 hover:text-red-400 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-foreground/[0.06]"
          >
            <div className="px-3 py-3 bg-red-950/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">What is this?</span>
                <button onClick={() => setShowInfo(false)} className="text-foreground/30 hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-foreground/60 leading-relaxed">
                This is the <span className="text-red-400 font-bold">Official Event lobby</span>. 
                Talk trash, hype up your edit, react to others' submissions, and vibe with the community.
                Messages are live and visible to everyone in this event.
              </p>
              <p className="text-[10px] text-foreground/30 leading-relaxed">
                Tap a username to @mention them. Swipe a message to reply. 🔥
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-[280px] sm:h-64 overflow-y-auto p-2 space-y-1 bg-background/80 relative"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-red-500/30" />
            </div>
            <p className="text-[11px] text-foreground/30 font-bold uppercase tracking-wider">No messages yet</p>
            <p className="text-[9px] text-foreground/15">Be the first to talk in this lobby</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex items-start gap-1.5 py-0.5 group ${msg.is_system ? 'justify-center' : ''}`}
              >
                {msg.is_system ? (
                  <p className="text-[10px] text-foreground/25 italic text-center">{msg.message_text}</p>
                ) : (
                  <>
                    <button
                      onClick={() => navigate(`/u/${msg.username}`)}
                      className="w-6 h-6 rounded-full bg-surface-2 overflow-hidden shrink-0 mt-0.5 hover:ring-1 hover:ring-red-500/40 transition-all"
                    >
                      {msg.avatar_url ? (
                        <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-foreground/40">
                          {msg.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      {/* Reply context */}
                      {msg.reply_to_username && (
                        <div className="flex items-center gap-1 text-[9px] text-foreground/30 mb-0.5">
                          <Reply className="w-2.5 h-2.5 rotate-180" />
                          <span>replying to</span>
                          <button
                            onClick={() => navigate(`/u/${msg.reply_to_username}`)}
                            className="font-bold text-red-400/60 hover:text-red-400"
                          >
                            @{msg.reply_to_username}
                          </button>
                          {msg.reply_to_text && (
                            <span className="truncate max-w-[120px] text-foreground/20">"{msg.reply_to_text}"</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-start gap-1">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleMention(msg.username)}
                            className="text-[10px] font-black text-red-400 hover:text-red-300 mr-1.5 uppercase tracking-wide transition-colors"
                          >
                            {msg.username}
                          </button>
                          {isGifUrl(msg.message_text) ? (
                            <div className="mt-0.5">
                              <img
                                src={msg.message_text}
                                alt="GIF"
                                className="max-w-[180px] max-h-[120px] rounded-sm object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <span className="text-[12px] text-foreground/80 break-words leading-snug">
                              {renderMessageText(msg.message_text)}
                            </span>
                          )}
                        </div>
                        {/* Reply button */}
                        {user && (
                          <button
                            onClick={() => handleReply(msg)}
                            className="opacity-0 group-hover:opacity-100 active:opacity-100 p-1 text-foreground/20 hover:text-red-400 transition-all shrink-0 touch-manipulation"
                            title="Reply"
                          >
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
        )}
        <div ref={messagesEndRef} />

        {!isAtBottom && newCount > 0 && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-red-500/30 z-10"
          >
            <ChevronDown className="w-3 h-3" /> {newCount} new
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
            className="overflow-hidden border-t border-foreground/[0.06]"
          >
            <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply bar + Quick chips + input */}
      {user ? (
        <div className="border-t border-foreground/[0.06] bg-background">
          {/* Reply indicator */}
          {replyTo && (
            <ChatReplyBar
              username={replyTo.username}
              text={replyTo.text}
              onClear={() => setReplyTo(null)}
              accentColor="red"
            />
          )}

          {/* Quick reaction chips */}
          <div className="px-2 pt-2 pb-1 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 bg-foreground/[0.05] hover:bg-red-500/20 border border-foreground/[0.08] hover:border-red-500/30 text-[11px] font-bold text-foreground/50 hover:text-red-400 transition-all active:scale-95 touch-manipulation"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input row */}
          <form onSubmit={handleSend} className="px-2 pb-2 flex gap-1.5 items-center">
            <button
              type="button"
              onClick={() => setShowGifPicker(!showGifPicker)}
              className={`w-9 h-9 shrink-0 flex items-center justify-center border transition-all touch-manipulation ${
                showGifPicker
                  ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : "bg-foreground/[0.04] border-foreground/[0.08] text-foreground/30 hover:text-foreground/60"
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
              className="flex-1 bg-foreground/[0.04] border border-foreground/[0.08] px-3 py-2 text-[13px] text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-red-500/30 transition-colors"
              maxLength={300}
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="w-9 h-9 shrink-0 flex items-center justify-center bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white transition-all touch-manipulation active:scale-95"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      ) : (
        <div className="border-t border-foreground/[0.06] p-3 text-center bg-background">
          <button
            onClick={() => navigate('/start')}
            className="text-[11px] text-red-400 font-bold hover:underline uppercase tracking-wider"
          >
            Sign in to join the chat →
          </button>
        </div>
      )}
    </div>
  );
}
