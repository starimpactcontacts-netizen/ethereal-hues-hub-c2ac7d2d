import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Infinity as InfinityIcon, ChevronRight, Clock, Users, Trophy, 
  Flame, Calendar, Play, Swords, Target, Shield, Zap, Gamepad2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoopMonster from "@/components/loopgate/LoopMonster";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import TournamentCard, { type Tournament, type TournamentPhase } from "@/components/loopgate/TournamentCard";
import TournamentDetailView from "@/components/loopgate/TournamentDetailView";
import { 
  mockTournaments, 
  readyUpTournaments, 
  liveTournaments, 
  upcomingTournaments, 
  practiceScrims 
} from "@/data/mockTournaments";

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

// Horizontal carousel section component
function TournamentCarousel({ 
  title, 
  icon: Icon, 
  tournaments, 
  accentColor = "text-foreground",
  onTournamentClick 
}: { 
  title: string; 
  icon: React.ElementType;
  tournaments: Tournament[];
  accentColor?: string;
  onTournamentClick: (tournament: Tournament) => void;
}) {
  if (tournaments.length === 0) return null;
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accentColor}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            {title}
          </span>
          <span className="text-[10px] text-muted-foreground">
            ({tournaments.length})
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      
      {/* Horizontal Scroll */}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
        {tournaments.map((tournament) => (
          <TournamentCard 
            key={tournament.id} 
            tournament={tournament}
            onClick={() => onTournamentClick(tournament)}
          />
        ))}
      </div>
    </motion.section>
  );
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
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isUserReady, setIsUserReady] = useState(false);

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

  const handleReadyUp = () => {
    setIsUserReady(true);
    // In a real implementation, this would call an API
  };

  // Tournament Detail View
  if (selectedTournament) {
    return (
      <TournamentDetailView
        tournament={selectedTournament}
        onBack={() => setSelectedTournament(null)}
        onReadyUp={handleReadyUp}
        isUserReady={isUserReady}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <LoopMonster />

      {/* ═══════════════════════════════════════════════════════════════════
          ARENA HEADER - Clean, competitive feel
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-1 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--gold)/0.08),transparent_60%)]" />
        
        {/* Animated pulse */}
        <motion.div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_hsl(var(--gold)/0.05)_0%,_transparent_50%)]"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* Header content */}
        <div className="relative px-4 pt-6 pb-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold via-amber-400 to-gold flex items-center justify-center shadow-lg shadow-gold/30">
              <InfinityIcon className="w-4 h-4 text-background" />
            </div>
            <h1 className="font-display text-2xl text-foreground tracking-wide">ARENA</h1>
          </div>
          
          {/* Subtitle */}
          <p className="text-center text-xs text-muted-foreground max-w-[280px] mx-auto">
            Compete in official events and sanctioned tournaments
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="h-64 w-[200px] shrink-0" />
            <Skeleton className="h-64 w-[200px] shrink-0" />
          </div>
        </div>
      )}

      {!loading && (
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════════════════
              OFFICIAL EVENTS - From the database (existing events)
          ═══════════════════════════════════════════════════════════════════ */}
          {allActiveEvents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
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
              
              <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
                {allActiveEvents.map((event) => (
                  <OfficialEventCard key={event.id} event={event} />
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SANCTIONED TOURNAMENTS - The new carousel sections
          ═══════════════════════════════════════════════════════════════════ */}
          
          {/* Section divider */}
          <div className="px-4 mt-8 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" />
                <span className="font-display text-sm text-foreground">SANCTIONED TOURNAMENTS</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Community-hosted tournaments with official backing
            </p>
          </div>

          {/* Ready-Up Tournaments */}
          <TournamentCarousel
            title="Ready Up Now"
            icon={Zap}
            tournaments={readyUpTournaments}
            accentColor="text-amber-400"
            onTournamentClick={setSelectedTournament}
          />

          {/* Live / In Progress */}
          <TournamentCarousel
            title="Live Tournaments"
            icon={Swords}
            tournaments={liveTournaments}
            accentColor="text-emerald-400"
            onTournamentClick={setSelectedTournament}
          />

          {/* Upcoming */}
          <TournamentCarousel
            title="Upcoming"
            icon={Calendar}
            tournaments={upcomingTournaments}
            accentColor="text-sky-400"
            onTournamentClick={setSelectedTournament}
          />

          {/* Practice / Scrims */}
          <TournamentCarousel
            title="Practice & Scrims"
            icon={Gamepad2}
            tournaments={practiceScrims}
            accentColor="text-muted-foreground"
            onTournamentClick={setSelectedTournament}
          />

          {/* ═══════════════════════════════════════════════════════════════════
              EMPTY STATE - When nothing is happening
          ═══════════════════════════════════════════════════════════════════ */}
          {allActiveEvents.length === 0 && mockTournaments.length === 0 && (
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

          {/* Bottom spacing for nav */}
          <div className="h-8" />
        </AnimatePresence>
      )}
    </div>
  );
}
