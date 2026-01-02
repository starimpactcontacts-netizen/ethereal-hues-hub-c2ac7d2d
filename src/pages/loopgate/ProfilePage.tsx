import { ExternalLink, Calendar, TrendingUp } from "lucide-react";
import { currentUser, mockEvents } from "@/data/loopgateData";
import StatusBadge from "@/components/loopgate/StatusBadge";
import loopgateLogo from "@/assets/loopgate-logo.png";

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return String(count);
}

const platformLabels: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

export default function ProfilePage() {
  const activeEvents = mockEvents.filter((e) =>
    currentUser.activeEvents.includes(e.id)
  );
  const recentEvents = mockEvents.filter((e) =>
    currentUser.recentEvents.includes(e.id)
  );

  const leagueColors: Record<string, string> = {
    elite: "text-gold border-gold",
    pro: "text-blue-400 border-blue-400",
    open: "text-muted-foreground border-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Lofile
          </span>
        </div>
      </header>

      {/* Profile Hero */}
      <div className="p-4">
        <div className="bg-surface-1 border border-border p-6">
          {/* Alias + League */}
          <div className="flex items-start justify-between mb-1">
            <h1 className="font-display text-4xl">{currentUser.alias}</h1>
            <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] border px-2 py-1 ${leagueColors[currentUser.league]}`}>
              {currentUser.league}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            {currentUser.region}
          </p>

          {/* Global Rank - Dominant */}
          <div className="my-6 py-6 border-y border-border text-center">
            <p className="font-display text-7xl text-gold">#{currentUser.rank}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-2">Global Rank</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{currentUser.indexScore.toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Index</p>
            </div>
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{currentUser.winRate}%</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Win Rate</p>
            </div>
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{currentUser.recentEvents.length}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Events</p>
            </div>
          </div>

          {/* Status */}
          <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</span>
            <StatusBadge
              status={currentUser.qualificationStatus === "qualified" ? "qualified" : "pending"}
            />
          </div>

          {/* Peak + Last Active */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} />
              Peak #32
            </span>
            <span>Active: {currentUser.lastActive}</span>
          </div>
        </div>
      </div>

      {/* Platforms */}
      {currentUser.platforms.length > 0 && (
        <section className="px-4 py-4">
          <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
            <ExternalLink size={14} />
            Platforms
          </h3>
          <div className="space-y-2">
            {currentUser.platforms.map((platform, index) => (
              <div
                key={index}
                className="bg-surface-1 border border-border p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm">{platformLabels[platform.platform]}</p>
                  <p className="text-xs text-muted-foreground">{platform.handle}</p>
                </div>
                <p className="font-display text-xl text-gold">{formatFollowers(platform.followers)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Events */}
      <section className="px-4 py-4">
        <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar size={14} />
          Active
        </h3>
        {activeEvents.length > 0 ? (
          <div className="space-y-2">
            {activeEvents.map((event) => (
              <div
                key={event.id}
                className="bg-surface-1 border border-border p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-display text-lg">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.subtitle}</p>
                </div>
                <StatusBadge status={event.status} small />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active events</p>
        )}
      </section>

      {/* Recent Events */}
      <section className="px-4 py-4">
        <h3 className="font-display text-lg text-muted-foreground mb-3">
          Recent
        </h3>
        {recentEvents.length > 0 ? (
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="bg-surface-1 border border-border p-3"
              >
                <p className="font-display text-lg">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.subtitle}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent events</p>
        )}
      </section>
    </div>
  );
}
