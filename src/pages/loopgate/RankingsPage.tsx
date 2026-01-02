import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ArrowUp, ArrowDown, Minus, RefreshCw } from "lucide-react";
import { mockEvents, generateEventRankings } from "@/data/loopgateData";
import StatusBadge from "@/components/loopgate/StatusBadge";
import loopgateLogo from "@/assets/loopgate-logo.png";

type TabType = "global" | "league" | "region" | "history";

export default function RankingsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("global");

  const selectedEvent = mockEvents.find((e) => e.id === selectedEventId);
  const eventRankings = selectedEventId ? generateEventRankings(selectedEventId, 30) : [];

  const rankedEvents = mockEvents.filter((e) => e.status === "live" || e.status === "closed");

  const tabs: { id: TabType; label: string }[] = [
    { id: "global", label: "Global" },
    { id: "league", label: "League" },
    { id: "region", label: "Region" },
    { id: "history", label: "History" },
  ];

  // Generate rank change indicators
  const getRankChange = (rank: number) => {
    const seed = rank * 7;
    const change = ((seed % 5) - 2);
    return change;
  };

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
          {/* Updated Live Label */}
          <div className="flex items-center gap-2 mb-4 text-[10px] text-green-500 uppercase tracking-[0.15em]">
            <RefreshCw size={12} className="animate-spin" style={{ animationDuration: "3s" }} />
            <span>Updated live</span>
          </div>

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

        {/* Tabs */}
        <div className="px-4 pb-3 flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gold text-black"
                  : "bg-surface-1 text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Updated Live Label */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 text-[10px] text-green-500 uppercase tracking-[0.15em]">
          <RefreshCw size={12} className="animate-spin" style={{ animationDuration: "3s" }} />
          <span>Updated live</span>
        </div>
      </div>

      {/* Event Selection */}
      <div className="p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-4">
          Select Event to View Rankings
        </p>

        <div className="space-y-2">
          {rankedEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEventId(event.id)}
              className="w-full bg-surface-1 border border-border rounded-lg p-4 text-left flex items-center gap-3"
            >
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
                <p className="text-[10px] text-gold uppercase tracking-[0.1em] mt-1">
                  {event.league} League
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Global Rankings Preview */}
      {activeTab === "global" && (
        <div className="px-4 pb-6">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-4 mt-4">
            Global Index Rankings
          </p>
          <div className="space-y-2">
            {generateEventRankings("1", 10).map((r) => {
              const change = getRankChange(r.rank);
              return (
                <div
                  key={r.editorId}
                  className="bg-surface-1 border border-border rounded-lg p-3 flex items-center gap-3"
                >
                  <div className={`w-8 text-center font-bold ${r.rank <= 3 ? "text-gold text-lg" : "text-muted-foreground"}`}>
                    {r.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{r.alias}</p>
                    <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span>{Math.floor(Math.random() * 30) + 60}% Win</span>
                      <span>{Math.floor(Math.random() * 5) + 1} Finals</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{r.qoiTotal}</span>
                    {change > 0 && (
                      <span className="flex items-center text-green-500 text-xs">
                        <ArrowUp size={12} />
                        {change}
                      </span>
                    )}
                    {change < 0 && (
                      <span className="flex items-center text-red-500 text-xs">
                        <ArrowDown size={12} />
                        {Math.abs(change)}
                      </span>
                    )}
                    {change === 0 && (
                      <Minus size={12} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
