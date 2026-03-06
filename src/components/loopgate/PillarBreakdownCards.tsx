import { motion } from 'framer-motion';
import { Heart, Lightbulb, Music, Fingerprint, Zap, ChevronRight } from 'lucide-react';
import { getPillarVerdict } from '@/data/pillarVerdicts';

interface PillarData {
  key: string;
  label: string;
  score: number;
  max: number;
}

interface PillarBreakdownCardsProps {
  pillars: PillarData[];
  totalScore: number;
}

const pillarIcons: Record<string, any> = {
  emotion: Heart,
  creativity: Lightbulb,
  sync: Music,
  identity: Fingerprint,
  execution: Zap,
  // GQT keys
  rhythm_score: Music,
  creativity_score: Lightbulb,
  technical_score: Zap,
  emotional_score: Heart,
  style_score: Fingerprint,
};

const pillarColors: Record<string, string> = {
  emotion: '#f472b6',
  creativity: '#fbbf24',
  sync: '#a78bfa',
  identity: '#60a5fa',
  execution: '#34d399',
  rhythm_score: '#a78bfa',
  creativity_score: '#fbbf24',
  technical_score: '#34d399',
  emotional_score: '#f472b6',
  style_score: '#60a5fa',
};

export default function PillarBreakdownCards({ pillars, totalScore }: PillarBreakdownCardsProps) {
  return (
    <div className="space-y-2">
      {/* Section header — scan aesthetic */}
      <div className="flex items-center gap-3 px-1 pb-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.35em] font-semibold">
          DETAILED ANALYSIS
        </p>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {pillars.map((pillar, i) => {
        const Icon = pillarIcons[pillar.key] || Zap;
        const color = pillarColors[pillar.key] || '#60a5fa';
        const verdict = getPillarVerdict(pillar.key, pillar.score, pillar.max);
        const pct = (pillar.score / pillar.max) * 100;

        return (
          <motion.div
            key={pillar.key}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i }}
            className="relative overflow-hidden bg-surface-1/80 border border-border/50 hover:border-border transition-colors"
          >
            {/* Score fill background */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                background: `linear-gradient(90deg, ${color} ${pct}%, transparent ${pct}%)`,
              }}
            />

            <div className="relative p-3.5">
              {/* Top row: icon, label, tag, score */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 flex items-center justify-center"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium leading-none">
                      {verdict.label}
                    </p>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${verdict.tagColor}`}>
                      {verdict.tag}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums" style={{ color }}>
                    {pillar.score}
                    <span className="text-xs text-muted-foreground font-normal">/{pillar.max}</span>
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-border/30 overflow-hidden mb-2.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.15 * i, duration: 0.6, ease: 'easeOut' }}
                  className="h-full"
                  style={{ background: color }}
                />
              </div>

              {/* Verdict description */}
              <div className="flex items-start gap-1.5">
                <ChevronRight className="w-3 h-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                <p className="text-[11px] text-foreground/70 leading-relaxed italic">
                  {verdict.description}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Overall assessment footer */}
      <div className="mt-1 p-3 border border-border/30 bg-surface-0 text-center">
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mb-0.5">
          COMPOSITE ASSESSMENT
        </p>
        <p className="text-[11px] text-foreground/60">
          {totalScore >= 80
            ? 'Your edit demonstrates mastery across multiple dimensions. Elite-tier output.'
            : totalScore >= 60
            ? 'Solid foundation with room for refinement. Focus on your weakest pillars.'
            : totalScore >= 40
            ? 'Developing skills with clear gaps. Targeted practice on weak areas will accelerate growth.'
            : 'Significant improvement needed across the board. Study fundamentals first.'}
        </p>
      </div>
    </div>
  );
}
