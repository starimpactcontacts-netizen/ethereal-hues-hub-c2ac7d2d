import loopgateLogo from "@/assets/loopgate-logo.png";

// Very subtle dark-tone variations — near-black, just enough to distinguish cards
const DARK_BASES = [
  '#0e0e0e',  // neutral charcoal
  '#0c0e10',  // slight blue undertone
  '#100e0c',  // slight warm undertone
  '#0c100e',  // slight cool-green undertone
  '#0f0d0f',  // slight purple undertone
  '#0e0e0c',  // slight warm-neutral
];

function hashIndex(str: string, mod: number) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

interface Props {
  name: string;
  className?: string;
  variant?: "card" | "hero";
}

export function LobbyDefaultCover({ name, className = "", variant = "card" }: Props) {
  const base = DARK_BASES[hashIndex(name || "loopgate", DARK_BASES.length)];
  const isHero = variant === "hero";

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ background: base }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      />

      {/* Top-left light leak */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />

      {/* Bottom vignette for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.75) 100%)' }}
      />

      {/* Corner notches — top-right */}
      <div className="absolute top-0 right-0 pointer-events-none">
        <div className="w-4 h-px bg-white/20" />
        <div className="w-px h-4 bg-white/20 ml-auto" />
      </div>
      {/* Corner notches — bottom-left */}
      <div className="absolute bottom-0 left-0 pointer-events-none">
        <div className="w-4 h-px bg-white/20" />
        <div className="w-px h-4 bg-white/20" />
      </div>

      {/* Big gradient logo — bottom-right corner, partially cropped */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: isHero ? -16 : -10,
          right: isHero ? -16 : -10,
          width: isHero ? 140 : 90,
          height: isHero ? 140 : 90,
          maskImage: `url(${loopgateLogo})`,
          WebkitMaskImage: `url(${loopgateLogo})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #38bdf8 100%)',
          opacity: 0.28,
          filter: `drop-shadow(0 0 ${isHero ? 20 : 12}px rgba(129,140,248,0.7)) drop-shadow(0 0 ${isHero ? 40 : 24}px rgba(167,139,250,0.4))`,
        }}
      />

      {/* Bottom shimmer line */}
      <div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }}
      />

      {/* Outer border */}
      <div className="absolute inset-0 border border-white/[0.07] pointer-events-none" />
    </div>
  );
}

export default LobbyDefaultCover;
