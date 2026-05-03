import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X } from "lucide-react";
import decidedSfx from "@/assets/sounds/battle-decided.mp3";

const teko = { fontFamily: "Teko, sans-serif" };

interface Props {
  active: boolean;
  winnerUsername: string;
  winnerAvatarUrl?: string | null;
  winnerColor: "red" | "blue";
  loserUsername?: string;
  /** Called when overlay finishes auto-dismiss */
  onDismiss?: () => void;
}

/**
 * Cinematic "BATTLE DECIDED" reveal — darkens the screen, plays the
 * RDR2-style stinger SFX, and stamps the winner. Designed to be screen-
 * recorded and posted on TikTok/IG for viral reach.
 */
export default function BattleDecidedOverlay({
  active,
  winnerUsername,
  winnerAvatarUrl,
  winnerColor,
  loserUsername,
  onDismiss,
}: Props) {
  const [show, setShow] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!active || triggeredRef.current) return;
    triggeredRef.current = true;
    setShow(true);
    // Play stinger
    try {
      const a = new Audio(decidedSfx);
      a.volume = 0.95;
      audioRef.current = a;
      a.play().catch(() => {});
    } catch {}
    // Auto-dismiss after the sting + reveal (~6s)
    const t = setTimeout(() => {
      setShow(false);
      onDismiss?.();
    }, 6000);
    return () => {
      clearTimeout(t);
      audioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const accent = winnerColor === "red" ? "#ef4444" : "#3b82f6";
  const accentSoft = winnerColor === "red" ? "rgba(239,68,68,0.55)" : "rgba(59,130,246,0.55)";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="decided"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          onClick={() => {
            setShow(false);
            audioRef.current?.pause();
            onDismiss?.();
          }}
        >
          {/* Dismiss */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShow(false);
              audioRef.current?.pause();
              onDismiss?.();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 45%, ${accentSoft} 0%, transparent 55%)`,
            }}
          />

          <div className="relative flex flex-col items-center gap-5 px-6 text-center">
            {/* Verdict label */}
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="px-3 py-1 rounded-full border"
              style={{
                borderColor: "rgba(252,211,77,0.5)",
                background: "rgba(252,211,77,0.08)",
              }}
            >
              <span
                className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-300"
                style={teko}
              >
                ⚔ Battle Decided
              </span>
            </motion.div>

            {/* WINNER headline */}
            <motion.h1
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.15 }}
              className="leading-none"
              style={{
                ...teko,
                fontSize: "84px",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "0.04em",
                textShadow: `0 0 28px ${accentSoft}, 0 4px 0 rgba(0,0,0,0.6)`,
                WebkitTextStroke: "1px rgba(255,255,255,0.15)",
              }}
            >
              WINNER
            </motion.h1>

            {/* Avatar + name */}
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.45 }}
              className="flex flex-col items-center gap-3"
            >
              <div
                className="relative rounded-full p-[3px]"
                style={{
                  background: `linear-gradient(135deg, #fcd34d, ${accent}, #fcd34d)`,
                  boxShadow: `0 0 32px ${accentSoft}`,
                }}
              >
                <div className="w-[110px] h-[110px] rounded-full overflow-hidden bg-black border-2 border-black flex items-center justify-center">
                  {winnerAvatarUrl ? (
                    <img
                      src={winnerAvatarUrl}
                      alt={winnerUsername}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <span style={{ ...teko, fontSize: 48, fontWeight: 900, color: "rgba(255,255,255,0.6)" }}>
                      {winnerUsername?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "#fcd34d", color: "#000" }}
                >
                  <Crown className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={teko}>
                    Champ
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="text-[34px] font-black text-white uppercase leading-none"
                  style={{ ...teko, letterSpacing: "0.05em", textShadow: "0 2px 0 rgba(0,0,0,0.6)" }}
                >
                  @{winnerUsername}
                </span>
              </div>

              {loserUsername && (
                <p
                  className="text-[10px] uppercase tracking-[0.35em] text-white/55"
                  style={teko}
                >
                  Defeated <span className="text-white/80">@{loserUsername}</span>
                </p>
              )}
            </motion.div>

            <p className="text-[9px] uppercase tracking-[0.35em] text-white/40 mt-2" style={teko}>
              Tap to dismiss
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
