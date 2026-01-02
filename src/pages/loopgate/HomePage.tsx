import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Zap, Users, Eye } from "lucide-react";
import { mockEvents } from "@/data/loopgateData";
import EventCard from "@/components/loopgate/EventCard";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import loopgateLogo from "@/assets/loopgate-logo.png";
import PosterStrip from "@/components/loopgate/PosterStrip";

export default function HomePage() {
  const liveEvents = mockEvents.filter((e) => e.status === "live");
  const pendingEvents = mockEvents.filter((e) => e.status === "pending");
  const featuredEvent = liveEvents[0];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Events
          </span>
        </div>
      </header>

      {/* Hero Live Event */}
      {featuredEvent && (
        <section className="p-4">
          <Link
            to={`/event/${featuredEvent.id}`}
            className="block bg-surface-1 border border-gold/20 rounded-lg overflow-hidden"
          >
            {/* Poster Image */}
            {featuredEvent.posterUrl && (
              <div 
                className="w-full h-40 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${featuredEvent.posterUrl})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/60 to-transparent" />
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
                {featuredEvent.league} League
              </span>
            </div>

            {/* Main Content */}
            <div className="p-5">
              <h2 className="text-3xl font-black tracking-tight">
                {featuredEvent.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {featuredEvent.subtitle}
              </p>

              {/* Meta Row */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {featuredEvent.location}
                </span>
                <span className="uppercase tracking-wider">
                  IP: {featuredEvent.ip}
                </span>
              </div>

              {/* Countdown */}
              <div className="mt-5 p-4 bg-background rounded-lg border border-border">
                <CountdownTimer
                  endDate={featuredEvent.endDate}
                  label="Ends in"
                  large
                />
              </div>

              {/* Prize Pool */}
              {featuredEvent.prizePool && (
                <div className="mt-4 text-center">
                  <p className="text-2xl font-black text-gold">
                    {featuredEvent.prizePool}
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
              <span className="text-foreground font-semibold">142</span> edits submitted in last 24h
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
              Editors competing <span className="text-foreground font-semibold">globally</span>
            </span>
          </div>
        </div>
      </section>

      {/* Movie Poster Strip */}
      <PosterStrip />

      {/* Upcoming Activations */}
      {pendingEvents.length > 0 && (
        <section className="px-4 py-6 border-t border-border">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Upcoming Activations
          </h2>
          <div className="space-y-3">
            {pendingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
