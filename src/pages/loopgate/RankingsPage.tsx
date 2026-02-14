import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronRight, Lock, ArrowLeft, Zap, Users, Trophy, Crown, Medal, Target, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealEvents, useRealRankings, useEventRankings, useActiveSession } from "@/hooks/useRealData";
import { useXPUserLeaderboard, useXPCrewLeaderboard } from "@/hooks/useXPLeaderboard";
import StatusBadge from "@/components/loopgate/StatusBadge";
import LevelBadge from "@/components/loopgate/LevelBadge";
import CrewBadge from "@/components/loopgate/CrewBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SEO, { pageSEO } from "@/components/SEO";

type TabType = "index" | "xp" | "crews" | "events";

const getRankStyle = (rank: number) => {
  if (rank === 1) return {
    bg: "bg-gradient-to-r from-gold/12 via-gold/5 to-gold/12",
    border: "border-l-2 border-gold/60",
    text: "text-gold",
    icon: Crown,
    shimmer: true,
  };
  if (rank === 2) return {
    bg: "bg-surface-1/50",
    border: "border-l-2 border-foreground/30",
    text: "text-foreground/70",
    icon: Medal,
    shimmer: false,
  };
  if (rank === 3) return {
    bg: "bg-surface-1/40",
    border: "border-l-2 border-foreground/20",
    text: "text-foreground/50",
    icon: Medal,
    shimmer: false,
  };
  if (rank <= 10) return {
    bg: "bg-surface-1/30",
    border: "border-l border-border/50",
    text: "text-muted-foreground",
    icon: null,
    shimmer: false,
  };
  return {
    bg: "",
    border: "border-l border-border/20",
    text: "text-muted-foreground",
    icon: null,
    shimmer: false,
  };
};

