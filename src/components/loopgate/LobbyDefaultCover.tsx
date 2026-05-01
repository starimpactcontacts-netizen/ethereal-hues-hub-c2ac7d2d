import loopgateLogo from "@/assets/loopgate-logo.png";

// Deterministic, vibrant gradient palettes — picked by room name hash
const GRADIENTS: [string, string, string][] = [
  ["#7c3aed", "#db2777", "#0a0a0a"], // violet → pink
  ["#0ea5e9", "#6366f1", "#0a0a0a"], // sky → indigo
  ["#10b981", "#0ea5e9", "#0a0a0a"], // emerald → sky
  ["#f59e0b", "#ef4444", "#0a0a0a"], // amber → red
  ["#ec4899", "#8b5cf6", "#0a0a0a"], // pink → violet
  ["#06b6d4", "#3b82f6", "#0a0a0a"], // cyan → blue
  ["#f43f5e", "#7c3aed", "#0a0a0a"], // rose → violet
  ["#22d3ee", "#a855f7", "#0a0a0a"], // cyan → purple
  ["#84cc16", "#10b981", "#0a0a0a"], // lime → emerald
  ["#fb7185", "#f59e0b", "#0a0a0a"], // rose → amber
];

function hashIndex(str: string, mod: number) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

interface Props {
  name: string;
  className?: string;
  /** "card" = small grid card; "hero" = lobby hero banner */
  variant?: "card" | "hero";
}

export function LobbyDefaultCover({ name, className = "", variant = "card" }: Props) {
  const [c1, c2, c3] = GRADIENTS[hashIndex(name || "loopgate", GRADIENTS.length)];
  const isHero = variant === "hero";

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 100% at 0% 0%, ${c1} 0%, transparent 55%), radial-gradient(120% 100% at 100% 100%, ${c2} 0%, transparent 55%), ${c3}`,
      }}
    >
      {/* subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* center logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={loopgateLogo}
          alt=""
          className={`${isHero ? "w-20 h-20" : "w-12 h-12"} opacity-90 drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]`}
          loading="lazy"
        />
      </div>
      {/* darkening for text legibility (parent overlays still apply) */}
      <div className="absolute inset-0 bg-black/15" />
    </div>
  );
}

export default LobbyDefaultCover;