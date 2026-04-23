import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, DollarSign, TrendingUp, Film } from 'lucide-react';
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
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <StatTile icon={DollarSign} label="Earnings" value={formatMoney(stats.total_earnings_cents)} tint="text-emerald-400" />
          <StatTile icon={TrendingUp} label="Index" value={`${stats.total_index_earned}`} tint="text-gold" />
          <StatTile icon={Film} label="Clips" value={`${stats.total_clips}`} tint="text-foreground" />
        </motion.div>

        {/* Header */}
        <div>
          <h1 className="font-display text-3xl mb-1">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Discover active paid campaigns. Drop clips, get paid.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full h-11 pl-10 pr-4 bg-surface-1 border border-gold/20 rounded-xl text-sm focus:border-gold/50 outline-none"
          />
        </div>

        {/* Campaign list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-surface-1 border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-1 border border-border rounded-2xl p-10 text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-display">No campaigns yet</p>
            <p className="text-sm text-muted-foreground">New paid drops weekly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const budget = c.budget_cents || 0;
              const spent = c.spent_cents || 0;
              const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
              return (
                <Link
                  key={c.id}
                  to={c.slug ? `/campaign/${c.slug}` : '/clippers/portal'}
                  className="block bg-surface-1 border border-border rounded-2xl p-4 hover:border-gold/40 transition-colors"
                >
                  <div className="flex gap-3 mb-3">
                    <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-surface-0">
                      {c.cover_image_url ? (
                        <img src={c.cover_image_url} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1 mb-1">
                        <span className="px-2 py-0.5 bg-gold/15 text-gold rounded-full text-[10px] font-display tracking-wider uppercase">
                          Clipping
                        </span>
                        <span className="px-2 py-0.5 bg-surface-0 border border-border rounded-full text-[10px] tracking-wider uppercase text-muted-foreground">
                          {c.client_name || 'Loopgate'}
                        </span>
                      </div>
                      <h3 className="font-display text-base line-clamp-1">{c.name}</h3>
                      {c.goal_label && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.goal_label}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Paid Out</p>
                      <p className="font-display text-base">
                        {formatMoney(spent)} <span className="text-muted-foreground text-sm">/ {formatMoney(budget)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">CPM</p>
                      <p className="font-display text-base">$0.75 <span className="text-muted-foreground text-xs">/1k</span></p>
                    </div>
                  </div>
                  <div className="h-1 bg-surface-0 rounded-full overflow-hidden">
                    <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                </Link>
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
    <div className="bg-surface-1 border border-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3 h-3 ${tint}`} />
        <span className="text-[9px] text-muted-foreground tracking-wider uppercase">{label}</span>
      </div>
      <div className={`font-display text-xl ${tint}`}>{value}</div>
    </div>
  );
}