import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, MessageCircle, Shield, Crown, Star, Lock, ChevronRight, Users, Target, Medal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealRankings } from "@/hooks/useRealData";
import { useAuth } from "@/hooks/useAuth";
import loopgateLogo from "@/assets/loopgate-logo.png";
import SEO, { pageSEO } from "@/components/SEO";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import AuthorityBadge from "@/components/loopgate/AuthorityBadge";
import LevelBadge from "@/components/loopgate/LevelBadge";
import HouseBadge from "@/components/loopgate/houses/HouseBadge";
import HouseAvatarRing from "@/components/loopgate/houses/HouseAvatarRing";
import { getRankFromScore, GQTRank } from "@/data/gqtConfig";

type LeagueFilter = "all" | "open" | "pro" | "elite";
type RankFilter = "all" | "top10" | "top50" | "top100";
type ViewMode = "editors" | "arenas" | "class";

const arenas = [
  { id: 1, name: "Global", description: "Open to all editors", minLeague: "open" as const, icon: MessageCircle },
  { id: 2, name: "Open League", description: "Open League members", minLeague: "open" as const, icon: Shield },
  { id: 3, name: "Pro Arena", description: "Pro & Elite only", minLeague: "pro" as const, icon: Star },
  { id: 4, name: "Elite Arena", description: "Elite members only", minLeague: "elite" as const, icon: Crown },
];

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

// Rank tier styles for visual hierarchy
const getRankStyle = (rank: number) => {
  if (rank === 1) return {
    bg: "bg-gradient-to-r from-yellow-500/25 via-amber-400/15 to-yellow-500/25",
    border: "border-l-4 border-yellow-400",
    glow: "shadow-[0_0_15px_rgba(250,204,21,0.2)]",
    text: "text-yellow-400",
    icon: Crown,
  };
  if (rank === 2) return {
    bg: "bg-gradient-to-r from-slate-400/15 via-gray-300/10 to-slate-400/15",
    border: "border-l-4 border-slate-300",
    glow: "shadow-[0_0_10px_rgba(203,213,225,0.15)]",
    text: "text-slate-300",
    icon: Medal,
  };
  if (rank === 3) return {
    bg: "bg-gradient-to-r from-amber-700/20 via-orange-600/10 to-amber-700/20",
    border: "border-l-4 border-amber-600",
    glow: "shadow-[0_0_10px_rgba(217,119,6,0.15)]",
    text: "text-amber-500",
    icon: Medal,
  };
  if (rank <= 10) return {
    bg: "bg-gradient-to-r from-gold/8 via-gold/4 to-gold/8",
    border: "border-l-2 border-gold/50",
    glow: "",
    text: "text-gold",
    icon: null,
  };
  return {
    bg: "bg-surface-1/60",
    border: "border-l-2 border-border",
    glow: "",
    text: "text-muted-foreground",
    icon: null,
  };
};

const classColors: Record<string, string> = {
  'S++': 'text-gold border-gold bg-gold/10',
  'S+': 'text-gold border-gold/80 bg-gold/10',
  'S': 'text-amber-400 border-amber-400 bg-amber-400/10',
  'A': 'text-emerald-400 border-emerald-400 bg-emerald-400/10',
  'B': 'text-blue-400 border-blue-400 bg-blue-400/10',
  'C': 'text-slate-300 border-slate-400/50 bg-slate-400/10',
  'D': 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  'F': 'text-muted-foreground border-border bg-muted/10',
};

