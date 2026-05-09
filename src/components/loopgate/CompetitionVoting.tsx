import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Check, Loader2, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CompetitionSubmission } from "@/hooks/useCompetitions";
import { toast } from "sonner";
import { useUnifiedThumbnail } from "@/lib/thumbnail";
import { useBattleAudioUnlock } from "@/hooks/useBattleAudioUnlock";

const teko = { fontFamily: "Teko, sans-serif" };
export const PER_EDIT_SECONDS = 15;

type Phase = "watching" | "voting" | "submitted";

interface Props {
  submissions: CompetitionSubmission[];
  myUserId: string | undefined;
  myVoteSubmissionId: string | null;
  onVote: (submissionId: string) => Promise<boolean>;
  /**
   * Server timestamp (ISO) when voting/showcase started. Used to synchronize
   * the 15s-per-edit playback across ALL viewers so everyone is on the same edit
   * at the same moment — this is a live event, not a personal queue.
   */
  votingStartedAt?: string | null;
  onClose?: () => void;
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

function isImageFile(url: string) {
  return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
}

/** Tile that resolves a thumbnail for non-direct video URLs (TikTok / IG / YT). */
function SubmissionTileMedia({ sub }: { sub: CompetitionSubmission }) {
  const direct = isDirectVideo(sub.submission_url);
  const image = isImageFile(sub.submission_url);
  const thumb = useUnifiedThumbnail(
    sub.submission_url,
    sub.platform || "",
    (sub as any).manual_thumbnail_url,
    (sub as any).thumbnail_url,
  );
  if (direct) {
    return (
      <video
        src={sub.submission_url}
        muted
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
    );
  }
  if (image) {
    return <img src={sub.submission_url} alt={`${sub.username} submission`} className="w-full h-full object-cover" loading="lazy" />;
  }
  return (
    <>
      <img
        src={thumb.url}
        alt={`${sub.username} thumbnail`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
        </div>
      </div>
    </>
  );
}

/** Watching-phase media for the active edit — shows thumbnail for non-direct URLs. */
function WatchingMedia({
  sub,
  videoRef,
}: {
  sub: CompetitionSubmission;
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  const direct = isDirectVideo(sub.submission_url);
  const image = isImageFile(sub.submission_url);
  const thumb = useUnifiedThumbnail(
    sub.submission_url,
    sub.platform || "",
    (sub as any).manual_thumbnail_url,
    (sub as any).thumbnail_url,
  );
  if (direct) {
    return (
      <video
        ref={videoRef}
        src={sub.submission_url}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        loop
        preload="auto"
      />
    );
  }
  if (image) {
    return (
      <img src={sub.submission_url} alt={`${sub.username} submission`} className="w-full h-full object-contain bg-black" />
    );
  }
  return (
    <a
      href={sub.submission_url}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute inset-0 block"
    >
      <img
        src={thumb.url}
        alt={`${sub.username} thumbnail`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400/60 backdrop-blur-md flex items-center justify-center">
          <Play className="w-9 h-9 text-amber-400 ml-1" fill="currentColor" />
        </div>
      </div>
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="text-xs text-white/80 uppercase tracking-wider" style={teko}>
          Tap to open on {sub.platform}
        </span>
      </div>
    </a>
  );
}

export default function CompetitionVoting({ submissions, myUserId, myVoteSubmissionId, onVote, votingStartedAt }: Props) {
  const audioUnlocked = useBattleAudioUnlock();
  // Order: stable by created_at then id
  const ordered = useMemo(
    () => [...submissions].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [submissions]
  );

  // ── SERVER-SYNCED CLOCK ───────────────────────────────────────────────
  // All clients derive the current edit index from voting_started_at so the
  // entire room sees the SAME edit at the SAME time. Showcase total length
  // = ordered.length * 15s. After that, everyone switches to voting.
  const startMs = votingStartedAt ? new Date(votingStartedAt).getTime() : null;
  const totalShowcaseMs = ordered.length * PER_EDIT_SECONDS * 1000;

  const computeFromClock = () => {
    if (!startMs) return { idx: 0, left: PER_EDIT_SECONDS, done: false };
    const elapsed = Math.max(0, Date.now() - startMs);
    if (elapsed >= totalShowcaseMs) return { idx: ordered.length - 1, left: 0, done: true };
    const idx = Math.min(ordered.length - 1, Math.floor(elapsed / (PER_EDIT_SECONDS * 1000)));
    const intoEdit = elapsed - idx * PER_EDIT_SECONDS * 1000;
    const left = Math.max(0, Math.ceil((PER_EDIT_SECONDS * 1000 - intoEdit) / 1000));
    return { idx, left, done: false };
  };

  const initial = computeFromClock();
  const [phase, setPhase] = useState<Phase>(
    !startMs || !initial.done ? "watching" : (myVoteSubmissionId ? "submitted" : "voting")
  );
  const [currentIdx, setCurrentIdx] = useState(initial.idx);
  const [secondsLeft, setSecondsLeft] = useState(initial.left);
  const [paused, setPaused] = useState(false);
  const [castingId, setCastingId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsSoundTap, setNeedsSoundTap] = useState(false);
  // Local re-watch mode — when true, ignore the server clock and advance locally.
  const [rewatching, setRewatching] = useState(false);

  const current = ordered[currentIdx];

  // When the current video changes, attempt unmuted autoplay.
  // If the browser blocks it, fall back to muted and prompt the user to tap for sound.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || phase !== "watching") return;
    v.muted = !audioUnlocked;
    v.defaultMuted = false;
    v.volume = 1;
    setNeedsSoundTap(false);
    const tryPlay = async () => {
      try {
        await v.play();
      } catch {
        v.muted = true;
        try { await v.play(); } catch {}
      }
    };
    tryPlay();
  }, [audioUnlocked, current?.id, currentIdx, phase]);

  // Sync pause toggle with the actual <video> element
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused]);

