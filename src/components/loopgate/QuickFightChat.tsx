import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Swords, Image as ImageIcon, Flame } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuickFightMessages, type QuickFightMessage } from '@/hooks/useQuickFight';
import { toast } from 'sonner';
import GifPicker from './GifPicker';

// Auto-text chips — the CORE viral mechanic
const AUTO_TEXTS = {
  trash: [
    "Yo wake up bro 👀",
    "You ready?",
    "No excuses this time.",
    "Try your best 😭",
    "This is gonna be easy 💀",
    "I'm not even trying rn",
    "Bet.",
    "Loser posts first.",
    "Send your clip.",
    "Let's see who's stronger.",
  ],
  theme: [
    "Pick an anime?",
    "What song we running?",
    "Cartel aesthetic or clean?",
    "Let's do horror themed 🎃",
    "Slow motion only?",
    "Any anime??",
    "Romantic reggaeton 💘",
    "Random fight scene ⚔️",
    "Random mood 🎭",
    "Random song 🎵",
  ],
  judge: [
    "Pick the judge",
    "Let the judge decide",
    "Any judge works",
    "I'll pick the judge",
  ],
};

function isGifUrl(text: string): boolean {
  return /\.(gif|gifv)(\?|$)/i.test(text) || text.includes("tenor.com") || text.includes("giphy.com");
}

interface QuickFightChatProps {
  fightId: string;
  player1Id: string;
  player2Id: string;
  player1Username: string;
  player2Username: string;
}

