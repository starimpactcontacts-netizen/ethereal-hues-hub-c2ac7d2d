import { useRef } from 'react';
import { Trophy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import type { QuickFight } from '@/hooks/useQuickFight';

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
    <div className="space-y-3 max-w-[360px] mx-auto">
      {/* Compact Result Card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden bg-black rounded-xl border border-white/10 p-4"
      >
        {/* Subtle split background */}
        <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-black to-white/[0.02]" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] text-white/40 uppercase tracking-[0.25em]">1v1 Result</span>
            <span className="text-[9px] text-white/40 uppercase tracking-[0.25em]">loopgate.io</span>
          </div>

          {/* VS Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Winner */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-gold overflow-hidden">
                  {winnerAvatar ? (
                    <img src={winnerAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gold/20 flex items-center justify-center">
                      <span className="text-base font-bold text-gold">{winnerUsername?.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <Trophy className="w-3.5 h-3.5 text-gold absolute -top-1 -right-1 fill-gold" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm text-white truncate">{winnerUsername}</p>
                <p className="text-[10px] text-gold uppercase tracking-wider">Winner{fight.winner_score ? ` · ${fight.winner_score}` : ''}</p>
              </div>
            </div>

            <span className="font-display text-xs text-white/30">VS</span>

            {/* Loser */}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <div className="min-w-0 text-right">
                <p className="font-display text-sm text-white/60 truncate">{loserUsername}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider">{fight.loser_score ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden opacity-60 shrink-0">
                {loserAvatar ? (
                  <img src={loserAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <span className="text-base font-bold text-white/40">{loserUsername?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Judge / Notes */}
          {(fight.judge_username || fight.judge_notes) && (
            <div className="mt-3 pt-3 border-t border-white/10">
              {fight.judge_notes && (
                <p className="text-[11px] text-white/60 italic line-clamp-2">"{fight.judge_notes}"</p>
              )}
              {fight.judge_username && (
                <p className="text-[9px] text-white/40 uppercase tracking-wider mt-1">Judged by @{fight.judge_username}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Button */}
      <Button
        onClick={handleShare}
        size="sm"
        className="w-full bg-white text-black hover:bg-white/90 font-display uppercase tracking-wider text-xs"
      >
        <Share2 className="w-3.5 h-3.5 mr-2" />
        Share Result
      </Button>
    </div>
  );
}
