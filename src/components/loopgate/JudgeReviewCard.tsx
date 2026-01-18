import { forwardRef } from 'react';
import { Gavel, Star, Sparkles, Flame, Zap, Crown, Skull, Award } from 'lucide-react';

// Card template types
export type CardTemplate = 
  | 'dark-minimal' 
  | 'neon' 
  | 'cinematic' 
  | 's-class-gold' 
  | 'f-class-red' 
  | 'clean-white';

interface JudgeReviewCardProps {
  editorUsername: string;
  judgeUsername: string;
  judgeAvatarUrl?: string | null;
  totalScore: number;
  emotionScore: number;
  creativityScore: number;
  syncScore: number;
  identityScore: number;
  executionScore: number;
  comment?: string;
  template: CardTemplate;
  className?: string;
}

const SCORE_PILLARS = [
  { key: 'emotion', label: 'Emotion', max: 15 },
  { key: 'creativity', label: 'Creativity', max: 25 },
  { key: 'sync', label: 'Sync', max: 25 },
  { key: 'identity', label: 'Identity', max: 10 },
  { key: 'execution', label: 'Execution', max: 25 },
] as const;

function getGrade(score: number): { grade: string; label: string } {
  if (score >= 95) return { grade: 'S++', label: 'LEGENDARY' };
  if (score >= 90) return { grade: 'S+', label: 'ELITE' };
  if (score >= 80) return { grade: 'S', label: 'SUPERIOR' };
  if (score >= 70) return { grade: 'A', label: 'EXCELLENT' };
  if (score >= 60) return { grade: 'B', label: 'GOOD' };
  if (score >= 50) return { grade: 'C', label: 'AVERAGE' };
  if (score >= 40) return { grade: 'D', label: 'BELOW AVG' };
  return { grade: 'F', label: 'FAILED' };
}

const TEMPLATE_STYLES: Record<CardTemplate, {
  bg: string;
  border: string;
  accent: string;
  text: string;
  muted: string;
  pillBg: string;
  gradeBg: string;
  gradeText: string;
  icon: typeof Star;
}> = {
  'dark-minimal': {
    bg: 'bg-[#0a0a0a]',
    border: 'border-[#1a1a1a]',
    accent: 'text-white',
    text: 'text-white',
    muted: 'text-[#666]',
    pillBg: 'bg-[#111]',
    gradeBg: 'bg-white',
    gradeText: 'text-black',
    icon: Star,
  },
  'neon': {
    bg: 'bg-[#0a0011]',
    border: 'border-[#ff00ff]/40',
    accent: 'text-[#ff00ff]',
    text: 'text-white',
    muted: 'text-[#ff00ff]/60',
    pillBg: 'bg-[#ff00ff]/10',
    gradeBg: 'bg-gradient-to-r from-[#ff00ff] to-[#00ffff]',
    gradeText: 'text-black',
    icon: Zap,
  },
  'cinematic': {
    bg: 'bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e]',
    border: 'border-[#2d2d44]',
    accent: 'text-[#ffd700]',
    text: 'text-white',
    muted: 'text-[#888]',
    pillBg: 'bg-[#1a1a2e]',
    gradeBg: 'bg-gradient-to-r from-[#ffd700] to-[#ff8c00]',
    gradeText: 'text-black',
    icon: Award,
  },
  's-class-gold': {
    bg: 'bg-gradient-to-br from-[#1a1500] via-[#0f0a00] to-[#1a1500]',
    border: 'border-[#ffd700]/50',
    accent: 'text-[#ffd700]',
    text: 'text-[#ffeaa7]',
    muted: 'text-[#ffd700]/60',
    pillBg: 'bg-[#ffd700]/10',
    gradeBg: 'bg-gradient-to-r from-[#ffd700] via-[#fff] to-[#ffd700]',
    gradeText: 'text-black',
    icon: Crown,
  },
  'f-class-red': {
    bg: 'bg-gradient-to-br from-[#1a0000] via-[#0f0000] to-[#1a0505]',
    border: 'border-[#ff0000]/50',
    accent: 'text-[#ff3333]',
    text: 'text-[#ffcccc]',
    muted: 'text-[#ff0000]/60',
    pillBg: 'bg-[#ff0000]/10',
    gradeBg: 'bg-gradient-to-r from-[#ff0000] to-[#ff4444]',
    gradeText: 'text-white',
    icon: Skull,
  },
  'clean-white': {
    bg: 'bg-[#fafafa]',
    border: 'border-[#e0e0e0]',
    accent: 'text-[#000]',
    text: 'text-[#111]',
    muted: 'text-[#666]',
    pillBg: 'bg-[#f0f0f0]',
    gradeBg: 'bg-black',
    gradeText: 'text-white',
    icon: Sparkles,
  },
};

