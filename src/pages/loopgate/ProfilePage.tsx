import { ExternalLink } from "lucide-react";
import { currentUser, mockEvents } from "@/data/loopgateData";
import StatusBadge from "@/components/loopgate/StatusBadge";
import loopgateLogo from "@/assets/loopgate-logo.png";

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
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Lofile
          </span>
        </div>
      </header>

      {/* Identity Card */}
      <div className="p-4">
        <div className="bg-surface-1 border border-border rounded-lg p-6">
          {/* Alias - Hero */}
          <h1 className="text-2xl font-black tracking-tight">
            {currentUser.alias}
          </h1>

          {/* Global Rank */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-5xl font-black text-gold">
              #{currentUser.rank}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              Global
            </span>
          </div>

          {/* Stats Row */}
          <div className="mt-8 grid grid-cols-3 gap-4">
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
              <p className="text-xl font-bold">{currentUser.finalsReached}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                Finals
              </p>
            </div>
          </div>

          {/* Qualification Status */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">
              Qualification
            </p>
            <StatusBadge status={currentUser.qualificationStatus} />
          </div>
        </div>
      </div>

      {/* Active Events */}
      <section className="px-4 py-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
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
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {event.subtitle}
                  </p>
                </div>
                <StatusBadge status={event.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No active events</p>
        )}
      </section>

      {/* Past Events */}
      <section className="px-4 py-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Past Events
        </h3>
        {pastEvents.length > 0 ? (
          <div className="space-y-2">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                className="bg-surface-1 border border-border rounded-lg p-3"
              >
                <p className="font-semibold text-sm">{event.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {event.subtitle}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No past events</p>
        )}
      </section>

      {/* Achievements */}
      {currentUser.achievements.length > 0 && (
        <section className="px-4 py-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Achievements
          </h3>
          <div className="flex flex-wrap gap-2">
            {currentUser.achievements.map((achievement, index) => (
              <span
                key={index}
                className="bg-gold/10 text-gold border border-gold/20 px-3 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider"
              >
                {achievement}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* External Link - TikTok only as per spec */}
      {currentUser.externalLinks.tiktok && (
        <section className="px-4 py-4 pb-8">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            External
          </h3>
          <a
            href={currentUser.externalLinks.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-surface-1 border border-border rounded-lg p-4"
          >
            <span className="text-sm font-medium">TikTok</span>
            <ExternalLink size={14} className="text-muted-foreground" />
          </a>
        </section>
      )}
    </div>
  );
}
