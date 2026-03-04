import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Infinity as InfinityIcon, ChevronRight, Users, Trophy, 
  Flame, Calendar, Target, Shield, Swords,
  Search, X, TrendingUp, Plus, HelpCircle, CheckCircle2,
  Clock, Award, UserPlus, Eye, Globe, Crown, Zap, UserRound,
  Sparkles, Star, Music, Mail, ArrowRight, History, Play, Loader2,
  Clapperboard, ChevronDown, Crosshair, DollarSign
} from "lucide-react";
import { InfinityLoop } from "@/components/loopgate/InfinityLoop";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoopMonster from "@/components/loopgate/LoopMonster";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import PracticeModeCard from "@/components/loopgate/PracticeModeCard";
import PracticeModeView from "@/components/loopgate/PracticeModeView";
import SoloModeFlow from "@/components/loopgate/SoloModeFlow";
import SoloShowcase from "@/components/loopgate/SoloShowcase";
import HostedCompCard from "@/components/loopgate/HostedCompCard";
import FeaturedHostedCompCard from "@/components/loopgate/FeaturedHostedCompCard";
import PremiumCompCard from "@/components/loopgate/PremiumCompCard";
import { useHostedCompetitions } from "@/hooks/useHostedCompetitions";
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
  custom_payouts: Record<string, number> | null;
  views_milestone: number;
  views_bonus_cents: number;
  artist_name: string | null;
}

