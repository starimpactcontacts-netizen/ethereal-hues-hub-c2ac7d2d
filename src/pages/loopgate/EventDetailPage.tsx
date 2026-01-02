import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Clock, MapPin, Zap, Eye, Users, Send } from "lucide-react";
import { mockEvents, currentUser, generateEventRankings } from "@/data/loopgateData";
import StatusBadge from "@/components/loopgate/StatusBadge";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import SubmissionModal from "@/components/loopgate/SubmissionModal";

export default function EventDetailPage() {
  const { id } = useParams();
  const event = mockEvents.find((e) => e.id === id);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const isLive = event.status === "live";
  const isClosed = event.status === "closed";
  const rankings = generateEventRankings(event.id, 10);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-1 -ml-1">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold">{event.title}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Arena
            </p>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </header>

      {/* Event Banner with Poster */}
      <div className="relative">
        {event.posterUrl && (
          <div 
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(${event.posterUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-3xl font-black tracking-tight">{event.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{event.subtitle}</p>
        </div>
      </div>

      {/* Event Info */}
      <div className="px-4 py-6 space-y-4">
        {/* Status & Meta */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin size={14} />
            <span>{event.location}</span>
          </div>
          <span className="text-gold uppercase tracking-wider text-xs font-semibold">
            {event.league} League
          </span>
        </div>

        {/* Live Activity Indicators */}
        {isLive && (
          <section className="bg-surface-1 rounded-lg p-4 border border-border space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
                <Zap size={12} className="text-green-500" />
              </div>
              <span className="text-muted-foreground">
                <span className="text-foreground font-semibold">287</span> edits submitted in last 24h
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center">
                <Eye size={12} className="text-gold" />
              </div>
              <span className="text-muted-foreground">
                Live judging <span className="text-gold font-semibold">in progress</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center">
                <Users size={12} />
              </div>
              <span className="text-muted-foreground">
                <span className="text-foreground font-semibold">1,247</span> editors competing globally
              </span>
            </div>
          </section>
        )}

        {/* Countdown (Live/Upcoming) */}
        {!isClosed && (
          <section className="bg-surface-1 border border-border rounded-lg p-4">
            <CountdownTimer 
              endDate={isLive ? event.endDate : event.startDate} 
              label={isLive ? "Event Ends" : "Event Starts"}
              large
            />
          </section>
        )}

        {/* Prize Pool */}
        {event.prizePool && (
          <section className="bg-card border border-gold/30 rounded-lg p-5 text-center">
            <p className="text-3xl font-black text-gold">{event.prizePool}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              Prize Pool
            </p>
          </section>
        )}

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
        </section>

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

        {/* Live Rankings Preview (QOI visible only for live) */}
        {isLive && rankings.length > 0 && (
          <section className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Live Rankings
              </h3>
              <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Updating
              </span>
            </div>
            <div className="space-y-2">
              {rankings.slice(0, 5).map((r) => (
                <div key={r.editorId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-gold">{r.rank}</span>
                    <span className="font-semibold text-sm">{r.alias}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-muted-foreground">
                      Q<span className="text-foreground ml-1">{r.quality}</span>
                    </div>
                    <div className="text-muted-foreground">
                      O<span className="text-foreground ml-1">{r.originality}</span>
                    </div>
                    <div className="text-muted-foreground">
                      I<span className="text-foreground ml-1">{r.impact}</span>
                    </div>
                    <span className="font-bold text-gold w-12 text-right">{r.qoiTotal}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link 
              to={`/rankings?event=${event.id}`}
              className="block text-center text-xs text-gold font-semibold mt-4 py-2"
            >
              View Full Rankings →
            </Link>
          </section>
        )}

        {/* Closed Event - Final Results */}
        {isClosed && (
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Final Results
            </h3>
            <p className="text-sm text-muted-foreground">
              This event has concluded. Rankings are locked and scores have been integrated into the Global Index.
            </p>
            <Link 
              to={`/rankings?event=${event.id}`}
              className="block text-center text-xs text-gold font-semibold mt-4 py-2"
            >
              View Final Rankings →
            </Link>
          </section>
        )}

        {/* Submit Button (Live only) */}
        {isLive && (
          <button 
            onClick={() => setShowSubmitModal(true)}
            className="w-full bg-gold text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2"
          >
            <Send size={18} />
            Submit Edit
          </button>
        )}

        {/* Pending Status */}
        {event.status === "pending" && (
          <div className="bg-surface-1 border border-border rounded-lg p-4 text-center">
            <Clock size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Submissions open when the event goes live.
            </p>
          </div>
        )}

        {/* Indexing Note */}
        <p className="text-[10px] text-center text-muted-foreground">
          Submissions are indexed from TikTok, Instagram, and YouTube.
          <br />
          Loopgate does not host uploads.
        </p>
      </div>

      {/* Submit Modal */}
      <SubmissionModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        eventId={event.id}
        eventTitle={event.title}
      />
    </div>
  );
}
