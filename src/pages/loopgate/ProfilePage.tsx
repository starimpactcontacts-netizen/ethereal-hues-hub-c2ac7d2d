import { ExternalLink, Trophy, Calendar } from "lucide-react";
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

const platformLabels = {
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

  const leagueColors = {
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

      {/* Profile Card */}
      <div className="p-4">
        <div className="bg-surface-1 border border-border rounded-lg p-5">
          {/* Alias + Region */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{currentUser.alias}</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1">
                {currentUser.region}
              </p>
            </div>
            <span className={`text-xs font-bold uppercase tracking-[0.15em] ${leagueColors[currentUser.league]}`}>
              {currentUser.league} League
            </span>
          </div>

          {/* Global Rank */}
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-4xl font-bold text-gold">#{currentUser.rank}</span>
            <span className="text-sm text-muted-foreground">Global Rank</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-2xl font-bold">{currentUser.indexScore.toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-[0.1em] mt-1">
                Index Score
              </p>
            </div>
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-2xl font-bold">{currentUser.winRate}%</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-[0.1em] mt-1">
                Win Rate
              </p>
            </div>
          </div>

          {/* Qualification Status */}
          <div className="pt-4 border-t border-border">
            <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mb-2">
              Qualification
            </p>
            <StatusBadge
              status={currentUser.qualificationStatus === "qualified" ? "qualified" : "pending"}
            />
          </div>
        </div>
      </div>

      {/* Platforms */}
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
                className="bg-gold/10 text-gold border border-gold/20 px-3 py-1.5 rounded text-[10px] font-semibold uppercase tracking-[0.1em]"
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
