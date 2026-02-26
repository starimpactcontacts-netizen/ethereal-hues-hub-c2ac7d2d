import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Infinity as InfinityIcon, ChevronRight, Users, Trophy, 
  Flame, Calendar, Target, Shield, Swords,
  Search, X, TrendingUp, Plus, HelpCircle, CheckCircle2,
  Clock, Award, UserPlus, Eye, Globe, Crown, Zap, UserRound
} from "lucide-react";
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
import { useRecentQuickFights } from "@/hooks/useQuickFight";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FeaturedDropCard from "@/components/loopgate/FeaturedDropCard";
import { useFeaturedDrops } from "@/hooks/useFeaturedDrops";

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
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "official" | "sanctioned" | "battles" | "quick" | "hosted" | "practice">("all");
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  const [showSoloMode, setShowSoloMode] = useState(false);
  const [showCreateBattle, setShowCreateBattle] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [selectedMode, setSelectedMode] = useState<'quick' | 'battle' | 'solo' | 'practice'>('quick');
  const [userStats, setUserStats] = useState<{ wins: number; losses: number; streak: number; events: number } | null>(null);

  const { tournaments: sanctionedTournaments, loading: sanctionedLoading } = useSanctionedTournaments(["approved", "ready_up", "live", "bracket", "completed"]);
  const { battles, loading: battlesLoading } = useBattles(["pending", "active", "judging", "completed"]);
  const { competitions: hostedComps, loading: hostedLoading } = useHostedCompetitions();
  const { fights: quickFights, loading: quickLoading } = useRecentQuickFights(100);
  const { liveDrops } = useFeaturedDrops();

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

  // Mode actions for the game lobby
  const modeActions: Record<string, () => void> = {
    quick: () => profile ? navigate('/quick-fight') : navigate('/start'),
    battle: () => profile ? setShowCreateBattle(true) : navigate('/start'),
    solo: () => profile ? setShowSoloMode(true) : navigate('/start'),
    practice: () => setShowPracticeMode(true),
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <LoopMonster />

      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/6 via-transparent to-transparent" />

        <div className="relative px-4 pt-5 pb-5">
          {/* Title row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-foreground flex items-center justify-center">
                <InfinityIcon className="w-5.5 h-5.5 text-background" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-[28px] font-black text-foreground leading-none tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'none' }}>Arena</h1>
                <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">Compete. Win. Climb.</p>
              </div>
            </div>
            {totalLive > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[13px] font-bold text-red-400 tabular-nums">{totalLive} Live</span>
              </div>
            )}
          </div>

          {/* ═══ GLOBAL SEARCH — top of Arena ═══ */}
          <div className="relative mb-5">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search battles, events, players..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-9 bg-surface-1 border border-border rounded-full text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/30 transition-colors"
            />
            {quickSearch && (
              <button onClick={() => setQuickSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* ═══ STATS ROW ═══ */}
          {profile && userStats && (
            <div className="mb-5 bg-surface-1 border border-border p-4 flex items-center gap-4">
              <Avatar className="w-11 h-11 border-2 border-border shrink-0">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-surface-2 text-foreground text-[12px] font-bold">{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-bold text-foreground block leading-none truncate">{profile.username}</span>
                <span className="text-[12px] text-muted-foreground mt-1 block">Class {profile.league_tier || 'F'}</span>
              </div>
              <div className="flex items-center gap-5">
                {[
                  { val: userStats.wins, label: 'W', color: 'text-emerald-400' },
                  { val: userStats.losses, label: 'L', color: 'text-red-400' },
                  { val: userStats.events, label: 'Edits', color: 'text-foreground' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <span className={`text-[16px] font-black ${s.color} block leading-none tabular-nums`}>{s.val}</span>
                    <span className="text-[11px] text-muted-foreground font-medium mt-0.5 block">{s.label}</span>
                  </div>
                ))}
                {userStats.streak > 1 && (
                  <div className="text-center">
                    <span className="text-[16px] font-black text-gold block leading-none">🔥{userStats.streak}</span>
                    <span className="text-[11px] text-muted-foreground font-medium mt-0.5 block">Streak</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ GAME LOBBY — Mode Select + Play ═══ */}
          <div className="mb-5">
            {/* Mode tabs */}
            <div className="flex gap-0 mb-3 bg-surface-1 border border-border overflow-hidden">
              {[
                { key: 'quick' as const, icon: <Zap className="w-4 h-4" />, label: 'Quick 1v1', desc: 'Auto-match · 3hr' },
                { key: 'battle' as const, icon: <Swords className="w-4 h-4" />, label: '1v1 Battle', desc: 'Invite opponent' },
                { key: 'solo' as const, icon: <UserRound className="w-4 h-4" />, label: 'Solo', desc: 'Pick · Edit · Score' },
                { key: 'practice' as const, icon: <Target className="w-4 h-4" />, label: 'Practice', desc: 'No stakes' },
              ].map((mode, i) => {
                const active = selectedMode === mode.key;
                return (
                  <button
                    key={mode.key}
                    onClick={() => setSelectedMode(mode.key)}
                    className={`flex-1 relative py-4 px-2 flex flex-col items-center gap-1.5 transition-all touch-manipulation ${
                      active ? 'bg-surface-2' : 'hover:bg-surface-0'
                    } ${i > 0 ? 'border-l border-border' : ''}`}
                  >
                    {/* Active indicator — top bar */}
                    {active && <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500" />}
                    <span className={`transition-colors ${active ? 'text-red-400' : 'text-muted-foreground'}`}>{mode.icon}</span>
                    <span className={`text-[13px] font-bold leading-none transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {mode.label}
                    </span>
                    <span className={`text-[11px] leading-none transition-colors ${active ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                      {mode.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* PLAY button — dual CTA for quick/solo, standard for others */}
            {(selectedMode === 'quick' || selectedMode === 'solo') ? (
              <div className="flex gap-0 overflow-hidden border border-red-500/30">
                {/* Quick Edit Battle */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedMode('quick'); modeActions.quick(); }}
                  className={`flex-1 relative overflow-hidden touch-manipulation group py-5 flex items-center justify-center gap-2 transition-all ${
                    selectedMode === 'quick' ? 'bg-red-600' : 'bg-surface-1 hover:bg-surface-2'
                  }`}
                >
                  {selectedMode === 'quick' && (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-900/50 pointer-events-none" />
                    </>
                  )}
                  <Zap className={`w-5 h-5 relative z-10 ${selectedMode === 'quick' ? 'text-white' : 'text-muted-foreground'}`} />
                  <div className="relative z-10 flex flex-col items-start">
                    <span className={`text-[16px] font-black tracking-tight uppercase ${selectedMode === 'quick' ? 'text-white' : 'text-foreground'}`} style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                      Quick Edit Battle
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold relative z-10 ml-1 ${selectedMode === 'quick' ? 'text-white/40' : 'text-gold'}`}>+20 IDX</span>
                </motion.button>

                {/* Divider */}
                <div className="w-[1px] bg-border shrink-0" />

                {/* Solo Edit */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedMode('solo'); modeActions.solo(); }}
                  className={`flex-1 relative overflow-hidden touch-manipulation group py-5 flex items-center justify-center gap-2 transition-all ${
                    selectedMode === 'solo' ? 'bg-red-600' : 'bg-surface-1 hover:bg-surface-2'
                  }`}
                >
                  {selectedMode === 'solo' && (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-900/50 pointer-events-none" />
                    </>
                  )}
                  <UserRound className={`w-5 h-5 relative z-10 ${selectedMode === 'solo' ? 'text-white' : 'text-muted-foreground'}`} />
                  <div className="relative z-10 flex flex-col items-start">
                    <span className={`text-[16px] font-black tracking-tight uppercase ${selectedMode === 'solo' ? 'text-white' : 'text-foreground'}`} style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                      Solo Edit
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold relative z-10 ml-1 ${selectedMode === 'solo' ? 'text-white/40' : 'text-gold'}`}>100+ IDX</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={modeActions[selectedMode]}
                className="w-full relative overflow-hidden touch-manipulation group"
              >
                <div className="relative bg-red-600 hover:bg-red-550 transition-colors py-5 flex items-center justify-center gap-3">
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-900/50 pointer-events-none" />
                  {selectedMode === 'battle' && <Swords className="w-5 h-5 text-white relative z-10" />}
                  {selectedMode === 'practice' && <Target className="w-5 h-5 text-white relative z-10" />}
                  <span className="text-[22px] font-black text-white relative z-10 tracking-tight uppercase" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                    {selectedMode === 'practice' ? 'Start Practice' : 'Play'}
                  </span>
                  {selectedMode === 'battle' && (
                    <span className="text-[12px] text-white/40 font-bold relative z-10 ml-1">+20 IDX</span>
                  )}
                </div>
              </motion.button>
            )}
          </div>

          {/* ═══ FEATURED MATCH ═══ */}
          {featuredFight && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (featuredFight.type === 'quick') navigate(`/fight/${featuredFight.data.id}`);
                else navigate(`/battle/${featuredFight.data.id}`);
              }}
              className="w-full mb-4 bg-surface-1 border border-border hover:border-red-500/30 p-4 flex items-center gap-4 touch-manipulation transition-all"
            >
              {/* Avatars VS */}
              <div className="flex items-center gap-2 shrink-0">
                <Avatar className="w-10 h-10 border-2 border-red-500/40">
                  <AvatarImage src={featuredFight.type === 'quick' ? featuredFight.data.player_1_avatar_url : (featuredFight.data as any).challenger_avatar_url} />
                  <AvatarFallback className="bg-surface-2 text-foreground text-[11px] font-bold">
                    {(featuredFight.type === 'quick' ? featuredFight.data.player_1_username : (featuredFight.data as any).challenger_username)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[12px] font-black text-muted-foreground/40">VS</span>
                <Avatar className="w-10 h-10 border-2 border-blue-500/40">
                  <AvatarImage src={featuredFight.type === 'quick' ? featuredFight.data.player_2_avatar_url : (featuredFight.data as any).opponent_avatar_url} />
                  <AvatarFallback className="bg-surface-2 text-foreground text-[11px] font-bold">
                    {(featuredFight.type === 'quick' ? featuredFight.data.player_2_username : (featuredFight.data as any).opponent_username)?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Names + CTA */}
              <div className="flex-1 min-w-0 text-left">
                <span className="text-[13px] font-bold text-foreground block truncate">
                  {featuredFight.type === 'quick' ? featuredFight.data.player_1_username : (featuredFight.data as any).challenger_username}
                  {' vs '}
                  {featuredFight.type === 'quick' ? (featuredFight.data.player_2_username || '???') : ((featuredFight.data as any).opponent_username || '???')}
                </span>
                <span className="text-[12px] text-gold font-semibold mt-0.5 block">+20 IDX · Watch Now →</span>
              </div>

              {/* Live indicator — seamless */}
              <div className="shrink-0 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[12px] font-bold text-emerald-400">LIVE</span>
              </div>
            </motion.button>
          )}

          {/* search bar moved to top */}

          {/* ═══ FILTER PILLS — small rounded ═══ */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
            {filters.map(f => {
              const active = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all flex items-center gap-1 shrink-0 touch-manipulation ${
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
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="h-48 w-[200px] shrink-0" />
            <Skeleton className="h-48 w-[200px] shrink-0" />
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      {!loading && (
        <div className="mt-2 space-y-6">

          {/* ═══ SOLO MODE SHOWCASE — dominant section ═══ */}
          {(activeFilter === "all") && (
            <SoloShowcase onStartSolo={() => setShowSoloMode(true)} />
          )}

          {/* Featured Drops */}
          {liveDrops.length > 0 && (activeFilter === "all" || activeFilter === "official") && (
            <motion.section key="featured-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<Flame className="w-4 h-4 text-brand" />}
                title="Featured Artist"
                badge="New"
                badgeColor="bg-brand/20 border-brand/40 text-brand"
              />
              <div className="px-4 flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
                {liveDrops.map(drop => (
                  <FeaturedDropCard key={drop.id} drop={drop} />
                ))}
              </div>
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
              <p className="text-[12px] text-muted-foreground px-4 mb-3">Instant matchmaking · 3hr edit window · Winner +20 IDX</p>




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
              <p className="text-[12px] text-muted-foreground px-4 mb-3">Head-to-head editing showdowns · Winner +20 IDX</p>

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

          {/* Official Events */}
          {(activeFilter === "all" || activeFilter === "official") && (
            <motion.section key="official-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<InfinityIcon className="w-4 h-4 text-gold" />}
                title="Official Events"
                badge={liveEvents.length > 0 ? `${liveEvents.length} Live` : undefined}
                badgeColor="bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                action={
                  <Link to="/events" className="text-[12px] text-muted-foreground hover:text-foreground font-medium transition-colors">View All</Link>
                }
              />
              {allActiveEvents.length > 0 ? (
                <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2">
                  {allActiveEvents.map(event => <EventCard key={event.id} event={event} />)}
                  {allActiveEvents.length < 3 && Array.from({ length: Math.max(0, 3 - allActiveEvents.length) }).map((_, i) => (
                    <GhostSlot key={`ghost-event-${i}`} width="w-[240px]" icon={<Trophy className="w-4 h-4 text-gold/20" />} label="Upcoming" accentColor="border-gold/15" />
                  ))}
                </div>
              ) : (
                <div className="px-4">
                  <div className="bg-surface-1 border border-border border-dashed p-8 text-center">
                    <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                      <InfinityIcon className="w-6 h-6 text-gold/30" />
                    </div>
                    <p className="text-[13px] text-muted-foreground font-medium">No active events</p>
                  </div>
                </div>
              )}
            </motion.section>
          )}

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
