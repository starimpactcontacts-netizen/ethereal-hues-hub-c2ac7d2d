import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Share2, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import type { QuickFight } from '@/hooks/useQuickFight';
import loopgateLogo from '@/assets/loopgate-logo.png';

interface QuickFightResultCardProps {
  fight: QuickFight;
}

export default function QuickFightResultCard({ fight }: QuickFightResultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!fight.winner_id || fight.status !== 'completed') return null;

  const isP1Winner = fight.winner_id === fight.player_1_id;
  const winnerUsername = isP1Winner ? fight.player_1_username : fight.player_2_username;
  const winnerAvatar = isP1Winner ? fight.player_1_avatar_url : fight.player_2_avatar_url;
  const loserUsername = isP1Winner ? fight.player_2_username : fight.player_1_username;
  const loserAvatar = isP1Winner ? fight.player_2_avatar_url : fight.player_1_avatar_url;

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000',
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], 'loopgate-result.png', { type: 'image/png' });
          navigator.share({ files: [file], title: `${winnerUsername} won on Loopgate!` }).catch(() => {});
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'loopgate-result.png';
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Screenshot saved!');
        }
      });
    } catch {
      toast.error('Failed to capture screenshot');
    }
  };

  return (
    <div className="space-y-3">
      {/* Exportable Card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden bg-black p-6"
        style={{ aspectRatio: '9/16', maxWidth: '360px', margin: '0 auto' }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/40 via-black to-blue-900/40" />
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(45deg, transparent 48%, white 48%, white 52%, transparent 52%)',
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-between h-full">
          {/* Logo */}
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6 opacity-80" />

          {/* 1v1 RESULT */}
          <div className="text-center my-4">
            <span className="text-[10px] text-white/50 uppercase tracking-[0.3em]">1v1 Quick Fight</span>
            <h2 className="font-display text-3xl text-white mt-1">RESULT</h2>
          </div>

          {/* VS Layout */}
          <div className="flex items-center gap-6 w-full justify-center">
            {/* Winner (RED/left) */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-gold overflow-hidden shadow-lg shadow-gold/30">
                  {winnerAvatar ? (
                    <img src={winnerAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gold/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gold">{winnerUsername?.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gold px-2 py-0.5 rounded-sm">
                  <Trophy className="w-3 h-3 text-black inline mr-0.5" />
                  <span className="text-[8px] font-bold text-black uppercase">Winner</span>
                </div>
              </div>
              <span className="font-display text-sm text-white mt-4">{winnerUsername}</span>
              {fight.winner_score && (
                <span className="text-lg font-bold text-gold">{fight.winner_score}</span>
              )}
            </div>

            {/* VS */}
            <span className="font-display text-xl text-white/30">VS</span>

            {/* Loser (BLUE/right) */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full border-4 border-white/20 overflow-hidden opacity-60">
                {loserAvatar ? (
                  <img src={loserAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white/50">{loserUsername?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <span className="font-display text-sm text-white/50 mt-4">{loserUsername}</span>
              {fight.loser_score && (
                <span className="text-lg font-bold text-white/30">{fight.loser_score}</span>
              )}
            </div>
          </div>

          {/* Judge */}
          {fight.judge_username && (
            <div className="text-center mt-4">
              <span className="text-[9px] text-white/40 uppercase tracking-wider">Judged by</span>
              <p className="text-xs text-white/70 font-medium">@{fight.judge_username}</p>
            </div>
          )}

          {/* Judge Notes */}
          {fight.judge_notes && (
            <div className="mt-3 px-4 text-center">
              <p className="text-[10px] text-white/50 italic">"{fight.judge_notes}"</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-auto pt-4">
            <p className="text-[8px] text-white/30 uppercase tracking-[0.2em]">loopgate.io</p>
          </div>
        </div>
      </div>

      {/* Share Button */}
      <Button
        onClick={handleShare}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-display uppercase tracking-wider"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Result
      </Button>
    </div>
  );
}
