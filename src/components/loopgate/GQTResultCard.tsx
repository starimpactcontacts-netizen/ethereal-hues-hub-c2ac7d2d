import { motion } from 'framer-motion';
import { Star, TrendingUp, Sparkles, Zap, Quote, ChevronRight } from 'lucide-react';

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
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-gold';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };
  
  const getQOITier = (score: number) => {
    if (score >= 90) return { label: 'ELITE', color: 'text-purple-400 bg-purple-500/20' };
    if (score >= 75) return { label: 'PRO', color: 'text-gold bg-gold/20' };
    if (score >= 50) return { label: 'RISING', color: 'text-blue-400 bg-blue-500/20' };
    return { label: 'DEVELOPING', color: 'text-muted-foreground bg-muted/20' };
  };
  
  const tier = qoi_score ? getQOITier(qoi_score) : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-surface-0 via-background to-surface-0 border border-border overflow-hidden"
    >
      {/* Header with QOI Score */}
      <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-transparent p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Global QOI Score</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl text-gold">
                {qoi_score?.toFixed(1) || '--'}
              </span>
              <span className="text-muted-foreground text-sm">/ 100</span>
            </div>
          </div>
          {tier && (
            <div className={`px-3 py-1 text-xs font-display uppercase tracking-wider ${tier.color}`}>
              {tier.label}
            </div>
          )}
        </div>
      </div>
      
      {/* Score Breakdown */}
      <div className="p-4 space-y-3 border-b border-border/50">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Star className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className={`font-display text-lg ${quality_score ? getScoreColor(quality_score) : 'text-muted-foreground'}`}>
              {quality_score?.toFixed(0) || '--'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Quality</p>
          </div>
          <div className="text-center">
            <Sparkles className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className={`font-display text-lg ${originality_score ? getScoreColor(originality_score) : 'text-muted-foreground'}`}>
              {originality_score?.toFixed(0) || '--'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Originality</p>
          </div>
          <div className="text-center">
            <Zap className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className={`font-display text-lg ${impact_score ? getScoreColor(impact_score) : 'text-muted-foreground'}`}>
              {impact_score?.toFixed(0) || '--'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Impact</p>
          </div>
        </div>
      </div>
      
      {/* Judge Commentary */}
      {judge_commentary && (
        <div className="p-4 border-b border-border/50">
          <div className="flex items-start gap-2">
            <Quote className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground italic">"{judge_commentary}"</p>
              {judge_archetype && (
                <p className="text-[10px] text-muted-foreground mt-2">— {judge_archetype}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Projections & Actions */}
      <div className="p-4 space-y-3">
        {rank_projection && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-gold" />
            <span className="text-muted-foreground">Projected rank:</span>
            <span className="text-foreground">{rank_projection}</span>
          </div>
        )}
        
        {suggested_action && (
          <div className="flex items-start gap-2 text-sm">
            <ChevronRight className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground">Next step: </span>
              <span className="text-foreground">{suggested_action}</span>
            </div>
          </div>
        )}
        
        {house_fit && house_fit.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">House Compatibility</p>
            <div className="flex flex-wrap gap-2">
              {house_fit.map((house) => (
                <span 
                  key={house.houseId}
                  className="text-xs px-2 py-1 bg-gold/10 text-gold border border-gold/30"
                >
                  {house.houseName}: {house.fitLevel}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
