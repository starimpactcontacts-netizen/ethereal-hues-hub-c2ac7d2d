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
import { useUserRoles } from "@/hooks/useUserRoles";
import LoopMonster from "@/components/loopgate/LoopMonster";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import SoloModeFlow from "@/components/loopgate/SoloModeFlow";
import SoloShowcase from "@/components/loopgate/SoloShowcase";
import SanctionedTournamentCard from "@/components/loopgate/SanctionedTournamentCard";
import BattleCard from "@/components/loopgate/BattleCard";
import CreateBattleModal from "@/components/loopgate/CreateBattleModal";
import { useSanctionedTournaments } from "@/hooks/useSanctionedTournaments";
import { useBattles } from "@/hooks/useBattles";
import { useRecentQuickFights, createQuickFightLobby, leaveQueue } from "@/hooks/useQuickFight";
import LiveBattleReminders, { type LiveBattleReminderItem } from "@/components/loopgate/LiveBattleReminder";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FeaturedDropCard from "@/components/loopgate/FeaturedDropCard";
import { useFeaturedDrops } from "@/hooks/useFeaturedDrops";
import RingsCoin from "@/components/loopgate/RingsCoin";
import { useSoloMode } from "@/hooks/useSoloMode";
import { useMyQuickFights } from "@/hooks/useQuickFight";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import EmailNotificationSettings from "@/components/loopgate/EmailNotificationSettings";
import LiveWinnersTicker from "@/components/loopgate/LiveWinnersTicker";
import ArenaCompetitionsSection from "@/components/loopgate/ArenaCompetitionsSection";
import ArenaCollabsSection from "@/components/loopgate/ArenaCollabsSection";
import { startQuickMatch } from "@/lib/startQuickMatch";
import CashBattlesSection from "@/components/loopgate/CashBattlesSection";
import CustomLobbyTypeModal from "@/components/loopgate/CustomLobbyTypeModal";
import { useMyCashBattles } from "@/hooks/useCashBattles";
import { ArenaRail, ArenaRailCard, ArenaRailSkeleton } from "@/components/loopgate/ArenaCarouselSystem";
import { useMyCompetitionReminders } from "@/hooks/useMyCompetitionReminders";
import ArenaQOITop from "@/components/loopgate/ArenaQOITop";
import MatchmakingLobby from "@/components/loopgate/MatchmakingLobby";

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

// ArenaMissionsCarousel removed — consolidated into ArenaMissionsSection

