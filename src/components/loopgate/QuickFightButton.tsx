import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, Loader2, Clock, X } from 'lucide-react';
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

export default function QuickFightButton({ size = 'lg', className = '' }: QuickFightButtonProps) {
  const { profile, user } = useAuth();
  const { open: openAccountPrompt } = useAccountPrompt();
  const { inQueue, fights } = useMyQuickFights();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [elapsed, setElapsed] = useState(0);
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

  // Listen for match while in queue — auto-navigate
  useEffect(() => {
    if (!inQueue && !searching) return;
    const matched = fights.find(f => f.status === 'active');
    if (matched) {
      toast.success('⚔️ Match found!');
      navigate(`/fight/${matched.id}`);
      setSearching(false);
      // Trigger email notification
      supabase.functions.invoke('notify-quick-fight-match', { body: { fight_id: matched.id } }).catch(() => {});
    }
  }, [fights, inQueue, searching]);

  const handleCancel = async () => {
    if (!user) return;
    // Remove from queue
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
        whileTap={{ scale: 0.96 }}
        className="relative overflow-hidden group touch-manipulation select-none"
      >
        {/* Fortnite-style skewed accent stripe */}
        <div className="absolute -left-3 top-0 bottom-0 w-3 bg-yellow-300 skew-x-[-8deg] z-10" />
        <div className="absolute -right-3 top-0 bottom-0 w-3 bg-yellow-300 skew-x-[-8deg] z-10" />

        <motion.div
          animate={isSearching ? {
            boxShadow: ['0 0 20px rgba(250,204,21,0.3)', '0 0 40px rgba(250,204,21,0.6)', '0 0 20px rgba(250,204,21,0.3)']
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`${isSmall ? 'px-4 py-3' : 'px-6 py-4'} ${
            isSearching 
              ? 'bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500' 
              : 'bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500 hover:from-yellow-200 hover:via-yellow-300 hover:to-yellow-400'
          } flex items-center justify-center gap-2.5 active:brightness-90 transition-all`}
        >
          {isSearching ? (
            <>
              <Loader2 className={`${isSmall ? 'w-4 h-4' : 'w-5 h-5'} text-white animate-spin`} />
              <span className={`font-display ${isSmall ? 'text-base' : 'text-xl'} text-white uppercase tracking-wider drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]`}>
                Searching...
              </span>
              <span className={`flex items-center gap-1 ${isSmall ? 'text-[10px]' : 'text-xs'} text-white/80 font-mono`}>
                <Clock className="w-3 h-3" />
                {formatElapsed(elapsed)}
              </span>
            </>
          ) : activeFight ? (
            <>
              <Swords className={`${isSmall ? 'w-4 h-4' : 'w-6 h-6'} text-black`} />
              <span className={`font-display ${isSmall ? 'text-base' : 'text-xl'} text-black uppercase tracking-wider drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]`}>
                Return to Fight
              </span>
            </>
          ) : (
            <>
              <Swords className={`${isSmall ? 'w-4 h-4' : 'w-6 h-6'} text-black`} />
              <span className={`font-display ${isSmall ? 'text-base' : 'text-xl'} text-black uppercase tracking-wider drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]`}>
                Quick Edit Battle
              </span>
            </>
          )}
        </motion.div>
      </motion.button>

      {isSearching && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className={`flex items-center justify-center gap-1.5 ${isSmall ? 'px-3 py-2 text-xs' : 'px-5 py-2.5 text-sm'} border-2 border-red-500/60 bg-red-500/15 text-red-400 font-display uppercase tracking-wider hover:bg-red-500/25 active:bg-red-500/30 transition-colors touch-manipulation select-none`}
        >
          <X className="w-4 h-4" />
          Cancel Search
        </motion.button>
      )}
    </div>
  );
}
