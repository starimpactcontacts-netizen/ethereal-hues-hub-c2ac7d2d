import { useState } from "react";
import { Share2, Trophy, X, Copy, Check, Skull, Crown, Shield, Medal } from "lucide-react";
import { toast } from "sonner";
import loopgateLogo from "@/assets/loopgate-logo.png";
import { getArchetypeInfo, getRankProjection, JudgeArchetype } from "@/data/judgeCommentary";

interface GatekeeperResultCardProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    username: string;
    displayName?: string;
    qoiScore: number;
    qualityScore: number;
    originalityScore: number;
    impactScore: number;
    judgeArchetype: JudgeArchetype;
    judgeCommentary: string;
    rankProjection: string;
    houseFit?: { houseId: string; houseName: string; fitLevel: string }[];
    suggestedAction?: string;
  };
}

export default function GatekeeperResultCard({ isOpen, onClose, data }: GatekeeperResultCardProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const archetypeInfo = getArchetypeInfo(data.judgeArchetype);
  const rankInfo = getRankProjection(data.qoiScore);

  const shareText = `⚔️ GATEKEEPER TEST RESULT

QOI Score: ${data.qoiScore.toFixed(1)}
Rank: ${rankInfo.tier} ${rankInfo.level}
Judge: ${archetypeInfo.name}

"${data.judgeCommentary}"

Take the test at loopgate.io
@loopgate_`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Gatekeeper Test Result',
          text: shareText,
          url: 'https://loopgate.io/gatekeeper',
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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Apex': return 'text-purple-400';
      case 'Elite': return 'text-gold';
      case 'Gold': return 'text-amber-400';
      case 'Silver': return 'text-gray-300';
      case 'Bronze': return 'text-amber-600';
      default: return 'text-foreground';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Apex': return Crown;
      case 'Elite': return Crown;
      case 'Gold': return Trophy;
      case 'Silver': return Medal;
      case 'Bronze': return Shield;
      default: return Shield;
    }
  };

  const TierIcon = getTierIcon(rankInfo.tier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="relative max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* The Shareable Card */}
        <div className="relative overflow-hidden bg-background border-2 border-gold/50">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)`,
              backgroundSize: '10px 10px'
            }} />
          </div>

          {/* Header with Logo */}
          <div className="relative bg-gold/10 border-b border-gold/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skull className="w-6 h-6 text-gold" />
                <span className="font-display text-lg text-gold tracking-wider">GATEKEEPER TEST</span>
              </div>
              <img src={loopgateLogo} alt="Loopgate" className="h-6 opacity-60" />
            </div>
          </div>

          {/* Main Content */}
          <div className="relative p-6">
            {/* QOI Score - Big Display */}
            <div className="text-center mb-6">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-2">Your QOI Score</p>
              <p className="font-display text-7xl text-gold">{data.qoiScore.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground mt-1">out of 300</p>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-2 mb-6 bg-surface-1 p-4 border border-border">
              <div className="text-center">
                <p className="text-2xl font-bold">{data.qualityScore}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Quality</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-2xl font-bold">{data.originalityScore}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Originality</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{data.impactScore}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Impact</p>
              </div>
            </div>

            {/* Rank Projection */}
            <div className="mb-6 p-4 bg-surface-0 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">Rank Projection</p>
              <div className="flex items-center gap-3">
                <TierIcon className={`w-8 h-8 ${getTierColor(rankInfo.tier)}`} />
                <div>
                  <p className={`font-display text-2xl ${getTierColor(rankInfo.tier)}`}>
                    {rankInfo.tier} {rankInfo.level}
                  </p>
                  <p className="text-xs text-muted-foreground">{rankInfo.description}</p>
                </div>
              </div>
            </div>

            {/* Judge Commentary */}
            <div className="mb-6 p-4 bg-gold/5 border border-gold/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{archetypeInfo.icon}</span>
                <div>
                  <p className="font-display text-sm text-gold">{archetypeInfo.name}</p>
                  <p className="text-[10px] text-muted-foreground">{archetypeInfo.description}</p>
                </div>
              </div>
              <p className="text-lg italic text-foreground">"{data.judgeCommentary}"</p>
            </div>

            {/* House Fit */}
            {data.houseFit && data.houseFit.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">House Fit Analysis</p>
                <div className="space-y-2">
                  {data.houseFit.slice(0, 3).map((house, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-surface-1 p-2 border border-border">
                      <span className="font-display text-sm">{house.houseName}</span>
                      <span className={`text-xs uppercase tracking-wider ${
                        house.fitLevel === 'strong' ? 'text-green-400' :
                        house.fitLevel === 'potential' ? 'text-gold' : 'text-muted-foreground'
                      }`}>
                        {house.fitLevel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Action */}
            {data.suggestedAction && (
              <div className="p-3 bg-surface-1 border border-border text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">Suggested Action</p>
                <p className="text-sm">{data.suggestedAction}</p>
              </div>
            )}

            {/* User Info */}
            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <p className="font-display text-lg">{data.displayName || data.username}</p>
              {data.displayName && (
                <p className="text-xs text-muted-foreground">@{data.username}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="relative px-6 py-4 bg-surface-0 border-t border-border flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">loopgate.io</p>
            <p className="text-[10px] text-muted-foreground">Face the Judge</p>
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
