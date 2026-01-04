import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, ChevronRight, Lock, TrendingUp, TrendingDown, Minus, ArrowLeft } from "lucide-react";
import { useRealEvents, useRealRankings, useEventRankings, useActiveSession } from "@/hooks/useRealData";
import StatusBadge from "@/components/loopgate/StatusBadge";
import loopgateLogo from "@/assets/loopgate-logo.png";
import SEO, { pageSEO } from "@/components/SEO";

type TabType = "global" | "league" | "region" | "history";

export default function RankingsPage() {
  const [searchParams] = useSearchParams();
  const eventIdFromUrl = searchParams.get("event");
  
  const [activeTab, setActiveTab] = useState<TabType>("global");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventIdFromUrl);

  const tabs: { id: TabType; label: string }[] = [
    { id: "global", label: "Global" },
    { id: "league", label: "League" },
    { id: "region", label: "Region" },
    { id: "history", label: "History" },
  ];

  // Keep session active
  useActiveSession();

  // Real data hooks
  const { events, loading: eventsLoading } = useRealEvents();
  const { rankings: globalRankings, loading: rankingsLoading } = useRealRankings();
  const { rankings: eventRankings, loading: eventRankingsLoading } = useEventRankings(selectedEventId);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const isLiveEvent = selectedEvent?.status === "live";
  const isClosedEvent = selectedEvent?.status === "closed";
  const rankedEvents = events.filter((e) => e.status === "live" || e.status === "closed");

  // Event-specific leaderboard view
  if (selectedEvent) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSelectedEventId(null)} className="p-1 -ml-1">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="font-display text-2xl">{selectedEvent.title}</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                Leaderboard
              </p>
            </div>
            <StatusBadge status={selectedEvent.status} />
          </div>

          {/* QOI Legend (only for live events) */}
          {isLiveEvent && (
            <div className="px-4 pb-3 flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
              <span className="text-gold">Q</span> Quality
              <span className="text-gold">O</span> Originality
              <span className="text-gold">I</span> Impact
            </div>
          )}
        </header>

        {/* Live Update Indicator */}
        {isLiveEvent && (
          <div className="px-4 py-3 bg-green-500/10 border-b border-green-500/30 flex items-center gap-2 text-green-500">
            <RefreshCw size={14} className="animate-spin" style={{ animationDuration: "3s" }} />
            <span className="text-xs font-semibold uppercase tracking-wider">Live • Updated now</span>
          </div>
        )}

        {/* Closed Event Notice */}
        {isClosedEvent && (
          <div className="px-4 py-3 bg-surface-1 border-b border-border flex items-center gap-2">
            <Lock size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Rankings locked • Final</span>
          </div>
        )}

        {/* Leaderboard */}
        <div className="px-3 py-4">
          {eventRankings.length === 0 && !eventRankingsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No rankings yet</p>
              <p className="text-xs text-muted-foreground mt-2">Submissions are being reviewed</p>
            </div>
          ) : (
            <>
              {/* Column Headers */}
              <div className="flex items-center gap-2 py-2 text-[9px] text-muted-foreground uppercase tracking-widest border-b border-border mb-1 px-2">
                <span className="w-10 text-center">#</span>
                <span className="flex-1">Editor</span>
                {isLiveEvent ? (
                  <>
                    <span className="w-8 text-center">Q</span>
                    <span className="w-8 text-center">O</span>
                    <span className="w-8 text-center">I</span>
                    <span className="w-14 text-right">QOI</span>
                  </>
                ) : (
                  <span className="w-16 text-right">Index</span>
                )}
              </div>

              {/* Rankings Rows */}
              <div className="space-y-1">
                {eventRankings.map((ranking, index) => {
                  const isTop3 = index < 3;
                  const displayRank = ranking.final_rank || index + 1;
                  return (
                    <div
                      key={ranking.id}
                      className={`flex items-center gap-2 py-3 px-2 ${
                        isTop3 ? "bg-gold/10 border-l-2 border-gold" : "bg-surface-1"
                      }`}
                    >
                      <div className="w-10 flex items-center justify-center">
                        <span className={`font-display text-xl ${isTop3 ? "text-gold" : "text-muted-foreground"}`}>
                          {displayRank}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="font-semibold text-sm">{ranking.profile?.username || 'Unknown'}</span>
                      </div>
                      {isLiveEvent ? (
                        <>
                          <span className="w-8 text-center text-xs text-muted-foreground">{ranking.quality_score || '—'}</span>
                          <span className="w-8 text-center text-xs text-muted-foreground">{ranking.originality_score || '—'}</span>
                          <span className="w-8 text-center text-xs text-muted-foreground">{ranking.impact_score || '—'}</span>
                          <span className="w-14 text-right font-display text-xl text-gold">{ranking.qoi_score?.toFixed(1) || '—'}</span>
                        </>
                      ) : (
                        <span className="w-16 text-right font-display text-xl text-gold">{ranking.qoi_score?.toFixed(1) || '—'}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-6 text-center border-t border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            {isClosedEvent ? "Rankings are final" : "Rankings update in real-time"}
          </p>
        </div>
      </div>
    );
  }

  // Event selection view
  return (
    <div className="min-h-screen pb-20 bg-background">
      <SEO {...pageSEO.rankings} />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Rankings
          </span>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3 flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-display text-sm tracking-wide transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gold text-background"
                  : "bg-surface-1 text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Live Update Indicator */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-green-500">
        <RefreshCw size={12} className="animate-spin" style={{ animationDuration: "3s" }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Updated live</span>
      </div>

      {/* Event Selection */}
      {rankedEvents.length > 0 && (
        <div className="p-4">
          <p className="font-display text-lg text-muted-foreground mb-4">
            Select Event
          </p>

          <div className="space-y-2">
            {rankedEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className="w-full bg-surface-1 border border-border p-4 text-left flex items-center gap-3"
              >
                {event.poster_url && (
                  <div
                    className="w-14 h-20 bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${event.poster_url})` }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-xl truncate">{event.title}</h3>
                    <StatusBadge status={event.status} small />
                  </div>
                  {event.subtitle && <p className="text-xs text-muted-foreground">{event.subtitle}</p>}
                  <p className="text-[10px] text-gold uppercase tracking-[0.15em] mt-1">
                    {event.league} League
                  </p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global Rankings Preview */}
      {activeTab === "global" && (
        <div className="px-4 pb-6">
          <p className="font-display text-lg text-muted-foreground mb-4 mt-2">
            Global Index
          </p>
          
          {globalRankings.length === 0 && !rankingsLoading ? (
            <div className="bg-surface-1 border border-border p-8 text-center">
              <p className="text-muted-foreground">No rankings yet</p>
              <p className="text-xs text-muted-foreground mt-2">Rankings will appear when editors compete</p>
            </div>
          ) : (
            <div className="space-y-1">
              {globalRankings.slice(0, 10).map((editor) => {
                const isTop3 = (editor.rank || 0) <= 3;
                return (
                  <div
                    key={editor.id}
                    className={`bg-surface-1 p-3 flex items-center gap-3 ${
                      isTop3 ? "border-l-2 border-gold" : "border-l-2 border-transparent"
                    }`}
                  >
                    <div className={`w-10 font-display text-xl ${isTop3 ? "text-gold" : "text-muted-foreground"}`}>
                      {editor.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{editor.username}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{editor.win_rate?.toFixed(0) || 0}% Win</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-2xl text-gold">{editor.global_index_score?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
