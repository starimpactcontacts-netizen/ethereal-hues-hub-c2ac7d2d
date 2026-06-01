import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Loader2, ChevronDown, Mail, BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Prefs {
  notification_email: string | null;
  notify_battles: boolean;
  notify_scores: boolean;
  notify_drops: boolean;
}

const TOGGLES: { key: keyof Prefs; label: string }[] = [
  { key: 'notify_battles', label: 'Edit Battles' },
  { key: 'notify_scores', label: 'Competitions' },
  { key: 'notify_drops', label: 'Events' },
];

export default function NotificationsInlineCard() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState<Prefs>({
    notification_email: null,
    notify_battles: true,
    notify_scores: true,
    notify_drops: true,
  });

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('notification_email, notify_battles, notify_scores, notify_drops, email')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled || !data) { setLoaded(true); return; }
      const d = data as any;
      setPrefs({
        notification_email: d.notification_email || null,
        notify_battles: d.notify_battles ?? true,
        notify_scores: d.notify_scores ?? true,
        notify_drops: d.notify_drops ?? true,
      });
      setEmail(d.notification_email || d.email || user.email || '');
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const hasEmail = !!prefs.notification_email;

  const handleSave = async () => {
    if (!user?.id) return;
    const emailVal = email.trim();
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      toast.error('Enter a valid email');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_email: emailVal || null,
        notify_battles: prefs.notify_battles,
        notify_scores: prefs.notify_scores,
        notify_drops: prefs.notify_drops,
      } as any)
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Could not save');
      return;
    }
    setPrefs(p => ({ ...p, notification_email: emailVal || null }));
    toast.success('Notifications updated');
    // Auto-collapse so they don't get the urge to remove it
    setTimeout(() => setOpen(false), 250);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[22px]"
      style={{
        background: 'linear-gradient(180deg, #1f1f22 0%, #161618 100%)',
        border: '0.5px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 24px -16px rgba(0,0,0,0.6)',
      }}
    >
      {/* Collapsed header (always visible, tap to toggle) */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 active:opacity-70 transition-opacity text-left"
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: hasEmail ? 'rgba(48,209,88,0.12)' : 'rgba(255,255,255,0.06)',
            border: '0.5px solid rgba(255,255,255,0.08)',
          }}
        >
          <Bell
            className="w-[16px] h-[16px]"
            style={{ color: hasEmail ? '#30D158' : '#8E8E93' }}
            strokeWidth={2.25}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[15px] font-semibold text-white tracking-[-0.02em] leading-none">
              Email notifications
            </p>
            {hasEmail && (
              <BadgeCheck
                className="w-[13px] h-[13px] fill-[#30D158] text-black"
                strokeWidth={2.5}
              />
            )}
          </div>
          <p className="text-[12px] text-[#8E8E93] mt-1 leading-none truncate">
            {hasEmail ? prefs.notification_email : 'Get battle & competition alerts in your inbox'}
          </p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-[16px] h-[16px] text-[#8E8E93]" strokeWidth={2.5} />
        </motion.div>
      </button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3">
              {/* divider */}
              <div className="h-px w-full bg-white/[0.06]" />

              {/* Email field */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#8E8E93]" strokeWidth={2.5} />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  disabled={!loaded || saving}
                  className="w-full h-10 pl-9 pr-3 text-[15px] outline-none rounded-[12px] text-white placeholder:text-[#8E8E93] tracking-[-0.01em]"
                  style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                />
              </div>

              {/* Toggle list — iOS grouped */}
              <div
                className="rounded-[14px] overflow-hidden"
                style={{ background: 'rgba(118, 118, 128, 0.14)' }}
              >
                {TOGGLES.map((t, i) => (
                  <div key={t.key}>
                    <button
                      type="button"
                      onClick={() => setPrefs(p => ({ ...p, [t.key]: !p[t.key] }))}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 active:bg-white/[0.03] transition-colors"
                    >
                      <span className="text-[14px] text-white tracking-[-0.01em]">{t.label}</span>
                      <IOSSwitch on={prefs[t.key] as boolean} />
                    </button>
                    {i < TOGGLES.length - 1 && (
                      <div className="h-px ml-3.5 bg-white/[0.05]" />
                    )}
                  </div>
                ))}
              </div>

              {/* Save button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !loaded}
                className="w-full h-11 rounded-[14px] flex items-center justify-center gap-1.5 text-[15px] font-semibold text-white tracking-[-0.01em] active:scale-[0.985] transition-transform disabled:opacity-60"
                style={{
                  background: 'linear-gradient(180deg, #0A84FF 0%, #0066D6 100%)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 18px -10px rgba(10,132,255,0.6)',
                }}
              >
                {saving ? <Loader2 className="w-[15px] h-[15px] animate-spin" /> : <Check className="w-[15px] h-[15px]" strokeWidth={2.75} />}
                {saving ? 'Saving' : 'Save'}
              </button>

              <p className="text-[10.5px] text-[#8E8E93] text-center tracking-[-0.005em]">
                Separate from your login email · unsubscribe anytime
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function IOSSwitch({ on }: { on: boolean }) {
  return (
    <div
      className="relative w-[42px] h-[26px] rounded-full transition-colors duration-200"
      style={{
        background: on ? '#30D158' : 'rgba(120, 120, 128, 0.32)',
      }}
    >
      <motion.div
        className="absolute top-[2px] w-[22px] h-[22px] rounded-full bg-white"
        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
        animate={{ left: on ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </div>
  );
}