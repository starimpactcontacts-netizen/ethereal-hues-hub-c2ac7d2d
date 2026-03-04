import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, ArrowRight, Wallet, ChevronRight, Eye, Crosshair, Flame, Plus } from 'lucide-react';
import { useCommissions, useEditorEarnings, type Commission } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { InfinityLoop } from '@/components/loopgate/InfinityLoop';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useRef, useCallback } from 'react';

interface ArenaDrop {
  id: string;
  song_name: string;
  poster_url: string | null;
  status: string;
  arena_eligible: boolean;
  prize_usd: number;
  custom_payouts: Record<string, number> | null;
  views_milestone: number;
  views_bonus_cents: number;
  artist_name: string | null;
  artist_avatar: string | null;
}

/* ── Balance Ticker ── */
function BalanceTicker() {
  const { user } = useAuth();
  const { availableBalance, earnings } = useEditorEarnings();
  if (!user) return null;

  return (
    <Link to="/payouts">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="relative overflow-hidden rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/60 via-background to-background" />
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500" />
        <div className="relative flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="font-display text-xl text-emerald-400 leading-none">${(availableBalance / 100).toFixed(2)}</span>
            {earnings.earnings_cents > 0 && (
              <span className="text-[8px] text-emerald-400/30 font-bold">${(earnings.earnings_cents / 100).toFixed(0)} EARNED</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-emerald-400/50 group-hover:text-emerald-400 text-[8px] font-bold tracking-widest uppercase transition-colors">
            WITHDRAW <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ── Mission Card (GTA-style drop card) ── */
function MissionCard({ drop }: { drop: ArenaDrop }) {
  const payouts = drop.custom_payouts || { S: 500, A: 300, B: 100 };
  const sRate = ((payouts.S || 500) / 100);
  const aRate = ((payouts.A || 300) / 100);
  const bRate = ((payouts.B || 100) / 100);
  const hasViewsBonus = drop.views_milestone > 0 && drop.views_bonus_cents > 0;

  return (
    <Link to="/solo-arena" className="shrink-0">
      <motion.div
        whileHover={{ scale: 1.02, y: -3 }}
        whileTap={{ scale: 0.97 }}
        className="relative w-[260px] sm:w-[280px] h-[340px] rounded-none overflow-hidden group cursor-pointer border border-foreground/[0.06]"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)' }}
      >
        {/* Cover */}
        {drop.poster_url ? (
          <img src={drop.poster_url} alt={drop.song_name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-1 to-background" />
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        
        {/* Scan lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />

        {/* Top strip - status */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 border-l-2 border-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live Mission</span>
          </div>
          {drop.prize_usd > 0 && (
            <div className="bg-emerald-500/20 backdrop-blur-sm px-2 py-1 border border-emerald-500/30">
              <span className="text-[9px] font-black text-emerald-400">${drop.prize_usd} PRIZE</span>
            </div>
          )}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* Views bonus badge */}
          {hasViewsBonus && (
            <div className="flex items-center gap-1.5 mb-2 bg-amber-500/10 border border-amber-500/20 px-2 py-1 w-fit">
              <Eye className="w-3 h-3 text-amber-400" />
              <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider">
                {(drop.views_milestone / 1000).toFixed(0)}K views = +${(drop.views_bonus_cents / 100).toFixed(0)} bonus
              </span>
              <span className="text-[7px] text-amber-400/40 ml-1">C+ only</span>
            </div>
          )}

          {/* Song info */}
          <div className="mb-3">
            {drop.artist_name && (
              <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.15em] mb-0.5">{drop.artist_name}</p>
            )}
            <h4 className="font-display text-lg text-foreground leading-tight tracking-wide truncate">{drop.song_name}</h4>
          </div>

          {/* Payout tiers - horizontal strip */}
          <div className="flex items-stretch gap-0 mb-3 h-[36px]">
            {/* S tier */}
            <div className="flex-1 bg-amber-500/15 border border-amber-500/25 border-r-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-amber-400 leading-none">S</span>
              <span className="text-[9px] font-bold text-emerald-400 leading-none mt-0.5">${sRate}</span>
            </div>
            {/* A tier */}
            <div className="flex-1 bg-emerald-500/10 border-y border-emerald-500/20 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-emerald-400 leading-none">A</span>
              <span className="text-[9px] font-bold text-emerald-400 leading-none mt-0.5">${aRate}</span>
            </div>
            {/* B tier */}
            <div className="flex-1 bg-blue-500/10 border border-blue-500/20 border-l-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-blue-400 leading-none">B</span>
              <span className="text-[9px] font-bold text-emerald-400 leading-none mt-0.5">${bRate}</span>
            </div>
            {/* C-F */}
            <div className="flex-1 bg-foreground/[0.03] border border-foreground/[0.06] border-l-0 flex flex-col items-center justify-center">
              <span className="text-[8px] font-bold text-foreground/20 leading-none">C-F</span>
              <span className="text-[8px] font-medium text-foreground/15 leading-none mt-0.5">IDX</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-3 h-3 text-emerald-400/60" />
              <span className="text-[8px] font-bold text-foreground/30 uppercase tracking-wider">Edit & Submit</span>
            </div>
            <motion.div
              whileHover={{ x: 2 }}
              className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 group-hover:bg-emerald-500/30 transition-all"
            >
              <span className="text-[9px] font-black text-emerald-400 tracking-widest">GO</span>
              <ChevronRight className="w-3 h-3 text-emerald-400" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ── Quick Bounty Card (marketplace bounties) ── */
function QuickBountyCard({ commission }: { commission: any }) {
  const payout = ((commission.payout_cents || 0) / 100).toFixed(0);
  const slotsLeft = (commission.max_slots || 1) - (commission.accepted_count || 0);
  const isDead = commission.status === 'filled' || slotsLeft <= 0;

  if (isDead) return null;

  return (
    <Link to={`/commissions/${commission.id}`} className="shrink-0">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-[160px] overflow-hidden border border-border/30 hover:border-emerald-500/30 transition-all"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
      >
        {commission.cover_url ? (
          <div className="relative h-16">
            <img src={commission.cover_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-1 to-transparent" />
            <div className="absolute bottom-1 left-2">
              <span className="font-display text-base text-emerald-400">${payout}</span>
            </div>
          </div>
        ) : (
          <div className="px-2.5 pt-2">
            <span className="font-display text-lg text-emerald-400">${payout}</span>
          </div>
        )}
        <div className="px-2.5 pb-2 pt-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[7px] font-bold text-emerald-400/50 bg-emerald-500/10 px-1 py-0.5 uppercase tracking-widest">{slotsLeft} left</span>
          </div>
          <h4 className="text-[10px] font-bold text-foreground/70 truncate">{commission.title}</h4>
          {commission.poster_username && commission.is_marketplace && (
            <p className="text-[8px] text-foreground/30 truncate mt-0.5">@{commission.poster_username}</p>
          )}
          {commission.artist_name && !commission.is_marketplace && (
            <p className="text-[8px] text-foreground/30 truncate mt-0.5">{commission.artist_name}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

/* ── Main Section ── */
export default function CommissionsSection() {
  const { commissions, loading: commLoading } = useCommissions();
  const [marketplaceBounties, setMarketplaceBounties] = useState<any[]>([]);
  const [drops, setDrops] = useState<ArenaDrop[]>([]);
  const [loadingDrops, setLoadingDrops] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch marketplace bounties
  useEffect(() => {
    supabase
      .from('commissions')
      .select('id, title, payout_cents, max_slots, accepted_count, status, artist_name, poster_username, cover_url, is_marketplace')
      .eq('is_marketplace', true)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (data) setMarketplaceBounties(data);
      });
  }, []);

  // Fetch arena-eligible drops
  useEffect(() => {
    const fetchDrops = async () => {
      const { data } = await supabase
        .from('featured_drops')
        .select('id, song_name, poster_url, status, arena_eligible, prize_usd, custom_payouts, views_milestone, views_bonus_cents, artist_id')
        .in('status', ['active', 'open', 'live'])
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        // Fetch artist names
        const artistIds = [...new Set(data.map(d => d.artist_id).filter(Boolean))];
        let artistMap: Record<string, { name: string; avatar_url: string | null }> = {};
        
        if (artistIds.length > 0) {
          const { data: artists } = await supabase
            .from('featured_artists')
            .select('id, name, avatar_url')
            .in('id', artistIds);
          if (artists) {
            artists.forEach(a => { artistMap[a.id] = { name: a.name, avatar_url: a.avatar_url }; });
          }
        }

        setDrops(data.map(d => ({
          id: d.id,
          song_name: d.song_name,
          poster_url: d.poster_url,
          status: d.status || 'live',
          arena_eligible: d.arena_eligible ?? false,
          prize_usd: d.prize_usd || 0,
          custom_payouts: d.custom_payouts as Record<string, number> | null,
          views_milestone: (d as any).views_milestone || 0,
          views_bonus_cents: (d as any).views_bonus_cents || 0,
          artist_name: d.artist_id ? artistMap[d.artist_id]?.name || null : null,
          artist_avatar: d.artist_id ? artistMap[d.artist_id]?.avatar_url || null : null,
        })));
      }
      setLoadingDrops(false);
    };
    fetchDrops();
  }, []);

  // Merge and deduplicate: staff commissions (non-marketplace) + marketplace bounties
  const staffCommissions = commissions.filter(c => c.status === 'open' && !(c as any).is_marketplace && (!c.deadline || new Date(c.deadline) > new Date()));
  const openCommissions = [...staffCommissions, ...marketplaceBounties];
  const loading = commLoading || loadingDrops;

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="mt-3 relative"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 blur-lg bg-emerald-500/20 scale-150" />
            <InfinityLoop size={20} className="relative" />
          </div>
          <h3 className="font-display text-base text-foreground tracking-wide">GET PAID</h3>
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-sm">
            <Flame className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[7px] font-black text-emerald-400 uppercase tracking-[0.15em]">{drops.length} Live</span>
          </div>
        </div>
        <Link to="/solo-arena" className="text-[9px] text-foreground/30 hover:text-emerald-400 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider">
          Arena <ArrowRight size={10} />
        </Link>
      </div>

      <div className="px-4 space-y-2.5">
        {/* Balance */}
        <BalanceTicker />

        {/* Mission Board - Featured Drops Carousel */}
        {drops.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-full h-[1px] bg-gradient-to-r from-emerald-500/30 via-emerald-500/10 to-transparent" />
              <span className="text-[7px] font-black text-emerald-400/40 uppercase tracking-[0.25em] whitespace-nowrap">Missions</span>
              <div className="w-8 h-[1px] bg-emerald-500/10" />
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4" ref={scrollRef}>
              <div className="flex gap-2.5 pb-2">
                {drops.map(drop => (
                  <MissionCard key={drop.id} drop={drop} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Marketplace — Coming Soon */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-full h-[1px] bg-gradient-to-r from-foreground/10 to-transparent" />
            <span className="text-[7px] font-black text-foreground/20 uppercase tracking-[0.25em] whitespace-nowrap">Marketplace</span>
            <div className="w-8 h-[1px] bg-foreground/5" />
          </div>
          <div className="relative overflow-hidden rounded-sm border border-dashed border-foreground/[0.06] px-4 py-5 flex flex-col items-center justify-center gap-1.5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent" />
            <span className="text-[10px] font-black text-foreground/25 uppercase tracking-[0.2em]">Coming Soon</span>
            <span className="text-[8px] text-foreground/15 max-w-[200px] text-center leading-relaxed">Post bounties, hire editors, and trade work — all on-platform.</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
