import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import editBattleTitle from '@/assets/edit-battle-title.png.asset.json';

const TEKO = { fontFamily: 'Teko, sans-serif' };

interface Props {
  redUsername: string;
  blueUsername: string;
  onDone: () => void;
}

export default function BattleEnterIntro({ redUsername, blueUsername, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 450); }, 1900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="enter-intro"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: '#060606' }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeIn' } }}
        >
          {/* ── Red slash panel ── */}
          <motion.div
            className="absolute inset-y-0"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              left: 0, width: '54%',
              background: 'linear-gradient(160deg, #180000 0%, #0c0000 100%)',
              clipPath: 'polygon(0 0, 100% 0, 82% 100%, 0 100%)',
            }}
          />
          <motion.div
            className="absolute inset-y-0"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              right: 0, width: '54%',
              background: 'linear-gradient(20deg, #00051c 0%, #000310 100%)',
              clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0 100%)',
            }}
          />

          {/* ── Horizontal accent lines ── */}
          <motion.div className="absolute left-0 right-0"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.22, duration: 0.25, ease: 'easeOut', originX: 0 }}
            style={{ top: '40%', height: 1.5, background: 'linear-gradient(90deg,#cc0000 0%,rgba(200,0,0,0) 60%)' }}
          />
          <motion.div className="absolute left-0 right-0"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.22, duration: 0.25, ease: 'easeOut', originX: '100%' }}
            style={{ top: '60%', height: 1.5, background: 'linear-gradient(270deg,#0033cc 0%,rgba(0,50,200,0) 60%)' }}
          />

          {/* ── Center content ── */}
          <div className="relative z-10 flex flex-col items-center" style={{ gap: 0 }}>

            {/* Edit Battle title PNG */}
            <motion.img
              src={editBattleTitle.url}
              alt="Edit Battle"
              className="mb-4"
              style={{ width: 280, objectFit: 'contain' }}
              initial={{ opacity: 0, y: -20, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.24, duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* RED name */}
            <motion.div
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.34, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#cc0000', boxShadow: '0 0 10px #cc0000', display: 'inline-block', flexShrink: 0 }} />
              <span style={{
                ...TEKO, fontSize: 48, fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1, color: '#fff',
                textShadow: '-3px 0 #ff1a1a, 3px 0 rgba(255,160,160,0.65)',
              }}>
                {redUsername.toUpperCase()}
              </span>
            </motion.div>

            {/* VS */}
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.42, duration: 0.18, type: 'spring', stiffness: 420, damping: 20 }}
              style={{ margin: '2px 0' }}
            >
              <span style={{ ...TEKO, fontSize: 18, fontWeight: 900, letterSpacing: '0.32em', color: 'rgba(255,255,255,0.18)' }}>VS</span>
            </motion.div>

            {/* BLUE name */}
            <motion.div
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.46, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <span style={{
                ...TEKO, fontSize: 48, fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1, color: '#fff',
                textShadow: '3px 0 #1a44ff, -3px 0 rgba(140,180,255,0.65)',
              }}>
                {blueUsername.toUpperCase()}
              </span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0033cc', boxShadow: '0 0 10px #0033cc', display: 'inline-block', flexShrink: 0 }} />
            </motion.div>
          </div>

          {/* ── Bottom split bar ── */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 flex"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.15 }}
            style={{ height: 3 }}
          >
            <div className="flex-1" style={{ background: '#cc0000' }} />
            <div className="flex-1" style={{ background: '#0033cc' }} />
          </motion.div>

          {/* ── Corner brackets (Valorant) ── */}
          {[
            { top: 16, left: 16, r: 0 },
            { top: 16, right: 16, r: 90 },
            { bottom: 16, right: 16, r: 180 },
            { bottom: 16, left: 16, r: 270 },
          ].map((pos, i) => (
            <motion.svg
              key={i} width="18" height="18" viewBox="0 0 18 18" fill="none"
              className="absolute"
              style={{ ...pos }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.32 + i * 0.04, duration: 0.15 }}
            >
              <path d="M2 16 L2 2 L16 2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="square" fill="none" />
            </motion.svg>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
