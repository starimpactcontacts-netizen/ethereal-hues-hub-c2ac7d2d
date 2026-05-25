import type { QuickFight } from '@/hooks/useQuickFight';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuickFightResultCardProps {
  fight: QuickFight;
}

export default function QuickFightResultCard({ fight }: QuickFightResultCardProps) {
  if (!fight.winner_id || fight.status !== 'completed') return null;

  const battleUrl = `${window.location.origin}/fight/${fight.id}`;

  const handleShare = async () => {
    const text = `🔥 Edit battle just went down on Loopgate — who won?\n${battleUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url: battleUrl });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard — paste it anywhere!');
      }
    } catch {}
  };

  return (
    <button
      onClick={handleShare}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-white/60 text-[13px] font-semibold hover:bg-white/[0.07] active:scale-[0.98] transition-all"
    >
      <Share2 className="w-4 h-4" />
      Share this edit battle
    </button>
  );
}
