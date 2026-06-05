import React from 'react';

export type AuraSlug = 'steve' | 'specter' | 'hellfire' | 'sovereign';

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
  steve: {
    gradient: 'linear-gradient(90deg, #1a3d08 0%, #3a7515 18%, #5c9a27 32%, #7db544 45%, #b8e870 50%, #7db544 55%, #5c9a27 68%, #3a7515 82%, #1a3d08 100%)',
    font: "'Minecraft', 'Press Start 2P', monospace",
    fontWeight: 400,
    letterSpacing: '0.02em',
    animation: 'aura-steve 1.4s steps(6, end) infinite',
    labelColor: '#7db544',
    label: 'STEVE',
  },
  specter: {
    gradient: 'linear-gradient(90deg, #1a3d08 0%, #3a7515 18%, #5c9a27 32%, #7db544 45%, #b8e870 50%, #7db544 55%, #5c9a27 68%, #3a7515 82%, #1a3d08 100%)',
    font: "'Minecraft', 'Press Start 2P', monospace",
    fontWeight: 400,
    letterSpacing: '0.02em',
    animation: 'aura-steve 1.4s steps(6, end) infinite',
    labelColor: '#7db544',
    label: 'STEVE',
  },
  hellfire: {
    gradient: 'linear-gradient(90deg, #4a0000 0%, #8b0000 20%, #c00000 38%, #ff1a1a 50%, #c00000 62%, #8b0000 80%, #4a0000 100%)',
    font: "'Rubik Beastly', 'Permanent Marker', 'Anton', sans-serif",
    fontWeight: 400,
    letterSpacing: '0.04em',
    animation: 'aura-hellfire 1.6s ease-in-out infinite',
    labelColor: '#ff1a1a',
    label: 'HELLFIRE',
  },
  sovereign: {
    gradient: 'linear-gradient(90deg, #6a4a00 0%, #c79a2b 18%, #ffd24a 36%, #fff3a8 50%, #ffd24a 64%, #c79a2b 82%, #6a4a00 100%)',
    font: "'Pirata One', 'UnifrakturCook', 'Cinzel', serif",
    fontWeight: 400,
    letterSpacing: '0.04em',
    animation: 'aura-sovereign 3.2s ease-in-out infinite',
    labelColor: '#ffd24a',
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
  const auraKey = aura?.toLowerCase() as AuraSlug | undefined;
  const cfg = auraKey ? AURA_CFG[auraKey] : null;
  if (!cfg) {
    return <span className={className} style={style}>{username}</span>;
  }
  const isSovereign = auraKey === 'sovereign';
  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        isolation: 'isolate',
        overflow: 'visible',
        contain: 'layout style paint',
        pointerEvents: 'auto',
        ...style,
      }}
    >
      {isSovereign && (
        <SovereignMoneyAura />
      )}
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          background: cfg.gradient,
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: cfg.animation,
          display: 'inline-block',
          // Force GPU compositing — fixes iOS Safari background-position animation
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
          // Aura font MUST win over any inherited/spread fontFamily
          fontFamily: cfg.font,
          fontWeight: cfg.fontWeight,
          letterSpacing: cfg.letterSpacing,
        }}
      >
        {username}
      </span>
    </span>
  );
}

/* Floating green $ aura — money-coded sovereign */
function SovereignMoneyAura() {
  // Mobile Safari-safe: outer aura is NOT inside clipped gradient text.
  // Negative delays mean dollars are already visible the moment the page opens.
  const bills = [
    { left: '16%', delay: '-0.2s', dur: '2.4s', size: 9, rot: -12 },
    { left: '30%', delay: '-1.5s', dur: '2.8s', size: 10, rot: 8  },
    { left: '44%', delay: '-0.9s', dur: '2.2s', size: 8, rot: -6  },
    { left: '58%', delay: '-2.1s', dur: '2.6s', size: 10, rot: 10 },
    { left: '72%', delay: '-0.6s', dur: '2.4s', size: 9, rot: -8  },
    { left: '84%', delay: '-1.8s', dur: '3s',   size: 10, rot: 6  },
  ];
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 'clamp(76px, 132%, 132px)',
        height: '42px',
        transform: 'translate3d(-50%, -50%, 0)',
        WebkitTransform: 'translate3d(-50%, -50%, 0)',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 1,
        overflow: 'hidden',
        contain: 'paint',
        borderRadius: 999,
      }}
    >
      {/* Soft green money glow behind text */}
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '92%',
          height: '78%',
          borderRadius: '50%',
          transform: 'translate3d(-50%, -50%, 0)',
          WebkitTransform: 'translate3d(-50%, -50%, 0)',
          background:
            'radial-gradient(ellipse at center, hsla(142, 76%, 36%, 0.18) 0%, hsla(142, 76%, 36%, 0.08) 46%, hsla(142, 76%, 36%, 0) 72%)',
          filter: 'blur(5px)',
          animation: 'aura-sovereign-shimmer 2.8s ease-in-out infinite',
          willChange: 'opacity, transform',
          zIndex: 0,
        }}
      />
      {bills.map((b, i) => (
        // Wrapper animates translate+opacity; inner span holds tilt
        <span
          key={i}
          style={{
            position: 'absolute',
            left: b.left,
            bottom: 4,
            display: 'inline-block',
            animation: `aura-money-float ${b.dur} ease-out ${b.delay} infinite`,
            willChange: 'transform, opacity',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: 4,
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transform: `translateX(-50%) rotate(${b.rot}deg)`,
              WebkitTransform: `translateX(-50%) rotate(${b.rot}deg)`,
              fontSize: `${b.size}px`,
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 900,
              color: 'hsl(142, 76%, 50%)',
              WebkitTextFillColor: 'hsl(142, 76%, 50%)',
              textShadow:
                '0 0 4px hsla(142, 76%, 50%, 0.9), 0 0 8px hsla(142, 76%, 42%, 0.5)',
              letterSpacing: 0,
              lineHeight: 1,
            }}
          >
            $
          </span>
        </span>
      ))}
    </span>
  );
}

export function AuraPill({ aura }: { aura: string }) {
  const cfg = AURA_CFG[aura.toLowerCase() as AuraSlug];
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
