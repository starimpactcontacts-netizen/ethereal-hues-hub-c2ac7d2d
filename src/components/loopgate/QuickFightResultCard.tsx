import type { QuickFight } from '@/hooks/useQuickFight';
import { toast } from 'sonner';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/>
    </svg>
  );
}

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
      <TikTokIcon className="w-4 h-4" />
      Film this battle on TikTok
    </button>
  );
}
