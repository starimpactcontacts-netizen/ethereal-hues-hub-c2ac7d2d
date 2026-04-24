import { ShieldCheck, CalendarClock, UserCheck, AlertTriangle, Scale, FileText } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const RULES = [
  {
    icon: UserCheck,
    color: '#30D158',
    title: 'You must be 18 or older',
    body: 'Loopgate Missions involve real money payouts. By participating, you confirm you are of legal age in your country (18+) and legally able to receive payouts.',
  },
  {
    icon: CalendarClock,
    color: '#FFCC00',
    title: 'Keep submitted clips up for 30 days',
    body: 'Once a clip is approved and earning, it must remain publicly posted for at least 30 days from approval. Early deletes void earnings on that clip and reduce your trust score.',
  },
  {
    icon: ShieldCheck,
    color: '#0A84FF',
    title: 'Only post your own clips',
    body: 'No re-uploads of other clippers’ work, no stolen edits, and no AI farms. Verified original work only — duplicates are auto-rejected and may suspend your account.',
  },
  {
    icon: AlertTriangle,
    color: '#FF9F0A',
    title: 'No fake views or engagement',
    body: 'Bots, view-bought traffic, and engagement pods will be detected. Suspicious traffic invalidates the clip’s payout and impacts your trust score across all future missions.',
  },
  {
    icon: Scale,
    color: '#BF5AF2',
    title: 'Payouts are final on approval',
    body: 'Approved payouts are processed via your selected method (PayPal recommended). Crypto sends are irreversible — wrong addresses cannot be recovered. Double-check your destination.',
  },
  {
    icon: FileText,
    color: '#8E8E93',
    title: 'Trust score affects your missions',
    body: 'Violations (early deletes, fake metrics, stolen clips) lower your trust score. Low trust = lower priority on missions and reduced payout caps. Keep it clean to keep earning.',
  },
];

export default function ClippersPolicyPage() {
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAgree = async () => {
    if (!user) { toast.error('Sign in to confirm'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('clipper_profiles')
      .upsert(
        { user_id: user.id, agreed_to_terms: true, age_confirmed_18_plus: true, agreed_30_day_post: true },
        { onConflict: 'user_id' }
      );
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setAgreed(true);
    toast.success('Confirmed — you’re cleared to earn');
  };

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 pt-3 pb-4">
        <h1 className="font-apple-tight text-[34px] font-bold text-white leading-[1.05]">Policy</h1>
        <p className="text-[14px] text-[#8E8E93] mt-1.5 leading-snug">
          The ground rules for participating in Loopgate Missions. Built to protect your earnings, your trust score, and the integrity of every payout.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 space-y-2">
        {RULES.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.title}
              className="rounded-[16px] p-4 flex items-start gap-3"
              style={{ background: '#1c1c1e' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${r.color}20` }}
              >
                <Icon className="w-[18px] h-[18px]" style={{ color: r.color }} strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-white tracking-[-0.01em]">{r.title}</p>
                <p className="text-[13px] text-[#8E8E93] leading-snug mt-1">{r.body}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-5">
        <div
          className="rounded-[18px] p-4"
          style={{ background: 'rgba(48,209,88,0.08)', boxShadow: 'inset 0 0 0 0.5px rgba(48,209,88,0.30)' }}
        >
          <p className="text-[13px] text-white leading-snug">
            By tapping <span className="font-semibold">I Agree</span>, you confirm you are <span className="font-semibold">18 or older</span>, will keep approved clips posted for at least <span className="font-semibold">30 days</span>, and accept Loopgate’s mission rules. Violations affect your trust score and future earnings.
          </p>
          <button
            onClick={handleAgree}
            disabled={saving || agreed || !user}
            className="mt-3 w-full h-12 rounded-[14px] text-[16px] font-semibold active:opacity-60 disabled:opacity-50"
            style={{ background: agreed ? '#1c1c1e' : '#30D158', color: agreed ? '#30D158' : '#000' }}
          >
            {agreed ? '✓ Agreed' : !user ? 'Sign in to confirm' : saving ? 'Saving…' : 'I Agree'}
          </button>
        </div>
        <p className="text-[11px] text-[#8E8E93] text-center mt-3 mb-6">
          Loopgate may update these rules. Material changes will be notified before they take effect.
        </p>
      </section>
    </>
  );
}