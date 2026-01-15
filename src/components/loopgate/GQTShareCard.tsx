import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, Copy, Check, Download, Flame, Crown, Star, Zap, Shield, Music, Lightbulb, Settings, Heart, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getRankFromScore, getClassFromScore, scoringPillars, GQTRank, getIndexFloorFromRank } from '@/data/gqtConfig';
import loopgateLogo from '@/assets/loopgate-logo.png';

interface GQTShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    username: string;
    displayName?: string;
    score: number;
    rhythmScore?: number;
    creativityScore?: number;
    technicalScore?: number;
    emotionalScore?: number;
    styleScore?: number;
    judgeQuote?: string;
    software?: string;
    yearsEditing?: string;
  };
}

// Icon mapping for pillars
const pillarIcons: Record<string, any> = {
  music: Music,
  lightbulb: Lightbulb,
  settings: Settings,
  heart: Heart,
  fingerprint: Fingerprint,
};

// Class icons
const classIcons: Record<string, any> = {
  's++': Flame,
  's+': Flame,
  's': Crown,
  'a': Zap,
  'b': Star,
  'c': Shield,
  'd': Shield,
  'f': Shield,
};

// Rank-specific card styling
const getRankCardStyle = (rank: GQTRank) => {
  switch (rank) {
    case 'S++':
      return {
        bgGradient: 'from-gold/40 via-amber-900/30 to-black',
        borderColor: 'border-gold',
        glowColor: 'shadow-[0_0_60px_10px_rgba(212,175,55,0.3)]',
        textColor: 'text-gold',
        accentBg: 'bg-gold/20',
      };
    case 'S+':
      return {
        bgGradient: 'from-gold/30 via-amber-900/20 to-black',
        borderColor: 'border-gold/80',
        glowColor: 'shadow-[0_0_40px_8px_rgba(212,175,55,0.2)]',
        textColor: 'text-gold',
        accentBg: 'bg-gold/15',
      };
    case 'S':
      return {
        bgGradient: 'from-amber-400/25 via-amber-900/15 to-black',
        borderColor: 'border-amber-400',
        glowColor: '',
        textColor: 'text-amber-400',
        accentBg: 'bg-amber-400/15',
      };
    case 'A':
      return {
        bgGradient: 'from-emerald-400/20 via-emerald-900/10 to-black',
        borderColor: 'border-emerald-400',
        glowColor: '',
        textColor: 'text-emerald-400',
        accentBg: 'bg-emerald-400/15',
      };
    case 'B':
      return {
        bgGradient: 'from-blue-400/20 via-blue-900/10 to-black',
        borderColor: 'border-blue-400',
        glowColor: '',
        textColor: 'text-blue-400',
        accentBg: 'bg-blue-400/15',
      };
    case 'C':
      return {
        bgGradient: 'from-slate-400/15 via-slate-900/10 to-black',
        borderColor: 'border-slate-400/50',
        glowColor: '',
        textColor: 'text-slate-300',
        accentBg: 'bg-slate-400/15',
      };
    case 'D':
      return {
        bgGradient: 'from-orange-500/15 via-orange-900/10 to-black',
        borderColor: 'border-orange-500/50',
        glowColor: '',
        textColor: 'text-orange-400',
        accentBg: 'bg-orange-400/15',
      };
    case 'F':
    default:
      return {
        bgGradient: 'from-red-500/15 via-red-900/10 to-black',
        borderColor: 'border-red-500/40',
        glowColor: '',
        textColor: 'text-red-500',
        accentBg: 'bg-red-500/15',
      };
  }
};

