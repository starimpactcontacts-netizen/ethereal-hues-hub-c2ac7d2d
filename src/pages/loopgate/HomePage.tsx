import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Clock } from "lucide-react";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import loopgateLogo from "@/assets/loopgate-logo.png";
import PosterStrip from "@/components/loopgate/PosterStrip";
import StatusBadge from "@/components/loopgate/StatusBadge";
import { useRealEvents, useGlobalStats, useActiveSession } from "@/hooks/useRealData";

export default function HomePage() {
  const { events, loading } = useRealEvents();
  const { stats } = useGlobalStats();
  
  // Keep session active
  useActiveSession();

  const liveEvents = events.filter((e) => e.status === "live");
  const primaryEvent = liveEvents[0];
  const upcomingEvents = events.filter((e) => e.status === "pending");
  const closedEvents = events.filter((e) => e.status === "closed");

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-medium">
            {liveEvents.length > 0 ? 'Live' : 'Events'}
          </span>
        </div>
      </header>

      {/* Hero Live Event */}
      {primaryEvent ? (
        <section className="p-3">
          <Link
            to={`/event/${primaryEvent.id}`}
            className="block bg-surface-1 border-2 border-gold/40 overflow-hidden"
          >
            {/* Cinematic Banner */}
            {primaryEvent.poster_url && (
              <div 
                className="w-full h-52 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${primaryEvent.poster_url})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/50 to-transparent" />
                
                {/* Live Badge Overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500 px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white">
                    Live Now
                  </span>
                </div>

                {/* Prize Pool Overlay */}
                {primaryEvent.prize_pool && (
                  <div className="absolute top-4 right-4 bg-background/90 border border-gold/50 px-4 py-2">
                    <p className="font-display text-2xl text-gold">{primaryEvent.prize_pool}</p>
                  </div>
                )}
              </div>
            )}

            {/* Main Content */}
            <div className="p-5">
              {/* League Tag */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-gold uppercase tracking-[0.2em] font-semibold border border-gold/30 px-2 py-0.5">
                  {primaryEvent.league} League
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  IP: {primaryEvent.ip}
                </span>
              </div>

              {/* Title - Massive */}
              <h1 className="font-display text-5xl tracking-wide text-foreground">
                {primaryEvent.title}
              </h1>
              {primaryEvent.subtitle && (
                <p className="text-sm text-muted-foreground mt-1">
                  {primaryEvent.subtitle}
                </p>
              )}

              {/* Meta Row */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  {primaryEvent.location}
                </span>
              </div>

              {/* Countdown - Hard Panel */}
              <div className="mt-5 p-4 bg-background border border-border">
                <CountdownTimer
                  endDate={primaryEvent.end_date}
                  label="Ends in"
                  large
                />
              </div>

              {/* CTA - Dominant */}
              <div className="mt-5 flex items-center justify-center gap-2 font-display text-xl tracking-wide py-4 bg-gold text-background">
                <span>View Event</span>
                <ChevronRight size={20} strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        </section>
      ) : (
        <section className="p-4">
          <div className="bg-surface-1 border border-border p-8 text-center">
            <p className="text-muted-foreground font-display text-lg">No live events</p>
            <p className="text-xs text-muted-foreground mt-2">Check upcoming events below</p>
          </div>
        </section>
      )}

      {/* Live Activity Status Row - Real Data */}
      <section className="px-4 py-4 border-t border-border bg-surface-1/50">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-display text-2xl text-foreground">{stats.entries24h}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Edits 24h</p>
          </div>
          <div>
            <p className="font-display text-2xl text-gold">{liveEvents.length > 0 ? 'Live' : '—'}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Judging</p>
          </div>
          <div>
            <p className="font-display text-2xl text-foreground">{stats.activeUsers}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Active Now</p>
          </div>
        </div>
      </section>

      {/* Movie Poster Strip */}
      <PosterStrip />

      {/* Micro Status Row */}
      <section className="px-4 py-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
        <span className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${stats.activeUsers > 0 ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
          {stats.activeUsers > 0 ? 'Updated live' : 'No activity'}
        </span>
        <span>{stats.totalCompeting} editors competing</span>
      </section>

      {/* Upcoming Activations */}
      {upcomingEvents.length > 0 && (
        <section className="px-4 py-6 border-t border-border">
          <h2 className="font-display text-xl text-muted-foreground mb-4">
            Upcoming
          </h2>
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <Link 
                key={event.id}
                to={`/event/${event.id}`}
                className="block bg-surface-1 border border-border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-lg">{event.title}</h3>
                      <StatusBadge status={event.status} small />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span className="text-gold">{event.league}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      {event.prize_pool && <span className="text-gold font-semibold">{event.prize_pool}</span>}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past Events - Minimal */}
      {closedEvents.length > 0 && (
        <section className="px-4 py-6 border-t border-border">
          <h2 className="font-display text-xl text-muted-foreground mb-4">
            Closed
          </h2>
          <div className="space-y-2">
            {closedEvents.slice(0, 3).map((event) => (
              <Link 
                key={event.id}
                to={`/event/${event.id}`}
                className="flex items-center justify-between bg-surface-1/50 border border-border/50 p-3"
              >
                <div>
                  <h3 className="font-display text-base text-muted-foreground">{event.title}</h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{event.league} • Final</p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground/50" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* No Events State */}
      {!loading && events.length === 0 && (
        <section className="px-4 py-12 text-center">
          <p className="text-muted-foreground">No events available yet</p>
          <p className="text-xs text-muted-foreground mt-2">Check back soon for competitions</p>
        </section>
      )}
    </div>
  );
}
