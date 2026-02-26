import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Zap } from "lucide-react";
import { LoopgateEvent } from "@/data/loopgateData";
import StatusBadge from "./StatusBadge";
import CountdownTimer from "./CountdownTimer";
import { useEventRounds } from "@/hooks/useOpenArenaData";

interface EventCardProps {
  event: LoopgateEvent;
  featured?: boolean;
}

export default function EventCard({ event, featured = false }: EventCardProps) {
  // Fetch rounds for Open Arena events
  const isOpenArena = (event as any).event_mode === 'open_arena';
  const { rounds } = useEventRounds(isOpenArena ? event.id : null);
  const activeRound = rounds.find(r => r.status === 'active');

  // Determine what countdown to show
  const getCountdownConfig = () => {
    if (event.status === "pending") {
      return { date: event.startDate, label: "Starts" };
    }
    
    if (event.status === "live") {
      // For Open Arena, use active round timing
      if (isOpenArena && activeRound?.ends_at) {
        return { date: activeRound.ends_at, label: `R${activeRound.round_number} Ends` };
      }
      // For Open Arena without active round timing, show awaiting state
      if (isOpenArena && !activeRound?.ends_at) {
        return null; // Will show special message
      }
      // Standard events use end date
      return { date: event.endDate, label: "Ends" };
    }
    
    return null;
  };

  const countdownConfig = getCountdownConfig();

  return (
    <Link
      to={`/event/${(event as any).slug || event.id}`}
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
            <div className="absolute top-3 right-3 rounded-full border border-gold/40 bg-background/40 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-gold">
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
                {countdownConfig ? (
                  <CountdownTimer
                    endDate={countdownConfig.date}
                    label={countdownConfig.label}
                    expiredLabel={isOpenArena ? "Awaiting next round" : "Ended"}
                  />
                ) : isOpenArena && event.status === "live" ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap size={10} className="text-gold" />
                    <span>Round timing pending</span>
                  </div>
                ) : null}
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
