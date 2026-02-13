import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { findQuickFight, useMyQuickFights } from '@/hooks/useQuickFight';
import { useAccountPrompt } from '@/hooks/useAccountPrompt';
import { toast } from 'sonner';

interface QuickFightButtonProps {
  size?: 'sm' | 'lg';
  className?: string;
}

export default function QuickFightButton({ size = 'lg', className = '' }: QuickFightButtonProps) {
  const { profile, user } = useAuth();
  const { open: openAccountPrompt } = useAccountPrompt();
  const { inQueue, fights } = useMyQuickFights();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);

  const activeFight = fights.find(f => f.status === 'active' || f.status === 'judging');

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
      } else {
        toast('🔍 Searching for opponent...', { duration: 3000 });
        setTimeout(() => setSearching(false), 5000);
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
    </motion.button>
  );
}
