import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, Share2, Crown, Trophy, TrendingUp, Music, Lightbulb, Settings, Heart, Fingerprint, Shield, Flame, Zap, Users, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getRankFromScore, getPercentile, getClassFromScore, scoringPillars, GQTRank, getIndexFloorFromRank, gqtClasses } from '@/data/gqtConfig';
import GQTShareCard from './GQTShareCard';
import PillarBreakdownCards from './PillarBreakdownCards';

interface GQTResultCardProps {
  submission: {
    qoi_score: number | null;
    quality_score: number | null;
    originality_score: number | null;
    impact_score: number | null;
    rhythm_score?: number | null;
    creativity_score?: number | null;
    technical_score?: number | null;
    emotional_score?: number | null;
    style_score?: number | null;
    gqt_rank?: string | null;
    judge_commentary: string | null;
    judge_archetype: string | null;
    rank_projection: string | null;
    suggested_action: string | null;
    house_fit: { houseId: string; houseName: string; fitLevel: string }[] | null;
    editing_software?: string | null;
    years_editing?: string | null;
  };
  username?: string;
  displayName?: string;
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

// Score color based on percentage of max
const getScoreColor = (score: number | null, max: number) => {
  if (score === null) return 'text-muted-foreground';
  const pct = (score / max) * 100;
  if (pct >= 85) return 'text-gold';
  if (pct >= 70) return 'text-emerald-400';
  if (pct >= 50) return 'text-blue-400';
  if (pct >= 30) return 'text-orange-400';
  return 'text-red-400';
};

// Rank-specific card styling
const getRankCardStyle = (rank: GQTRank) => {
  switch (rank) {
    case 'S++':
      return {
        containerClass: 'border-2 border-gold shadow-lg shadow-gold/30',
        headerBg: 'bg-gradient-to-br from-gold/30 via-amber-500/20 to-gold/10',
        hasGlow: true,
        hasParticles: true,
      };
    case 'S+':
      return {
        containerClass: 'border-2 border-gold/80 shadow-md shadow-gold/20',
        headerBg: 'bg-gradient-to-br from-gold/20 to-gold/5',
        hasGlow: true,
        hasParticles: true,
      };
    case 'S':
      return {
        containerClass: 'border-2 border-amber-400',
        headerBg: 'bg-gradient-to-br from-amber-400/20 to-amber-400/5',
        hasGlow: false,
        hasParticles: false,
      };
    case 'A':
      return {
        containerClass: 'border-2 border-emerald-400',
        headerBg: 'bg-gradient-to-br from-emerald-400/15 to-emerald-400/5',
        hasGlow: false,
        hasParticles: false,
      };
    case 'B':
      return {
        containerClass: 'border border-blue-400',
        headerBg: 'bg-gradient-to-br from-blue-400/15 to-blue-400/5',
        hasGlow: false,
        hasParticles: false,
      };
    case 'C':
      return {
        containerClass: 'border border-slate-400/50',
        headerBg: 'bg-surface-1',
        hasGlow: false,
        hasParticles: false,
      };
    case 'D':
      return {
        containerClass: 'border border-orange-500/40',
        headerBg: 'bg-gradient-to-br from-orange-500/10 to-surface-1',
        hasGlow: false,
        hasParticles: false,
      };
    case 'F':
    default:
      return {
        containerClass: 'border border-red-500/30',
        headerBg: 'bg-gradient-to-br from-red-500/10 to-surface-1',
        hasGlow: false,
        hasParticles: false,
      };
  }
};

export default function GQTResultCard({ submission, username, displayName }: GQTResultCardProps) {
  const [showShareCard, setShowShareCard] = useState(false);
  
  const { 
    qoi_score, 
    rhythm_score,
    creativity_score,
    technical_score,
    emotional_score,
    style_score,
    gqt_rank,
    judge_commentary,
    judge_archetype,
    rank_projection,
    suggested_action,
    house_fit,
    editing_software,
    years_editing,
  } = submission;
  
  // Use the new 100-point score if available, otherwise calculate from pillars or use legacy
  const totalScore = qoi_score ?? 0;
  const rank = gqt_rank ? getRankFromScore(totalScore) : (totalScore > 0 ? getRankFromScore(totalScore) : null);
  const percentile = totalScore > 0 ? getPercentile(totalScore) : null;
  const projectedClass = totalScore > 0 ? getClassFromScore(totalScore) : null;
  
  // Build pillars array with scores
  const pillarsWithScores = [
    { ...scoringPillars[0], score: rhythm_score },
    { ...scoringPillars[1], score: creativity_score },
    { ...scoringPillars[2], score: technical_score },
    { ...scoringPillars[3], score: emotional_score },
    { ...scoringPillars[4], score: style_score },
  ];
  
  const handleShare = async () => {
    const shareText = `My GQT Score: ${totalScore.toFixed(0)} / 100
Rank: ${rank?.rank || 'N/A'}
${projectedClass ? `Class: ${projectedClass.name}` : ''}

Take the Global QOI Test at loopgate.io/gqt`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Global QOI Test Results',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Results copied to clipboard!');
      }
    } catch (err) {
      // User cancelled share
    }
  };
  
  const cardStyle = rank ? getRankCardStyle(rank.rank) : null;
  const indexFloor = rank ? getIndexFloorFromRank(rank.rank) : 0;
  const ClassIcon = projectedClass ? (classIcons[projectedClass.id] || Shield) : Shield;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden bg-gradient-to-br from-surface-0 via-background to-surface-0 ${cardStyle?.containerClass || 'border-2 border-border'}`}
    >
      {/* Animated glow for S-tier */}
      {cardStyle?.hasGlow && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent"
          />
        </div>
      )}
      
      {/* Animated energy line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className={`absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent ${rank?.rank.includes('S') ? 'via-gold/20' : 'via-gold/10'} to-transparent skew-x-12`}
        />
      </div>
      
      {/* Header with Score + Rank */}
      <div className={`relative ${cardStyle?.headerBg || rank?.bgClass || 'bg-surface-1'} border-b-2 ${rank?.borderClass || 'border-border'} p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-2">FINAL SCORE</p>
            <div className="flex items-baseline gap-3">
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={`font-display text-7xl ${rank?.color || 'text-foreground'}`}
              >
                {totalScore.toFixed(0)}
              </motion.span>
              <span className="text-2xl text-muted-foreground font-display">/ 100</span>
            </div>
            {percentile !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Top {percentile}% globally
              </p>
            )}
          </div>
          
          {/* Rank Badge */}
          {rank && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`px-5 py-3 ${rank.bgClass} border-2 ${rank.borderClass} flex flex-col items-center ${rank.rank.includes('S') ? 'shadow-lg' : ''}`}
            >
              <motion.span 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.5 }}
                className={`font-display text-5xl ${rank.color}`}
              >
                {rank.rank}
              </motion.span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">
                {rank.description}
              </span>
            </motion.div>
          )}
        </div>
        
        {/* Index Floor Badge */}
        {indexFloor > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 pt-4 border-t border-border/30 flex items-center gap-3"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/30">
              <Zap className="w-3 h-3 text-gold" />
              <span className="text-xs font-display text-gold">+{indexFloor} INDEX FLOOR</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Starting power unlocked</span>
          </motion.div>
        )}
      </div>
      
      {/* 5-Pillar Breakdown */}
      <div className="p-5 border-b border-border/50">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-4">SCORE BREAKDOWN</p>
        <div className="space-y-3">
          {pillarsWithScores.map((pillar, i) => {
            const Icon = pillarIcons[pillar.icon] || Star;
            const score = pillar.score;
            const pct = score !== null ? (score / pillar.maxPoints) * 100 : 0;
            
            return (
              <motion.div 
                key={pillar.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center gap-3"
              >
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{pillar.label}</span>
                    <span className={`text-sm font-display ${getScoreColor(score ?? null, pillar.maxPoints)}`}>
                      {score?.toFixed(0) ?? '--'} / {pillar.maxPoints}
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-1 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.2 + 0.1 * i, duration: 0.5 }}
                      className={`h-full ${score !== null && pct >= 70 ? 'bg-gold' : 'bg-muted-foreground/50'}`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Projected Class */}
      {projectedClass && (
        <div className="p-5 border-b border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-3">YOUR CLASS</p>
          <div className={`${projectedClass.bgClass} border border-border p-4 flex items-center gap-4`}>
            <div className={`w-12 h-12 ${projectedClass.bgClass} border border-current flex items-center justify-center ${projectedClass.color}`}>
              <ClassIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className={`font-display text-2xl ${projectedClass.color}`}>{projectedClass.name}</p>
              <p className="text-xs text-muted-foreground">{projectedClass.subtitle}</p>
            </div>
            {indexFloor > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Index Floor</p>
                <p className={`font-display text-xl ${projectedClass.color}`}>+{indexFloor}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Judge Commentary */}
      {judge_commentary && (
        <div className="p-5 border-b border-border/50 bg-surface-1/50">
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 text-gold shrink-0 mt-1" />
            <div>
              <p className="text-base text-foreground leading-relaxed italic">
                "{judge_commentary}"
              </p>
              {judge_archetype && (
                <p className="text-xs text-gold mt-3 font-semibold uppercase tracking-wider">
                  — {judge_archetype}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Next Steps */}
      {suggested_action && (
        <div className="p-5 border-b border-border/50">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Next Step</p>
              <p className="text-sm text-foreground">{suggested_action}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* House Compatibility */}
      {house_fit && house_fit.length > 0 && (
        <div className="p-5 border-b border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-3">HOUSE COMPATIBILITY</p>
          <div className="flex flex-wrap gap-2">
            {house_fit.map((house) => (
              <span 
                key={house.houseId}
                className="text-xs px-3 py-1.5 bg-gold/10 text-gold border border-gold/30"
              >
                {house.houseName}: {house.fitLevel}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Share Card */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowShareCard(true)}
            className="h-12 bg-gold text-background hover:bg-gold/90"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Card
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="h-12 border-gold/50 text-gold hover:bg-gold/10"
          >
            <Users className="w-4 h-4 mr-2" />
            Challenge Friend
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-3">
          Flex your score on TikTok / Instagram
        </p>
      </div>
      
      {/* Share Card Modal */}
      <GQTShareCard
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        data={{
          username: username || 'editor',
          displayName: displayName,
          score: totalScore,
          rhythmScore: rhythm_score ?? undefined,
          creativityScore: creativity_score ?? undefined,
          technicalScore: technical_score ?? undefined,
          emotionalScore: emotional_score ?? undefined,
          styleScore: style_score ?? undefined,
          judgeQuote: judge_commentary ?? undefined,
          software: editing_software ?? undefined,
          yearsEditing: years_editing ?? undefined,
        }}
      />
    </motion.div>
  );
}
