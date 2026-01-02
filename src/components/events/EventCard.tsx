export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  status?: "live" | "upcoming" | "finished";
  imageUrl: string;
  externalUrl: string;
}

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const handleClick = () => {
    window.open(event.externalUrl, "_blank", "noopener,noreferrer");
  };

  const statusText = {
    live: "LIVE",
    upcoming: "UPCOMING",
    finished: "ARCHIVE"
  };

  return (
    <article
      onClick={handleClick}
      className="group flex-shrink-0 w-[280px] cursor-pointer snap-start"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900">
        <img
          src={event.imageUrl}
          alt=""
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-300" />
      </div>

      {/* Content */}
      <div className="pt-3 space-y-1">
        {/* Category & Status */}
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.15em] text-neutral-500">
          <span>{event.category}</span>
          {event.status && (
            <>
              <span className="text-neutral-700">—</span>
              <span className={event.status === "live" ? "text-white" : ""}>
                {statusText[event.status]}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-medium leading-tight text-white tracking-[-0.01em] line-clamp-2">
          {event.title}
        </h3>

        {/* Date & Location */}
        <div className="text-[11px] text-neutral-500 tracking-wide pt-1">
          <span>{event.date}</span>
          <span className="mx-2">·</span>
          <span>{event.location}</span>
        </div>
      </div>
    </article>
  );
};
