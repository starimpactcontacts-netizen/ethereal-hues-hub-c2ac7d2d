import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, ChevronRight, DollarSign, TrendingUp, BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTempProfile } from '@/hooks/useTempProfile';
import AccountPromptModal from '@/components/loopgate/AccountPromptModal';

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
  status: string;
  deadline: string | null;
}

interface UserStats {
  earned: number;
  paid: number;
  clips: number;
}

export default function ClippersCampaignsPage() {
  const { user } = useAuth();
  const { profile: tempProfile } = useTempProfile();
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
          .select('id, title, description, cover_image_url, sponsor_name, sponsor_logo_url, base_payout_cents, view_milestones, budget_cents, spent_cents, cap_type, max_posts, approved_count, status, deadline')
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

  const isGuest = !user;
  const displayName = (user?.user_metadata?.username as string | undefined) || user?.email?.split('@')[0] || tempProfile?.username || 'Guest';
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) || tempProfile?.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      {/* Personalized greeting */}
      <section className="max-w-6xl mx-auto px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={() => { if (isGuest) setAuthOpen(true); }}
          disabled={!isGuest}
          className={`flex items-center gap-3 w-full text-left ${isGuest ? 'active:opacity-60 transition-opacity' : ''}`}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shrink-0"
            style={{
              background: isGuest ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#3a3a3c,#1c1c1e)',
              border: isGuest ? '1px dashed rgba(255,255,255,0.22)' : '0.5px solid rgba(255,255,255,0.1)',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[16px] font-semibold text-white/85">{initial}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] text-[#8E8E93] font-medium leading-none">
              {isGuest ? 'Tap to sign in' : greeting}
            </p>
            <p className="text-[18px] font-semibold text-white tracking-[-0.02em] mt-1 leading-none truncate">
              {isGuest ? 'Not signed in' : `@${displayName}`}
            </p>
          </div>
        </button>

        <h1 className="font-apple-tight text-[32px] font-bold text-white leading-[1.05] mt-5">Missions</h1>
        <p className="text-[13px] text-[#8E8E93] mt-1">Get paid per clip + bonuses for views.</p>

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
          className="relative overflow-hidden rounded-[20px] p-5"
          style={{ background: 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)' }}
        >
          <div
            aria-hidden
            className="absolute -top-12 -right-10 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }}
          />
          <p className="text-[13px] text-[#8E8E93] font-medium">Available balance</p>
          <p className="font-apple-tight text-[44px] font-bold leading-none mt-1.5 tabular-nums text-white">
            {formatMoney(balance)}
          </p>
          <p className="text-[11px] text-[#8E8E93] mt-1">Withdraw anytime · paid within 24h</p>
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-white/[0.06]">
            <MiniStat label="Clips" value={stats.clips.toString()} />
            <div className="w-px h-7 bg-white/[0.08]" />
            <MiniStat label="Live" value={filtered.length.toString()} />
          </div>
        </motion.div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-4 pb-8">
        <h2 className="text-[22px] font-bold text-white tracking-[-0.022em] px-0.5">Live missions</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-[16px] bg-[#1c1c1e] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[20px] p-10 text-center" style={{ background: '#1c1c1e' }}>
            <Sparkles className="w-7 h-7 text-[#8E8E93] mx-auto mb-3" />
            <p className="text-[17px] font-semibold text-white">No live missions</p>
            <p className="text-[13px] text-[#8E8E93] mt-1">New paid drops every week</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <MissionCard key={m.id} m={m} formatMoney={formatMoney} />
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

function MissionCard({ m, formatMoney }: { m: Mission; formatMoney: (n: number) => string }) {
  const isPostsCap = m.cap_type === 'posts';
  const budget = m.budget_cents || 0;
  const spent = m.spent_cents || 0;
  const maxPosts = m.max_posts || 0;
  const approved = m.approved_count || 0;
  const pct = isPostsCap
    ? (maxPosts > 0 ? Math.min(100, (approved / maxPosts) * 100) : 0)
    : (budget > 0 ? Math.min(100, (spent / budget) * 100) : 0);
  const showProgress = isPostsCap ? maxPosts > 0 : budget > 0;
  const milestones = (m.view_milestones || []).slice(0, 3);
  const isPaused = m.status === 'paused';

  return (
    <Link
      to={`/missions/submit?id=${m.id}`}
      className="block rounded-[22px] overflow-hidden active:scale-[0.985] transition-all duration-200 relative group"
      style={{
        background: 'linear-gradient(180deg, #1f1f21 0%, #161618 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        border: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex p-2.5 gap-3">
        {/* Cover — squared, inset, with gloss */}
        <div
          className="w-[104px] h-[104px] flex-shrink-0 rounded-[14px] overflow-hidden relative bg-[#2c2c2e]"
          style={{ boxShadow: '0 0 0 0.5px rgba(255,255,255,0.08) inset' }}
        >
          {m.cover_image_url ? (
            <img src={m.cover_image_url} alt={m.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2c2c2e] to-[#1c1c1e]">
              <DollarSign className="w-7 h-7 text-[#48484A]" />
            </div>
          )}
          {/* subtle top gloss */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)' }}
          />
          {isPaused && (
            <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-400">Paused</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 py-0.5 pr-1 flex flex-col">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-[#8E8E93] font-medium truncate leading-none flex items-center gap-1">
                <span className="truncate">{m.sponsor_name || 'Loopgate Official'}</span>
                <BadgeCheck
                  className="w-[12px] h-[12px] flex-shrink-0 fill-[#F5C451] text-white"
                  strokeWidth={2.5}
                  aria-label="Verified"
                />
              </p>
              <h3 className="font-apple-tight text-[17px] font-bold text-white tracking-[-0.022em] line-clamp-2 leading-[1.15] mt-1">
                {m.title}
              </h3>
            </div>
            <ChevronRight
              className="w-[16px] h-[16px] text-[#48484A] flex-shrink-0 mt-0.5 group-active:translate-x-0.5 transition-transform"
              strokeWidth={2.75}
            />
          </div>

          {/* Payout strip */}
          <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
            <span
              className="inline-flex items-center gap-0.5 text-[12.5px] font-bold tabular-nums leading-none"
              style={{ color: '#30D158' }}
            >
              <DollarSign className="w-[12px] h-[12px]" strokeWidth={3} />
              {(m.base_payout_cents / 100).toFixed(2)}
              <span className="text-[#8E8E93] font-medium ml-0.5">base</span>
            </span>
            {milestones.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#8E8E93] leading-none">
                <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                up to +{formatMoney(milestones.reduce((s, x) => s + x.bonus_cents, 0))}
              </span>
            )}
          </div>

          {/* Progress bar — posts or budget */}
          {showProgress && (
            <div className="mt-2">
              <div className="h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #30D158 0%, #34d869 100%)',
                    boxShadow: '0 0 8px rgba(48,209,88,0.4)',
                  }}
                />
              </div>
              <p className="text-[10.5px] text-[#8E8E93] mt-1 tabular-nums font-medium">
                {isPostsCap
                  ? `${approved} / ${maxPosts} posts filled`
                  : `${formatMoney(spent)} / ${formatMoney(budget)} pool`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
