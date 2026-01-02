import { ExternalLink, Trophy, Star, Calendar } from "lucide-react";
import { currentUser, mockEvents } from "@/data/loopgateData";
import StatusBadge from "@/components/loopgate/StatusBadge";

export default function ProfilePage() {
  const activeEvents = mockEvents.filter((e) =>
    currentUser.activeEvents.includes(e.id)
  );
  const pastEvents = mockEvents.filter((e) =>
    currentUser.pastEvents.includes(e.id)
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight">LOFILE</h1>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
            Editor Identity
          </p>
        </div>
      </header>

      {/* Profile Card */}
      <div className="px-4 py-6">
        <div className="bg-card border border-border rounded-lg p-6">
          {/* Alias */}
          <h2 className="text-2xl font-bold">{currentUser.alias}</h2>

          {/* Rank */}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gold">#{currentUser.rank}</span>
            <span className="text-sm text-muted-foreground">Global Rank</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-xl font-bold">{currentUser.indexScore.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                Index
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{currentUser.winRate}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                Win Rate
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{currentUser.finalsReached}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                Finals
              </p>
            </div>
          </div>

          {/* Qualification Status */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              Qualification Status
            </p>
            <StatusBadge
              status={currentUser.qualificationStatus === "qualified" ? "qualified" : "pending"}
            />
          </div>
        </div>
      </div>

      {/* Active Events */}
      <section className="px-4 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar size={14} />
          Active Events
        </h3>
        {activeEvents.length > 0 ? (
          <div className="space-y-2">
            {activeEvents.map((event) => (
              <div
                key={event.id}
                className="bg-card border border-border rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.subtitle}</p>
                </div>
                <StatusBadge status={event.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active events.</p>
        )}
      </section>

      {/* Past Events */}
      <section className="px-4 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Past Events
        </h3>
        {pastEvents.length > 0 ? (
          <div className="space-y-2">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                className="bg-card border border-border rounded-lg p-3"
              >
                <p className="font-semibold text-sm">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.subtitle}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No past events.</p>
        )}
      </section>

      {/* Achievements */}
      <section className="px-4 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Trophy size={14} />
          Achievements
        </h3>
        {currentUser.achievements.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {currentUser.achievements.map((achievement, index) => (
              <span
                key={index}
                className="bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-semibold"
              >
                {achievement}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No achievements yet.</p>
        )}
      </section>

      {/* External Links */}
      <section className="px-4 py-4 pb-8">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <ExternalLink size={14} />
          External Links
        </h3>
        <div className="space-y-2">
          {currentUser.externalLinks.tiktok && (
            <a
              href={currentUser.externalLinks.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-card border border-border rounded-lg p-3 text-sm font-medium"
            >
              TikTok →
            </a>
          )}
          {currentUser.externalLinks.instagram && (
            <a
              href={currentUser.externalLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-card border border-border rounded-lg p-3 text-sm font-medium"
            >
              Instagram →
            </a>
          )}
          {currentUser.externalLinks.youtube && (
            <a
              href={currentUser.externalLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-card border border-border rounded-lg p-3 text-sm font-medium"
            >
              YouTube →
            </a>
          )}
          {currentUser.externalLinks.portfolio && (
            <a
              href={currentUser.externalLinks.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-card border border-border rounded-lg p-3 text-sm font-medium"
            >
              Portfolio →
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
