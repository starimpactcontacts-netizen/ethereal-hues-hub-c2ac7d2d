import { Link } from "react-router-dom";
import { ChevronRight, MapPin } from "lucide-react";
import { LoopgateEvent } from "@/data/loopgateData";
import StatusBadge from "./StatusBadge";
import CountdownTimer from "./CountdownTimer";

interface EventCardProps {
  event: LoopgateEvent;
  featured?: boolean;
}

export default function EventCard({ event, featured = false }: EventCardProps) {
  return (
    <Link
      to={`/event/${event.id}`}
      className={`block bg-surface-1 border border-border rounded-lg overflow-hidden ${
        featured ? "border-gold/30" : ""
      }`}
    >
      {/* Poster Image */}
      {event.posterUrl && (
        <div
          className={`w-full bg-cover bg-center relative ${featured ? "h-40" : "h-28"}`}
          style={{ backgroundImage: `url(${event.posterUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent" />
          
          {/* Live indicator overlay */}
          {event.status === "live" && (
            <div className="absolute top-3 left-3">
              <StatusBadge status="live" />
            </div>
          )}

          {/* Prize pool overlay */}
          {event.prizePool && (
            <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gold">
              {event.prizePool}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-sm truncate">{event.title}</h3>
              {!event.posterUrl && <StatusBadge status={event.status} small />}
            </div>
            <p className="text-xs text-muted-foreground">{event.subtitle}</p>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <MapPin size={10} />
                {event.location}
              </span>
              <span>{event.league}</span>
            </div>

            {/* Countdown for live/pending */}
            {(event.status === "live" || event.status === "pending") && (
              <div className="mt-3">
                <CountdownTimer
                  endDate={event.status === "live" ? event.endDate : event.startDate}
                  label={event.status === "live" ? "Ends" : "Starts"}
                />
              </div>
            )}

            {/* Updated timestamp */}
            {event.updatedAt && (
              <p className="text-[9px] text-muted-foreground mt-2">
                Updated {event.updatedAt}
              </p>
            )}
          </div>

          <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
        </div>
      </div>
    </Link>
  );
}
