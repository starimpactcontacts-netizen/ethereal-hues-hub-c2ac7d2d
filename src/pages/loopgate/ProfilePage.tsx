import { ExternalLink, Trophy, Calendar, TrendingUp } from "lucide-react";
import { currentUser, mockEvents } from "@/data/loopgateData";
import StatusBadge from "@/components/loopgate/StatusBadge";
import loopgateLogo from "@/assets/loopgate-logo.png";

function formatFollowers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
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
    elite: "text-gold",
    pro: "text-blue-400",
    open: "text-muted-foreground",
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Lofile
          </span>
        </div>
      </header>

      {/* Profile Hero */}
      <div className="p-4">
        <div className="bg-surface-1 border border-border rounded-xl p-6">
          {/* Alias + League */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black">{currentUser.alias}</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1">
                {currentUser.region}
              </p>
            </div>
            <span className={`text-xs font-bold uppercase tracking-[0.15em] ${leagueColors[currentUser.league]}`}>
              {currentUser.league}
            </span>
          </div>

          {/* Global Rank - Large */}
          <div className="mb-5">
            <span className="text-4xl font-black text-gold">#{currentUser.rank}</span>
            <span className="text-sm text-muted-foreground ml-2">Global Rank</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-xl font-bold">{currentUser.indexScore.toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                Index
              </p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-xl font-bold">{currentUser.winRate}%</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                Win Rate
              </p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-xl font-bold">{currentUser.recentEvents.length}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                Finals
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="pt-5 border-t border-border">
            <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mb-2">
              Status
            </p>
            <StatusBadge
              status={currentUser.qualificationStatus === "qualified" ? "qualified" : "pending"}
            />
          </div>

          {/* Peak + Last Active */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} />
              Peak: #32
            </span>
            <span>Last Active: {currentUser.lastActive}</span>
          </div>
        </div>
      </div>

      {/* Platforms */}
      {currentUser.platforms.length > 0 && (
        <section className="px-4 py-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
            <ExternalLink size={12} />
            Platforms
          </h3>
          <div className="space-y-2">
            {currentUser.platforms.map((platform, index) => (
              <div
                key={index}
                className="bg-surface-1 border border-border rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm">{platformLabels[platform.platform]}</p>
                  <p className="text-xs text-muted-foreground">{platform.handle}</p>
                </div>
                <p className="font-bold text-gold">{formatFollowers(platform.followers)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Events */}
      <section className="px-4 py-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar size={12} />
          Active Events
        </h3>
        {activeEvents.length > 0 ? (
          <div className="space-y-2">
            {activeEvents.map((event) => (
              <div
                key={event.id}
                className="bg-surface-1 border border-border rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.subtitle}</p>
                </div>
                <StatusBadge status={event.status} small />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active events.</p>
        )}
      </section>

      {/* Recent Events */}
      <section className="px-4 py-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Recent Events
        </h3>
        {recentEvents.length > 0 ? (
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="bg-surface-1 border border-border rounded-lg p-3"
              >
                <p className="font-semibold text-sm">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.subtitle}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent events.</p>
        )}
      </section>

      {/* Achievements */}
      {currentUser.achievements.length > 0 && (
        <section className="px-4 py-4 pb-8">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
            <Trophy size={12} />
            Achievements
          </h3>
          <div className="flex flex-wrap gap-2">
            {currentUser.achievements.map((achievement, index) => (
              <span
                key={index}
                className="bg-gold/10 text-gold border border-gold/20 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.1em]"
              >
                {achievement}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