export default function RankingsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventIdFromUrl = searchParams.get("event");
  
  const [activeTab, setActiveTab] = useState<TabType>("index");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventIdFromUrl);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "index", label: "INDEX", icon: Target },
    { id: "xp", label: "XP", icon: Zap },
    { id: "crews", label: "UNITS", icon: Users },
    { id: "events", label: "EVENTS", icon: Trophy },
  ];

  useActiveSession();

  const { events, loading: eventsLoading } = useRealEvents();
  const { rankings: globalRankings, loading: rankingsLoading } = useRealRankings();
  const { rankings: eventRankings, loading: eventRankingsLoading } = useEventRankings(selectedEventId);
  const { users: xpUsers, loading: xpLoading } = useXPUserLeaderboard(50);
  const { crews: xpCrews, loading: crewsLoading } = useXPCrewLeaderboard(20);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const isLiveEvent = selectedEvent?.status === "live";
  const isClosedEvent = selectedEvent?.status === "closed";
  const rankedEvents = events.filter((e) => e.status === "live" || e.status === "closed");

  // Event-specific leaderboard view
  if (selectedEvent) {
    return (
      <div className="min-h-screen pb-24 bg-background">
        <header className="px-4 pt-3 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setSelectedEventId(null)} className="p-1.5 -ml-1 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft size={18} className="text-foreground" />
            </button>
            <StatusBadge status={selectedEvent.status} />
          </div>
          
          <h1 className="font-display text-2xl tracking-wide text-foreground mb-0.5">{selectedEvent.title}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            {selectedEvent.league} League • Leaderboard
          </p>
        </header>

        {isLiveEvent && (
          <div className="px-4 py-2 flex items-center gap-2">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Live Rankings</span>
          </div>
        )}

        {isClosedEvent && (
          <div className="px-4 py-2 flex items-center gap-2 text-muted-foreground">
            <Lock size={12} />
            <span className="text-[10px] uppercase tracking-widest">Final Results</span>
          </div>
        )}

        {isLiveEvent && (
          <div className="px-4 py-2 bg-surface-0/40 border-y border-border/30 flex items-center justify-center gap-5 text-[9px] uppercase tracking-[0.2em]">
            <span><span className="text-foreground font-bold">Q</span> <span className="text-muted-foreground">Quality</span></span>
            <span><span className="text-foreground font-bold">O</span> <span className="text-muted-foreground">Originality</span></span>
            <span><span className="text-foreground font-bold">I</span> <span className="text-muted-foreground">Impact</span></span>
          </div>
        )}

        <div className="px-3 py-3">
          {eventRankings.length === 0 && !eventRankingsLoading ? (
            <EmptyState icon={Trophy} message="No rankings yet" sub="Submissions are being reviewed" />
          ) : (
            <div className="space-y-1">
              {eventRankings.map((ranking, index) => {
                const displayRank = ranking.final_rank || index + 1;
                const style = getRankStyle(displayRank);
                const IconComponent = style.icon;
                
                return (
                  <motion.div
                    key={ranking.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.025 }}
                    className={`${style.bg} ${style.border} p-3 flex items-center gap-3 rounded-md`}
                  >
                    <div className="w-7 flex items-center justify-center">
                      {IconComponent ? (
                        <IconComponent className={`w-4.5 h-4.5 ${style.text}`} />
                      ) : (
                        <span className={`font-display text-base ${style.text} tabular-nums`}>{displayRank}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-foreground truncate block">{ranking.profile?.username || 'Unknown'}</span>
                    </div>
                    
                    {isLiveEvent ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5 text-[10px] text-muted-foreground tabular-nums">
                          <span>{ranking.quality_score || '—'}</span>
                          <span>{ranking.originality_score || '—'}</span>
                          <span>{ranking.impact_score || '—'}</span>
                        </div>
                        <div className="w-px h-5 bg-border/40" />
                        <span className="font-display text-xl text-foreground min-w-[44px] text-right tabular-nums">
                          {ranking.qoi_score?.toFixed(1) || '—'}
                        </span>
                      </div>
                    ) : (
                      <span className="font-display text-xl text-foreground tabular-nums">
                        {ranking.qoi_score?.toFixed(1) || '—'}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Rankings View
  return (
    <div className="min-h-screen pb-24 bg-background">
      <SEO {...pageSEO.rankings} />
      
      {/* Header — clean, no gold glow */}
      <header className="px-4 pt-4 pb-3 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-foreground" />
            <span className="text-[9px] text-muted-foreground uppercase tracking-[0.35em] font-semibold">Global Leaderboard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping opacity-75" />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-red-400/80">Live</span>
          </div>
        </div>
        
        <h1 className="font-display text-4xl tracking-wider text-foreground leading-none">
          RANKINGS
        </h1>
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] mt-1">
          Top editors worldwide
        </p>
      </header>

      {/* Tab Nav — white active, no gold */}
      <div className="px-3 py-3">
        <div className="flex bg-surface-0/60 border border-border/40 rounded-lg p-1 gap-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold tracking-wider rounded-md transition-all duration-150 ${
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* INDEX Tab */}
        {activeTab === "index" && (
          <motion.div
            key="index"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">Skill Index</span>
              <span className="text-[10px] text-muted-foreground/50">Top 50</span>
            </div>
            
            {globalRankings.length === 0 && !rankingsLoading ? (
              <EmptyState icon={Target} message="No rankings yet" />
            ) : (
              <div className="space-y-1">
                {globalRankings.slice(0, 50).map((editor, index) => {
                  const rank = editor.rank || index + 1;
                  const style = getRankStyle(rank);
                  const IconComponent = style.icon;
                  const isFirst = rank === 1;
                  
                  return (
                    <motion.button
                      key={editor.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.012, duration: 0.25 }}
                      onClick={() => navigate(`/editor/${editor.id}`)}
                      className={`w-full relative overflow-hidden ${style.bg} ${style.border} p-3 flex items-center gap-3 text-left rounded-md active:scale-[0.995] transition-transform duration-100`}
                    >
                      {style.shimmer && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute -inset-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        </div>
                      )}
                      
                      <div className="w-7 flex items-center justify-center flex-shrink-0">
                        {IconComponent ? (
                          <IconComponent className={`w-4.5 h-4.5 ${style.text}`} />
                        ) : (
                          <span className={`font-display text-base ${style.text} tabular-nums`}>{rank}</span>
                        )}
                      </div>
                      
                      <Avatar className={`w-8 h-8 border ${isFirst ? 'border-gold/40' : 'border-border/60'}`}>
                        <AvatarImage src={editor.avatar_url || undefined} />
                        <AvatarFallback className="bg-surface-1 text-[10px] font-bold">
                          {editor.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm truncate text-foreground">{editor.username}</span>
                          {editor.verification_status && (
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-[7px] text-white font-bold">✓</span>
                            </div>
                          )}
                          <LevelBadge level={editor.level || 1} size="sm" />
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="uppercase tracking-wider">{editor.league}</span>
                          {editor.crew && (
                            <>
                              <span className="text-border">•</span>
                              <CrewBadge crew={editor.crew} size="sm" />
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <span className={`font-display text-xl tabular-nums ${isFirst ? 'text-gold' : 'text-foreground'}`}>
                          {editor.global_index_score?.toFixed(1) || '0.0'}
                        </span>
                        <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wider font-semibold">Index</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* XP Tab */}
        {activeTab === "xp" && (
          <motion.div
            key="xp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">Experience Points</span>
              <span className="text-[10px] text-muted-foreground/50">Top Grinders</span>
            </div>
            
            {xpUsers.length === 0 && !xpLoading ? (
              <EmptyState icon={Zap} message="No XP rankings yet" />
            ) : (
              <div className="space-y-1">
                {xpUsers.map((user, index) => {
                  const rank = user.rank || index + 1;
                  const style = getRankStyle(rank);
                  const IconComponent = style.icon;
                  const isFirst = rank === 1;
                  
                  return (
                    <motion.button
                      key={user.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.015 }}
                      onClick={() => navigate(`/editor/${user.id}`)}
                      className={`w-full relative ${style.bg} ${style.border} p-3 flex items-center gap-3 text-left rounded-md active:scale-[0.995] transition-transform duration-100`}
                    >
                      {style.shimmer && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute -inset-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        </div>
                      )}
                      
                      <div className="w-7 flex items-center justify-center">
                        {IconComponent ? (
                          <IconComponent className={`w-4.5 h-4.5 ${style.text}`} />
                        ) : (
                          <span className={`font-display text-base ${style.text} tabular-nums`}>{rank}</span>
                        )}
                      </div>
                      
                      <Avatar className={`w-8 h-8 border ${isFirst ? 'border-gold/40' : 'border-border/60'}`}>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-surface-1 text-[10px]">
                          {user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground truncate">{user.username}</span>
                          <LevelBadge level={user.level} size="sm" showAura />
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="font-display text-xl text-foreground tabular-nums">
                          {user.xp.toLocaleString()}
                        </span>
                        <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wider font-semibold">XP</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Units Tab */}
        {activeTab === "crews" && (
          <motion.div
            key="crews"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">Unit Rankings</span>
              <span className="text-[10px] text-muted-foreground/50">Combined XP</span>
            </div>
            
            {xpCrews.length === 0 && !crewsLoading ? (
              <EmptyState icon={Users} message="No units ranked yet" />
            ) : (
              <div className="space-y-1">
                {xpCrews.map((crew, index) => {
                  const rank = crew.rank || index + 1;
                  const style = getRankStyle(rank);
                  const IconComponent = style.icon;
                  const isFirst = rank === 1;
                  
                  return (
                    <motion.button
                      key={crew.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.015 }}
                      onClick={() => navigate(`/units/${crew.id}`)}
                      className={`w-full relative ${style.bg} ${style.border} p-3 flex items-center gap-3 text-left rounded-md active:scale-[0.995] transition-transform duration-100`}
                    >
                      {style.shimmer && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute -inset-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        </div>
                      )}
                      
                      <div className="w-7 flex items-center justify-center">
                        {IconComponent ? (
                          <IconComponent className={`w-4.5 h-4.5 ${style.text}`} />
                        ) : (
                          <span className={`font-display text-base ${style.text} tabular-nums`}>{rank}</span>
                        )}
                      </div>
                      
                      <Avatar className={`w-8 h-8 border ${isFirst ? 'border-gold/40' : 'border-border/60'}`}>
                        <AvatarImage src={crew.avatar_url || undefined} />
                        <AvatarFallback className="bg-surface-1 text-sm">
                          {crew.emblem}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate block">{crew.name}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>{crew.member_count} editors</span>
                          <span className="text-border">•</span>
                          <span>Lv {crew.crewLevel}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="font-display text-xl text-foreground tabular-nums">
                          {crew.totalXP.toLocaleString()}
                        </span>
                        <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wider font-semibold">XP</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">Event Leaderboards</span>
            </div>
            
            {rankedEvents.length === 0 ? (
              <EmptyState icon={Trophy} message="No ranked events yet" />
            ) : (
              <div className="space-y-1.5">
                {rankedEvents.map((event, index) => (
                  <motion.button
                    key={event.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => setSelectedEventId(event.id)}
                    className="w-full bg-surface-1/40 border border-border/30 hover:border-foreground/20 p-3 text-left flex items-center gap-3 rounded-md transition-all active:scale-[0.995] duration-100"
                  >
                    {event.poster_url ? (
                      <div
                        className="w-11 h-16 bg-cover bg-center flex-shrink-0 rounded-sm border border-border/30"
                        style={{ backgroundImage: `url(${event.poster_url})` }}
                      />
                    ) : (
                      <div className="w-11 h-16 bg-surface-0 flex-shrink-0 flex items-center justify-center rounded-sm border border-border/30">
                        <Trophy className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-display text-base text-foreground truncate">{event.title}</h3>
                        <StatusBadge status={event.status} small />
                      </div>
                      {event.subtitle && (
                        <p className="text-[10px] text-muted-foreground truncate mb-0.5">{event.subtitle}</p>
                      )}
                      <p className="text-[9px] text-muted-foreground/70 uppercase tracking-[0.15em] font-semibold">
                        {event.league} League
                      </p>
                    </div>
                    
                    <ChevronRight size={16} className="text-muted-foreground/40 flex-shrink-0" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ icon: Icon, message, sub }: { icon: React.ElementType; message: string; sub?: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-1/40 flex items-center justify-center">
        <Icon className="w-6 h-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
      {sub && <p className="text-[10px] text-muted-foreground/50 mt-0.5">{sub}</p>}
    </div>
  );
}