export default function IndexPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("all");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("editors");

  const { rankings, loading, error } = useRealRankings();

  const userLeague = profile?.league || "open";

  const canAccessArena = (minLeague: "open" | "pro" | "elite") => {
    return leagueOrder[userLeague as keyof typeof leagueOrder] <= leagueOrder[minLeague];
  };

  const filteredEditors = useMemo(() => {
    return rankings.filter((editor) => {
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
  }, [rankings, searchQuery, leagueFilter, rankFilter]);

  const tabs: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: "editors", label: "EDITORS", icon: Users },
    { id: "arenas", label: "ARENAS", icon: MessageCircle },
    { id: "class", label: "CLASS", icon: Target },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO {...pageSEO.index} />
      
      {/* Cinematic Hero Header */}
      <div className="relative overflow-hidden">
        {/* Multi-layer gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-gold/3 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(212,175,55,0.15),transparent_60%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gold/8 blur-[80px] rounded-full" />
        
        {/* Decorative lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <header className="relative z-10 px-4 pt-5 pb-6">
          <div className="flex items-center justify-between mb-5">
            <img src={loopgateLogo} alt="LOOPGATE" className="h-5 opacity-80" />
            <div className="flex items-center gap-2 text-gold">
              <div className="relative">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-gold animate-ping opacity-75" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest">Live</span>
            </div>
          </div>
          
          {/* Hero Title */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-gold" />
              <span className="text-[10px] text-gold uppercase tracking-[0.4em] font-medium">Discover</span>
            </div>
            <h1 className="font-display text-4xl tracking-wider text-white mb-1">EDITOR INDEX</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              Scout • Search • Connect
            </p>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="relative z-10 px-4 pb-4">
          <div className="flex gap-1 bg-surface-0/50 backdrop-blur-sm p-1 border border-border/50">
            {tabs.map((tab) => {
              const isActive = viewMode === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => tab.id === "class" ? navigate("/class") : setViewMode(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold tracking-wider transition-all ${
                    isActive
                      ? "bg-gold text-background"
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
            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search editors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-0/50 backdrop-blur-sm border border-border/50 pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
              <select
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value as LeagueFilter)}
                className="bg-surface-0/80 border border-border/50 px-4 py-2 text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer focus:outline-none focus:border-gold/50"
              >
                <option value="all">All Leagues</option>
                <option value="elite">Elite</option>
                <option value="pro">Pro</option>
                <option value="open">Open</option>
              </select>

              <select
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value as RankFilter)}
                className="bg-surface-0/80 border border-border/50 px-4 py-2 text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer focus:outline-none focus:border-gold/50"
              >
                <option value="all">All Ranks</option>
                <option value="top10">Top 10</option>
                <option value="top50">Top 50</option>
                <option value="top100">Top 100</option>
              </select>
            </div>

            {/* Results Header */}
            <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between bg-surface-0/30">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold" />
                <span className="font-display text-lg text-white">
                  {filteredEditors.length} <span className="text-muted-foreground">Editors</span>
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
                Global Index
              </span>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-gold" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-destructive">Failed to load rankings</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredEditors.length === 0 && (
              <div className="px-4 py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-1 flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-display text-xl text-muted-foreground mb-2">No editors found</p>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                  {rankings.length === 0 
                    ? "Be the first to compete and claim your rank" 
                    : "Try adjusting your filters"}
                </p>
              </div>
            )}

            {/* Editor Cards */}
            {!loading && !error && filteredEditors.length > 0 && (
              <div className="px-4 py-2 space-y-2">
                {filteredEditors.map((editor, index) => {
                  const rank = editor.rank || 999;
                  const style = getRankStyle(rank);
                  const IconComponent = style.icon;
                  const classLetter = getClassLetter(editor.best_gatekeeper_qoi, editor.level);
                  const authorityRole = getAuthorityRole(editor.roles);
                  
                  return (
                    <motion.button
                      key={editor.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.015 }}
                      onClick={() => navigate(`/editor/${editor.id}`)}
                      className={`w-full relative ${style.bg} ${style.border} ${style.glow} backdrop-blur-sm p-4 flex items-center gap-3 text-left hover:scale-[1.005] transition-transform active:scale-[0.995]`}
                    >
                      {/* Avatar with House Ring */}
                      <HouseAvatarRing 
                        house={editor.house} 
                        size="sm"
                        avatarUrl={editor.avatar_url}
                        username={editor.username}
                      />
                      
                      {/* Rank */}
                      <div className="w-12 text-center">
                        {IconComponent ? (
                          <IconComponent className={`w-5 h-5 mx-auto ${style.text}`} />
                        ) : (
                          <span className={`font-display text-2xl ${style.text}`}>{rank}</span>
                        )}
                        <p className="text-[7px] text-muted-foreground uppercase tracking-wider">Rank</p>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <h3 className="font-semibold text-sm truncate text-white">
                            {editor.display_name || editor.username}
                          </h3>
                          {editor.verification_status && <VerifiedBadge size="sm" />}
                          {authorityRole && <AuthorityBadge role={authorityRole} size="sm" />}
                          <span className={`text-[8px] font-bold uppercase tracking-wider border px-1.5 py-0.5 ${classColors[classLetter]}`}>
                            {classLetter}
                          </span>
                        </div>
                        {editor.display_name && (
                          <p className="text-[10px] text-muted-foreground mb-0.5">@{editor.username}</p>
                        )}
                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase tracking-wider flex-wrap">
                          <span>{editor.win_rate?.toFixed(0) || 0}% Win</span>
                          <span>{editor.total_events || 0} Events</span>
                          {editor.house && <HouseBadge house={editor.house} size="sm" />}
                        </div>
                      </div>

                      {/* Level & Index */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-center">
                          <p className="font-display text-lg text-foreground/80">
                            {editor.level || 1}
                          </p>
                          <p className="text-[7px] text-muted-foreground uppercase tracking-wider">LVL</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-display text-2xl text-gold">
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

        {/* Arenas View */}
        {viewMode === "arenas" && (
          <motion.div
            key="arenas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-4 space-y-3"
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4 text-gold" />
              <span className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
                Real-time chat rooms by league tier
              </span>
            </div>
            
            {arenas.map((arena, index) => {
              const hasAccess = canAccessArena(arena.minLeague);
              const IconComponent = arena.icon;
              
              return (
                <motion.button
                  key={arena.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => hasAccess && navigate(`/arenas/${arena.id}`)}
                  disabled={!hasAccess}
                  className={`w-full p-4 border backdrop-blur-sm flex items-center gap-4 transition-all text-left ${
                    hasAccess
                      ? "bg-surface-0/50 border-border/50 hover:border-gold/30 hover:bg-surface-1/50"
                      : "bg-muted/10 border-border/30 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className={`w-12 h-12 flex items-center justify-center ${
                    hasAccess ? "bg-gold/10 text-gold" : "bg-muted/20 text-muted-foreground"
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base tracking-wide">{arena.name}</h3>
                      {!hasAccess && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{arena.description}</p>
                  </div>
                  {hasAccess && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </motion.button>
              );
            })}
            
            <div className="pt-6 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                Unlock higher arenas by advancing your league
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="p-4 text-center mt-4">
        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.2em]">
          {viewMode === "editors" ? "Real-time verified rankings" : 
           viewMode === "arenas" ? "Text-only • No media uploads" :
           "Performance-based progression"}
        </p>
      </div>
    </div>
  );
}
