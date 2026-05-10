import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AccountPromptModal from '@/components/loopgate/AccountPromptModal';
import NotificationsInlineCard from '@/components/loopgate/NotificationsInlineCard';
import PlatformBadges from '@/components/loopgate/missions/PlatformBadges';

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
  const [profile, setProfile] = useState<{ username: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const load = async () => {
      const [mRes, subsRes, paysRes, profRes] = await Promise.all([
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
        user
          ? supabase.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle()
          : Promise.resolve({ data: null as any }),
      ]);
      setMissions(((mRes.data as any) || []) as Mission[]);
      const subs = (subsRes.data || []) as Array<{ total_earned_cents: number; status: string }>;
      const pays = (paysRes.data || []) as Array<{ amount_cents: number }>;
      const earned = subs.reduce((s, x) => s + (x.total_earned_cents || 0), 0);
      const paid = pays.reduce((s, x) => s + (x.amount_cents || 0), 0);
      setStats({ earned, paid, clips: subs.length });
      if (profRes.data) setProfile(profRes.data as any);
      setLoading(false);
    };
    load();
  }, [user]);

  const formatMoney = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const filtered = missions.filter((m) =>
    !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.sponsor_name?.toLowerCase().includes(search.toLowerCase()),
  );
  const balance = Math.max(0, stats.earned - stats.paid);
  const displayName = profile?.username || (user?.user_metadata?.username as string) || user?.email?.split('@')[0] || 'Guest';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Profile-led stats header */}
      <section className="max-w-6xl mx-auto px-4 pt-4 pb-3">
        <div className="flex items-center gap-3.5">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-[68px] h-[68px] rounded-2xl object-cover"
              style={{ border: '2px solid rgba(255,255,255,0.14)', boxShadow: '0 4px 0 rgba(0,0,0,0.5)' }}
            />
          ) : (
            <div
              className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center font-teko text-[36px] font-bold text-black bg-[#D4A857]"
              style={{ border: '2px solid rgba(255,255,255,0.14)', boxShadow: '0 4px 0 rgba(0,0,0,0.5)' }}
            >
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#8E8E93] uppercase tracking-[0.15em] font-bold">@{displayName}</p>
            <p className="font-teko text-[36px] font-bold text-white leading-[0.9] tabular-nums tracking-[0.01em] mt-0.5">
              {formatMoney(balance)}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-teko text-[14px] text-white tracking-[0.05em] uppercase">
                <span className="text-[#30D158] font-bold">{stats.clips}</span> <span className="text-[#8E8E93]">Posts</span>
              </span>
            </div>
          </div>
        </div>

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

      {/* iOS-style inline notifications card */}
      {user && (
        <section className="max-w-6xl mx-auto px-4 mt-4 mb-5">
          <NotificationsInlineCard />
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 space-y-4 pb-8">
        <h2 className="font-teko text-[30px] font-bold text-white tracking-[0.04em] uppercase leading-none px-0.5">
          Live Missions
        </h2>
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
  const deadlinePassed = m.deadline ? new Date(m.deadline).getTime() < Date.now() : false;
  const capReached = isPostsCap ? (maxPosts > 0 && approved >= maxPosts) : (budget > 0 && spent >= budget);
  const isEnded = deadlinePassed || capReached || m.status === 'ended' || m.status === 'closed';
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
        <img src={m.cover_image_url} alt={m.title} className={`absolute inset-0 w-full h-full object-cover ${isEnded ? 'grayscale opacity-50' : ''}`} />
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

      {isEnded && (
        <div aria-hidden className="absolute inset-0 pointer-events-none bg-black/45" />
      )}

      {/* Top-left payout pill — chunky Roblox style */}
      <div
        className="absolute top-2 left-2 px-2 py-1 rounded-md flex items-center gap-0.5 font-teko text-[15px] font-bold leading-none tabular-nums tracking-wider"
        style={{
          background: isEnded ? '#3a3a3c' : '#30D158',
          color: isEnded ? '#9a9a9e' : '#000',
          boxShadow: '0 2px 0 0 rgba(0,0,0,0.4), 0 0 0 1.5px rgba(0,0,0,0.3)',
        }}
      >
        <DollarSign className="w-[12px] h-[12px]" strokeWidth={3.5} />
        {payoutLabel.replace(/^\$/, '')}
      </div>

      {isEnded ? (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(0,0,0,0.75)', color: '#9a9a9e', border: '1px solid rgba(255,255,255,0.15)' }}>
          Ended
        </div>
      ) : isPaused && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(0,0,0,0.65)', color: '#FFD60A' }}>
          Paused
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <h3 className={`font-teko text-[18px] font-bold tracking-[0.02em] uppercase line-clamp-2 leading-[1] ${isEnded ? 'text-white/55' : 'text-white'}`}>
          {m.title}
        </h3>
        <div className="mt-1.5">
          <PlatformBadges platforms={m.eligible_platforms} size="sm" />
        </div>
        {showProgress && (
          <div className="mt-1.5">
            <div className="h-[2.5px] rounded-full bg-white/[0.18] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: isEnded ? '#6b6b70' : '#30D158',
                  boxShadow: isEnded ? 'none' : '0 0 6px rgba(48,209,88,0.5)',
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
