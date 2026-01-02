import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Lock, ExternalLink, Clock, MapPin } from "lucide-react";
import { mockEvents, currentUser } from "@/data/loopgateData";
import StatusBadge from "@/components/loopgate/StatusBadge";
import CountdownTimer from "@/components/loopgate/CountdownTimer";

export default function EventDetailPage() {
  const { id } = useParams();
  const event = mockEvents.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const isUserEligible = event.status === "live" && event.league === "open";
  const userQualificationStatus = currentUser.activeEvents.includes(event.id)
    ? "pending"
    : null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-1 -ml-1">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-base font-bold">{event.title}</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
              Arena
            </p>
          </div>
        </div>
      </header>

      {/* Event Banner */}
      <div className="relative h-40 bg-gradient-to-br from-surface-2 to-surface-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{event.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{event.subtitle}</p>
        </div>
        <div className="absolute top-4 right-4">
          <StatusBadge status={event.status} />
        </div>
      </div>

      {/* Event Info */}
      <div className="px-4 py-6 space-y-6">
        {/* Timeline */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Timeline
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start</span>
              <span className="font-medium">
                {new Date(event.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End</span>
              <span className="font-medium">
                {new Date(event.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          {event.status === "live" && (
            <div className="mt-4 pt-4 border-t border-border">
              <CountdownTimer endDate={event.endDate} label="Time Remaining" />
            </div>
          )}
        </section>

        {/* Location & League */}
        <section className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-muted-foreground" />
              <span>{event.location}</span>
            </div>
            <span className="text-gold uppercase tracking-wider text-xs font-semibold">
              {event.league} League
            </span>
          </div>
        </section>

        {/* Prize Pool */}
        {event.prizePool && (
          <section className="bg-card border border-gold/30 rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Prize Pool
            </h3>
            <p className="text-2xl font-bold text-gold">{event.prizePool}</p>
          </section>
        )}

        {/* Rules */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Rules
          </h3>
          <ul className="space-y-2">
            {event.rules.map((rule, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-gold mt-0.5">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Qualification Status */}
        {userQualificationStatus && (
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Your Status
            </h3>
            <StatusBadge status={userQualificationStatus === "pending" ? "pending" : "qualified"} />
          </section>
        )}

        {/* Lock Entry Button */}
        {isUserEligible && !userQualificationStatus && (
          <button className="w-full bg-gold text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 card-hover">
            <Lock size={18} />
            LOCK ENTRY
          </button>
        )}

        {/* Note about submissions */}
        <p className="text-xs text-center text-muted-foreground">
          Submissions are indexed from TikTok, Instagram, and YouTube.
          <br />
          Loopgate does not host uploads.
        </p>
      </div>
    </div>
  );
}
