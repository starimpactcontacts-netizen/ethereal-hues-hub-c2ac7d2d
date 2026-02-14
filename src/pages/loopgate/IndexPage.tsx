import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Loader2, Gavel, Crown, Lock, ChevronRight, Users, Target, Medal, Zap, Trophy, RefreshCw, ArrowLeft, Plus, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealRankings, useRealEvents, useEventRankings, useActiveSession } from "@/hooks/useRealData";
import { useXPUserLeaderboard, useXPCrewLeaderboard } from "@/hooks/useXPLeaderboard";
import { useAuth } from "@/hooks/useAuth";
import { useBatchPinnedEdits } from "@/hooks/usePinnedEdits";
import SEO, { pageSEO } from "@/components/SEO";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import JudgeDivisionBadge from "@/components/loopgate/JudgeDivisionBadge";
import AuthorityBadge from "@/components/loopgate/AuthorityBadge";
import FoundingBadge from "@/components/loopgate/FoundingBadge";
import CrewBadge from "@/components/loopgate/CrewBadge";
import LevelBadge from "@/components/loopgate/LevelBadge";
import StatusBadge from "@/components/loopgate/StatusBadge";
import ConnectButton from "@/components/loopgate/ConnectButton";
import ThumbnailImage from "@/components/loopgate/ThumbnailImage";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getRankFromScore, GQTRank } from "@/data/gqtConfig";
import { supabase } from "@/integrations/supabase/client";
import GatePattern from "@/components/loopgate/GatePattern";

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
  judge_xp: number;
  judge_review_count: number;
  judge_bio: string | null;
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

