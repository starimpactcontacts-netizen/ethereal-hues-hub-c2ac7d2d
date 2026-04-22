import { useEffect, useState } from "react";

interface ArcadeCountdownProps {
  endDate: string | Date;
  label?: string;
  variant?: "battle" | "neutral";
}

/**
 * Roblox-sexy / iPhone 17 polished segmented countdown.
 * Glassy black blocks with neon gradient digits and pulsing colon.
 */
export default function ArcadeCountdown({ endDate, label = "ENDS IN", variant = "battle" }: ArcadeCountdownProps) {
  const [t, setT] = useState(calc());

  function calc() {
    const target = typeof endDate === "string" ? new Date(endDate) : endDate;
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff / 3600000) % 24),
      m: Math.floor((diff / 60000) % 60),
      s: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  }

  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const accent =
    variant === "battle"
      ? "from-red-500 via-rose-400 to-amber-300"
      : "from-emerald-400 via-cyan-300 to-blue-400";
  const glow = variant === "battle" ? "shadow-[0_0_24px_rgba(239,68,68,0.25)]" : "shadow-[0_0_24px_rgba(16,185,129,0.25)]";
  const ring = variant === "battle" ? "ring-red-500/20" : "ring-emerald-500/20";

  if (t.expired) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/60 ring-1 ring-white/10">
        <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">{label}</span>
        <span className="font-display text-sm text-zinc-400 uppercase">Ended</span>
      </div>
    );
  }

  const Block = ({ value, unit }: { value: number; unit: string }) => (
    <div className="flex flex-col items-center">
      <div
        className={`relative min-w-[42px] px-2 py-1.5 rounded-lg bg-gradient-to-b from-white/[0.08] to-white/[0.02] ring-1 ring-white/10 backdrop-blur-md`}
      >
        {/* inner gloss */}
        <div className="absolute inset-x-1 top-1 h-[1px] bg-white/20 rounded-full" />
        <span
          className={`block text-center text-2xl font-black tabular-nums tracking-tight bg-gradient-to-b ${accent} bg-clip-text text-transparent leading-none`}
          style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.02em" }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[8px] text-zinc-500 uppercase tracking-[0.25em] mt-1">{unit}</span>
    </div>
  );

  const Colon = () => (
    <span className="text-xl text-white/30 font-bold pb-4 select-none animate-pulse">:</span>
  );

  return (
    <div className={`inline-flex flex-col items-center gap-2 px-4 py-3 rounded-2xl bg-black/60 ring-1 ${ring} ${glow} backdrop-blur-xl`}>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        <span className="text-[9px] uppercase tracking-[0.35em] text-zinc-400 font-bold" style={{ fontFamily: "Teko, sans-serif" }}>
          {label}
        </span>
      </div>
      <div className="flex items-end gap-1.5">
        {t.d > 0 && (
          <>
            <Block value={t.d} unit="Days" />
            <Colon />
          </>
        )}
        <Block value={t.h} unit="Hrs" />
        <Colon />
        <Block value={t.m} unit="Min" />
        <Colon />
        <Block value={t.s} unit="Sec" />
      </div>
    </div>
  );
}