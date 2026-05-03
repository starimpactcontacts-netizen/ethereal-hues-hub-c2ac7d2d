import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, Swords } from "lucide-react";
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferPromiseRef = useRef<Promise<AudioBuffer | null> | null>(null);
  const unlockedRef = useRef(false);
  const retryPlayRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const a = new Audio(decidedSfx);
    a.preload = "auto";
    a.volume = 1;
    a.muted = false;
    audioRef.current = a;

    const getAudioContext = () => {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return null;
      if (!audioContextRef.current) audioContextRef.current = new AudioCtor();
      return audioContextRef.current;
    };

    const decodeSfx = () => {
      if (audioBufferRef.current) return Promise.resolve(audioBufferRef.current);
      if (bufferPromiseRef.current) return bufferPromiseRef.current;
      const ctx = getAudioContext();
      if (!ctx) return Promise.resolve(null);
      bufferPromiseRef.current = fetch(decidedSfx)
        .then((res) => res.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data.slice(0)))
        .then((buffer) => {
          audioBufferRef.current = buffer;
          return buffer;
        })
        .catch(() => null);
      return bufferPromiseRef.current;
    };

    a.load();
    decodeSfx();

    const unlock = () => {
      const ctx = getAudioContext();
      ctx?.resume().catch(() => {});
      decodeSfx();
      if (unlockedRef.current || !audioRef.current) return;
      const el = audioRef.current;
      const originalVolume = el.volume;
      el.volume = 0;
      el.muted = true;
      el.play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.muted = false;
          el.volume = originalVolume;
          unlockedRef.current = true;
        })
        .catch(() => {
          el.muted = false;
          el.volume = originalVolume;
        });
    };

    window.addEventListener("pointerdown", unlock, { capture: true });
    window.addEventListener("touchstart", unlock, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("touchstart", unlock, { capture: true });
      a.pause();
      sourceRef.current?.stop();
      audioContextRef.current?.close().catch(() => {});
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!active) {
      setShow(false);
      audioRef.current?.pause();
      try { sourceRef.current?.stop(); } catch {}
      retryPlayRef.current = null;
      return;
    }

    setShow(true);

    const muteEverythingExcept = (stinger: HTMLAudioElement) => {
      document.querySelectorAll("video, audio").forEach((media) => {
        if (media === stinger) return;
        const el = media as HTMLMediaElement;
        el.muted = true;
        el.pause();
      });
    };

    const playStinger = () => {
      const a = audioRef.current ?? new Audio(decidedSfx);
      audioRef.current = a;
      a.volume = 1;
      a.muted = false;
      muteEverythingExcept(a);

      const playDecoded = () => {
        const ctx = audioContextRef.current;
        const buffer = audioBufferRef.current;
        if (!ctx || !buffer) return false;
        sourceRef.current?.stop();
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = 1;
        source.connect(gain).connect(ctx.destination);
        sourceRef.current = source;
        ctx.resume().then(() => source.start(0)).catch(() => retryPlayRef.current = attempt);
        return true;
      };

      const attempt = () => {
        if (playDecoded()) return;
        a.muted = false;
        a.volume = 1;
        a.currentTime = 0;
        a.play().catch(() => {
          retryPlayRef.current = attempt;
        });
      };

      retryPlayRef.current = attempt;
      attempt();
    };

    playStinger();

    const forceRetry = () => retryPlayRef.current?.();
    window.addEventListener("pointerdown", forceRetry, { capture: true });
    window.addEventListener("touchstart", forceRetry, { capture: true });
    // Auto-dismiss after the sting + reveal (~6s)
    const t = setTimeout(() => {
      setShow(false);
      audioRef.current?.pause();
      try { sourceRef.current?.stop(); } catch {}
      onDismiss?.();
    }, 6000);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", forceRetry, { capture: true });
      window.removeEventListener("touchstart", forceRetry, { capture: true });
      audioRef.current?.pause();
      try { sourceRef.current?.stop(); } catch {}
      retryPlayRef.current = null;
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
            try { sourceRef.current?.stop(); } catch {}
            onDismiss?.();
          }}
        >
          {/* Dismiss */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShow(false);
              audioRef.current?.pause();
              try { sourceRef.current?.stop(); } catch {}
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
            {/* Verdict badge — proper crest/shield design */}
            <motion.div
              initial={{ y: -16, opacity: 0, scale: 0.85 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.45, type: "spring", stiffness: 260, damping: 18 }}
              className="relative flex items-center"
            >
              {/* Left wing */}
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-amber-300/70" />
              {/* Core badge */}
              <div
                className="relative flex items-center gap-2 px-4 py-1.5 mx-2"
                style={{
                  background:
                    "linear-gradient(180deg, #1a1306 0%, #0a0703 100%)",
                  border: "1px solid rgba(252,211,77,0.55)",
                  boxShadow:
                    "inset 0 1px 0 rgba(252,211,77,0.25), 0 0 18px rgba(252,211,77,0.18)",
                  clipPath:
                    "polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)",
                }}
              >
                <Swords className="w-3 h-3 text-amber-300" strokeWidth={2.5} />
                <span
                  className="text-[11px] font-black uppercase tracking-[0.45em] text-amber-300"
                  style={{ ...teko, textShadow: "0 0 10px rgba(252,211,77,0.5)" }}
                >
                  Battle Decided
                </span>
                <Swords className="w-3 h-3 text-amber-300 scale-x-[-1]" strokeWidth={2.5} />
              </div>
              {/* Right wing */}
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-300/70" />
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
