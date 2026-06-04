import React from 'react';

export type AuraSlug = 'specter' | 'hellfire' | 'sovereign';

interface AuraCfg {
  // gradient designed for 200% sweep: dark → bright gleam → dark
  gradient: string;
  font: string;
  fontWeight: number;
  letterSpacing?: string;
  animation: string;
  labelColor: string;
  label: string;
}

export const AURA_CFG: Record<AuraSlug, AuraCfg> = {
  specter: {
    gradient: 'linear-gradient(90deg, #0a1e3a 0%, #1a5fa0 20%, #5bc8e8 40%, #e8f8ff 50%, #5bc8e8 60%, #1a5fa0 80%, #0a1e3a 100%)',
    font: "'Bebas Neue', 'Teko', sans-serif",
    fontWeight: 400,
    letterSpacing: '0.06em',
    animation: 'aura-specter 2.8s ease-in-out infinite',
    labelColor: '#5bc8e8',
    label: 'SPECTER',
  },
  hellfire: {
    gradient: 'linear-gradient(90deg, #2a0000 0%, #aa1800 20%, #ff4400 38%, #ffbb00 50%, #ff5500 62%, #aa1800 80%, #2a0000 100%)',
    font: "'Anton', 'Teko', sans-serif",
    fontWeight: 400,
    letterSpacing: '0.03em',
    animation: 'aura-hellfire 0.85s ease-in-out infinite',
    labelColor: '#ff5500',
    label: 'HELLFIRE',
  },
  sovereign: {
    gradient: 'linear-gradient(90deg, #2a1800 0%, #a07010 20%, #ffd700 38%, #ffffff 50%, #ffd700 62%, #a07010 80%, #2a1800 100%)',
    font: "'Teko', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.1em',
    animation: 'aura-sovereign 3.2s ease-in-out infinite',
    labelColor: '#ffd700',
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
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: cfg.animation,
        fontFamily: cfg.font,
        fontWeight: cfg.fontWeight,
        letterSpacing: cfg.letterSpacing,
        display: 'inline-block',
        // Force GPU compositing — fixes iOS Safari background-position animation
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
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
      className="inline-flex items-center px-1.5 py-0.5 text-[9px] uppercase tracking-widest select-none"
      style={{
        fontFamily: cfg.font,
        fontWeight: cfg.fontWeight,
        background: cfg.gradient,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: cfg.animation,
        border: `1px solid ${cfg.labelColor}55`,
        transform: 'translateZ(0)',
      }}
    >
      {cfg.label}
    </span>
  );
}