// ─── Arena Missions Section (Cinematic Poster Cards) ─────────────
function ArenaMissionsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;
  const [bounties, setBounties] = useState<any[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('commissions')
        .select('id, title, description, payout_cents, cover_url, poster_username, poster_avatar_url, poster_rating_avg, max_slots, accepted_count, artist_name, mission_type, client_name, submission_count, created_by, custom_payouts')
        .eq('is_marketplace', true)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setBounties(data);
    };
    fetch();
  }, []);

  const handleClose = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const { error } = await supabase.from('commissions').update({ status: 'closed' } as any).eq('id', id);
    if (!error) setBounties(prev => prev.filter(b => b.id !== id));
  };

  const TYPE_ACCENT: Record<string, { border: string; badge: string; badgeText: string; glow: string }> = {
    artist: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/20', badgeText: 'text-emerald-400', glow: 'shadow-emerald-900/30' },
    brand: { border: 'border-blue-500/30', badge: 'bg-blue-500/20', badgeText: 'text-blue-400', glow: 'shadow-blue-900/30' },
    film: { border: 'border-purple-500/30', badge: 'bg-purple-500/20', badgeText: 'text-purple-400', glow: 'shadow-purple-900/30' },
    standard: { border: 'border-border/30', badge: 'bg-white/10', badgeText: 'text-foreground', glow: '' },
  };

  if (bounties.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-[15px] font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Missions</span>
          <span className="text-[9px] text-emerald-400/60 font-bold ml-0.5">GET PAID</span>
        </div>
        <button
          onClick={() => setShowInfo(true)}
          aria-label="How missions work"
          className="w-7 h-7 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      <ArenaRail>
        {bounties.map(b => {
          const payout = (b.payout_cents / 100).toFixed(0);
          const slotsLeft = b.max_slots - b.accepted_count;
          const ta = TYPE_ACCENT[b.mission_type || 'standard'] || TYPE_ACCENT.standard;
          const typeLabel = (b.mission_type || 'bounty').toUpperCase();
          const payouts = b.custom_payouts || {};
          const sRate = ((payouts.S || 0) / 100);
          const aRate = ((payouts.A || 0) / 100);
          const bRate = ((payouts.B || 0) / 100);
          const maxPay = Math.max(sRate, aRate, bRate, b.payout_cents / 100);
          const isPoster = user?.id === b.created_by;

          return (
            <ArenaRailCard key={b.id}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/commissions/${b.id}`)}
              className="relative w-full h-full rounded-2xl overflow-hidden group text-left touch-manipulation"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
            >
              {/* Cover */}
              {b.cover_url ? (
                <img src={b.cover_url} alt={b.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-surface-2 to-black" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-lg" />

              {/* Center play button */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                  <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                </div>
              </div>

              {/* Type badge */}
              <div className="absolute top-2 left-2 z-10">
                <div className={`flex items-center gap-1 ${ta.badge} backdrop-blur-md px-2 py-0.5 border ${ta.border} rounded-sm`}>
                  <span className={`text-[7px] font-black uppercase tracking-[0.15em] ${ta.badgeText}`}>{typeLabel}</span>
                </div>
              </div>

              {/* Price */}
              <div className="absolute top-2 right-2 z-10 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-sm">
                <span className="text-[14px] font-black text-emerald-400 leading-none">${maxPay > 0 ? maxPay : payout}</span>
              </div>

              {/* Instant badge */}
              <div className="absolute top-8 right-2 z-10">
                <span className="text-[7px] font-black text-emerald-400/60 uppercase tracking-wider">⚡ Instant</span>
              </div>

              {/* Close for poster */}
              {isPoster && (
                <button
                  onClick={(e) => handleClose(b.id, e)}
                  className="absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-black/70 border border-white/10 flex items-center justify-center hover:bg-red-500/50 transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-white/70" />
                </button>
              )}

              {/* Bottom */}
               <div className="absolute bottom-0 left-0 right-0 p-3">
                {(b.client_name || b.artist_name) && (
                  <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.15em] mb-0.5 truncate">{b.client_name || b.artist_name}</p>
                )}
                <h4 className="text-[13px] font-black text-white leading-tight truncate mb-1.5">{b.title}</h4>

                {/* Tier row removed for cleaner card */}

                <div
                  className="w-full py-2.5 rounded-md bg-white/[0.06] border border-white/10 text-white text-center text-[12px] font-bold uppercase tracking-wider touch-manipulation"
                  style={{ fontFamily: 'Teko, sans-serif' }}
                >
                  ENTER
                </div>
              </div>
            </motion.button>
            </ArenaRailCard>
          );
        })}

        {/* Coming Soon poster */}
        <ArenaRailCard>
        <div className="w-full h-full rounded-2xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)' }}
        >
          <div className="absolute inset-0 border border-white/[0.06] rounded-lg" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
            <div className="w-10 h-10 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400/40" />
            </div>
            <p className="text-[12px] font-black text-white/60 uppercase tracking-wider text-center leading-tight" style={{ fontFamily: 'Teko, sans-serif' }}>
              More Missions<br />Coming Soon
            </p>
            <p className="text-[8px] text-white/20 text-center leading-relaxed">
              New paid opportunities drop regularly
            </p>
          </div>
        </div>
        </ArenaRailCard>

        {/* Post Mission CTA — admin only */}
        {isStaff && (
          <ArenaRailCard>
          <button
            onClick={() => navigate('/missions')}
            className="w-full h-full border border-dashed border-border/30 bg-surface-1/30 flex flex-col items-center justify-center gap-2 hover:border-border/50 transition-colors rounded-2xl"
          >
            <Plus className="w-4 h-4 text-muted-foreground/30" />
            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-wider">Post</span>
          </button>
          </ArenaRailCard>
        )}
      </ArenaRail>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInfo(false)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl overflow-hidden border border-emerald-500/20"
              style={{
                background: 'linear-gradient(180deg, #0d1117 0%, #050709 100%)',
                boxShadow: '0 24px 60px -20px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Header */}
              <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                    <DollarSign className="w-5 h-5 text-white" strokeWidth={2.8} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[20px] font-black text-white leading-none tracking-tight" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>
                      HOW MISSIONS WORK
                    </h3>
                    <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-[0.18em] mt-1">Get paid to edit</p>
                  </div>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="px-5 py-5 space-y-3">
                {[
                  { n: '01', title: 'Pick a mission', body: 'Browse paid drops from artists, brands & films. Each card shows the payout & slots left.' },
                  { n: '02', title: 'Drop your edit', body: 'Submit your TikTok / IG / YT link before the deadline. Use the scenepacks provided.' },
                  { n: '03', title: 'Get rated', body: 'Your edit is graded S, A, or B. Higher grade = bigger payout. Top edits get featured.' },
                  { n: '04', title: 'Cash out', body: 'Approved payouts hit your earnings instantly. Withdraw anytime once you hit the minimum.' },
                ].map((s) => (
                  <div key={s.n} className="flex gap-3">
                    <div className="shrink-0 w-9 h-9 rounded-xl border border-emerald-500/25 bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-[11px] font-black text-emerald-400" style={{ fontFamily: 'Teko, sans-serif' }}>{s.n}</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h4 className="text-[14px] font-bold text-white leading-tight">{s.title}</h4>
                      <p className="text-[12px] text-white/55 leading-snug mt-0.5">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer CTA */}
              <div className="px-5 pb-5 pt-1">
                <button
                  onClick={async () => {
                    setShowInfo(false);
                    const { data } = await supabase
                      .from('commissions')
                      .select('id')
                      .eq('status', 'open')
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .maybeSingle();
                    if (data?.id) {
                      navigate(`/commissions/${data.id}`);
                    } else {
                      navigate('/arena');
                    }
                  }}
                  className="w-full py-3 rounded-2xl font-black text-white text-[15px] uppercase tracking-wider active:scale-[0.98] transition-transform"
                  style={{
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 10px 28px -8px rgba(16,185,129,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                    fontFamily: 'Teko, sans-serif',
                    letterSpacing: '0.06em',
                  }}
                >
                  Jump Into A Mission
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
function GhostSlot({ icon, label, width = "w-full", height = "h-full", accentColor = "border-border/40" }: {
  icon: React.ReactNode;
  label: string;
  width?: string;
  height?: string;
  accentColor?: string;
}) {
  return (
    <div className={`shrink-0 ${width} ${height} border border-dashed ${accentColor} bg-surface-0/40 flex flex-col items-center justify-center gap-2 rounded-2xl`}>
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
  const [activeFilter, setActiveFilter] = useState<"all" | "official" | "competitions" | "battles" | "quick">("all");

  const [showSoloMode, setShowSoloMode] = useState(() => searchParams.get('auto') === '1' && searchParams.get('mode') === 'solo');
  const [showCreateBattle, setShowCreateBattle] = useState(false);
  
  const [quickSearch, setQuickSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'quick' | 'battle' | 'solo' | 'practice' | 'drop'>((searchParams.get('mode') as any) || 'drop');
  const [userStats, setUserStats] = useState<{ wins: number; losses: number; streak: number; events: number } | null>(null);
  const [qfSearching, setQfSearching] = useState(false);
  const [lobbyTypeOpen, setLobbyTypeOpen] = useState(false);
  const [qfElapsed, setQfElapsed] = useState(0);
  const [lobbyOpen, setLobbyOpen] = useState(false);

  const { tournaments: sanctionedTournaments, loading: sanctionedLoading } = useSanctionedTournaments(["approved", "ready_up", "live", "bracket", "completed"]);
  const { battles, loading: battlesLoading } = useBattles(["pending", "active", "judging", "completed"]);
  
  const { fights: quickFights, loading: quickLoading } = useRecentQuickFights(100);
  const { liveDrops } = useFeaturedDrops();
  const [missionBillboards, setMissionBillboards] = useState<Array<{ id: string; song_name: string; poster_url: string | null; artist_name: string | null; max_pay: number }>>([]);
  const { activeSolo, loading: soloLoading, cancelSolo } = useSoloMode();
  const { fights: myQuickFights, inQueue: qfInQueue } = useMyQuickFights();
  const { competitions: myLiveCompetitions } = useMyCompetitionReminders();
  const { battles: myCashBattles, acceptBattle: acceptCashBattle } = useMyCashBattles();
  const [arenaView, setArenaView] = useState<'arena' | 'my'>(() => (searchParams.get('tab') === 'my' || searchParams.get('view') === 'my') ? 'my' : 'arena');
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

  // Fetch mission billboards for Featured Drops
  useEffect(() => {
    const fetchMissions = async () => {
      const { data } = await supabase
        .from('commissions')
        .select('id, title, cover_url, artist_name, client_name, mission_type, custom_payouts, payout_cents')
        .eq('is_marketplace', true)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5);
      if (!data || data.length === 0) { setMissionBillboards([]); return; }
      setMissionBillboards(data.map((d: any) => {
        return {
          id: d.id, song_name: d.title, poster_url: d.cover_url,
          artist_name: d.artist_name || d.client_name || null,
          max_pay: (d.payout_cents || 0) / 100,
        };
      }));
    };
    fetchMissions();
  }, []);

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
  const myJudgingBattles = useMemo(() => battles.filter(b =>
    user && b.judge_id === user.id && b.status !== 'completed'
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
    { key: "competitions", label: "Competitions", icon: <Trophy className="w-3.5 h-3.5" /> },
  ];

  const handleQuickFight = async () => {
    if (!user || !profile) { navigate('/start'); return; }
    if (qfActiveFight) { navigate(`/fight/${qfActiveFight.id}`); return; }
    // Reuse existing waiting lobby if user already has one open
    const existingWaiting = myQuickFights.find(f => f.status === 'waiting' && f.player_1_id === user.id);
    if (existingWaiting) { navigate(`/fight/${existingWaiting.id}`); return; }
    setLobbyTypeOpen(true);
  };

  const handleCreateLobby = async (isPrivate: boolean, durationMinutes: number) => {
    if (!user || !profile) return;
    setQfSearching(true);
    try {
      const lobby = await createQuickFightLobby(user.id, profile.username, profile.avatar_url, { isPrivate, durationMinutes });
      if (!lobby) throw new Error('create lobby failed');
      await leaveQueue(user.id);
      setLobbyTypeOpen(false);
      navigate(`/fight/${lobby.id}`);
      setQfSearching(false);
    } catch {
      toast.error("Couldn't create lobby");
      setQfSearching(false);
    }
  };

  const handleCancelQueue = async () => {
    if (!user) return;
    await leaveQueue(user.id);
    setQfSearching(false);
    setLobbyOpen(false);
    toast('Search cancelled', { duration: 2000 });
  };

  // Mode actions for the game lobby
  const modeActions: Record<string, () => void> = {
    quick: handleQuickFight,
    battle: () => profile ? setShowCreateBattle(true) : navigate('/start'),
    solo: () => profile ? setShowSoloMode(true) : navigate('/start'),
    
  };

  return (
    <div className="min-h-screen pb-4" style={{ background: '#0A0A0A' }}>
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

          {/* Arena / My Arena toggle — slim segmented pill with sliding indicator */}
          <div className="relative grid grid-cols-2 mb-3 p-1 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-inner">
            {/* Sliding active pill */}
            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-out ${
                arenaView === 'arena'
                  ? 'translate-x-0 bg-gradient-to-b from-red-500 to-red-600 shadow-[0_4px_14px_-4px_rgba(239,68,68,0.55)] ring-1 ring-red-400/30'
                  : 'translate-x-full bg-gradient-to-b from-amber-300 to-amber-500 shadow-[0_4px_14px_-4px_rgba(252,211,77,0.55)] ring-1 ring-amber-300/40'
              }`}
            />
            <button
              onClick={() => setArenaView('arena')}
              className={`relative z-10 h-8 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors active:scale-[0.97] ${
                arenaView === 'arena' ? 'text-white' : 'text-foreground/55 hover:text-foreground/80'
              }`}
            >
              <Swords className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>Arena</span>
            </button>
            <button
              onClick={() => setArenaView('my')}
              className={`relative z-10 h-8 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors active:scale-[0.97] ${
                arenaView === 'my' ? 'text-black' : 'text-foreground/55 hover:text-foreground/80'
              }`}
            >
              <UserRound className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>My Arena</span>
              {(activeSolo || myBattles.length > 0 || myActiveQuickFights.length > 0 || myJudgingBattles.length > 0 || myCashBattles.length > 0 || myLiveCompetitions.length > 0) && (
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${arenaView === 'my' ? 'bg-black/70' : 'bg-red-500'}`} />
              )}
            </button>
          </div>

          {arenaView === 'my' ? (
            /* ═══════════════════════════════════════════════════
               MY ARENA — Personal dashboard
            ═══════════════════════════════════════════════════ */
            <div className="space-y-4 pb-4">
              {/* Profile Card — iPhone 17 glass + Roblox vibrancy */}
              {profile && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <Link to="/profile" className="block group">
                    <div
                      className="relative overflow-hidden rounded-3xl p-[1px] transition-all active:scale-[0.99]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,200,80,0.55) 0%, rgba(255,255,255,0.06) 35%, rgba(124,58,237,0.35) 70%, rgba(239,68,68,0.45) 100%)',
                        boxShadow: '0 18px 40px -18px rgba(255,180,60,0.35), 0 8px 24px -12px rgba(0,0,0,0.6)',
                      }}
                    >
                      <div
                        className="relative rounded-[22px] p-4 flex items-center gap-4 overflow-hidden"
                        style={{
                          background: 'linear-gradient(160deg, hsl(0 0% 11%) 0%, hsl(0 0% 7%) 100%)',
                        }}
                      >
                        <div className="absolute -top-12 -right-10 w-40 h-40 rounded-full opacity-40 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(255,180,60,0.45), transparent 70%)' }} />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                        <div className="relative shrink-0">
                          <div className="absolute -inset-1 rounded-full opacity-70 blur-md" style={{ background: 'conic-gradient(from 0deg, #f59e0b, #ef4444, #7c3aed, #3b82f6, #f59e0b)' }} />
                          <Avatar className="relative w-14 h-14 ring-2 ring-black">
                            <AvatarImage src={profile.avatar_url || ''} />
                            <AvatarFallback className="bg-gold/10 text-gold text-lg font-bold">
                              {profile.username?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="relative flex-1 min-w-0">
                          <p className="text-[15px] font-black text-foreground truncate tracking-tight">
                            {profile.display_name || profile.username}
                          </p>
                          <p className="text-[11px] text-muted-foreground">@{profile.username}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            {userStats && (
                              <>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">{userStats.wins}W</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums bg-red-500/15 text-red-300 border border-red-500/25">{userStats.losses}L</span>
                                {userStats.streak > 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center gap-0.5">
                                    <Flame className="w-2.5 h-2.5" />{userStats.streak}
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground/80 ml-0.5">{userStats.events} events</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="relative shrink-0 flex flex-col items-end gap-1">
                          <span
                            className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] text-amber-200 border border-amber-400/30"
                            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(239,68,68,0.12))' }}
                          >
                            {(profile as any).league || 'Open'}
                          </span>
                          <span className="text-[11px] text-foreground/80 font-bold tabular-nums">
                            Lv.{(profile as any).level || 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* ⚖️ Judging Assignments */}
              {myJudgingBattles.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="space-y-1.5">
                    {myJudgingBattles.map(battle => (
                      <Link key={battle.id} to={`/battle/${battle.id}`}
                        className="flex items-center gap-3 bg-surface-1 border border-purple-500/30 hover:border-purple-500/50 p-3 transition-all">
                        <div className="w-9 h-9 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0">
                          <Award className="w-4.5 h-4.5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                            ⚖️ JUDGING · {battle.status.toUpperCase()}
                          </span>
                          <p className="text-xs text-foreground truncate">{battle.challenger_username} vs {battle.opponent_username || '???'}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 💰 Cash Battles — Accept & Compete */}
              {myCashBattles.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-red-400" />
                    <span className="text-[13px] font-bold text-foreground">Cash Battles</span>
                    <span className="text-[11px] text-red-400 font-semibold">{myCashBattles.length}</span>
                  </div>
                  <div className="space-y-2">
                    {myCashBattles.map(battle => {
                      const isChallenger = user?.id === battle.challenger_id;
                      const myAccepted = isChallenger ? battle.challenger_accepted : battle.opponent_accepted;
                      const opponentName = isChallenger ? battle.opponent_username : battle.challenger_username;
                      const isLive = battle.status === 'live';

                      return (
                        <div key={battle.id} className="bg-surface-1 border rounded-xl overflow-hidden" style={{
                          borderColor: isLive ? 'rgba(239,68,68,0.4)' : myAccepted ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.5)',
                        }}>
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)' }}>
                                  <DollarSign className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-lg font-black text-white" style={{ fontFamily: 'Teko, sans-serif' }}>
                                  ${(battle.prize_cents / 100).toFixed(0)}
                                </span>
                                {battle.sponsor_name && (
                                  <span className="text-[9px] text-blue-400/80 font-semibold">· {battle.sponsor_name}</span>
                                )}
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-wider ${isLive ? 'text-red-400' : 'text-amber-400'}`} style={{ fontFamily: 'Teko, sans-serif' }}>
                                {isLive ? '🔴 LIVE' : myAccepted ? 'WAITING' : 'ACCEPT'}
                              </span>
                            </div>

                            <div className="flex items-center justify-center gap-3 mb-3">
                              <div className="flex flex-col items-center">
                                <Avatar className="w-10 h-10 ring-2 ring-blue-500/50">
                                  <AvatarImage src={battle.challenger_avatar_url || ''} />
                                  <AvatarFallback className="text-xs bg-blue-500/15 text-blue-400">{battle.challenger_username?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-[9px] font-bold text-blue-400 mt-1" style={{ fontFamily: 'Teko, sans-serif' }}>{battle.challenger_username}</span>
                              </div>
                              <span className="text-sm font-black text-white/60" style={{ fontFamily: 'Teko, sans-serif' }}>VS</span>
                              <div className="flex flex-col items-center">
                                <Avatar className="w-10 h-10 ring-2 ring-red-500/50">
                                  <AvatarImage src={battle.opponent_avatar_url || ''} />
                                  <AvatarFallback className="text-xs bg-red-500/15 text-red-400">{battle.opponent_username?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-[9px] font-bold text-red-400 mt-1" style={{ fontFamily: 'Teko, sans-serif' }}>{battle.opponent_username}</span>
                              </div>
                            </div>

                            {isLive ? (
                              <div className="text-center py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                <span className="text-[12px] font-black text-red-400 uppercase" style={{ fontFamily: 'Teko, sans-serif' }}>
                                  Battle is LIVE — Go edit!
                                </span>
                              </div>
                            ) : !myAccepted ? (
                              <button
                                onClick={async () => {
                                  const ok = await acceptCashBattle(battle.id);
                                  if (ok) toast.success('Accepted! Waiting for opponent...');
                                  else toast.error('Failed to accept');
                                }}
                                className="w-full py-3 rounded-xl text-white font-black uppercase tracking-wider text-[14px] transition-all active:scale-[0.98]"
                                style={{
                                  fontFamily: 'Teko, sans-serif',
                                  background: 'linear-gradient(135deg, #3b82f6, #ef4444)',
                                  boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
                                }}
                              >
                                ⚔️ ACCEPT BATTLE
                              </button>
                            ) : (
                              <div className="text-center py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <span className="text-[11px] font-bold text-blue-400">✓ You accepted — waiting for {opponentName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeSolo && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bg-surface-1 border border-gold/30 p-4">
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

              {/* Quick Actions — Multiplayer + Edit Battle Instantly */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-2 gap-2"
              >
                <button
                  onClick={() => profile ? setShowCreateBattle(true) : navigate('/start')}
                  className="relative overflow-hidden rounded-2xl p-[1px] transition-all active:scale-[0.98] text-left"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.55) 0%, rgba(255,255,255,0.06) 50%, rgba(124,58,237,0.45) 100%)',
                    boxShadow: '0 14px 32px -16px rgba(59,130,246,0.45)',
                  }}
                >
                  <div
                    className="relative rounded-[14px] p-3.5 flex flex-col gap-2 h-full overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, hsl(0 0% 11%) 0%, hsl(0 0% 7%) 100%)' }}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/10"
                      style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(124,58,237,0.18))' }}
                    >
                      <Users className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-[14px] font-black text-foreground tracking-tight" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>MULTIPLAYER</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">Invite a friend · 1v1</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleQuickFight}
                  className="relative overflow-hidden rounded-2xl p-[1px] transition-all active:scale-[0.98] text-left"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.55) 0%, rgba(255,255,255,0.06) 50%, rgba(245,158,11,0.45) 100%)',
                    boxShadow: '0 14px 32px -16px rgba(239,68,68,0.45)',
                  }}
                >
                  <div
                    className="relative rounded-[14px] p-3.5 flex flex-col gap-2 h-full overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, hsl(0 0% 11%) 0%, hsl(0 0% 7%) 100%)' }}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/10"
                      style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(245,158,11,0.18))' }}
                    >
                      <Zap className="w-5 h-5 text-red-300" />
                    </div>
                    <div>
                      <p className="text-[14px] font-black text-foreground tracking-tight" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>EDIT BATTLE INSTANTLY</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">Quick match · auto opponent</p>
                    </div>
                  </div>
                </button>
              </motion.div>

              {/* Active Battles — countdown + forfeit */}
              {(() => {
                const reminderItems: LiveBattleReminderItem[] = [
                  ...myBattles.filter(b => b.status !== 'completed' && b.status !== 'cancelled' && b.status !== 'forfeited').map(b => {
                    const isChallenger = b.challenger_id === user?.id;
                    const submitted = isChallenger ? !!(b as any).challenger_submission_url : !!(b as any).opponent_submission_url;
                    return {
                      kind: 'battle' as const,
                      id: b.id,
                      title: `${b.challenger_username} vs ${b.opponent_username || '???'}`,
                      status: b.status,
                      endsAt: b.ends_at,
                      hasSubmitted: submitted,
                      href: `/battle/${b.id}`,
                    };
                  }),
                  ...myActiveQuickFights.map(f => {
                    const isP1 = f.player_1_id === user?.id;
                    const submitted = isP1 ? !!f.player_1_submission_url : !!f.player_2_submission_url;
                    return {
                      kind: 'quick' as const,
                      id: f.id,
                      title: `${f.player_1_username} vs ${f.player_2_username || '???'}`,
                      status: f.status,
                      endsAt: f.ends_at,
                      hasSubmitted: submitted,
                      href: `/fight/${f.id}`,
                    };
                  }),
                  ...myLiveCompetitions.map(comp => ({
                    kind: 'competition' as const,
                    id: comp.id,
                    title: comp.name,
                    status: comp.status,
                    endsAt: comp.status === 'voting' ? comp.voting_deadline : comp.deadline,
                    hasSubmitted: comp.hasSubmitted,
                    hasVoted: comp.hasVoted,
                    href: `/competition/${comp.slug || comp.id}`,
                  })),
                ];
                return reminderItems.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Swords className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[11px] font-black text-foreground/90 uppercase tracking-[0.15em]">Active Now</span>
                      <span className="ml-auto text-[10px] text-red-300 font-black px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/25">{reminderItems.length}</span>
                    </div>
                    <LiveBattleReminders items={reminderItems} />
                  </div>
                ) : null;
              })()}

              {/* Email Notification Settings */}
              <EmailNotificationSettings />
            </div>
          ) : (
          <>

          {/* Game lobby dropdown removed — direct actions via section buttons */}

          {/* KotH submit billboard removed per user request */}

          {/* ═══ FEATURED EVENT AD — top of arena ═══ */}
          {liveEvents.length > 0 && (
            <Link
              to={`/event/${(liveEvents[0] as any).slug || liveEvents[0].id}`}
              className="relative block mb-3 -mx-4 active:scale-[0.995] transition-transform"
            >
              {/* Edge-to-edge slim cinematic strip */}
              <div className="relative h-[78px] w-full overflow-hidden bg-black shadow-[0_18px_40px_-20px_rgba(239,68,68,0.55),0_0_60px_-30px_rgba(16,185,129,0.45)]">
                {liveEvents[0].poster_url && (
                  <img
                    src={liveEvents[0].poster_url}
                    alt={liveEvents[0].title}
                    className="absolute inset-0 w-full h-full object-cover scale-[1.15]"
                    style={{ objectPosition: '38% 20%' }}
                    loading="eager"
                  />
                )}
                {/* Cinematic gradients — bleed left poster into right text */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/55 to-black" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_50%,rgba(239,68,68,0.18),transparent_55%)]" />

                {/* Scanline texture for "broadcast" feel */}
                <div className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)' }} />

                {/* LIVE pill */}
                <div className="absolute top-2 left-3 flex items-center gap-1 px-1.5 py-[2px] rounded-sm bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.7)]">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-[0.22em] text-white">Live Comp</span>
                </div>

                {/* Right content */}
                <div className="absolute inset-y-0 right-0 left-[42%] flex items-center pr-3 pl-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-[19px] leading-[0.9] font-black text-white tracking-tight line-clamp-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                      style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}
                    >
                      {liveEvents[0].title.toUpperCase()}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5 text-[10px] font-black text-emerald-400 tabular-nums">
                        <span className="text-emerald-400/90">$</span>150
                      </div>
                      <span className="w-[2px] h-[2px] rounded-full bg-white/30" />
                      <div className="flex items-center gap-0.5 text-[10px] font-black text-white tabular-nums">
                        <RingsCoin size={10} /> 1M
                      </div>
                      <span className="w-[2px] h-[2px] rounded-full bg-white/30" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/55">May 24</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 px-2.5 py-1.5 rounded-sm bg-emerald-400 text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_22px_rgba(16,185,129,0.55)]">
                    Enter
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ═══ FILTER PILLS — moved to top ═══ */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-3 px-4 -mx-4">
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
            {/* Ranked — Coming Soon inline badge */}
            <div className="inline-flex items-center gap-1 pl-1 pr-2 py-[3px] rounded-full border border-white/[0.08] bg-white/[0.04] shrink-0">
              <span className="w-3 h-3 rounded-full flex items-center justify-center bg-white/10 shrink-0">
                <Swords className="w-2 h-2 text-foreground/70" strokeWidth={3} />
              </span>
              <span className="text-[8.5px] font-black uppercase tracking-[0.16em] text-foreground/55 whitespace-nowrap">Ranked Soon</span>
            </div>
          </div>

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

          {/* ═══ EDIT BATTLES (Cash + Ranked merged) ═══ */}
          <div className="mb-5">
            <CashBattlesSection
              idxBattles={battles}
              idxBattlesLoading={battlesLoading}
              quickFights={quickFights}
              myQuickFights={myQuickFights}
              quickFightsLoading={quickLoading}
              renderIdxBattleCard={(battle) => (
                <BattleCard battle={battle} onClick={() => navigate(`/battle/${battle.id}`)} />
              )}
              onQuickFight={handleQuickFight}
              onChallenge={handleQuickFight}
              isQfSearching={isQfSearching}
              onCancelQueue={handleCancelQueue}
              onOpenLobby={() => setLobbyOpen(true)}
            />
          </div>

          {/* ═══ COMPETITIONS ═══ */}
          {(activeFilter === "all" || activeFilter === "competitions") && (
            <div className="mb-5">
              <ArenaCompetitionsSection onCreateClick={() => navigate(profile ? '/competition/create' : '/start')} />
            </div>
          )}

          {/* ═══ COLLABS — duo edits ═══ */}
          {activeFilter === "all" && (
            <div className="mb-5">
              <ArenaCollabsSection onCreateClick={() => navigate(profile ? '/collabs/create' : '/start')} />
            </div>
          )}

          {/* ═══ TOP QOI (Loopgate elite leaderboard) ═══ */}
          <ArenaQOITop />

          {/* Marketplace removed */}

          {/* Filter pills moved to top */}
          </>
          )}
        </div>
      </div>

      {/* Loading */}
      {arenaView === 'arena' && loading && (
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="h-[220px] w-[180px] shrink-0 rounded-2xl" />
            <Skeleton className="h-[220px] w-[180px] shrink-0 rounded-2xl" />
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      {arenaView === 'arena' && !loading && (
        <div className="mt-3 space-y-5 max-w-2xl mx-auto">

          {/* Competitions */}
          {(activeFilter === "competitions") && (
            <ArenaCompetitionsSection onCreateClick={() => navigate(profile ? '/competition/create' : '/start')} />
          )}

          {/* Quick 1v1s section removed — merged into 1v1 Edit Battles */}

          {/* 1v1 Battles section removed — merged into Edit Battles above */}

          <div className="h-2" />
        </div>
      )}

      <CreateBattleModal
        isOpen={showCreateBattle}
        onClose={() => setShowCreateBattle(false)}
        onSuccess={(battleId) => { setShowCreateBattle(false); navigate(`/battle/${battleId}`); }}
      />

      <MatchmakingLobby
        open={lobbyOpen && isQfSearching && !qfActiveFight}
        elapsedSec={qfElapsed}
        currentUserId={user?.id}
        onCancel={() => { setLobbyOpen(false); handleCancelQueue(); }}
      />

      <CustomLobbyTypeModal
        open={lobbyTypeOpen}
        onOpenChange={setLobbyTypeOpen}
        onSelect={handleCreateLobby}
      />

    </div>
  );
}
