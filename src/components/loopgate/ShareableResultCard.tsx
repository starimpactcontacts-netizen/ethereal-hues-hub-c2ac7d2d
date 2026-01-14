import { useState } from "react";
import { Share2, Trophy, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import loopgateLogo from "@/assets/loopgate-logo.png";

interface ShareableResultCardProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    username: string;
    displayName?: string;
    eventTitle: string;
    rank: number;
    qoiScore: number;
    qualityScore?: number;
    originalityScore?: number;
    impactScore?: number;
    league: string;
  };
}

export default function ShareableResultCard({ isOpen, onClose, data }: ShareableResultCardProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `🏆 I ranked #${data.rank} in ${data.eventTitle} with a QOI score of ${data.qoiScore.toFixed(1)}!\n\nQ: ${data.qualityScore || '—'} | O: ${data.originalityScore || '—'} | I: ${data.impactScore || '—'}\n\n@loopgate_ | loopgate.io`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${data.eventTitle} Result`,
          text: shareText,
          url: 'https://loopgate.io',
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-gold';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-foreground';
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-gold/30 to-gold/10 border-gold';
    if (rank === 2) return 'bg-gradient-to-br from-gray-400/20 to-gray-400/5 border-gray-400';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600/20 to-amber-600/5 border-amber-600';
    return 'bg-surface-1 border-border';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-md w-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={24} />
        </button>

        {/* The Shareable Card */}
        <div 
          className={`relative overflow-hidden border-2 ${getRankBg(data.rank)} p-6 bg-background`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)`,
              backgroundSize: '10px 10px'
            }} />
          </div>

          {/* Logo */}
          <div className="relative flex justify-center mb-6">
            <img src={loopgateLogo} alt="Loopgate" className="h-8 opacity-60" />
          </div>

          {/* Event Title */}
          <div className="relative text-center mb-6">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Event Result</p>
            <h2 className="font-display text-2xl mt-1">{data.eventTitle}</h2>
          </div>

          {/* Rank Display */}
          <div className="relative text-center mb-6 py-6 border-y border-border/50">
            {data.rank <= 3 && <Trophy className={`w-8 h-8 mx-auto mb-2 ${getRankColor(data.rank)}`} />}
            <p className={`font-display text-7xl ${getRankColor(data.rank)}`}>#{data.rank}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-2">Final Rank</p>
          </div>

          {/* User Info */}
          <div className="relative text-center mb-6">
            <p className="font-display text-xl">{data.displayName || data.username}</p>
            {data.displayName && (
              <p className="text-xs text-muted-foreground">@{data.username}</p>
            )}
            <span className="inline-block mt-2 px-3 py-1 text-[10px] uppercase tracking-wider border border-gold/50 text-gold">
              {data.league} League
            </span>
          </div>

          {/* QOI Scores */}
          <div className="relative grid grid-cols-4 gap-2 text-center bg-black/30 p-4">
            <div>
              <p className="text-xl font-bold">{data.qualityScore || '—'}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Q</p>
            </div>
            <div>
              <p className="text-xl font-bold">{data.originalityScore || '—'}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">O</p>
            </div>
            <div>
              <p className="text-xl font-bold">{data.impactScore || '—'}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">I</p>
            </div>
            <div className="bg-gold/10 -m-1 p-1">
              <p className="text-xl font-bold text-gold">{data.qoiScore.toFixed(1)}</p>
              <p className="text-[9px] text-gold uppercase tracking-wider">QOI</p>
            </div>
          </div>

          {/* Footer */}
          <div className="relative mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">loopgate.io</p>
            <p className="text-[10px] text-muted-foreground">Global Editing Index</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-1 border border-border font-semibold hover:border-gold transition-colors"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold text-black font-semibold"
          >
            <Share2 size={18} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