export default function QuickFightChat({ fightId, player1Id, player2Id, player1Username, player2Username }: QuickFightChatProps) {
  const { profile, user } = useAuth();
  const { messages } = useQuickFightMessages(fightId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [autoTextTab, setAutoTextTab] = useState<'trash' | 'theme' | 'judge'>('trash');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isParticipant = !!user && (user.id === player1Id || user.id === player2Id);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string, isAutoText = false) => {
    if (!text.trim() || !profile || sending) return;
    setSending(true);
    const { error } = await supabase.from('quick_fight_messages').insert({
      fight_id: fightId,
      user_id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      message_text: text.trim(),
      is_auto_text: isAutoText,
    });
    if (error) toast.error('Failed to send');
    else setInput('');
    setSending(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    setShowGifPicker(false);
    sendMessage(gifUrl);
  };

  const getColor = (userId: string) => {
    if (userId === player1Id) return 'text-red-400';
    if (userId === player2Id) return 'text-blue-400';
    return 'text-zinc-300';
  };

  const getBorderColor = (userId: string) => {
    if (userId === player1Id) return 'border-red-500/50';
    if (userId === player2Id) return 'border-blue-500/50';
    return 'border-white/10';
  };

  const tagFor = (uid: string) =>
    uid === player1Id ? { label: 'RED', cls: 'bg-red-500/15 text-red-400 border-red-500/30' } :
    uid === player2Id ? { label: 'BLUE', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' } : null;

  const isMe = (userId: string) => userId === user?.id;

  return (
    <div className="bg-black border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]" style={{ fontFamily: 'Teko, sans-serif' }}>
            LIVE CHAT
          </span>
        </div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
          {messages.filter(m => !m.is_system).length} {messages.filter(m => !m.is_system).length === 1 ? 'msg' : 'msgs'}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-[420px] sm:h-[480px] overflow-y-auto p-3 space-y-1.5 bg-[#0a0a0a]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <Swords className="w-7 h-7 mb-2 opacity-40" />
            <span className="text-[10px] uppercase tracking-[0.2em]">Be the first to talk smack</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const tag = tagFor(msg.user_id);
            return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.is_system ? 'justify-center' : isMe(msg.user_id) ? 'justify-end' : ''}`}
            >
              {msg.is_system ? (
                <span className="text-[10px] text-zinc-400 italic bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                  {msg.message_text}
                </span>
              ) : isMe(msg.user_id) ? (
                <div className="max-w-[75%]">
                  <div className={`${tag ? (user?.id === player1Id ? 'bg-red-500/20 border-red-500/40' : 'bg-blue-500/20 border-blue-500/40') : 'bg-emerald-500/15 border-emerald-500/30'} border px-3 py-1.5 rounded-2xl rounded-tr-sm`}>
                    {isGifUrl(msg.message_text) ? (
                      <img src={msg.message_text} alt="GIF" className="w-[240px] max-w-full rounded-md" loading="lazy" />
                    ) : (
                      <p className="text-[13px] text-white leading-snug break-words">{msg.message_text}</p>
                    )}
                  </div>
                  <span className="text-[8px] text-zinc-500 block text-right mt-0.5">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : (
                <div className="flex gap-2 max-w-[75%]">
                  <Avatar className={`w-6 h-6 shrink-0 border ${getBorderColor(msg.user_id)}`}>
                    <AvatarImage src={msg.avatar_url || ''} />
                    <AvatarFallback className="text-[8px] bg-white/5 text-zinc-300">
                      {msg.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold ${getColor(msg.user_id)}`}>@{msg.username}</span>
                      {tag && (
                        <span className={`text-[7px] font-black uppercase tracking-[0.15em] px-1 py-px border ${tag.cls}`}>
                          {tag.label}
                        </span>
                      )}
                    </div>
                    <div className={`${tag ? (msg.user_id === player1Id ? 'bg-red-500/10 border-red-500/25' : 'bg-blue-500/10 border-blue-500/25') : 'bg-white/5 border-white/10'} border px-3 py-1.5 mt-0.5 rounded-2xl rounded-tl-sm`}>
                      {isGifUrl(msg.message_text) ? (
                        <img src={msg.message_text} alt="GIF" className="w-[240px] max-w-full rounded-md" loading="lazy" />
                      ) : (
                        <p className="text-[13px] text-white leading-snug break-words">{msg.message_text}</p>
                      )}
                    </div>
                    <span className="text-[8px] text-zinc-500 block mt-0.5">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* GIF Picker */}
      {showGifPicker && (
        <div className="border-t border-white/10">
          <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
        </div>
      )}

      {/* Auto-Text Chips — participants only (spectators just type) */}
      {user && isParticipant && (
        <div className="border-t border-white/10">
          <div className="flex border-b border-white/5">
            {(['trash', 'theme', 'judge'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setAutoTextTab(tab)}
                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                  autoTextTab === tab
                    ? 'text-white border-b-2 border-amber-400'
                    : 'text-zinc-500'
                }`}
              >
                {tab === 'trash' ? '🗣️ Talk' : tab === 'theme' ? '🎨 Theme' : '⚖️ Judge'}
              </button>
            ))}
          </div>
          <div className="px-3 py-2 flex flex-wrap gap-1.5">
            {AUTO_TEXTS[autoTextTab].map((text) => (
              <button
                key={text}
                onClick={() => sendMessage(text, true)}
                className="text-[11px] px-2.5 py-1 bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-amber-400/10 text-zinc-300 hover:text-white transition-all active:scale-95 rounded-full"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input — anyone signed in */}
      {user ? (
        <div className="border-t border-white/10 px-3 py-2 flex gap-2 bg-black">
          <button
            onClick={() => setShowGifPicker(!showGifPicker)}
            className={`h-9 w-9 flex items-center justify-center shrink-0 border rounded-lg transition-colors ${
              showGifPicker ? "bg-amber-400/20 border-amber-400/40 text-amber-400" : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder={isParticipant ? "Trash talk..." : "Hype the battle..."}
            maxLength={500}
            className="flex-1 h-9 text-[13px] bg-white/5 border-white/10 text-white rounded-lg placeholder:text-zinc-500"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="h-9 w-9 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black disabled:opacity-50 transition-colors rounded-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="border-t border-white/10 px-3 py-3 text-center bg-black">
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Sign in to join the chat</span>
        </div>
      )}
    </div>
  );
}
