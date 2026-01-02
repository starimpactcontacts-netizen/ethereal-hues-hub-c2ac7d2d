import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { mockEvents, generateEventRankings } from "@/data/loopgateData";
import StatusBadge from "@/components/loopgate/StatusBadge";
import loopgateLogo from "@/assets/loopgate-logo.png";

export default function RankingsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = mockEvents.find((e) => e.id === selectedEventId);
  const eventRankings = selectedEventId ? generateEventRankings(selectedEventId, 30) : [];

  // Filter to show events with rankings (live or closed)
  const rankedEvents = mockEvents.filter((e) => e.status === "live" || e.status === "closed");

  if (selectedEvent) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSelectedEventId(null)} className="text-muted-foreground">
              ←
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-sm">{selectedEvent.title}</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
                Event Leaderboard
              </p>
            </div>
            <StatusBadge status={selectedEvent.status} small />
          </div>

          {/* QOI Legend (only for live events) */}
          {selectedEvent.status === "live" && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-4 text-[9px] text-muted-foreground uppercase tracking-[0.1em]">
                <span>Q = Quality</span>
                <span>O = Originality</span>
                <span>I = Impact</span>
              </div>
            </div>
          )}
        </header>

        {/* Leaderboard */}
        <div className="p-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[9px] text-muted-foreground uppercase tracking-[0.1em] border-b border-border">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Alias</div>
            <div className="col-span-2 text-right">QOI</div>
            {selectedEvent.status === "live" && (
              <>
                <div className="col-span-1 text-right">Q</div>
                <div className="col-span-1 text-right">O</div>
                <div className="col-span-1 text-right">I</div>
              </>
            )}
          </div>

          {/* Rankings */}
          <div className="divide-y divide-border">
            {eventRankings.map((ranking) => (
              <div
                key={ranking.editorId}
                className="grid grid-cols-12 gap-2 px-3 py-3 items-center"
              >
                <div className={`col-span-1 font-bold ${ranking.rank <= 3 ? "text-gold" : ""}`}>
                  {ranking.rank}
                </div>
                <div className="col-span-4 font-semibold text-sm truncate">
                  {ranking.alias}
                </div>
                <div className="col-span-2 text-right font-bold text-gold">
                  {ranking.qoiTotal}
                </div>
                {selectedEvent.status === "live" && (
                  <>
                    <div className="col-span-1 text-right text-muted-foreground text-sm">
                      {ranking.quality}
                    </div>
                    <div className="col-span-1 text-right text-muted-foreground text-sm">
                      {ranking.originality}
                    </div>
                    <div className="col-span-1 text-right text-muted-foreground text-sm">
                      {ranking.impact}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-8 text-center border-t border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Rankings are final
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Rankings
          </span>
        </div>
      </header>

      {/* Event Selection */}
      <div className="p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-4">
          Select Event
        </p>

        <div className="space-y-2">
          {rankedEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEventId(event.id)}
              className="w-full bg-surface-1 border border-border rounded-lg p-4 text-left flex items-center gap-3"
            >
              {/* Poster thumbnail */}
              {event.posterUrl && (
                <div
                  className="w-12 h-16 rounded bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${event.posterUrl})` }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm truncate">{event.title}</h3>
                  <StatusBadge status={event.status} small />
                </div>
                <p className="text-xs text-muted-foreground">{event.subtitle}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] mt-1">
                  {event.league} League
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
