import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Lock,
  ArrowLeft,
  Users,
  Trophy,
  BarChart2,
  Star,
  Crosshair,
  Target,
  Zap,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useRealEvents,
  useRealRankings,
  useEventRankings,
  useActiveSession,
} from "@/hooks/useRealData";
import { useXPUserLeaderboard, useXPCrewLeaderboard } from "@/hooks/useXPLeaderboard";
import { useAuth } from "@/hooks/useAuth";
import StatusBadge from "@/components/loopgate/StatusBadge";
import LevelBadge from "@/components/loopgate/LevelBadge";
import CrewBadge from "@/components/loopgate/CrewBadge";
import SmartUsername from "@/components/loopgate/SmartUsername";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SEO, { pageSEO } from "@/components/SEO";

type TabType = "index" | "xp" | "crews" | "skill" | "streak" | "events";

const TEKO: React.CSSProperties = { fontFamily: "Teko, sans-serif" };

function formatBig(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return Number(n).toLocaleString();
}

/* ─────────────────────────── ROW ─────────────────────────── */
interface RowProps {
  rank: number;
  userId?: string | null;
  username: string;
  avatarUrl?: string | null;
  level?: number | null;
  verified?: boolean;
  league?: string;
  crew?: any;
  metaRight?: React.ReactNode; // pro / open badge for compact rows
  scoreValue: string;
  scoreLabel: string;
  scoreAccent?: "amber" | "emerald" | "white";
  onClick: () => void;
}

