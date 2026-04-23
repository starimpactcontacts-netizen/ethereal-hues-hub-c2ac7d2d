import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, DollarSign, TrendingUp, Film, Flame } from 'lucide-react';
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
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ClippersLayout title="CAMPAIGNS">
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6 space-y-6">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-[40px] leading-none mb-1.5 tracking-tight">Missions</h1>
          <p className="text-[13px] text-muted-foreground">Drop clips. Hit views. Get paid.</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-3 gap-2.5"
        >
          <StatTile icon={DollarSign} label="Earnings" value={formatMoney(stats.total_earnings_cents)} tint="text-emerald-400" />
          <StatTile icon={TrendingUp} label="Index" value={`${stats.total_index_earned}`} tint="text-gold" />
          <StatTile icon={Film} label="Clips" value={`${stats.total_clips}`} tint="text-foreground" />
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search missions..."
            className="w-full h-12 pl-10 pr-4 rounded-2xl text-sm outline-none transition-all focus:bg-surface-2"
            style={{
              background: 'hsl(var(--surface-1))',
              border: '1px solid hsl(var(--border) / 0.6)',
            }}
          />
        </motion.div>

        {/* Campaign list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-surface-1 border border-border/60 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-1 border border-border/60 rounded-3xl p-10 text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-display text-lg">No missions yet</p>
            <p className="text-sm text-muted-foreground">New paid drops weekly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c, idx) => {
              const budget = c.budget_cents || 0;
              const spent = c.spent_cents || 0;
              const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
              const hot = pct > 60;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.05 + idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={c.slug ? `/campaign/${c.slug}` : '/missions/portal'}
                    className="block group rounded-3xl p-4 transition-all duration-300 active:scale-[0.985] hover:-translate-y-0.5"
                    style={{
                      background:
                        'linear-gradient(180deg, hsl(var(--surface-1)) 0%, hsl(var(--surface-0)) 100%)',
                      border: '1px solid hsl(var(--border) / 0.55)',
                      boxShadow:
                        '0 1px 0 hsl(0 0% 100% / 0.04) inset, 0 8px 24px hsl(0 0% 0% / 0.35)',
                    }}
                  >
                    <div className="flex gap-3 mb-3.5">
                      <div className="w-[68px] h-[68px] flex-shrink-0 rounded-2xl overflow-hidden bg-surface-0 ring-1 ring-white/5">
                        {c.cover_image_url ? (
                          <img src={c.cover_image_url} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="px-2 py-0.5 bg-gold/15 text-gold rounded-full text-[10px] font-display tracking-wider uppercase">
                            Clipping
                          </span>
                          <span className="text-[10px] tracking-wider uppercase text-muted-foreground">
                            {c.client_name || 'Loopgate'}
                          </span>
                          {hot && (
                            <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-orange-400 font-display tracking-wider uppercase">
                              <Flame className="w-3 h-3" /> Hot
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-[18px] leading-tight line-clamp-1">{c.name}</h3>
                        {c.goal_label && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{c.goal_label}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Paid Out</p>
                        <p className="font-display text-[20px] leading-none mt-0.5">
                          {formatMoney(spent)} <span className="text-muted-foreground text-[13px]">/ {formatMoney(budget)}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground tracking-wider uppercase">CPM</p>
                        <p className="font-display text-[20px] leading-none mt-0.5 text-emerald-400">$0.75<span className="text-muted-foreground text-[11px]">/1k</span></p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-0 rounded-full overflow-hidden ring-1 ring-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, hsl(var(--gold) / 0.7), hsl(var(--gold)))',
                          boxShadow: '0 0 10px hsl(var(--gold) / 0.5)',
                        }}
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </ClippersLayout>
  );
}

function StatTile({ icon: Icon, label, value, tint }: { icon: typeof DollarSign; label: string; value: string; tint: string }) {
  return (
    <div
      className="rounded-2xl p-3.5 transition-all hover:-translate-y-0.5"
      style={{
        background:
          'linear-gradient(180deg, hsl(var(--surface-1)) 0%, hsl(var(--surface-0)) 100%)',
        border: '1px solid hsl(var(--border) / 0.55)',
        boxShadow: '0 1px 0 hsl(0 0% 100% / 0.04) inset, 0 4px 16px hsl(0 0% 0% / 0.25)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3 h-3 ${tint}`} />
        <span className="text-[9px] text-muted-foreground tracking-[0.15em] uppercase font-semibold">{label}</span>
      </div>
      <div className={`font-display text-[26px] leading-none ${tint}`}>{value}</div>
    </div>
  );
}