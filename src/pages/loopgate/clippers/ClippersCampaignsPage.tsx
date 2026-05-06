import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, DollarSign, BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AccountPromptModal from '@/components/loopgate/AccountPromptModal';
import NotificationsInlineCard from '@/components/loopgate/NotificationsInlineCard';
import loopgateLogo from '@/assets/loopgate-logo.png';

interface Milestone { views: number; bonus_cents: number; }

interface Mission {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  base_payout_cents: number;
  view_milestones: Milestone[];
  budget_cents: number | null;
  spent_cents: number | null;
  cap_type?: string | null;
  max_posts?: number | null;
  approved_count?: number | null;
  eligible_platforms?: string[] | null;
  status: string;
  deadline: string | null;
  payout_display_override?: string | null;
}

interface UserStats {
  earned: number;
  paid: number;
  clips: number;
}

export default function ClippersCampaignsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState<UserStats>({ earned: 0, paid: 0, clips: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [mRes, subsRes, paysRes] = await Promise.all([
        supabase
          .from('missions')
          .select('id, title, description, cover_image_url, sponsor_name, sponsor_logo_url, base_payout_cents, view_milestones, budget_cents, spent_cents, cap_type, max_posts, approved_count, eligible_platforms, status, deadline, payout_display_override')
          .in('status', ['live', 'paused'])
          .order('created_at', { ascending: false })
          .limit(40),
        user
          ? supabase.from('mission_submissions').select('total_earned_cents, status').eq('user_id', user.id)
          : Promise.resolve({ data: [] as any[] }),
        user
          ? supabase.from('mission_payouts').select('amount_cents, status').eq('user_id', user.id).neq('status', 'rejected')
          : Promise.resolve({ data: [] as any[] }),
      ]);
      setMissions(((mRes.data as any) || []) as Mission[]);
      const subs = (subsRes.data || []) as Array<{ total_earned_cents: number; status: string }>;
      const pays = (paysRes.data || []) as Array<{ amount_cents: number }>;
      const earned = subs.reduce((s, x) => s + (x.total_earned_cents || 0), 0);
      const paid = pays.reduce((s, x) => s + (x.amount_cents || 0), 0);
      setStats({ earned, paid, clips: subs.length });
      setLoading(false);
    };
    load();
  }, [user]);

  const formatMoney = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const filtered = missions.filter((m) =>
    !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.sponsor_name?.toLowerCase().includes(search.toLowerCase()),
  );
  const balance = Math.max(0, stats.earned - stats.paid);

  return (
    <>
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 pt-4 pb-3">
        <h1 className="font-teko text-[44px] font-bold text-white leading-[0.95] uppercase tracking-[0.02em]">Missions</h1>
        <p className="text-[13px] text-[#8E8E93] mt-1 uppercase tracking-[0.1em] font-medium">Get paid · per post · per view</p>

        {/* iOS search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#8E8E93]" strokeWidth={2.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full h-9 pl-9 pr-3 text-[15px] outline-none rounded-[10px] text-white placeholder:text-[#8E8E93]"
            style={{ background: 'rgba(118, 118, 128, 0.24)' }}
          />
        </div>
      </section>

      {/* Earnings hero card */}
      <section className="max-w-6xl mx-auto px-4 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[22px] p-5"
          style={{
            background: 'linear-gradient(135deg, #1f1f22 0%, #131316 50%, #1a1a1d 100%)',
            boxShadow: '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 16px 32px -16px rgba(0,0,0,0.6)',
          }}
        >
          <div aria-hidden className="absolute inset-0 pointer-events-none opacity-50" style={{ background: 'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.06) 0%, transparent 50%)' }} />
          <img src={loopgateLogo} alt="" aria-hidden className="absolute -bottom-5 -right-5 w-36 h-36 object-contain pointer-events-none select-none opacity-[0.06]" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10.5px] text-[#8E8E93] font-medium uppercase tracking-[0.12em]">Balance</p>
              <p className="font-apple-tight text-[40px] font-semibold leading-none mt-1.5 tabular-nums text-white tracking-[-0.025em]">
                {formatMoney(balance)}
              </p>
              <p className="text-[10.5px] text-[#8E8E93] mt-1.5 tracking-[-0.005em]">No minimum · no fees · paid within 24h</p>
            </div>
            <img src={loopgateLogo} alt="Loopgate" className="w-6 h-6 object-contain opacity-90" />
          </div>

          <div className="relative flex items-center gap-5 mt-4 pt-4 border-t border-white/[0.06]">
            <MiniStat label="Posts" value={stats.clips.toString()} />
            <div className="w-px h-7 bg-white/[0.08]" />
            <MiniStat label="Live" value={filtered.length.toString()} />
          </div>
        </motion.div>
      </section>

      {/* iOS-style inline notifications card */}
      {user && (
        <section className="max-w-6xl mx-auto px-4 mb-5">
          <NotificationsInlineCard />
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 space-y-4 pb-8">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="font-teko text-[30px] font-bold text-white tracking-[0.04em] uppercase leading-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse shadow-[0_0_8px_rgba(48,209,88,0.8)]" />
            Live Missions
          </h2>
          <span className="font-teko text-[18px] text-[#8E8E93] tracking-[0.1em]">{filtered.length}</span>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-[18px] bg-[#1c1c1e] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[20px] p-10 text-center" style={{ background: '#1c1c1e' }}>
            <Sparkles className="w-7 h-7 text-[#8E8E93] mx-auto mb-3" />
            <p className="text-[17px] font-semibold text-white">No live missions</p>
            <p className="text-[13px] text-[#8E8E93] mt-1">New paid drops every week</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((m) => (
              <MissionTile key={m.id} m={m} formatMoney={formatMoney} />
            ))}
          </div>
        )}
      </div>

      <AccountPromptModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        reason="Create your account to start earning from missions."
      />
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[#8E8E93] font-medium">{label}</p>
      <p className="text-[17px] font-semibold text-white tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function MissionTile({ m, formatMoney }: { m: Mission; formatMoney: (n: number) => string }) {
  const isPostsCap = m.cap_type === 'posts';
  const budget = m.budget_cents || 0;
  const spent = m.spent_cents || 0;
  const maxPosts = m.max_posts || 0;
  const approved = m.approved_count || 0;
  const pct = isPostsCap
    ? (maxPosts > 0 ? Math.min(100, (approved / maxPosts) * 100) : 0)
    : (budget > 0 ? Math.min(100, (spent / budget) * 100) : 0);
  const showProgress = isPostsCap ? maxPosts > 0 : budget > 0;
  const isPaused = m.status === 'paused';
  const payoutLabel = m.payout_display_override
    ? m.payout_display_override
    : `$${(m.base_payout_cents / 100).toFixed(2)}`;

  return (
    <Link
      to={`/missions/submit?id=${m.id}`}
      className="block aspect-square rounded-[14px] overflow-hidden active:scale-[0.96] transition-all duration-150 relative group"
      style={{
        background: '#161618',
        boxShadow: '0 0 0 2px rgba(255,255,255,0.08) inset, 0 4px 0 0 rgba(0,0,0,0.5), 0 8px 20px -6px rgba(0,0,0,0.8)',
        border: '1.5px solid rgba(255,255,255,0.12)',
      }}
    >
      {/* Cover fills entire tile */}
      {m.cover_image_url ? (
        <img src={m.cover_image_url} alt={m.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#2c2c2e] to-[#1c1c1e]">
          <DollarSign className="w-10 h-10 text-[#48484A]" />
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.92) 100%)' }}
      />

      {/* Top-left payout pill — chunky Roblox style */}
      <div
        className="absolute top-2 left-2 px-2 py-1 rounded-md flex items-center gap-0.5 font-teko text-[15px] font-bold leading-none tabular-nums tracking-wider"
        style={{
          background: '#30D158',
          color: '#000',
          boxShadow: '0 2px 0 0 rgba(0,0,0,0.4), 0 0 0 1.5px rgba(0,0,0,0.3)',
        }}
      >
        <DollarSign className="w-[12px] h-[12px]" strokeWidth={3.5} />
        {payoutLabel.replace(/^\$/, '')}
      </div>

      {isPaused && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(0,0,0,0.65)', color: '#FFD60A' }}>
          Paused
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="text-[10px] text-white/70 font-medium truncate flex items-center gap-1 leading-none uppercase tracking-wider">
          <span className="truncate">{m.sponsor_name || 'Loopgate Official'}</span>
          <BadgeCheck
            className="w-[10px] h-[10px] flex-shrink-0 fill-[hsl(214,89%,52%)] text-black"
            strokeWidth={2.5}
            aria-label="Verified"
          />
        </p>
        <h3 className="font-teko text-[18px] font-bold text-white tracking-[0.02em] uppercase line-clamp-2 leading-[1] mt-1">
          {m.title}
        </h3>
        {showProgress && (
          <div className="mt-1.5">
            <div className="h-[2.5px] rounded-full bg-white/[0.18] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: '#30D158',
                  boxShadow: '0 0 6px rgba(48,209,88,0.5)',
                }}
              />
            </div>
            <p className="text-[9.5px] text-white/60 mt-1 tabular-nums font-medium leading-none">
              {isPostsCap ? `${approved}/${maxPosts} posts` : `${Math.round(pct)}% pool`}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
