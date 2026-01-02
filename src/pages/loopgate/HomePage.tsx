import { Link } from "react-router-dom";
import { mockEvents } from "@/data/loopgateData";
import EventCard from "@/components/loopgate/EventCard";
import StatusBadge from "@/components/loopgate/StatusBadge";

export default function HomePage() {
  const liveEvents = mockEvents.filter((e) => e.status === "live");
  const pendingEvents = mockEvents.filter((e) => e.status === "pending");
  const closedEvents = mockEvents.filter((e) => e.status === "closed");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight">LOOPGATE</h1>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
            Global Competitive Editing Index
          </p>
        </div>
      </header>

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <section className="px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Live Now
            </h2>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-subtle" />
          </div>
          <div className="space-y-3">
            {liveEvents.map((event) => (
              <EventCard key={event.id} event={event} featured />
            ))}
          </div>
        </section>
      )}

      {/* Pending Events */}
      {pendingEvents.length > 0 && (
        <section className="px-4 py-6 border-t border-border">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Upcoming Activations
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
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
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
