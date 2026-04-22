/**
 * Floating support chat for the Campaign Portal.
 * Real human-to-human chat: client messages persist to the database,
 * Loopgate admins reply from the Ops panel. No AI, no email.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import loopgateLogo from '@/assets/loopgate-logo.png';

interface PortalMessage {
  id: string;
  campaign_id: string;
  sender_type: 'client' | 'admin';
  sender_name: string | null;
  message_text: string;
  created_at: string;
}

interface Props {
  campaignId: string;
  campaignName?: string;
  clientName?: string | null;
}

const NAME_KEY = (id: string) => `loopgate_portal_chat_name_${id}`;

export default function CampaignSupportChat({ campaignId, campaignName, clientName }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [name, setName] = useState<string>(() => {
    try { return localStorage.getItem(NAME_KEY(campaignId)) || clientName || ''; } catch { return clientName || ''; }
  });
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('campaign_portal_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (!cancelled && data) setMessages(data as PortalMessage[]);
    })();

    const channel = supabase
      .channel(`portal_chat_${campaignId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'campaign_portal_messages', filter: `campaign_id=eq.${campaignId}` },
        (payload) => {
          const msg = payload.new as PortalMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (!open && msg.sender_type === 'admin') setUnread((u) => u + 1);
        }
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [campaignId, open]);

  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => { if (open) setUnread(0); }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      try { localStorage.setItem(NAME_KEY(campaignId), name || ''); } catch {}
      const { error } = await supabase.from('campaign_portal_messages').insert({
        campaign_id: campaignId,
        sender_type: 'client',
        sender_name: name?.trim() || clientName || 'Client',
        message_text: text,
      });
      if (error) throw error;
      setInput('');
    } catch (err) {
      console.error('Failed to send portal message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            onClick={() => setOpen(true)}
            aria-label="Open support chat"
            className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[60] group"
          >
            <span className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl animate-pulse" />
            <span className="relative block w-14 h-14 rounded-full p-[1.5px] bg-gradient-to-br from-white/40 via-white/10 to-emerald-400/30 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              <span className="flex items-center justify-center w-full h-full rounded-full bg-neutral-950 border border-white/5">
                <MessageCircle size={20} className="text-emerald-300" strokeWidth={2.2} />
                <span className="absolute -top-0.5 left-1/4 w-1/2 h-1/3 bg-white/30 blur-md rounded-full pointer-events-none" />
                {unread > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-neutral-950">
                    {unread > 9 ? '9+' : unread}
                  </span>
                ) : (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-neutral-950">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                  </span>
                )}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

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
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-b from-neutral-900/80 to-neutral-950/80">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
                  <img src={loopgateLogo} alt="" className="w-5 h-5 object-contain" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-neutral-950" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-neutral-50 tracking-wide leading-tight">LOOPGATE TEAM</p>
                  <p className="text-[9px] text-neutral-400 font-bold leading-tight flex items-center gap-1">
                    <Clock size={8} className="text-emerald-400" />
                    Usually replies in 1–2 hrs
                  </p>
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

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-neutral-900 text-neutral-100 border border-white/5 rounded-2xl rounded-bl-md px-3.5 py-2.5">
                  <p className="text-[13px] leading-relaxed">
                    Hey{clientName ? ` ${clientName}` : ''} 👋 — drop a message about{' '}
                    <span className="font-bold text-emerald-300">{campaignName || 'your campaign'}</span> and someone from the Loopgate team will get back to you shortly.
                  </p>
                  <p className="mt-1.5 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Reply time: 1–2 hours</p>
                </div>
              </div>

              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.sender_type === 'client'
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-md shadow-md'
                        : 'bg-neutral-900 text-neutral-100 border border-white/5 rounded-bl-md'
                    }`}
                  >
                    {m.sender_type === 'admin' && (
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-0.5">
                        {m.sender_name || 'Loopgate'}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{m.message_text}</p>
                    <p className={`text-[9px] mt-1 ${m.sender_type === 'client' ? 'text-emerald-100/70' : 'text-neutral-500'}`}>
                      {formatTime(m.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="px-3 py-3 border-t border-white/5 bg-neutral-950 space-y-2"
            >
              {!clientName && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full bg-neutral-900 border border-white/10 rounded-full px-4 py-1.5 text-[11px] text-neutral-50 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/40 transition-all"
                />
              )}
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  disabled={sending}
                  className="flex-1 bg-neutral-900 border border-white/10 rounded-full px-4 py-2.5 text-[13px] text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  aria-label="Send"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  <Send size={15} className="-ml-0.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}