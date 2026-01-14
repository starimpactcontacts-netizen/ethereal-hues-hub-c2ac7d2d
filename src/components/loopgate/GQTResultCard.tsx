import { motion } from 'framer-motion';
import { Star, Sparkles, Zap, Quote, ChevronRight, Share2, Shield, Crown, Skull, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface GQTResultCardProps {
  submission: {
    qoi_score: number | null;
    quality_score: number | null;
    originality_score: number | null;
    impact_score: number | null;
    judge_commentary: string | null;
    judge_archetype: string | null;
    rank_projection: string | null;
    suggested_action: string | null;
    house_fit: { houseId: string; houseName: string; fitLevel: string }[] | null;
  };
}

// QOI Tier system (0-15 scale)
const getQOITier = (score: number) => {
  if (score >= 15) return { label: 'APEX', color: 'text-gold', bg: 'bg-gradient-to-r from-gold/30 to-gold/10', border: 'border-gold' };
  if (score >= 13) return { label: 'DIAMOND', color: 'text-cyan-400', bg: 'bg-gradient-to-r from-cyan-400/20 to-cyan-400/5', border: 'border-cyan-400' };
  if (score >= 10) return { label: 'PLATINUM', color: 'text-purple-400', bg: 'bg-gradient-to-r from-purple-400/20 to-purple-400/5', border: 'border-purple-400' };
  if (score >= 7) return { label: 'GOLD', color: 'text-amber-400', bg: 'bg-gradient-to-r from-amber-400/20 to-amber-400/5', border: 'border-amber-400' };
  if (score >= 4) return { label: 'SILVER', color: 'text-slate-300', bg: 'bg-gradient-to-r from-slate-300/20 to-slate-300/5', border: 'border-slate-300' };
  return { label: 'BRONZE', color: 'text-orange-600', bg: 'bg-gradient-to-r from-orange-600/20 to-orange-600/5', border: 'border-orange-600' };
};

// Score color coding
const getScoreColor = (score: number) => {
  if (score >= 13) return 'text-gold';
  if (score >= 10) return 'text-green-400';
  if (score >= 7) return 'text-yellow-400';
  if (score >= 4) return 'text-orange-400';
  return 'text-red-400';
};

// Projected league from score
const getProjectedLeague = (score: number) => {
  if (score >= 14.5) return { name: 'CARTEL', subtitle: 'Blacklist Potential', icon: Skull, color: 'text-gold', bg: 'bg-gold/10' };
  if (score >= 12) return { name: 'ELITE', subtitle: 'The 1%', icon: Crown, color: 'text-gold', bg: 'bg-gold/10' };
  if (score >= 8) return { name: 'PRO', subtitle: 'The Ascended', icon: Star, color: 'text-blue-400', bg: 'bg-blue-400/10' };
  return { name: 'OPEN', subtitle: 'The Pit', icon: Shield, color: 'text-muted-foreground', bg: 'bg-muted/20' };
};

export default function GQTResultCard({ submission }: GQTResultCardProps) {
  const { 
    qoi_score, 
    quality_score, 
    originality_score, 
    impact_score,
    judge_commentary,
    judge_archetype,
    rank_projection,
    suggested_action,
    house_fit
  } = submission;
  
  const tier = qoi_score !== null ? getQOITier(qoi_score) : null;
  const projectedLeague = qoi_score !== null ? getProjectedLeague(qoi_score) : null;
  const percentile = qoi_score !== null ? Math.min(99, Math.round((qoi_score / 15) * 100)) : null;
  
  const handleShare = async () => {
    const shareText = `My QOI Score: ${qoi_score?.toFixed(1)} / 15
Tier: ${tier?.label}
Projected League: ${projectedLeague?.name}

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
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden bg-gradient-to-br from-surface-0 via-background to-surface-0 border-2 border-border"
    >
      {/* Animated energy lines (UFC/anime style) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-gold/10 to-transparent skew-x-12"
        />
      </div>
      
      {/* Header with QOI Score - BATTLE RESULT STYLE */}
      <div className={`relative ${tier?.bg || 'bg-surface-1'} border-b-2 ${tier?.border || 'border-border'} p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-2">FINAL SCORE</p>
            <div className="flex items-baseline gap-3">
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={`font-display text-7xl ${tier?.color || 'text-foreground'}`}
              >
                {qoi_score?.toFixed(1) || '--'}
              </motion.span>
              <span className="text-2xl text-muted-foreground font-display">/ 15</span>
            </div>
            {percentile !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Top {100 - percentile}% globally
              </p>
            )}
          </div>
          
          {/* QOI Tier Badge */}
          {tier && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`px-4 py-2 ${tier.bg} border ${tier.border} flex flex-col items-center`}
            >
              <Trophy className={`w-6 h-6 ${tier.color} mb-1`} />
              <span className={`font-display text-lg ${tier.color}`}>{tier.label}</span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest">QOI TIER</span>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Score Breakdown */}
      <div className="p-5 border-b border-border/50">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-4">BREAKDOWN</p>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <Star className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className={`font-display text-3xl ${quality_score ? getScoreColor(quality_score) : 'text-muted-foreground'}`}>
              {quality_score?.toFixed(0) || '--'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quality</p>
          </div>
          <div className="text-center">
            <Sparkles className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className={`font-display text-3xl ${originality_score ? getScoreColor(originality_score) : 'text-muted-foreground'}`}>
              {originality_score?.toFixed(0) || '--'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Originality</p>
          </div>
          <div className="text-center">
            <Zap className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className={`font-display text-3xl ${impact_score ? getScoreColor(impact_score) : 'text-muted-foreground'}`}>
              {impact_score?.toFixed(0) || '--'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Impact</p>
          </div>
        </div>
      </div>
      
      {/* Projected League */}
      {projectedLeague && (
        <div className="p-5 border-b border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-3">PROJECTED LEAGUE</p>
          <div className={`${projectedLeague.bg} border border-border p-4 flex items-center gap-4`}>
            <div className={`w-12 h-12 ${projectedLeague.bg} border border-current flex items-center justify-center ${projectedLeague.color}`}>
              <projectedLeague.icon className="w-6 h-6" />
            </div>
            <div>
              <p className={`font-display text-2xl ${projectedLeague.color}`}>{projectedLeague.name}</p>
              <p className="text-xs text-muted-foreground">{projectedLeague.subtitle}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Judge Commentary - BRUTAL MODE */}
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
        <Button
          onClick={handleShare}
          variant="outline"
          className="w-full border-gold/50 text-gold hover:bg-gold/10 h-12"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Your Results
        </Button>
        <p className="text-[10px] text-center text-muted-foreground mt-3">
          Show off your score on TikTok / Instagram
        </p>
      </div>
    </motion.div>
  );
}
