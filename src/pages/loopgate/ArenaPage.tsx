import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Infinity as InfinityIcon, ChevronRight, Users, Trophy, 
  Flame, Calendar, Target, Shield, 
  Search, X, TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoopMonster from "@/components/loopgate/LoopMonster";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import PracticeModeCard from "@/components/loopgate/PracticeModeCard";
import PracticeModeView from "@/components/loopgate/PracticeModeView";
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
  const [activeFilter, setActiveFilter] = useState<"all" | "sanctioned" | "practice">("all");
  const [showPracticeMode, setShowPracticeMode] = useState(false);
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                activeFilter === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("sanctioned")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                activeFilter === "sanctioned"
                  ? "bg-gold text-background border-gold"
                  : "bg-transparent text-muted-foreground border-border hover:border-gold/50"
              }`}
            >
              <Shield className="w-3 h-3" />
              Sanctioned
            </button>
            <button
              onClick={() => setActiveFilter("practice")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                activeFilter === "practice"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
              }`}
            >
              Practice
            </button>
            
            {/* Trending indicator */}
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{allActiveEvents.length} Active</span>
            </div>
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
              ALL TAB - Official Events + Overview
          ═══════════════════════════════════════════════════════════════════ */}
          {activeFilter === "all" && (
            <motion.div
              key="all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {allActiveEvents.length > 0 && (
                <motion.section className="mt-4">
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
                  
                  <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
                    {allActiveEvents.map((event) => (
                      <OfficialEventCard key={event.id} event={event} />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Quick Access Cards */}
              <div className="px-4 mt-6 grid grid-cols-2 gap-3">
                {/* Sanctioned Quick Access */}
                <button
                  onClick={() => setActiveFilter("sanctioned")}
                  className="bg-surface-1 border border-gold/30 hover:border-gold/60 p-4 text-left transition-all group"
                >
                  <Shield className="w-6 h-6 text-gold mb-2" />
                  <h4 className="text-sm font-medium text-foreground mb-1">Sanctioned</h4>
                  <p className="text-[10px] text-muted-foreground">Community brackets</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Practice Quick Access */}
                <button
                  onClick={() => setActiveFilter("practice")}
                  className="bg-surface-1 border border-emerald-500/30 hover:border-emerald-500/60 p-4 text-left transition-all group"
                >
                  <span className="text-2xl mb-2 block">✨</span>
                  <h4 className="text-sm font-medium text-foreground mb-1">Practice</h4>
                  <p className="text-[10px] text-muted-foreground">1v1 & Friendly Comps</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Empty State */}
              {allActiveEvents.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 mt-8"
                >
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
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SANCTIONED TAB - Community Tournaments
          ═══════════════════════════════════════════════════════════════════ */}
          {activeFilter === "sanctioned" && (
            <motion.div
              key="sanctioned"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 mt-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Sanctioned Tournaments
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent" />
              </div>

              {/* Coming Soon State */}
              <div className="bg-surface-1/50 border border-border border-dashed p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-gold/40" />
                </div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Sanctioned Tournaments Coming Soon</p>
                <p className="text-[10px] text-muted-foreground/60">
                  Crew-hosted competitive brackets with official prizes
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              PRACTICE TAB - Practice Mode Full View
          ═══════════════════════════════════════════════════════════════════ */}
          {activeFilter === "practice" && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 mt-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">✨</span>
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
            </motion.div>
          )}

          {/* Bottom spacing for nav */}
          <div className="h-8" />
        </AnimatePresence>
      )}
    </div>
  );
}
