import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, Info, X, Reply } from "lucide-react";
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

interface MissionLobbyChatProps {
  missionId: string;
}

function isGifUrl(text: string): boolean {
  return /\.(gif|gifv)(\?|$)/i.test(text) || text.includes("tenor.com") || text.includes("giphy.com") || text.includes("media.tenor");
}

const QUICK_CHIPS = ["🔥", "W", "💀", "GG", "nah", "😭", "goated"];

export default function MissionLobbyChat({ missionId }: MissionLobbyChatProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!missionId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('commission_messages' as any)
        .select('*')
        .eq('commission_id', missionId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (data) setMessages(data as any);
      setLoading(false);
    };
    fetchMessages();

    const channel = supabase.channel(`mission-chat-${missionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'commission_messages',
        filter: `commission_id=eq.${missionId}`
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (!isAtBottom) setNewCount(c => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [missionId]);

  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setNewCount(0);
    }
  }, [messages, isAtBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setIsAtBottom(atBottom);
    if (atBottom) setNewCount(0);
  };

  const handleSend = async (text?: string) => {
    const msg = (text || newMessage).trim();
    if (!msg || isSending || !user || !profile) return;

    setIsSending(true);
    const insertPayload: any = {
      commission_id: missionId,
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      message_text: msg,
      is_system: false,
      reply_to_id: replyTo?.id || null,
      reply_to_username: replyTo?.username || null,
      reply_to_text: replyTo?.text || null,
    };

    await supabase.from('commission_messages' as any).insert(insertPayload);
    if (!text) setNewMessage("");
    setReplyTo(null);
    setIsSending(false);
    inputRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewCount(0);
    setIsAtBottom(true);
  };

  return (
    <div className="bg-surface-1 border border-border overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold text-foreground">Mission Chat</span>
          <span className="text-[10px] text-muted-foreground">({messages.length})</span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-[200px] overflow-y-auto px-3 py-2 space-y-2 scrollbar-hide"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <MessageCircle className="w-5 h-5 text-muted-foreground/30" />
            <p className="text-[10px] text-muted-foreground/50">No messages yet — start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            const isGif = isGifUrl(msg.message_text);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Reply context */}
                  {msg.reply_to_username && (
                    <div className="flex items-center gap-1 mb-0.5 px-1">
                      <Reply className="w-2.5 h-2.5 text-muted-foreground/40 rotate-180" />
                      <span className="text-[8px] text-muted-foreground/50 truncate max-w-[120px]">
                        @{msg.reply_to_username}: {msg.reply_to_text}
                      </span>
                    </div>
                  )}

                  <div className="flex items-end gap-1.5">
                    {!isMe && (
                      <button onClick={() => navigate(`/editor/${msg.user_id}`)} className="shrink-0">
                        {msg.avatar_url ? (
                          <img src={msg.avatar_url} className="w-5 h-5 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[8px] font-bold text-foreground">
                            {msg.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </button>
                    )}

                    <div>
                      {!isMe && (
                        <button
                          onClick={() => navigate(`/editor/${msg.user_id}`)}
                          className="text-[8px] font-bold text-muted-foreground mb-0.5 ml-1 hover:text-foreground transition-colors"
                        >
                          {msg.username}
                        </button>
                      )}
                      <button
                        onClick={() => setReplyTo({ id: msg.id, username: msg.username, text: msg.message_text.slice(0, 40) })}
                        className={`block text-left px-2.5 py-1.5 text-[11px] leading-relaxed transition-all ${
                          isMe
                            ? 'bg-red-600 text-white rounded-t-xl rounded-bl-xl'
                            : 'bg-surface-2 text-foreground rounded-t-xl rounded-br-xl'
                        }`}
                      >
                        {isGif ? (
                          <img src={msg.message_text} alt="GIF" className="max-w-[160px] max-h-[120px] rounded-lg" loading="lazy" />
                        ) : (
                          msg.message_text
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* New messages indicator */}
      <AnimatePresence>
        {newCount > 0 && !isAtBottom && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={scrollToBottom}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg"
          >
            ↓ {newCount} new
          </motion.button>
        )}
      </AnimatePresence>

      {/* Reply bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-border">
            <div className="px-3 py-1.5 bg-surface-2 flex items-center gap-2">
              <Reply className="w-3 h-3 text-emerald-400 rotate-180 shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate flex-1">Replying to <strong>@{replyTo.username}</strong></span>
              <button onClick={() => setReplyTo(null)} className="shrink-0"><X className="w-3 h-3 text-muted-foreground" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick chips */}
      {user && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-t border-border overflow-x-auto scrollbar-hide">
          {QUICK_CHIPS.map(chip => (
            <button key={chip} onClick={() => handleSend(chip)}
              className="shrink-0 px-2 py-0.5 bg-surface-2 hover:bg-surface-1 text-[11px] rounded-full transition-colors">
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {user ? (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Say something..."
            className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!newMessage.trim() || isSending}
            className="p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-30 transition-colors"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <div className="px-3 py-2.5 border-t border-border text-center">
          <button onClick={() => navigate('/start')} className="text-[11px] text-emerald-400 font-bold hover:underline">
            Sign in to chat
          </button>
        </div>
      )}
    </div>
  );
}
