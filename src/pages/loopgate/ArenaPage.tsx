import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Infinity as InfinityIcon, ChevronRight, Clock, Users, Trophy, Flame, Calendar, ArrowRight, Play, Swords, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoopMonster from "@/components/loopgate/LoopMonster";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
  const pastEvents = events.filter(e => e.status === "completed" || e.status === "ended");
  
  const primaryEvent = liveEvents[0] || upcomingEvents[0];

  return (
    <div className="min-h-screen bg-background pb-32">
      <LoopMonster />

      {/* ═══════════════════════════════════════════════════════════════════
          CINEMATIC HERO - THE ARENA CENTERPIECE
          Like Fortnite's Play button - where shit goes down
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Background layers - dramatic and dark */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-1 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--gold)/0.08),transparent_60%)]" />
        
        {/* Animated pulse effect - subtle but alive */}
        <motion.div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_hsl(var(--gold)/0.05)_0%,_transparent_50%)]"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* Hero content */}
        <div className="relative px-4 pt-6 pb-8">
        {/* Arena header - minimal */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold via-amber-400 to-gold flex items-center justify-center shadow-lg shadow-gold/30">
              <InfinityIcon className="w-4 h-4 text-background" />
            </div>
            <h1 className="font-display text-2xl text-foreground tracking-wide">ARENA</h1>
          </div>

          {/* MAIN PLAY CARD - The Hero */}
          {primaryEvent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Link to={`/event/${primaryEvent.id}`} className="block group">
                <div className="relative overflow-hidden bg-surface-1 border-2 border-gold/40 group-hover:border-gold/70 transition-all duration-300">
                  {/* Full-bleed poster */}
                  {primaryEvent.poster_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={primaryEvent.poster_url}
                        alt={primaryEvent.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/60 to-transparent" />
                      
                      {/* Status badge - top left */}
                      {primaryEvent.status === "live" && (
                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-emerald-500 px-3 py-1.5">
                          <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-background">
                            LIVE NOW
                          </span>
                        </div>
                      )}
                      
                      {/* Prize overlay - top right */}
                      {primaryEvent.prize_pool && (
                        <div className="absolute top-3 right-3 bg-background/90 border border-gold/50 px-3 py-1.5">
                          <span className="font-display text-lg text-gold">{primaryEvent.prize_pool}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content area */}
                  <div className="p-5">
                    {/* Meta row */}
                    <div className="flex items-center gap-3 mb-2">
                      {primaryEvent.event_mode === "open_arena" && (
                        <span className="text-[9px] text-gold font-bold uppercase tracking-widest border border-gold/40 px-2 py-0.5">
                          OPEN ARENA
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                        {primaryEvent.league} League
                      </span>
                    </div>

                    {/* Title - big and bold */}
                    <h2 className="font-display text-3xl text-foreground leading-tight mb-3">
                      {primaryEvent.title}
                    </h2>

                    {/* Countdown - clean */}
                    <div className="bg-background border border-border p-3 mb-5">
                      <CountdownTimer 
                        endDate={primaryEvent.status === "live" ? primaryEvent.end_date : primaryEvent.start_date}
                        label={primaryEvent.status === "live" ? "Ends in" : "Starts in"}
                        large
                      />
                    </div>

                    {/* CTA - THE PLAY BUTTON */}
                    <div className="flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-gold via-amber-400 to-gold group-hover:shadow-lg group-hover:shadow-gold/30 transition-shadow">
                      <Play className="w-6 h-6 text-background fill-current" />
                      <span className="font-display text-xl tracking-wide text-background">
                        {primaryEvent.status === "live" ? "ENTER NOW" : "VIEW EVENT"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ) : (
            /* No event state - still prominent */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-surface-1 border border-border p-8 text-center"
            >
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
            </motion.div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECONDARY EVENTS - Other live/upcoming events (if any)
      ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Other Live Events (if more than primary) */}
      {liveEvents.length > 1 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 mt-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Also Live</span>
          </div>

          <div className="space-y-2">
            {liveEvents.slice(1).map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <div className="flex items-center gap-3 p-3 bg-surface-1/60 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors group">
                  {event.poster_url && (
                    <div className="w-12 h-16 rounded overflow-hidden shrink-0">
                      <img src={event.poster_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-foreground truncate">{event.title}</p>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      <CountdownTimer endDate={event.end_date} />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > (liveEvents.length === 0 ? 1 : 0) && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">Coming Soon</span>
            </div>
          </div>

          <div className="space-y-2">
            {upcomingEvents.slice(liveEvents.length === 0 ? 1 : 0, 4).map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <div className="flex items-center gap-3 p-3 bg-surface-1/40 border border-border/50 hover:border-gold/30 transition-colors group">
                  {event.poster_url && (
                    <div className="w-10 h-14 rounded overflow-hidden shrink-0">
                      <img src={event.poster_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-foreground truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{event.league}</span>
                      {event.xp_reward && (
                        <span className="text-[9px] text-gold flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> +{event.xp_reward} XP
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted-foreground">
                      <CountdownTimer endDate={event.start_date} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* Past Events Link */}
      {pastEvents.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="px-4 mt-8"
        >
          <Link 
            to="/events"
            className="flex items-center justify-between p-4 bg-surface-1/30 border border-border/30 hover:border-border/50 transition-all group"
          >
            <div>
              <span className="text-sm font-display text-foreground">View All Events</span>
              <p className="text-[10px] text-muted-foreground">
                {pastEvents.length} completed • {liveEvents.length + upcomingEvents.length} active
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </Link>
        </motion.section>
      )}

      {/* Loading State */}
      {loading && (
        <div className="px-4 py-8">
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-16 w-full mb-2" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}
    </div>
  );
}
