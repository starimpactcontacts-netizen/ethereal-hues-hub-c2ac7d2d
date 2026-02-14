import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Infinity as InfinityIcon, ChevronRight, Users, Trophy, 
  Flame, Calendar, Target, Shield, Swords,
  Search, X, TrendingUp, Plus, HelpCircle, CheckCircle2,
  Clock, Award, UserPlus, Eye, Globe, Crown, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoopMonster from "@/components/loopgate/LoopMonster";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import PracticeModeCard from "@/components/loopgate/PracticeModeCard";
import PracticeModeView from "@/components/loopgate/PracticeModeView";
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
  return (
    <Link to={`/event/${event.id}`} className="block shrink-0 w-[260px]">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-surface-1 border border-border hover:border-gold/50 transition-all overflow-hidden group touch-manipulation rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)]"
      >
        <div className="relative h-28 overflow-hidden rounded-t-lg">
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gold/20 to-surface-2 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-gold/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-transparent" />
          {isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 px-2 py-0.5 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
              <span className="text-[8px] font-bold uppercase text-background">Live</span>
            </div>
          )}
          {event.prize_pool && (
            <div className="absolute top-2 right-2 bg-background/90 border border-gold/50 px-2 py-0.5 rounded-sm">
              <span className="text-[10px] font-display text-gold">{event.prize_pool}</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-gold/90 px-1.5 py-0.5 rounded-sm">
            <InfinityIcon className="w-2.5 h-2.5 text-background" />
            <span className="text-[7px] font-bold uppercase text-background">Official</span>
          </div>
        </div>
        <div className="p-2.5">
          <h3 className="font-display text-xs text-foreground truncate">{event.title}</h3>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-1">
            <span className="uppercase">{event.league}</span>
            {event.xp_reward && (
              <span className="text-gold flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" /> +{event.xp_reward} XP
              </span>
            )}
          </div>
          <div className="mt-1.5">
            <CountdownTimer endDate={isLive ? event.end_date : event.start_date} label={isLive ? "Ends" : "Starts"} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Quick 1v1 Row Card (Browse) ───────────────────────────────
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
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-surface-1 border border-border hover:border-red-500/40 transition-all touch-manipulation text-left rounded-lg shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.03)] hover:shadow-[0_4px_20px_-2px_rgba(239,68,68,0.15),0_0_0_1px_rgba(239,68,68,0.1)]"
    >
      {/* P1 avatar */}
      <Avatar className="w-9 h-9 border border-red-500/40 shrink-0">
        <AvatarImage src={fight.player_1_avatar_url || ''} />
        <AvatarFallback className="bg-red-500/20 text-red-400 text-[10px] font-bold">
          {fight.player_1_username?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* VS */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="min-w-0">
          <span className="text-xs font-bold text-foreground truncate block">{fight.player_1_username}</span>
        </div>
        <div className="shrink-0 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
          <Swords className="w-3 h-3 text-red-400" />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-foreground truncate block">
            {fight.player_2_username || "???"}
          </span>
        </div>
      </div>

      {/* Status + Prize */}
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1">
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          <span className={`text-[9px] font-bold uppercase ${s.color}`}>{s.label}</span>
        </div>
        <span className="text-[9px] font-bold text-gold">+20 IDX</span>
      </div>
    </motion.button>
  );
}

