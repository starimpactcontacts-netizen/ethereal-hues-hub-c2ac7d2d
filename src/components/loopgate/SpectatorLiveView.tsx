import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, Lock, Vote, Trophy, Clock } from "lucide-react";
import { differenceInSeconds } from "date-fns";

const teko = { fontFamily: "Teko, sans-serif" };

function buzz(pattern: number | number[] = [40, 60, 40]) {
  try { (navigator as any).vibrate?.(pattern); } catch {}
}

function Countdown({ target, label }: { target: string; label: string }) {
  const [r, setR] = useState(() => Math.max(0, differenceInSeconds(new Date(target), new Date())));
  useEffect(() => {
    const i = setInterval(() => setR(Math.max(0, differenceInSeconds(new Date(target), new Date()))), 500);
    return () => clearInterval(i);
  }, [target]);
  const h = Math.floor(r / 3600);
  const m = Math.floor((r % 3600) / 60);
  const s = r % 60;
  const text = h > 0
    ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40" style={teko}>{label}</span>
      <span className="text-6xl font-black tabular-nums tracking-tight text-white" style={teko}>{text}</span>
    </div>
  );
}

interface Props {
  status: "live" | "voting" | "completed";
  isPrivate: boolean;
  isShowcasePhase: boolean; // voting + showcase still playing
  competitionName: string;
  competitionDeadline: string | null;
  participantsCount: number;
  submittedCount: number;
}

/**
 * Spectator-only view shown to non-participants once a competition has left the lobby.
 * - private rooms: hard block + buzz nudge, can't open
 * - live (still editing): countdown until showcase begins
 * - voting (after showcase plays): "voting in progress" gate
 * - completed: brief winner-reveal handoff, auto-kicks to arena
 */
export default function SpectatorLiveView({
  status, isPrivate, isShowcasePhase, competitionName,
  competitionDeadline, participantsCount, submittedCount,
}: Props) {
  const navigate = useNavigate();

  // Private comp — buzz and bounce out
  useEffect(() => {
    if (!isPrivate) return;
    buzz([60, 80, 60, 80, 120]);
    const t = setTimeout(() => navigate("/arena"), 2200);
    return () => clearTimeout(t);
  }, [isPrivate, navigate]);

  // Auto-kick after winner reveal
  useEffect(() => {
    if (status !== "completed") return;
    const t = setTimeout(() => navigate("/arena"), 6000);
    return () => clearTimeout(t);
  }, [status, navigate]);

  if (isPrivate) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black px-6 text-center overflow-hidden">
        <motion.div
          animate={{ x: [0, -8, 8, -6, 6, 0] }}
          transition={{ duration: 0.55 }}
          className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5"
        >
          <Lock className="w-9 h-9 text-fuchsia-400" />
        </motion.div>
        <h1 className="text-[28px] font-black uppercase tracking-tight text-white" style={teko}>Private Room</h1>
        <p className="mt-1 text-[12px] text-white/50 max-w-xs">
          This battle is locked to invited editors only. Respect the room — bouncing you back.
        </p>
      </div>
    );
  }

  // ─── voting modal (after showcase plays through) ───
  if (status === "voting" && !isShowcasePhase) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black px-6 text-center overflow-hidden">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm rounded-3xl border border-amber-400/30 bg-gradient-to-b from-amber-500/10 to-black p-7"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center mb-4">
            <Vote className="w-7 h-7 text-amber-300" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300/80 mb-1.5" style={teko}>Voting In Progress</p>
          <h1 className="text-[26px] font-black uppercase leading-none text-white tracking-tight" style={teko}>
            {competitionName}
          </h1>
          <p className="mt-3 text-[12.5px] text-white/55 leading-relaxed">
            Editors are picking the winner right now. Hang tight — winner reveal drops in seconds.
          </p>
          <button
            onClick={() => navigate("/arena")}
            className="mt-5 w-full py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white/70 text-[11px] font-extrabold uppercase tracking-[0.2em]"
            style={teko}
          >
            Back to Arena
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── completed — auto kick spectators after a beat ───
  if (status === "completed") {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black px-6 text-center overflow-hidden">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-amber-300" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300/80 mb-1.5" style={teko}>Battle Over</p>
          <h1 className="text-[24px] font-black uppercase text-white tracking-tight leading-none" style={teko}>{competitionName}</h1>
          <p className="mt-2 text-[12px] text-white/45">Winner crowned. Heading back to the arena…</p>
        </motion.div>
      </div>
    );
  }

  // ─── live — waiting for showcase to start ───
  // Editors might submit early but spectators can't peek before deadline.
  return (
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden">
      <header className="shrink-0 px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg active:scale-95">
            <ArrowLeft className="w-[18px] h-[18px] text-white/70" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-400/80" style={teko}>Spectating · Live</p>
            <h1 className="text-[20px] font-black uppercase truncate text-white tracking-tight leading-none" style={teko}>{competitionName}</h1>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/10 bg-white/[0.04] text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/60" style={teko}>
            <Eye className="w-3 h-3" /> Watch
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5">
            <Clock className="w-7 h-7 text-white/70" />
          </div>
          {competitionDeadline ? (
            <Countdown target={competitionDeadline} label="Showcase Drops In" />
          ) : (
            <p className="text-[14px] text-white/60">Showcase starts soon</p>
          )}
          <p className="mt-5 text-[12.5px] text-white/45 leading-relaxed">
            Editors are heads-down right now. The moment the timer hits zero, every edit plays back here in sequence — and you'll get to hype them up.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04]">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60" style={teko}>
              {submittedCount}/{participantsCount} Submitted
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}