import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRealRankings } from "@/hooks/useRealData";
import { useXP, getXPForNextLevel, getXPForCurrentLevel } from "@/hooks/useXP";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { useReviewRequests } from "@/hooks/useReviewRequests";
import { useUserActivityStats } from "@/hooks/useUserActivityStats";
import XPHistory from "@/components/loopgate/XPHistory";
import { getRankFromScore, getEffectiveRank } from "@/data/gqtConfig";

const CLASS_STYLES: Record<string, { color: string; glow: string }> = {
  'S++': { color: '#fbbf24', glow: 'rgba(251,191,36,0.35)' },
  'S+':  { color: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
  'S':   { color: '#f59e0b', glow: 'rgba(245,158,11,0.25)' },
  'A':   { color: '#34d399', glow: 'rgba(52,211,153,0.25)' },
  'B':   { color: '#60a5fa', glow: 'rgba(96,165,250,0.25)' },
  'C':   { color: '#cbd5e1', glow: 'rgba(203,213,225,0.15)' },
  'D':   { color: '#fb923c', glow: 'rgba(251,146,60,0.2)' },
  'F':   { color: 'rgba(255,255,255,0.35)', glow: 'transparent' },
};

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 pt-6 pb-2 flex items-center gap-3">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">{label}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function StatBox({ value, label, sub, href, accent }: {
  value: string;
  label: string;
  sub?: string;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <div className="flex flex-col justify-between p-4 h-[100px] border border-white/[0.08] bg-[#111]">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30">{label}</span>
      <div>
        <span
          className="text-[38px] leading-none font-black"
          style={{ fontFamily: 'Teko, sans-serif', color: accent || 'white' }}
        >
          {value}
        </span>
        {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  if (href) return <Link to={href} className="block hover:border-white/20 transition-colors">{inner}</Link>;
  return inner;
}

function ActivityRow({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
      <span className="text-[13px] text-white/55">{label}</span>
      <span
        className="text-[20px] font-black leading-none tabular-nums"
        style={{ fontFamily: 'Teko, sans-serif', color: accent || 'rgba(255,255,255,0.75)' }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ProfileStatsPage() {
  const navigate = useNavigate();
  const { profile, user, loading: authLoading } = useAuth();
  const { rankings } = useRealRankings();
  const { xp, level, streak } = useXP();
  const { submissions } = useUserSubmissions();
  const { completedReviews, pendingReviews } = useReviewRequests();
  const activityStats = useUserActivityStats(user?.id);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <Loader2 className="w-5 h-5 animate-spin text-white/30" />
      </div>
    );
  }

  const userRanking = rankings.find(r => r.id === profile.id);
  const userRank = userRanking?.rank || (rankings.length > 0 ? rankings.length + 1 : '—');

  const bestGQT = (profile as any).best_gatekeeper_qoi;
  const hasTakenGQT = bestGQT && bestGQT > 0;
  const classLetter = getEffectiveRank(bestGQT, level);
  const classStyle = CLASS_STYLES[classLetter] || CLASS_STYLES['F'];

  const winRate = activityStats.totalEvents > 0 ? activityStats.winRate.toFixed(0) : '0';
  const nextLevelXP = getXPForNextLevel(level);
  const xpToNextLevel = nextLevelXP - xp;
  const currentStreak = streak?.current_streak || 0;
  const xpPct = Math.min(100, Math.round((xp / nextLevelXP) * 100));

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]" style={{ background: '#0a0a0a' }}>
        <button onClick={() => navigate('/profile')} className="p-1.5 -ml-1.5 text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[15px] font-black uppercase tracking-[0.15em] text-white">Stats</h1>
      </div>

      {/* ─── LEVEL / XP ─── */}
      <SectionLabel label="Experience" />

      {/* Level hero */}
      <div className="px-4 pb-4">
        <div className="border border-white/[0.08] bg-[#111] p-5">
          {/* Level + streak row */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">Level</p>
              <span
                className="text-[72px] leading-none font-black text-white"
                style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '-0.01em' }}
              >
                {level}
              </span>
            </div>
            <div className="text-right pb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-1">Total XP</p>
              <span className="text-[28px] font-black text-white/70 leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                {xp.toLocaleString()}
              </span>
              {currentStreak > 0 && (
                <div className="flex items-center justify-end gap-1 mt-1.5">
                  <span className="text-[11px] font-black text-amber-400">{currentStreak}d streak</span>
                  <span className="text-[11px]">🔥</span>
                </div>
              )}
            </div>
          </div>

          {/* XP bar */}
          <div className="relative h-1.5 bg-white/[0.07] w-full overflow-hidden mb-2">
            <div
              className="absolute inset-y-0 left-0 bg-white transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/30 tabular-nums">{xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP</span>
            <span className="text-[10px] text-white/30">{xpToNextLevel.toLocaleString()} to Level {level + 1}</span>
          </div>
        </div>
      </div>

      {/* ─── PERFORMANCE ─── */}
      <SectionLabel label="Performance" />
      <div className="px-4">
        <div className="grid grid-cols-2 gap-2">
          {/* Class — special treatment */}
          <Link to="/gqt" className="block">
            <div
              className="flex flex-col justify-between p-4 h-[100px] border bg-[#111] relative overflow-hidden"
              style={{
                borderColor: `${classStyle.color}40`,
                boxShadow: `inset 0 0 40px ${classStyle.glow}`,
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: `${classStyle.color}90` }}>Class</span>
              <div className="flex items-end justify-between">
                <span
                  className="text-[52px] leading-none font-black"
                  style={{ fontFamily: 'Teko, sans-serif', color: classStyle.color }}
                >
                  {classLetter}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: `${classStyle.color}60` }}>
                  {hasTakenGQT ? 'GQT' : 'Unrated'}
                </span>
              </div>
            </div>
          </Link>

          <StatBox value={`#${userRank}`} label="Global Rank" />
          <StatBox
            value={Number(profile.global_index_score || 0).toFixed(1)}
            label="Index Score"
          />
          <StatBox value={`${winRate}%`} label="Win Rate" accent={Number(winRate) >= 50 ? '#34d399' : undefined} />
        </div>
      </div>

      {/* ─── ACTIVITY ─── */}
      <SectionLabel label="Activity" />
      <ActivityRow label="Total Edits" value={submissions.length} />
      <ActivityRow label="Events Entered" value={activityStats.totalEvents} />
      <ActivityRow label="Wins" value={activityStats.totalWins} accent="#34d399" />
      <ActivityRow label="Losses" value={Math.max(0, activityStats.totalEvents - activityStats.totalWins)} accent={activityStats.totalEvents - activityStats.totalWins > 0 ? '#f87171' : undefined} />
      <ActivityRow label="Reviews Received" value={completedReviews.length} />
      {pendingReviews.length > 0 && (
        <ActivityRow label="Pending Reviews" value={pendingReviews.length} accent="#fb923c" />
      )}

      {/* ─── GQT ─── */}
      <SectionLabel label="Gatekeeper Quotient" />
      <Link to="/gqt" className="flex items-center justify-between px-4 py-4 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
        <div>
          <p className="text-[13px] font-medium text-white/80">Best GQT Score</p>
          <p className="text-[11px] text-white/30 mt-0.5">
            {hasTakenGQT ? `${bestGQT} pts — Class ${classLetter}` : 'Take the test to get your class'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasTakenGQT && (
            <span className="text-[24px] font-black leading-none" style={{ fontFamily: 'Teko, sans-serif', color: classStyle.color }}>
              {classLetter}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-white/20" />
        </div>
      </Link>

      {/* ─── XP HISTORY ─── */}
      <SectionLabel label="XP History" />
      <div className="px-4">
        <XPHistory />
      </div>

      <div className="h-8" />
    </div>
  );
}
