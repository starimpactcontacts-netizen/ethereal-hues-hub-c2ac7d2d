import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, ArrowRight, Wallet, ChevronRight, Eye, Crosshair, Flame, Plus } from 'lucide-react';
import { useCommissions, useEditorEarnings, type Commission } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { InfinityLoop } from '@/components/loopgate/InfinityLoop';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useRef, useCallback } from 'react';
import WalletDrawer from './WalletDrawer';

interface ArenaDrop {
  id: string;
  song_name: string;
  poster_url: string | null;
  status: string;
  prize_usd: number;
  mission_live: boolean;
  mission_custom_payouts: Record<string, number> | null;
  mission_views_milestone: number;
  mission_views_bonus_cents: number;
  artist_name: string | null;
  artist_avatar: string | null;
  instant_payout: boolean;
}

/* ── Balance Ticker ── */
function BalanceTicker() {
  const { user } = useAuth();
  const { availableBalance, earnings } = useEditorEarnings();
  const [walletOpen, setWalletOpen] = useState(false);
  if (!user) return null;

  return (
    <>
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
          <button
            onClick={() => setWalletOpen(true)}
            className="flex items-center gap-1 text-emerald-400/50 group-hover:text-emerald-400 text-[8px] font-bold tracking-widest uppercase transition-colors bg-transparent border-none cursor-pointer"
          >
            WITHDRAW <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
      <WalletDrawer open={walletOpen} onClose={() => setWalletOpen(false)} />
    </>
  );
}

/* ── Mission Card (GTA-style drop card) ── */
function MissionCard({ drop }: { drop: ArenaDrop }) {
  const payouts = drop.mission_custom_payouts || {};
  const sRate = ((payouts.S || 0) / 100);
  const aRate = ((payouts.A || 0) / 100);
  const bRate = ((payouts.B || 0) / 100);
  const maxPay = Math.max(sRate, aRate, bRate);

  return (
    <Link to={`/mission/${drop.id}`} className="shrink-0">
      <motion.div
        whileTap={{ scale: 0.96 }}
        className="relative w-[280px] h-[400px] overflow-hidden group cursor-pointer"
      >
        {/* Full bleed cover */}
        {drop.poster_url ? (
          <img src={drop.poster_url} alt={drop.song_name} className="absolute inset-0 w-full h-full object-cover scale-[1.02] group-hover:scale-[1.08] transition-transform duration-1000 ease-out" />
        ) : (
          <div className="absolute inset-0 bg-surface-2" />
        )}

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[65%] bg-gradient-to-t from-black to-transparent" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 4px)' }} />
        
        {/* Hard border */}
        <div className="absolute inset-0 border-2 border-foreground/[0.06] group-hover:border-red-500/40 transition-colors" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/60 via-red-500 to-red-500/60 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Corner cut */}
        <div className="absolute bottom-0 right-0 w-7 h-7 bg-background" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />

        {/* 24H PAY ribbon */}
        {drop.instant_payout && (
          <div className="absolute top-3 right-0 z-10 bg-red-600 text-white text-[7px] font-black uppercase tracking-wider pl-3 pr-2 py-1">
            24H PAY
          </div>
        )}

        {/* Top left — LIVE + Max payout */}
        <div className="absolute top-0 left-0 z-10 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2 py-1 border-l-2 border-emerald-500 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/60" />
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.25em]">Live Mission</span>
          </div>
          {maxPay > 0 && (
            <div className="bg-black/70 backdrop-blur-sm px-2 py-1 w-fit">
              <span className="font-display text-4xl text-emerald-400 leading-none drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">${maxPay}</span>
            </div>
          )}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pb-4">
          {drop.artist_name && (
            <p className="text-[9px] font-black text-foreground/50 uppercase tracking-[0.2em] mb-0.5">{drop.artist_name}</p>
          )}
          <h4 className="font-display text-2xl text-foreground leading-none tracking-wider truncate mb-3">{drop.song_name}</h4>

          {/* Rating tiers with QOI */}
          <div className="flex items-stretch gap-[1px] mb-3 bg-black/40 backdrop-blur-sm">
            {[
              { rank: 'S', color: 'text-amber-400 bg-amber-500/25 border-amber-500/50', pay: sRate, qoi: '90+' },
              { rank: 'A', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40', pay: aRate, qoi: '75+' },
              { rank: 'B', color: 'text-blue-400 bg-blue-500/20 border-blue-500/40', pay: bRate, qoi: '60+' },
              { rank: 'C-F', color: 'text-foreground/25 bg-foreground/[0.04] border-foreground/10', pay: 0, qoi: '<60' },
            ].map(tier => (
              <div key={tier.rank} className={`flex-1 border ${tier.color} py-2 flex flex-col items-center gap-0.5`}>
                <span className="text-[11px] font-black leading-none">{tier.rank}</span>
                <span className={`text-[8px] font-black leading-none ${tier.pay > 0 ? 'text-white' : 'text-foreground/15'}`}>
                  {tier.pay > 0 ? `$${tier.pay}` : 'IDX'}
                </span>
                <span className="text-[6px] font-bold text-foreground/20 uppercase">QOI {tier.qoi}</span>
              </div>
            ))}
          </div>

          {/* CTA — Fortnite-style skewed button */}
          <div className="relative overflow-hidden bg-red-600 group-hover:bg-red-500 active:bg-red-400 transition-colors flex items-center justify-center gap-3 py-4 -mx-3 -mb-4">
            <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.14] to-transparent pointer-events-none" />
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center relative z-10 border border-white/20">
              <Crosshair className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[20px] font-bold text-white uppercase tracking-wider relative z-10" style={{ fontFamily: 'Teko, sans-serif' }}>
              Enter Mission
            </span>
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
        .select('id, song_name, poster_url, status, prize_usd, mission_live, mission_custom_payouts, mission_views_milestone, mission_views_bonus_cents, instant_payout, artist_id')
        .eq('mission_live', true)
        .order('created_at', { ascending: false });

      const rows = (data || []) as any[];
      if (rows.length > 0) {
        // Fetch artist names
        const artistIds = [...new Set(rows.map(d => d.artist_id).filter(Boolean))];
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

        setDrops(rows.map((d: any) => ({
          id: d.id,
          song_name: d.song_name,
          poster_url: d.poster_url,
          status: d.status || 'live',
          prize_usd: d.prize_usd || 0,
          mission_live: d.mission_live ?? false,
          mission_custom_payouts: d.mission_custom_payouts as Record<string, number> | null,
          mission_views_milestone: d.mission_views_milestone || 0,
          mission_views_bonus_cents: d.mission_views_bonus_cents || 0,
          artist_name: d.artist_id ? artistMap[d.artist_id]?.name || null : null,
          artist_avatar: d.artist_id ? artistMap[d.artist_id]?.avatar_url || null : null,
          instant_payout: d.instant_payout ?? false,
        })));
      } else {
        setDrops([]);
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
