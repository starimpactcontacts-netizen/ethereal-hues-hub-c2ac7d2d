import React from 'react';

export type AuraSlug = 'specter' | 'hellfire' | 'sovereign';

interface AuraCfg {
  animation: string;
  color?: string;
  labelColor: string;
  label: string;
}

export const AURA_CFG: Record<AuraSlug, AuraCfg> = {
  specter:  { animation: 'aura-specter 2.6s ease-in-out infinite',  color: '#c8e8ff', labelColor: '#96d2ff', label: 'SPECTER'  },
  hellfire: { animation: 'aura-hellfire 1.4s ease-in-out infinite', color: '#ff6633', labelColor: '#ff6633', label: 'HELLFIRE' },
  sovereign:{ animation: 'aura-sovereign 3.2s ease-in-out infinite',               labelColor: '#FFD060', label: 'SOVEREIGN'},
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
        animation: cfg.animation,
        ...(cfg.color ? { color: cfg.color } : {}),
        ...style,
      }}
    >
      {username}
    </span>
  );
}

/** Tiny inline pill shown beside the username in inventory / profile */
export function AuraPill({ aura }: { aura: string }) {
  const cfg = AURA_CFG[aura as AuraSlug];
  if (!cfg) return null;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest select-none"
      style={{
        background: `${cfg.labelColor}18`,
        border: `1px solid ${cfg.labelColor}55`,
        color: cfg.labelColor,
        animation: cfg.animation,
      }}
    >
      {cfg.label}
    </span>
  );
}
