import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { RefreshCw, ChevronRight, Lock, ArrowLeft, Zap, Users, Trophy, Crown, Medal, Target, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealEvents, useRealRankings, useEventRankings, useActiveSession } from "@/hooks/useRealData";
import { useXPUserLeaderboard, useXPCrewLeaderboard } from "@/hooks/useXPLeaderboard";
import StatusBadge from "@/components/loopgate/StatusBadge";
import LevelBadge from "@/components/loopgate/LevelBadge";
import CrewBadge from "@/components/loopgate/CrewBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import loopgateLogo from "@/assets/loopgate-logo.png";
import SEO, { pageSEO } from "@/components/SEO";

type TabType = "index" | "xp" | "crews" | "events";

// Rank tier colors for visual hierarchy - AAA polish with shimmer
const getRankStyle = (rank: number) => {
  if (rank === 1) return {
    bg: "bg-gradient-to-r from-yellow-500/30 via-amber-400/20 to-yellow-500/30",
    border: "border-l-4 border-yellow-400",
    glow: "shadow-[0_0_20px_rgba(250,204,21,0.25),inset_0_1px_0_rgba(250,204,21,0.2)]",
    text: "text-yellow-400",
    icon: Crown,
    shimmer: true,
  };
  if (rank === 2) return {
    bg: "bg-gradient-to-r from-slate-400/20 via-gray-300/15 to-slate-400/20",
    border: "border-l-4 border-slate-300",
    glow: "shadow-[0_0_15px_rgba(203,213,225,0.2)]",
    text: "text-slate-300",
    icon: Medal,
    shimmer: true,
  };
  if (rank === 3) return {
    bg: "bg-gradient-to-r from-amber-700/25 via-orange-600/15 to-amber-700/25",
    border: "border-l-4 border-amber-600",
    glow: "shadow-[0_0_15px_rgba(217,119,6,0.2)]",
    text: "text-amber-500",
    icon: Medal,
    shimmer: true,
  };
  if (rank <= 10) return {
    bg: "bg-gradient-to-r from-gold/12 via-gold/6 to-gold/12",
    border: "border-l-2 border-gold/60",
    glow: "shadow-[0_0_10px_rgba(212,175,55,0.1)]",
    text: "text-gold",
    icon: null,
    shimmer: false,
  };
  return {
    bg: "bg-surface-1/70",
    border: "border-l-2 border-border/80",
    glow: "",
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
    { id: "crews", label: "CREWS", icon: Users },
    { id: "events", label: "EVENTS", icon: Trophy },
  ];

  // Keep session active
  useActiveSession();

  // Real data hooks
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
        {/* Cinematic Header */}
        <div className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.15),transparent_70%)]" />
          
          <header className="relative z-10 px-4 pt-4 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSelectedEventId(null)} className="p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </button>
              <StatusBadge status={selectedEvent.status} />
            </div>
            
            <h1 className="font-display text-3xl tracking-wide text-white mb-1">{selectedEvent.title}</h1>
            <p className="text-xs text-gold uppercase tracking-[0.3em]">
              {selectedEvent.league} League • Leaderboard
            </p>
          </header>

          {/* Live Pulse Bar */}
          {isLiveEvent && (
            <div className="relative px-4 pb-4">
              <div className="flex items-center gap-2 text-green-400">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Live Rankings</span>
                <RefreshCw size={12} className="animate-spin ml-auto opacity-50" style={{ animationDuration: "3s" }} />
              </div>
            </div>
          )}

          {isClosedEvent && (
            <div className="px-4 pb-4 flex items-center gap-2 text-muted-foreground">
              <Lock size={14} />
              <span className="text-xs uppercase tracking-widest">Final Results</span>
            </div>
          )}
        </div>

        {/* QOI Legend */}
        {isLiveEvent && (
          <div className="px-4 py-3 bg-surface-0/50 border-y border-border/50 flex items-center justify-center gap-6 text-[10px] uppercase tracking-[0.2em]">
            <span><span className="text-gold font-bold">Q</span> <span className="text-muted-foreground">Quality</span></span>
            <span><span className="text-gold font-bold">O</span> <span className="text-muted-foreground">Originality</span></span>
            <span><span className="text-gold font-bold">I</span> <span className="text-muted-foreground">Impact</span></span>
          </div>
        )}

        {/* Leaderboard */}
        <div className="px-4 py-6">
          {eventRankings.length === 0 && !eventRankingsLoading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-1 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No rankings yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Submissions are being reviewed</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventRankings.map((ranking, index) => {
                const displayRank = ranking.final_rank || index + 1;
                const style = getRankStyle(displayRank);
                const IconComponent = style.icon;
                
                return (
                  <motion.div
                    key={ranking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`relative ${style.bg} ${style.border} ${style.glow} backdrop-blur-sm p-4 flex items-center gap-4`}
                  >
                    {/* Rank */}
                    <div className="w-12 flex items-center justify-center">
                      {IconComponent ? (
                        <IconComponent className={`w-6 h-6 ${style.text}`} />
                      ) : (
                        <span className={`font-display text-2xl ${style.text}`}>{displayRank}</span>
                      )}
                    </div>
                    
                    {/* Username */}
                    <div className="flex-1">
                      <span className="font-semibold text-white">{ranking.profile?.username || 'Unknown'}</span>
                    </div>
                    
                    {/* Scores */}
                    {isLiveEvent ? (
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{ranking.quality_score || '—'}</span>
                          <span>{ranking.originality_score || '—'}</span>
                          <span>{ranking.impact_score || '—'}</span>
                        </div>
                        <div className="w-px h-6 bg-border" />
                        <span className="font-display text-2xl text-gold min-w-[50px] text-right">
                          {ranking.qoi_score?.toFixed(1) || '—'}
                        </span>
                      </div>
                    ) : (
                      <span className="font-display text-2xl text-gold">
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
      
      {/* Cinematic Hero Header - AAA Polish */}
      <div className="relative overflow-hidden">
        {/* Multi-layer gradient background - richer depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold/12 via-gold/4 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(212,175,55,0.18),transparent_55%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold/10 blur-[100px] rounded-full" />
        
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        
        {/* Decorative lines - more prominent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-gold/20" />
        <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-gold/20" />
        
        <header className="relative z-10 px-4 pt-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-gold" />
              </div>
              <span className="text-[10px] text-gold uppercase tracking-[0.4em] font-semibold">Global</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/80">Live</span>
            </div>
          </div>
          
          {/* Hero Title - Bolder */}
          <div className="text-center">
            <h1 className="font-display text-5xl sm:text-6xl tracking-wider text-white mb-2 drop-shadow-[0_0_30px_rgba(212,175,55,0.15)]">
              RANKINGS
            </h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.25em]">
              Where legends are made
            </p>
          </div>
        </header>

        {/* Tab Navigation - Glass Morphism AAA */}
        <div className="relative z-10 px-4 pb-5">
          <div className="flex gap-1 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 shadow-[0_0_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold tracking-wider transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-b from-gold via-gold to-gold/90 text-background shadow-[0_0_20px_rgba(212,175,55,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* INDEX Leaderboard */}
        {activeTab === "index" && (
          <motion.div
            key="index"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-4"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-gold" />
                <span className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-semibold">Skill Index</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Top 50</span>
            </div>
            
            {globalRankings.length === 0 && !rankingsLoading ? (
              <EmptyState icon={Target} message="No rankings yet" />
            ) : (
              <div className="space-y-2.5">
                {globalRankings.slice(0, 50).map((editor, index) => {
                  const rank = editor.rank || index + 1;
                  const style = getRankStyle(rank);
                  const IconComponent = style.icon;
                  const isTopThree = rank <= 3;
                  
                  return (
                    <motion.button
                      key={editor.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.015, duration: 0.3 }}
                      onClick={() => navigate(`/editor/${editor.id}`)}
                      className={`w-full relative overflow-hidden ${style.bg} ${style.border} ${style.glow} backdrop-blur-sm p-4 flex items-center gap-4 text-left hover:scale-[1.008] transition-transform duration-200 active:scale-[0.995]`}
                    >
                      {/* Shimmer effect for top 3 */}
                      {style.shimmer && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute -inset-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        </div>
                      )}
                      
                      {/* Top 3 glow accent */}
                      {isTopThree && (
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                      )}
                      
                      {/* Rank */}
                      <div className="w-10 flex items-center justify-center flex-shrink-0">
                        {IconComponent ? (
                          <IconComponent className={`w-6 h-6 ${style.text} ${isTopThree ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`} />
                        ) : (
                          <span className={`font-display text-xl ${style.text}`}>{rank}</span>
                        )}
                      </div>
                      
                      {/* Avatar */}
                      <Avatar className={`w-9 h-9 border-2 ${isTopThree ? 'border-gold/50' : 'border-border/80'}`}>
                        <AvatarImage src={editor.avatar_url || undefined} />
                        <AvatarFallback className="bg-surface-1 text-xs font-bold">
                          {editor.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold truncate ${isTopThree ? 'text-white' : 'text-foreground'}`}>{editor.username}</span>
                          {editor.verification_status && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-[8px] text-white font-bold">✓</span>
                            </div>
                          )}
                          <LevelBadge level={editor.level || 1} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <span className="uppercase tracking-wider">{editor.league}</span>
                          {editor.crew && (
                            <>
                              <span>•</span>
                              <CrewBadge crew={editor.crew} size="sm" />
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Score */}
                      <div className="text-right flex-shrink-0">
                        <span className={`font-display text-3xl ${isTopThree ? 'text-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'text-gold'}`}>
                          {editor.global_index_score?.toFixed(1) || '0.0'}
                        </span>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-semibold">Index</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* XP Leaderboard */}
        {activeTab === "xp" && (
          <motion.div
            key="xp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gold" />
                <span className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Experience Points</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Top Grinders</span>
            </div>
            
            {xpUsers.length === 0 && !xpLoading ? (
              <EmptyState icon={Zap} message="No XP rankings yet" />
            ) : (
              <div className="space-y-2">
                {xpUsers.map((user, index) => {
                  const rank = user.rank || index + 1;
                  const style = getRankStyle(rank);
                  const IconComponent = style.icon;
                  
                  return (
                    <motion.button
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => navigate(`/editor/${user.id}`)}
                      className={`w-full relative ${style.bg} ${style.border} ${style.glow} backdrop-blur-sm p-4 flex items-center gap-4 text-left hover:scale-[1.01] transition-transform`}
                    >
                      {/* Rank */}
                      <div className="w-10 flex items-center justify-center">
                        {IconComponent ? (
                          <IconComponent className={`w-5 h-5 ${style.text}`} />
                        ) : (
                          <span className={`font-display text-xl ${style.text}`}>{rank}</span>
                        )}
                      </div>
                      
                      {/* Avatar */}
                      <Avatar className="w-10 h-10 border-2 border-border">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-surface-1 text-xs">
                          {user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">{user.username}</span>
                          <LevelBadge level={user.level} size="sm" showAura />
                        </div>
                      </div>
                      
                      {/* XP */}
                      <div className="text-right">
                        <span className="font-display text-2xl text-white">
                          {user.xp.toLocaleString()}
                        </span>
                        <p className="text-[9px] text-gold uppercase tracking-wider">XP</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Crews Leaderboard */}
        {activeTab === "crews" && (
          <motion.div
            key="crews"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold" />
                <span className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Unit Rankings</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Combined XP</span>
            </div>
            
            {xpCrews.length === 0 && !crewsLoading ? (
              <EmptyState icon={Users} message="No crews yet" />
            ) : (
              <div className="space-y-2">
                {xpCrews.map((crew, index) => {
                  const rank = crew.rank || index + 1;
                  const style = getRankStyle(rank);
                  const IconComponent = style.icon;
                  
                  return (
                    <motion.button
                      key={crew.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => navigate(`/units/${crew.id}`)}
                      className={`w-full relative ${style.bg} ${style.border} ${style.glow} backdrop-blur-sm p-4 flex items-center gap-4 text-left hover:scale-[1.01] transition-transform`}
                    >
                      {/* Rank */}
                      <div className="w-10 flex items-center justify-center">
                        {IconComponent ? (
                          <IconComponent className={`w-5 h-5 ${style.text}`} />
                        ) : (
                          <span className={`font-display text-xl ${style.text}`}>{rank}</span>
                        )}
                      </div>
                      
                      {/* Crew Avatar */}
                      <Avatar className="w-10 h-10 border-2 border-gold/30">
                        <AvatarImage src={crew.avatar_url || undefined} />
                        <AvatarFallback className="bg-surface-1 text-lg">
                          {crew.emblem}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white truncate block">{crew.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{crew.member_count} editors</span>
                          <span>•</span>
                          <span className="text-gold">Lv {crew.crewLevel}</span>
                        </div>
                      </div>
                      
                      {/* Total XP */}
                      <div className="text-right">
                        <span className="font-display text-2xl text-white">
                          {crew.totalXP.toLocaleString()}
                        </span>
                        <p className="text-[9px] text-gold uppercase tracking-wider">Total XP</p>
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gold" />
                <span className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Event Leaderboards</span>
              </div>
            </div>
            
            {rankedEvents.length === 0 ? (
              <EmptyState icon={Trophy} message="No ranked events yet" />
            ) : (
              <div className="space-y-3">
                {rankedEvents.map((event, index) => (
                  <motion.button
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedEventId(event.id)}
                    className="w-full bg-surface-1/80 backdrop-blur-sm border border-border/50 hover:border-gold/30 p-4 text-left flex items-center gap-4 transition-all hover:scale-[1.01]"
                  >
                    {/* Poster */}
                    {event.poster_url ? (
                      <div
                        className="w-14 h-20 bg-cover bg-center flex-shrink-0 border border-border/50"
                        style={{ backgroundImage: `url(${event.poster_url})` }}
                      />
                    ) : (
                      <div className="w-14 h-20 bg-surface-0 flex-shrink-0 flex items-center justify-center border border-border/50">
                        <Trophy className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-xl text-white truncate">{event.title}</h3>
                        <StatusBadge status={event.status} small />
                      </div>
                      {event.subtitle && (
                        <p className="text-xs text-muted-foreground truncate mb-1">{event.subtitle}</p>
                      )}
                      <p className="text-[10px] text-gold uppercase tracking-[0.15em]">
                        {event.league} League
                      </p>
                    </div>
                    
                    <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
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

// Empty state component
function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-1 flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-medium">{message}</p>
    </div>
  );
}
