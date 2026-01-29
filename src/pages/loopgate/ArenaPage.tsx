import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Infinity as InfinityIcon, ChevronRight, Users, Trophy, 
  Flame, Calendar, Target, Shield, Swords,
  Search, X, TrendingUp, Plus, HelpCircle, CheckCircle2,
  Clock, Award, UserPlus, Eye, Globe
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoopMonster from "@/components/loopgate/LoopMonster";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import PracticeModeCard from "@/components/loopgate/PracticeModeCard";
import PracticeModeView from "@/components/loopgate/PracticeModeView";
import HostedCompCard from "@/components/loopgate/HostedCompCard";
import FeaturedHostedCompCard from "@/components/loopgate/FeaturedHostedCompCard";
import { useHostedCompetitions } from "@/hooks/useHostedCompetitions";
import SanctionedTournamentCard from "@/components/loopgate/SanctionedTournamentCard";
import BattleCard from "@/components/loopgate/BattleCard";
import CreateBattleModal from "@/components/loopgate/CreateBattleModal";
import { useSanctionedTournaments } from "@/hooks/useSanctionedTournaments";
import { useBattles } from "@/hooks/useBattles";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Official Events Card (for existing events from DB)
function OfficialEventCard({ event }: { event: Event }) {
  const isLive = event.status === "live";
  
  return (
    <Link to={`/event/${event.id}`} className="block shrink-0 w-[280px]">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-surface-1 border border-gold/30 hover:border-gold/60 transition-all overflow-hidden group"
      >
        {/* Poster */}
        <div className="relative h-32 overflow-hidden">
          {event.poster_url ? (
            <img
              src={event.poster_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gold/20 to-surface-2 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-gold/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/50 to-transparent" />
          
          {/* Status */}
          {isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-500 px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-background">Live</span>
            </div>
          )}
          
          {/* Prize */}
          {event.prize_pool && (
            <div className="absolute top-2 right-2 bg-background/90 border border-gold/50 px-2 py-1">
              <span className="text-xs font-display text-gold">{event.prize_pool}</span>
            </div>
          )}
          
          {/* Official badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-gold/90 px-2 py-0.5">
            <InfinityIcon className="w-3 h-3 text-background" />
            <span className="text-[8px] font-bold uppercase tracking-wider text-background">Official</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3">
          <h3 className="font-display text-sm text-foreground truncate mb-1">{event.title}</h3>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="uppercase">{event.league}</span>
            {event.xp_reward && (
              <>
                <span>•</span>
                <span className="text-gold flex items-center gap-0.5">
                  <Flame className="w-3 h-3" /> +{event.xp_reward} XP
                </span>
              </>
            )}
          </div>
          <div className="mt-2">
            <CountdownTimer 
              endDate={isLive ? event.end_date : event.start_date}
              label={isLive ? "Ends" : "Starts"}
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function ArenaPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "official" | "sanctioned" | "battles" | "hosted" | "practice">("all");
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  const [showCreateBattle, setShowCreateBattle] = useState(false);
  
  // Sanctioned tournaments - show approved, ready_up, live, bracket statuses
  const { tournaments: sanctionedTournaments, loading: sanctionedLoading } = useSanctionedTournaments(
    ["approved", "ready_up", "live", "bracket", "completed"]
  );
  
  // 1v1 Battles - show active, pending, judging
  const { battles, loading: battlesLoading } = useBattles(
    ["pending", "active", "judging", "completed"]
  );
  
  // Hosted Competitions - show live/judging for featured section
  const { competitions: hostedComps, loading: hostedLoading } = useHostedCompetitions();
  
  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

      if (!error && data) {
        setEvents(data);
      }
      setLoading(false);
    }
    fetchEvents();
  }, []);

  const liveEvents = events.filter(e => e.status === "live");
  const upcomingEvents = events.filter(e => e.status === "upcoming" || e.status === "pending");
  const allActiveEvents = [...liveEvents, ...upcomingEvents];

  // Real stats from database
  const totalLiveEvents = liveEvents.length;

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return events.filter(e => 
      e.title.toLowerCase().includes(query) ||
      (e.subtitle && e.subtitle.toLowerCase().includes(query))
    );
  }, [searchQuery, events]);
  // Show Practice Mode view if active
  if (showPracticeMode) {
    return <PracticeModeView onBack={() => setShowPracticeMode(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <LoopMonster />

      {/* ═══════════════════════════════════════════════════════════════════
          ARENA HEADER - Scalable, search-first design
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Background layers - cinematic depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-1 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,hsl(var(--gold)/0.12),transparent_50%)]" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Animated glow */}
        <motion.div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_hsl(var(--gold)/0.08)_0%,_transparent_40%)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        {/* Header content */}
        <div className="relative px-4 pt-5 pb-5">
          {/* Top row: Logo + Live Stats */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold via-amber-400 to-gold flex items-center justify-center shadow-lg shadow-gold/40">
                <InfinityIcon className="w-[18px] h-[18px] text-background" />
              </div>
              <div>
                <h1 className="font-display text-xl text-foreground tracking-wide leading-none">ARENA</h1>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Tournaments & Events</p>
              </div>
            </div>
            
            {/* Live Stats Pill */}
            <div className="flex items-center gap-3 bg-surface-1/80 border border-border px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-foreground font-medium">{totalLiveEvents}</span>
                <span className="text-[9px] text-muted-foreground">Live</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-foreground font-medium">{allActiveEvents.length}</span>
                <span className="text-[9px] text-muted-foreground">Events</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search tournaments, crews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-10 bg-surface-1 border-border focus:border-gold/50 text-sm placeholder:text-muted-foreground/60"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0 ${
                activeFilter === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
              }`}
            >
              All
            </button>
            
            {/* OFFICIAL EVENTS - Prominent with gold accent */}
            <button
              onClick={() => setActiveFilter("official")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 shrink-0 ${
                activeFilter === "official"
                  ? "bg-gradient-to-r from-gold to-amber-500 text-background border-gold shadow-lg shadow-gold/30"
                  : "bg-transparent text-gold border-gold/50 hover:border-gold hover:bg-gold/5"
              }`}
            >
              <InfinityIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              Official Events
            </button>
            
            <button
              onClick={() => setActiveFilter("sanctioned")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 shrink-0 ${
                activeFilter === "sanctioned"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
              }`}
            >
              <Shield className="w-3 h-3" />
              Sanctioned
            </button>
            
            {/* 1v1 BATTLES - UFC Style */}
            <button
              onClick={() => setActiveFilter("battles")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 shrink-0 ${
                activeFilter === "battles"
                  ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30"
                  : "bg-transparent text-red-400 border-red-500/50 hover:border-red-500 hover:bg-red-500/5"
              }`}
            >
              <Swords className="w-3 h-3" />
              1v1 Battles
            </button>
            
            <button
              onClick={() => setActiveFilter("practice")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0 ${
                activeFilter === "practice"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
              }`}
            >
              Practice
            </button>
            
            {/* HOSTED COMPS - Community competitions */}
            <button
              onClick={() => setActiveFilter("hosted")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 shrink-0 ${
                activeFilter === "hosted"
                  ? "bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/30"
                  : "bg-transparent text-cyan-400 border-cyan-500/50 hover:border-cyan-500 hover:bg-cyan-500/5"
              }`}
            >
              <Globe className="w-3 h-3" />
              Hosted
            </button>
          </div>
        </div>
      </div>

      {/* Search Results Mode */}
      {searchQuery && (
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mt-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">
              {filteredEvents.length} result{filteredEvents.length !== 1 ? 's' : ''} for "{searchQuery}"
            </span>
            <button 
              onClick={() => setSearchQuery("")}
              className="text-[10px] text-gold hover:underline"
            >
              Clear search
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-2.5">
            {filteredEvents.map((event) => (
              <OfficialEventCard key={event.id} event={event} />
            ))}
          </div>
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No events found</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Try a different search term</p>
            </div>
          )}
        </motion.section>
      )}

      {/* Loading State */}
      {loading && !searchQuery && (
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="h-64 w-[200px] shrink-0" />
            <Skeleton className="h-64 w-[200px] shrink-0" />
          </div>
        </div>
      )}

      {/* Main Content - Only show when not searching */}
      {!loading && !searchQuery && (
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════════════════
              ALL TAB - Shows all sections stacked
          ═══════════════════════════════════════════════════════════════════ */}
          {(activeFilter === "all" || activeFilter === "official") && (
            <motion.section
              key="official-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <div className="flex items-center justify-between px-4 mb-3">
                <div className="flex items-center gap-2">
                  <InfinityIcon className="w-4 h-4 text-gold" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Official Events
                  </span>
                  {liveEvents.length > 0 && (
                    <span className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] text-emerald-400 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {liveEvents.length} Live
                    </span>
                  )}
                </div>
                <Link to="/events" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  View All
                </Link>
              </div>

              {allActiveEvents.length > 0 ? (
                <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
                  {allActiveEvents.map((event) => (
                    <OfficialEventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="px-4">
                  <div className="bg-surface-1 border border-border p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                      <InfinityIcon className="w-8 h-8 text-gold/50" />
                    </div>
                    <h3 className="font-display text-xl text-foreground mb-2">No Active Events</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      New competitions drop regularly. Get ranked while you wait.
                    </p>
                    <Button
                      onClick={() => navigate('/gqt')}
                      className="bg-gradient-to-r from-gold via-amber-400 to-gold text-background font-display hover:shadow-lg hover:shadow-gold/30 transition-all"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Take the GQT
                    </Button>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SANCTIONED SECTION - Shows in ALL and SANCTIONED tabs
          ═══════════════════════════════════════════════════════════════════ */}
          {(activeFilter === "all" || activeFilter === "sanctioned") && (
            <motion.section
              key="sanctioned-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between px-4 mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gold" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Sanctioned Tournaments
                  </span>
                  {sanctionedTournaments.filter(t => t.status === "live" || t.status === "ready_up").length > 0 && (
                    <span className="flex items-center gap-1 bg-gold/20 border border-gold/40 px-2 py-0.5 text-[9px] text-gold uppercase">
                      {sanctionedTournaments.filter(t => t.status === "live" || t.status === "ready_up").length} Active
                    </span>
                  )}
                </div>
                {profile?.crew_id && (
                  <Link 
                    to="/crews" 
                    className="text-[10px] text-gold hover:text-gold/80 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Propose
                  </Link>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mb-3 px-4">
                Crew-hosted tournaments with official Index prizes
              </p>

              {/* How It Works - Collapsible Info Guide */}
              <Collapsible className="mx-4 mb-4">
                <CollapsibleTrigger className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors group">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider">How It Works</span>
                  <ChevronRight className="w-3 h-3 transition-transform group-data-[state=open]:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="bg-surface-1/80 border border-border p-4 space-y-4">
                    {/* What are Sanctioned Tournaments */}
                    <div>
                      <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-gold" />
                        What is a Sanctioned Tournament?
                      </h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Sanctioned tournaments are high-stakes, crew-hosted competitions officially approved by LOOPGATE admins. Winners earn <span className="text-gold font-bold">Index points</span> and <span className="text-purple-400 font-bold">XP</span> that count toward global rankings.
                      </p>
                    </div>

                    {/* Who Can Create */}
                    <div>
                      <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                        <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                        Who Can Create One?
                      </h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        <span className="text-foreground font-medium">Crew Owners</span> can propose a sanctioned tournament from their crew page. Proposals are reviewed by admins who set the official prize pool.
                      </p>
                    </div>

                    {/* How It Works Steps */}
                    <div>
                      <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        Tournament Lifecycle
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[9px] font-bold text-gold">1</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-foreground font-medium">Lobby Phase</p>
                            <p className="text-[9px] text-muted-foreground">Editors join and ready up. Tournament starts when max capacity is reached or enough are ready.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[9px] font-bold text-emerald-400">2</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-foreground font-medium">Submission Phase</p>
                            <p className="text-[9px] text-muted-foreground">Theme revealed! 48h to create and submit your edit via TikTok, YouTube, or Instagram.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[9px] font-bold text-sky-400">3</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-foreground font-medium">Bracket Phase</p>
                            <p className="text-[9px] text-muted-foreground">Single-elimination bracket judged by QOI scores. Best edits advance to finals.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                            <Award className="w-2.5 h-2.5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-foreground font-medium">Prizes Awarded</p>
                            <p className="text-[9px] text-muted-foreground">Top 3 earn Index points. All participants gain XP based on placement.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Join CTA */}
                    {!profile?.crew_id && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-[10px] text-muted-foreground mb-2">
                          Want to host your own tournaments?
                        </p>
                        <Link 
                          to="/crews"
                          className="inline-flex items-center gap-2 text-[10px] text-gold hover:text-gold/80 font-medium transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          Join or Create a Crew
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {sanctionedLoading ? (
                <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
                  <Skeleton className="h-56 w-[200px] shrink-0" />
                  <Skeleton className="h-56 w-[200px] shrink-0" />
                </div>
              ) : sanctionedTournaments.length > 0 ? (
                <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
                  {sanctionedTournaments.map((tournament) => (
                    <SanctionedTournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onClick={() => navigate(`/sanctioned/${tournament.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-4">
                  <div className="bg-surface-1/50 border border-border border-dashed p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6 text-gold/40" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">No Active Tournaments</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {profile?.crew_id 
                        ? "Your crew can propose a tournament for approval"
                        : "Join a crew to propose sanctioned tournaments"
                      }
                    </p>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              1v1 BATTLES SECTION - UFC of Loopgate
          ═══════════════════════════════════════════════════════════════════ */}
          {(activeFilter === "all" || activeFilter === "battles") && (
            <motion.section
              key="battles-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between px-4 mb-3">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    1v1 Battles
                  </span>
                  {battles.filter(b => b.status === "active").length > 0 && (
                    <span className="flex items-center gap-1 bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[9px] text-red-400 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      {battles.filter(b => b.status === "active").length} Live
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3 px-4">
                Head-to-head showdowns • Winner takes +20 Index
              </p>
              
              {/* Create Battle CTA */}
              <div className="px-4 mb-4">
                {profile ? (
                  <button 
                    onClick={() => setShowCreateBattle(true)}
                    className="w-full py-3 bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:via-red-400 hover:to-red-500 text-white font-display text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-all"
                  >
                    <Swords className="w-4 h-4" />
                    Start a 1v1 Battle
                  </button>
                ) : (
                  <Link 
                    to="/start"
                    className="w-full py-3 bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:via-red-400 hover:to-red-500 text-white font-display text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-all"
                  >
                    <Swords className="w-4 h-4" />
                    Sign In to Battle
                  </Link>
                )}
              </div>

              {battlesLoading ? (
                <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
                  <Skeleton className="h-48 w-[220px] shrink-0" />
                  <Skeleton className="h-48 w-[220px] shrink-0" />
                </div>
              ) : battles.length > 0 ? (
                <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
                  {battles.slice(0, 10).map((battle) => (
                    <BattleCard
                      key={battle.id}
                      battle={battle}
                      onClick={() => navigate(`/battle/${battle.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-4">
                  <div className="bg-surface-1/50 border border-red-500/20 border-dashed p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                      <Swords className="w-6 h-6 text-red-400/40" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">No Active Battles</p>
                    <p className="text-[10px] text-muted-foreground/60 mb-4">
                      Be the first to throw down
                    </p>
                    {profile ? (
                      <Button
                        onClick={() => setShowCreateBattle(true)}
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Swords className="w-3.5 h-3.5 mr-1.5" />
                        Start a Battle
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Link to="/start">
                          <Swords className="w-3.5 h-3.5 mr-1.5" />
                          Sign In to Battle
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              HOSTED COMPS SECTION - External Community Competitions
          ═══════════════════════════════════════════════════════════════════ */}
          {(activeFilter === "all" || activeFilter === "hosted") && (
            <motion.section
              key="hosted-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 mt-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Hosted Comps
                </span>
                <div className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 ml-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">New</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
              </div>
              <p className="text-[10px] text-muted-foreground mb-4">
                Discord servers & creators host their competitions on Loopgate infra.
              </p>

              {/* Hosted Comp Entry Card */}
              <HostedCompCard onEnter={() => navigate('/hosted-comps')} />

              {/* Featured Hosted Comps */}
              {hostedComps.filter(c => c.status === 'live' || c.status === 'judging').length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">
                      Featured Comps
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                    {hostedComps
                      .filter(c => c.status === 'live' || c.status === 'judging')
                      .slice(0, 6)
                      .map((comp) => (
                        <FeaturedHostedCompCard
                          key={comp.id}
                          comp={comp}
                          onClick={() => navigate(`/hosted-comp/${comp.id}`)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              PRACTICE SECTION - Shows in ALL and PRACTICE tabs
          ═══════════════════════════════════════════════════════════════════ */}
          {(activeFilter === "all" || activeFilter === "practice") && (
            <motion.section
              key="practice-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 mt-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Practice Mode
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
              </div>
              <p className="text-[10px] text-muted-foreground mb-4">
                Train, spar, and earn XP. No Index risk.
              </p>

              {/* Practice Mode Entry Card */}
              <PracticeModeCard onEnter={() => setShowPracticeMode(true)} />
            </motion.section>
          )}

          {/* Bottom spacing for nav */}
          <div className="h-8" />
        </AnimatePresence>
      )}
      
      {/* Create Battle Modal */}
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
