import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Infinity as InfinityIcon, ChevronRight, Users, Trophy, 
  Flame, Calendar, Target, Shield, Swords,
  Search, X, TrendingUp, Plus, HelpCircle, CheckCircle2, Info,
  Clock, Award, UserPlus, Eye, Globe, Crown, Zap, UserRound,
  Sparkles, Star, Music, Mail, ArrowRight, History, Play, Loader2,
  Clapperboard, ChevronDown, Crosshair, DollarSign, Shuffle
} from "lucide-react";
import { InfinityLoop } from "@/components/loopgate/InfinityLoop";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoopMonster from "@/components/loopgate/LoopMonster";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import SoloModeFlow from "@/components/loopgate/SoloModeFlow";
import SoloShowcase from "@/components/loopgate/SoloShowcase";
import SanctionedTournamentCard from "@/components/loopgate/SanctionedTournamentCard";
import BattleCard from "@/components/loopgate/BattleCard";
import CreateBattleModal from "@/components/loopgate/CreateBattleModal";
import { useSanctionedTournaments } from "@/hooks/useSanctionedTournaments";
import { useBattles } from "@/hooks/useBattles";
import { useRecentQuickFights, findQuickFight, leaveQueue } from "@/hooks/useQuickFight";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FeaturedDropCard from "@/components/loopgate/FeaturedDropCard";
import { useFeaturedDrops } from "@/hooks/useFeaturedDrops";
import { useSoloMode } from "@/hooks/useSoloMode";
import { useMyQuickFights } from "@/hooks/useQuickFight";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import EmailNotificationSettings from "@/components/loopgate/EmailNotificationSettings";
import LiveWinnersTicker from "@/components/loopgate/LiveWinnersTicker";
import LivePayoutsCarousel from "@/components/loopgate/LivePayoutsCarousel";
import ArenaCompetitionsSection from "@/components/loopgate/ArenaCompetitionsSection";


interface Event {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  start_date: string;
  end_date: string;
  poster_url: string | null;
  prize_pool: string | null;
  league: string;
  event_mode: string | null;
  xp_reward: number | null;
}

// ─── Arena Missions Carousel (GET PAID) ────────────────────────
interface ArenaMission {
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
  instant_payout: boolean;
}

