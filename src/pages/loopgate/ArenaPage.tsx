import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Infinity as InfinityIcon, ChevronRight, Users, Trophy, 
  Flame, Target, Shield, Swords, Search, X, Globe, Crown,
  Zap, Play, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoopMonster from "@/components/loopgate/LoopMonster";
import PracticeModeView from "@/components/loopgate/PracticeModeView";
import { useHostedCompetitions } from "@/hooks/useHostedCompetitions";
import { useSanctionedTournaments } from "@/hooks/useSanctionedTournaments";
import { useBattles } from "@/hooks/useBattles";
import CreateBattleModal from "@/components/loopgate/CreateBattleModal";
import BattleCard from "@/components/loopgate/BattleCard";
import SanctionedTournamentCard from "@/components/loopgate/SanctionedTournamentCard";
import FeaturedHostedCompCard from "@/components/loopgate/FeaturedHostedCompCard";
import PremiumCompCard from "@/components/loopgate/PremiumCompCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function ArenaPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  const [showCreateBattle, setShowCreateBattle] = useState(false);
  
  const { tournaments: sanctionedTournaments, loading: sanctionedLoading } = useSanctionedTournaments(
    ["approved", "ready_up", "live", "bracket", "completed"]
  );
  const { battles, loading: battlesLoading } = useBattles(
    ["pending", "active", "judging", "completed"]
  );
  const { competitions: hostedComps, loading: hostedLoading } = useHostedCompetitions();
  
  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });
      if (!error && data) setEvents(data);
      setLoading(false);
    }
    fetchEvents();
  }, []);

  const liveEvents = events.filter(e => e.status === "live");
  const upcomingEvents = events.filter(e => e.status === "upcoming" || e.status === "pending");
  const liveBattles = battles.filter(b => b.status === "active" || b.status === "judging").length;
  const liveTournaments = sanctionedTournaments.filter(t => t.status === "live" || t.status === "bracket" || t.status === "ready_up").length;
  const totalLive = liveEvents.length + liveBattles + liveTournaments;

  if (showPracticeMode) {
    return <PracticeModeView onBack={() => setShowPracticeMode(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <LoopMonster />

      {/* ══════ SIMPLE HEADER ══════ */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-foreground tracking-wide">ARENA</h1>
          {totalLive > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-400">{totalLive} LIVE</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-10 pr-8 bg-muted border-border rounded-xl text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* ══════ BIG ACTION CARDS ══════ */}
      {!searchQuery && (
        <div className="px-4 space-y-3">

          {/* ⚡ QUICK 1v1 — Hero CTA */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/hub')}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-5 text-left touch-manipulation active:scale-[0.98] transition-transform relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/20 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-white" />
                <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider">Instant Match</span>
              </div>
              <h2 className="font-display text-xl text-white tracking-wide">QUICK 1v1</h2>
              <p className="text-white/60 text-xs mt-1">Tap → Match → Edit → Win</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">🏆 +20 IDX</span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">⏱ 3 Hours</span>
              </div>
            </div>
          </motion.button>

          {/* 🗡️ 1v1 BATTLE — Challenge someone */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => profile ? setShowCreateBattle(true) : navigate('/start')}
            className="w-full bg-muted border border-red-500/30 rounded-2xl p-4 text-left touch-manipulation active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display text-sm text-foreground">1v1 BATTLE</h3>
                  <p className="text-[10px] text-muted-foreground">Challenge any editor</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {liveBattles > 0 && (
                  <span className="text-[10px] text-red-400 font-bold">{liveBattles} live</span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </motion.button>

          {/* Live Battles Strip */}
          {battles.filter(b => b.status === "active" || b.status === "judging" || b.status === "pending").length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {battles.filter(b => b.status === "active" || b.status === "judging" || b.status === "pending").slice(0, 8).map((battle) => (
                <BattleCard key={battle.id} battle={battle} onClick={() => navigate(`/battle/${battle.id}`)} />
              ))}
            </div>
          )}

          {/* 🏟️ OFFICIAL EVENTS */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link
              to="/events"
              className="w-full bg-muted border border-gold/30 rounded-2xl p-4 flex items-center justify-between touch-manipulation active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center">
                  <InfinityIcon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-display text-sm text-foreground">OFFICIAL EVENTS</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {liveEvents.length > 0 ? `${liveEvents.length} live now` : 'Loopgate-run competitions'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </motion.div>

          {/* 🛡️ SANCTIONED TOURNAMENTS */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="bg-muted border border-gold/20 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm text-foreground">SANCTIONED</h3>
                    <p className="text-[10px] text-muted-foreground">Unit tournaments • Index prizes</p>
                  </div>
                </div>
                {liveTournaments > 0 && (
                  <span className="bg-gold/20 text-gold text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {liveTournaments} active
                  </span>
                )}
              </div>

              {sanctionedLoading ? (
                <Skeleton className="h-40 w-full rounded-xl" />
              ) : sanctionedTournaments.length > 0 ? (
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                  {sanctionedTournaments.map((t) => (
                    <SanctionedTournamentCard key={t.id} tournament={t} onClick={() => navigate(`/sanctioned/${t.id}`)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-background/50 rounded-xl border border-border">
                  <Shield className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No tournaments yet</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* 🌐 HOSTED COMPS */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/hosted-comps')}
            className="w-full bg-muted border border-cyan-500/30 rounded-2xl p-4 text-left touch-manipulation active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-display text-sm text-foreground">HOSTED COMPS</h3>
                  <p className="text-[10px] text-muted-foreground">Community competitions</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.button>

          {/* Featured Hosted Comps strip */}
          {hostedComps.filter(c => c.is_featured && (c.status === 'live' || c.status === 'judging')).length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {hostedComps
                .filter(c => c.is_featured && (c.status === 'live' || c.status === 'judging'))
                .slice(0, 6)
                .map((comp) => (
                  <FeaturedHostedCompCard key={comp.id} comp={comp} onClick={() => navigate(`/hosted-comp/${comp.id}`)} />
                ))}
            </div>
          )}

          {/* Premium Comps strip */}
          {hostedComps.filter(c => c.is_premium && (c.status === 'live' || c.status === 'judging')).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Premium</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                {hostedComps
                  .filter(c => c.is_premium && (c.status === 'live' || c.status === 'judging'))
                  .map((comp) => (
                    <PremiumCompCard key={comp.id} comp={comp} onClick={() => navigate(`/hosted-comp/${comp.slug || comp.id}`)} />
                  ))}
              </div>
            </div>
          )}

          {/* 🎯 PRACTICE */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => setShowPracticeMode(true)}
            className="w-full bg-muted border border-emerald-500/30 rounded-2xl p-4 text-left touch-manipulation active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-display text-sm text-foreground">PRACTICE</h3>
                  <p className="text-[10px] text-muted-foreground">Train & earn XP • No risk</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.button>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div className="px-4 space-y-2">
          {events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
           sanctionedTournaments.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nothing found</p>
            </div>
          ) : (
            <>
              {events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).map(e => (
                <Link key={e.id} to={`/event/${e.id}`} className="flex items-center gap-3 p-3 bg-muted rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center shrink-0">
                    <InfinityIcon className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                    <p className="text-[10px] text-muted-foreground">{e.status} • {e.league}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
              {sanctionedTournaments.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                <button key={t.id} onClick={() => navigate(`/sanctioned/${t.id}`)} className="w-full flex items-center gap-3 p-3 bg-muted rounded-xl border border-border text-left">
                  <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.status}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </>
          )}
        </div>
      )}

      <CreateBattleModal 
        isOpen={showCreateBattle}
        onClose={() => setShowCreateBattle(false)}
        onSuccess={(battleId) => {
          setShowCreateBattle(false);
          navigate(`/battle/${battleId}`);
        }}
      />
    </div>
  );
}
