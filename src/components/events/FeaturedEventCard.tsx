import { CalendarDays, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Event } from "./EventCard";
interface FeaturedEventCardProps {
  event: Event;
}
export const FeaturedEventCard = ({
  event
}: FeaturedEventCardProps) => {
  const navigate = useNavigate();
  const handleClick = () => {
    // Navigate to /loopgate for the #LOOPGATE event
    if (event.title === "#LOOPGATE") {
      navigate("/loopgate");
    } else if (event.externalUrl && event.externalUrl !== "#") {
      window.open(event.externalUrl, "_blank", "noopener,noreferrer");
    }
  };
  const statusText = {
    live: "LIVE",
    upcoming: "UPCOMING",
    finished: "PAST"
  };
  const isLive = event.status === "live";
  return <article onClick={handleClick} className="group flex-shrink-0 w-[360px] cursor-pointer snap-start rounded-xl bg-card overflow-hidden shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300" role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && handleClick()}>
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img src={event.imageUrl} alt="" className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-90 transition-all duration-500" loading="lazy" />
        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100" />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          {event.category}
        </div>

        {/* Title */}
        <h3 className="text-[16px] font-semibold leading-tight text-foreground tracking-[-0.02em] line-clamp-2 mb-4">
          {event.title}
        </h3>

        {/* Date & Location */}
        <div className="flex flex-col gap-1.5 text-[12px] text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 opacity-60" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 opacity-60" />
            <span>{event.location}</span>
          </div>
        </div>

        {/* Status */}
        {event.status && <div className={`text-[10px] uppercase tracking-[0.15em] pt-3 border-t border-border ${isLive ? "text-green-400 animate-pulse drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" : "text-muted-foreground/80"}`}>
            {statusText[event.status]}
          </div>}
      </div>
    </article>;
};