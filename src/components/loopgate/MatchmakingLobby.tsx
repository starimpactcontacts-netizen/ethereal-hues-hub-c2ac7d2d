import { motion, AnimatePresence } from "framer-motion";
import { Swords, X, Users, Share2, Eye, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOpenQuickFightQueue } from "@/hooks/useQuickFight";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { setLobbyMusicActive } from "./LobbyMusicPlayer";

interface MatchmakingLobbyProps {
  open: boolean;
  elapsedSec: number;
  currentUserId?: string;
  onCancel: () => void;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MatchmakingLobby({ open, elapsedSec, currentUserId, onCancel }: MatchmakingLobbyProps) {
  const { entries } = useOpenQuickFightQueue();
  const { profile } = useAuth();
  const others = entries.filter((e) => e.user_id !== currentUserId);
  const me = entries.find((e) => e.user_id === currentUserId);

  const myUsername = me?.username || profile?.username || "YOU";
  const myAvatar = me?.avatar_url || profile?.avatar_url || "";

  const infoLines = [
    "Lobby fills to 10/10 — winner earns rings!",
    "At max capacity, battle auto-starts instantly",
    "Winner gets +50 — loser drops 10 rings",
    "Invite friends to fill the lobby faster",
  ];
  const [infoIdx, setInfoIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    setLobbyMusicActive(true);
    return () => setLobbyMusicActive(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setInfoIdx((i) => (i + 1) % infoLines.length), 4000);
    return () => clearInterval(id);
  }, [open, infoLines.length]);

  const handleInvite = async () => {
    const url = `${window.location.origin}/arena?invite=1v1`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "1v1 Edit Battle", text: "Tap in — I'm in queue right now", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Invite link copied");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Invite link copied");
      } catch {
        toast.error("Couldn't copy link");
      }
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[2147483646] flex flex-col bg-background overflow-y-auto"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* Top bar — minimal, mirrors BattleDetailPage */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close matchmaking"
            >
              <X className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider" style={{ fontFamily: "Teko, sans-serif" }}>
                Arena
              </span>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-zinc-500">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs tabular-nums">{others.length + 1}</span>
              </div>
              <button
                onClick={handleInvite}
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ═══ HEADER CARD — same look as BattleDetailPage OPEN CHALLENGE ═══ */}
          <div
            className="mx-4 mt-2 rounded-2xl p-5 relative overflow-hidden"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(239,68,68,0.18), rgba(0,0,0,0) 60%), linear-gradient(180deg, #18181b 0%, #0a0a0a 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Status row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span
                  className="text-[11px] font-black text-white uppercase tracking-[0.22em]"
                  style={{ fontFamily: "Teko, sans-serif" }}
                >
                  Open Challenge
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono tabular-nums">{fmt(elapsedSec)}</span>
            </div>

            {/* Avatars vs ??? */}
            <div className="flex items-center justify-between gap-2">
              {/* You */}
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <div className="absolute -inset-1 rounded-full opacity-40 blur-md bg-red-500/50" />
                  <div className="relative p-[2px] rounded-full bg-gradient-to-br from-red-500/70 to-red-800/70">
                    <Avatar className="w-[72px] h-[72px] border-2 border-background rounded-full">
                      <AvatarImage src={myAvatar} />
                      <AvatarFallback className="bg-red-500/15 text-red-400 text-xl font-bold">
                        {myUsername.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span
                  className="text-[14px] font-bold text-white uppercase tracking-wide"
                  style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.08em" }}
                >
                  {myUsername}
                </span>
                <span className="text-[8px] text-red-400/70 font-bold uppercase tracking-[0.15em] mt-1">YOU</span>
              </div>

              {/* VS Center — pulsing radar swords */}
              <div className="relative shrink-0 mx-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border border-red-500/30"
                    initial={{ scale: 0.5, opacity: 0.7 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
                  />
                ))}
                <div className="relative w-[52px] h-[52px] rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                  <Swords className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Info Ticker */}
              <div className="flex-1 flex flex-col items-center justify-center text-center min-w-0 px-1">
                <div className="relative mb-2">
                  <div className="w-[72px] h-[72px] rounded-full border border-white/[0.06] bg-white/[0.03] flex items-center justify-center">
                    <Info className="w-6 h-6 text-white/40" />
                  </div>
                </div>
                <div className="h-8 overflow-hidden w-full">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={infoIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.35 }}
                      className="block text-[11px] font-bold text-white/80 leading-tight"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {infoLines[infoIdx]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Matchup text */}
            <p className="text-center text-[11px] text-zinc-500 mt-4 tracking-wide">
              Open Challenge — anyone can jump in
            </p>
          </div>

          {/* ═══ STAKES STRIP ═══ */}
          <div className="px-4 mt-3">
            <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span
                    className="text-xl font-bold text-emerald-400 tabular-nums"
                    style={{ fontFamily: "Teko, sans-serif" }}
                  >
                    +50
                  </span>
                  <span className="text-[8px] text-zinc-500 block uppercase tracking-[0.2em] mt-0.5">WINNER</span>
                </div>
                <div>
                  <span
                    className="text-xl font-bold text-red-400 tabular-nums"
                    style={{ fontFamily: "Teko, sans-serif" }}
                  >
                    -10
                  </span>
                  <span className="text-[8px] text-zinc-500 block uppercase tracking-[0.2em] mt-0.5">LOSER</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-white tabular-nums" style={{ fontFamily: "Teko, sans-serif" }}>
                    1V1
                  </span>
                  <span className="text-[8px] text-zinc-500 block uppercase tracking-[0.2em] mt-0.5">RAPID</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ INVITE CHALLENGERS — same as BattleDetailPage ═══ */}
          <div className="px-4 mt-3">
            <button
              onClick={handleInvite}
              className="w-full py-3.5 rounded-xl border border-red-500/25 text-red-400 hover:bg-red-500/5 transition-colors text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Users className="w-4 h-4" />
              INVITE CHALLENGERS
            </button>
          </div>

          {/* ═══ OTHERS IN QUEUE ═══ */}
          <div className="px-4 mt-4">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Users className="w-3 h-3 text-white/40" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-bold">
                {others.length > 0 ? `${others.length} also searching` : "You're first in queue"}
              </span>
            </div>
            {others.length > 0 ? (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2 space-y-0.5">
                {others.slice(0, 8).map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-2 py-2 rounded-lg">
                    <Avatar className="w-9 h-9 ring-1 ring-white/10">
                      <AvatarImage src={e.avatar_url || ""} />
                      <AvatarFallback className="text-xs font-bold bg-zinc-800 text-zinc-300">
                        {e.username?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white/90 truncate" style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.04em" }}>
                        {e.username}
                      </p>
                      <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-bold">In queue</p>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-4 text-center">
                <p className="text-[11px] text-white/40 leading-relaxed">
                  No one else in queue right now. Tap Invite Challengers for an instant 1v1.
                </p>
              </div>
            )}
          </div>

          {/* Bottom — Cancel */}
          <div className="px-4 pt-4 pb-6 mt-auto">
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 border border-zinc-800 bg-zinc-950/60 hover:text-red-400 hover:border-red-500/30 active:scale-[0.98] transition-colors"
              style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.18em" }}
            >
              Cancel Search
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
