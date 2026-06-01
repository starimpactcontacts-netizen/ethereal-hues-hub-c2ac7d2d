import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Film, Music, Loader2, CheckCircle2, Swords } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface SyncFight {
  id: string;
  battle_mode?: string;
  sync_scenepack_name?: string | null;
  sync_song_title?: string | null;
  sync_song_artist?: string | null;
  sync_spun_at?: string | null;
}

interface Props {
  fight: SyncFight;
  onComplete: () => void;
}

// Items for the slot machine visual — cycle through these during spin animation
const FAKE_PACKS = [
  'Chainsaw Man', 'Death Note', 'Arcane', 'Attack on Titan',
  'Jujutsu Kaisen', 'Demon Slayer', 'One Piece', 'Naruto',
  'Invincible', 'Avatar: TLA', 'Vinland Saga', 'Spy x Family',
  'Blue Lock', 'Haikyuu', 'Bleach', 'Hunter x Hunter',
  'Overlord', 'Re:Zero', 'Mob Psycho 100', 'Black Clover',
];

const FAKE_SONGS = [
  'HUMBLE.', 'DNA.', 'SICKO MODE', "God's Plan", 'Blinding Lights',
  'Starboy', 'Die For You', 'Bad Guy', 'XO TOUR Llif3', 'POWER',
  'MONTERO', 'Panda', 'Runaway', 'Ghost Town', 'Levitating',
  'ROYAL', 'MELTDOWN', 'BUTTERFLY EFFECT', 'Savage', 'LUST.',
];