function LeaderboardRow(p: RowProps) {
  // Top-3 hero rows
  if (p.rank === 1) {
    return (
      <div
        onClick={p.onClick}
        className="relative flex items-center justify-between p-3 sm:p-6 bg-gradient-to-r from-white/10 via-transparent to-transparent border-l-[4px] sm:border-l-[6px] border-white group cursor-pointer hover:from-white/20 transition-all"
      >
        <div className="flex items-center gap-2.5 sm:gap-6 min-w-0 flex-1">
          <div
            className="text-3xl sm:text-5xl font-black text-white w-7 sm:w-12 italic leading-none shrink-0"
            style={TEKO}
          >
            01
          </div>
          <div className="relative shrink-0">
            <Avatar className="w-11 h-11 sm:w-16 sm:h-16 bg-black border-2 border-white rounded-none">
              <AvatarImage src={p.avatarUrl || undefined} />
              <AvatarFallback className="bg-black text-white font-bold rounded-none">
                {p.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {p.level !== undefined && p.level !== null && (
              <div
                className="absolute -bottom-1.5 -right-1.5 bg-white text-black px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-sm font-bold z-20 shadow-xl leading-none"
                style={TEKO}
              >
                LV {p.level}
              </div>
            )}
            <div className="absolute -inset-1 bg-white/10 blur-md group-hover:bg-white/25 transition-all pointer-events-none" />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="text-xl sm:text-4xl font-bold tracking-tight text-white truncate uppercase leading-none"
              style={TEKO}
            >
              <SmartUsername userId={p.userId} username={p.username} className="block truncate" style={TEKO} />
            </div>
            <div
              className="text-zinc-500 text-xs sm:text-xl flex items-center gap-2 mt-1 uppercase tracking-wider truncate"
              style={TEKO}
            >
              {p.league || ""}
              {p.crew && (
                <>
                  <span className="w-1.5 h-1.5 bg-zinc-700" />
                  <CrewBadge crew={p.crew} size="sm" />
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0 pl-2">
          <div
            className="text-xl sm:text-3xl text-white font-bold leading-none tabular-nums"
            style={TEKO}
          >
            {p.scoreValue}
          </div>
          <div
            className="text-zinc-600 text-[10px] sm:text-sm tracking-widest font-bold uppercase mt-1"
            style={TEKO}
          >
            {p.scoreLabel}
          </div>
        </div>
      </div>
    );
  }

  if (p.rank === 2 || p.rank === 3) {
    const borderColor = p.rank === 2 ? "border-zinc-400" : "border-zinc-500";
    const numColor = p.rank === 2 ? "text-zinc-400" : "text-zinc-500";
    const avatarBorder = p.rank === 2 ? "border-zinc-400" : "border-zinc-500";
    return (
      <div
        onClick={p.onClick}
        className={`relative flex items-center justify-between p-3 sm:p-5 bg-white/5 border-b border-white/5 border-l-[4px] sm:border-l-[6px] ${borderColor} cursor-pointer hover:bg-white/10 transition-colors`}
      >
        <div className="flex items-center gap-2.5 sm:gap-6 min-w-0 flex-1">
          <div
            className={`text-2xl sm:text-4xl font-bold w-7 sm:w-12 italic leading-none shrink-0 ${numColor}`}
            style={TEKO}
          >
            0{p.rank}
          </div>
          <Avatar
            className={`w-10 h-10 sm:w-14 sm:h-14 bg-black border ${avatarBorder} rounded-none shrink-0`}
          >
            <AvatarImage src={p.avatarUrl || undefined} />
            <AvatarFallback className="bg-black text-white font-bold rounded-none">
              {p.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div
              className="text-xl sm:text-3xl font-bold text-white uppercase tracking-tight leading-none flex items-center gap-1.5 sm:gap-2 flex-wrap"
              style={TEKO}
            >
              <SmartUsername userId={p.userId} username={p.username} className="truncate" style={TEKO} />
              {p.level !== undefined && p.level !== null && (
                <span
                  className="text-zinc-400 text-[9px] sm:text-sm bg-zinc-800 px-1.5 sm:px-2 leading-none py-0.5"
                  style={TEKO}
                >
                  LV {p.level}
                </span>
              )}
            </div>
            <div
              className="text-white text-xs sm:text-lg flex items-center gap-1.5 sm:gap-2 mt-1 uppercase tracking-wider truncate"
              style={TEKO}
            >
              {p.league || ""}
              {p.crew && (
                <>
                  <span className="w-1 h-1 bg-zinc-700" />
                  <CrewBadge crew={p.crew} size="sm" />
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0 pl-2">
          <div
            className="text-lg sm:text-2xl text-white font-bold leading-none tabular-nums"
            style={TEKO}
          >
            {p.scoreValue}
          </div>
          <div
            className="text-zinc-600 text-[10px] sm:text-sm font-bold uppercase mt-1"
            style={TEKO}
          >
            {p.scoreLabel}
          </div>
        </div>
      </div>
    );
  }

  // Compact rows 4+
  const accent =
    p.scoreAccent === "amber"
      ? "text-white"
      : p.scoreAccent === "emerald"
        ? "text-zinc-200"
        : "text-zinc-400";
  return (
    <div
      onClick={p.onClick}
      className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 hover:bg-white/5 transition-colors group cursor-pointer"
    >
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <div
          className="text-xl sm:text-2xl font-bold text-zinc-600 w-7 sm:w-8 italic leading-none group-hover:text-white transition-colors tabular-nums"
          style={TEKO}
        >
          {String(p.rank).padStart(2, "0")}
        </div>
        <Avatar className="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-900 border border-white/10 rounded-none shrink-0">
          <AvatarImage
            src={p.avatarUrl || undefined}
            className="opacity-60 group-hover:opacity-100 transition-opacity"
          />
          <AvatarFallback className="bg-zinc-900 text-zinc-400 text-xs font-bold rounded-none">
            {p.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div
          className="text-lg sm:text-2xl font-medium text-zinc-300 uppercase leading-none truncate flex items-center gap-2 sm:gap-4 min-w-0"
          style={TEKO}
        >
          <SmartUsername userId={p.userId} username={p.username} className="truncate" style={TEKO} />
          {p.metaRight}
        </div>
      </div>
      <div
        className={`text-lg sm:text-xl tabular-nums font-bold shrink-0 ${accent}`}
        style={TEKO}
      >
        {p.scoreValue}
      </div>
    </div>
  );
}

/* ────────────────── SECTION DIVIDER ────────────────── */
function TopDivider({ label }: { label: string }) {
  return (
    <div className="relative h-12 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative bg-[#111114] px-6 flex items-center gap-4">
        <div className="w-2 h-2 bg-white rotate-45" />
        <span
          className="text-zinc-500 text-base sm:text-xl font-bold tracking-[0.4em] uppercase"
          style={TEKO}
        >
          {label}
        </span>
        <div className="w-2 h-2 bg-white rotate-45" />
      </div>
    </div>
  );
}

/* ─────────────────────────── PAGE ─────────────────────────── */
export default function RankingsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventIdFromUrl = searchParams.get("event");

  const [activeTab, setActiveTab] = useState<TabType>("index");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventIdFromUrl);
  const { user } = useAuth();

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "index", label: "INDEX", icon: BarChart2 },
    { id: "xp", label: "XP", icon: Star },
    { id: "crews", label: "UNITS", icon: Users },
    { id: "skill", label: "SKILL", icon: Crosshair },
    { id: "streak", label: "STREAK", icon: Flame },
  ];

  useActiveSession();

  const { events } = useRealEvents();
  const { rankings: globalRankings, loading: rankingsLoading } = useRealRankings();
  const { rankings: eventRankings, loading: eventRankingsLoading } =
    useEventRankings(selectedEventId);
  const { users: xpUsers, loading: xpLoading } = useXPUserLeaderboard(50);
  const { crews: xpCrews, loading: crewsLoading } = useXPCrewLeaderboard(20);

  const [skillRankings, setSkillRankings] = useState<
    { id: string; username: string; avatar_url: string | null; best_gatekeeper_qoi: number; level: number | null }[]
  >([]);
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, username, avatar_url, best_gatekeeper_qoi, level")
      .eq("is_hidden", false)
      .not("best_gatekeeper_qoi", "is", null)
      .order("best_gatekeeper_qoi", { ascending: false })
      .limit(50)
      .then(({ data }) => setSkillRankings((data as any[]) || []));
  }, []);

  const [streakRankings, setStreakRankings] = useState<
    { id: string; username: string; avatar_url: string | null; level: number | null; daily_streak: number }[]
  >([]);
  const [streakLoading, setStreakLoading] = useState(true);
  useEffect(() => {
    setStreakLoading(true);
    supabase
      .from("profiles")
      .select("id, username, avatar_url, level, daily_streak" as any)
      .eq("is_hidden", false)
      .gt("daily_streak" as any, 0)
      .order("daily_streak" as any, { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setStreakRankings((data as any[]) || []);
        setStreakLoading(false);
      });
  }, []);

  // Find current user's position in active ranking
  const yourGlobal = globalRankings.findIndex((r) => r.id === user?.id);
  const yourScore =
    yourGlobal >= 0 ? globalRankings[yourGlobal].global_index_score : null;

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const isLiveEvent = selectedEvent?.status === "live";
  const isClosedEvent = selectedEvent?.status === "closed";

  /* ───── Event-detail view (unchanged behavior, lighter restyle) ───── */
  if (selectedEvent) {
    return (
      <div className="min-h-screen pb-24 bg-black">
        <header className="px-4 pt-3 pb-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setSelectedEventId(null)}
              className="p-1.5 -ml-1 hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={18} className="text-foreground" />
            </button>
            <StatusBadge status={selectedEvent.status} />
          </div>
          <h1
            className="text-3xl tracking-tight text-foreground mb-0.5 italic uppercase font-bold"
            style={TEKO}
          >
            {selectedEvent.title}
          </h1>
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
              Live Rankings
            </span>
          </div>
        )}

        {isClosedEvent && (
          <div className="px-4 py-2 flex items-center gap-2 text-muted-foreground">
            <Lock size={12} />
            <span className="text-[10px] uppercase tracking-widest">Final Results</span>
          </div>
        )}

        <div className="px-3 py-3">
          {eventRankings.length === 0 && !eventRankingsLoading ? (
            <EmptyState icon={Trophy} message="No rankings yet" sub="Submissions being reviewed" />
          ) : (
            <div className="bg-[#111114] border border-white/5">
              {eventRankings.map((ranking, index) => {
                const displayRank = ranking.final_rank || index + 1;
                return (
                  <LeaderboardRow
                    key={ranking.id}
                    rank={displayRank}
                    userId={ranking.user_id}
                    username={ranking.profile?.username || "Unknown"}
                    avatarUrl={(ranking.profile as any)?.avatar_url}
                    scoreValue={ranking.qoi_score?.toFixed(1) || "—"}
                    scoreLabel="QOI"
                    scoreAccent="amber"
                    onClick={() => {}}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─────────────────────── MAIN VIEW ─────────────────────── */

  // Resolve dataset for active tab
  type Row = {
    id: string;
    userId?: string | null;
    username: string;
    avatarUrl?: string | null;
    level?: number | null;
    verified?: boolean;
    league?: string;
    crew?: any;
    scoreValue: string;
    metaRight?: React.ReactNode;
    onClick: () => void;
  };

  let rows: Row[] = [];
  let scoreLabel = "IDX";
  let scoreAccent: "amber" | "emerald" | "white" = "amber";
  let loading = false;
  let emptyMessage = "No rankings yet";
  let EmptyIcon: React.ElementType = Target;

  if (activeTab === "index") {
    loading = rankingsLoading;
    emptyMessage = "No rankings yet";
    EmptyIcon = Target;
    rows = globalRankings.slice(0, 50).map((e) => ({
      id: e.id,
      userId: e.id,
      username: e.username,
      avatarUrl: e.avatar_url,
      level: e.level || 1,
      verified: e.verification_status,
      league: e.league,
      crew: e.crew,
      scoreValue: formatBig(e.global_index_score),
      onClick: () => navigate(`/editor/${e.id}`),
    }));
  } else if (activeTab === "xp") {
    loading = xpLoading;
    emptyMessage = "No XP rankings yet";
    EmptyIcon = Zap;
    scoreLabel = "XP";
    scoreAccent = "emerald";
    rows = xpUsers.map((u) => ({
      id: u.id,
      userId: u.id,
      username: u.username,
      avatarUrl: u.avatar_url,
      level: u.level,
      scoreValue: formatBig(u.xp),
      onClick: () => navigate(`/editor/${u.id}`),
    }));
  } else if (activeTab === "crews") {
    loading = crewsLoading;
    emptyMessage = "No units ranked yet";
    EmptyIcon = Users;
    scoreLabel = "XP";
    scoreAccent = "emerald";
    rows = xpCrews.map((c) => ({
      id: c.id,
      username: c.name,
      avatarUrl: c.avatar_url,
      level: c.crewLevel,
      scoreValue: formatBig(c.totalXP),
      metaRight: (
        <span
          className="text-zinc-500 text-xs sm:text-sm border border-white/10 px-2 py-0.5 leading-none"
          style={TEKO}
        >
          {c.member_count} EDITORS
        </span>
      ),
      onClick: () => navigate(`/units/${c.id}`),
    }));
  } else if (activeTab === "skill") {
    loading = false;
    emptyMessage = "No skill rankings yet";
    EmptyIcon = Crosshair;
    scoreLabel = "QOI";
    scoreAccent = "amber";
    rows = skillRankings.map((u) => ({
      id: u.id,
      userId: u.id,
      username: u.username,
      avatarUrl: u.avatar_url,
      level: u.level,
      scoreValue: Number(u.best_gatekeeper_qoi).toFixed(2),
      onClick: () => navigate(`/editor/${u.id}`),
    }));
  } else if (activeTab === "streak") {
    loading = streakLoading;
    emptyMessage = "No streaks yet";
    EmptyIcon = Flame;
    scoreLabel = "DAYS";
    scoreAccent = "amber";
    rows = streakRankings.map((u) => ({
      id: u.id,
      userId: u.id,
      username: u.username,
      avatarUrl: u.avatar_url,
      level: u.level,
      scoreValue: `${u.daily_streak}`,
      metaRight: (
        <span className="inline-flex items-center gap-1 text-white" style={TEKO}>
          <Flame className="w-3.5 h-3.5" /> ON FIRE
        </span>
      ),
      onClick: () => navigate(`/editor/${u.id}`),
    }));
  }

  return (
    <div className="min-h-screen bg-black pb-24 relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Dots pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      <SEO {...pageSEO.rankings} />

      <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 md:p-8 relative z-10">
        <div
          className="w-full bg-[#111114] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,1)] relative text-white"
          style={TEKO}
        >
          {/* Header */}
          <div className="p-4 sm:p-8 border-b border-white/10">
            <div className="flex justify-between items-end mb-6 sm:mb-8 gap-4">
              <h1
                className="text-4xl sm:text-6xl md:text-8xl font-bold leading-[0.85] italic tracking-tighter uppercase"
                style={TEKO}
              >
                GLOBAL
                <br className="sm:hidden" /> LEADERBOARD
              </h1>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isStreak = tab.id === "streak";
                const base =
                  "px-3 sm:px-6 py-2 text-lg sm:text-2xl font-bold uppercase cursor-pointer transition-all leading-none flex items-center gap-2";
                const cls = isActive
                  ? isStreak
                    ? "bg-white text-black"
                    : "bg-white text-black"
                  : isStreak
                    ? "text-zinc-400 hover:text-white hover:bg-white/5"
                    : "text-zinc-500 hover:text-white hover:bg-white/5";
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${base} ${cls}`}
                    style={TEKO}
                  >
                    {tab.label}
                    {isStreak && (
                      <span
                        className={`w-2 h-2 ${isActive ? "bg-black" : "bg-white"} shadow-[0_0_10px_#ffffff]`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col"
            >
              {rows.length === 0 && !loading ? (
                <EmptyState icon={EmptyIcon} message={emptyMessage} />
              ) : (
                <>
                  {/* Top 3 */}
                  {rows.slice(0, 3).map((r, i) => (
                    <LeaderboardRow
                      key={r.id}
                      rank={i + 1}
                      userId={r.userId}
                      username={r.username}
                      avatarUrl={r.avatarUrl}
                      level={r.level}
                      verified={r.verified}
                      league={r.league}
                      crew={r.crew}
                      scoreValue={r.scoreValue}
                      scoreLabel={scoreLabel}
                      scoreAccent={scoreAccent}
                      onClick={r.onClick}
                    />
                  ))}

                  {rows.length > 3 && <TopDivider label="Top 10 Contenders" />}

                  {/* Rows 4-10 */}
                  {rows.length > 3 && (
                    <div className="bg-black/40 divide-y divide-white/5">
                      {rows.slice(3, 10).map((r, i) => (
                        <LeaderboardRow
                          key={r.id}
                          rank={i + 4}
                          userId={r.userId}
                          username={r.username}
                          avatarUrl={r.avatarUrl}
                          level={r.level}
                          metaRight={r.metaRight}
                          scoreValue={r.scoreValue}
                          scoreLabel={scoreLabel}
                          scoreAccent={scoreAccent}
                          onClick={r.onClick}
                        />
                      ))}
                    </div>
                  )}

                  {/* Rows 11+ */}
                  {rows.length > 10 && (
                    <>
                      <TopDivider label="Rankings" />
                      <div className="bg-black/20 divide-y divide-white/5">
                        {rows.slice(10).map((r, i) => (
                          <LeaderboardRow
                            key={r.id}
                            rank={i + 11}
                            userId={r.userId}
                            username={r.username}
                            avatarUrl={r.avatarUrl}
                            level={r.level}
                            metaRight={r.metaRight}
                            scoreValue={r.scoreValue}
                            scoreLabel={scoreLabel}
                            scoreAccent={scoreAccent}
                            onClick={r.onClick}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* User's pinned position bar (index tab only, if ranked outside top) */}
              {activeTab === "index" && user && yourGlobal >= 0 && (
                <div className="mt-2 bg-[#111114] border-t-2 border-white p-4 sm:p-6 flex items-center justify-between shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    <div
                      className="text-3xl sm:text-4xl font-black text-white w-10 sm:w-12 tabular-nums leading-none"
                      style={TEKO}
                    >
                      {yourGlobal + 1}
                    </div>
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white rounded-none shrink-0">
                      <AvatarImage src={globalRankings[yourGlobal].avatar_url || undefined} />
                      <AvatarFallback className="bg-white/5 text-zinc-200 font-bold rounded-none">
                        {globalRankings[yourGlobal].username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div
                        className="text-2xl sm:text-3xl font-bold text-zinc-200 uppercase leading-none truncate"
                        style={TEKO}
                      >
                        YOU
                      </div>
                      <div
                        className="text-zinc-500 text-xs sm:text-lg leading-none tracking-widest font-bold italic uppercase mt-1"
                        style={TEKO}
                      >
                        <SmartUsername userId={globalRankings[yourGlobal].id} username={globalRankings[yourGlobal].username} style={TEKO} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="text-2xl sm:text-3xl text-white font-bold tabular-nums leading-none"
                      style={TEKO}
                    >
                      {formatBig(yourScore)}
                    </div>
                    <div
                      className="text-zinc-600 text-[10px] sm:text-sm font-bold uppercase mt-1"
                      style={TEKO}
                    >
                      Your IDX
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
  sub,
}: {
  icon: React.ElementType;
  message: string;
  sub?: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 mx-auto mb-3 bg-white/5 flex items-center justify-center border border-white/10">
        <Icon className="w-6 h-6 text-zinc-600" />
      </div>
      <p className="text-sm text-zinc-400 font-medium uppercase tracking-widest" style={TEKO}>
        {message}
      </p>
      {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}