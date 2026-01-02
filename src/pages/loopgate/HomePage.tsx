import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Zap, Users, Eye, Clock } from "lucide-react";
import { mockEvents } from "@/data/loopgateData";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import loopgateLogo from "@/assets/loopgate-logo.png";
import PosterStrip from "@/components/loopgate/PosterStrip";
import StatusBadge from "@/components/loopgate/StatusBadge";

export default function HomePage() {
  const primaryEvent = mockEvents.find((e) => e.title === "#LOOPGATE");
  const upcomingEvents = mockEvents.filter((e) => e.status === "pending" && e.title !== "#LOOPGATE");
  const closedEvents = mockEvents.filter((e) => e.status === "closed");

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-medium">
            Live
          </span>
        </div>
      </header>

      {/* Hero Live Event - #LOOPGATE */}
      {primaryEvent && (
        <section className="p-3">
          <Link
            to={`/event/${primaryEvent.id}`}
            className="block bg-surface-1 border-2 border-gold/40 overflow-hidden"
          >
            {/* Cinematic Banner */}
            {primaryEvent.posterUrl && (
              <div 
                className="w-full h-52 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${primaryEvent.posterUrl})` }}
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
                <div className="absolute top-4 right-4 bg-background/90 border border-gold/50 px-4 py-2">
                  <p className="font-display text-2xl text-gold">{primaryEvent.prizePool}</p>
                </div>
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
              <p className="text-sm text-muted-foreground mt-1">
                {primaryEvent.subtitle}
              </p>

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
                  endDate={primaryEvent.endDate}
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
      )}

      {/* Live Activity Status Row */}
      <section className="px-4 py-4 border-t border-border bg-surface-1/50">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-display text-2xl text-foreground">312</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Edits 24h</p>
          </div>
          <div>
            <p className="font-display text-2xl text-gold">Live</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Judging</p>
          </div>
          <div>
            <p className="font-display text-2xl text-foreground">1.8K</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Competing</p>
          </div>
        </div>
      </section>

      {/* Movie Poster Strip */}
      <PosterStrip />

      {/* Micro Status Row */}
      <section className="px-4 py-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Updated live
        </span>
        <span>Editors competing globally</span>
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
                        {new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      {event.prizePool && <span className="text-gold font-semibold">{event.prizePool}</span>}
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
    </div>
  );
}
