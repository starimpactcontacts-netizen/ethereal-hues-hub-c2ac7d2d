import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PublicMessage {
  id: string;
  fight_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message_text: string;
  created_at: string;
}

interface Props {
  fightId: string;
  player1Id: string;
  player2Id: string;
}

/**
 * Public spectator chat — anyone (signed in) can comment on a live battle.
 * Separate from QuickFightChat which is participants-only.
 */
export default function QuickFightPublicChat({ fightId, player1Id, player2Id }: Props) {
  const { profile, user } = useAuth();
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fightId) return;
    const fetchMsgs = async () => {
      const { data } = await supabase
        .from('quick_fight_public_messages')
        .select('*')
        .eq('fight_id', fightId)
        .order('created_at', { ascending: true })
        .limit(300);
      if (data) setMessages(data as PublicMessage[]);
    };
    fetchMsgs();

    const channel = supabase
      .channel(`qf_public_${fightId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quick_fight_public_messages', filter: `fight_id=eq.${fightId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as PublicMessage]),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fightId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !profile || !user || sending) return;
    setSending(true);
    const { error } = await supabase.from('quick_fight_public_messages').insert({
      fight_id: fightId,
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      message_text: text.slice(0, 500),
    });
    if (error) toast.error('Failed to send');
    else setInput('');
    setSending(false);
  };

  const tagFor = (uid: string) =>
    uid === player1Id ? { label: 'RED', cls: 'text-red-400' } :
    uid === player2Id ? { label: 'BLUE', cls: 'text-blue-400' } : null;

  return (
    <div className="bg-surface-1 border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-1/80">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Public Chat</span>
        </div>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
          {messages.length} {messages.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-52 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="w-6 h-6 mb-2 opacity-30" />
            <span className="text-[10px] uppercase tracking-wider">Be the first to comment</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const tag = tagFor(m.user_id);
              const mine = m.user_id === user?.id;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <Avatar className="w-6 h-6 shrink-0 border border-border">
                    <AvatarImage src={m.avatar_url || ''} />
                    <AvatarFallback className="text-[8px] bg-surface-2">
                      {m.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold ${mine ? 'text-emerald-400' : 'text-foreground'}`}>
                        @{m.username}
                      </span>
                      {tag && (
                        <span className={`text-[8px] font-black uppercase tracking-wider ${tag.cls}`}>
                          {tag.label}
                        </span>
                      )}
                      <span className="text-[8px] text-muted-foreground ml-auto">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground break-words">{m.message_text}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      {user ? (
        <div className="border-t border-border px-3 py-2 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Add a public comment..."
            maxLength={500}
            className="flex-1 h-8 text-xs bg-background border-border"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="h-8 w-8 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="border-t border-border px-3 py-2 text-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Sign in to comment
          </span>
        </div>
      )}
    </div>
  );
}