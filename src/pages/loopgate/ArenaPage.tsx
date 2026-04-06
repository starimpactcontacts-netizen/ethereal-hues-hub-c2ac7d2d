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
import { useRecentQuickFights, leaveQueue } from "@/hooks/useQuickFight";
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
import { startQuickMatch } from "@/lib/startQuickMatch";


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
        <button onClick={() => navigate('/missions')} className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
          View All <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-3 pl-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
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
            <motion.button
              key={b.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/commissions/${b.id}`)}
              className="shrink-0 relative w-[200px] h-[240px] rounded-lg overflow-hidden group text-left touch-manipulation snap-start"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            >
              {/* Cover */}
              {b.cover_url ? (
                <img src={b.cover_url} alt={b.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-surface-2 to-black" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-lg" />

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
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                {(b.client_name || b.artist_name) && (
                  <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.15em] mb-0.5 truncate">{b.client_name || b.artist_name}</p>
                )}
                <h4 className="text-[13px] font-black text-white leading-tight truncate mb-1.5">{b.title}</h4>

                {/* Compact tier row */}
                {(sRate > 0 || aRate > 0 || bRate > 0) && (
                  <div className="flex items-stretch gap-[1px] mb-1.5">
                    {[
                      { rank: 'S', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30', pay: sRate },
                      { rank: 'A', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25', pay: aRate },
                      { rank: 'B', color: 'text-blue-400 bg-blue-500/15 border-blue-500/25', pay: bRate },
                    ].map(tier => (
                      <div key={tier.rank} className={`flex-1 border ${tier.color} py-1 flex flex-col items-center`}>
                        <span className="text-[9px] font-black leading-none">{tier.rank}</span>
                        <span className={`text-[7px] font-bold leading-none ${tier.pay > 0 ? 'text-white/80' : 'text-white/10'}`}>
                          {tier.pay > 0 ? `$${tier.pay}` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-0.5 text-[8px] text-white/30"><Users className="w-2.5 h-2.5" /> {slotsLeft}/{b.max_slots}</span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400"
                    style={{ fontFamily: 'Teko, sans-serif' }}
                  >
                    ENTER
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}

        {/* Post Mission CTA — admin only */}
        {isStaff && (
          <button
            onClick={() => navigate('/missions')}
            className="shrink-0 w-[200px] h-[240px] border border-dashed border-border/30 bg-surface-1/30 flex flex-col items-center justify-center gap-2 snap-start hover:border-border/50 transition-colors rounded-lg"
          >
            <Plus className="w-4 h-4 text-muted-foreground/30" />
            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-wider">Post</span>
          </button>
        )}
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
function GhostSlot({ icon, label, width = "w-[160px]", height = "h-[160px]", accentColor = "border-border/40" }: {
  icon: React.ReactNode;
  label: string;
  width?: string;
  height?: string;
  accentColor?: string;
}) {
  return (
    <div className={`shrink-0 ${width} ${height} border border-dashed ${accentColor} bg-surface-0/40 flex flex-col items-center justify-center gap-2 rounded-lg`}>
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
  const [qfElapsed, setQfElapsed] = useState(0);

  const { tournaments: sanctionedTournaments, loading: sanctionedLoading } = useSanctionedTournaments(["approved", "ready_up", "live", "bracket", "completed"]);
  const { battles, loading: battlesLoading } = useBattles(["pending", "active", "judging", "completed"]);
  
  const { fights: quickFights, loading: quickLoading } = useRecentQuickFights(100);
  const { liveDrops } = useFeaturedDrops();
  const [missionBillboards, setMissionBillboards] = useState<Array<{ id: string; song_name: string; poster_url: string | null; artist_name: string | null; max_pay: number }>>([]);
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
    { key: "official", label: "King of the Hill", icon: <Crown className="w-3.5 h-3.5" />, accent: "gold" },
    { key: "competitions", label: "Competitions", icon: <Trophy className="w-3.5 h-3.5" /> },
  ];

  const handleQuickFight = async () => {
    if (!user || !profile) { navigate('/start'); return; }
    if (qfActiveFight) { navigate(`/fight/${qfActiveFight.id}`); return; }
    setQfSearching(true);
    try {
      const result = await startQuickMatch({
        userId: user.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
      });

      if (result.type === 'battle') {
        toast.success('⚔️ Opponent found!');
        navigate(`/battle/${result.id}`);
        setQfSearching(false);
      } else if (result.type === 'fight') {
        toast.success('⚔️ Match found!');
        navigate(`/fight/${result.id}`);
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

          {/* Arena / My Arena toggle */}
          <div className="grid grid-cols-2 gap-0 mb-3 rounded-xl border border-border overflow-hidden bg-surface-1">
            <button
              onClick={() => setArenaView('arena')}
              className={`relative py-3 text-[14px] font-black uppercase tracking-wider transition-all touch-manipulation rounded-l-xl ${
                arenaView === 'arena'
                  ? 'bg-red-600 text-white'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface-2'
              }`}
              style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}
            >
              <div className="flex items-center justify-center gap-2">
                <Swords className="w-4 h-4" />
                <span>Arena</span>
              </div>
            </button>
            <button
              onClick={() => setArenaView('my')}
              className={`relative py-3 text-[14px] font-black uppercase tracking-wider transition-all touch-manipulation rounded-r-xl ${
                arenaView === 'my'
                  ? 'bg-gold text-background'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface-2'
              }`}
              style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}
            >
              <div className="flex items-center justify-center gap-2">
                <UserRound className="w-4 h-4" />
                <span>My Arena</span>
                {(activeSolo || myBattles.length > 0 || myActiveQuickFights.length > 0 || myJudgingBattles.length > 0) && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
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

          {/* Game lobby dropdown removed — direct actions via section buttons */}

          {/* ═══ MISSION BILLBOARD — WeirdCity Campaign ═══ */}
          {missionBillboards.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/commissions/${missionBillboards[0].id}`)}
              className="relative w-full overflow-hidden touch-manipulation group mb-2 rounded-lg"
              style={{ boxShadow: '0 4px 24px rgba(16, 185, 129, 0.15)' }}
            >
              {/* Background */}
              {missionBillboards[0].poster_url ? (
                <div className="absolute inset-0 bg-cover bg-center scale-[1.02] group-hover:scale-[1.06] transition-transform duration-700" style={{ backgroundImage: `url(${missionBillboards[0].poster_url})` }} />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-background to-emerald-950/50" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

              {/* Content */}
              <div className="relative px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.15em]">Mission — Live</span>
                  </div>
                  <h3 className="text-[16px] font-black text-white leading-tight truncate tracking-tight" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                    {missionBillboards[0].song_name}
                  </h3>
                  {missionBillboards[0].artist_name && (
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5 truncate">{missionBillboards[0].artist_name}</p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  {missionBillboards[0].max_pay > 0 && (
                    <span className="font-display text-xl text-emerald-400 font-black leading-none">${missionBillboards[0].max_pay}</span>
                  )}
                  <div className="bg-emerald-600 px-4 py-2 rounded-sm flex items-center gap-1.5 group-hover:bg-emerald-500 transition-colors">
                    <Crosshair className="w-3.5 h-3.5 text-white" />
                    <span className="text-[12px] font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>Enter</span>
                  </div>
                </div>
              </div>
            </motion.button>
          )}

          {/* KotH live drop promo — only if no missions */}
          {missionBillboards.length === 0 && liveDrops.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/drop/${liveDrops[0].id}`)}
              className="relative w-full overflow-hidden touch-manipulation group mb-2 rounded-lg"
            >
              {(liveDrops[0] as any).poster_url ? (
                <div className="absolute inset-0 bg-cover bg-center scale-[1.02] group-hover:scale-[1.06] transition-transform duration-700" style={{ backgroundImage: `url(${(liveDrops[0] as any).poster_url})` }} />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-background to-red-950/50" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
              <div className="relative px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-black text-red-400 uppercase tracking-[0.15em]">King of the Hill — Live</span>
                  </div>
                  <h3 className="text-[16px] font-black text-white leading-tight truncate tracking-tight" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>{liveDrops[0].title}</h3>
                </div>
                <div className="shrink-0 bg-red-600 px-4 py-2 rounded-sm flex items-center gap-1.5 group-hover:bg-red-500 transition-colors">
                  <Users className="w-3.5 h-3.5 text-white" />
                  <span className="text-[12px] font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>Submit</span>
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

          {/* ═══ MISSIONS — BELOW GO, ABOVE COMPETITIONS ═══ */}
          <div className="-mx-4">
            <ArenaMissionsSection />
          </div>

          {/* ═══ COMPETITIONS ═══ */}
          {(activeFilter === "all" || activeFilter === "competitions") && (
            <div className="-mx-4">
              <ArenaCompetitionsSection onCreateClick={() => navigate(profile ? '/competition/create' : '/start')} />
            </div>
          )}

          {/* ArenaMissionsCarousel removed — missions already shown in ArenaMissionsSection above */}

          {/* ═══ LIVE PAYOUTS CAROUSEL ═══ */}
          <div className="-mx-4">
            <LivePayoutsCarousel />
          </div>

          {/* Marketplace removed */}

          {/* ═══ FILTER PILLS — small rounded ═══ */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-4 pl-4 pb-1">
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
            <Skeleton className="h-[160px] w-[160px] shrink-0 rounded-lg" />
            <Skeleton className="h-[160px] w-[160px] shrink-0 rounded-lg" />
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
                    className="flex items-center gap-1.5 text-[10px] font-bold text-foreground bg-surface-2 border border-border rounded-full px-3 py-1 hover:bg-surface-1 transition-all active:scale-95"
                  >
                    <Shuffle className="w-3 h-3" />
                    Join Random
                  </button>
                ) : undefined}
              />
              {liveDrops.length > 0 ? (
                <div className="pl-4 flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
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

          {/* Competitions */}
          {(activeFilter === "competitions") && (
            <ArenaCompetitionsSection onCreateClick={() => navigate(profile ? '/competition/create' : '/start')} />
          )}

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
                <div className="flex gap-3 pl-4 overflow-x-auto scrollbar-hide pb-2">
                  <Skeleton className="h-[160px] w-[160px] shrink-0 rounded-lg" />
                  <Skeleton className="h-[160px] w-[160px] shrink-0 rounded-lg" />
                </div>
              ) : battles.length > 0 ? (
                <div className="flex gap-3 pl-4 overflow-x-auto scrollbar-hide pb-2">
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