export default function SyncSpinFlow({ fight, onComplete }: Props) {
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'revealing' | 'done'>('idle');
  const [pressing, setPressing] = useState(false);
  const [packIdx, setPackIdx] = useState(0);
  const [songIdx, setSongIdx] = useState(0);
  const tickRef = useRef<ReturnType<typeof setTimeout>>();
  const animStarted = useRef(false);

  const runSpinAnimation = useCallback(() => {
    if (animStarted.current) return;
    animStarted.current = true;
    setPhase('spinning');

    let interval = 55;
    const totalMs = 2800;
    const startTime = Date.now();

    const tick = () => {
      setPackIdx(i => (i + 1) % FAKE_PACKS.length);
      setSongIdx(i => (i + 1) % FAKE_SONGS.length);

      const elapsed = Date.now() - startTime;
      if (elapsed < totalMs) {
        // Decelerate during final 40%
        if (elapsed > totalMs * 0.55) {
          interval = Math.min(interval * 1.13, 450);
        }
        tickRef.current = setTimeout(tick, interval);
      } else {
        // Land on result
        setPhase('revealing');
        setTimeout(() => {
          setPhase('done');
          setTimeout(onComplete, 2500);
        }, 1200);
      }
    };

    tickRef.current = setTimeout(tick, interval);
  }, [onComplete]);

  useEffect(() => {
    return () => { if (tickRef.current) clearTimeout(tickRef.current); };
  }, []);

  // If fight already has sync_spun_at (e.g. other player triggered or page refresh),
  // run the reveal animation immediately
  useEffect(() => {
    if (fight.sync_spun_at && phase === 'idle') {
      runSpinAnimation();
    }
  }, [fight.sync_spun_at, phase, runSpinAnimation]);

  const handleSpin = async () => {
    if (pressing || phase !== 'idle') return;
    setPressing(true);

    // Start animation immediately for the player who pressed — feels instant
    runSpinAnimation();

    // RPC runs in background; transitions fight to active + sets sync fields
    // Other player gets realtime update and their SyncSpinFlow starts animating too
    const { error } = await supabase.rpc('spin_sync_fight' as any, { p_fight_id: fight.id });
    if (error) console.error('[SyncSpinFlow] spin error:', error);
    setPressing(false);
  };

  const isSpinning = phase === 'spinning';
  const showResult = phase === 'revealing' || phase === 'done';

  const packDisplay = showResult
    ? (fight.sync_scenepack_name || 'Unknown Pack')
    : FAKE_PACKS[packIdx];

  const songDisplay = showResult
    ? (fight.sync_song_title || 'Unknown Song')
    : FAKE_SONGS[songIdx];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: '#050505',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.05) 0%, transparent 55%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-2 pt-14 pb-3">
        <Swords className="w-3.5 h-3.5 text-white/15" strokeWidth={2} />
        <span className="text-[9px] font-black tracking-[0.4em] text-white/15 uppercase">Sync Battle</span>
        <Swords className="w-3.5 h-3.5 text-white/15" strokeWidth={2} style={{ transform: 'scaleX(-1)' }} />
      </div>

      {/* Phase label */}
      <div className="text-center px-6 pb-10 min-h-[36px]">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[13px] text-white/25">
              First to press spins for both
            </motion.p>
          )}
          {isSpinning && (
            <motion.p key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[13px] text-white/25">
              Drawing your fate...
            </motion.p>
          )}
          {phase === 'revealing' && (
            <motion.p key="rev" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[13px] font-bold text-emerald-400">
              Fate decided.
            </motion.p>
          )}
          {phase === 'done' && (
            <motion.p key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[13px] font-bold text-emerald-400">
              Make the better edit. Starting...
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Slot cards */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">

        {/* ── Scenepack slot ── */}
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <Film className="w-3 h-3 text-white/20" strokeWidth={2} />
            <span className="text-[8px] font-black uppercase tracking-[0.32em] text-white/20">Scenepack</span>
          </div>
          <div
            className="relative overflow-hidden h-[72px] flex items-center px-5"
            style={{
              background: showResult ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.025)',
              border: showResult ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
              transition: 'background 0.35s, border-color 0.35s',
            }}
          >
            {/* Edge fade during spin */}
            {!showResult && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-7 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to right, #050505, transparent)' }} />
                <div className="absolute right-0 top-0 bottom-0 w-7 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to left, #050505, transparent)' }} />
              </>
            )}
            <AnimatePresence mode="wait">
              <motion.p
                key={showResult ? 'rp' : packIdx}
                initial={{ opacity: showResult ? 0 : 0.55, y: showResult ? 3 : 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: showResult ? 0.2 : 0.01 }}
                className="text-[26px] font-black text-white leading-none truncate"
                style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}
              >
                {packDisplay}
              </motion.p>
            </AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 w-full max-w-sm">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <span className="text-[10px] font-black text-white/8 tracking-widest">+</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>

        {/* ── Song slot ── */}
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-3 h-3 text-white/20" strokeWidth={2} />
            <span className="text-[8px] font-black uppercase tracking-[0.32em] text-white/20">Song</span>
          </div>
          <div
            className="relative overflow-hidden px-5 flex flex-col justify-center"
            style={{
              background: showResult ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.025)',
              border: showResult ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
              transition: 'background 0.35s, border-color 0.35s',
              minHeight: 72,
              paddingTop: showResult ? 14 : 0,
              paddingBottom: showResult ? 14 : 0,
            }}
          >
            {!showResult && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-7 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to right, #050505, transparent)' }} />
                <div className="absolute right-0 top-0 bottom-0 w-7 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to left, #050505, transparent)' }} />
              </>
            )}
            <AnimatePresence mode="wait">
              <motion.p
                key={showResult ? 'rs' : songIdx}
                initial={{ opacity: showResult ? 0 : 0.55, y: showResult ? 3 : 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: showResult ? 0.2 : 0.01 }}
                className="text-[26px] font-black text-white leading-none truncate"
                style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}
              >
                {songDisplay}
              </motion.p>
            </AnimatePresence>
            {showResult && fight.sync_song_artist && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
                className="text-[11px] text-white/35 mt-1 truncate"
              >
                {fight.sync_song_artist}
              </motion.p>
            )}
            {showResult && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-6 pb-14">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.button
              key="btn"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSpin}
              disabled={pressing}
              className="w-full py-4 flex items-center justify-center gap-2.5 font-black text-[15px] uppercase tracking-[0.18em] text-white disabled:opacity-50"
              style={{
                background: 'linear-gradient(180deg, #FF3B3B 0%, #CC2020 100%)',
                boxShadow: '0 0 40px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              {pressing
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Shuffle className="w-5 h-5" />
              }
              {pressing ? 'Spinning...' : 'Spin'}
            </motion.button>
          )}
          {isSpinning && (
            <motion.div
              key="ind"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-4 text-white/20"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Drawing fate</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
