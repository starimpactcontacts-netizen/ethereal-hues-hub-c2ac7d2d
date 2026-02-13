import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Gavel, Swords, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { usePendingJudgeFights } from '@/hooks/useQuickFight';

export default function JudgeQueuePage() {
  const navigate = useNavigate();
  const { fights, loading } = usePendingJudgeFights();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-purple-400" />
            <span className="font-display text-sm text-foreground">JUDGE QUEUE</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <h2 className="font-display text-lg text-foreground mb-1">Pending 1v1 Decisions</h2>
        <p className="text-xs text-muted-foreground mb-4">Tap a fight to watch both edits and declare a winner.</p>

        {loading && (
          <div className="flex justify-center py-12">
            <Swords className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
          </div>
        )}

        {!loading && fights.length === 0 && (
          <div className="text-center py-12">
            <Gavel className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">No fights awaiting judgment</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Check back soon — fights are always happening</p>
          </div>
        )}

        <div className="space-y-3">
          {fights.map((fight, i) => (
            <motion.button
              key={fight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/fight/${fight.id}`)}
              className="w-full bg-surface-1 border border-purple-500/20 hover:border-purple-500/50 p-4 rounded-lg transition-all text-left"
            >
              <div className="flex items-center gap-4">
                {/* Player 1 (RED) */}
                <div className="flex items-center gap-2 flex-1">
                  <Avatar className="w-10 h-10 border-2 border-red-500">
                    <AvatarImage src={fight.player_1_avatar_url || ''} />
                    <AvatarFallback className="bg-red-500/20 text-red-400 text-sm font-bold">
                      {fight.player_1_username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm font-medium text-foreground">{fight.player_1_username}</span>
                    <span className="text-[9px] text-red-400 block font-bold">RED</span>
                  </div>
                </div>

                {/* VS */}
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-purple-400" />
                </div>

                {/* Player 2 (BLUE) */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="text-right">
                    <span className="text-sm font-medium text-foreground">{fight.player_2_username}</span>
                    <span className="text-[9px] text-blue-400 block font-bold">BLUE</span>
                  </div>
                  <Avatar className="w-10 h-10 border-2 border-blue-500">
                    <AvatarImage src={fight.player_2_avatar_url || ''} />
                    <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm font-bold">
                      {fight.player_2_username?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Submissions */}
              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Both edits submitted
                </span>
                <span className="text-purple-400 font-bold uppercase tracking-wider">Tap to Judge →</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
