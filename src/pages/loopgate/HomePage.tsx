import { Link } from "react-router-dom";
import { ChevronRight, MapPin } from "lucide-react";
import { mockEvents } from "@/data/loopgateData";
import EventCard from "@/components/loopgate/EventCard";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import loopgateLogo from "@/assets/loopgate-logo.png";

export default function HomePage() {
  const liveEvents = mockEvents.filter((e) => e.status === "live");
  const pendingEvents = mockEvents.filter((e) => e.status === "pending");
  const closedEvents = mockEvents.filter((e) => e.status === "closed");
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
            className="block bg-surface-1 border border-border rounded-lg overflow-hidden"
          >
            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-green-500">
                  Live
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {featuredEvent.league} League
              </span>
            </div>

            {/* Main Content */}
            <div className="p-6">
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
              <div className="mt-6 p-4 bg-background rounded-lg">
                <CountdownTimer
                  endDate={featuredEvent.endDate}
                  label="Ends in"
                  large
                />
              </div>

              {/* Prize Pool */}
              {featuredEvent.prizePool && (
                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold text-gold">
                    {featuredEvent.prizePool}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                    Prize Pool
                  </p>
                </div>
              )}

              {/* CTA */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold">
                <span>View Event</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Upcoming Events */}
      {pendingEvents.length > 0 && (
        <section className="px-4 py-6 border-t border-border">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Upcoming
          </h2>
          <div className="space-y-3">
            {pendingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Closed Events */}
      {closedEvents.length > 0 && (
        <section className="px-4 py-6 border-t border-border">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Closed
          </h2>
          <div className="space-y-3">
            {closedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
