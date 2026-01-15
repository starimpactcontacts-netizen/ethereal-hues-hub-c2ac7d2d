import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ChevronRight, Clock, Users, Trophy, Flame, Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoopMonster from "@/components/loopgate/LoopMonster";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
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
  const { profile } = useAuth();
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

  return (
    <div className="min-h-screen bg-background pb-32">
      <LoopMonster />

      {/* Cinematic Hero Header */}
      <div className="relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--gold)/0.15),transparent_70%)]" />
        
        {/* Decorative lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="absolute top-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

        <div className="relative px-4 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold via-amber-400 to-gold flex items-center justify-center shadow-lg shadow-gold/30">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider">Arena</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Compete • Submit • Rise
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE NOW Section */}
      {liveEvents.length > 0 && (
        <section className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-wider">Live Now</span>
            </div>
            <Link 
              to="/events" 
              className="text-xs text-muted-foreground hover:text-gold flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {liveEvents.map((event, index) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative overflow-hidden rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 via-card to-card hover:border-green-500/50 transition-all group"
                >
                  <div className="flex gap-4 p-4">
                    {/* Poster */}
                    {event.poster_url && (
                      <div className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                        <img
                          src={event.poster_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Live badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          Live
                        </span>
                        {event.event_mode === "open_arena" && (
                          <span className="text-[10px] text-gold font-semibold uppercase">Open Arena</span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-base leading-tight mb-1 line-clamp-2">
                        {event.title}
                      </h3>

                      {/* Countdown */}
                      <div className="text-sm text-muted-foreground mb-3">
                        <CountdownTimer endDate={event.end_date} />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {event.prize_pool && (
                          <span className="flex items-center gap-1 text-gold">
                            <Trophy className="w-3 h-3" />
                            {event.prize_pool}
                          </span>
                        )}
                        {event.xp_reward && (
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-400" />
                            +{event.xp_reward} XP
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* UPCOMING Section */}
      {upcomingEvents.length > 0 && (
        <section className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold" />
              <span className="text-sm font-bold uppercase tracking-wider">Upcoming</span>
            </div>
          </div>

          <div className="space-y-3">
            {upcomingEvents.slice(0, 5).map((event, index) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative overflow-hidden rounded-xl border border-border bg-card hover:border-gold/30 transition-all group"
                >
                  <div className="flex gap-4 p-4">
                    {event.poster_url && (
                      <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                        <img
                          src={event.poster_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {event.league} League
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-1">
                        {event.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Starts in <CountdownTimer endDate={event.start_date} /></span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && liveEvents.length === 0 && upcomingEvents.length === 0 && (
        <div className="px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-gold/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Active Events</h3>
          <p className="text-sm text-muted-foreground mb-6">
            New competitions drop regularly. Stay tuned.
          </p>
          <Link 
            to="/gqt"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold via-amber-400 to-gold text-black font-bold rounded-lg"
          >
            Take the GQT
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="px-4 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Past Events Link */}
      {pastEvents.length > 0 && (
        <section className="px-4 mt-8">
          <Link 
            to="/events"
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:border-gold/30 transition-all"
          >
            <div>
              <span className="text-sm font-semibold">View All Events</span>
              <p className="text-xs text-muted-foreground">
                {pastEvents.length} completed + {liveEvents.length + upcomingEvents.length} active
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </section>
      )}
    </div>
  );
}
