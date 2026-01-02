import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Zap, Users, Eye, Clock } from "lucide-react";
import { mockEvents } from "@/data/loopgateData";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import loopgateLogo from "@/assets/loopgate-logo.png";
import PosterStrip from "@/components/loopgate/PosterStrip";
import StatusBadge from "@/components/loopgate/StatusBadge";

export default function HomePage() {
  // #LOOPGATE is always the primary event
  const primaryEvent = mockEvents.find((e) => e.title === "#LOOPGATE");
  const upcomingEvents = mockEvents.filter((e) => e.status === "pending" && e.title !== "#LOOPGATE");
  const closedEvents = mockEvents.filter((e) => e.status === "closed");

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Events
          </span>
        </div>
      </header>

      {/* Hero Live Event - #LOOPGATE */}
      {primaryEvent && (
        <section className="p-4">
          <Link
            to={`/event/${primaryEvent.id}`}
            className="block bg-surface-1 border border-gold/30 rounded-lg overflow-hidden"
          >
            {/* Poster Image */}
            {primaryEvent.posterUrl && (
              <div 
                className="w-full h-44 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${primaryEvent.posterUrl})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/70 to-transparent" />
              </div>
            )}

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">
                  Live
                </span>
              </div>
              <span className="text-[10px] text-gold uppercase tracking-wider font-medium">
                {primaryEvent.league} League
              </span>
            </div>

            {/* Main Content */}
            <div className="p-5">
              <h2 className="text-4xl font-black tracking-tight">
                {primaryEvent.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {primaryEvent.subtitle}
              </p>

              {/* Meta Row */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {primaryEvent.location}
                </span>
                <span className="uppercase tracking-wider">
                  IP: {primaryEvent.ip}
                </span>
              </div>

              {/* Countdown */}
              <div className="mt-5 p-4 bg-background rounded-lg border border-border">
                <CountdownTimer
                  endDate={primaryEvent.endDate}
                  label="Ends in"
                  large
                />
              </div>

              {/* Prize Pool */}
              {primaryEvent.prizePool && (
                <div className="mt-4 text-center">
                  <p className="text-3xl font-black text-gold">
                    {primaryEvent.prizePool}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                    Prize Pool
                  </p>
                </div>
              )}

              {/* CTA */}
              <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold py-3 bg-gold text-black rounded-lg">
                <span>View Event</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Live Activity Indicators */}
      <section className="px-4 py-4 border-t border-border">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <Zap size={14} className="text-green-500" />
            </div>
            <span className="text-muted-foreground">
              <span className="text-foreground font-semibold">312</span> edits submitted in last 24h
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
              <Eye size={14} className="text-gold" />
            </div>
            <span className="text-muted-foreground">
              Live judging <span className="text-gold font-semibold">in progress</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
              <Users size={14} className="text-foreground" />
            </div>
            <span className="text-muted-foreground">
              <span className="text-foreground font-semibold">1,847</span> editors competing globally
            </span>
          </div>
        </div>
      </section>

      {/* Movie Poster Strip */}
      <PosterStrip />

      {/* Upcoming Activations */}
      {upcomingEvents.length > 0 && (
        <section className="px-4 py-6 border-t border-border">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Upcoming Activations
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <Link 
                key={event.id}
                to={`/event/${event.id}`}
                className="block bg-surface-1 border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm">{event.title}</h3>
                      <StatusBadge status={event.status} small />
                    </div>
                    <p className="text-xs text-muted-foreground">{event.subtitle}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="text-gold uppercase">{event.league} League</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        Starts {new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {event.prizePool && (
                      <p className="text-gold font-bold text-sm mt-2">{event.prizePool}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past Events */}
      {closedEvents.length > 0 && (
        <section className="px-4 py-6 border-t border-border">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Past Events
          </h2>
          <div className="space-y-2">
            {closedEvents.slice(0, 3).map((event) => (
              <Link 
                key={event.id}
                to={`/event/${event.id}`}
                className="flex items-center justify-between bg-surface-1/50 border border-border/50 rounded-lg p-3"
              >
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">{event.title}</h3>
                  <p className="text-[10px] text-muted-foreground/60">{event.league} League • Closed</p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground/50" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
