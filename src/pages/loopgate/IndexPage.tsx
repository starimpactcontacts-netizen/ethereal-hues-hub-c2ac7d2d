import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Loader2, Gavel, Crown, Lock, ChevronRight, Users, Target, Medal, Zap, Trophy, RefreshCw, ArrowLeft, Plus, Play, Flame, Star, Newspaper, TrendingUp, ArrowRight, Eye } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
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
import IndexHeroPattern from "@/components/loopgate/IndexHeroPattern";
import EditoriumCarousel from "@/components/loopgate/EditoriumCarousel";
import DiscoverEditsCarousel from "@/components/loopgate/DiscoverEditsCarousel";

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

function getClassLetter(bestGQT: number | null | undefined, level: number | undefined): GQTRank {
  if (bestGQT && bestGQT > 0) return getRankFromScore(bestGQT).rank;
  if ((level || 1) >= 2) return 'D';
  return 'F';
}

function getAuthorityRole(roles?: string[]): 'dev' | 'judge' | 'enterprise' | null {
  if (!roles) return null;
  if (roles.includes('dev')) return 'dev';
  if (roles.includes('judge')) return 'judge';
  if (roles.includes('enterprise')) return 'enterprise';
  return null;
}

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

const getRankStyle = (rank: number) => {
  if (rank === 1) return { bg: "bg-gold/8", border: "border-l-2 border-gold", glow: "", text: "text-gold", icon: Crown, shimmer: false };
  if (rank === 2) return { bg: "bg-surface-1/40", border: "border-l-2 border-foreground/30", glow: "", text: "text-foreground/70", icon: Medal, shimmer: false };
  if (rank === 3) return { bg: "bg-surface-1/30", border: "border-l-2 border-foreground/20", glow: "", text: "text-foreground/50", icon: Medal, shimmer: false };
  if (rank <= 10) return { bg: "bg-surface-1/20", border: "border-l border-border/50", glow: "", text: "text-muted-foreground", icon: null, shimmer: false };
  return { bg: "", border: "border-l border-border/20", glow: "", text: "text-muted-foreground", icon: null, shimmer: false };
};

