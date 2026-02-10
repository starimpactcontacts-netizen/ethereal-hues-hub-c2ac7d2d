import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
}

// ═══ AUTHORITY GAVEL — angular, geometric gavel with loop ring detail ═══
export function AuthorityGavel({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* Gavel head - angular block */}
      <rect x="7" y="3" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
      {/* Handle */}
      <line x1="12" y1="9" x2="12" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Strike plate - angular */}
      <path d="M6 20h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Loop ring on handle */}
      <circle cx="12" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ═══ CROWN SIGIL — angular crown with center loop ═══
export function CrownSigil({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* Crown shape - sharp angular */}
      <path d="M3 17L5 7l4 4 3-6 3 6 4-4 2 10H3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Base band */}
      <path d="M4 17h16v2H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Center jewel - loop circle */}
      <circle cx="12" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}

// ═══ MEDAL RING — looped medal with angular ribbon ═══
export function MedalRing({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* Ribbon - angular V shape */}
      <path d="M9 2L12 8L15 2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Medal circle */}
      <circle cx="12" cy="14" r="6" stroke="currentColor" strokeWidth="2" />
      {/* Inner loop ring */}
      <circle cx="12" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
      {/* Center dot */}
      <circle cx="12" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

// ═══ TROPHY PILLAR — angular trophy with loop handles ═══
export function TrophyPillar({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* Cup body - angular trapezoid */}
      <path d="M7 4h10l-2 9H9L7 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Left handle - loop arc */}
      <path d="M7 5C4 5 3 8 5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Right handle - loop arc */}
      <path d="M17 5C20 5 21 8 19 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Stem */}
      <line x1="12" y1="13" x2="12" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Base */}
      <path d="M8 17h8v2H8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ═══ CLASS SHIELD — angular heraldic shield with tier mark ═══
export function ClassShield({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* Shield body - angular pointed */}
      <path d="M12 2L4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Inner chevron */}
      <path d="M12 7L8 10v3l4 3 4-3v-3l-4-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ═══ PULSE FLAME — angular fire with loop core ═══
export function PulseFlame({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* Outer flame - angular */}
      <path d="M12 2C12 2 8 8 8 13c0 3 2 5 4 5s4-2 4-5C16 8 12 2 12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Inner flame */}
      <path d="M12 9c0 0-2 3-2 5s1 3 2 3 2-1 2-3-2-5-2-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ═══ BOLT CIRCUIT — angular lightning with loop nodes ═══
export function BoltCircuit({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* Lightning bolt - angular path */}
      <path d="M13 2L4 14h7l-2 8 10-12h-7L13 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Circuit node */}
      <circle cx="12" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

// ═══ NEXUS STAR — angular 4-point star with loop center ═══
export function NexusStar({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* 4-point star */}
      <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14 2 9.5h7.5L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Loop center */}
      <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// ═══ SCOPE TARGET — angular crosshair with loop ring ═══
export function ScopeTarget({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* Outer ring */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      {/* Inner ring */}
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      {/* Crosshair lines */}
      <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

// ═══ CONTENDERS — angular group with loop bond ═══
export function ContendersIcon({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* Left figure */}
      <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M3 19v-2c0-2 2-4 5-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Right figure */}
      <circle cx="16" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M21 19v-2c0-2-2-4-5-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Loop bond between */}
      <circle cx="12" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// ═══ AWARD CREST — angular crest badge ═══
export function AwardCrest({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* Crest outline */}
      <path d="M12 2l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4l-3-3 3-3V5h4l3-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Inner loop */}
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      {/* Center mark */}
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

// ═══ ARROW LINK — external link with loop flair ═══
export function ArrowLink({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-current", className)}>
      {/* Arrow */}
      <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 7h7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Loop tail */}
      <path d="M7 17c-2 2-2 3 0 3s2-1 0-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default {
  AuthorityGavel,
  CrownSigil,
  MedalRing,
  TrophyPillar,
  ClassShield,
  PulseFlame,
  BoltCircuit,
  NexusStar,
  ScopeTarget,
  ContendersIcon,
  AwardCrest,
  ArrowLink,
};