export default function GQTShareCard({ isOpen, onClose, data }: GQTShareCardProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const rank = getRankFromScore(data.score);
  const gqtClass = getClassFromScore(data.score);
  const indexFloor = getIndexFloorFromRank(rank.rank);
  const cardStyle = getRankCardStyle(rank.rank);
  const ClassIcon = classIcons[gqtClass.id] || Shield;

  const pillarsWithScores = [
    { ...scoringPillars[0], score: data.rhythmScore },
    { ...scoringPillars[1], score: data.creativityScore },
    { ...scoringPillars[2], score: data.technicalScore },
    { ...scoringPillars[3], score: data.emotionalScore },
    { ...scoringPillars[4], score: data.styleScore },
  ];

  const shareText = `🎬 GQT RESULT: ${rank.rank} CLASS

Score: ${data.score.toFixed(0)}/100
Class: ${gqtClass.name}
${data.judgeQuote ? `\n"${data.judgeQuote}"` : ''}

Take the Global QOI Test → loopgate.io/gqt

#Loopgate #GQT #EditingRank`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My GQT Rank: ${rank.rank}`,
          text: shareText,
          url: 'https://loopgate.io/gqt',
        });
      } catch {
        handleCopy();
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

  const handleDownload = async () => {
    toast.success('Screenshot this card to share!');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X size={24} />
          </button>

          {/* The Shareable Card */}
          <div 
            ref={cardRef}
            className={`relative overflow-hidden border-2 ${cardStyle.borderColor} ${cardStyle.glowColor} bg-gradient-to-br ${cardStyle.bgGradient}`}
          >
            {/* Animated background for S-tier */}
            {rank.rank.includes('S') && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5"
                />
              </div>
            )}

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]">
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, currentColor 20px, currentColor 21px)',
                }}
              />
            </div>

            {/* Header with Logo */}
            <div className="relative px-6 pt-6 pb-4 border-b border-border/30">
              <div className="flex items-center justify-between">
                <img src={loopgateLogo} alt="Loopgate" className="h-6 opacity-70" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-[0.3em]">
                  GLOBAL QOI TEST
                </span>
              </div>
            </div>

            {/* Main Rank Display */}
            <div className="relative px-6 py-8 text-center">
              {/* Big Rank Letter */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={`font-display text-[120px] leading-none ${cardStyle.textColor}`}
              >
                {rank.rank}
              </motion.div>
              
              {/* Score */}
              <div className="mt-2 flex items-baseline justify-center gap-2">
                <span className="font-display text-4xl text-foreground">{data.score.toFixed(0)}</span>
                <span className="text-xl text-muted-foreground">/ 100</span>
              </div>
              
              {/* Rank Description */}
              <p className={`text-sm uppercase tracking-widest mt-2 ${cardStyle.textColor}`}>
                {rank.description}
              </p>
            </div>

            {/* User + League */}
            <div className="relative px-6 py-4 border-y border-border/30 flex items-center justify-between">
              <div>
                <p className="font-display text-lg text-foreground">
                  {data.displayName || data.username}
                </p>
                {data.displayName && (
                  <p className="text-xs text-muted-foreground">@{data.username}</p>
                )}
              </div>
              <div className={`px-3 py-2 ${cardStyle.accentBg} border ${cardStyle.borderColor} flex items-center gap-2`}>
                <ClassIcon className={`w-4 h-4 ${gqtClass.color}`} />
                <span className={`text-xs font-display uppercase ${gqtClass.color}`}>{gqtClass.name}</span>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="relative px-6 py-4 grid grid-cols-5 gap-1">
              {pillarsWithScores.map((pillar) => {
                const Icon = pillarIcons[pillar.icon] || Star;
                return (
                  <div key={pillar.key} className="text-center">
                    <Icon className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                    <p className="font-display text-sm text-foreground">
                      {pillar.score?.toFixed(0) ?? '--'}
                    </p>
                    <p className="text-[7px] text-muted-foreground uppercase tracking-wider">
                      /{pillar.maxPoints}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Judge Quote */}
            {data.judgeQuote && (
              <div className="relative px-6 py-4 border-t border-border/30">
                <p className="text-sm text-foreground/80 italic text-center leading-relaxed">
                  "{data.judgeQuote}"
                </p>
              </div>
            )}

            {/* Badges */}
            <div className="relative px-6 py-4 border-t border-border/30 flex items-center justify-center gap-3">
              {indexFloor > 0 && (
                <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-gold/10 text-gold border border-gold/30">
                  +{indexFloor} INDEX
                </span>
              )}
              {data.software && (
                <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-surface-1 text-muted-foreground border border-border">
                  {data.software}
                </span>
              )}
              {data.yearsEditing && (
                <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-surface-1 text-muted-foreground border border-border">
                  {data.yearsEditing}
                </span>
              )}
            </div>

            {/* Footer CTA */}
            <div className="relative px-6 py-4 border-t border-border/30 bg-black/30">
              <p className="text-center text-xs text-muted-foreground">
                Take the test → <span className="text-gold font-semibold">loopgate.io/gqt</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 h-12 border-border"
            >
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Text'}
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1 h-12 border-border"
            >
              <Download className="w-4 h-4 mr-2" />
              Screenshot
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 h-12 bg-gold text-background hover:bg-gold/90"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Share hint */}
          <p className="text-center text-[10px] text-muted-foreground mt-4">
            Screenshot & post to TikTok / Instagram
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