/* ═══════════════════════════════════════════════════
   DISCOVER CARD — Thumbnail-first visual tile
═══════════════════════════════════════════════════ */
function EditorCard({ editor, pinnedEdits, navigate, size = "md", showRank = false }: {
  editor: any;
  pinnedEdits?: any[];
  navigate: (path: string) => void;
  size?: "lg" | "md" | "sm";
  showRank?: boolean;
}) {
  const classLetter = getClassLetter(editor.best_gatekeeper_qoi, editor.level);
  const hasTakenGQT = !!(editor.best_gatekeeper_qoi && editor.best_gatekeeper_qoi > 0);
  const classStyle = getClassColors(classLetter, hasTakenGQT);
  const authorityRole = getAuthorityRole(editor.roles);
  const rank = editor.rank || 999;
  const firstEdit = pinnedEdits?.[0];
  
  const widthClass = size === "lg" ? "w-[220px]" : size === "md" ? "w-[180px]" : "w-[160px]";
  const thumbH = size === "lg" ? "h-[130px]" : size === "md" ? "h-[110px]" : "h-[95px]";
  const editCount = pinnedEdits?.length || 0;

  return (
    <button
      onClick={() => navigate(`/editor/${editor.id}`)}
      className={`${widthClass} flex-shrink-0 text-left group`}
    >
      {/* Thumbnail / Visual */}
      <div className={`relative ${thumbH} w-full bg-surface-1 rounded-t-lg border border-border/20 overflow-hidden`}>
        {firstEdit?.thumbnail_url ? (
          <ThumbnailImage src={firstEdit.thumbnail_url} alt={editor.username} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : editor.avatar_url ? (
          <img src={editor.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-2 to-surface-0 flex items-center justify-center">
            <span className="font-display text-3xl text-muted-foreground/30">{editor.username[0]?.toUpperCase()}</span>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Rank badge */}
        {showRank && rank <= 50 && (
          <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-black ${
            rank === 1 ? 'bg-gold text-background' : rank <= 3 ? 'bg-foreground/90 text-background' : 'bg-background/80 text-foreground'
          }`}>
            #{rank}
          </div>
        )}
        
        {/* Class badge */}
        <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[8px] border ${classStyle}`}>
          {classLetter}
        </div>
        
        {/* Bottom overlay info */}
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5 pt-4">
          <div className="flex items-center gap-1 mb-0.5">
            {editor.verification_status && <VerifiedBadge size="sm" />}
            {authorityRole && <AuthorityBadge role={authorityRole} size="sm" />}
            {editor.is_founding_member && <FoundingBadge size="sm" animate={false} />}
          </div>
          <p className="font-semibold text-[13px] text-white truncate leading-tight drop-shadow-lg">
            {editor.display_name || editor.username}
          </p>
        </div>
        
        {/* Play indicator if has edit */}
        {firstEdit?.thumbnail_url && (
          <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-white/90 flex items-center justify-center">
            <Play className="w-2.5 h-2.5 text-black fill-black" />
          </div>
        )}
      </div>
      
      {/* Stats bar below thumbnail */}
      <div className="bg-surface-1/60 border-x border-b border-border/20 rounded-b-lg px-2 py-1.5">
        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-gold font-bold text-[11px]">{(editor.global_index_score || 0).toFixed(1)}</span>
            <span className="text-border/40">|</span>
            <span>{editor.win_rate?.toFixed(0) || 0}% W</span>
            <span className="text-border/40">|</span>
            <span>Lv {editor.level || 1}</span>
          </div>
          {editCount > 0 && (
            <span className="flex items-center gap-0.5"><Play className="w-2 h-2" />{editCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground/70">
          <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{editor.connection_count || 0}</span>
          <span>{editor.total_events || 0} events</span>
          {editor.crew && <CrewBadge crew={editor.crew} size="sm" />}
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION HEADER — Roblox-style with arrow
═══════════════════════════════════════════════════ */
function SectionHeader({ icon: Icon, label, count, onSeeAll }: {
  icon: React.ElementType;
  label: string;
  count?: number;
  onSeeAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-foreground/50" />
        <h2 className="font-display text-xl tracking-wide text-foreground">{label}</h2>
        {count !== undefined && (
          <span className="text-[10px] text-muted-foreground bg-surface-1 px-1.5 py-0.5">{count}</span>
        )}
      </div>
      {onSeeAll && (
        <button onClick={onSeeAll} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors">
          See All <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════ */
function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 bg-surface-1 flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-medium">{message}</p>
    </div>
  );
}


export default function IndexPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("all");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("editors");
  const [rankingSubTab, setRankingSubTab] = useState<RankingSubTab>("xp");
  const [shuffleKey, setShuffleKey] = useState(0);
  const directoryRef = React.useRef<HTMLDivElement>(null);
  const [showFullIndex, setShowFullIndex] = useState(false);
  const eventIdFromUrl = searchParams.get("event");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventIdFromUrl);

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
    if (viewMode === "judges") fetchJudges();
  }, [viewMode]);

  async function fetchJudges() {
    setJudgesLoading(true);
    try {
      const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['judge', 'trial_judge']);

      if (!judgeRoles?.length) { setJudges([]); setJudgesLoading(false); return; }

      const judgeIds = judgeRoles.map(r => r.user_id);
      const trialJudgeIds = new Set(judgeRoles.filter(r => r.role === 'trial_judge').map(r => r.user_id));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, level, xp, verification_status, judge_xp, judge_review_count, judge_bio')
        .in('id', judgeIds);

      if (!profiles) { setJudges([]); setJudgesLoading(false); return; }

      const { data: reviews } = await supabase
        .from('review_requests')
        .select('judge_id')
        .eq('status', 'reviewed')
        .in('judge_id', judgeIds);

      const entries: JudgeEntry[] = profiles.map(profile => {
        const judgeReviews = reviews?.filter(r => r.judge_id === profile.id) || [];
        const isTrial = trialJudgeIds.has(profile.id) && !judgeRoles.some(r => r.user_id === profile.id && r.role === 'judge');
        return { ...profile, judge_xp: profile.judge_xp || 0, judge_review_count: profile.judge_review_count || 0, judge_bio: profile.judge_bio || null, totalReviews: judgeReviews.length, isTrial };
      });

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

  const hasActiveFilters = searchQuery !== "" || leagueFilter !== "all" || rankFilter !== "all";

  // Curated sections from rankings
  const { topRanked, trending, risingStars, allEditors } = useMemo(() => {
    // Top ranked by global index
    const sorted = [...rankings].sort((a, b) => (a.rank || 999) - (b.rank || 999));
    const topRanked = [...sorted.slice(0, 10)].sort(() => Math.random() - 0.5);
    
    // "Trending" — editors with avatars + highest engagement signals
    const scored = rankings.map(editor => {
      let score = 0;
      if (editor.avatar_url) score += 6;
      if ((editor.connection_count || 0) > 0) score += 4;
      if ((editor.connection_count || 0) >= 5) score += 2;
      if (editor.verification_status) score += 4;
      if (editor.best_gatekeeper_qoi && editor.best_gatekeeper_qoi > 0) score += 3;
      if ((editor.global_index_score || 0) > 0) score += 2;
      if ((editor.total_events || 0) > 0) score += 3;
      if ((editor.level || 1) >= 2) score += 1;
      return { editor, score };
    });
    
    const trendingSorted = [...scored].sort((a, b) => b.score - a.score);
    // Filter out top ranked to avoid duplication
    const topRankedIds = new Set(topRanked.map(e => e.id));
    const trendingFiltered = trendingSorted
      .filter(s => !topRankedIds.has(s.editor.id) && s.score >= 8 && s.editor.avatar_url)
      .slice(0, 15)
      .map(s => s.editor);
    // Shuffle trending order so it feels fresh each time
    const trending = [...trendingFiltered].sort(() => Math.random() - 0.5);
    
    // "Rising Stars" — newer editors with some activity but not top ranked
    const rising = scored
      .filter(s => !topRankedIds.has(s.editor.id) && !trending.some(t => t.id === s.editor.id))
      .filter(s => s.editor.avatar_url && s.score >= 2 && s.score < 10)
      .sort(() => Math.random() - 0.5)
      .slice(0, 15)
      .map(s => s.editor);

    // Full shuffled list for directory
    const shuffle = <T,>(arr: T[]): T[] => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    const withAvatar = rankings.filter(e => e.avatar_url);
    const noAvatar = rankings.filter(e => !e.avatar_url);
    const allEditors = [...shuffle(withAvatar), ...shuffle(noAvatar)];

    return { topRanked, trending, risingStars: rising, allEditors };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankings, shuffleKey]);

  const filteredEditors = useMemo(() => {
    const source = hasActiveFilters ? rankings : allEditors;
    return source.filter((editor) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!editor.username.toLowerCase().includes(query) && !editor.display_name?.toLowerCase().includes(query)) return false;
      }
      if (leagueFilter !== "all" && editor.league !== leagueFilter) return false;
      const rank = editor.rank || 999;
      if (rankFilter === "top10" && rank > 10) return false;
      if (rankFilter === "top50" && rank > 50) return false;
      if (rankFilter === "top100" && rank > 100) return false;
      return true;
    });
  }, [rankings, allEditors, searchQuery, leagueFilter, rankFilter, hasActiveFilters]);

  // Batch fetch pinned edits
  const allVisibleIds = useMemo(() => {
    const ids = new Set<string>();
    topRanked.forEach(e => ids.add(e.id));
    trending.forEach(e => ids.add(e.id));
    risingStars.forEach(e => ids.add(e.id));
    filteredEditors.slice(0, 30).forEach(e => ids.add(e.id));
    return Array.from(ids);
  }, [topRanked, trending, risingStars, filteredEditors]);
  const { editsByUser: pinnedEditsByUser } = useBatchPinnedEdits(allVisibleIds);

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

  // Event-specific leaderboard view within rankings
  if (viewMode === "rankings" && selectedEvent) {
    return (
      <div className="min-h-screen pb-24 bg-background">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.15),transparent_70%)]" />
          
          <header className="relative z-10 px-4 pt-4 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSelectedEventId(null)} className="p-2 -ml-2 hover:bg-white/5 transition-colors">
                <ArrowLeft size={20} />
              </button>
              <StatusBadge status={selectedEvent.status} />
            </div>
            <h1 className="font-display text-3xl tracking-wide text-white mb-1">{selectedEvent.title}</h1>
            <p className="text-xs text-gold uppercase tracking-[0.3em]">{selectedEvent.league} League • Leaderboard</p>
          </header>

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

        {isLiveEvent && (
          <div className="px-4 py-3 bg-surface-0/50 border-y border-border/50 flex items-center justify-center gap-6 text-[10px] uppercase tracking-[0.2em]">
            <span><span className="text-gold font-bold">Q</span> <span className="text-muted-foreground">Quality</span></span>
            <span><span className="text-gold font-bold">O</span> <span className="text-muted-foreground">Originality</span></span>
            <span><span className="text-gold font-bold">I</span> <span className="text-muted-foreground">Impact</span></span>
          </div>
        )}

        <div className="px-4 py-6">
          {eventRankings.length === 0 && !eventRankingsLoading ? (
            <EmptyState icon={Trophy} message="No rankings yet" />
          ) : (
            <div className="space-y-2">
              {eventRankings.map((ranking, index) => {
                const displayRank = ranking.final_rank || index + 1;
                const style = getRankStyle(displayRank);
                const IconComponent = style.icon;
                return (
                  <motion.div key={ranking.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                    className={`relative ${style.bg} ${style.border} ${style.glow} backdrop-blur-sm p-4 flex items-center gap-4`}>
                    <div className="w-12 flex items-center justify-center">
                      {IconComponent ? <IconComponent className={`w-6 h-6 ${style.text}`} /> : <span className={`font-display text-2xl ${style.text}`}>{displayRank}</span>}
                    </div>
                    <div className="flex-1"><span className="font-semibold text-white">{ranking.profile?.username || 'Unknown'}</span></div>
                    {isLiveEvent ? (
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{ranking.quality_score || '—'}</span>
                          <span>{ranking.originality_score || '—'}</span>
                          <span>{ranking.impact_score || '—'}</span>
                        </div>
                        <div className="w-px h-6 bg-border" />
                        <span className="font-display text-2xl text-gold min-w-[50px] text-right">{ranking.qoi_score?.toFixed(1) || '—'}</span>
                      </div>
                    ) : (
                      <span className="font-display text-2xl text-gold">{ranking.qoi_score?.toFixed(1) || '—'}</span>
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
    <div className="min-h-screen bg-background pb-24 relative">
      <SEO {...pageSEO.index} />
      
      {/* ═══ FULL PAGE PATTERN ═══ */}
      <GatePattern opacity={4} tileSize={56} className="fixed inset-0 z-0" />
      
      {/* ═══ CINEMATIC HERO ═══ */}
      <div className="relative overflow-hidden">
        {/* Deep layered gradients — Netflix premium depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-2 via-surface-1/60 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(212,175,55,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.03),transparent_50%)]" />
        <IndexHeroPattern />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-[1]" />
        
        <header className="relative z-10 px-5 pt-6 pb-3">
          {/* Shuffle button — top right */}
          <div className="flex items-center justify-end mb-4">
            {viewMode === "editors" && (
              <button onClick={() => {
                setShuffleKey(k => k + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-full transition-all text-foreground/60 hover:text-foreground group active:scale-95">
                <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-[10px] uppercase tracking-wider font-medium">Shuffle</span>
              </button>
            )}
          </div>
          
          {/* Massive title — single line for impact */}
          <h1 className="font-display text-[3.8rem] leading-[0.85] tracking-wide text-foreground">
            THE INDEX
          </h1>
          
          {/* Live counter — minimal with gold accent */}
          <div className="flex items-center gap-2.5 mt-3 mb-1">
            <div className="relative">
              <div className="w-2 h-2 bg-gold rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-gold rounded-full animate-ping opacity-40" />
            </div>
            <span className="text-[13px] font-bold text-foreground tabular-nums">{rankings.length}</span>
            <span className="text-[11px] text-muted-foreground/70 tracking-wide">editors indexed</span>
          </div>
        </header>

        {/* Tab Navigation — seamless rounded pills */}
        <div className="relative z-10 px-5 pb-5">
          <div className="flex gap-1 bg-surface-0/60 backdrop-blur-xl border border-border/20 p-1 rounded-xl">
            {tabs.map((tab) => {
              const isActive = viewMode === tab.id;
              const Icon = tab.icon;
              return (
                <button key={tab.id}
                  onClick={() => tab.navigateTo ? navigate(tab.navigateTo) : setViewMode(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold tracking-wider transition-all duration-200 rounded-lg ${
                    isActive && !tab.navigateTo ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ═══ EDITORS — DISCOVER FEED ═══ */}
        {viewMode === "editors" && (
          <motion.div key="editors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-foreground/30" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Loading the index...</span>
              </div>
            ) : error ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-destructive font-medium">Failed to load rankings</p>
              </div>
            ) : hasActiveFilters ? (
              /* ═══ FILTERED VIEW — Dense list ═══ */
              <>
                {/* Search + Filters */}
                <div className="px-4 py-3">
                  <div className="relative group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    <input type="text" placeholder="Search editors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-surface-0/60 backdrop-blur-sm border border-border/60 pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-foreground/30 transition-all placeholder:text-muted-foreground/60" />
                  </div>
                </div>
                <div className="px-4 pb-3 flex gap-2">
                  <FilterSelect value={leagueFilter} onChange={(v) => setLeagueFilter(v as LeagueFilter)} options={[["all","All Leagues"],["elite","Elite"],["pro","Pro"],["open","Open"]]} />
                  <FilterSelect value={rankFilter} onChange={(v) => setRankFilter(v as RankFilter)} options={[["all","All Ranks"],["top10","Top 10"],["top50","Top 50"],["top100","Top 100"]]} />
                </div>
                <div className="px-4 py-2 border-y border-border/30 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{filteredEditors.length} results</span>
                </div>
                <DirectoryList editors={filteredEditors} pinnedEditsByUser={pinnedEditsByUser} navigate={navigate} profile={profile} />
              </>
            ) : (
              /* ═══ DISCOVER FEED — Visual carousels ═══ */
              <>
                {/* Search bar — rounded, premium */}
                <div className="px-5 pt-1 pb-2">
                  <div className="relative group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-foreground/60 transition-colors" />
                    <input type="text" placeholder="Search editors, units..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-surface-1/50 border border-border/20 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-foreground/15 focus:bg-surface-1/80 transition-all placeholder:text-muted-foreground/30" />
                  </div>
                </div>

                {/* ─── TOP RANKED CAROUSEL ─── */}
                {topRanked.length > 0 && (
                  <div className="pt-4 pb-2">
                    <SectionHeader icon={Crown} label="TOP RANKED" onSeeAll={() => { setRankFilter("top10"); setSearchQuery("_"); setSearchQuery(""); }} />
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-2">
                      {topRanked.map((editor, i) => (
                        <motion.div key={editor.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <EditorCard editor={editor} pinnedEdits={pinnedEditsByUser[editor.id]} navigate={navigate} size="lg" showRank />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── LATEST EDITS SHOWCASE ─── */}
                <DiscoverEditsCarousel />

                {/* ─── EDITORIUM CAROUSEL ─── */}
                <EditoriumCarousel />

                {/* ─── TRENDING CAROUSEL ─── */}
                {trending.length > 0 && (
                  <div className="pt-4 pb-2">
                    <SectionHeader icon={Flame} label="TRENDING" count={trending.length} />
                    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-2">
                      {trending.map((editor, i) => (
                        <motion.div key={editor.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                          <EditorCard editor={editor} pinnedEdits={pinnedEditsByUser[editor.id]} navigate={navigate} size="md" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── RISING STARS CAROUSEL ─── */}
                {risingStars.length > 0 && (
                  <div className="pt-4 pb-2">
                    <SectionHeader icon={GateIcon} label="UP & COMING" count={risingStars.length} />
                    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-2">
                      {risingStars.map((editor, i) => (
                        <motion.div key={editor.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                          <EditorCard editor={editor} pinnedEdits={pinnedEditsByUser[editor.id]} navigate={navigate} size="sm" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── FULL DIRECTORY ─── */}
                <div className="pt-5">
                  <div className="flex items-center justify-between px-4 mb-1">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <h2 className="font-display text-xl tracking-wide text-foreground">ALL EDITORS</h2>
                      <span className="text-[10px] text-muted-foreground bg-surface-1 px-1.5 py-0.5">{rankings.length}</span>
                    </div>
                    <div className="flex gap-2">
                      <FilterSelect value={leagueFilter} onChange={(v) => setLeagueFilter(v as LeagueFilter)} options={[["all","All"],["elite","Elite"],["pro","Pro"],["open","Open"]]} />
                    </div>
                  </div>
                  
                  <DirectoryList
                    editors={showFullIndex ? filteredEditors : filteredEditors.slice(0, 20)}
                    pinnedEditsByUser={pinnedEditsByUser}
                    navigate={navigate}
                    profile={profile}
                  />
                  
                  {!showFullIndex && filteredEditors.length > 20 && (
                    <div className="px-4 py-4">
                      <button onClick={() => setShowFullIndex(true)}
                        className="w-full py-3 border border-border/40 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">
                        Show All {filteredEditors.length} Editors
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ═══ JUDGES VIEW ═══ */}
        {viewMode === "judges" && (
          <motion.div key="judges" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg text-foreground">{judges.length} <span className="text-muted-foreground text-sm">Officials</span></span>
              </div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">The Bureau</span>
            </div>
            
            {judgesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-foreground/30" />
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
                    <motion.div key={judge.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02, duration: 0.3 }}
                      className={`relative border-b border-border/30 ${isTop ? 'bg-surface-1/30' : ''}`}>
                      {isTop && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />}
                      <div className="px-4 py-4">
                        <div className="flex items-start gap-3.5 mb-3">
                          <button onClick={() => navigate(`/judge/${judge.username}`)} className="flex-shrink-0">
                            <Avatar className={`w-14 h-14 border-2 ${isTop ? 'border-gold/40' : judge.isTrial ? 'border-border/40' : 'border-border/60'}`}>
                              <AvatarImage src={judge.avatar_url || undefined} />
                              <AvatarFallback className="bg-surface-1 text-base font-bold">{judge.username[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button onClick={() => navigate(`/judge/${judge.username}`)} className="font-semibold text-[15px] text-foreground hover:underline truncate">{displayName}</button>
                              {judge.verification_status && <VerifiedBadge size="sm" />}
                              {judge.isTrial ? (
                                <span className="text-[8px] px-1.5 py-0.5 bg-muted/20 border border-muted/30 text-muted-foreground uppercase tracking-wider">Trial</span>
                              ) : (
                                <AuthorityBadge role="judge" size="sm" />
                              )}
                            </div>
                            <p className="text-[12px] text-muted-foreground mt-0.5">@{judge.username}</p>
                          </div>
                          {!judge.isTrial && <div className="flex-shrink-0"><JudgeDivisionBadge jxp={judge.judge_xp} size="sm" /></div>}
                        </div>

                        <div className="flex items-center gap-4 mb-3 text-[11px]">
                          <span className="text-muted-foreground">Rank <span className={`font-bold ${isTop ? 'text-gold' : 'text-foreground'}`}>#{index + 1}</span></span>
                          <span className="text-border">•</span>
                          <span className="text-muted-foreground">Verdicts <span className="font-bold text-foreground">{judge.totalReviews}</span></span>
                          <span className="text-border">•</span>
                          <span className="text-muted-foreground">JXP <span className="font-bold text-foreground">{(judge.judge_xp || 0).toLocaleString()}</span></span>
                        </div>

                        {!judge.isTrial && <p className="text-[11px] text-muted-foreground/80 leading-relaxed mb-3 line-clamp-2">{bio}</p>}

                        {edits.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                            {edits.map((edit) => (
                              <a key={edit.id} href={edit.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                className="relative flex-shrink-0 w-24 h-14 overflow-hidden bg-surface-0 border border-border/30 hover:border-foreground/30 transition-colors group">
                                {edit.thumbnail_url ? (
                                  <ThumbnailImage src={edit.thumbnail_url} alt={edit.title || "Edit"} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Play className="w-4 h-4 text-muted-foreground" /></div>
                                )}
                                {edit.title && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-0.5">
                                    <p className="text-[8px] text-white truncate">{edit.title}</p>
                                  </div>
                                )}
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/judge/${judge.username}`)} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-wider border border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-colors">View Dossier</button>
                          {!judge.isTrial && (
                            <button onClick={() => navigate(`/judge/${judge.username}`)} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 transition-colors">Get Rated</button>
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
          <motion.div key="rankings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-4 py-4">
            <div className="flex gap-1 bg-surface-0/60 border border-border/40 p-1 mb-5">
              {rankingSubTabs.map((tab) => {
                const isActive = rankingSubTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setRankingSubTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold tracking-wider transition-all duration-200 ${
                      isActive ? "bg-gold text-background" : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}>
                    <Icon className="w-3.5 h-3.5" />{tab.label}
                  </button>
                );
              })}
            </div>

            {rankingSubTab === "xp" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-gold" /><span className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Experience Points</span></div>
                  <span className="text-[10px] text-muted-foreground">Top Grinders</span>
                </div>
                {xpUsers.length === 0 && !xpLoading ? <EmptyState icon={Zap} message="No XP rankings yet" /> : (
                  <div className="space-y-1">
                    {xpUsers.map((user, index) => {
                      const rank = user.rank || index + 1;
                      const style = getRankStyle(rank);
                      const IconComponent = style.icon;
                      return (
                        <motion.button key={user.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.015 }}
                          onClick={() => navigate(`/editor/${user.id}`)}
                          className={`w-full ${style.bg} ${style.border} p-3 flex items-center gap-3 text-left active:scale-[0.995] transition-transform duration-100`}>
                          <div className="w-7 flex items-center justify-center flex-shrink-0">
                            {IconComponent ? <IconComponent className={`w-4.5 h-4.5 ${style.text}`} /> : <span className={`font-display text-base ${style.text} tabular-nums`}>{rank}</span>}
                          </div>
                          <Avatar className={`w-8 h-8 border ${rank === 1 ? 'border-gold/40' : 'border-border/60'}`}>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-surface-1 text-[10px] font-bold">{user.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm text-foreground truncate">{user.username}</span>
                              <LevelBadge level={user.level} size="sm" />
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`font-display text-xl tabular-nums ${rank === 1 ? 'text-gold' : 'text-foreground'}`}>{user.xp.toLocaleString()}</span>
                            <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wider font-semibold">XP</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {rankingSubTab === "crews" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gold" /><span className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Unit Rankings</span></div>
                  <span className="text-[10px] text-muted-foreground">Combined XP</span>
                </div>
                {xpCrews.length === 0 && !crewsLoading ? <EmptyState icon={Users} message="No units yet" /> : (
                  <div className="space-y-1">
                    {xpCrews.map((crew, index) => {
                      const rank = crew.rank || index + 1;
                      const style = getRankStyle(rank);
                      const IconComponent = style.icon;
                      return (
                        <motion.button key={crew.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.015 }}
                          onClick={() => navigate(`/units/${crew.id}`)}
                          className={`w-full ${style.bg} ${style.border} p-3 flex items-center gap-3 text-left active:scale-[0.995] transition-transform duration-100`}>
                          <div className="w-7 flex items-center justify-center flex-shrink-0">
                            {IconComponent ? <IconComponent className={`w-4.5 h-4.5 ${style.text}`} /> : <span className={`font-display text-base ${style.text} tabular-nums`}>{rank}</span>}
                          </div>
                          <Avatar className={`w-8 h-8 border ${rank === 1 ? 'border-gold/40' : 'border-border/60'}`}>
                            <AvatarImage src={crew.avatar_url || undefined} />
                            <AvatarFallback className="bg-surface-1 text-sm">{crew.emblem}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-sm text-foreground truncate block">{crew.name}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <span>{crew.member_count} editors</span><span className="text-border">•</span><span>Lv {crew.crewLevel}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`font-display text-xl tabular-nums ${rank === 1 ? 'text-gold' : 'text-foreground'}`}>{crew.totalXP.toLocaleString()}</span>
                            <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wider font-semibold">Total XP</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {rankingSubTab === "events" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-gold" /><span className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Event Leaderboards</span></div>
                </div>
                {rankedEvents.length === 0 ? <EmptyState icon={Trophy} message="No ranked events yet" /> : (
                  <div className="space-y-2">
                    {rankedEvents.map((event) => (
                      <button key={event.id} onClick={() => setSelectedEventId(event.id)}
                        className="w-full bg-surface-0/60 border border-border/30 hover:border-gold/30 p-4 flex items-center gap-3 transition-all text-left active:scale-[0.995]">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={event.status} />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{event.league}</span>
                          </div>
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DIRECTORY LIST — Compact rows for full index
═══════════════════════════════════════════════════ */
function DirectoryList({ editors, pinnedEditsByUser, navigate, profile }: {
  editors: any[];
  pinnedEditsByUser: Record<string, any[]>;
  navigate: (path: string) => void;
  profile: any;
}) {
  return (
    <div className="py-1">
      {editors.map((editor, index) => {
        const rank = editor.rank || 999;
        const classLetter = getClassLetter(editor.best_gatekeeper_qoi, editor.level);
        const hasTakenGQT = !!(editor.best_gatekeeper_qoi && editor.best_gatekeeper_qoi > 0);
        const classStyle = getClassColors(classLetter, hasTakenGQT);
        const authorityRole = getAuthorityRole(editor.roles);
        const isNumberOne = rank === 1;
        const isTop3 = rank <= 3;
        const edits = pinnedEditsByUser[editor.id] || [];

        return (
          <button key={editor.id} onClick={() => navigate(`/editor/${editor.id}`)}
            className={`w-full text-left border-b border-border/15 px-4 py-3.5 flex items-center gap-3 active:bg-surface-1/30 transition-colors ${isNumberOne ? 'bg-gold/5 border-l-2 border-l-gold' : ''}`}>
            
            {/* Rank */}
            <div className="w-7 flex-shrink-0 text-center">
              {isNumberOne ? <Crown className="w-4 h-4 text-gold mx-auto" /> : (
                <span className={`font-display text-sm tabular-nums ${isTop3 ? 'text-foreground/70' : 'text-muted-foreground/50'}`}>{rank}</span>
              )}
            </div>

            {/* Avatar with thumbnail overlay */}
            <div className="relative flex-shrink-0">
              <Avatar className={`w-11 h-11 border ${isNumberOne ? 'border-gold/50' : 'border-border/30'}`}>
                <AvatarImage src={editor.avatar_url || undefined} />
                <AvatarFallback className="bg-surface-1 text-xs font-bold">{editor.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              {edits[0]?.thumbnail_url && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border border-border/40 overflow-hidden bg-surface-0">
                  <ThumbnailImage src={edits[0].thumbnail_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-semibold text-[13px] text-foreground truncate">{editor.display_name || editor.username}</span>
                {editor.level && editor.level > 1 && <LevelBadge level={editor.level} size="xs" />}
                {editor.verification_status && <VerifiedBadge size="sm" />}
                {authorityRole && <AuthorityBadge role={authorityRole} size="sm" />}
                {editor.is_founding_member && <FoundingBadge size="sm" animate={false} />}
                <span className={`text-[7px] border px-1 py-px ${classStyle}`}>{classLetter}</span>
              </div>
              {editor.display_name && (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">@{editor.username}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground flex-wrap">
                <span>{editor.win_rate?.toFixed(0) || 0}% Win</span>
                <span className="text-border/40">•</span>
                <span>{editor.total_events || 0} Events</span>
                <span className="text-border/40">•</span>
                <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{editor.connection_count || 0}</span>
                {edits.length > 0 && (
                  <><span className="text-border/40">•</span><span className="flex items-center gap-0.5"><Play className="w-2.5 h-2.5" />{edits.length} edits</span></>
                )}
                {editor.crew && (
                  <><span className="text-border/40">•</span><CrewBadge crew={editor.crew} size="sm" /></>
                )}
              </div>
            </div>
            
            {/* Score */}
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <span className={`font-display text-xl tabular-nums ${isNumberOne ? 'text-gold' : 'text-foreground'}`}>
                {(editor.global_index_score || 0).toFixed(1)}
              </span>
              <p className="text-[7px] text-muted-foreground/50 uppercase tracking-wider">Index</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FILTER SELECT — Compact dropdown
═══════════════════════════════════════════════════ */
function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: string[][];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-surface-0/80 border border-border/60 px-4 py-2 pr-7 text-[10px] font-bold uppercase tracking-wider appearance-none cursor-pointer focus:outline-none hover:border-foreground/20 transition-colors">
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground rotate-90 pointer-events-none" />
    </div>
  );
}