function ArenaMissionCard({ drop }: { drop: ArenaMission }) {
  const navigate = useNavigate();
  const payouts = drop.mission_custom_payouts || {};
  const sRate = ((payouts.S || 0) / 100);
  const aRate = ((payouts.A || 0) / 100);
  const bRate = ((payouts.B || 0) / 100);
  const maxPay = Math.max(sRate, aRate, bRate);

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/mission/${drop.id}`)}
      className="shrink-0 relative w-[280px] h-[380px] overflow-hidden group text-left touch-manipulation"
      style={{ 
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
    >
      {/* Full bleed cover */}
      {drop.poster_url ? (
        <img src={drop.poster_url} alt={drop.song_name} className="absolute inset-0 w-full h-full object-cover scale-[1.02] group-hover:scale-[1.08] transition-transform duration-1000 ease-out" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" />
      )}

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
      <div className="absolute bottom-0 left-0 right-0 h-[65%] bg-gradient-to-t from-black to-transparent" />
      
      {/* Scanline effect */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 4px)' }} />
      
      {/* Top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Hard border edges */}
      <div className="absolute inset-0 border border-white/[0.04] group-hover:border-red-500/30 transition-colors duration-500" />

      {/* Corner cut decoration */}
      <div className="absolute bottom-0 right-0 w-8 h-8 bg-black" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />

      {/* 24H PAY ribbon */}
      {drop.instant_payout && (
        <div className="absolute top-3 right-0 z-10 bg-gradient-to-r from-red-600 to-red-500 text-white text-[7px] font-black uppercase tracking-wider pl-3 pr-2 py-1 shadow-lg shadow-red-900/50">
          24H PAY
        </div>
      )}

      {/* Top left — LIVE badge + Max payout with glow */}
      <div className="absolute top-0 left-0 z-10 p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1.5 border-l-2 border-emerald-500 w-fit shadow-lg shadow-emerald-900/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/60" />
          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.25em]">Live Mission</span>
        </div>
        {maxPay > 0 && (
          <div className="bg-black/90 backdrop-blur-md px-3 py-2 w-fit shadow-2xl shadow-emerald-900/40 border border-emerald-500/10">
            <span className="font-display text-3xl text-emerald-400 leading-none" 
              style={{ 
                textShadow: '0 0 20px rgba(52, 211, 153, 0.4), 0 0 40px rgba(52, 211, 153, 0.2)',
              }}>
              ${maxPay}
            </span>
          </div>
        )}
      </div>

      {/* Bottom content block */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pb-4">
        {/* Artist + Song */}
        {drop.artist_name && (
          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5">{drop.artist_name}</p>
        )}
        <h4 className="font-display text-2xl text-white leading-none tracking-wider truncate mb-3 drop-shadow-2xl">{drop.song_name}</h4>

        {/* Rating tiers with QOI scores */}
        <div className="flex items-stretch gap-[1px] mb-3 bg-black/60 backdrop-blur-sm shadow-xl">
          {[
            { rank: 'S', color: 'text-amber-400 bg-amber-500/20 border-amber-500/40', pay: sRate, qoi: '90+', glow: 'shadow-amber-500/20' },
            { rank: 'A', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', pay: aRate, qoi: '75+', glow: 'shadow-emerald-500/15' },
            { rank: 'B', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30', pay: bRate, qoi: '60+', glow: 'shadow-blue-500/15' },
            { rank: 'C-F', color: 'text-white/20 bg-white/[0.02] border-white/5', pay: 0, qoi: '<60', glow: '' },
          ].map(tier => (
            <div key={tier.rank} className={`flex-1 border ${tier.color} ${tier.glow} py-2.5 flex flex-col items-center gap-0.5`}>
              <span className="text-[11px] font-black leading-none">{tier.rank}</span>
              <span className={`text-[8px] font-black leading-none ${tier.pay > 0 ? 'text-white' : 'text-white/10'}`}>
                {tier.pay > 0 ? `$${tier.pay}` : 'IDX'}
              </span>
              <span className="text-[6px] font-bold text-white/15 uppercase">QOI {tier.qoi}</span>
            </div>
          ))}
        </div>

        {/* CTA — Fortnite-style skewed button with glow */}
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-red-600 group-hover:from-red-500 group-hover:via-red-400 group-hover:to-red-500 active:from-red-700 active:via-red-600 active:to-red-700 transition-all flex items-center justify-center gap-3 py-4 -mx-3 -mb-4 shadow-2xl shadow-red-900/60">
          <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.16] to-transparent pointer-events-none" />
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-white/25 to-white/5 flex items-center justify-center relative z-10 border border-white/20 shadow-lg">
            <Crosshair className="w-3.5 h-3.5 text-white drop-shadow-lg" />
          </div>
          <span className="text-[20px] font-bold text-white uppercase tracking-wider relative z-10 drop-shadow-lg" style={{ fontFamily: 'Teko, sans-serif' }}>
            Enter Mission
          </span>
        </div>
      </div>

      {/* Outer glow on hover */}
      <div className="absolute -inset-px bg-gradient-to-br from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/20 group-hover:via-red-500/10 group-hover:to-red-500/20 transition-all duration-500 -z-10 blur-2xl" />
    </motion.button>
  );
}

function ArenaMissionsCarousel() {
  const [drops, setDrops] = useState<ArenaMission[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('featured_drops')
        .select('id, song_name, poster_url, status, prize_usd, mission_live, mission_custom_payouts, mission_views_milestone, mission_views_bonus_cents, instant_payout, artist_id')
        .eq('mission_live', true)
        .order('created_at', { ascending: false });

      const rows = (data || []) as any[];
      if (rows.length === 0) {
        setDrops([]);
        return;
      }

      const artistIds = [...new Set(rows.map(d => d.artist_id).filter(Boolean))];
      let artistMap: Record<string, string> = {};
      if (artistIds.length > 0) {
        const { data: artists } = await supabase.from('featured_artists').select('id, name').in('id', artistIds);
        if (artists) artists.forEach(a => { artistMap[a.id] = a.name; });
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
        artist_name: d.artist_id ? artistMap[d.artist_id] || null : null,
        instant_payout: d.instant_payout ?? false,
      })));
    };
    fetch();
  }, []);

  if (drops.length === 0) return null;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <InfinityLoop size={14} />
          <span className="text-[10px] font-black text-foreground uppercase tracking-wider">Get Paid</span>
          <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5">{drops.length} live</span>
        </div>
        <Link to="/solo-arena" className="text-[9px] text-muted-foreground hover:text-emerald-400 transition-colors flex items-center gap-0.5 font-bold">
          All <ChevronRight className="w-2.5 h-2.5" />
        </Link>
      </div>
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 pb-1">
          {drops.map(drop => (
            <ArenaMissionCard key={drop.id} drop={drop} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Arena Bounties Carousel ───────────────────────────────────
interface ArenaBounty {
  id: string;
  title: string;
  payout_cents: number;
  cover_url: string | null;
  poster_username: string | null;
  poster_avatar_url: string | null;
  poster_rating_avg: number;
  max_slots: number;
  accepted_count: number;
  artist_name: string | null;
}

function ArenaBountyCard({ bounty }: { bounty: ArenaBounty }) {
  const navigate = useNavigate();
  const payout = (bounty.payout_cents / 100).toFixed(0);
  const slotsLeft = bounty.max_slots - bounty.accepted_count;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/commissions/${bounty.id}`)}
      className="shrink-0 relative w-[160px] h-[180px] overflow-hidden group text-left touch-manipulation border border-foreground/[0.06]"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
    >
      {bounty.cover_url ? (
        <img src={bounty.cover_url} alt={bounty.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 to-background" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />

      {/* Top - price */}
      <div className="absolute top-0 left-0 right-0 px-2 py-1.5 flex items-center justify-between">
        <div className="bg-black/60 backdrop-blur-sm px-1.5 py-0.5 border-l-2 border-emerald-500">
          <span className="font-display text-base text-emerald-400">${payout}</span>
        </div>
        <span className="text-[7px] font-bold text-emerald-400/60 bg-emerald-500/10 px-1 py-0.5">{slotsLeft} left</span>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <h4 className="text-[11px] font-bold text-foreground leading-tight truncate">{bounty.title}</h4>
        <div className="flex items-center gap-1.5 mt-1">
          {bounty.poster_avatar_url ? (
            <img src={bounty.poster_avatar_url} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center">
              <span className="text-[6px] font-bold">{bounty.poster_username?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          <span className="text-[8px] text-foreground/40 truncate">@{bounty.poster_username}</span>
          {bounty.poster_rating_avg > 0 && (
            <div className="flex items-center gap-0.5 ml-auto">
              <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
              <span className="text-[7px] text-amber-400 font-bold">{bounty.poster_rating_avg.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function ArenaBountiesCarousel() {
  const [bounties, setBounties] = useState<ArenaBounty[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('commissions')
        .select('id, title, payout_cents, cover_url, poster_username, poster_avatar_url, poster_rating_avg, max_slots, accepted_count, artist_name')
        .eq('is_marketplace', true)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setBounties(data.map(d => ({
          ...d,
          cover_url: (d as any).cover_url || null,
          poster_username: (d as any).poster_username || null,
          poster_avatar_url: (d as any).poster_avatar_url || null,
          poster_rating_avg: (d as any).poster_rating_avg || 0,
        })) as ArenaBounty[]);
      }
    };
    fetch();
  }, []);

  // Always show — even empty, show the "Post Bounty" CTA

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-black text-foreground uppercase tracking-wider">Marketplace</span>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-sm border border-dashed border-foreground/[0.06] px-4 py-5 flex flex-col items-center justify-center gap-1.5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent" />
        <span className="text-[10px] font-black text-foreground/25 uppercase tracking-[0.2em]">Coming Soon</span>
        <span className="text-[8px] text-foreground/15 max-w-[200px] text-center leading-relaxed">Post bounties, hire editors, and trade work — all on-platform.</span>
      </div>
    </div>
  );
}

// ─── Compact Event Card ────────────────────────────────────────
function EventCard({ event }: { event: Event }) {
  const isLive = event.status === "live";
  const isClosed = event.status === "closed";
  return (
    <Link to={`/event/${(event as any).slug || event.id}`} className="block shrink-0 w-[240px]">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`bg-surface-1 border transition-all overflow-hidden group touch-manipulation ${isClosed ? 'border-border/30 opacity-50 grayscale' : 'border-border hover:border-gold/50'}`}
      >
        <div className="relative h-28 overflow-hidden">
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gold/20 to-surface-2 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-gold/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-transparent" />
          {isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">LIVE</span>
            </div>
          )}
          {event.prize_pool && (
            <div className="absolute top-2 right-2 bg-background/90 border border-gold/50 px-2 py-0.5">
              <span className="text-[11px] font-bold text-gold">{event.prize_pool}</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-[13px] font-bold text-foreground truncate" style={{ fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'none' }}>{event.title}</h3>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
            <span className="uppercase font-medium">{event.league}</span>
            {event.xp_reward && (
              <span className="text-gold flex items-center gap-0.5 font-semibold">
                <Flame className="w-3 h-3" /> +{event.xp_reward} XP
              </span>
            )}
          </div>
          <div className="mt-2">
            <CountdownTimer endDate={isLive ? event.end_date : event.start_date} label={isLive ? "Ends" : "Starts"} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Ghost Placeholder Slot ────────────────────────────────────
function GhostSlot({ icon, label, width = "w-[240px]", height = "h-44", accentColor = "border-border/40" }: {
  icon: React.ReactNode;
  label: string;
  width?: string;
  height?: string;
  accentColor?: string;
}) {
  return (
    <div className={`shrink-0 ${width} ${height} border border-dashed ${accentColor} bg-surface-0/40 flex flex-col items-center justify-center gap-2`}>
      <div className="w-8 h-8 bg-surface-2/60 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[11px] text-muted-foreground/40 font-medium">{label}</span>
    </div>
  );
}

// ─── Quick 1v1 Row Card ────────────────────────────────────────
function Quick1v1Row({ fight, onClick }: { fight: any; onClick: () => void }) {
  const statusMap: Record<string, { label: string; color: string }> = {
    waiting: { label: "OPEN", color: "text-amber-400" },
    active: { label: "LIVE", color: "text-red-400" },
    submitted: { label: "SUBMITTED", color: "text-sky-400" },
    judging: { label: "JUDGING", color: "text-purple-400" },
    completed: { label: "DONE", color: "text-emerald-400" },
    forfeited: { label: "FORFEIT", color: "text-muted-foreground" },
    cancelled: { label: "CANCELLED", color: "text-muted-foreground" },
  };
  const s = statusMap[fight.status] || statusMap.waiting;
  const isLive = fight.status === "active";

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all touch-manipulation text-left group"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <Avatar className="w-7 h-7 shrink-0" style={{ border: '1.5px solid rgba(255,255,255,0.08)' }}>
        <AvatarImage src={fight.player_1_avatar_url || ''} />
        <AvatarFallback className="bg-surface-2 text-foreground text-[9px] font-bold">
          {fight.player_1_username?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-[11px] font-semibold text-foreground truncate">{fight.player_1_username}</span>
        <span className="text-[9px] text-muted-foreground/40 shrink-0">vs</span>
        <span className="text-[11px] font-semibold text-foreground truncate">
          {fight.player_2_username || "—"}
        </span>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <div className="flex items-center gap-1">
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          <span className={`text-[9px] font-bold ${s.color}`}>{s.label}</span>
        </div>
        <span className="text-[9px] font-bold text-gold">+20 IDX</span>
      </div>
    </motion.button>
  );
}

// ─── Section Header — Stake-style ────────────────────────────────────────
function SectionHeader({ icon, title, badge, badgeColor = "text-emerald-400", action, infoText }: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeColor?: string;
  action?: React.ReactNode;
  infoText?: string;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const textColor = badgeColor.includes('text-') 
    ? badgeColor.split(' ').find(c => c.startsWith('text-')) || 'text-emerald-400'
    : 'text-emerald-400';
  return (
    <>
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            {icon}
            {badge && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ boxShadow: '0 0 6px currentColor' }} />
            )}
          </div>
          <span className="text-[15px] font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{title}</span>
          {badge && (
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 bg-current/10 border border-current/20 ${textColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {badge}
            </span>
          )}
          {infoText && (
            <button
              onClick={() => setShowInfo(v => !v)}
              className="w-5 h-5 rounded-full bg-surface-2 border border-border/40 flex items-center justify-center hover:bg-surface-1 transition-colors"
              aria-label={`How ${title} works`}
            >
              <Info className="w-3 h-3 text-muted-foreground/70" />
            </button>
          )}
        </div>
        {action}
      </div>
      <AnimatePresence>
        {showInfo && infoText && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-4 mb-3"
          >
            <div className="bg-surface-1 border border-border/40 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">{infoText}</p>
              <button onClick={() => setShowInfo(false)} className="shrink-0 p-0.5 hover:bg-surface-2 rounded">
                <X className="w-3 h-3 text-muted-foreground/50" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function ArenaPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "official" | "sanctioned" | "battles" | "quick">("all");

  const [showSoloMode, setShowSoloMode] = useState(() => searchParams.get('auto') === '1' && searchParams.get('mode') === 'solo');
  const [showCreateBattle, setShowCreateBattle] = useState(false);
  
  const [quickSearch, setQuickSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'quick' | 'battle' | 'solo' | 'practice' | 'drop'>((searchParams.get('mode') as any) || 'drop');
  const [userStats, setUserStats] = useState<{ wins: number; losses: number; streak: number; events: number } | null>(null);
  const [qfSearching, setQfSearching] = useState(false);
  const [qfElapsed, setQfElapsed] = useState(0);

  const { tournaments: sanctionedTournaments, loading: sanctionedLoading } = useSanctionedTournaments(["approved", "ready_up", "live", "bracket", "completed"]);
  const { battles, loading: battlesLoading } = useBattles(["pending", "active", "judging", "completed"]);
  
  const { fights: quickFights, loading: quickLoading } = useRecentQuickFights(100);
  const { liveDrops } = useFeaturedDrops();
  const { activeSolo, loading: soloLoading, cancelSolo } = useSoloMode();
  const { fights: myQuickFights, inQueue: qfInQueue } = useMyQuickFights();
  const [arenaView, setArenaView] = useState<'arena' | 'my'>(() => searchParams.get('tab') === 'my' ? 'my' : 'arena');
  const [emailInput, setEmailInput] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const qfActiveFight = useMemo(() => myQuickFights.find(f => f.status === 'active' || f.status === 'judging'), [myQuickFights]);
  const isQfSearching = qfSearching || qfInQueue;

  // Queue timer
  useEffect(() => {
    if (!isQfSearching) { setQfElapsed(0); return; }
    setQfElapsed(0);
    const t = setInterval(() => setQfElapsed(prev => prev + 1), 1000);
    return () => clearInterval(t);
  }, [isQfSearching]);

  // Auto-navigate on match found
  useEffect(() => {
    if (!isQfSearching) return;
    const matched = myQuickFights.find(f => f.status === 'active');
    if (matched) {
      toast.success('⚔️ Match found!');
      navigate(`/fight/${matched.id}`);
      setQfSearching(false);
    }
  }, [myQuickFights, isQfSearching]);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase.from("events").select("*").order("start_date", { ascending: true });
      if (!error && data) setEvents(data);
      setLoading(false);
    }
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [battlesRes, quickRes] = await Promise.all([
        supabase.from('battles').select('winner_id, status').or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`).eq('status', 'completed'),
        supabase.from('quick_fights').select('winner_id, status').or(`player_1_id.eq.${user.id},player_2_id.eq.${user.id}`).eq('status', 'completed'),
      ]);
      const allMatches = [...(battlesRes.data || []), ...(quickRes.data || [])];
      const wins = allMatches.filter(m => m.winner_id === user.id).length;
      const losses = allMatches.length - wins;
      let streak = 0;
      for (const m of allMatches) {
        if (m.winner_id === user.id) streak++;
        else break;
      }
      const [epRes, stRes, rpRes] = await Promise.all([
        supabase.from('event_participations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('sanctioned_tournament_participants').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('round_participations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      const totalEvents = (epRes.count || 0) + (stRes.count || 0) + (rpRes.count || 0) + allMatches.length;
      setUserStats({ wins, losses, streak, events: totalEvents });
    };
    fetchStats();
  }, [user]);

  const liveEvents = events.filter(e => e.status === "live");
  const upcomingEvents = events.filter(e => e.status === "upcoming" || e.status === "pending");
  const closedEvents = events.filter(e => e.status === "closed");
  const allActiveEvents = [...liveEvents, ...upcomingEvents, ...closedEvents];

  const liveBattles = battles.filter(b => b.status === "active" || b.status === "judging").length;
  const liveTournaments = sanctionedTournaments.filter(t => t.status === "live" || t.status === "bracket" || t.status === "ready_up").length;
  const liveQuick = quickFights.filter(f => f.status === "active" || f.status === "judging").length;
  const totalLive = liveEvents.length + liveBattles + liveTournaments + liveQuick;

  const featuredFight = useMemo(() => {
    const liveFights = quickFights.filter(f => f.status === 'active' || f.status === 'judging');
    if (liveFights.length > 0) return { type: 'quick' as const, data: liveFights[0] };
    const liveBattle = battles.find(b => b.status === 'active' || b.status === 'judging');
    if (liveBattle) return { type: 'battle' as const, data: liveBattle };
    return null;
  }, [quickFights, battles]);

  const filteredQuickFights = useMemo(() => {
    if (!quickSearch) return quickFights;
    const q = quickSearch.toLowerCase();
    return quickFights.filter(f =>
      f.player_1_username.toLowerCase().includes(q) ||
      (f.player_2_username || '').toLowerCase().includes(q)
    );
  }, [quickSearch, quickFights]);

  // My Arena computed values
  const myBattles = useMemo(() => battles.filter(b => 
    user && (b.challenger_id === user.id || b.opponent_id === user.id)
  ), [battles, user]);
  const myActiveQuickFights = useMemo(() => myQuickFights.filter(f => 
    f.status === 'active' || f.status === 'judging' || f.status === 'submitted'
  ), [myQuickFights]);
  const myCompletedQuickFights = useMemo(() => myQuickFights.filter(f => 
    f.status === 'completed'
  ), [myQuickFights]);

  const handleSaveEmail = async () => {
    if (!emailInput.trim() || !user) return;
    setSavingEmail(true);
    await supabase.auth.updateUser({ email: emailInput.trim() });
    toast.success("Email saved! You'll get notified about battles & drops.");
    setSavingEmail(false);
    setEmailInput("");
  };




  if (showSoloMode) {
    return <SoloModeFlow onBack={() => setShowSoloMode(false)} />;
  }

  const filters: { key: typeof activeFilter; label: string; icon?: React.ReactNode; accent?: string }[] = [
    { key: "all", label: "All" },
    { key: "battles", label: "1v1", icon: <Swords className="w-3.5 h-3.5" />, accent: "red" },
    { key: "official", label: "King of the Hill", icon: <Crown className="w-3.5 h-3.5" />, accent: "gold" },
    { key: "sanctioned", label: "Sanctioned", icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  const handleQuickFight = async () => {
    if (!user || !profile) { navigate('/start'); return; }
    if (qfActiveFight) { navigate(`/fight/${qfActiveFight.id}`); return; }
    setQfSearching(true);
    try {
      const fightId = await findQuickFight(user.id, profile.username, profile.avatar_url);
      if (fightId) {
        toast.success('⚔️ Match found!');
        navigate(`/fight/${fightId}`);
        setQfSearching(false);
      } else {
        toast('🔍 In queue — we\'ll notify you when matched!', { duration: 4000 });
      }
    } catch {
      toast.error('Matchmaking failed');
      setQfSearching(false);
    }
  };

  const handleCancelQueue = async () => {
    if (!user) return;
    await leaveQueue(user.id);
    setQfSearching(false);
    toast('Search cancelled', { duration: 2000 });
  };

  // Mode actions for the game lobby
  const modeActions: Record<string, () => void> = {
    quick: handleQuickFight,
    battle: () => profile ? setShowCreateBattle(true) : navigate('/start'),
    solo: () => profile ? setShowSoloMode(true) : navigate('/start'),
    
  };

  return (
    <div className="min-h-screen bg-black pb-32">
      <LoopMonster />

      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden border-b border-white/[0.02]">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-transparent to-transparent" />
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.03) 0%, transparent 50%)',
        }} />

        <div className="relative px-4 sm:px-6 lg:px-8 pt-3 pb-1 max-w-2xl mx-auto">
          {/* Title row — merged with stats */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-foreground flex items-center justify-center">
                <InfinityIcon className="w-5 h-5 text-background" strokeWidth={2.5} />
              </div>
              <h1 className="text-[22px] font-black text-foreground leading-none tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'none' }}>Arena</h1>
              {profile && (
                <div className="flex items-center gap-1.5 ml-1">
                  <Avatar className="w-5 h-5 border border-border">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="bg-surface-2 text-foreground text-[8px] font-bold">{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[80px]">{profile.username}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {profile && userStats && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-emerald-400 tabular-nums">{userStats.wins}W</span>
                  <span className="text-[11px] font-bold text-red-400 tabular-nums">{userStats.losses}L</span>
                </div>
              )}
              {totalLive > 0 && (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-red-400 tabular-nums">{totalLive}</span>
                </div>
              )}
              <button onClick={() => setShowSearch(s => !s)} className="p-1 hover:bg-surface-1 transition-colors">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Search — collapsible */}
          <AnimatePresence>
            {showSearch && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search battles, events, players..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    autoFocus
                    className="w-full h-7 pl-8 pr-8 bg-surface-1 border border-border text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/30 transition-colors"
                  />
                  {quickSearch && (
                    <button onClick={() => setQuickSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Arena / My Arena toggle — minimal underline style */}
          <div className="flex gap-4 mb-2 border-b border-border">
            <button
              onClick={() => setArenaView('arena')}
              className={`pb-1.5 text-[12px] font-bold transition-all relative ${
                arenaView === 'arena' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {arenaView === 'arena' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500" />}
              Arena
            </button>
            <button
              onClick={() => setArenaView('my')}
              className={`pb-1.5 text-[12px] font-bold transition-all relative ${
                arenaView === 'my' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {arenaView === 'my' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />}
              My Arena
              {(activeSolo || myBattles.length > 0 || myActiveQuickFights.length > 0) && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-gold animate-pulse inline-block" />
              )}
            </button>
          </div>

          {arenaView === 'my' ? (
            /* ═══════════════════════════════════════════════════
               MY ARENA — Personal dashboard
            ═══════════════════════════════════════════════════ */
            <div className="space-y-4 pb-4">
              {/* Profile Card */}
              {profile && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <Link to="/profile" className="block">
                    <div className="bg-surface-1 border border-border p-4 flex items-center gap-4 hover:border-foreground/20 transition-all">
                      <Avatar className="w-14 h-14 border-2 border-gold/40 shrink-0">
                        <AvatarImage src={profile.avatar_url || ''} />
                        <AvatarFallback className="bg-gold/10 text-gold text-lg font-bold">
                          {profile.username?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-black text-foreground truncate" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {profile.display_name || profile.username}
                        </p>
                        <p className="text-[11px] text-muted-foreground">@{profile.username}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {userStats && (
                            <>
                              <span className="text-[11px] font-bold text-emerald-400">{userStats.wins}W</span>
                              <span className="text-[11px] font-bold text-red-400">{userStats.losses}L</span>
                              {userStats.streak > 0 && (
                                <span className="text-[11px] font-bold text-gold flex items-center gap-0.5">
                                  <Flame className="w-3 h-3" />{userStats.streak}
                                </span>
                              )}
                              <span className="text-[11px] text-muted-foreground">{userStats.events} events</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                          {(profile as any).league || 'Open'}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-semibold tabular-nums">
                          Lv.{(profile as any).level || 1}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Active Solo Session */}
              {activeSolo && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bg-gradient-to-r from-gold/10 via-surface-1 to-gold/5 border border-gold/40 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gold/20 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gold font-bold uppercase tracking-wider">Active Solo Session</p>
                        <p className="text-sm text-foreground font-bold truncate">{activeSolo.theme}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          activeSolo.status === 'submitted' || activeSolo.status === 'judging' ? 'text-emerald-400' : 'text-gold'
                        }`}>
                          {activeSolo.status === 'submitted' ? '✅ Submitted' : activeSolo.status === 'judging' ? '⚖️ Judging' : '✏️ Editing'}
                        </span>
                        {activeSolo.status === 'editing' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const result = await cancelSolo(activeSolo.id);
                              if (!result?.success) {
                                toast.error("Couldn’t cancel this solo right now. Try again.");
                                return;
                              }
                              if (result.penalized) {
                                toast.error(`Solo cancelled — lost 2 Index (cancel #${result.cancelCount})`);
                              } else {
                                toast("Solo cancelled — first one's free!");
                              }
                            }}
                            className="p-1.5 hover:bg-destructive/10 transition-colors"
                          >
                            <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-1 border border-border px-3 py-2 mb-3">
                      <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[12px] text-foreground font-medium truncate">{activeSolo.song_name}</span>
                      {activeSolo.artist_name && (
                        <span className="text-[11px] text-muted-foreground">— {activeSolo.artist_name}</span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/studio?solo=${activeSolo.id}`)}
                      className="w-full bg-gold hover:bg-gold/90 transition-colors py-3 flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 text-background" />
                      <span className="text-[14px] font-black text-background tracking-tight" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                        {activeSolo.status === 'editing' ? 'CONTINUE EDITING' : 'VIEW SUBMISSION'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Open Editor — Studio CTA */}
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Link to="/studio" className="block">
                  <div className="group relative bg-surface-1 border border-border hover:border-foreground/20 transition-all overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#9999FF]/5 via-transparent to-[#9999FF]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4 p-4">
                      <div className="w-12 h-12 bg-[#9999FF]/10 border border-[#9999FF]/20 flex items-center justify-center shrink-0">
                        <Clapperboard className="w-6 h-6 text-[#9999FF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-black text-foreground tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Open Editor</p>
                        <p className="text-[11px] text-muted-foreground">Studio — create, edit & export</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#9999FF] transition-colors shrink-0" />
                    </div>
                  </div>
                </Link>
              </motion.div>

              {!activeSolo && profile && (
                <div className="bg-surface-1 border border-border p-4 text-center">
                  <Sparkles className="w-5 h-5 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-[12px] text-muted-foreground mb-3">No active solo — start one from the Arena tab</p>
                  <button onClick={() => { setArenaView('arena'); setShowSoloMode(true); }}
                    className="text-[12px] text-gold font-bold hover:underline">Start Solo Edit →</button>
                </div>
              )}

              {/* Active Quick Fights */}
              {myActiveQuickFights.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-red-400" />
                    <span className="text-[13px] font-bold text-foreground">Active Quick Fights</span>
                    <span className="text-[11px] text-red-400 font-semibold">{myActiveQuickFights.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {myActiveQuickFights.map(fight => (
                      <button key={fight.id} onClick={() => navigate(`/fight/${fight.id}`)}
                        className="w-full flex items-center gap-3 p-3 bg-surface-1 border border-red-500/30 hover:border-red-500/50 transition-all text-left">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                          <span className="text-[12px] font-bold text-foreground truncate">
                            {fight.player_1_username} vs {fight.player_2_username || '???'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-red-400 uppercase">{fight.status}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active 1v1 Battles */}
              {myBattles.filter(b => b.status !== 'completed').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Swords className="w-4 h-4 text-red-400" />
                    <span className="text-[13px] font-bold text-foreground">Active 1v1 Battles</span>
                  </div>
                  <div className="space-y-1.5">
                    {myBattles.filter(b => b.status !== 'completed').map(battle => (
                      <button key={battle.id} onClick={() => navigate(`/battle/${battle.id}`)}
                        className="w-full flex items-center gap-3 p-3 bg-surface-1 border border-border hover:border-red-500/40 transition-all text-left">
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-bold text-foreground truncate block">
                            {battle.challenger_username} vs {battle.opponent_username || '???'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{(battle as any).theme_song_name || 'No song'}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${
                          battle.status === 'active' ? 'text-red-400' : battle.status === 'judging' ? 'text-purple-400' : 'text-amber-400'
                        }`}>{battle.status}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Battle History */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[13px] font-bold text-foreground">Battle History</span>
                </div>
                {(myCompletedQuickFights.length + myBattles.filter(b => b.status === 'completed').length) > 0 ? (
                  <div className="space-y-1">
                    {myBattles.filter(b => b.status === 'completed').slice(0, 10).map(battle => (
                      <button key={battle.id} onClick={() => navigate(`/battle/${battle.id}`)}
                        className="w-full flex items-center gap-3 p-2.5 bg-surface-1 border border-border hover:border-border/80 transition-all text-left">
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] text-foreground truncate block">
                            {battle.challenger_username} vs {battle.opponent_username}
                          </span>
                        </div>
                        {battle.winner_id === user?.id ? (
                          <span className="text-[10px] font-bold text-emerald-400">WON</span>
                        ) : battle.winner_id ? (
                          <span className="text-[10px] font-bold text-red-400">LOST</span>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground">DRAW</span>
                        )}
                      </button>
                    ))}
                    {myCompletedQuickFights.slice(0, 10).map(fight => (
                      <button key={fight.id} onClick={() => navigate(`/fight/${fight.id}`)}
                        className="w-full flex items-center gap-3 p-2.5 bg-surface-1 border border-border hover:border-border/80 transition-all text-left">
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] text-foreground truncate block">
                            {fight.player_1_username} vs {fight.player_2_username}
                          </span>
                          <span className="text-[10px] text-muted-foreground">Quick 1v1</span>
                        </div>
                        {fight.winner_id === user?.id ? (
                          <span className="text-[10px] font-bold text-emerald-400">WON</span>
                        ) : fight.winner_id ? (
                          <span className="text-[10px] font-bold text-red-400">LOST</span>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground">—</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-1 border border-border p-6 text-center">
                    <p className="text-[12px] text-muted-foreground">No completed battles yet</p>
                  </div>
                )}
              </div>

              {/* Email Notification Settings */}
              <EmailNotificationSettings />
            </div>
          ) : (
          <>




          {/* ═══ GAME LOBBY — Dropdown + GO ═══ */}
          <div className="mb-1">
            <div className="flex gap-0 overflow-hidden border border-white/[0.06] shadow-xl shadow-black/60" style={{
              background: 'linear-gradient(to bottom, rgba(15,15,15,0.95), rgba(5,5,5,0.98))',
            }}>
              {/* Mode Dropdown */}
              <div className="flex-1 relative">
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value as typeof selectedMode)}
                  className="w-full appearance-none bg-transparent text-foreground text-[11px] font-black uppercase tracking-wider py-3 pl-3 pr-8 cursor-pointer focus:outline-none touch-manipulation"
                  style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}
                >
                  {liveDrops.length > 0 && (
                    <option value="drop">🔥 {liveDrops[0].title}{(liveDrops[0] as any).prize_usd > 0 ? ` — $${(liveDrops[0] as any).prize_usd} Prize` : ' — Submit Now'}</option>
                  )}
                  <option value="quick">⚡ Quick 1v1 — Auto · 3hr</option>
                  <option value="battle">⚔️ 1v1 Battle — Invite</option>
                  <option value="solo">👤 Solo Edit — Pick · Score</option>
                  
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>

              {/* GO Button - Stake-style with glow */}
              <motion.button
                whileTap={isQfSearching ? undefined : { scale: 0.95 }}
                onClick={() => {
                  if (isQfSearching) return;
                  if (selectedMode === 'drop' && liveDrops.length > 0) {
                    navigate('/studio');
                  } else if (selectedMode === 'quick' && qfActiveFight) {
                    modeActions.quick();
                  } else if (selectedMode !== 'drop') {
                    modeActions[selectedMode]();
                  }
                }}
                disabled={isQfSearching}
                className="relative overflow-hidden touch-manipulation transition-all min-h-[52px] px-8 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:via-red-400 hover:to-red-500"
                style={{
                  boxShadow: isQfSearching 
                    ? '0 0 20px rgba(245, 158, 11, 0.3)' 
                    : '0 0 30px rgba(239, 68, 68, 0.4), 0 0 60px rgba(239, 68, 68, 0.15)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
                {isQfSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin relative z-10" />
                    <span className="text-[13px] font-black tracking-tight uppercase text-amber-400 relative z-10" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                      {Math.floor(qfElapsed / 60)}:{(qfElapsed % 60).toString().padStart(2, '0')}
                    </span>
                  </>
                ) : qfActiveFight && selectedMode === 'quick' ? (
                  <>
                    <Zap className="w-4 h-4 text-white animate-pulse drop-shadow-lg relative z-10" />
                    <span className="text-[15px] font-black text-white relative z-10 tracking-tight uppercase drop-shadow-lg" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                      Return
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-white drop-shadow-lg relative z-10" />
                    <span className="text-[17px] font-black text-white relative z-10 tracking-tight uppercase drop-shadow-lg" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                      GO
                    </span>
                    {(selectedMode === 'quick' || selectedMode === 'battle') && (
                      <span className="text-[9px] text-white/50 font-bold relative z-10">+20 IDX</span>
                    )}
                    {selectedMode === 'solo' && (
                      <span className="text-[9px] text-white/50 font-bold relative z-10">100+ IDX</span>
                    )}
                    {selectedMode === 'drop' && liveDrops.length > 0 && (
                      <span className="text-[10px] font-bold relative z-10 text-emerald-300 drop-shadow">
                        {(liveDrops[0] as any).prize_usd > 0 ? `$${(liveDrops[0] as any).prize_usd}` : 'Earn IDX'}
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            </div>

            {/* Cancel queue - Stake-style */}
            {isQfSearching && (
              <motion.button
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleCancelQueue}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-t-0 border-white/[0.04] bg-black/80 text-muted-foreground text-[10px] font-bold uppercase tracking-wider hover:text-foreground hover:bg-amber-500/10 transition-all touch-manipulation backdrop-blur-sm"
              >
                <X className="w-3 h-3" />
                Cancel Search
              </motion.button>
            )}
          </div>

          {/* ═══ ENTER LOBBY — Live Drop CTA ═══ */}
          {liveDrops.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/drop/${liveDrops[0].id}`)}
              className="relative w-full overflow-hidden touch-manipulation group mb-3"
              style={{
                boxShadow: '0 0 40px rgba(239, 68, 68, 0.25), 0 0 80px rgba(239, 68, 68, 0.1)',
              }}
            >
              {/* Background - poster or gradient */}
              {(liveDrops[0] as any).poster_url ? (
                <div 
                  className="absolute inset-0 bg-cover bg-center scale-[1.05] group-hover:scale-[1.1] transition-transform duration-700"
                  style={{ backgroundImage: `url(${(liveDrops[0] as any).poster_url})` }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-background to-red-950/50" />
              )}
              
              {/* Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/90" />
              <div className="absolute inset-0 bg-gradient-to-t from-red-950/60 via-transparent to-red-950/30" />
              
              {/* Scanlines */}
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 3px)' }} />
              
              {/* Top edge glow */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
              
              {/* Content */}
              <div className="relative px-5 py-5 flex items-center gap-4">
                {/* Left - Live indicator + event info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">King of the Hill — Live</span>
                  </div>
                  <h3 className="text-[18px] font-black text-white leading-tight truncate tracking-tight" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                    {liveDrops[0].title}
                  </h3>
                  {(liveDrops[0] as any).prize_usd > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      <span className="text-[13px] font-black text-emerald-400">${(liveDrops[0] as any).prize_usd} Prize Pool</span>
                    </div>
                  )}
                </div>
                
                {/* Right - ENTER LOBBY button */}
                <div className="shrink-0">
                  <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-red-600 px-6 py-3 group-hover:from-red-500 group-hover:via-red-400 group-hover:to-red-500 transition-all shadow-xl shadow-red-900/50">
                    <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none" />
                    <div className="flex items-center gap-2 relative z-10">
                      <Users className="w-4 h-4 text-white drop-shadow-lg" />
                      <span className="text-[16px] font-black text-white uppercase tracking-wider drop-shadow-lg" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                        Submit Edit
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          )}

          {/* Featured fight promo — inline, only if no live drops */}
          {liveDrops.length === 0 && featuredFight && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (featuredFight.type === 'quick') navigate(`/fight/${featuredFight.data.id}`);
                else navigate(`/battle/${featuredFight.data.id}`);
              }}
              className="w-full flex items-center gap-2 px-1 py-1.5 mb-1 touch-manipulation group"
            >
              <div className="flex items-center gap-1.5 shrink-0">
                <Avatar className="w-5 h-5 border border-red-500/40">
                  <AvatarImage src={featuredFight.type === 'quick' ? featuredFight.data.player_1_avatar_url : (featuredFight.data as any).challenger_avatar_url} />
                  <AvatarFallback className="bg-surface-2 text-foreground text-[8px] font-bold">
                    {(featuredFight.type === 'quick' ? featuredFight.data.player_1_username : (featuredFight.data as any).challenger_username)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[8px] font-black text-muted-foreground/40">VS</span>
                <Avatar className="w-5 h-5 border border-blue-500/40">
                  <AvatarImage src={featuredFight.type === 'quick' ? featuredFight.data.player_2_avatar_url : (featuredFight.data as any).opponent_avatar_url} />
                  <AvatarFallback className="bg-surface-2 text-foreground text-[8px] font-bold">
                    {(featuredFight.type === 'quick' ? featuredFight.data.player_2_username : (featuredFight.data as any).opponent_username)?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] font-bold text-foreground truncate flex-1 group-hover:text-red-400 transition-colors">
                {featuredFight.type === 'quick' ? featuredFight.data.player_1_username : (featuredFight.data as any).challenger_username}
                {' vs '}
                {featuredFight.type === 'quick' ? (featuredFight.data.player_2_username || '???') : ((featuredFight.data as any).opponent_username || '???')}
              </span>
              <span className="text-[9px] text-gold font-semibold shrink-0">Watch →</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </motion.button>
          )}

          {/* search bar moved to top */}

          {/* ═══ COMPETITIONS — TOP ═══ */}
          {(activeFilter === "all") && (
            <ArenaCompetitionsSection onCreateClick={() => navigate(profile ? '/competition/create' : '/start')} />
          )}

          {/* ═══ MISSIONS CAROUSEL — GET PAID ═══ */}
          <ArenaMissionsCarousel />

          {/* ═══ LIVE PAYOUTS CAROUSEL ═══ */}
          <LivePayoutsCarousel />

          {/* Marketplace removed */}

          {/* ═══ FILTER PILLS — small rounded ═══ */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
            {filters.map(f => {
              const active = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all flex items-center gap-1 shrink-0 touch-manipulation ${
                    active
                      ? "bg-foreground text-background"
                      : "bg-surface-1 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.icon}
                  {f.label}
                </button>
              );
            })}
          </div>
          </>
          )}
        </div>
      </div>

      {/* Loading */}
      {arenaView === 'arena' && loading && (
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="h-48 w-[200px] shrink-0" />
            <Skeleton className="h-48 w-[200px] shrink-0" />
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      {arenaView === 'arena' && !loading && (
        <div className="mt-2 space-y-6">

          {/* King of the Hill — Featured Drops with leaderboard */}
          {(activeFilter === "all" || activeFilter === "official") && (
            <motion.section key="official-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<InfinityIcon className="w-4 h-4 text-gold" />}
                title="King of the Hill"
                infoText="30 edits decide the king. Stay #1 on the leaderboard each week to stack XP & Index. More submissions = bigger rewards for the reigning king — until the hill is taken."
                action={liveDrops.length > 0 ? (
                  <button
                    onClick={() => {
                      const random = liveDrops[Math.floor(Math.random() * liveDrops.length)];
                      if (random) navigate(`/drop/${random.id}`);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 hover:bg-emerald-500/20 transition-all active:scale-95"
                  >
                    <Shuffle className="w-3 h-3" />
                    Join Random
                  </button>
                ) : undefined}
              />
              {liveDrops.length > 0 ? (
                <div className="px-4 flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
                  {liveDrops.map(drop => (
                    <FeaturedDropCard key={drop.id} drop={drop} />
                  ))}
                </div>
              ) : (
                <div className="px-4">
                  <div className="bg-surface-1 border border-border border-dashed p-8 text-center">
                    <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                      <InfinityIcon className="w-6 h-6 text-gold/30" />
                    </div>
                    <p className="text-[13px] text-muted-foreground font-medium">No active King of the Hill</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-1">New hills drop weekly — stay tuned</p>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* Competitions moved to top */}

          {/* Quick 1v1s section removed — merged into 1v1 Edit Battles */}

          {/* 1v1 Battles */}
          {(activeFilter === "all" || activeFilter === "battles") && (
            <motion.section key="battles-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<Swords className="w-4 h-4 text-red-400" />}
                title="1v1 Edit Battles"
                infoText="Go head-to-head with another editor. Quick Match instantly pairs you with someone in queue. Challenge lets you pick your opponent, set a song & deadline. Winner earns +20 IDX."
                action={
                  <div className="flex items-center rounded-lg overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(16,185,129,0.2), 0 2px 12px rgba(239,68,68,0.15)' }}>
                    <button
                      onClick={handleQuickFight}
                      disabled={isQfSearching}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                    >
                      {isQfSearching ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      Quick
                    </button>
                    <div className="w-px h-5 bg-white/20" />
                    <button
                      onClick={() => profile ? setShowCreateBattle(true) : navigate('/start')}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-white transition-all hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #3B82F6, #EF4444)' }}
                    >
                      <Swords className="w-3 h-3" />
                      Challenge
                    </button>
                  </div>
                }
              />

              {/* Queue status bar */}
              {isQfSearching && (
                <div className="mx-4 mb-3 flex items-center justify-between px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span className="text-[11px] text-emerald-400 font-medium">Finding you an opponent...</span>
                  </div>
                  <button
                    onClick={handleCancelQueue}
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.05]"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {battlesLoading ? (
                <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2">
                  <Skeleton className="h-44 w-[200px] shrink-0" />
                  <Skeleton className="h-44 w-[200px] shrink-0" />
                </div>
              ) : battles.length > 0 ? (
                <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2">
                  {battles.slice(0, 10).map(battle => (
                    <BattleCard key={battle.id} battle={battle} onClick={() => navigate(`/battle/${battle.id}`)} />
                  ))}
                  {battles.length < 4 && Array.from({ length: Math.max(0, 3 - battles.length) }).map((_, i) => (
                    <GhostSlot key={`ghost-battle-${i}`} icon={<Swords className="w-4 h-4 text-muted-foreground/20" />} label="More battles" accentColor="border-red-500/15" />
                  ))}
                </div>
              ) : (
                <div className="px-4">
                  <div className="bg-surface-1 border border-red-500/15 border-dashed p-8 text-center">
                    <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                      <Swords className="w-6 h-6 text-red-400/30" />
                    </div>
                    <p className="text-[13px] text-muted-foreground font-medium mb-4">No active edit battles</p>
                    <Button
                      size="sm"
                      onClick={() => profile ? setShowCreateBattle(true) : navigate('/start')}
                      className="bg-red-500 hover:bg-red-600 text-white text-[12px] h-9 px-5"
                    >
                      <Swords className="w-3.5 h-3.5 mr-1.5" /> Create Battle
                    </Button>
                  </div>
                </div>
              )}

            </motion.section>
          )}

          {/* ═══ SOLO MODE SHOWCASE — at bottom ═══ */}
          {(activeFilter === "all") && (
            <SoloShowcase onStartSolo={() => setShowSoloMode(true)} />
          )}

          <div className="h-8" />
        </div>
      )}

      <CreateBattleModal
        isOpen={showCreateBattle}
        onClose={() => setShowCreateBattle(false)}
        onSuccess={(battleId) => { setShowCreateBattle(false); navigate(`/battle/${battleId}`); }}
      />

    </div>
  );
}
