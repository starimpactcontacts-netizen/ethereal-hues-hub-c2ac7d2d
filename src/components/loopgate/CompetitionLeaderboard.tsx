import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, ExternalLink, Play, ChevronDown, ChevronUp,
  Crown, X, ThumbsUp, ThumbsDown, MessageCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CompetitionSubmission } from "@/hooks/useCompetitions";

const teko = { fontFamily: "Teko, sans-serif" };

const rankColors: Record<number, { border: string; glow: string; bg: string; text: string }> = {
  1: { border: "border-amber-400/60", glow: "shadow-[0_0_20px_rgba(251,191,36,0.3)]", bg: "from-amber-400/20 to-amber-400/5", text: "text-amber-400" },
  2: { border: "border-white/30", glow: "shadow-[0_0_12px_rgba(255,255,255,0.1)]", bg: "from-white/10 to-white/5", text: "text-white/80" },
  3: { border: "border-amber-600/40", glow: "shadow-[0_0_12px_rgba(180,83,9,0.2)]", bg: "from-amber-700/15 to-amber-700/5", text: "text-amber-600" },
};

function ScoreBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground/70">{label}</span>
        <span className="text-[11px] font-bold text-foreground tabular-nums">{score}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function EditDetailView({ sub, rank, onClose }: { sub: CompetitionSubmission; rank: number; onClose: () => void }) {
  const style = rankColors[rank] || { border: "border-white/[0.08]", glow: "", bg: "from-white/5 to-transparent", text: "text-muted-foreground" };
  
  // Derive QOI pillars from total score (mock breakdown for now)
  const total = sub.score ?? 0;
  const quality = Math.round(total * 0.3);
  const originality = Math.round(total * 0.35);
  const impact = total - quality - originality;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto"
    >
      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onClose} className="p-1">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="text-sm font-bold text-foreground truncate uppercase" style={teko}>
              #{rank} — @{sub.username}
            </span>
          </div>
          {sub.score !== null && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20">
              <span className="text-sm font-black text-amber-400 tabular-nums" style={teko}>{sub.score} <span className="text-[10px] text-amber-400/60">QOI</span></span>
            </div>
          )}
        </div>

        {/* Video area */}
        <div className="relative aspect-[9/16] max-h-[60vh] bg-black/50 flex items-center justify-center">
          <a
            href={sub.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-16 h-16 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center transition-transform active:scale-95"
          >
            <Play className="w-7 h-7 text-amber-400 ml-1" />
          </a>
          {sub.score !== null && (
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm border border-amber-400/20">
              <span className="text-2xl font-black text-amber-400 tabular-nums" style={teko}>{sub.score}</span>
              <span className="text-[10px] text-amber-400/50 ml-1" style={teko}>QOI</span>
            </div>
          )}
        </div>

        {/* Open on platform */}
        <a
          href={sub.submission_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="text-xs">Open on {sub.platform || "platform"}</span>
        </a>

        <div className="px-4 space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <Avatar className={`w-11 h-11 border-2 ${style.border}`}>
              <AvatarImage src={sub.avatar_url || ""} />
              <AvatarFallback className="text-sm bg-surface-1 font-bold">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <span className="text-sm font-bold text-foreground">@{sub.username}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground/50 uppercase">{sub.platform}</span>
                {rank === 1 && <Crown className="w-3 h-3 text-amber-400" />}
              </div>
            </div>
            {sub.is_winner && (
              <span className="text-xs font-bold text-amber-400">🏆 Winner</span>
            )}
          </div>

          {/* Voting (placeholder) */}
          <div className="flex items-center justify-center gap-4">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] transition-all active:scale-95">
              <ThumbsUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground tabular-nums">0</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] transition-all active:scale-95">
              <ThumbsDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground tabular-nums">0</span>
            </button>
          </div>

          {/* Score Breakdown */}
          {sub.score !== null && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-foreground">Score Breakdown</span>
                </div>
                <span className="text-xl font-black tabular-nums" style={{ ...teko, color: total >= 70 ? '#22c55e' : total >= 40 ? '#eab308' : '#ef4444' }}>
                  {total}/100
                </span>
              </div>
              <ScoreBar label="Quality" score={quality} max={30} color="#22d3ee" />
              <ScoreBar label="Originality" score={originality} max={35} color="#a78bfa" />
              <ScoreBar label="Impact" score={impact} max={35} color="#22c55e" />
            </div>
          )}

          {/* Status */}
          {sub.scored_at && (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-bold text-emerald-400">✓ SCORED</span>
              {sub.score !== null && (
                <span className="text-xs text-emerald-400/70">+{Math.round(sub.score * 0.3)} Index earned</span>
              )}
            </div>
          )}

          {/* Judge Notes */}
          {sub.judge_notes && (
            <div className="rounded-xl border border-white/[0.06] p-3 space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Judge Notes</span>
              <p className="text-xs text-foreground/80 leading-relaxed">{sub.judge_notes}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CompetitionLeaderboard({ submissions }: { submissions: CompetitionSubmission[] }) {
  const [selectedEdit, setSelectedEdit] = useState<{ sub: CompetitionSubmission; rank: number } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const sorted = [...submissions].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const topEdits = sorted.slice(0, 6);
  const visibleList = showAll ? sorted : sorted.slice(0, 5);

  const isEmpty = sorted.length === 0;

  return (
    <>
      <div className="space-y-3">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-[16px] font-extrabold uppercase tracking-[0.1em] text-foreground" style={teko}>
            Leaderboard
          </span>
          <span className="text-[11px] text-muted-foreground/40 ml-auto" style={teko}>{sorted.length} EDIT{sorted.length !== 1 ? "S" : ""}</span>
        </div>

        {isEmpty ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
              <Trophy className="w-5 h-5 text-muted-foreground/20" />
            </div>
            <p className="text-xs text-muted-foreground/40">No edits submitted yet — be the first to claim the top spot</p>
          </div>
        ) : (
        <>
        {/* ═══ TOP EDITS CAROUSEL ═══ */}
        <div
          ref={carouselRef}
          className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4"
        >
          {topEdits.map((sub, i) => {
            const rank = i + 1;
            const style = rankColors[rank] || { border: "border-white/[0.08]", glow: "", bg: "from-white/5 to-transparent", text: "text-muted-foreground" };
            
            return (
              <motion.button
                key={sub.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setSelectedEdit({ sub, rank })}
                className={`relative shrink-0 w-[130px] h-[185px] rounded-2xl overflow-hidden border ${style.border} ${style.glow} snap-start transition-transform active:scale-[0.96]`}
              >
                {/* BG gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b ${style.bg}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Rank badge */}
                <div className="absolute top-2 left-2 z-[2]">
                  <span className={`text-[28px] font-black leading-none ${style.text}`} style={teko}>
                    {rank}
                  </span>
                </div>

                {/* Crown for #1 */}
                {rank === 1 && (
                  <div className="absolute top-2 right-2 z-[2]">
                    <Crown className="w-4 h-4 text-amber-400 drop-shadow-lg" />
                  </div>
                )}

                {/* QOI Score */}
                {sub.score !== null && (
                  <div className="absolute top-2 right-2 z-[2]">
                    <span className="text-[13px] font-black text-amber-400 tabular-nums" style={teko}>
                      {sub.score}
                    </span>
                  </div>
                )}

                {/* Play icon center */}
                <div className="absolute inset-0 flex items-center justify-center z-[1]">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </div>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 z-[2]">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-5 h-5 border border-white/20">
                      <AvatarImage src={sub.avatar_url || ""} />
                      <AvatarFallback className="text-[7px] bg-surface-1 font-bold">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-bold text-white truncate">{sub.username}</span>
                  </div>
                  <span className="text-[8px] text-white/40 uppercase mt-0.5 block">{sub.platform}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* ═══ FULL RANKINGS LIST ═══ */}
        <div className="space-y-0">
          {visibleList.map((sub, i) => {
            const rank = i + 1;
            const style = rankColors[rank] || { border: "", glow: "", bg: "", text: "text-muted-foreground/40" };
            const isKing = rank === 1;

            return (
              <motion.button
                key={sub.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedEdit({ sub, rank })}
                className={`w-full flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0 text-left transition-all active:bg-white/[0.02] ${isKing ? 'bg-amber-400/[0.03]' : ''}`}
              >
                {/* Rank number */}
                <span className={`text-[28px] font-black w-8 text-center leading-none ${style.text}`} style={teko}>
                  {rank}
                </span>

                {/* Avatar */}
                <Avatar className={`w-8 h-8 border ${isKing ? 'border-amber-400/40' : 'border-white/10'}`}>
                  <AvatarImage src={sub.avatar_url || ""} />
                  <AvatarFallback className="text-[9px] bg-surface-2 font-bold">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground truncate">{sub.username}</span>
                    {isKing && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                  <span className="text-[9px] text-muted-foreground/40 uppercase">{sub.platform}</span>
                </div>

                {/* Score */}
                {sub.score !== null ? (
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-400 tabular-nums" style={teko}>{sub.score}</span>
                    <span className="text-[8px] text-amber-400/40 ml-0.5" style={teko}>QOI</span>
                  </div>
                ) : (
                  <span className="text-[9px] text-muted-foreground/30 uppercase">pending</span>
                )}

                {/* Play arrow */}
                <Play className="w-3 h-3 text-muted-foreground/30 shrink-0" />
              </motion.button>
            );
          })}
        </div>

        {/* Show more/less */}
        {sorted.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider hover:text-foreground/60 transition-colors"
            style={teko}
          >
            {showAll ? (
              <><ChevronUp className="w-3 h-3" /> Show Less</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> Show All ({sorted.length})</>
            )}
          </button>
        )}
      </div>

      {/* ═══ DETAIL OVERLAY ═══ */}
      <AnimatePresence>
        {selectedEdit && (
          <EditDetailView
            sub={selectedEdit.sub}
            rank={selectedEdit.rank}
            onClose={() => setSelectedEdit(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
