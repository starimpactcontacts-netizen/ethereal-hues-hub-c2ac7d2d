import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Zap, Eye, Users, Send, CheckCircle2, XCircle, Target, Trophy, Sparkles, ExternalLink } from "lucide-react";
import { useRealEvents, useEventRankings, useEventStats, useActiveSession } from "@/hooks/useRealData";
import { useEventRounds, useUserRoundStatus } from "@/hooks/useOpenArenaData";
import { useAuth } from "@/hooks/useAuth";
import StatusBadge from "@/components/loopgate/StatusBadge";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import SubmissionModal from "@/components/loopgate/SubmissionModal";
import OpenArenaRoundLeaderboard from "@/components/loopgate/OpenArenaRoundLeaderboard";
import OpenArenaGuide, { OpenArenaInfoButton } from "@/components/loopgate/OpenArenaGuide";
import { Badge } from "@/components/ui/badge";

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Keep session active
  useActiveSession();

  // Fetch real data
  const { events, loading: eventsLoading } = useRealEvents();
  const { rankings, loading: rankingsLoading } = useEventRankings(id || null);
  const { stats } = useEventStats(id || null);
  
  // Open Arena data
  const { rounds, loading: roundsLoading } = useEventRounds(id || null);
  const { statuses: userRoundStatuses } = useUserRoundStatus(id || null);

  const event = events.find((e) => e.id === id);
  const isOpenArena = (event as any)?.event_mode === 'open_arena';
  const activeRound = rounds.find(r => r.status === 'active');
  const currentUserStatus = userRoundStatuses.find(s => s.round_number === activeRound?.round_number);

  // Check if user should see the Open Arena guide
  useEffect(() => {
    if (isOpenArena && event) {
      const hasSeenGuide = localStorage.getItem('loopgate-guide-open-arena-v1');
      // Auto-show guide for first-time viewers of Open Arena events
      if (!hasSeenGuide) {
        setShowGuide(true);
        localStorage.setItem('loopgate-guide-open-arena-v1', 'true');
      }
    }
  }, [isOpenArena, event]);

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

  const getUserAdvancementStatus = () => {
    if (!user || !activeRound) return null;
    const status = userRoundStatuses.find(s => s.round_number === activeRound.round_number);
    if (!status) return 'not_entered';
    return status.status;
  };

  const advancementStatus = getUserAdvancementStatus();

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
              {isOpenArena ? 'Open Arena' : 'Arena'}
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
          <div className="flex items-center gap-2 mb-2">
            {isOpenArena && (
              <Badge className="bg-gold/20 text-gold text-[10px] gap-1">
                <Zap size={10} />
                OPEN ARENA
              </Badge>
            )}
          </div>
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

        {/* Open Arena Info Button */}
        {isOpenArena && (
          <div className="flex items-center justify-between">
            <OpenArenaInfoButton onClick={() => setShowGuide(true)} />
            {rounds.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {rounds.length} Round{rounds.length > 1 ? 's' : ''} • {activeRound ? `R${activeRound.round_number} Active` : 'Awaiting Start'}
              </span>
            )}
          </div>
        )}

        {/* Open Arena Round Progress */}
        {isOpenArena && rounds.length > 0 && (
          <section className="bg-surface-1 rounded-lg border border-border overflow-hidden">
            {/* Round Tabs */}
            <div className="flex border-b border-border">
              {rounds.map((round) => {
                const userStatus = userRoundStatuses.find(s => s.round_number === round.round_number);
                return (
                  <div
                    key={round.round_number}
                    className={`flex-1 px-3 py-3 text-center relative ${
                      round.status === 'active' ? 'bg-gold/10' : ''
                    }`}
                  >
                    <div className="text-xs font-bold">R{round.round_number}</div>
                    <div className={`text-[9px] uppercase tracking-wider mt-0.5 ${
                      round.status === 'active' ? 'text-green-400' :
                      round.status === 'completed' ? 'text-muted-foreground' :
                      'text-muted-foreground/50'
                    }`}>
                      {round.status === 'active' ? 'Live' : round.status === 'completed' ? 'Done' : 'Soon'}
                    </div>
                    {userStatus && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                        {userStatus.status === 'advanced' ? (
                          <CheckCircle2 size={12} className="text-green-400" />
                        ) : userStatus.status === 'eliminated' ? (
                          <XCircle size={12} className="text-red-400" />
                        ) : null}
                      </div>
                    )}
                    {round.status === 'active' && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active Round Details */}
            {activeRound && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${
                      activeRound.round_type === 'open' ? 'bg-green-500/20 text-green-400' :
                      activeRound.round_type === 'elimination' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {activeRound.round_type === 'open' ? 'Open' : 
                       activeRound.round_type === 'elimination' ? 'Elimination' : 'Threshold'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Round {activeRound.round_number} of {rounds.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gold">
                    <Sparkles size={12} />
                    <span>{activeRound.index_reward} INDEX</span>
                  </div>
                </div>

                {/* Advancement Info */}
                {activeRound.round_type !== 'open' && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-background rounded border border-border">
                    <Target size={14} className="text-orange-400" />
                    <span>
                      {activeRound.round_type === 'elimination' 
                        ? activeRound.advancement_type === 'top_x'
                          ? `Top ${activeRound.advancement_value} editors advance`
                          : `Top ${activeRound.advancement_value}% advance`
                        : `QOI ≥ ${activeRound.threshold_qoi} to advance`
                      }
                    </span>
                  </div>
                )}

                {/* User's Current Status */}
                {user && advancementStatus && advancementStatus !== 'not_entered' && (
                  <div className={`p-3 rounded-lg border ${
                    advancementStatus === 'advanced' ? 'bg-green-500/10 border-green-500/30' :
                    advancementStatus === 'eliminated' ? 'bg-red-500/10 border-red-500/30' :
                    'bg-gold/10 border-gold/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      {advancementStatus === 'advanced' ? (
                        <>
                          <CheckCircle2 size={16} className="text-green-400" />
                          <span className="text-sm font-semibold text-green-400">You Advanced!</span>
                        </>
                      ) : advancementStatus === 'eliminated' ? (
                        <>
                          <XCircle size={16} className="text-red-400" />
                          <span className="text-sm font-semibold text-red-400">Eliminated</span>
                        </>
                      ) : (
                        <>
                          <Zap size={16} className="text-gold" />
                          <span className="text-sm font-semibold text-gold">Competing</span>
                        </>
                      )}
                    </div>
                    {currentUserStatus?.qoi_score !== null && currentUserStatus?.qoi_score !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Your QOI: <span className="text-foreground font-medium">{currentUserStatus.qoi_score}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Round Countdown */}
                {activeRound.ends_at && (
                  <CountdownTimer 
                    endDate={activeRound.ends_at} 
                    label="Round Ends"
                  />
                )}
              </div>
            )}
          </section>
        )}

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

        {/* Countdown (Live/Upcoming) - Only for non-Open Arena or when no active round */}
        {!isClosed && (!isOpenArena || !activeRound) && (
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

        {/* Materials / Assets Link */}
        {(event as any).materials_url && (
          <section className="bg-card border border-gold/30 rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <ExternalLink size={14} className="text-gold" />
              Event Materials
            </h3>
            <a 
              href={(event as any).materials_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gold hover:underline text-sm font-medium"
            >
              <span>Access Sounds & Assets</span>
              <ExternalLink size={14} />
            </a>
            <p className="text-[10px] text-muted-foreground mt-2">
              Download or access the official materials for this event
            </p>
          </section>
        )}

        {/* Open Arena Round Leaderboard */}
        {isOpenArena && rounds.length > 0 && isLive && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Trophy size={14} className="text-gold" />
              Round Rankings
            </h3>
            <OpenArenaRoundLeaderboard
              eventId={id || ''}
              rounds={rounds}
              showEliminated={(event as any).show_eliminated ?? true}
              currentUserId={user?.id}
            />
          </section>
        )}

        {/* Standard Live Rankings Preview - For non-Open Arena events */}
        {!isOpenArena && isLive && (
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

        {/* Submit Button (Live only) - Check if user can submit to active round */}
        {isLive && (
          <>
            {isOpenArena && advancementStatus === 'eliminated' ? (
              <div className="w-full bg-surface-1 border border-border text-muted-foreground font-medium py-4 rounded-lg text-center">
                You were eliminated in a previous round
              </div>
            ) : (
              <button 
                onClick={() => setShowSubmitModal(true)}
                className="w-full bg-gold text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {isOpenArena && activeRound ? `Submit to Round ${activeRound.round_number}` : 'Submit Edit'}
              </button>
            )}
          </>
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
        roundNumber={isOpenArena ? activeRound?.round_number : undefined}
      />

      {/* Open Arena Guide Modal */}
      <OpenArenaGuide
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
}
