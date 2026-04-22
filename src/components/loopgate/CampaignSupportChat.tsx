/**
 * Floating concierge chat for the Campaign Portal.
 * Premium minimalist design — iPhone 17 glass panel, emerald pulse on the
 * trigger, Loopgate-branded conversation with the AI concierge.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import loopgateLogo from '@/assets/loopgate-logo.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  campaignContext?: Record<string, unknown>;
}

const GREETING: Message = {
  role: 'assistant',
  content: "Welcome to Loopgate. I'm your concierge — ask me anything about this campaign's performance, CPM, or what's next.",
};

export default function CampaignSupportChat({ campaignContext }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('campaign-support-chat', {
        body: {
          messages: next.filter(m => m !== GREETING).map(m => ({ role: m.role, content: m.content })),
          campaignContext,
        },
      });
      if (error) throw error;
      const reply = data?.reply || data?.error || "Hmm, I couldn't reach our system. Try again in a moment.";
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. For urgent matters, email partnerships@loopgate.io.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            onClick={() => setOpen(true)}
            aria-label="Open concierge chat"
            className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[60] group"
          >
            {/* Ambient pulse */}
            <span className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl animate-pulse" />
            {/* Outer glass ring */}
            <span className="relative block w-14 h-14 rounded-full p-[1.5px] bg-gradient-to-br from-white/40 via-white/10 to-emerald-400/30 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              <span className="flex items-center justify-center w-full h-full rounded-full bg-neutral-950 border border-white/5">
                <MessageCircle size={20} className="text-emerald-300" strokeWidth={2.2} />
                {/* Specular highlight */}
                <span className="absolute -top-0.5 left-1/4 w-1/2 h-1/3 bg-white/30 blur-md rounded-full pointer-events-none" />
                {/* Live dot */}
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-neutral-950">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                </span>
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed z-[60] bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[380px] h-[min(560px,80vh)] flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-neutral-950/95 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-b from-neutral-900/80 to-neutral-950/80">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
                  <img src={loopgateLogo} alt="" className="w-5 h-5 object-contain" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-neutral-950" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-neutral-50 tracking-wide leading-tight">LOOPGATE CONCIERGE</p>
                  <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.2em] leading-tight">● Online</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-50 hover:bg-white/5 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-md shadow-md'
                        : 'bg-neutral-900 text-neutral-100 border border-white/5 rounded-bl-md'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_p]:leading-snug [&_a]:text-emerald-400 [&_strong]:text-white [&_ul]:my-1 [&_ol]:my-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-neutral-900 border border-white/5 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-2">
                    <Loader2 size={13} className="text-emerald-400 animate-spin" />
                    <span className="text-[12px] text-neutral-400">Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="px-3 py-3 border-t border-white/5 bg-neutral-950 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your campaign…"
                disabled={loading}
                className="flex-1 bg-neutral-900 border border-white/10 rounded-full px-4 py-2.5 text-[13px] text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <Send size={15} className="-ml-0.5" />
              </button>
            </form>

            <p className="px-4 pb-2 pt-0 text-[9px] text-neutral-600 text-center">
              For invoices or new campaigns: partnerships@loopgate.io
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}