import { useState } from 'react';
import { ArrowLeft, Mail, MessageCircle, Send, X, Bug, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SUPPORT_EMAIL = 'contact@viral-cartel.com';

export default function SupportPage() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'bug' | 'inquiry'>('inquiry');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (message.trim().length < 5) return toast.error('Add a bit more detail');
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Not signed in — fall straight to mail client
        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
          kind === 'bug' ? 'Bug report' : 'Inquiry'
        )}&body=${encodeURIComponent(message)}`;
        return;
      }
      const username =
        (user.user_metadata as any)?.username ||
        user.email?.split('@')[0] ||
        'user';
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        username,
        avatar_url: (user.user_metadata as any)?.avatar_url ?? null,
        category: kind,
        subject: kind === 'bug' ? 'Bug report' : 'Inquiry',
        message: `${email.trim() ? `Reply-to: ${email.trim()}\n\n` : ''}${message.trim()}`,
      });
      if (error) throw error;
      toast.success("Got it — we'll get back to you shortly");
      setMessage('');
      setEmail('');
      setOpen(false);
    } catch (e: any) {
      // Soft fallback: open mail client
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        kind === 'bug' ? 'Bug report' : 'Inquiry'
      )}&body=${encodeURIComponent(message)}`;
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-8">
        <Link to="/hub" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to Hub</span>
        </Link>

        <h1 className="font-display text-4xl mb-2">Support</h1>
        <p className="text-muted-foreground">Get help with your Loopgate experience</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Chat with us — bugs / inquiries */}
        <div className="bg-surface-1 border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gold/10 border border-gold/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-display text-xl">Drop a Message</h3>
              <p className="text-sm text-muted-foreground">Bug reports & inquiries — direct to the team</p>
            </div>
          </div>
          <Button
            className="w-full bg-gold text-background hover:bg-gold/90"
            onClick={() => setOpen(true)}
          >
            Open Chat
          </Button>
        </div>

        <div className="bg-surface-1 border border-border p-6">
          <h3 className="font-display text-xl mb-4">FAQ</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">How do I submit an edit?</h4>
              <p className="text-sm text-muted-foreground">Navigate to a live event and click "Submit Edit". Upload your file and confirm.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">When are rankings updated?</h4>
              <p className="text-sm text-muted-foreground">Rankings update in real-time during live events. Final rankings are locked when events close.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">How do prizes work?</h4>
              <p className="text-sm text-muted-foreground">Prize payouts are processed within 30 days of event closure. Winners are contacted via email.</p>
            </div>
          </div>
        </div>

        {/* Email at the bottom */}
        <div className="pt-6 pb-2 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Mail size={12} />
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground transition">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-[#111114] border border-white/10 p-5 shadow-2xl"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <h2 className="font-display text-2xl text-white leading-none mb-1">Drop us a message</h2>
              <p className="text-xs text-white/55 mb-4">
                Goes straight to the team. We reply by email.
              </p>

              {/* Kind toggle */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setKind('inquiry')}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg border text-xs font-semibold transition ${
                    kind === 'inquiry'
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-white/70 border-white/15 hover:border-white/30'
                  }`}
                >
                  <HelpCircle size={14} /> Inquiry
                </button>
                <button
                  onClick={() => setKind('bug')}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg border text-xs font-semibold transition ${
                    kind === 'bug'
                      ? 'bg-red-500 text-black border-red-500'
                      : 'bg-transparent text-white/70 border-white/15 hover:border-white/30'
                  }`}
                >
                  <Bug size={14} /> Bug
                </button>
              </div>

              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com (optional if signed in)"
                className="bg-black/40 border-white/15 text-white placeholder:text-white/30 h-10 mb-2"
              />

              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={kind === 'bug' ? 'Describe the bug — what happened, what you expected…' : 'How can we help?'}
                rows={5}
                className="bg-black/40 border-white/15 text-white placeholder:text-white/30 resize-none"
              />

              <button
                onClick={submit}
                disabled={sending}
                className="mt-3 w-full h-11 rounded-xl bg-gold text-background font-bold text-sm tracking-wide hover:bg-gold/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                {sending ? 'SENDING…' : 'SEND'}
              </button>

              <p className="mt-2 text-center text-[10px] text-white/30">
                Or email <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