  // If a stale vote already exists, still force the showcase first. Only switch
  // after the server-synced 15s/edit window has passed.
  useEffect(() => {
    if (!myVoteSubmissionId || !startMs) return;
    if (Date.now() >= startMs + totalShowcaseMs) {
      setPhase(phase => phase === "watching" ? "voting" : phase);
    }
  }, [myVoteSubmissionId, startMs, totalShowcaseMs]);

  // SERVER-SYNCED TICKER — every 250ms recompute position from voting_started_at
  // so every viewer sees the same edit at the same moment. No local advance.
  useEffect(() => {
    if (phase !== "watching") return;
    // If user opted to re-watch, drive playback locally instead of from server clock.
    if (rewatching) {
      if (paused) return;
      const interval = setInterval(() => {
        setSecondsLeft(s => {
          if (s > 1) return s - 1;
          // advance to next edit, or end re-watch
          setCurrentIdx(idx => {
            if (idx + 1 >= ordered.length) {
              setRewatching(false);
              setPhase("voting");
              return idx;
            }
            return idx + 1;
          });
          return PER_EDIT_SECONDS;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
    if (!startMs) return; // fallback: stay on first edit until clock arrives
    const tick = () => {
      const { idx, left, done } = computeFromClock();
      if (done) {
        setPhase(p => (p === "watching" ? "voting" : p));
        return;
      }
      setCurrentIdx(prev => (prev !== idx ? idx : prev));
      setSecondsLeft(left);
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [phase, startMs, ordered.length, rewatching, paused]);

  // Empty state — voting should immediately close/finalize before this renders.
  if (ordered.length === 0) {
    return null;
  }

  // No skip — this is a synchronized live broadcast. Everyone watches together.

  const handleVote = async (submissionId: string) => {
    if (castingId) return;
    setCastingId(submissionId);
    const ok = await onVote(submissionId);
    setCastingId(null);
    if (ok) {
      setPhase("submitted");
      toast.success("Vote locked in 🔥");
    } else {
      toast.error("Couldn't cast vote");
    }
  };

  // ─────────── WATCHING PHASE ───────────
  if (phase === "watching" && current) {
    const direct = isDirectVideo(current.submission_url);
    const image = isImageFile(current.submission_url);
    const progressPct = ((PER_EDIT_SECONDS - secondsLeft) / PER_EDIT_SECONDS) * 100;

    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-red-400" style={teko}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live Showcase
            </span>
            <span className="text-foreground/30 text-[10px]">·</span>
            <span className="text-[10px] font-bold tabular-nums text-foreground/60" style={teko}>
              {currentIdx + 1}/{ordered.length}
            </span>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-foreground/40" style={teko}>
            Synced for everyone
          </span>
        </div>

        {/* Segmented progress bar (one per edit) */}
        <div className="flex gap-1">
          {ordered.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all"
                style={{
                  width: i < currentIdx ? '100%' : i === currentIdx ? `${progressPct}%` : '0%',
                  transitionDuration: i === currentIdx ? '1000ms' : '0ms',
                }}
              />
            </div>
          ))}
        </div>

        {/* Player */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative aspect-[9/16] max-h-[60vh] w-full rounded-2xl overflow-hidden bg-black border border-white/[0.06]"
          >
            <WatchingMedia sub={current} videoRef={videoRef} />

            {/* Overlay info */}
            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7 border border-white/20">
                  <AvatarImage src={current.avatar_url || ""} />
                  <AvatarFallback className="text-[9px] font-bold bg-surface-1">
                    {current.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold text-white">@{current.username}</span>
              </div>
              <div className="px-2 py-1 rounded-md bg-black/50 backdrop-blur-md border border-white/10">
                <span className="text-[12px] font-black text-amber-400 tabular-nums" style={teko}>
                  {secondsLeft}s
                </span>
              </div>
            </div>

            {/* Pause toggle */}
            <button
              onClick={() => setPaused(p => !p)}
              className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95"
              aria-label={paused ? "Resume" : "Pause"}
            >
              {paused ? <Play className="w-4 h-4 text-white ml-0.5" /> : <Pause className="w-4 h-4 text-white" />}
            </button>

          </motion.div>
        </AnimatePresence>

        <p className="text-[10px] text-center text-foreground/40 uppercase tracking-[0.2em]" style={teko}>
          Each edit plays for {PER_EDIT_SECONDS}s · then you'll vote
        </p>
      </div>
    );
  }

  // ─────────── VOTING PHASE ───────────
  if (phase === "voting") {
    return (
      <div className="space-y-3">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-amber-400" style={teko}>
            Pick The Best Edit
          </span>
          <h3 className="text-[26px] font-black uppercase tracking-tight leading-none text-foreground" style={teko}>
            Cast Your Vote
          </h3>
          <p className="text-[11px] text-foreground/50">One vote — choose wisely. You can't vote for yourself.</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {ordered.map((sub, i) => {
            const isSelf = sub.user_id === myUserId;
            const isMyVote = myVoteSubmissionId === sub.id;
            const isCasting = castingId === sub.id;

            return (
              <button
                key={sub.id}
                disabled={isSelf || !!castingId}
                onClick={() => handleVote(sub.id)}
                className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all active:scale-[0.97] ${
                  isMyVote
                    ? "border-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.35)]"
                    : isSelf
                    ? "border-white/[0.04] opacity-40 cursor-not-allowed"
                    : "border-white/[0.08] hover:border-amber-400/60"
                }`}
              >
                <SubmissionTileMedia sub={sub} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

                {/* Number badge */}
                <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <span className="text-[12px] font-black text-white leading-none" style={teko}>{i + 1}</span>
                </div>

                {/* Self badge */}
                {isSelf && (
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 border border-white/10">
                    <span className="text-[8px] font-extrabold uppercase tracking-wider text-white/70" style={teko}>You</span>
                  </div>
                )}

                {/* My vote check */}
                {isMyVote && (
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-500 border border-white/30 flex items-center justify-center">
                    {isCasting ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                )}

                {/* Username */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-5 h-5 border border-white/20">
                      <AvatarImage src={sub.avatar_url || ""} />
                      <AvatarFallback className="text-[8px] font-bold bg-surface-1">
                        {sub.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-bold text-white truncate">@{sub.username}</span>
                  </div>
                </div>

                {isCasting && !isMyVote && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setRewatching(true);
            setCurrentIdx(0);
            setSecondsLeft(PER_EDIT_SECONDS);
            setPaused(false);
            setPhase("watching");
          }}
          className="w-full py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[11px] font-extrabold uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground hover:bg-white/[0.05] transition"
          style={teko}
        >
          Re-watch Edits
        </button>
      </div>
    );
  }

  // ─────────── SUBMITTED PHASE — live tally ───────────
  const sortedByVotes = [...submissions].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
  const totalVotes = sortedByVotes.reduce((s, x) => s + (x.vote_count || 0), 0);

  return (
    <div className="space-y-3">
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-400" style={teko}>
            Vote Locked In
          </span>
        </div>
        <h3 className="text-[22px] font-black uppercase leading-none text-foreground" style={teko}>
          Live Tally
        </h3>
        <p className="text-[11px] text-foreground/50">{totalVotes} vote{totalVotes !== 1 ? "s" : ""} so far</p>
      </div>

      <div className="space-y-1.5">
        {sortedByVotes.map((sub, i) => {
          const votes = sub.vote_count || 0;
          const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          const isMyVote = myVoteSubmissionId === sub.id;
          const isLeader = i === 0 && votes > 0;

          return (
            <div
              key={sub.id}
              className={`relative rounded-xl border overflow-hidden ${
                isLeader ? "border-amber-400/40 bg-amber-400/[0.04]" : "border-white/[0.06] bg-white/[0.015]"
              }`}
            >
              <div
                className="absolute inset-y-0 left-0 transition-all"
                style={{ width: `${pct}%`, background: isLeader ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.04)" }}
              />
              <div className="relative flex items-center gap-2.5 px-3 py-2.5">
                <span className={`text-[20px] font-black w-6 text-center leading-none ${isLeader ? "text-amber-400" : "text-foreground/40"}`} style={teko}>
                  {i + 1}
                </span>
                <Avatar className={`w-8 h-8 border ${isLeader ? "border-amber-400/50" : "border-white/10"}`}>
                  <AvatarImage src={sub.avatar_url || ""} />
                  <AvatarFallback className="text-[9px] font-bold bg-surface-1">
                    {sub.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground truncate">@{sub.username}</span>
                    {isLeader && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                    {isMyVote && (
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-400" style={teko}>· Your Pick</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-foreground tabular-nums" style={teko}>{votes}</span>
                  <span className="text-[9px] text-foreground/40 ml-0.5" style={teko}>VOTE{votes !== 1 ? "S" : ""}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}