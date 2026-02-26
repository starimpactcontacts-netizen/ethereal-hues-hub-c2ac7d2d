import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Loader2, Clock, X, Info, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { findQuickFight, useMyQuickFights } from '@/hooks/useQuickFight';
import { useAccountPrompt } from '@/hooks/useAccountPrompt';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface QuickFightButtonProps {
  size?: 'sm' | 'lg';
  className?: string;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const QUEUE_TIPS = [
  "💡 Queues can take hours right now — check back regularly!",
  "⚡ Want faster matches? Create a 1v1 Edit Battle and invite someone directly!",
  "🔔 You'll be notified when matched — feel free to browse other sections.",
  "👥 More players = faster queues. Share Loopgate with editor friends!",
];

export default function QuickFightButton({ size = 'lg', className = '' }: QuickFightButtonProps) {
  const { profile, user } = useAuth();
  const { open: openAccountPrompt } = useAccountPrompt();
  const { inQueue, fights } = useMyQuickFights();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeFight = fights.find(f => f.status === 'active' || f.status === 'judging');

  // Queue timer
  useEffect(() => {
    if (inQueue || searching) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [inQueue, searching]);

  // Rotate tips every 6s while in queue
  useEffect(() => {
    if (!searching && !inQueue) return;
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % QUEUE_TIPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [searching, inQueue]);

  // Listen for match while in queue — auto-navigate
  useEffect(() => {
    if (!inQueue && !searching) return;
    const matched = fights.find(f => f.status === 'active');
    if (matched) {
      toast.success('⚔️ Match found!');
      navigate(`/fight/${matched.id}`);
      setSearching(false);
      supabase.functions.invoke('notify-quick-fight-match', { body: { fight_id: matched.id } }).catch(() => {});
    }
  }, [fights, inQueue, searching]);

  const handleCancel = async () => {
    if (!user) return;
    await supabase
      .from('quick_fight_queue')
      .delete()
      .eq('user_id', user.id);
    setSearching(false);
    toast('Search cancelled', { duration: 2000 });
  };

  const handleClick = async () => {
    if (!user || !profile) {
      openAccountPrompt('send_message', () => {});
      return;
    }

    if (activeFight) {
      navigate(`/fight/${activeFight.id}`);
      return;
    }

    setSearching(true);
    try {
      const fightId = await findQuickFight(user.id, profile.username, profile.avatar_url);
      if (fightId) {
        toast.success('⚔️ Match found!');
        navigate(`/fight/${fightId}`);
        supabase.functions.invoke('notify-quick-fight-match', { body: { fight_id: fightId } }).catch(() => {});
        setSearching(false);
      } else {
        toast('🔍 In queue — we\'ll notify you when matched!', { duration: 4000 });
      }
    } catch {
      toast.error('Matchmaking failed');
      setSearching(false);
    }
  };

  const isSmall = size === 'sm';
  const isSearching = searching || inQueue;

  return (
    <div className={`flex flex-col items-stretch gap-2 ${className}`}>
      <motion.button
        onClick={isSearching ? undefined : handleClick}
        disabled={isSearching}
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden group touch-manipulation select-none"
      >
        <motion.div
          animate={isSearching ? {
            boxShadow: ['0 0 20px rgba(239,68,68,0.2)', '0 0 35px rgba(239,68,68,0.4)', '0 0 20px rgba(239,68,68,0.2)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={`${isSmall ? 'px-4 py-3' : 'px-6 py-3.5'} ${
            isSearching 
              ? 'bg-red-600' 
              : 'bg-red-600 hover:bg-red-500'
          } transition-colors flex items-center justify-center gap-3`}
        >
          {/* Subtle top highlight */}
          <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />

          {isSearching ? (
            <>
              <Loader2 className={`${isSmall ? 'w-4 h-4' : 'w-5 h-5'} text-white animate-spin relative z-10`} />
              <span className={`font-display ${isSmall ? 'text-sm' : 'text-lg'} text-white uppercase tracking-wider relative z-10`}>
                Searching...
              </span>
              <span className={`flex items-center gap-1 ${isSmall ? 'text-[10px]' : 'text-xs'} text-white/70 font-mono relative z-10`}>
                <Clock className="w-3 h-3" />
                {formatElapsed(elapsed)}
              </span>
            </>
          ) : activeFight ? (
            <>
              <Swords className={`${isSmall ? 'w-4 h-4' : 'w-5 h-5'} text-white relative z-10`} />
              <span className={`font-display ${isSmall ? 'text-sm' : 'text-lg'} text-white uppercase tracking-wider relative z-10`}>
                Return to Fight
              </span>
            </>
          ) : (
            <>
              <Zap className={`${isSmall ? 'w-4 h-4' : 'w-5 h-5'} text-white relative z-10`} />
              <span className={`font-display ${isSmall ? 'text-sm' : 'text-lg'} text-white uppercase tracking-wider relative z-10`}>
                Quick Edit Battle
              </span>
              <span className={`text-[9px] text-white/50 font-bold relative z-10`}>+20 IDX</span>
            </>
          )}
        </motion.div>
      </motion.button>

      {/* Queue tip + cancel — only visible when searching */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="flex flex-col gap-1.5"
          >
            {/* Rotating tip banner */}
            <div className="bg-surface-1 border border-border px-3 py-2">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={tipIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="text-[11px] text-muted-foreground leading-snug"
                  >
                    {QUEUE_TIPS[tipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Cancel button */}
            <button
              onClick={handleCancel}
              className={`flex items-center justify-center gap-1.5 ${isSmall ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-xs'} border border-border bg-surface-1 text-muted-foreground font-bold uppercase tracking-wider hover:text-foreground hover:border-foreground/30 transition-colors touch-manipulation select-none`}
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
