import { useNavigate } from "react-router-dom";
import type { Event } from "./EventCard";
interface EventRowProps {
  event: Event;
}
export const EventRow = ({
  event
}: EventRowProps) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (event.title === "#LOOPGATE") {
      navigate("/loopgate");
    } else if (event.externalUrl && event.externalUrl !== "#") {
      window.open(event.externalUrl, "_blank", "noopener,noreferrer");
    }
  };
  const statusText = {
    live: "LIVE",
    upcoming: "COMING SOON",
    finished: "PAST"
  };
  const isLive = event.status === "live";
  return <article onClick={handleClick} className="group flex items-center gap-5 p-4 rounded-xl bg-card cursor-pointer hover:bg-secondary transition-colors duration-200" role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && handleClick()}>
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-28 h-20 rounded-lg bg-muted overflow-hidden">
        <img src={event.imageUrl} alt="" className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-80 transition-opacity duration-300" loading="lazy" />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {event.category}
          </span>
          {event.status && <>
              <span className="text-border">·</span>
              <span className={`text-[10px] uppercase tracking-[0.15em] ${isLive ? "text-green-400 animate-pulse drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" : "text-[#999999]"}`}>
                {statusText[event.status]}
              </span>
            </>}
        </div>
        <h3 className="text-[15px] font-medium text-foreground tracking-[-0.01em] truncate">
          {event.title}
        </h3>
        <p className="text-[12px] text-muted-foreground mt-1 truncate">
          Index Opening

        </p>
      </div>

      {/* Location */}
      <div className="hidden sm:block flex-shrink-0 w-32 text-right">
        <span className="text-[12px] text-muted-foreground">{event.location}</span>
      </div>

      {/* Date Block */}
      <div className="flex-shrink-0 w-28 text-right">
        <span className="text-[13px] font-medium text-foreground">{event.date}</span>
      </div>
    </article>;
};