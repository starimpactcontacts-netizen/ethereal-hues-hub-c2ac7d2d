import { cn } from '@/lib/utils';

export interface DivisionInfo {
  name: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  minJxp: number;
  icon: string;
}

export const JUDGE_DIVISIONS: DivisionInfo[] = [
  { name: 'iron', label: 'IRON', color: 'text-zinc-400', bgColor: 'bg-zinc-900', borderColor: 'border-zinc-700', minJxp: 0, icon: '🔩' },
  { name: 'bronze', label: 'BRONZE', color: 'text-amber-600', bgColor: 'bg-amber-950', borderColor: 'border-amber-800', minJxp: 100, icon: '🥉' },
  { name: 'silver', label: 'SILVER', color: 'text-zinc-300', bgColor: 'bg-zinc-800', borderColor: 'border-zinc-500', minJxp: 500, icon: '🥈' },
  { name: 'gold', label: 'GOLD', color: 'text-yellow-400', bgColor: 'bg-yellow-950', borderColor: 'border-yellow-600', minJxp: 1500, icon: '🥇' },
  { name: 'onyx', label: 'ONYX', color: 'text-purple-400', bgColor: 'bg-purple-950', borderColor: 'border-purple-700', minJxp: 3500, icon: '💎' },
  { name: 'legendary', label: 'LEGENDARY', color: 'text-red-400', bgColor: 'bg-red-950', borderColor: 'border-red-600', minJxp: 7500, icon: '👑' },
];

export function getDivisionFromJxp(jxp: number): DivisionInfo {
  for (let i = JUDGE_DIVISIONS.length - 1; i >= 0; i--) {
    if (jxp >= JUDGE_DIVISIONS[i].minJxp) return JUDGE_DIVISIONS[i];
  }
  return JUDGE_DIVISIONS[0];
}

export function getNextDivision(current: DivisionInfo): DivisionInfo | null {
  const idx = JUDGE_DIVISIONS.findIndex(d => d.name === current.name);
  return idx < JUDGE_DIVISIONS.length - 1 ? JUDGE_DIVISIONS[idx + 1] : null;
}

interface JudgeDivisionBadgeProps {
  jxp: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export default function JudgeDivisionBadge({ jxp, size = 'md', showProgress = false }: JudgeDivisionBadgeProps) {
  const division = getDivisionFromJxp(jxp);
  const next = getNextDivision(division);

  const sizeClasses = {
    sm: 'text-[9px] px-2 py-0.5 gap-1',
    md: 'text-[10px] px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2',
  };

  return (
    <div>
      <div className={cn(
        'inline-flex items-center font-display uppercase tracking-[0.15em] border',
        division.bgColor, division.color, division.borderColor,
        sizeClasses[size]
      )}>
        <span>{division.icon}</span>
        <span>{division.label}</span>
      </div>

      {showProgress && next && (
        <div className="mt-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[8px] text-zinc-600 font-mono">
              {jxp} / {next.minJxp} JXP
            </span>
            <span className="text-[8px] text-zinc-600 font-mono">
              → {next.label}
            </span>
          </div>
          <div className="h-1 bg-zinc-900 overflow-hidden">
            <div
              className={cn('h-full transition-all', division.name === 'legendary' ? 'bg-red-600' : 'bg-red-700')}
              style={{ width: `${Math.min(((jxp - division.minJxp) / (next.minJxp - division.minJxp)) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