function ArenaMissionCard({ drop }: { drop: ArenaMission }) {
  const navigate = useNavigate();
  const payouts = drop.custom_payouts || { S: 500, A: 300, B: 100 };
  const sRate = ((payouts.S || 500) / 100);
  const aRate = ((payouts.A || 300) / 100);
  const bRate = ((payouts.B || 100) / 100);
  const hasViewsBonus = drop.views_milestone > 0 && drop.views_bonus_cents > 0;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate('/solo-arena')}
      className="shrink-0 relative w-[200px] h-[250px] overflow-hidden group text-left touch-manipulation"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}
    >
      {drop.poster_url ? (
        <img src={drop.poster_url} alt={drop.song_name} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-1 to-background" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />

      {/* Top */}
      <div className="absolute top-0 left-0 right-0 px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 border-l-2 border-emerald-500">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[7px] font-black text-emerald-400 uppercase tracking-[0.15em]">Live</span>
        </div>
        {drop.prize_usd > 0 && (
          <div className="bg-emerald-500/20 backdrop-blur-sm px-1.5 py-0.5 border border-emerald-500/30">
            <span className="text-[8px] font-black text-emerald-400">${drop.prize_usd}</span>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        {hasViewsBonus && (
          <div className="flex items-center gap-1 mb-1.5 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 w-fit">
            <Eye className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-[7px] font-black text-amber-400 uppercase">{(drop.views_milestone / 1000).toFixed(0)}K = +${(drop.views_bonus_cents / 100).toFixed(0)}</span>
          </div>
        )}

        {drop.artist_name && (
          <p className="text-[8px] font-bold text-foreground/40 uppercase tracking-[0.1em]">{drop.artist_name}</p>
        )}
        <h4 className="font-display text-sm text-foreground leading-tight truncate">{drop.song_name}</h4>

        {/* Payout strip */}
        <div className="flex items-stretch gap-0 mt-2 h-[28px]">
          <div className="flex-1 bg-amber-500/15 border border-amber-500/25 border-r-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black text-amber-400 leading-none">S</span>
            <span className="text-[8px] font-bold text-emerald-400 leading-none">${sRate}</span>
          </div>
          <div className="flex-1 bg-emerald-500/10 border-y border-emerald-500/20 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black text-emerald-400 leading-none">A</span>
            <span className="text-[8px] font-bold text-emerald-400 leading-none">${aRate}</span>
          </div>
          <div className="flex-1 bg-blue-500/10 border border-blue-500/20 border-l-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black text-blue-400 leading-none">B</span>
            <span className="text-[8px] font-bold text-emerald-400 leading-none">${bRate}</span>
          </div>
          <div className="flex-1 bg-foreground/[0.03] border border-foreground/[0.06] border-l-0 flex items-center justify-center">
            <span className="text-[7px] font-bold text-foreground/15">C-F</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function ArenaMissionsCarousel() {
  const [drops, setDrops] = useState<ArenaMission[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('featured_drops')
        .select('id, song_name, poster_url, status, prize_usd, custom_payouts, views_milestone, views_bonus_cents, artist_id')
        .in('status', ['active', 'open', 'live'])
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) return;

      const artistIds = [...new Set(data.map(d => d.artist_id).filter(Boolean))];
      let artistMap: Record<string, string> = {};
      if (artistIds.length > 0) {
        const { data: artists } = await supabase.from('featured_artists').select('id, name').in('id', artistIds);
        if (artists) artists.forEach(a => { artistMap[a.id] = a.name; });
      }

      setDrops(data.map(d => ({
        id: d.id,
        song_name: d.song_name,
        poster_url: d.poster_url,
        status: d.status || 'live',
        prize_usd: d.prize_usd || 0,
        custom_payouts: d.custom_payouts as Record<string, number> | null,
        views_milestone: (d as any).views_milestone || 0,
        views_bonus_cents: (d as any).views_bonus_cents || 0,
        artist_name: d.artist_id ? artistMap[d.artist_id] || null : null,
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
      className="w-full flex items-center gap-3 p-3.5 bg-surface-1 border border-border hover:border-red-500/40 transition-all touch-manipulation text-left"
    >
      <Avatar className="w-10 h-10 border border-border shrink-0">
        <AvatarImage src={fight.player_1_avatar_url || ''} />
        <AvatarFallback className="bg-surface-2 text-foreground text-[11px] font-bold">
          {fight.player_1_username?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[13px] font-bold text-foreground truncate">{fight.player_1_username}</span>
        <span className="text-[11px] font-black text-muted-foreground/50 shrink-0">vs</span>
        <span className="text-[13px] font-bold text-foreground truncate">
          {fight.player_2_username || "—"}
        </span>
      </div>

      <div className="shrink-0 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <span className={`text-[11px] font-bold ${s.color}`}>{s.label}</span>
        </div>
        <span className="text-[11px] font-bold text-gold">+20 IDX</span>
      </div>
    </motion.button>
  );
}

// ─── Section Header ────────────────────────────────────────────
function SectionHeader({ icon, title, badge, badgeColor = "text-emerald-400", action }: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeColor?: string;
  action?: React.ReactNode;
}) {
  // Extract just the text color from badgeColor prop
  const textColor = badgeColor.includes('text-') 
    ? badgeColor.split(' ').find(c => c.startsWith('text-')) || 'text-emerald-400'
    : 'text-emerald-400';
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[15px] font-extrabold text-foreground" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{title}</span>
        {badge && (
          <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${textColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {badge}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

export default function ArenaPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "official" | "sanctioned" | "battles" | "quick" | "hosted" | "practice">("all");
  const [showPracticeMode, setShowPracticeMode] = useState(false);
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
  const { competitions: hostedComps, loading: hostedLoading } = useHostedCompetitions();
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
  const liveHosted = hostedComps.filter(c => c.status === "live" || c.status === "judging").length;
  const liveQuick = quickFights.filter(f => f.status === "active" || f.status === "judging").length;
  const totalLive = liveEvents.length + liveBattles + liveTournaments + liveHosted + liveQuick;

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

  if (showPracticeMode) {
    return <PracticeModeView onBack={() => setShowPracticeMode(false)} />;
  }

  if (showSoloMode) {
    return <SoloModeFlow onBack={() => setShowSoloMode(false)} />;
  }

  const filters: { key: typeof activeFilter; label: string; icon?: React.ReactNode; accent?: string }[] = [
    { key: "all", label: "All" },
    { key: "quick", label: "Quick 1v1", icon: <Zap className="w-3.5 h-3.5" />, accent: "red" },
    { key: "battles", label: "1v1", icon: <Swords className="w-3.5 h-3.5" />, accent: "red" },
    { key: "official", label: "Official", icon: <InfinityIcon className="w-3.5 h-3.5" />, accent: "gold" },
    { key: "sanctioned", label: "Sanctioned", icon: <Shield className="w-3.5 h-3.5" /> },
    { key: "hosted", label: "Hosted", icon: <Globe className="w-3.5 h-3.5" />, accent: "cyan" },
    { key: "practice", label: "Practice" },
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
    practice: () => setShowPracticeMode(true),
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <LoopMonster />

      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/6 via-transparent to-transparent" />

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
            <div className="flex gap-0 overflow-hidden border border-border">
              {/* Mode Dropdown */}
              <div className="flex-1 relative">
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value as typeof selectedMode)}
                  className="w-full appearance-none bg-surface-1 text-foreground text-[11px] font-black uppercase tracking-wider py-2.5 pl-3 pr-8 cursor-pointer focus:outline-none touch-manipulation"
                  style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}
                >
                  {liveDrops.length > 0 && (
                    <option value="drop">🔥 {liveDrops[0].title}{(liveDrops[0] as any).prize_usd > 0 ? ` — $${(liveDrops[0] as any).prize_usd} Prize` : ' — Submit Now'}</option>
                  )}
                  <option value="quick">⚡ Quick 1v1 — Auto · 3hr</option>
                  <option value="battle">⚔️ 1v1 Battle — Invite</option>
                  <option value="solo">👤 Solo Edit — Pick · Score</option>
                  <option value="practice">🎯 Practice — No Stakes</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>

              {/* GO Button */}
              <motion.button
                whileTap={isQfSearching ? undefined : { scale: 0.95 }}
                onClick={() => {
                  if (isQfSearching) return;
                  if (selectedMode === 'drop' && liveDrops.length > 0) {
                    navigate(`/drop/${(liveDrops[0] as any).slug || liveDrops[0].id}`);
                  } else if (selectedMode === 'quick' && qfActiveFight) {
                    modeActions.quick();
                  } else if (selectedMode !== 'drop') {
                    modeActions[selectedMode]();
                  }
                }}
                disabled={isQfSearching}
                className="relative overflow-hidden touch-manipulation transition-colors min-h-[46px] px-7 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500"
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
                {isQfSearching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin relative z-10" />
                    <span className="text-[11px] font-black tracking-tight uppercase text-white relative z-10" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                      {Math.floor(qfElapsed / 60)}:{(qfElapsed % 60).toString().padStart(2, '0')}
                    </span>
                  </>
                ) : qfActiveFight && selectedMode === 'quick' ? (
                  <span className="text-[14px] font-black text-white relative z-10 tracking-tight uppercase" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                    Return
                  </span>
                ) : (
                  <>
                    <span className="text-[16px] font-black text-white relative z-10 tracking-tight uppercase" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                      GO
                    </span>
                    {(selectedMode === 'quick' || selectedMode === 'battle') && (
                      <span className="text-[9px] text-white/40 font-bold relative z-10">+20 IDX</span>
                    )}
                    {selectedMode === 'solo' && (
                      <span className="text-[9px] text-white/40 font-bold relative z-10">100+ IDX</span>
                    )}
                    {selectedMode === 'drop' && liveDrops.length > 0 && (
                      <span className="text-[10px] font-bold relative z-10 text-emerald-300">
                        {(liveDrops[0] as any).prize_usd > 0 ? `$${(liveDrops[0] as any).prize_usd}` : 'Earn IDX'}
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            </div>

            {/* Cancel queue */}
            {isQfSearching && (
              <button
                onClick={handleCancelQueue}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-1.5 border border-t-0 border-border bg-surface-1 text-muted-foreground text-[10px] font-bold uppercase tracking-wider hover:text-foreground transition-colors touch-manipulation"
              >
                <X className="w-3 h-3" />
                Cancel Search
              </button>
            )}
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

          {/* ═══ MISSIONS CAROUSEL — GET PAID ═══ */}
          <ArenaMissionsCarousel />

          {/* ═══ BOUNTIES CAROUSEL ═══ */}
          <ArenaBountiesCarousel />

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

          {/* ═══ SOLO MODE SHOWCASE — dominant section ═══ */}
          {(activeFilter === "all") && (
            <SoloShowcase onStartSolo={() => setShowSoloMode(true)} />
          )}

          {/* Official Events — Featured Drops with rounds */}
          {(activeFilter === "all" || activeFilter === "official") && (
            <motion.section key="official-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<InfinityIcon className="w-4 h-4 text-gold" />}
                title="Official Events"
                badge={liveDrops.length > 0 ? `${liveDrops.length} Live` : undefined}
                badgeColor="bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
              />
              <p className="text-[12px] text-muted-foreground px-4 mb-1">Artist-featured multi-round competitions · Cash prizes · Best edit + random pick wins</p>
              <p className="text-[10px] text-muted-foreground/50 px-4 mb-3">Submit your edit each round. Judges score on a 0–100 QOI scale. Top scorers earn cash + Index.</p>
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
                    <p className="text-[13px] text-muted-foreground font-medium">No active official events</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-1">New drops announced weekly — stay tuned</p>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* Quick 1v1s */}
          {(activeFilter === "all" || activeFilter === "quick") && (
            <motion.section key="quick-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<Zap className="w-4 h-4 text-red-400" />}
                title="Quick Edit 1v1s"
                badge={liveQuick > 0 ? `${liveQuick} Live` : undefined}
                badgeColor="bg-red-500/20 border-red-500/40 text-red-400"
                action={
                  <button
                    onClick={() => profile ? navigate('/quick-fight') : navigate('/start')}
                    className="text-[12px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" /> Start Editing
                  </button>
                }
              />
              <p className="text-[12px] text-muted-foreground px-4 mb-1">Instant matchmaking · 3hr edit window · Winner +20 IDX</p>
              <p className="text-[10px] text-muted-foreground/50 px-4 mb-3">Auto-matched with another editor. Both submit an edit within 3 hours. Judge picks the winner.</p>




              {/* Fight List */}
              <div className="px-4 space-y-1.5">
                {quickLoading ? (
                  <div className="space-y-1.5">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : filteredQuickFights.length > 0 ? (
                  <>
                    {filteredQuickFights.slice(0, activeFilter === "quick" ? 50 : 5).map(fight => (
                      <Quick1v1Row key={fight.id} fight={fight} onClick={() => navigate(`/fight/${fight.id}`)} />
                    ))}
                    {activeFilter !== "quick" && filteredQuickFights.length > 5 && (
                      <button
                        onClick={() => setActiveFilter("quick")}
                        className="w-full py-3 text-[12px] font-bold text-red-400 hover:bg-red-500/5 transition-colors flex items-center justify-center gap-1.5"
                      >
                        View All {filteredQuickFights.length} Fights
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 bg-surface-1 border border-border">
                    <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-red-400/40" />
                    </div>
                    <p className="text-[13px] text-muted-foreground font-medium mb-1">{quickSearch ? "No matches found" : "No Quick 1v1s Yet"}</p>
                    <p className="text-[12px] text-muted-foreground/60 mb-4">Be the first to start a fight</p>
                    <Button
                      size="sm"
                      onClick={() => profile ? navigate('/quick-fight') : navigate('/start')}
                      className="bg-red-500 hover:bg-red-600 text-white text-[12px] h-9 px-5"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1.5" /> Start Quick 1v1
                    </Button>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* 1v1 Battles */}
          {(activeFilter === "all" || activeFilter === "battles") && (
            <motion.section key="battles-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<Swords className="w-4 h-4 text-red-400" />}
                title="1v1 Edit Battles"
                badge={liveBattles > 0 ? `${liveBattles} Live` : undefined}
                badgeColor="bg-red-500/20 border-red-500/40 text-red-400"
              />
              <p className="text-[12px] text-muted-foreground px-4 mb-1">Head-to-head editing showdowns · Winner +20 IDX</p>
              <p className="text-[10px] text-muted-foreground/50 px-4 mb-3">Challenge a specific editor. Pick a song, set the deadline, and go head-to-head. Loser gets no penalty.</p>

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

          {/* (Official Events now shown above as Featured Drops with rounds) */}

          {/* Premium Comps */}
          {(activeFilter === "all") && (
            <motion.section key="premium-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4">
              <SectionHeader
                icon={<Crown className="w-4 h-4 text-purple-400" />}
                title="Premium Comps"
                badgeColor="bg-purple-500/20 border-purple-500/40 text-purple-400"
                badge="Easy Entry"
              />
              {hostedComps.filter(c => c.is_premium && (c.status === 'live' || c.status === 'judging')).length > 0 ? (
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                  {hostedComps
                    .filter(c => c.is_premium && (c.status === 'live' || c.status === 'judging'))
                    .map(comp => (
                      <PremiumCompCard key={comp.id} comp={comp} onClick={() => navigate(`/hosted-comp/${comp.slug || comp.id}`)} />
                    ))}
                  {hostedComps.filter(c => c.is_premium && (c.status === 'live' || c.status === 'judging')).length < 3 &&
                    Array.from({ length: Math.max(0, 3 - hostedComps.filter(c => c.is_premium && (c.status === 'live' || c.status === 'judging')).length) }).map((_, i) => (
                      <GhostSlot key={`ghost-prem-${i}`} icon={<Crown className="w-4 h-4 text-purple-400/20" />} label="Open slot" accentColor="border-purple-500/15" />
                    ))
                  }
                </div>
              ) : (
                <div className="bg-surface-1 border border-purple-500/15 border-dashed p-8 text-center">
                  <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-3">
                    <Crown className="w-6 h-6 text-purple-400/30" />
                  </div>
                  <p className="text-[13px] text-muted-foreground font-medium">No premium comps right now</p>
                </div>
              )}
            </motion.section>
          )}

          {/* Sanctioned Tournaments */}
          {(activeFilter === "all" || activeFilter === "sanctioned") && (
            <motion.section key="sanctioned-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4">
              <SectionHeader
                icon={<Shield className="w-4 h-4 text-gold" />}
                title="Sanctioned"
                badge={liveTournaments > 0 ? `${liveTournaments} Active` : undefined}
                badgeColor="bg-gold/20 border-gold/40 text-gold"
                action={
                  profile?.crew_id ? (
                    <Link to="/units" className="text-[12px] text-gold hover:text-gold/80 flex items-center gap-1 font-semibold transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Propose
                    </Link>
                  ) : undefined
                }
              />

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/units')}
                className="w-full bg-surface-1 border border-border hover:border-gold/40 p-4 flex items-center gap-4 text-left transition-all mb-3"
              >
                <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-bold text-foreground block" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Unit Tournaments</span>
                  <span className="text-[12px] text-muted-foreground">Single elimination · Up to 100 editors</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.button>

              {sanctionedLoading ? (
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                  <Skeleton className="h-48 w-[240px] shrink-0" />
                  <Skeleton className="h-48 w-[240px] shrink-0" />
                </div>
              ) : sanctionedTournaments.length > 0 ? (
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                  {sanctionedTournaments.map(t => (
                    <SanctionedTournamentCard key={t.id} tournament={t} onClick={() => navigate(`/sanctioned/${t.id}`)} />
                  ))}
                  {sanctionedTournaments.length < 3 && Array.from({ length: Math.max(0, 3 - sanctionedTournaments.length) }).map((_, i) => (
                    <GhostSlot key={`ghost-sanc-${i}`} icon={<Shield className="w-4 h-4 text-gold/20" />} label="Open slot" accentColor="border-gold/15" />
                  ))}
                </div>
              ) : (
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <GhostSlot key={`ghost-sanc-empty-${i}`} icon={<Shield className="w-4 h-4 text-gold/20" />} label="No tournaments" accentColor="border-gold/15" />
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {/* Hosted Comps */}
          {(activeFilter === "all" || activeFilter === "hosted") && (
            <motion.section key="hosted-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4">
              <SectionHeader
                icon={<Globe className="w-4 h-4 text-cyan-400" />}
                title="Hosted Comps"
                badge="New"
                badgeColor="bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/hosted-comps')}
                className="w-full bg-surface-1 border border-border hover:border-cyan-500/40 p-4 flex items-center gap-4 text-left transition-all"
              >
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-bold text-foreground block" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Browse or Host a Competition</span>
                  <span className="text-[12px] text-muted-foreground">Discord servers & creators run comps with Loopgate infrastructure</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.button>

              {hostedComps.filter(c => c.is_featured && (c.status === 'live' || c.status === 'judging')).length > 0 && (
                <div className="mt-3">
                  <span className="text-[11px] font-bold text-cyan-400 mb-2 block tracking-wide">FEATURED</span>
                  <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                    {hostedComps
                      .filter(c => c.is_featured && (c.status === 'live' || c.status === 'judging'))
                      .slice(0, 6)
                      .map(comp => (
                        <FeaturedHostedCompCard key={comp.id} comp={comp} onClick={() => navigate(`/hosted-comp/${comp.id}`)} />
                      ))}
                    {hostedComps.filter(c => c.is_featured && (c.status === 'live' || c.status === 'judging')).length < 3 && 
                      Array.from({ length: Math.max(0, 3 - hostedComps.filter(c => c.is_featured && (c.status === 'live' || c.status === 'judging')).length) }).map((_, i) => (
                        <GhostSlot key={`ghost-hosted-${i}`} icon={<Globe className="w-4 h-4 text-cyan-400/20" />} label="Open slot" accentColor="border-cyan-500/15" />
                      ))
                    }
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* Practice */}
          {(activeFilter === "all" || activeFilter === "practice") && (
            <motion.section key="practice-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4">
              <SectionHeader
                icon={<Target className="w-4 h-4 text-emerald-400" />}
                title="Practice Mode"
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPracticeMode(true)}
                className="w-full bg-surface-1 border border-border hover:border-emerald-500/40 p-4 flex items-center gap-4 text-left transition-all"
              >
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-bold text-foreground block" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Get Feedback</span>
                  <span className="text-[12px] text-muted-foreground">Submit work for judge review · +30 XP</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.button>
            </motion.section>
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
