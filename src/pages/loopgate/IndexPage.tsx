import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Loader2, Gavel, Crown, Lock, ChevronRight, Users, Target, Medal, Zap, Trophy, RefreshCw, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealRankings, useRealEvents, useEventRankings, useActiveSession } from "@/hooks/useRealData";
import { useXPUserLeaderboard, useXPCrewLeaderboard } from "@/hooks/useXPLeaderboard";
import { useAuth } from "@/hooks/useAuth";
import SEO, { pageSEO } from "@/components/SEO";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import AuthorityBadge from "@/components/loopgate/AuthorityBadge";
import FoundingBadge from "@/components/loopgate/FoundingBadge";
import CrewBadge from "@/components/loopgate/CrewBadge";
import LevelBadge from "@/components/loopgate/LevelBadge";
import StatusBadge from "@/components/loopgate/StatusBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getRankFromScore, GQTRank } from "@/data/gqtConfig";
import { supabase } from "@/integrations/supabase/client";

type LeagueFilter = "all" | "open" | "pro" | "elite";
type RankFilter = "all" | "top10" | "top50" | "top100";
type ViewMode = "editors" | "crews" | "rankings" | "judges";
type RankingSubTab = "xp" | "crews" | "events";

interface JudgeEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  verification_status: boolean | null;
  totalReviews: number;
  isTrial: boolean;
}

const leagueOrder = { elite: 0, pro: 1, open: 2 };

// Get class letter from GQT score or level
function getClassLetter(bestGQT: number | null | undefined, level: number | undefined): GQTRank {
  if (bestGQT && bestGQT > 0) {
    return getRankFromScore(bestGQT).rank;
  }
  if ((level || 1) >= 2) return 'D';
  return 'F';
}

// Get authority role for display
function getAuthorityRole(roles?: string[]): 'dev' | 'judge' | 'enterprise' | null {
  if (!roles) return null;
  if (roles.includes('dev')) return 'dev';
  if (roles.includes('judge')) return 'judge';
  if (roles.includes('enterprise')) return 'enterprise';
  return null;
}

// Get class colors - refined AAA styling with filled backgrounds
function getClassColors(classLetter: GQTRank, hasTakenGQT: boolean): string {
  const colors: Record<string, string> = {
    'S++': 'text-background bg-gradient-to-r from-gold via-amber-400 to-gold border-gold/50 font-black',
    'S+': 'text-background bg-gold border-gold/50 font-black',
    'S': 'text-background bg-amber-500 border-amber-400/50 font-bold',
    'A': 'text-background bg-emerald-500 border-emerald-400/50 font-bold',
    'B': 'text-background bg-blue-500 border-blue-400/50 font-bold',
    'C': 'text-background bg-slate-500 border-slate-400/50 font-bold',
    'D': 'text-background bg-orange-500 border-orange-400/50 font-bold',
    'F': hasTakenGQT 
      ? 'text-background bg-red-600 border-red-500/50 font-bold' 
      : 'text-muted-foreground bg-surface-2 border-border font-medium',
  };
  return colors[classLetter] || colors['F'];
}

// Rank tier styles for visual hierarchy - AAA polish
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
    bg: "bg-gradient-to-r from-slate-400/20 via-gray-300/12 to-slate-400/20",
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


