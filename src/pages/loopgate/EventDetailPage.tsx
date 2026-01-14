import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Zap, Eye, Users, Send } from "lucide-react";
import { useRealEvents, useEventRankings, useEventStats, useActiveSession } from "@/hooks/useRealData";
import StatusBadge from "@/components/loopgate/StatusBadge";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import SubmissionModal from "@/components/loopgate/SubmissionModal";

export default function EventDetailPage() {
  const { id } = useParams();
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Keep session active
  useActiveSession();

  // Fetch real data
  const { events, loading: eventsLoading } = useRealEvents();
  const { rankings, loading: rankingsLoading } = useEventRankings(id || null);
  const { stats } = useEventStats(id || null);

  const event = events.find((e) => e.id === id);

  if (eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const isLive = event.status === "live";
  const isClosed = event.status === "closed";

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to="/events" className="p-1 -ml-1">
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
        {event.poster_url && (
          <div 
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(${event.poster_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-3xl font-black tracking-tight">{event.title}</h2>
          {event.subtitle && <p className="text-sm text-muted-foreground mt-1">{event.subtitle}</p>}
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

        {/* Editor Category */}
        {(event as any).editor_category && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Category:</span>
            <span className="px-2 py-0.5 bg-gold/10 border border-gold/30 text-gold text-xs font-semibold uppercase tracking-wider rounded-full">
              {(event as any).editor_category.replace('-', ' / ').replace('_', ' ')}
            </span>
          </div>
        )}

        {/* Live Activity Indicators - Real Data */}
        {isLive && (
          <section className="bg-surface-1 rounded-lg p-4 border border-border space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
                <Zap size={12} className="text-green-500" />
              </div>
              <span className="text-muted-foreground">
                <span className="text-foreground font-semibold">{stats.entries}</span> edits submitted
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center">
                <Eye size={12} className="text-gold" />
              </div>
              <span className="text-muted-foreground">
                <span className="text-gold font-semibold">{stats.judges}</span> judges active
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center">
                <Users size={12} />
              </div>
              <span className="text-muted-foreground">
                <span className="text-foreground font-semibold">{stats.activeUsers}</span> editors online now
              </span>
            </div>
          </section>
        )}

        {/* Countdown (Live/Upcoming) */}
        {!isClosed && (
          <section className="bg-surface-1 border border-border rounded-lg p-4">
            <CountdownTimer 
              endDate={isLive ? event.end_date : event.start_date} 
              label={isLive ? "Event Ends" : "Event Starts"}
              large
            />
          </section>
        )}

        {/* Prize Pool */}
        {event.prize_pool && (
          <section className="bg-card border border-gold/30 rounded-lg p-5 text-center">
            <p className="text-3xl font-black text-gold">{event.prize_pool}</p>
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
                {new Date(event.start_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End</span>
              <span className="font-medium">
                {new Date(event.end_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </section>

        {/* Rules */}
        {event.rules && event.rules.length > 0 && (
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
        )}

        {/* Live Rankings Preview - Real Data */}
        {isLive && (
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
            {rankings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No rankings yet</p>
            ) : (
              <div className="space-y-2">
                {rankings.slice(0, 5).map((r, index) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-bold text-gold">{r.final_rank || index + 1}</span>
                      <span className="font-semibold text-sm">{r.profile?.username || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-muted-foreground">
                        Q<span className="text-foreground ml-1">{r.quality_score || '—'}</span>
                      </div>
                      <div className="text-muted-foreground">
                        O<span className="text-foreground ml-1">{r.originality_score || '—'}</span>
                      </div>
                      <div className="text-muted-foreground">
                        I<span className="text-foreground ml-1">{r.impact_score || '—'}</span>
                      </div>
                      <span className="font-bold text-gold w-12 text-right">{r.qoi_score?.toFixed(1) || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
