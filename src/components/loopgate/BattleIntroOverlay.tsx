import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import battleIntroSfx from '@/assets/sounds/battle-intro.m4a';

interface BattleIntroOverlayProps {
  fightId: string;
  active: boolean;
  onComplete?: () => void;
}

// Timestamps tuned to the Smash Bros "3, 2, 1, GO!" SFX spikes (seconds)
const CUES: { at: number; label: string; color: string }[] = [
  { at: 300,  label: '3',   color: '#ef4444' },
  { at: 1000, label: '2',   color: '#f59e0b' },
  { at: 1700, label: '1',   color: '#3b82f6' },
  { at: 2400, label: 'GO!', color: '#22c55e' },
];
const TOTAL_MS = 3200;

export default function BattleIntroOverlay({ fightId, active, onComplete }: BattleIntroOverlayProps) {
  const [currentCue, setCurrentCue] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!active) return;
    const key = `battle-intro-played:${fightId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    setRunning(true);
    setCurrentCue(-1);

    // Play the SFX
    const a = new Audio(battleIntroSfx);
    a.volume = 0.95;
    audioRef.current = a;
    a.play().catch(() => {});

    // Schedule cue swaps
    CUES.forEach((cue, i) => {
      const t = setTimeout(() => setCurrentCue(i), cue.at);
      timersRef.current.push(t);
    });

    const end = setTimeout(() => {
      setRunning(false);
      setCurrentCue(-1);
      onComplete?.();
    }, TOTAL_MS);
    timersRef.current.push(end);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, fightId]);

  if (!running) return null;
  const cue = currentCue >= 0 ? CUES[currentCue] : null;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center">
      {/* Slightly transparent backdrop — dims video without full blackout */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      {/* FNF-style number/word */}
      <AnimatePresence mode="popLayout">
        {cue && (
          <motion.div
            key={`cue-${currentCue}`}
            initial={{ scale: 0.2, rotate: -12, opacity: 0 }}
            animate={{ scale: [0.2, 1.25, 1], rotate: [-12, 6, 0], opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0, y: -40 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative select-none"
          >
            <div
              className="font-black tracking-tighter"
              style={{
                fontFamily: 'Teko, "Arial Black", sans-serif',
                fontSize: cue.label === 'GO!' ? '13rem' : '11rem',
                lineHeight: 1,
                color: cue.color,
                WebkitTextStroke: '4px #000',
                textShadow: `6px 6px 0 #000`,
                transform: 'skewX(-6deg) translateZ(0)',
                willChange: 'transform, opacity',
              }}
            >
              {cue.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
