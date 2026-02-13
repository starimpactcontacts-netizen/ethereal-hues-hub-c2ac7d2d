import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Swords } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuickFightMessages, type QuickFightMessage } from '@/hooks/useQuickFight';
import { toast } from 'sonner';

// Auto-text chips — the CORE viral mechanic
const AUTO_TEXTS = {
  trash: [
    "Yo wake up bro 👀",
    "You ready?",
    "No excuses this time.",
    "Try your best 😭",
    "This is gonna be easy 💀",
    "I'm not even trying rn",
  ],
  theme: [
    "Pick an anime?",
    "What song we running?",
    "Cartel aesthetic or clean?",
    "Let's do horror themed 🎃",
    "Slow motion only?",
  ],
  judge: [
    "Pick the judge",
    "Let the judge decide",
    "Any judge works",
  ],
};

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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const getColor = (userId: string) => {
    if (userId === player1Id) return 'text-red-400'; // RED
    if (userId === player2Id) return 'text-blue-400'; // BLUE
    return 'text-muted-foreground';
  };

  const getBorderColor = (userId: string) => {
    if (userId === player1Id) return 'border-red-500/50';
    if (userId === player2Id) return 'border-blue-500/50';
    return 'border-border';
  };

  const isMe = (userId: string) => userId === user?.id;

  return (
    <div className="bg-surface-1 border border-border overflow-hidden rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-1/80">
        <div className="flex items-center gap-2">
          <span className="text-red-400 font-display text-xs">{player1Username}</span>
          <span className="text-muted-foreground text-[10px]">vs</span>
          <span className="text-blue-400 font-display text-xs">{player2Username}</span>
        </div>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Battle Chat</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-52 overflow-y-auto p-3 space-y-1.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Swords className="w-6 h-6 mb-2 opacity-30" />
            <span className="text-[10px] uppercase tracking-wider">Use auto-text to start trash talking!</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.is_system ? 'justify-center' : isMe(msg.user_id) ? 'justify-end' : ''}`}
            >
              {msg.is_system ? (
                <span className="text-[10px] text-muted-foreground italic bg-surface-2 px-3 py-1 rounded-full">
                  {msg.message_text}
                </span>
              ) : isMe(msg.user_id) ? (
                <div className="max-w-[75%]">
                  <div className={`${user?.id === player1Id ? 'bg-red-500/20 border-red-500/30' : 'bg-blue-500/20 border-blue-500/30'} border rounded-lg px-3 py-1.5`}>
                    <p className="text-xs text-foreground">{msg.message_text}</p>
                  </div>
                  <span className="text-[8px] text-muted-foreground block text-right mt-0.5">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : (
                <div className="flex gap-2 max-w-[75%]">
                  <Avatar className={`w-6 h-6 shrink-0 border ${getBorderColor(msg.user_id)}`}>
                    <AvatarImage src={msg.avatar_url || ''} />
                    <AvatarFallback className="text-[8px] bg-surface-2">
                      {msg.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className={`text-[10px] font-bold ${getColor(msg.user_id)}`}>{msg.username}</span>
                    <div className={`${msg.user_id === player1Id ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'} border rounded-lg px-3 py-1.5 mt-0.5`}>
                      <p className="text-xs text-foreground">{msg.message_text}</p>
                    </div>
                    <span className="text-[8px] text-muted-foreground block mt-0.5">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Auto-Text Chips — THE KEY FEATURE */}
      {user && (
        <div className="border-t border-border">
          {/* Tab Selector */}
          <div className="flex border-b border-border/50">
            {(['trash', 'theme', 'judge'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setAutoTextTab(tab)}
                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                  autoTextTab === tab
                    ? 'text-foreground border-b-2 border-red-500'
                    : 'text-muted-foreground'
                }`}
              >
                {tab === 'trash' ? '🗣️ Talk' : tab === 'theme' ? '🎨 Theme' : '⚖️ Judge'}
              </button>
            ))}
          </div>

          {/* Chips */}
          <div className="px-3 py-2 flex flex-wrap gap-1.5">
            {AUTO_TEXTS[autoTextTab].map((text) => (
              <button
                key={text}
                onClick={() => sendMessage(text, true)}
                className="text-[11px] px-2.5 py-1 bg-surface-2 border border-border hover:border-red-500/50 hover:bg-red-500/10 rounded-full text-foreground/80 hover:text-foreground transition-all active:scale-95"
              >
                {text}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 pb-2 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Type a message..."
              className="flex-1 h-8 text-xs bg-background border-border"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              className="h-8 w-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

