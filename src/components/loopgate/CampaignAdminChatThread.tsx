/**
 * Admin-side chat thread for a single campaign portal conversation.
 * Shown in CampaignAdminPage to let staff reply to client messages.
 */

import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PortalMessage {
  id: string;
  campaign_id: string;
  sender_type: 'client' | 'admin';
  sender_name: string | null;
  message_text: string;
  created_at: string;
}

export default function CampaignAdminChatThread({ campaignId }: { campaignId: string }) {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [adminName, setAdminName] = useState('Loopgate');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userData.user.id)
          .maybeSingle();
        if (!cancelled && profile?.username) setAdminName(profile.username);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
      .channel(`admin_portal_chat_${campaignId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'campaign_portal_messages', filter: `campaign_id=eq.${campaignId}` },
        (payload) => {
          const msg = payload.new as PortalMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [campaignId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from('campaign_portal_messages').insert({
        campaign_id: campaignId,
        sender_type: 'admin',
        sender_name: adminName,
        message_text: text,
      });
      if (error) throw error;
      setInput('');
    } catch (err) {
      console.error('Admin reply failed:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message? This cannot be undone.')) return;
    const prev = messages;
    setMessages((m) => m.filter((x) => x.id !== id));
    const { error } = await supabase.from('campaign_portal_messages').delete().eq('id', id);
    if (error) {
      console.error('Admin delete failed:', error);
      setMessages(prev);
    }
  };

  const unreadFromClient = messages.filter((m) => m.sender_type === 'client').length;

  return (
    <div className="border-t border-border/20 bg-background/30">
      <div className="px-4 py-2.5 border-b border-border/20 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-bold flex items-center gap-1.5">
          <MessageCircle className="w-3 h-3 text-emerald-400" /> Client Chat
        </p>
        <span className="text-[8px] text-muted-foreground/60 font-mono">
          {messages.length} message{messages.length === 1 ? '' : 's'} · {unreadFromClient} from client
        </span>
      </div>

      <div ref={scrollRef} className="max-h-64 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 italic text-center py-4">No messages yet — when the client sends one, it will show up here.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`group flex items-end gap-1.5 ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
              {m.sender_type === 'admin' && (
                <button
                  onClick={() => deleteMessage(m.id)}
                  aria-label="Delete message"
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded bg-card border border-border/40 text-muted-foreground hover:text-red-400 hover:border-red-400/40"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
              <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] leading-snug border ${
                m.sender_type === 'admin'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-foreground'
                  : 'bg-card/80 border-border/40 text-foreground'
              }`}>
                <p className={`text-[8px] font-black uppercase tracking-wider mb-0.5 ${m.sender_type === 'admin' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  {m.sender_type === 'admin' ? `You (${m.sender_name || 'Loopgate'})` : (m.sender_name || 'Client')}
                </p>
                <p className="whitespace-pre-wrap">{m.message_text}</p>
                <p className="text-[8px] text-muted-foreground/60 mt-1 font-mono">{formatTime(m.created_at)}</p>
              </div>
              {m.sender_type === 'client' && (
                <button
                  onClick={() => deleteMessage(m.id)}
                  aria-label="Delete client message"
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded bg-card border border-border/40 text-muted-foreground hover:text-red-400 hover:border-red-400/40"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="px-3 py-2 border-t border-border/20 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Reply to client…"
          disabled={sending}
          className="flex-1 bg-background/60 border border-border/30 rounded-md px-3 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500/40 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="h-7 px-3 rounded-md bg-emerald-500 hover:bg-emerald-500/90 text-white text-[10px] font-bold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-3 h-3" /> Send
        </button>
      </form>
    </div>
  );
}