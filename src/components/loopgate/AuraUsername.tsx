import React from 'react';

export type AuraSlug = 'specter' | 'hellfire' | 'sovereign';

interface AuraCfg {
  gradient: string;
  animation: string;
  labelColor: string;
  label: string;
}

export const AURA_CFG: Record<AuraSlug, AuraCfg> = {
  specter: {
    gradient: 'linear-gradient(90deg, #0a2a4a, #1a6ab5, #5bc8e8, #e0f8ff, #ffffff, #a8e4f8, #1a6ab5, #0a2a4a)',
    animation: 'aura-specter 3s linear infinite',
    labelColor: '#96d2ff',
    label: 'SPECTER',
  },
  hellfire: {
    gradient: 'linear-gradient(90deg, #4a0000, #cc1100, #ff4400, #ff9900, #ffdd44, #ff6600, #cc1100, #4a0000)',
    animation: 'aura-hellfire 1.1s linear infinite',
    labelColor: '#ff6633',
    label: 'HELLFIRE',
  },
  sovereign: {
    gradient: 'linear-gradient(90deg, #3a2200, #a07010, #ffd700, #fffacd, #ffffff, #ffe87a, #ffd700, #a07010, #3a2200)',
    animation: 'aura-sovereign 2.2s linear infinite',
    labelColor: '#FFD060',
    label: 'SOVEREIGN',
  },
};

interface Props {
  username: string;
  aura?: string | null;
  style?: React.CSSProperties;
  className?: string;
}

export default function AuraUsername({ username, aura, style, className }: Props) {
  const cfg = aura ? AURA_CFG[aura as AuraSlug] : null;
  if (!cfg) {
    return <span className={className} style={style}>{username}</span>;
  }
  return (
    <span
      className={className}
      style={{
        background: cfg.gradient,
        backgroundSize: '400% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: cfg.animation,
        display: 'inline-block',
        ...style,
      }}
    >
      {username}
    </span>
  );
}

export function AuraPill({ aura }: { aura: string }) {
  const cfg = AURA_CFG[aura as AuraSlug];
  if (!cfg) return null;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest select-none"
      style={{
        background: cfg.gradient,
        backgroundSize: '400% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: cfg.animation,
        border: `1px solid ${cfg.labelColor}55`,
      }}
    >
      {cfg.label}
    </span>
  );
}
