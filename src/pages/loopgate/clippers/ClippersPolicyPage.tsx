import { ShieldCheck, CalendarClock, UserCheck, AlertTriangle, Scale, FileText } from 'lucide-react';

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
    title: 'Keep submitted posts up for 30 days',
    body: 'Once a post is approved and earning, it must remain publicly live for at least 30 days from approval. Early deletes void earnings on that post and reduce your trust score.',
  },
  {
    icon: ShieldCheck,
    color: '#0A84FF',
    title: 'Only submit your own posts',
    body: 'No re-uploads of other creators’ work, no stolen edits, and no AI farms. Verified original work only — duplicates are auto-rejected and may suspend your account.',
  },
  {
    icon: AlertTriangle,
    color: '#FF9F0A',
    title: 'No fake views or engagement',
    body: 'Bots, view-bought traffic, and engagement pods will be detected. Suspicious traffic invalidates the post’s payout and impacts your trust score across all future missions.',
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
    body: 'Violations (early deletes, fake metrics, stolen posts) lower your trust score. Low trust = lower priority on missions and reduced payout caps. Keep it clean to keep earning.',
  },
];

export default function ClippersPolicyPage() {
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
        <p className="text-[12px] text-[#8E8E93] leading-relaxed text-center mt-2 mb-8">
          By participating in Loopgate Missions you confirm you are <span className="text-white font-medium">18 or older</span>, agree to keep approved posts live for at least <span className="text-white font-medium">30 days</span>, and accept Loopgate’s mission rules. Violations affect your trust score and future earnings.
          <br /><br />
          Loopgate may update these rules. Material changes will be notified before they take effect.
        </p>
      </section>
    </>
  );
}