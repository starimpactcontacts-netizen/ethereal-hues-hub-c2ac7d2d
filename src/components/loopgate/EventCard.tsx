import { Link } from "react-router-dom";
import { ChevronRight, MapPin } from "lucide-react";
import { LoopgateEvent } from "@/data/loopgateData";
import StatusBadge from "./StatusBadge";
import CountdownTimer from "./CountdownTimer";

interface EventCardProps {
  event: LoopgateEvent;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link
      to={`/event/${event.id}`}
      className="block bg-surface-1 border border-border rounded-lg p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-sm truncate">{event.title}</h3>
            <StatusBadge status={event.status} small />
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

          {/* Countdown for pending */}
          {event.status === "pending" && (
            <div className="mt-3">
              <CountdownTimer endDate={event.startDate} label="Starts" />
            </div>
          )}
        </div>

        <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}
