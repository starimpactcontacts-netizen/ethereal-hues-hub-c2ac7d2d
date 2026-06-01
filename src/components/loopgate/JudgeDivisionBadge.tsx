import { cn } from '@/lib/utils';
import { ClassShield, CrownSigil, MedalRing, AwardCrest, BoltCircuit, AuthorityGavel } from './LoopgateIcons';

export interface DivisionInfo {
  name: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  minJxp: number;
  iconComponent: React.ReactNode;
}

function DivIcon({ name, size = 10 }: { name: string; size?: number }) {
  switch (name) {
    case 'iron': return <ClassShield size={size} />;
    case 'bronze': return <MedalRing size={size} />;
    case 'silver': return <AwardCrest size={size} />;
    case 'gold': return <CrownSigil size={size} />;
    case 'onyx': return <BoltCircuit size={size} />;
    case 'legendary': return <AuthorityGavel size={size} />;
    default: return <ClassShield size={size} />;
  }
}

export const JUDGE_DIVISIONS: DivisionInfo[] = [
  { name: 'iron',      label: 'IRON',      color: 'text-zinc-300',   bgColor: 'bg-white/[0.03]', borderColor: 'border-white/[0.08]', minJxp: 0,    iconComponent: null },
  { name: 'bronze',    label: 'BRONZE',    color: 'text-amber-500/90', bgColor: 'bg-white/[0.03]', borderColor: 'border-white/[0.08]', minJxp: 100,  iconComponent: null },
  { name: 'silver',    label: 'SILVER',    color: 'text-zinc-100',   bgColor: 'bg-white/[0.04]', borderColor: 'border-white/[0.1]',  minJxp: 500,  iconComponent: null },
  { name: 'gold',      label: 'GOLD',      color: 'text-gold',       bgColor: 'bg-white/[0.04]', borderColor: 'border-gold/30',      minJxp: 1500, iconComponent: null },
  { name: 'onyx',      label: 'ONYX',      color: 'text-purple-300', bgColor: 'bg-white/[0.04]', borderColor: 'border-purple-400/30', minJxp: 3500, iconComponent: null },
  { name: 'legendary', label: 'LEGENDARY', color: 'text-red-300',    bgColor: 'bg-white/[0.05]', borderColor: 'border-red-400/40',   minJxp: 7500, iconComponent: null },
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
    sm: 'text-[9px] px-1.5 py-[3px] gap-1',
    md: 'text-[10px] px-2 py-1 gap-1.5',
    lg: 'text-xs px-2.5 py-1.5 gap-2',
  };

  const iconSize = size === 'sm' ? 9 : size === 'md' ? 10 : 12;

  return (
    <div>
      <div className={cn(
        'inline-flex items-center font-display uppercase tracking-[0.18em] rounded-md border backdrop-blur-sm',
        division.bgColor, division.color, division.borderColor,
        sizeClasses[size]
      )}>
        <DivIcon name={division.name} size={iconSize} />
        <span className="leading-none">{division.label}</span>
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
          <div className="h-1 bg-white/[0.04] overflow-hidden rounded-full">
            <div
              className={cn('h-full transition-all rounded-full', division.name === 'legendary' ? 'bg-red-400/80' : 'bg-white/40')}
              style={{ width: `${Math.min(((jxp - division.minJxp) / (next.minJxp - division.minJxp)) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