// ─── Section Header ────────────────────────────────────────────
function SectionHeader({ icon, title, badge, badgeColor = "bg-emerald-500/20 border-emerald-500/40 text-emerald-400", action }: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeColor?: string;
  action?: React.ReactNode;
}) {
  return (
          <div className="flex items-center justify-between px-4 mb-2.5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">{title}</span>
        {badge && (
          <span className={`flex items-center gap-1 border px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-full ${badgeColor}`}>
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
  const [showCreateBattle, setShowCreateBattle] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");

  const { tournaments: sanctionedTournaments, loading: sanctionedLoading } = useSanctionedTournaments(["approved", "ready_up", "live", "bracket", "completed"]);
  const { battles, loading: battlesLoading } = useBattles(["pending", "active", "judging", "completed"]);
  const { competitions: hostedComps, loading: hostedLoading } = useHostedCompetitions();
  const { fights: quickFights, loading: quickLoading } = useRecentQuickFights(100);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase.from("events").select("*").order("start_date", { ascending: true });
      if (!error && data) setEvents(data);
      setLoading(false);
    }
    fetchEvents();
  }, []);

  const liveEvents = events.filter(e => e.status === "live");
  const upcomingEvents = events.filter(e => e.status === "upcoming" || e.status === "pending");
  const allActiveEvents = [...liveEvents, ...upcomingEvents];

  const liveBattles = battles.filter(b => b.status === "active" || b.status === "judging").length;
  const liveTournaments = sanctionedTournaments.filter(t => t.status === "live" || t.status === "bracket" || t.status === "ready_up").length;
  const liveHosted = hostedComps.filter(c => c.status === "live" || c.status === "judging").length;
  const liveQuick = quickFights.filter(f => f.status === "active" || f.status === "judging").length;
  const totalLive = liveEvents.length + liveBattles + liveTournaments + liveHosted + liveQuick;

  // Quick fight filtering for Browse section
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

  const filters: { key: typeof activeFilter; label: string; icon?: React.ReactNode; accent?: string }[] = [
    { key: "all", label: "All" },
    { key: "quick", label: "Quick 1v1", icon: <Zap className="w-3 h-3" />, accent: "red" },
    { key: "battles", label: "1v1", icon: <Swords className="w-3 h-3" />, accent: "red" },
    { key: "official", label: "Official", icon: <InfinityIcon className="w-3 h-3" />, accent: "gold" },
    { key: "sanctioned", label: "Sanctioned", icon: <Shield className="w-3 h-3" /> },
    { key: "hosted", label: "Hosted", icon: <Globe className="w-3 h-3" />, accent: "cyan" },
    { key: "practice", label: "Practice" },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <LoopMonster />

      {/* ═══ HERO HEADER ═══ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/8 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

        <div className="relative px-4 pt-4 pb-4">
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                <InfinityIcon className="w-4 h-4 text-background" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-display text-lg text-foreground tracking-wide leading-none">ARENA</h1>
                <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Fight · Compete · Win</p>
              </div>
            </div>
            {totalLive > 0 && (
              <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-400">{totalLive} Live</span>
              </div>
            )}
          </div>

      {/* Quick Action Row - Brain-dead simple */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* Quick 1v1 CTA */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => profile ? navigate('/quick-fight') : navigate('/start')}
              className="relative overflow-hidden py-4 bg-gradient-to-br from-red-600 to-red-500 flex flex-col items-center justify-center gap-1 touch-manipulation rounded-xl shadow-[0_6px_24px_-4px_rgba(239,68,68,0.5),0_0_0_1px_rgba(255,255,255,0.08)_inset] hover:shadow-[0_8px_32px_-4px_rgba(239,68,68,0.6)]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,0.1)_50%,transparent_70%)] rounded-xl" />
              <Zap className="w-5 h-5 text-white" />
              <span className="font-display text-xs text-white uppercase tracking-wider">Quick 1v1</span>
              <span className="text-[9px] text-white/70 font-bold">+20 IDX</span>
            </motion.button>

            {/* Create Battle CTA */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => profile ? setShowCreateBattle(true) : navigate('/start')}
              className="py-4 bg-surface-1 border border-border hover:border-red-500/40 flex flex-col items-center justify-center gap-1 touch-manipulation transition-colors rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset] hover:shadow-[0_6px_28px_-4px_rgba(0,0,0,0.6),0_0_0_1px_rgba(239,68,68,0.1)]"
            >
              <Swords className="w-5 h-5 text-foreground" />
              <span className="font-display text-xs text-foreground uppercase tracking-wider">1v1 Battle</span>
              <span className="text-[9px] text-muted-foreground font-bold">+20 IDX</span>
            </motion.button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {filters.map(f => {
              const active = activeFilter === f.key;
              const isRed = f.accent === "red";
              const isGold = f.accent === "gold";
              const isCyan = f.accent === "cyan";
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1 shrink-0 rounded-full ${
                    active
                      ? isRed ? "bg-red-500 text-white border-red-500"
                      : isGold ? "bg-gold text-background border-gold"
                      : isCyan ? "bg-cyan-500 text-white border-cyan-500"
                      : "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
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

          {/* ═══ BROWSE QUICK 1v1s ═══ */}
          {(activeFilter === "all" || activeFilter === "quick") && (
            <motion.section key="quick-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<Zap className="w-4 h-4 text-red-400" />}
                title="Quick 1v1s"
                badge={liveQuick > 0 ? `${liveQuick} Live` : undefined}
                badgeColor="bg-red-500/20 border-red-500/40 text-red-400"
                action={
                  <button
                    onClick={() => profile ? navigate('/quick-fight') : navigate('/start')}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" /> Enter
                  </button>
                }
              />
              <p className="text-[9px] text-muted-foreground px-4 mb-2">Instant matchmaking • 3hr window • Winner +20 IDX, Loser -10 IDX</p>

              {/* Search */}
              <div className="px-4 mb-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search fights..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    className="h-9 pl-9 pr-8 bg-surface-1 border-border text-xs placeholder:text-muted-foreground/50 rounded-lg shadow-[0_2px_10px_-2px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.03)] focus:shadow-[0_4px_16px_-2px_rgba(239,68,68,0.15),0_0_0_1px_rgba(239,68,68,0.2)]"
                  />
                  {quickSearch && (
                    <button onClick={() => setQuickSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Fight List */}
              <div className="px-4 space-y-1.5">
                {quickLoading ? (
                  <div className="space-y-1.5">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : filteredQuickFights.length > 0 ? (
                  <>
                    {filteredQuickFights.slice(0, activeFilter === "quick" ? 50 : 5).map(fight => (
                      <Quick1v1Row key={fight.id} fight={fight} onClick={() => navigate(`/quick-fight?id=${fight.id}`)} />
                    ))}
                    {activeFilter !== "quick" && filteredQuickFights.length > 5 && (
                      <button
                        onClick={() => setActiveFilter("quick")}
                        className="w-full py-2.5 text-[10px] font-bold text-red-400 uppercase tracking-wider hover:bg-red-500/5 transition-colors flex items-center justify-center gap-1"
                      >
                        View All {filteredQuickFights.length} Fights
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 bg-surface-1/60 rounded-xl border border-border/50 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.02)]">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_-4px_rgba(239,68,68,0.15)]">
                      <Zap className="w-5 h-5 text-red-400/40" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{quickSearch ? "No matches found" : "No Quick 1v1s Yet"}</p>
                    <p className="text-[9px] text-muted-foreground/60 mb-3">Be the first to fight</p>
                    <Button
                      size="sm"
                      onClick={() => profile ? navigate('/quick-fight') : navigate('/start')}
                      className="bg-red-500 hover:bg-red-600 text-white text-[10px] rounded-lg shadow-[0_4px_16px_-4px_rgba(239,68,68,0.4)]"
                    >
                      <Zap className="w-3 h-3 mr-1" /> Start Quick 1v1
                    </Button>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* ═══ 1v1 BATTLES ═══ */}
          {(activeFilter === "all" || activeFilter === "battles") && (
            <motion.section key="battles-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<Swords className="w-4 h-4 text-red-400" />}
                title="1v1 Battles"
                badge={liveBattles > 0 ? `${liveBattles} Live` : undefined}
                badgeColor="bg-red-500/20 border-red-500/40 text-red-400"
              />
              <p className="text-[9px] text-muted-foreground px-4 mb-2">Head-to-head showdowns • Winner +20 IDX</p>

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
                </div>
              ) : (
                <div className="px-4">
                  <div className="bg-surface-1/60 border border-red-500/15 border-dashed p-6 text-center rounded-xl shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.02)]">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_-4px_rgba(239,68,68,0.1)]">
                      <Swords className="w-5 h-5 text-red-400/30" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">No active battles</p>
                    <Button
                      size="sm"
                      onClick={() => profile ? setShowCreateBattle(true) : navigate('/start')}
                      className="bg-red-500 hover:bg-red-600 text-white text-[10px] rounded-lg shadow-[0_4px_16px_-4px_rgba(239,68,68,0.4)]"
                    >
                      <Swords className="w-3 h-3 mr-1" /> Start a Battle
                    </Button>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* ═══ OFFICIAL EVENTS ═══ */}
          {(activeFilter === "all" || activeFilter === "official") && (
            <motion.section key="official-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<InfinityIcon className="w-4 h-4 text-gold" />}
                title="Official Events"
                badge={liveEvents.length > 0 ? `${liveEvents.length} Live` : undefined}
                badgeColor="bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                action={
                  <Link to="/events" className="text-[10px] text-muted-foreground hover:text-foreground">View All</Link>
                }
              />

              {allActiveEvents.length > 0 ? (
                <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2">
                  {allActiveEvents.map(event => <EventCard key={event.id} event={event} />)}
                </div>
              ) : (
                <div className="px-4">
                  <div className="bg-surface-1/60 border border-border/50 border-dashed p-6 text-center rounded-xl shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.02)]">
                    <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_-4px_rgba(202,138,4,0.1)]">
                      <InfinityIcon className="w-5 h-5 text-gold/30" />
                    </div>
                    <p className="text-xs text-muted-foreground">No active events</p>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* ═══ PREMIUM COMPS ═══ */}
          {activeFilter === "all" && hostedComps.filter(c => c.is_premium && (c.status === 'live' || c.status === 'judging')).length > 0 && (
            <motion.section key="premium-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<Crown className="w-4 h-4 text-purple-400" />}
                title="Premium Comps"
                badgeColor="bg-purple-500/20 border-purple-500/40 text-purple-400"
                badge="Easy Entry"
              />
              <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2">
                {hostedComps
                  .filter(c => c.is_premium && (c.status === 'live' || c.status === 'judging'))
                  .map(comp => (
                    <PremiumCompCard key={comp.id} comp={comp} onClick={() => navigate(`/hosted-comp/${comp.slug || comp.id}`)} />
                  ))}
              </div>
            </motion.section>
          )}

          {/* ═══ SANCTIONED TOURNAMENTS ═══ */}
          {(activeFilter === "all" || activeFilter === "sanctioned") && (
            <motion.section key="sanctioned-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader
                icon={<Shield className="w-4 h-4 text-gold" />}
                title="Sanctioned"
                badge={liveTournaments > 0 ? `${liveTournaments} Active` : undefined}
                badgeColor="bg-gold/20 border-gold/40 text-gold"
                action={
                  profile?.crew_id ? (
                    <Link to="/units" className="text-[10px] text-gold hover:text-gold/80 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Propose
                    </Link>
                  ) : undefined
                }
              />

              {sanctionedLoading ? (
                <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2">
                  <Skeleton className="h-48 w-[200px] shrink-0" />
                  <Skeleton className="h-48 w-[200px] shrink-0" />
                </div>
              ) : sanctionedTournaments.length > 0 ? (
                <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2">
                  {sanctionedTournaments.map(t => (
                    <SanctionedTournamentCard key={t.id} tournament={t} onClick={() => navigate(`/sanctioned/${t.id}`)} />
                  ))}
                </div>
              ) : (
                <div className="px-4">
                  <div className="bg-surface-1/60 border border-border/50 border-dashed p-6 text-center rounded-xl shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.02)]">
                    <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_-4px_rgba(202,138,4,0.1)]">
                      <Shield className="w-5 h-5 text-gold/30" />
                    </div>
                    <p className="text-xs text-muted-foreground">No active tournaments</p>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* ═══ HOSTED COMPS ═══ */}
          {(activeFilter === "all" || activeFilter === "hosted") && (
            <motion.section key="hosted-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Hosted Comps</span>
                <span className="bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.5 text-[8px] font-bold uppercase text-cyan-400">New</span>
              </div>
              <HostedCompCard onEnter={() => navigate('/hosted-comps')} />

              {hostedComps.filter(c => c.is_featured && (c.status === 'live' || c.status === 'judging')).length > 0 && (
                <div className="mt-3">
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-cyan-400 mb-2 block">Featured</span>
                  <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                    {hostedComps
                      .filter(c => c.is_featured && (c.status === 'live' || c.status === 'judging'))
                      .slice(0, 6)
                      .map(comp => (
                        <FeaturedHostedCompCard key={comp.id} comp={comp} onClick={() => navigate(`/hosted-comp/${comp.id}`)} />
                      ))}
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* ═══ PRACTICE ═══ */}
          {(activeFilter === "all" || activeFilter === "practice") && (
            <motion.section key="practice-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Practice Mode</span>
              </div>
              <PracticeModeCard onEnter={() => setShowPracticeMode(true)} />
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
