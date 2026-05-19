import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, X, Zap } from 'lucide-react';

interface Player {
  username: string;
  avatarUrl: string | null;
  level: number;
}

interface Props {
  open: boolean;
  you: Player;
  opponent: Player;
  onCancel: () => void;
  onConfirm: () => void;
}

function classFromLevel(level: number): string {
  if (level >= 75) return 'MYTHIC';
  if (level >= 50) return 'ELITE';
  if (level >= 30) return 'VETERAN';
  if (level >= 15) return 'PRO';
  if (level >= 5)  return 'ROOKIE';
  return 'NOVICE';
}

function Avatar({ p, color }: { p: Player; color: 'red' | 'blue' }) {
  const ring = color === 'red' ? 'border-red-500/70 shadow-[0_0_24px_rgba(239,68,68,0.55)]' : 'border-blue-500/70 shadow-[0_0_24px_rgba(59,130,246,0.55)]';
  const tint = color === 'red' ? 'text-red-400' : 'text-blue-400';
  return (
    <div className="flex-1 flex flex-col items-center text-center">
      <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${ring} bg-surface-2 flex items-center justify-center`}>
        {p.avatarUrl
          ? <img src={p.avatarUrl} alt={p.username} className="w-full h-full object-cover" />
          : <span className="text-2xl font-bold text-foreground">{p.username[0]?.toUpperCase()}</span>}
      </div>
      <p className="mt-2 font-semibold text-sm text-foreground truncate max-w-[120px]">{p.username}</p>
      <p className={`text-[9px] uppercase tracking-[0.18em] font-bold ${tint}`}>{classFromLevel(p.level)}</p>
      <p className="text-[10px] text-muted-foreground">Lv {p.level}</p>
    </div>
  );
}

export default function InstantMatchModal({ open, you, opponent, onCancel, onConfirm }: Props) {
  const [count, setCount] = useState(5);

  useEffect(() => {
    if (!open) { setCount(5); return; }
    setCount(5);
    const iv = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(iv);
          // Defer to next tick so state isn't updated during render
          setTimeout(() => onConfirm(), 0);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-surface-1 border border-border rounded-2xl p-6 relative"
      >
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"
          aria-label="Cancel match"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-1 mb-1">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-400 font-bold">Instant Match Found</p>
        </div>
        <h2 className="font-display text-2xl text-center text-foreground mb-5">EDIT BATTLE</h2>

        <div className="flex items-stretch gap-3 mb-6">
          <Avatar p={you} color="blue" />
          <div className="flex flex-col items-center justify-center px-2">
            <Swords className="w-6 h-6 text-gold mb-1" />
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest">VS</span>
          </div>
          <Avatar p={opponent} color="red" />
        </div>

        <div className="text-center mb-5">
          <div className="text-5xl font-display text-foreground tabular-nums">{count}</div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
            Starting in {count}s · tap cancel to back out
          </p>
        </div>

        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-sm font-semibold uppercase tracking-wider text-foreground transition"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}
