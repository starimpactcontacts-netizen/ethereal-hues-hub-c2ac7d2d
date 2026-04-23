import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, ArrowUpRight, Flame } from 'lucide-react';
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
          ? supabase
              .from('clipper_profiles')
              .select('total_earnings_cents, total_index_earned, total_clips')
              .eq('user_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setCampaigns((cRes.data || []) as Campaign[]);
      if (sRes.data) setStats(sRes.data as ClipperStats);
      setLoading(false);
    };
    load();
  }, [user]);

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const filtered = campaigns.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(search.toLowerCase())
  );
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <ClippersLayout title="MISSIONS">
      {/* Editorial hero */}
      <section className="max-w-6xl mx-auto px-5 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-[10px] tracking-[0.3em] text-gold/80">VOL.01</span>
            <span className="h-px flex-1 bg-white/[0.08]" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
              {filtered.length.toString().padStart(2, '0')} ACTIVE
            </span>
          </div>
          <h1 className="font-display text-[56px] sm:text-[72px] leading-[0.85] tracking-tight">
            Drop clips.<br />
            <span className="text-gold italic">Get paid.</span>
          </h1>
        </motion.div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/[0.06]" style={{ background: 'hsl(0 0% 2%)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-3 divide-x divide-white/[0.06]">
          <StatCell index="01" label="Earnings" value={formatMoney(stats.total_earnings_cents)} accent />
          <StatCell index="02" label="Index" value={`${stats.total_index_earned}`} />
          <StatCell index="03" label="Clips" value={`${stats.total_clips}`} />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 py-7 space-y-7">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search missions"
            className="w-full h-11 pl-7 pr-2 text-[13px] outline-none transition-all bg-transparent placeholder:text-muted-foreground/60 placeholder:tracking-wider"
            style={{
              borderTop: '1px solid hsl(0 0% 100% / 0.06)',
              borderBottom: '1px solid hsl(0 0% 100% / 0.06)',
            }}
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-white/[0.06] p-12 text-center">
            <Sparkles className="w-6 h-6 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-display text-3xl tracking-tight">No missions live</p>
            <p className="text-[12px] text-muted-foreground mt-1 tracking-wider uppercase">New paid drops weekly</p>
          </div>
        ) : (
          <>
            {featured && <FeaturedCard c={featured} formatMoney={formatMoney} />}

            <div className="flex items-center gap-3 pt-2">
              <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">ALL · MISSIONS</span>
              <span className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {rest.map((c, idx) => {
                const budget = c.budget_cents || 0;
                const spent = c.spent_cents || 0;
                const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                const hot = pct > 60;
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35, delay: idx * 0.03 }}
                  >
                    <Link
                      to={c.slug ? `/campaign/${c.slug}` : '/missions/portal'}
                      className="group flex items-center gap-4 py-4 transition-colors hover:bg-white/[0.02] active:bg-white/[0.04]"
                    >
                      <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 w-7 tabular-nums">
                        {String(idx + 2).padStart(2, '0')}
                      </span>
                      <div className="w-14 h-14 flex-shrink-0 overflow-hidden bg-surface-1 border border-white/[0.06]">
                        {c.cover_image_url ? (
                          <img
                            src={c.cover_image_url}
                            alt={c.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/80">
                            {c.client_name || 'Loopgate'}
                          </span>
                          {hot && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-gold font-mono tracking-widest uppercase">
                              <Flame className="w-2.5 h-2.5" /> HOT
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-[22px] leading-none tracking-tight truncate">{c.name}</h3>
                      </div>
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase">Pool</span>
                        <span className="font-display text-[22px] leading-none text-foreground tabular-nums">
                          {formatMoney(budget)}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 ml-2">
                        <span className="font-mono text-[11px] text-gold tabular-nums hidden sm:inline">
                          {Math.round(pct)}%
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-gold group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </ClippersLayout>
  );
}

function StatCell({ index, label, value, accent }: { index: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-5 py-5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="font-mono text-[9px] tracking-[0.25em] text-gold/70">{index}</span>
        <span className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase font-semibold">{label}</span>
      </div>
      <div className={`font-display text-[30px] leading-none tabular-nums tracking-tight ${accent ? 'text-gold' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}

function FeaturedCard({ c, formatMoney }: { c: Campaign; formatMoney: (n: number) => string }) {
  const budget = c.budget_cents || 0;
  const spent = c.spent_cents || 0;
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={c.slug ? `/campaign/${c.slug}` : '/missions/portal'}
        className="group relative block overflow-hidden border border-white/[0.08] aspect-[16/10] sm:aspect-[21/9]"
      >
        {c.cover_image_url ? (
          <img
            src={c.cover_image_url}
            alt={c.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-surface-1" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, hsl(0 0% 0% / 0.35) 0%, hsl(0 0% 0% / 0.05) 35%, hsl(0 0% 0% / 0.95) 100%)',
          }}
        />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span
            className="font-mono text-[10px] tracking-[0.3em] text-gold uppercase backdrop-blur px-2.5 py-1"
            style={{ background: 'hsl(0 0% 0% / 0.5)', borderTop: '1px solid hsl(var(--gold) / 0.5)' }}
          >
            ★ FEATURED
          </span>
          <span className="font-mono text-[10px] tracking-[0.25em] text-white/70 uppercase">M·01</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/60 mb-2">{c.client_name || 'Loopgate'}</p>
          <h2 className="font-display text-[40px] sm:text-[56px] leading-[0.88] text-white tracking-tight mb-4 max-w-[85%]">
            {c.name}
          </h2>
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="h-px bg-white/20 mb-1.5">
                <div
                  className="h-px bg-gold transition-all duration-500"
                  style={{ width: `${pct}%`, boxShadow: '0 0 6px hsl(var(--gold))' }}
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] tracking-widest font-mono uppercase text-white/70">
                <span className="text-gold tabular-nums">{formatMoney(spent)}</span>
                <span>/ {formatMoney(budget)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white">
              <span className="font-display text-[14px] tracking-[0.3em] uppercase">Enter</span>
              <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}