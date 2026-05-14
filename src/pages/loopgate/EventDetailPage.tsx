import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Zap, Eye, Users, Send, CheckCircle2, XCircle, Target, Trophy, ExternalLink, Flame, Music2, Crown, Medal, Gem, Sparkles } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import RingsCoin from '@/components/loopgate/RingsCoin';
import { useRealEvents, useEventRankings, useEventStats, useActiveSession, getEventSlug } from "@/hooks/useRealData";
import { useEventRounds, useUserRoundStatus } from "@/hooks/useOpenArenaData";
import { useAuth } from "@/hooks/useAuth";
import StatusBadge from "@/components/loopgate/StatusBadge";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import SubmissionModal from "@/components/loopgate/SubmissionModal";
import OpenArenaRoundLeaderboard from "@/components/loopgate/OpenArenaRoundLeaderboard";
import OpenArenaGuide, { OpenArenaInfoButton } from "@/components/loopgate/OpenArenaGuide";
import ReportUserButton from "@/components/loopgate/ReportUserButton";
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
  
  // Find event by slug or UUID
  const event = events.find((e) => e.slug === id || e.id === id);
  const eventId = event?.id || null;

  const { rankings, loading: rankingsLoading } = useEventRankings(eventId);
  const { stats } = useEventStats(eventId);
  
  // Open Arena data
  const { rounds, loading: roundsLoading } = useEventRounds(eventId);
  const { statuses: userRoundStatuses } = useUserRoundStatus(eventId);

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
    <div className="min-h-screen pb-28 bg-[#0a0a0a]">
      {/* Cinematic Poster Hero */}
      <div className="relative">
        <Link to="/arena" className="absolute top-3 left-3 z-30 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-95 transition">
          <ArrowLeft size={18} className="text-white" />
        </Link>
        {isLive && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.18em]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
          </div>
        )}

        <div className="relative w-full" style={{ aspectRatio: '3 / 4', maxHeight: '58vh' }}>
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 pb-5">
            {(event as any).editor_category && (
              <span className="inline-block mb-2 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur text-[9px] font-black uppercase tracking-[0.18em] text-white/80">
                {(event as any).editor_category}
              </span>
            )}
            <h1 className="text-[34px] leading-[0.92] font-black text-white tracking-tight" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
              {event.title.toUpperCase()}
            </h1>
            {event.subtitle && (
              <p className="text-[12px] text-white/60 mt-1.5 uppercase tracking-[0.15em]">{event.subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Hero stat ribbon */}
      <div className="px-4 -mt-5 relative z-10">
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/[0.18] via-black to-red-500/[0.15] border border-white/10 p-px shadow-[0_20px_60px_-20px_rgba(245,158,11,0.35)]">
          <div className="rounded-2xl bg-[#0a0a0a]/95 backdrop-blur p-3.5">
            <div className="flex items-stretch divide-x divide-white/[0.08]">
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-1 text-amber-300/80 text-[9px] font-black uppercase tracking-[0.2em] mb-1">
                  <Trophy size={10} /> Prize Pool
                </div>
                <div className="text-[18px] font-black text-amber-300 leading-none" style={{ fontFamily: 'Teko, Inter, sans-serif' }}>
                  $150 USD
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <RingsCoin size={13} />
                  <span className="text-[11px] font-bold text-white/80 leading-none tabular-nums">1,000,000</span>
                </div>
              </div>
              <div className="flex-1 pl-3">
                <div className="flex items-center gap-1 text-red-300/80 text-[9px] font-black uppercase tracking-[0.2em] mb-1">
                  <Clock size={10} /> Deadline
                </div>
                <div className="text-[18px] font-black text-red-300 leading-none" style={{ fontFamily: 'Teko, Inter, sans-serif' }}>
                  MAY 24
                </div>
                <div className="text-[11px] font-bold text-white/70 leading-none mt-1">2026 · 11:59 PM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live activity strip */}
        {isLive && (
          <div className="mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <Flame size={11} className="text-emerald-400" />
              <span className="text-[11px] text-foreground font-bold tabular-nums">{stats.entries}</span>
              <span className="text-[10px] text-muted-foreground">edits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={11} className="text-foreground/70" />
              <span className="text-[11px] text-foreground font-bold tabular-nums">{stats.activeUsers}</span>
              <span className="text-[10px] text-muted-foreground">online</span>
            </div>
          </div>
        )}

        {/* Live countdown */}
        {!isClosed && (!isOpenArena || !activeRound) && (
          <div className="mt-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <CountdownTimer
              endDate={isLive ? event.end_date : event.start_date}
              label={isLive ? "Closes In" : "Starts In"}
            />
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Official Sound CTA */}
        {(event as any).materials_url && (
          <a
            href={(event as any).materials_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-r from-fuchsia-500/[0.12] via-black to-cyan-400/[0.10] active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-3 p-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(217,70,239,0.6)]">
                <Music2 size={20} className="text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-black uppercase tracking-[0.22em] text-fuchsia-300/80">Official Sound</div>
                <div className="text-[14px] font-black text-white leading-tight truncate" style={{ fontFamily: 'Teko, Inter, sans-serif' }}>
                  FIX MY SOUL · TIKTOK
                </div>
                <div className="text-[10px] text-white/50 truncate">Tap to use this sound on your edit</div>
              </div>
              <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-[0.18em]">
                Use <ExternalLink size={11} />
              </div>
            </div>
          </a>
        )}

        {/* Prize Breakdown */}
        {event.slug === 'light-yagami-edit-competition' && (
          <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60 flex items-center gap-1.5">
                <Sparkles size={11} className="text-amber-300" /> Prize Breakdown
              </h3>
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-amber-300/80">
                $150 + <RingsCoin size={11} /> 1M
              </span>
            </div>

            {/* Cash podium */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="relative rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-400/[0.18] to-amber-700/[0.05] p-3 overflow-hidden">
                <Crown size={56} className="absolute -right-3 -bottom-3 text-amber-300/10" />
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200/80">1st · Best Edit</div>
                <div className="text-[26px] font-black text-amber-300 leading-none mt-1" style={{ fontFamily: 'Teko, Inter, sans-serif' }}>$90</div>
                <div className="flex items-center gap-1 mt-1">
                  <RingsCoin size={11} />
                  <span className="text-[10px] text-amber-100/80 font-bold tabular-nums">120,000</span>
                </div>
              </div>
              <div className="relative rounded-xl border border-zinc-300/20 bg-gradient-to-br from-zinc-300/[0.12] to-zinc-500/[0.04] p-3 overflow-hidden">
                <Medal size={56} className="absolute -right-3 -bottom-3 text-zinc-200/10" />
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-200/80">2nd · Most Viral</div>
                <div className="text-[26px] font-black text-zinc-100 leading-none mt-1" style={{ fontFamily: 'Teko, Inter, sans-serif' }}>$60</div>
                <div className="flex items-center gap-1 mt-1">
                  <RingsCoin size={11} />
                  <span className="text-[10px] text-zinc-200/80 font-bold tabular-nums">100,000</span>
                </div>
              </div>
            </div>

            {/* Rings tiers */}
            <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/[0.06]">
              <div className="px-3 py-2 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-emerald-300/90">
                  <RingsCoin size={11} /> Season Top 50 · 1,000,000 Pool
                </div>
              </div>
              {[
                { tier: 'Tier 1', range: 'Ranks 1–5', rings: '400K', detail: '120K · 100K · 80K · 60K · 40K', accent: 'text-amber-300' },
                { tier: 'Tier 2', range: 'Ranks 6–15', rings: '300K', detail: '~30K each', accent: 'text-zinc-100' },
                { tier: 'Tier 3', range: 'Ranks 16–30', rings: '200K', detail: '~13K each', accent: 'text-orange-300' },
                { tier: 'Tier 4', range: 'Ranks 31–50', rings: '100K', detail: '~5K each', accent: 'text-emerald-300' },
              ].map((t) => (
                <div key={t.tier} className="px-3 py-2.5 flex items-center gap-3">
                  <div className="w-[58px]">
                    <div className={`text-[11px] font-black ${t.accent}`} style={{ fontFamily: 'Teko, Inter, sans-serif' }}>{t.tier.toUpperCase()}</div>
                    <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{t.range}</div>
                  </div>
                  <div className="flex-1 text-[10px] text-white/55 truncate">{t.detail}</div>
                  <div className="flex items-center gap-1">
                    <RingsCoin size={12} />
                    <div className={`text-[14px] font-black ${t.accent} tabular-nums`} style={{ fontFamily: 'Teko, Inter, sans-serif' }}>{t.rings}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin size={12} />
            <span>{event.location}</span>
          </div>
          <span className="text-gold uppercase tracking-[0.18em] text-[10px] font-black">
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
                    <GateIcon size={12} />
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

                {/* Round Countdown or Status */}
                {activeRound.ends_at ? (
                  <CountdownTimer 
                    endDate={activeRound.ends_at} 
                    label="Round Ends"
                    expiredLabel="Awaiting results..."
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} className="text-gold" />
                    <span>Round timing pending</span>
                  </div>
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

        {/* Description */}
        {event.description && (
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              About This Event
            </h3>
            <p className="text-sm whitespace-pre-wrap">{event.description}</p>
          </section>
        )}

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
                      <ReportUserButton
                        userId={r.user_id}
                        username={r.profile?.username}
                        context="competition"
                        contextId={event.id}
                      />
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
        {/* Inline submit removed — sticky CTA bar handles it */}

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

      {/* Sticky ENTER bar — addiction CTA */}
      {isLive && !(isOpenArena && advancementStatus === 'eliminated') && (
        <div className="fixed bottom-0 inset-x-0 z-50 px-3 pt-2 pb-[max(env(safe-area-inset-bottom,0px),8px)] bg-gradient-to-t from-black via-black/95 to-transparent">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full relative overflow-hidden rounded-xl py-3.5 bg-emerald-500 text-black font-black text-[14px] uppercase tracking-[0.2em] active:scale-[0.99] transition-transform"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            <span className="relative inline-flex items-center gap-2">
              <Send size={15} />
              {isOpenArena && activeRound ? `Submit · Round ${activeRound.round_number}` : 'Enter Competition'}
            </span>
          </button>
        </div>
      )}
      {isLive && isOpenArena && advancementStatus === 'eliminated' && (
        <div className="fixed bottom-0 inset-x-0 z-50 px-3 pt-2 pb-[max(env(safe-area-inset-bottom,0px),8px)] bg-gradient-to-t from-black to-transparent">
          <div className="w-full text-center py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-muted-foreground text-[12px] font-bold">
            Eliminated in a previous round
          </div>
        </div>
      )}

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