// Rank tier styles — clean, minimal, no heavy gradients
const getRankStyle = (rank: number) => {
  if (rank === 1) return {
    bg: "bg-gold/8",
    border: "border-l-2 border-gold",
    glow: "",
    text: "text-gold",
    icon: Crown,
    shimmer: false,
  };
  if (rank === 2) return {
    bg: "bg-surface-1/40",
    border: "border-l-2 border-foreground/30",
    glow: "",
    text: "text-foreground/70",
    icon: Medal,
    shimmer: false,
  };
  if (rank === 3) return {
    bg: "bg-surface-1/30",
    border: "border-l-2 border-foreground/20",
    glow: "",
    text: "text-foreground/50",
    icon: Medal,
    shimmer: false,
  };
  if (rank <= 10) return {
    bg: "bg-surface-1/20",
    border: "border-l border-border/50",
    glow: "",
    text: "text-muted-foreground",
    icon: null,
    shimmer: false,
  };
  return {
    bg: "",
    border: "border-l border-border/20",
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
  const [shuffleKey, setShuffleKey] = useState(0); // Trigger reshuffle
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
        .select('id, username, display_name, avatar_url, level, xp, verification_status, judge_xp, judge_review_count, judge_bio')
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
          judge_xp: profile.judge_xp || 0,
          judge_review_count: profile.judge_review_count || 0,
          judge_bio: profile.judge_bio || null,
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

  // Prioritize "alive" users - those with engagement signals
  // Then shuffle within priority tiers for variety
  const shuffledRankings = useMemo(() => {
    if (hasActiveFilters) return rankings; // Don't shuffle when filtering
    
    // Score each user by "aliveness" signals
    // CRITICAL: Users without avatars are deprioritized to train identity creation
    const scored = rankings.map(editor => {
      let aliveScore = 0;
      const hasAvatar = !!editor.avatar_url;
      
      // Has profile picture = +6 (highest priority - makes page look alive)
      if (hasAvatar) aliveScore += 6;
      
      // Has connections = +4 (shows active networking)
      if ((editor.connection_count || 0) > 0) aliveScore += 4;
      
      // Many connections (5+) = extra +2
      if ((editor.connection_count || 0) >= 5) aliveScore += 2;
      
      // Verified = +4
      if (editor.verification_status) aliveScore += 4;
      
      // Took GQT test = +3
      if (editor.best_gatekeeper_qoi && editor.best_gatekeeper_qoi > 0) aliveScore += 3;
      
      // Has index score = +2
      if ((editor.global_index_score || 0) > 0) aliveScore += 2;
      
      // Has competed in events = +3
      if ((editor.total_events || 0) > 0) aliveScore += 3;
      
      // Level 2+ = +1
      if ((editor.level || 1) >= 2) aliveScore += 1;
      
      return { editor, aliveScore, hasAvatar };
    });
    
    // Group: Avatar users first (high/medium), then no-avatar users (always low priority)
    const withAvatar = scored.filter(s => s.hasAvatar);
    const noAvatar = scored.filter(s => !s.hasAvatar);
    
    // Within avatar users, sort by engagement
    const avatarHigh = withAvatar.filter(s => s.aliveScore >= 12); // Avatar + strong signals
    const avatarMedium = withAvatar.filter(s => s.aliveScore >= 6 && s.aliveScore < 12); // Avatar + some signals
    
    // Fisher-Yates shuffle within each tier
    const shuffle = <T,>(arr: T[]): T[] => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    // Combine: engaged avatar users → basic avatar users → no avatar users (pushed to bottom)
    return [
      ...shuffle(avatarHigh).map(s => s.editor),
      ...shuffle(avatarMedium).map(s => s.editor),
      ...shuffle(noAvatar).map(s => s.editor),
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankings, hasActiveFilters, shuffleKey]);

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

  // Batch fetch pinned edits for visible editors
  const editorIds = useMemo(() => filteredEditors.slice(0, 50).map(e => e.id), [filteredEditors]);
  const { editsByUser: pinnedEditsByUser } = useBatchPinnedEdits(editorIds);

  // Batch fetch pinned edits for judges
  const judgeIds = useMemo(() => judges.slice(0, 50).map(j => j.id), [judges]);
  const { editsByUser: judgePinnedEdits } = useBatchPinnedEdits(judgeIds);

  const tabs: { id: ViewMode; label: string; icon: React.ElementType; navigateTo?: string }[] = [
    { id: "editors", label: "INDEX", icon: Target },
    { id: "crews", label: "UNITS", icon: Users, navigateTo: "/units" },
    { id: "rankings", label: "RANKINGS", icon: Trophy },
    { id: "judges", label: "JUDGES", icon: Gavel },
  ];

  const rankingSubTabs: { id: RankingSubTab; label: string; icon: React.ElementType }[] = [
    { id: "xp", label: "XP", icon: Zap },
    { id: "crews", label: "UNITS", icon: Users },
    { id: "events", label: "EVENTS", icon: Trophy },
  ];

  // Units tab handler - navigate to units page
  const handleCrewsTab = () => navigate("/units");

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
        {/* Multi-layer gradient background - neutral depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-white/3 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/5 blur-[100px] rounded-full" />
        
        {/* Dubai Mall gate pattern */}
        <GatePattern opacity={3} tileSize={100} />
        
        {/* Decorative lines - neutral */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-gold/40" />
        <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-gold/40" />
        
        <header className="relative z-10 px-4 pt-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/5 border border-white/20 flex items-center justify-center">
                <Search className="w-4 h-4 text-white/70" />
              </div>
              <span className="text-[10px] text-white/70 uppercase tracking-[0.4em] font-semibold">Discover</span>
            </div>
            
            {/* Refresh/Shuffle Button */}
            {viewMode === "editors" && (
              <button
                onClick={() => setShuffleKey(k => k + 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white group"
              >
                <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-[10px] uppercase tracking-wider font-medium">Shuffle</span>
              </button>
            )}
          </div>
          
          {/* Hero Title - Bolder */}
          <div className="text-center">
            <h1 className="font-display text-5xl sm:text-6xl tracking-wider text-white mb-2">
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
                      ? "bg-white text-background shadow-[0_0_20px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]"
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
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  placeholder="Search editors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-0/60 backdrop-blur-sm border border-border/60 pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-white/30 focus:bg-surface-0/80 transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Filters - Premium Pill Style */}
            <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
              <div className="relative">
                <select
                  value={leagueFilter}
                  onChange={(e) => setLeagueFilter(e.target.value as LeagueFilter)}
                  className="bg-surface-0/80 backdrop-blur-sm border border-border/60 px-5 py-2.5 pr-8 text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer focus:outline-none focus:border-white/30 hover:border-white/20 transition-colors"
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

            {/* Results Header */}
            <div className="px-4 py-3 border-t border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg text-foreground">
                  {filteredEditors.length} <span className="text-muted-foreground text-sm">Editors</span>
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
                Global Index
              </span>
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

            {/* Editor Feed — Prestige Full-Width Cards */}
            {!loading && !error && filteredEditors.length > 0 && (
              <div className="py-2">
                {filteredEditors.map((editor, index) => {
                  const rank = editor.rank || 999;
                  const classLetter = getClassLetter(editor.best_gatekeeper_qoi, editor.level);
                  const hasTakenGQT = !!(editor.best_gatekeeper_qoi && editor.best_gatekeeper_qoi > 0);
                  const classColorStyle = getClassColors(classLetter, hasTakenGQT);
                  const authorityRole = getAuthorityRole(editor.roles);
                  const isTopThree = rank <= 3;
                  
                  return (
                    <motion.div
                      key={editor.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.015, duration: 0.3 }}
                      className={`relative border-b border-border/30 ${isTopThree ? 'bg-surface-1/30' : ''} shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_1px_3px_rgba(0,0,0,0.25)]`}
                    >
                      {/* Top accent for #1 */}
                      {rank === 1 && (
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                      )}
                      
                      <div className="px-4 py-4">
                        {/* Row 1: Avatar + Identity + Class Badge */}
                        <div className="flex items-start gap-3.5 mb-3">
                          <button 
                            onClick={() => navigate(`/editor/${editor.id}`)} 
                            className="flex-shrink-0"
                          >
                            <Avatar className={`w-14 h-14 border-2 ${rank === 1 ? 'border-gold/50' : isTopThree ? 'border-foreground/30' : 'border-border/60'}`}>
                              <AvatarImage src={editor.avatar_url || undefined} />
                              <AvatarFallback className="bg-surface-1 text-base font-bold">
                                {editor.username[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => navigate(`/editor/${editor.id}`)}
                                className="font-semibold text-[15px] text-foreground hover:underline truncate"
                              >
                                {editor.display_name || editor.username}
                              </button>
                              {editor.verification_status && <VerifiedBadge size="sm" />}
                              {authorityRole && <AuthorityBadge role={authorityRole} size="sm" />}
                              {editor.is_founding_member && <FoundingBadge size="sm" animate={false} />}
                            </div>
                            <p className="text-[12px] text-muted-foreground mt-0.5">@{editor.username}</p>
                          </div>
                          
                          {/* Class Badge — right aligned */}
                          <span className={`text-[9px] font-bold uppercase tracking-wider border px-2 py-1 flex-shrink-0 ${classColorStyle}`}>
                            {classLetter} Class
                          </span>
                        </div>
                        
                        {/* Row 2: Stats strip — rank, index, level, connections */}
                        <div className="flex items-center gap-4 mb-3 text-[11px]">
                          <span className="text-muted-foreground">
                            Rank <span className={`font-bold ${rank === 1 ? 'text-gold' : 'text-foreground'}`}>#{rank}</span>
                          </span>
                          <span className="text-border">•</span>
                          <span className="text-muted-foreground">
                            Index <span className={`font-bold ${rank === 1 ? 'text-gold' : 'text-foreground'}`}>{(editor.global_index_score || 0).toFixed(1)}</span>
                          </span>
                          <span className="text-border">•</span>
                          <span className="text-muted-foreground">
                            Level <span className="font-bold text-foreground">{editor.level || 1}</span>
                          </span>
                        </div>
                        
                        {/* Row 3: Unit + Connections */}
                        <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span className="text-foreground/70 font-medium">{editor.connection_count || 0}</span> connections
                          </span>
                          {editor.crew && (
                            <>
                              <span className="text-border">•</span>
                              <CrewBadge crew={editor.crew} size="sm" />
                            </>
                          )}
                        </div>
                        
                        {/* Row 3.5: Pinned Edits */}
                        {pinnedEditsByUser[editor.id]?.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                            {pinnedEditsByUser[editor.id].map((edit) => (
                              <a
                                key={edit.id}
                                href={edit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="relative flex-shrink-0 w-24 h-14 rounded-md overflow-hidden bg-surface-0 border border-border/30 hover:border-foreground/30 transition-colors group"
                              >
                                {edit.thumbnail_url ? (
                                  <ThumbnailImage src={edit.thumbnail_url} alt={edit.title || "Edit"} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Play className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {edit.title && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-0.5">
                                    <p className="text-[8px] text-white truncate">{edit.title}</p>
                                  </div>
                                )}
                              </a>
                            ))}
                          </div>
                        )}
                        
                        {/* Row 4: Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/editor/${editor.id}`)}
                            className="flex-1 py-2 text-[11px] font-bold uppercase tracking-wider border border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-colors rounded-md"
                          >
                            View Profile
                          </button>
                          {profile?.id !== editor.id && (
                            <div onClick={(e) => e.stopPropagation()} className="flex-1">
                              <ConnectButton targetUserId={editor.id} variant="micro" className="w-full" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Judges View — Prestige Feed */}
        {viewMode === "judges" && (
          <motion.div
            key="judges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg text-foreground">
                  {judges.length} <span className="text-muted-foreground text-sm">Officials</span>
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
                The Bureau
              </span>
            </div>
            
            {judgesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-red-400" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Loading officials...</span>
              </div>
            ) : judges.length === 0 ? (
              <EmptyState icon={Gavel} message="No judges found" />
            ) : (
              <div className="py-2">
                {judges.map((judge, index) => {
                  const isTop = index === 0;
                  const displayName = judge.display_name || judge.username;
                  const bio = judge.judge_bio || (
                    judge.totalReviews >= 50 ? `${displayName} is one of Loopgate's most prolific authorities, having filed over ${judge.totalReviews} official verdicts across all divisions.`
                    : judge.totalReviews >= 20 ? `A rising force in the Bureau, ${displayName} has established a reputation for precision across ${judge.totalReviews} career verdicts.`
                    : judge.totalReviews >= 5 ? `${displayName} is an active member of the Bureau's reviewing corps with ${judge.totalReviews} verdicts on record.`
                    : `${displayName} is a newly appointed authority in the Bureau, building their verdict record.`
                  );
                  const edits = judgePinnedEdits[judge.id] || [];

                  return (
                    <motion.div
                      key={judge.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.3 }}
                      className={`relative border-b border-border/30 ${isTop ? 'bg-surface-1/30' : ''}`}
                    >
                      {isTop && (
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                      )}

                      <div className="px-4 py-4">
                        {/* Row 1: Avatar + Identity + Division Badge */}
                        <div className="flex items-start gap-3.5 mb-3">
                          <button onClick={() => navigate(`/judge/${judge.username}`)} className="flex-shrink-0">
                            <Avatar className={`w-14 h-14 border-2 ${isTop ? 'border-red-700/60' : judge.isTrial ? 'border-border/40' : 'border-red-900/40'}`}>
                              <AvatarImage src={judge.avatar_url || undefined} />
                              <AvatarFallback className="bg-surface-1 text-base font-bold">
                                {judge.username[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => navigate(`/judge/${judge.username}`)}
                                className="font-semibold text-[15px] text-foreground hover:underline truncate"
                              >
                                {displayName}
                              </button>
                              {judge.verification_status && <VerifiedBadge size="sm" />}
                              {judge.isTrial ? (
                                <span className="text-[8px] px-1.5 py-0.5 bg-muted/20 border border-muted/30 text-muted-foreground uppercase tracking-wider">Trial</span>
                              ) : (
                                <AuthorityBadge role="judge" size="sm" />
                              )}
                            </div>
                            <p className="text-[12px] text-muted-foreground mt-0.5">@{judge.username}</p>
                          </div>

                          {/* Division Badge — right aligned */}
                          {!judge.isTrial && (
                            <div className="flex-shrink-0">
                              <JudgeDivisionBadge jxp={judge.judge_xp} size="sm" />
                            </div>
                          )}
                        </div>

                        {/* Row 2: Stats strip */}
                        <div className="flex items-center gap-4 mb-3 text-[11px]">
                          <span className="text-muted-foreground">
                            Rank <span className={`font-bold ${isTop ? 'text-red-400' : 'text-foreground'}`}>#{index + 1}</span>
                          </span>
                          <span className="text-border">•</span>
                          <span className="text-muted-foreground">
                            Verdicts <span className="font-bold text-foreground">{judge.totalReviews}</span>
                          </span>
                          <span className="text-border">•</span>
                          <span className="text-muted-foreground">
                            JXP <span className="font-bold text-foreground">{(judge.judge_xp || 0).toLocaleString()}</span>
                          </span>
                          <span className="text-border">•</span>
                          <span className="text-muted-foreground">
                            Level <span className="font-bold text-foreground">{judge.level || 1}</span>
                          </span>
                        </div>

                        {/* Row 3: Bio */}
                        {!judge.isTrial && (
                          <p className="text-[11px] text-muted-foreground/80 leading-relaxed mb-3 line-clamp-2">
                            {bio}
                          </p>
                        )}

                        {/* Row 3.5: Pinned Edits */}
                        {edits.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                            {edits.map((edit) => (
                              <a
                                key={edit.id}
                                href={edit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="relative flex-shrink-0 w-24 h-14 rounded-md overflow-hidden bg-surface-0 border border-border/30 hover:border-red-800/40 transition-colors group"
                              >
                                {edit.thumbnail_url ? (
                                  <ThumbnailImage src={edit.thumbnail_url} alt={edit.title || "Edit"} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Play className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {edit.title && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-0.5">
                                    <p className="text-[8px] text-white truncate">{edit.title}</p>
                                  </div>
                                )}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Row 4: Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/judge/${judge.username}`)}
                            className="flex-1 py-2 text-[11px] font-bold uppercase tracking-wider border border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-colors rounded-md"
                          >
                            View Dossier
                          </button>
                          {!judge.isTrial && (
                            <button
                              onClick={() => navigate(`/judge/${judge.username}`)}
                              className="flex-1 py-2 text-[11px] font-bold uppercase tracking-wider bg-red-700 text-white hover:bg-red-600 transition-colors rounded-md"
                            >
                              Get Rated
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
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
                  <div className="space-y-1">
                    {xpUsers.map((user, index) => {
                      const rank = user.rank || index + 1;
                      const style = getRankStyle(rank);
                      const IconComponent = style.icon;
                      
                      return (
                        <motion.button
                          key={user.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.015 }}
                          onClick={() => navigate(`/editor/${user.id}`)}
                          className={`w-full ${style.bg} ${style.border} p-3 flex items-center gap-3 text-left active:scale-[0.995] transition-transform duration-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_3px_rgba(0,0,0,0.3)]`}
                        >
                          <div className="w-7 flex items-center justify-center flex-shrink-0">
                            {IconComponent ? (
                              <IconComponent className={`w-4.5 h-4.5 ${style.text}`} />
                            ) : (
                              <span className={`font-display text-base ${style.text} tabular-nums`}>{rank}</span>
                            )}
                          </div>
                          
                          <Avatar className={`w-8 h-8 border ${rank === 1 ? 'border-gold/40' : 'border-border/60'}`}>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-surface-1 text-[10px] font-bold">
                              {user.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm text-foreground truncate">{user.username}</span>
                              <LevelBadge level={user.level} size="sm" />
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <span className={`font-display text-xl tabular-nums ${rank === 1 ? 'text-gold' : 'text-foreground'}`}>
                              {user.xp.toLocaleString()}
                            </span>
                            <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wider font-semibold">XP</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Units Leaderboard */}
            {rankingSubTab === "crews" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gold" />
                    <span className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Unit Rankings</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Combined XP</span>
                </div>
                
                {xpCrews.length === 0 && !crewsLoading ? (
                  <EmptyState icon={Users} message="No units yet" />
                ) : (
                  <div className="space-y-1">
                    {xpCrews.map((crew, index) => {
                      const rank = crew.rank || index + 1;
                      const style = getRankStyle(rank);
                      const IconComponent = style.icon;
                      
                      return (
                        <motion.button
                          key={crew.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.015 }}
                          onClick={() => navigate(`/units/${crew.id}`)}
                          className={`w-full ${style.bg} ${style.border} p-3 flex items-center gap-3 text-left active:scale-[0.995] transition-transform duration-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_3px_rgba(0,0,0,0.3)]`}
                        >
                          <div className="w-7 flex items-center justify-center flex-shrink-0">
                            {IconComponent ? (
                              <IconComponent className={`w-4.5 h-4.5 ${style.text}`} />
                            ) : (
                              <span className={`font-display text-base ${style.text} tabular-nums`}>{rank}</span>
                            )}
                          </div>
                          
                          <Avatar className={`w-8 h-8 border ${rank === 1 ? 'border-gold/40' : 'border-border/60'}`}>
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
                          
                          <div className="text-right flex-shrink-0">
                            <span className={`font-display text-xl tabular-nums ${rank === 1 ? 'text-gold' : 'text-foreground'}`}>
                              {crew.totalXP.toLocaleString()}
                            </span>
                            <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wider font-semibold">Total XP</p>
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
                        className="w-full bg-surface-1/80 backdrop-blur-sm border border-border/50 hover:border-gold/30 p-4 text-left flex items-center gap-4 transition-all active:scale-[0.995] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_6px_rgba(0,0,0,0.3)]"
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