const JudgeReviewCard = forwardRef<HTMLDivElement, JudgeReviewCardProps>(({
  editorUsername,
  judgeUsername,
  judgeAvatarUrl,
  totalScore,
  emotionScore,
  creativityScore,
  syncScore,
  identityScore,
  executionScore,
  comment,
  template,
  className = '',
}, ref) => {
  const style = TEMPLATE_STYLES[template];
  const { grade, label } = getGrade(totalScore);
  const Icon = style.icon;
  
  const scores = {
    emotion: emotionScore,
    creativity: creativityScore,
    sync: syncScore,
    identity: identityScore,
    execution: executionScore,
  };

  return (
    <div
      ref={ref}
      className={`${style.bg} ${style.border} border-2 rounded-2xl p-6 w-[400px] ${className}`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Header - Loopgate branding */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${style.pillBg} flex items-center justify-center`}>
            <Gavel className={`w-4 h-4 ${style.accent}`} />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest ${style.muted}`}>
              LOOPGATE REVIEW
            </p>
          </div>
        </div>
        <Icon className={`w-5 h-5 ${style.accent}`} />
      </div>

      {/* Grade - Big and prominent */}
      <div className="text-center mb-6">
        <div className={`inline-block ${style.gradeBg} px-8 py-3 rounded-xl`}>
          <p className={`text-5xl font-black ${style.gradeText}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {grade}
          </p>
        </div>
        <p className={`text-xs mt-2 font-bold uppercase tracking-widest ${style.muted}`}>
          {label}
        </p>
      </div>

      {/* Total Score */}
      <div className="text-center mb-4">
        <p className={`text-6xl font-black ${style.text}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          {totalScore}
        </p>
        <p className={`text-sm ${style.muted}`}>/ 100</p>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2 mb-4">
        {SCORE_PILLARS.map((pillar) => {
          const score = scores[pillar.key as keyof typeof scores];
          const percentage = (score / pillar.max) * 100;
          return (
            <div key={pillar.key} className={`${style.pillBg} rounded-lg px-3 py-2 flex items-center justify-between`}>
              <span className={`text-xs font-medium uppercase ${style.muted}`}>{pillar.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${style.gradeBg} rounded-full`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className={`text-sm font-bold ${style.text} w-12 text-right`}>
                  {score}/{pillar.max}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comment */}
      {comment && (
        <div className={`${style.pillBg} rounded-lg p-3 mb-4`}>
          <p className={`text-xs italic ${style.text} line-clamp-3`}>
            "{comment}"
          </p>
        </div>
      )}

      {/* Footer - Editor & Judge info */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div>
          <p className={`text-xs ${style.muted}`}>EDITOR</p>
          <p className={`text-sm font-bold ${style.accent}`}>@{editorUsername}</p>
        </div>
        <div className="text-right flex items-center gap-2">
          {judgeAvatarUrl && (
            <img 
              src={judgeAvatarUrl} 
              alt={judgeUsername}
              className="w-6 h-6 rounded-full"
            />
          )}
          <div>
            <p className={`text-xs ${style.muted}`}>JUDGE</p>
            <p className={`text-sm font-bold ${style.text}`}>@{judgeUsername}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

JudgeReviewCard.displayName = 'JudgeReviewCard';

export default JudgeReviewCard;
