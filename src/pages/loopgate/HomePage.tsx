import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Clock, Zap, Users, Trophy, Flame, Swords, Gavel } from "lucide-react";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import loopgateLogo from "@/assets/loopgate-logo.png";
import PosterStrip from "@/components/loopgate/PosterStrip";
import StatusBadge from "@/components/loopgate/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { useRealEvents, useGlobalStats, useActiveSession, getEventSlug } from "@/hooks/useRealData";
import { useAuth } from "@/hooks/useAuth";
import { useEventRounds } from "@/hooks/useOpenArenaData";
import { useActiveBattles } from "@/hooks/useActiveBattles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SEO, { pageSEO } from "@/components/SEO";

// Event Card Component - matches ArenaPage style
function EventCard({ event, isLive }: { event: any; isLive: boolean }) {
  const { rounds } = useEventRounds(event.id);
  const activeRound = rounds.find(r => r.status === 'active');
  const isOpenArena = event.event_mode === 'open_arena';

  return (
    <Link to={`/event/${getEventSlug(event)}`} className="block">
      <div className="bg-surface-1 border border-border hover:border-gold/50 transition-all overflow-hidden group">
        {/* Poster */}
        <div className="relative h-40 overflow-hidden">
          {event.poster_url ? (
            <img
              src={event.poster_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gold/20 to-surface-2 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-gold/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/60 to-transparent" />
          
          {/* Status Badge */}
          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-background">Live</span>
            </div>
          )}
          
          {/* Prize Pool */}
          {event.prize_pool && (
            <div className="absolute top-3 right-3 bg-background/90 border border-gold/50 px-3 py-1.5">
              <span className="font-display text-lg text-gold">{event.prize_pool}</span>
            </div>
          )}
          
          {/* Open Arena Badge */}
          {isOpenArena && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-gold/20 text-gold text-[9px] gap-1 border-gold/30">
                <Zap size={10} />
                OPEN ARENA
              </Badge>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-display text-xl text-foreground mb-1 line-clamp-1">
            {event.title}
          </h3>
          {event.subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">{event.subtitle}</p>
          )}
          
          {/* Meta Row */}
          <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <MapPin size={10} />
              {event.location || 'Loopgate Arena'}
            </span>
            <span className="text-gold font-semibold">{event.league} League</span>
          </div>
          
          {/* Round Status for Open Arena */}
          {isOpenArena && rounds.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              {rounds.map((round, idx) => (
                <div 
                  key={round.id}
                  className={`flex-1 text-center py-1.5 text-[9px] uppercase tracking-wider border ${
                    round.status === 'active' 
                      ? 'bg-gold/20 border-gold/50 text-gold' 
                      : round.status === 'completed'
                      ? 'bg-muted/50 border-border text-muted-foreground'
                      : 'bg-surface-2 border-border text-muted-foreground/60'
                  }`}
                >
                  R{round.round_number}
                  {round.status === 'active' && (
                    <span className="ml-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-gold animate-pulse" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Countdown */}
          <div className="mt-3 p-3 bg-background border border-border">
            {activeRound && isOpenArena ? (
              <div className="text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
                  Round {activeRound.round_number} Ends
                </p>
                {activeRound.ends_at ? (
                  <CountdownTimer endDate={activeRound.ends_at} />
                ) : (
                  <p className="text-xs text-muted-foreground">Awaiting results...</p>
                )}
              </div>
            ) : (
              <CountdownTimer
                endDate={isLive ? event.end_date : event.start_date}
                label={isLive ? "Ends" : "Starts"}
              />
            )}
          </div>
          
          {/* CTA */}
          <div className="mt-3 flex items-center justify-center gap-2 font-display text-sm tracking-wide py-3 bg-gold text-background">
            <span>View Event</span>
            <ChevronRight size={16} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { events, loading } = useRealEvents();
  const { stats } = useGlobalStats();
  const { activeBattles } = useActiveBattles();
  const { user } = useAuth();
  
  // Keep session active
  useActiveSession();

  const liveEvents = events.filter((e) => e.status === "live");
  const primaryEvent = liveEvents[0];
  const upcomingEvents = events.filter((e) => e.status === "pending");
  const closedEvents = events.filter((e) => e.status === "closed");

  return (
    <div className="min-h-screen pb-20 bg-background">
      <SEO {...pageSEO.events} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <div className="flex items-center gap-2">
            {liveEvents.length > 0 && (
              <span className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] text-emerald-400 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {liveEvents.length} Live
              </span>
            )}
            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
              Events
            </span>
          </div>
        </div>
      </header>

      {/* Live Activity Bar */}
      <section className="px-4 py-3 bg-surface-1/50 border-b border-border">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-gold" />
              <span className="text-foreground font-medium">{stats.entries24h}</span>
              <span>edits {stats.entriesLabel === '7d' ? 'this week' : 'today'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              <span className="text-foreground font-medium">{stats.activeUsers}</span>
              <span>online</span>
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${stats.activeUsers > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
            Live
          </span>
        </div>
      </section>

      {/* Active Battle Banner */}
      {activeBattles.length > 0 && (
        <section className="px-4 pt-3">
          {activeBattles.map(battle => {
            const isJudge = battle.judge_id === user?.id;
            const isChallenger = battle.challenger_id === user?.id;
            const roleLabel = isJudge ? '⚖️ YOU\'RE JUDGING' : isChallenger ? '🗡️ YOUR CHALLENGE' : '🛡️ YOU\'RE DEFENDING';
            
            return (
              <Link
                key={battle.id}
                to={`/battle/${battle.id}`}
                className="block mb-2 bg-gradient-to-r from-red-500/15 via-surface-1 to-red-500/15 border border-red-500/40 p-3 hover:border-red-500/60 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
                      {isJudge ? <Gavel className="w-4 h-4 text-purple-400" /> : <Swords className="w-4 h-4 text-red-400" />}
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isJudge ? 'text-purple-400' : 'text-red-400'}`}>
                        {battle.status === 'active' ? `⚔️ LIVE — ${roleLabel}` : 
                         battle.status === 'pending' ? `⏳ PENDING — ${roleLabel}` : `⚖️ JUDGING — ${roleLabel}`}
                      </span>
                      {battle.is_rapid && (
                        <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded">⚡ RAPID</span>
                      )}
                    </div>
                    <p className="text-xs text-foreground truncate mt-0.5">
                      {battle.challenger_username} vs {battle.opponent_username || '???'}
                    </p>
                  </div>
                  {battle.status === 'active' && battle.ends_at && (
                    <div className="text-right flex-shrink-0">
                      <CountdownTimer endDate={battle.ends_at} />
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {primaryEvent ? (
        <section className="p-4">
          <EventCard event={primaryEvent} isLive={true} />
        </section>
      ) : (
        <section className="p-4">
          <div className="bg-surface-1 border border-border p-8 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-display text-lg">No live events</p>
            <p className="text-xs text-muted-foreground mt-2">Check upcoming events below</p>
          </div>
        </section>
      )}

      {/* Movie Poster Strip */}
      <PosterStrip />

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="px-4 py-6 border-t border-border">
          <h2 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <Link 
                key={event.id}
                to={`/event/${getEventSlug(event)}`}
                className="flex items-center justify-between bg-surface-1 border border-border p-4 hover:border-gold/30 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-base text-foreground">{event.title}</h3>
                    <StatusBadge status={event.status} small />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                    <span className="text-gold">{event.league}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {event.prize_pool && <span className="text-gold font-semibold">{event.prize_pool}</span>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past Events */}
      {closedEvents.length > 0 && (
        <section className="px-4 py-6 border-t border-border">
          <h2 className="font-display text-lg text-muted-foreground mb-4">
            Closed
          </h2>
          <div className="space-y-2">
            {closedEvents.slice(0, 3).map((event) => (
              <Link 
                key={event.id}
                to={`/event/${getEventSlug(event)}`}
                className="flex items-center justify-between bg-surface-1/50 border border-border/50 p-3 hover:bg-surface-1 transition-all"
              >
                <div>
                  <h3 className="font-display text-sm text-muted-foreground">{event.title}</h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{event.league} • Final</p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground/50" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Competing Count */}
      <section className="px-4 py-3 border-t border-border text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {stats.totalCompeting} editors competing globally
        </p>
      </section>

      {/* No Events State */}
      {!loading && events.length === 0 && (
        <section className="px-4 py-12 text-center">
          <p className="text-muted-foreground">No events available yet</p>
          <p className="text-xs text-muted-foreground mt-2">Check back soon for competitions</p>
        </section>
      )}
    </div>
  );
}