export default function IndexPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("all");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("editors");
  const [rankingSubTab, setRankingSubTab] = useState<RankingSubTab>("xp");
  const eventIdFromUrl = searchParams.get("event");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventIdFromUrl);

  // Keep session active
  useActiveSession();

  const { rankings, loading, error } = useRealRankings();
  const { events, loading: eventsLoading } = useRealEvents();
  const { rankings: eventRankings, loading: eventRankingsLoading } = useEventRankings(selectedEventId);
  const { users: xpUsers, loading: xpLoading } = useXPUserLeaderboard(50);
  const { crews: xpCrews, loading: crewsLoading } = useXPCrewLeaderboard(20);

  const userLeague = profile?.league || "open";
  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const isLiveEvent = selectedEvent?.status === "live";
  const isClosedEvent = selectedEvent?.status === "closed";
  const rankedEvents = events.filter((e) => e.status === "live" || e.status === "closed");

  // Fetch judges
  const [judges, setJudges] = useState<JudgeEntry[]>([]);
  const [judgesLoading, setJudgesLoading] = useState(false);

  useEffect(() => {
    if (viewMode === "judges") {
      fetchJudges();
    }
  }, [viewMode]);

  async function fetchJudges() {
    setJudgesLoading(true);
    try {
      // Fetch both full judges and trial judges
      const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['judge', 'trial_judge']);

      if (!judgeRoles?.length) {
        setJudges([]);
        setJudgesLoading(false);
        return;
      }

      const judgeIds = judgeRoles.map(r => r.user_id);
      const trialJudgeIds = new Set(judgeRoles.filter(r => r.role === 'trial_judge').map(r => r.user_id));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, level, xp, verification_status')
        .in('id', judgeIds);

      if (!profiles) {
        setJudges([]);
        setJudgesLoading(false);
        return;
      }

      const { data: reviews } = await supabase
        .from('review_requests')
        .select('judge_id')
        .eq('status', 'reviewed')
        .in('judge_id', judgeIds);

      const entries: JudgeEntry[] = profiles.map(profile => {
        const judgeReviews = reviews?.filter(r => r.judge_id === profile.id) || [];
        const isTrial = trialJudgeIds.has(profile.id) && !judgeRoles.some(r => r.user_id === profile.id && r.role === 'judge');
        return {
          ...profile,
          totalReviews: judgeReviews.length,
          isTrial,
        };
      });

      // Sort: full judges first (by reviews), then trial judges
      entries.sort((a, b) => {
        if (a.isTrial !== b.isTrial) return a.isTrial ? 1 : -1;
        return b.totalReviews - a.totalReviews;
      });
      setJudges(entries);
    } catch (error) {
      console.error('Error fetching judges:', error);
    } finally {
      setJudgesLoading(false);
    }
  }

  // Check if any filters are active (affects whether we show ranked or randomized)
  const hasActiveFilters = searchQuery !== "" || leagueFilter !== "all" || rankFilter !== "all";

  // Seeded random shuffle - consistent per session but randomized between sessions
  const shuffledRankings = useMemo(() => {
    if (hasActiveFilters) return rankings; // Don't shuffle when filtering
    
    // Create a shuffled copy using Fisher-Yates
    const shuffled = [...rankings];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [rankings, hasActiveFilters]);

  const filteredEditors = useMemo(() => {
    const source = hasActiveFilters ? rankings : shuffledRankings;
    
    return source.filter((editor) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesUsername = editor.username.toLowerCase().includes(query);
        const matchesDisplayName = editor.display_name?.toLowerCase().includes(query);
        if (!matchesUsername && !matchesDisplayName) {
          return false;
        }
      }
      if (leagueFilter !== "all" && editor.league !== leagueFilter) {
        return false;
      }
      const rank = editor.rank || 999;
      if (rankFilter === "top10" && rank > 10) return false;
      if (rankFilter === "top50" && rank > 50) return false;
      if (rankFilter === "top100" && rank > 100) return false;
      return true;
    });
  }, [rankings, shuffledRankings, searchQuery, leagueFilter, rankFilter, hasActiveFilters]);

  const tabs: { id: ViewMode; label: string; icon: React.ElementType; navigateTo?: string }[] = [
    { id: "editors", label: "INDEX", icon: Target },
    { id: "crews", label: "CREWS", icon: Users, navigateTo: "/crews" },
    { id: "rankings", label: "RANKINGS", icon: Trophy },
    { id: "judges", label: "JUDGES", icon: Gavel },
  ];

  const rankingSubTabs: { id: RankingSubTab; label: string; icon: React.ElementType }[] = [
    { id: "xp", label: "XP", icon: Zap },
    { id: "crews", label: "CREWS", icon: Users },
    { id: "events", label: "EVENTS", icon: Trophy },
  ];

  // Crews tab handler - navigate to crews page
  const handleCrewsTab = () => navigate("/crews");

  // Event-specific leaderboard view within rankings
  if (viewMode === "rankings" && selectedEvent) {
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO {...pageSEO.index} />
      
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
                <Search className="w-4 h-4 text-gold" />
              </div>
              <span className="text-[10px] text-gold uppercase tracking-[0.4em] font-semibold">Discover</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-gold" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-gold animate-ping opacity-75" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-gold/80">Live</span>
            </div>
          </div>
          
          {/* Hero Title - Bolder */}
          <div className="text-center">
            <h1 className="font-display text-5xl sm:text-6xl tracking-wider text-white mb-2 drop-shadow-[0_0_30px_rgba(212,175,55,0.15)]">
              EDITOR INDEX
            </h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.25em]">
              Scout • Search • Connect
            </p>
          </div>
        </header>

        {/* Tab Navigation - Glass Morphism AAA */}
        <div className="relative z-10 px-4 pb-5">
          <div className="flex gap-1 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 shadow-[0_0_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
            {tabs.map((tab) => {
              const isActive = viewMode === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.navigateTo) {
                      navigate(tab.navigateTo);
                    } else {
                      setViewMode(tab.id);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold tracking-wider transition-all duration-200 ${
                    isActive && !tab.navigateTo
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

      <AnimatePresence mode="wait">
        {/* Editors View */}
        {viewMode === "editors" && (
          <motion.div
            key="editors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Search - Enhanced */}
            <div className="px-4 py-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors" />
                <input
                  type="text"
                  placeholder="Search editors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-0/60 backdrop-blur-sm border border-border/60 pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-gold/50 focus:bg-surface-0/80 transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Filters - Premium Pill Style */}
            <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
              <div className="relative">
                <select
                  value={leagueFilter}
                  onChange={(e) => setLeagueFilter(e.target.value as LeagueFilter)}
                  className="bg-surface-0/80 backdrop-blur-sm border border-border/60 px-5 py-2.5 pr-8 text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer focus:outline-none focus:border-gold/50 hover:border-gold/30 transition-colors"
                >
                  <option value="all">All Leagues</option>
                  <option value="elite">Elite</option>
                  <option value="pro">Pro</option>
                  <option value="open">Open</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground rotate-90 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value as RankFilter)}
                  className="bg-surface-0/80 backdrop-blur-sm border border-border/60 px-5 py-2.5 pr-8 text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer focus:outline-none focus:border-gold/50 hover:border-gold/30 transition-colors"
                >
                  <option value="all">All Ranks</option>
                  <option value="top10">Top 10</option>
                  <option value="top50">Top 50</option>
                  <option value="top100">Top 100</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground rotate-90 pointer-events-none" />
              </div>
            </div>

            {/* Results Header - Enhanced */}
            <div className="px-4 py-3.5 border-t border-b border-border/40 flex items-center justify-between bg-gradient-to-r from-surface-0/40 via-surface-0/60 to-surface-0/40">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-gold" />
                </div>
                <span className="font-display text-xl text-white">
                  {filteredEditors.length} <span className="text-muted-foreground text-base">Editors</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-3 h-3 text-gold/60" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
                  Global Index
                </span>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <Loader2 className="w-8 h-8 animate-spin text-gold" />
                  <div className="absolute inset-0 w-8 h-8 rounded-full bg-gold/20 blur-lg animate-pulse" />
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Loading rankings...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="px-4 py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                  <span className="text-2xl">⚠</span>
                </div>
                <p className="text-sm text-destructive font-medium">Failed to load rankings</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredEditors.length === 0 && (
              <div className="px-4 py-20 text-center">
                <div className="w-20 h-20 mx-auto mb-5 bg-surface-1 border border-border/50 flex items-center justify-center">
                  <Search className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <p className="font-display text-2xl text-muted-foreground mb-2">No editors found</p>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                  {rankings.length === 0 
                    ? "Be the first to compete and claim your rank" 
                    : "Try adjusting your filters"}
                </p>
              </div>
            )}

            {/* Editor Cards - AAA Polish */}
            {!loading && !error && filteredEditors.length > 0 && (
              <div className="px-4 py-3 space-y-2.5">
                {filteredEditors.map((editor, index) => {
                  const rank = editor.rank || 999;
                  const style = getRankStyle(rank);
                  const IconComponent = style.icon;
                  const classLetter = getClassLetter(editor.best_gatekeeper_qoi, editor.level);
                  const hasTakenGQT = !!(editor.best_gatekeeper_qoi && editor.best_gatekeeper_qoi > 0);
                  const classColorStyle = getClassColors(classLetter, hasTakenGQT);
                  const authorityRole = getAuthorityRole(editor.roles);
                  const isTopThree = rank <= 3;
                  
                  return (
                    <motion.button
                      key={editor.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.012, duration: 0.3 }}
                      onClick={() => navigate(`/editor/${editor.id}`)}
                      className={`w-full relative overflow-hidden ${style.bg} ${style.border} ${style.glow} backdrop-blur-sm p-4 flex items-center gap-3 text-left hover:scale-[1.008] transition-transform duration-200 active:scale-[0.995]`}
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
                      
                      {/* Avatar - enhanced border for top ranks */}
                      <Avatar className={`w-11 h-11 border-2 ${isTopThree ? 'border-gold/50' : 'border-border/80'}`}>
                        <AvatarImage src={editor.avatar_url || undefined} />
                        <AvatarFallback className="bg-surface-1 text-xs font-bold">
                          {editor.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Rank */}
                      <div className="w-12 text-center flex-shrink-0">
                        {IconComponent ? (
                          <div className="relative">
                            <IconComponent className={`w-6 h-6 mx-auto ${style.text} ${isTopThree ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`} />
                          </div>
                        ) : (
                          <span className={`font-display text-2xl ${style.text}`}>{rank}</span>
                        )}
                        <p className="text-[7px] text-muted-foreground uppercase tracking-wider mt-0.5">Rank</p>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <h3 className={`font-semibold text-sm truncate ${isTopThree ? 'text-white' : 'text-foreground'}`}>
                            {editor.display_name || editor.username}
                          </h3>
                          {editor.verification_status && <VerifiedBadge size="sm" />}
                          {authorityRole && <AuthorityBadge role={authorityRole} size="sm" />}
                          {editor.is_founding_member && <FoundingBadge size="sm" animate={false} />}
                          <span className={`text-[8px] font-bold uppercase tracking-wider border px-1.5 py-0.5 ${classColorStyle}`}>
                            {classLetter}
                          </span>
                        </div>
                        {editor.display_name && (
                          <p className="text-[10px] text-muted-foreground mb-1">@{editor.username}</p>
                        )}
                        <div className="flex items-center gap-2.5 text-[9px] text-muted-foreground uppercase tracking-wider flex-wrap">
                          <span className="flex items-center gap-1">
                            <span className="text-foreground/70">{editor.win_rate?.toFixed(0) || 0}%</span> Win
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-foreground/70">{editor.total_events || 0}</span> Events
                          </span>
                          {editor.crew && <CrewBadge crew={editor.crew} size="sm" />}
                        </div>
                      </div>

                      {/* Level & Index - Enhanced */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-center">
                          <p className="font-display text-lg text-foreground/80">
                            {editor.level || 1}
                          </p>
                          <p className="text-[7px] text-muted-foreground uppercase tracking-wider">LVL</p>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-display text-2xl ${isTopThree ? 'text-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'text-gold'}`}>
                            {(editor.global_index_score || 0).toFixed(1)}
                          </p>
                          <p className="text-[7px] text-muted-foreground uppercase tracking-wider">Index</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Judges View */}
        {viewMode === "judges" && (
          <motion.div
            key="judges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-5 space-y-3"
          >
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/30">
              <div className="w-8 h-8 bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Gavel className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Gate Judges</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Contributors • QOI Judges
                </p>
              </div>
            </div>
            
            {judgesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Loading judges...</span>
              </div>
            ) : judges.length === 0 ? (
              <EmptyState icon={Gavel} message="No judges found" />
            ) : (
              <div className="space-y-2">
                {judges.map((judge, index) => (
                  <motion.button
                    key={judge.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/editor/${judge.id}`)}
                    className={`w-full p-4 border backdrop-blur-sm flex items-center gap-4 transition-all duration-200 text-left ${
                      judge.isTrial 
                        ? 'bg-surface-0/40 border-border/30 opacity-70 hover:opacity-100' 
                        : 'bg-surface-0/60 border-border/50 hover:border-gold/40 hover:bg-surface-1/60 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)]'
                    }`}
                  >
                    <Avatar className={`w-12 h-12 border-2 ${judge.isTrial ? 'border-muted/30' : 'border-gold/30'}`}>
                      <AvatarImage src={judge.avatar_url || undefined} />
                      <AvatarFallback className={`${judge.isTrial ? 'bg-muted/10 text-muted-foreground' : 'bg-gold/10 text-gold'} font-bold`}>
                        {judge.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-base tracking-wide text-foreground truncate">
                          {judge.display_name || judge.username}
                        </h3>
                        {judge.verification_status && <VerifiedBadge size="sm" />}
                        {judge.isTrial ? (
                          <span className="text-[8px] px-1.5 py-0.5 bg-muted/20 border border-muted/30 text-muted-foreground uppercase tracking-wider">Trial</span>
                        ) : (
                          <AuthorityBadge role="judge" size="sm" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-wider">
                        <span>@{judge.username}</span>
                        {!judge.isTrial && <span className="text-gold">{judge.totalReviews} reviews</span>}
                        {judge.isTrial && <span className="text-muted-foreground/60">Pending approval</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <LevelBadge level={judge.level || 1} size="sm" />
                      <ChevronRight className={`w-5 h-5 ${judge.isTrial ? 'text-muted-foreground/40' : 'text-gold/60'}`} />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
            
            <div className="pt-8 text-center">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
                Request reviews from our elite judges
              </p>
            </div>
          </motion.div>
        )}

        {/* Rankings View */}
        {viewMode === "rankings" && (
          <motion.div
            key="rankings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-4"
          >
            {/* Sub-tab Navigation */}
            <div className="flex gap-1 bg-surface-0/60 border border-border/40 p-1 mb-5">
              {rankingSubTabs.map((tab) => {
                const isActive = rankingSubTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setRankingSubTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold tracking-wider transition-all duration-200 ${
                      isActive
                        ? "bg-gold text-background"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* XP Leaderboard */}
            {rankingSubTab === "xp" && (
              <>
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
                          <div className="w-10 flex items-center justify-center">
                            {IconComponent ? (
                              <IconComponent className={`w-5 h-5 ${style.text}`} />
                            ) : (
                              <span className={`font-display text-xl ${style.text}`}>{rank}</span>
                            )}
                          </div>
                          
                          <Avatar className="w-10 h-10 border-2 border-border">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-surface-1 text-xs">
                              {user.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white truncate">{user.username}</span>
                              <LevelBadge level={user.level} size="sm" showAura />
                            </div>
                          </div>
                          
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
              </>
            )}

            {/* Crews Leaderboard */}
            {rankingSubTab === "crews" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gold" />
                    <span className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Crew Rankings</span>
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
                          onClick={() => navigate(`/crews/${crew.id}`)}
                          className={`w-full relative ${style.bg} ${style.border} ${style.glow} backdrop-blur-sm p-4 flex items-center gap-4 text-left hover:scale-[1.01] transition-transform`}
                        >
                          <div className="w-10 flex items-center justify-center">
                            {IconComponent ? (
                              <IconComponent className={`w-5 h-5 ${style.text}`} />
                            ) : (
                              <span className={`font-display text-xl ${style.text}`}>{rank}</span>
                            )}
                          </div>
                          
                          <Avatar className="w-10 h-10 border-2 border-gold/30">
                            <AvatarImage src={crew.avatar_url || undefined} />
                            <AvatarFallback className="bg-surface-1 text-lg">
                              {crew.emblem}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-white truncate block">{crew.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{crew.member_count} members</span>
                              <span>•</span>
                              <span className="text-gold">Lv {crew.crewLevel}</span>
                            </div>
                          </div>
                          
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
              </>
            )}

            {/* Events Leaderboard */}
            {rankingSubTab === "events" && (
              <>
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
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer - Enhanced */}
      <div className="p-5 text-center mt-4 border-t border-border/20">
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.25em]">
          {viewMode === "editors" ? "Real-time verified rankings" : 
           viewMode === "judges" ? "Elite reviewers • Request feedback" :
           viewMode === "rankings" ? "Where legends are made" :
           "Performance-based progression"}
        </p>
      </div>
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
