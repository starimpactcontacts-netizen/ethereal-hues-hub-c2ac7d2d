import { Link } from "react-router-dom";
import { ChevronRight, Clock, MapPin } from "lucide-react";
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
      className={`block bg-card border border-border rounded-lg p-4 card-hover ${
        featured ? "border-gold/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title and subtitle */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-base truncate">{event.title}</h3>
            {event.status === "live" && (
              <StatusBadge status={event.status} />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{event.subtitle}</p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {event.location}
            </span>
            <span className="uppercase tracking-wider text-gold/80">
              {event.league} League
            </span>
            <span className="uppercase tracking-wider">
              IP: {event.ip}
            </span>
          </div>

          {/* Countdown for live/pending */}
          {(event.status === "live" || event.status === "pending") && (
            <div className="mt-3">
              <CountdownTimer
                endDate={event.status === "live" ? event.endDate : event.startDate}
                label={event.status === "live" ? "Ends in" : "Starts in"}
              />
            </div>
          )}

          {/* Prize pool */}
          {event.prizePool && (
            <div className="mt-2 text-sm font-semibold text-gold">
              {event.prizePool} Prize Pool
            </div>
          )}
        </div>

        <ChevronRight size={20} className="text-muted-foreground flex-shrink-0 mt-1" />
      </div>

      {/* Status badges for non-live */}
      {event.status !== "live" && (
        <div className="mt-3 flex items-center gap-2">
          <StatusBadge status={event.status} />
        </div>
      )}
    </Link>
  );
}
