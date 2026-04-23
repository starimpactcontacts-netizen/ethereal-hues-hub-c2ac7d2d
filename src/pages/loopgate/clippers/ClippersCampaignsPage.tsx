import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClippersLayout from '@/components/clippers/ClippersLayout';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  client_name: string | null;
  budget_cents: number | null;
  spent_cents: number | null;
  goal_label: string | null;
  slug: string | null;
}

interface ClipperStats {
  total_earnings_cents: number;
  total_index_earned: number;
  total_clips: number;
}

export default function ClippersCampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<ClipperStats>({
    total_earnings_cents: 0,
    total_index_earned: 0,
    total_clips: 0,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [cRes, sRes] = await Promise.all([
        supabase
          .from('artist_campaigns')
          .select('id, name, description, cover_image_url, client_name, budget_cents, spent_cents, goal_label, slug')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(40),
        user
          ? supabase.from('clipper_profiles').select('total_earnings_cents, total_index_earned, total_clips').eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setCampaigns((cRes.data || []) as Campaign[]);
      if (sRes.data) setStats(sRes.data as ClipperStats);
      setLoading(false);
    };
    load();
  }, [user]);

  const formatMoney = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const filtered = campaigns.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.client_name?.toLowerCase().includes(search.toLowerCase()),
  );
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <ClippersLayout title="Missions">
      <section className="max-w-6xl mx-auto px-4 pt-3 pb-5">
        <h1 className="font-apple-tight text-[34px] font-bold text-white leading-[1.05]">Missions</h1>

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
            style={{ background: 'radial-gradient(circle, rgba(255,204,0,0.18) 0%, transparent 70%)' }}
          />
          <p className="text-[13px] text-[#8E8E93] font-medium">Available balance</p>
          <p className="font-apple-tight text-[44px] font-bold text-white leading-none mt-1.5 tabular-nums">
            {formatMoney(stats.total_earnings_cents)}
          </p>
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-white/[0.06]">
            <MiniStat label="Index" value={stats.total_index_earned.toLocaleString()} />
            <div className="w-px h-7 bg-white/[0.08]" />
            <MiniStat label="Clips" value={stats.total_clips.toString()} />
            <div className="w-px h-7 bg-white/[0.08]" />
            <MiniStat label="Active" value={filtered.length.toString()} />
          </div>
        </motion.div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {loading ? (
          <div className="space-y-3">
            <div className="h-56 rounded-[20px] bg-[#1c1c1e] animate-pulse" />
            <div className="h-20 rounded-[16px] bg-[#1c1c1e] animate-pulse" />
            <div className="h-20 rounded-[16px] bg-[#1c1c1e] animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[20px] p-10 text-center" style={{ background: '#1c1c1e' }}>
            <Sparkles className="w-7 h-7 text-[#8E8E93] mx-auto mb-3" />
            <p className="text-[17px] font-semibold text-white">No missions live</p>
            <p className="text-[13px] text-[#8E8E93] mt-1">New paid drops every week</p>
          </div>
        ) : (
          <>
            {featured && <FeaturedCard c={featured} formatMoney={formatMoney} />}

            {rest.length > 0 && (
              <section>
                <h2 className="text-[22px] font-bold text-white tracking-[-0.022em] mb-3 px-0.5">Browse all</h2>
                <div className="rounded-[16px] overflow-hidden" style={{ background: '#1c1c1e' }}>
                  {rest.map((c, idx) => (
                    <CampaignRow key={c.id} c={c} formatMoney={formatMoney} isLast={idx === rest.length - 1} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </ClippersLayout>
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

function FeaturedCard({ c, formatMoney }: { c: Campaign; formatMoney: (n: number) => string }) {
  const budget = c.budget_cents || 0;
  const spent = c.spent_cents || 0;
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 px-0.5">
        <h2 className="text-[22px] font-bold text-white tracking-[-0.022em]">Featured</h2>
        <span className="text-[13px] text-[#8E8E93] font-medium">Top mission</span>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          to={c.slug ? `/campaign/${c.slug}` : '/missions/portal'}
          className="group relative block overflow-hidden rounded-[20px] aspect-[4/5] sm:aspect-[16/10] active:scale-[0.99] transition-transform"
          style={{ background: '#1c1c1e' }}
        >
          {c.cover_image_url ? (
            <img
              src={c.cover_image_url}
              alt={c.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#2c2c2e] to-[#1c1c1e]" />
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.92) 100%)' }}
          />
          <div className="absolute top-4 left-4">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            >
              ★ Featured
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-[13px] text-white/70 font-medium mb-1">{c.client_name || 'Loopgate'}</p>
            <h3 className="font-apple-tight text-[32px] font-bold text-white leading-[1.05] mb-3 line-clamp-2">{c.name}</h3>
            {budget > 0 && (
              <>
                <div className="h-1 rounded-full bg-white/20 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #FFCC00 0%, #FFD60A 100%)' }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-white/80 font-medium">
                    <span className="text-white tabular-nums">{formatMoney(spent)}</span>
                    <span className="text-white/50"> of {formatMoney(budget)}</span>
                  </p>
                  <span className="inline-flex items-center gap-0.5 text-[15px] font-semibold text-white">
                    Open <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                  </span>
                </div>
              </>
            )}
          </div>
        </Link>
      </motion.div>
    </section>
  );
}

function CampaignRow({ c, formatMoney, isLast }: { c: Campaign; formatMoney: (n: number) => string; isLast: boolean }) {
  const budget = c.budget_cents || 0;
  return (
    <Link
      to={c.slug ? `/campaign/${c.slug}` : '/missions/portal'}
      className="group flex items-center gap-3 px-4 py-3 active:bg-white/[0.04] transition-colors"
      style={isLast ? {} : { borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
    >
      <div className="w-12 h-12 flex-shrink-0 rounded-[10px] overflow-hidden bg-[#2c2c2e]">
        {c.cover_image_url ? (
          <img src={c.cover_image_url} alt={c.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#8E8E93]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-semibold text-white tracking-[-0.02em] truncate leading-tight">{c.name}</p>
        <p className="text-[13px] text-[#8E8E93] truncate mt-0.5">{c.client_name || 'Loopgate'}</p>
      </div>
      {budget > 0 && (
        <div className="text-right">
          <p className="text-[15px] font-semibold text-white tabular-nums">{formatMoney(budget)}</p>
          <p className="text-[11px] text-[#8E8E93]">pool</p>
        </div>
      )}
      <ChevronRight className="w-[18px] h-[18px] text-[#48484A] -mr-1" strokeWidth={2.5} />
    </Link>
  );
}
