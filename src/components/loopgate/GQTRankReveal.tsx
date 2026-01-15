import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRankFromScore, GQTRank } from '@/data/gqtConfig';

interface GQTRankRevealProps {
  score: number;
  username: string;
  onComplete: () => void;
}

// Particle effect component
const Particles = ({ color, count = 30 }: { color: string; count?: number }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{
          x: '50%',
          y: '50%',
          scale: 0,
          opacity: 1,
        }}
        animate={{
          x: `${Math.random() * 100}%`,
          y: `${Math.random() * 100}%`,
          scale: [0, 1, 0],
          opacity: [1, 1, 0],
        }}
        transition={{
          duration: 2 + Math.random() * 1,
          delay: 0.3 + Math.random() * 0.5,
          ease: 'easeOut',
        }}
        className={`absolute w-1 h-1 rounded-full ${color}`}
        style={{ left: '50%', top: '50%' }}
      />
    ))}
  </div>
);

// Rank-based visual styling
const getRankVisuals = (rank: GQTRank) => {
  switch (rank) {
    case 'S++':
      return {
        bgClass: 'bg-gradient-to-br from-gold/40 via-amber-500/30 to-gold/20',
        textClass: 'text-gold',
        glowClass: 'shadow-[0_0_100px_30px_rgba(212,175,55,0.5)]',
        borderClass: 'border-gold',
        particleColor: 'bg-gold',
        hasAura: true,
        hasGlyphs: true,
      };
    case 'S+':
      return {
        bgClass: 'bg-gradient-to-br from-gold/30 via-amber-400/20 to-gold/10',
        textClass: 'text-gold',
        glowClass: 'shadow-[0_0_80px_20px_rgba(212,175,55,0.4)]',
        borderClass: 'border-gold/80',
        particleColor: 'bg-gold',
        hasAura: true,
        hasGlyphs: false,
      };
    case 'S':
      return {
        bgClass: 'bg-gradient-to-br from-amber-400/25 via-amber-500/15 to-amber-400/10',
        textClass: 'text-amber-400',
        glowClass: 'shadow-[0_0_60px_15px_rgba(251,191,36,0.3)]',
        borderClass: 'border-amber-400',
        particleColor: 'bg-amber-400',
        hasAura: false,
        hasGlyphs: false,
      };
    case 'A':
      return {
        bgClass: 'bg-gradient-to-br from-emerald-400/20 to-emerald-400/5',
        textClass: 'text-emerald-400',
        glowClass: 'shadow-[0_0_40px_10px_rgba(52,211,153,0.2)]',
        borderClass: 'border-emerald-400',
        particleColor: 'bg-emerald-400',
        hasAura: false,
        hasGlyphs: false,
      };
    case 'B':
      return {
        bgClass: 'bg-gradient-to-br from-blue-400/20 to-blue-400/5',
        textClass: 'text-blue-400',
        glowClass: '',
        borderClass: 'border-blue-400',
        particleColor: 'bg-blue-400',
        hasAura: false,
        hasGlyphs: false,
      };
    case 'C':
      return {
        bgClass: 'bg-gradient-to-br from-slate-400/15 to-slate-400/5',
        textClass: 'text-slate-300',
        glowClass: '',
        borderClass: 'border-slate-400',
        particleColor: 'bg-slate-400',
        hasAura: false,
        hasGlyphs: false,
      };
    case 'D':
      return {
        bgClass: 'bg-gradient-to-br from-orange-500/15 to-orange-500/5',
        textClass: 'text-orange-400',
        glowClass: '',
        borderClass: 'border-orange-500/50',
        particleColor: 'bg-orange-400',
        hasAura: false,
        hasGlyphs: false,
      };
    case 'F':
    default:
      return {
        bgClass: 'bg-gradient-to-br from-red-500/20 to-red-900/10',
        textClass: 'text-red-500',
        glowClass: '',
        borderClass: 'border-red-500/50',
        particleColor: 'bg-red-500',
        hasAura: false,
        hasGlyphs: false,
      };
  }
};

export default function GQTRankReveal({ score, username, onComplete }: GQTRankRevealProps) {
  const [phase, setPhase] = useState<'dim' | 'letter' | 'full'>('dim');
  const rankConfig = getRankFromScore(score);
  const visuals = getRankVisuals(rankConfig.rank);

  useEffect(() => {
    // Phase 1: Dim screen (0.5s)
    const timer1 = setTimeout(() => setPhase('letter'), 500);
    // Phase 2: Letter reveal (1.5s), then full
    const timer2 = setTimeout(() => setPhase('full'), 2000);
    // Auto-complete after full reveal
    const timer3 = setTimeout(() => onComplete(), 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      >
        {/* Phase 1: Dimming overlay with subtle pulse */}
        {phase === 'dim' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute inset-0 bg-black"
          />
        )}

        {/* Main reveal container */}
        <motion.div
          className="relative flex flex-col items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {/* Background glow for S+ and S++ */}
          {visuals.hasAura && phase !== 'dim' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute w-96 h-96 rounded-full ${visuals.bgClass} blur-3xl`}
            />
          )}

          {/* Arcane glyphs for S++ */}
          {visuals.hasGlyphs && phase !== 'dim' && (
            <motion.div
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: 360, opacity: 0.3 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[500px] h-[500px] border border-gold/30 rounded-full"
              style={{
                backgroundImage: `conic-gradient(from 0deg, transparent, rgba(212,175,55,0.1), transparent, rgba(212,175,55,0.1), transparent)`,
              }}
            />
          )}

          {/* Particles */}
          {phase !== 'dim' && <Particles color={visuals.particleColor} count={rankConfig.rank.includes('S') ? 50 : 20} />}

          {/* The Rank Letter */}
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={phase !== 'dim' ? { scale: 1, rotate: 0, opacity: 1 } : {}}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className={`relative ${visuals.glowClass}`}
          >
            <span className={`font-display text-[200px] leading-none ${visuals.textClass}`}>
              {rankConfig.rank}
            </span>
          </motion.div>

          {/* Score */}
          {phase === 'full' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-center"
            >
              <p className="text-4xl font-display text-foreground">
                {score.toFixed(0)} <span className="text-xl text-muted-foreground">/ 100</span>
              </p>
              <p className={`text-sm uppercase tracking-widest mt-2 ${visuals.textClass}`}>
                {rankConfig.description}
              </p>
            </motion.div>
          )}

          {/* Username */}
          {phase === 'full' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-xs text-muted-foreground uppercase tracking-[0.3em]"
            >
              @{username}
            </motion.p>
          )}

          {/* Tap to continue */}
          {phase === 'full' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={onComplete}
              className="mt-10 text-xs text-gold/70 uppercase tracking-wider hover:text-gold transition-colors"
            >
              TAP TO CONTINUE
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
