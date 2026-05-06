import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, Copy, Swords, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOpenQuickFightQueue } from "@/hooks/useQuickFight";
import { toast } from "sonner";
import { useEffect } from "react";
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
  const others = entries.filter((e) => e.user_id !== currentUserId);

  // Toggle lobby music while this full-screen lobby is open
  useEffect(() => {
    if (!open) return;
    setLobbyMusicActive(true);
    return () => setLobbyMusicActive(false);
  }, [open]);

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
          className="fixed inset-0 z-[2147483646] flex flex-col"
          style={{
            background: "radial-gradient(circle at 50% 35%, rgba(59,130,246,0.18), rgba(0,0,0,0.96) 60%), #000000",
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3b82f6,#ef4444)" }}>
                <Swords className="w-4 h-4 text-white" />
              </div>
              <span className="text-[13px] font-black uppercase tracking-[0.18em] text-white" style={{ fontFamily: "Teko, sans-serif" }}>
                Matchmaking
              </span>
            </div>
            <button
              onClick={onCancel}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 active:scale-95 transition-transform"
              aria-label="Close matchmaking"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>

          {/* Radar */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="relative w-56 h-56 flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-emerald-400/30"
                  initial={{ scale: 0.4, opacity: 0.6 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
                />
              ))}
              <div className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center" style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(59,130,246,0.18))",
                border: "1px solid rgba(16,185,129,0.4)",
                boxShadow: "0 0 40px -8px rgba(16,185,129,0.5)",
              }}>
                <Loader2 className="w-9 h-9 text-emerald-300 animate-spin" />
              </div>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-[28px] font-black uppercase text-white leading-none" style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.04em" }}>
                Finding Opponent
              </h2>
              <p className="text-[12px] text-white/50 mt-1.5">
                Searching for a 1v1 match · <span className="text-emerald-400 font-mono">{fmt(elapsedSec)}</span>
              </p>
            </div>

            {/* Other editors in queue */}
            <div className="w-full max-w-sm mt-7">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Users className="w-3 h-3 text-white/40" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-bold">
                  {others.length > 0 ? `${others.length} also searching` : "You're first in queue"}
                </span>
              </div>
              {others.length > 0 ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2 max-h-44 overflow-y-auto">
                  {others.slice(0, 8).map((e) => (
                    <div key={e.id} className="flex items-center gap-3 px-2 py-2 rounded-lg">
                      <Avatar className="w-8 h-8 ring-1 ring-white/10">
                        <AvatarImage src={e.avatar_url || ""} />
                        <AvatarFallback className="text-[10px] font-bold bg-zinc-800 text-zinc-300">
                          {e.username?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-white/90 truncate">{e.username}</p>
                        <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-bold">In queue</p>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-4 text-center">
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    No one else in queue right now. Invite a friend for an instant 1v1.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-5 pb-5 pt-3 space-y-2.5">
            <button
              onClick={handleInvite}
              className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-[0.16em] text-white active:scale-[0.98] transition-transform"
              style={{
                background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 24px -10px rgba(59,130,246,0.6)",
                fontFamily: "Teko, sans-serif",
              }}
            >
              <Copy className="w-3.5 h-3.5" />
              Invite Friend
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.18em] text-red-400/90 border border-red-500/25 bg-red-500/[0.06] active:scale-[0.98] transition-transform"
              style={{ fontFamily: "Teko, sans-serif" }}
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
