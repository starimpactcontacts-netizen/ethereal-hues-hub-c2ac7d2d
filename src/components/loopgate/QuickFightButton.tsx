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
    <motion.button
      onClick={handleClick}
      disabled={isSearching}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden group ${className}`}
    >
      <motion.div
        animate={{
          boxShadow: isSearching
            ? ['0 0 20px rgba(239,68,68,0.3)', '0 0 40px rgba(239,68,68,0.5)', '0 0 20px rgba(239,68,68,0.3)']
            : ['0 0 15px rgba(239,68,68,0.2)', '0 0 30px rgba(239,68,68,0.4)', '0 0 15px rgba(239,68,68,0.2)']
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`${isSmall ? 'px-4 py-2.5' : 'px-8 py-4'} bg-gradient-to-r from-red-600 via-red-500 to-red-600 flex items-center justify-center gap-2 rounded-lg`}
      >
      {isSearching ? (
          <>
            <Loader2 className={`${isSmall ? 'w-4 h-4' : 'w-6 h-6'} text-white animate-spin`} />
            <span className={`font-display ${isSmall ? 'text-sm' : 'text-xl'} text-white uppercase tracking-wider`}>
              Searching...
            </span>
            <span className={`flex items-center gap-1 ${isSmall ? 'text-xs' : 'text-sm'} text-white/70 font-mono`}>
              <Clock className="w-3 h-3" />
              {formatElapsed(elapsed)}
            </span>
          </>
        ) : activeFight ? (
          <>
            <Swords className={`${isSmall ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
            <span className={`font-display ${isSmall ? 'text-sm' : 'text-xl'} text-white uppercase tracking-wider`}>
              Return to Fight
            </span>
          </>
        ) : (
          <>
            <Swords className={`${isSmall ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
            <span className={`font-display ${isSmall ? 'text-sm' : 'text-xl'} text-white uppercase tracking-wider`}>
              Quick Edit Battle
            </span>
          </>
        )}
      </motion.div>

      {isSearching && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { e.stopPropagation(); handleCancel(); }}
          className={`mt-2 flex items-center justify-center gap-1.5 ${isSmall ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'} rounded-lg border border-destructive/40 bg-destructive/10 text-destructive font-display uppercase tracking-wider hover:bg-destructive/20 transition-colors w-full`}
        >
          <X className="w-4 h-4" />
          Cancel Search
        </motion.button>
      )}
    </motion.button>
  );
}
