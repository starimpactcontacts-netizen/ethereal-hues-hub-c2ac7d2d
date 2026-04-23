import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scissors, DollarSign, TrendingUp, Film, ArrowLeft, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  client_name: string | null;
  budget_cents: number | null;
  goal_label: string | null;
  slug: string | null;
  status: string;
}

interface Edit {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
  platform: string | null;
  view_count: number;
  editor_username: string | null;
}

interface ClipperStats {
  total_earnings_cents: number;
  total_index_earned: number;
  total_clips: number;
}

export default function ClippersPortalPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [edits, setEdits] = useState<Edit[]>([]);
  const [stats, setStats] = useState<ClipperStats>({
    total_earnings_cents: 0,
    total_index_earned: 0,
    total_clips: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [campaignsRes, editsRes, statsRes] = await Promise.all([
        supabase
          .from('artist_campaigns')
          .select('id, name, description, cover_image_url, logo_url, client_name, budget_cents, goal_label, slug, status')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('artist_campaign_edits')
          .select('id, title, thumbnail_url, video_url, platform, view_count, editor_username')
          .eq('status', 'live')
          .order('view_count', { ascending: false })
          .limit(30),
        user
          ? supabase
              .from('clipper_profiles')
              .select('total_earnings_cents, total_index_earned, total_clips')
              .eq('user_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      setCampaigns((campaignsRes.data || []) as Campaign[]);
      setEdits((editsRes.data || []) as Edit[]);
      if (statsRes.data) setStats(statsRes.data as ClipperStats);
      setLoading(false);
    };
    load();
  }, [user]);

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatViews = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Hub</span>
          </button>
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-gold" />
            <span className="font-display tracking-widest text-xs text-gold">CLIPPERS</span>
          </div>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Hero stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <StatTile
            icon={DollarSign}
            label="Earnings"
            value={formatMoney(stats.total_earnings_cents)}
            tint="text-emerald-400"
          />
          <StatTile
            icon={TrendingUp}
            label="Index"
            value={`${stats.total_index_earned}`}
            tint="text-gold"
          />
          <StatTile
            icon={Film}
            label="Clips"
            value={`${stats.total_clips}`}
            tint="text-foreground"
          />
        </motion.div>

        {/* Active campaigns */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl">Active Campaigns</h2>
            <span className="text-xs text-muted-foreground">{campaigns.length} live</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-video bg-surface-1 border border-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No active campaigns yet"
              copy="New paid campaigns drop weekly. Check back soon."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campaigns.map((c) => (
                <Link
                  key={c.id}
                  to={c.slug ? `/campaign/${c.slug}` : `/hub`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-surface-1 hover:border-gold/50 transition-colors"
                >
                  <div className="relative aspect-video overflow-hidden bg-surface-0">
                    {c.cover_image_url ? (
                      <img
                        src={c.cover_image_url}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-1 to-surface-0">
                        <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {c.budget_cents && c.budget_cents > 0 && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500/90 backdrop-blur rounded-md text-[11px] font-display text-white">
                        {formatMoney(c.budget_cents)} pool
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] text-muted-foreground tracking-wider uppercase mb-1">
                      {c.client_name || 'Loopgate'}
                    </p>
                    <h3 className="font-display text-base mb-1 line-clamp-1">{c.name}</h3>
                    {c.goal_label && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{c.goal_label}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Inspiration feed */}
        <section className="pb-20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl">Inspo Feed</h2>
            <span className="text-xs text-muted-foreground">Top clipper edits</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[9/16] bg-surface-1 border border-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : edits.length === 0 ? (
            <EmptyState
              icon={Film}
              title="No clips yet"
              copy="Be the first to drop a clip on a campaign."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {edits.map((e) => (
                <a
                  key={e.id}
                  href={e.video_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-[9/16] overflow-hidden rounded-lg border border-border bg-surface-1"
                >
                  {e.thumbnail_url ? (
                    <img
                      src={e.thumbnail_url}
                      alt={e.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-0">
                      <Film className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[11px] text-white/90 font-medium line-clamp-1">
                      @{e.editor_username || 'clipper'}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-white/70">
                      <span>{formatViews(e.view_count || 0)} views</span>
                      {e.platform && <span>· {e.platform}</span>}
                    </div>
                  </div>
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3 text-white" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="bg-surface-1 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${tint}`} />
        <span className="text-[10px] text-muted-foreground tracking-wider uppercase">{label}</span>
      </div>
      <div className={`font-display text-2xl ${tint}`}>{value}</div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Sparkles;
  title: string;
  copy: string;
}) {
  return (
    <div className="bg-surface-1 border border-border rounded-xl p-8 text-center">
      <Icon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
      <p className="font-display text-base mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{copy}</p>
    </div>
  );
}