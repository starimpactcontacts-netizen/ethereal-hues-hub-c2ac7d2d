/**
 * ColorLabPanel — DaVinci Resolve–style 3-way wheels, Luma Curve & LUT loader.
 * Pure CSS/SVG. Real-time, no AI.
 */
import { useRef, useState, useCallback } from "react";
import { RotateCcw, Upload, Activity } from "lucide-react";
import { toast } from "sonner";
import {
  NEUTRAL_WHEELS, type ColorWheels, type LumaCurve,
  buildLumaCurve, identityCurve,
} from "@/lib/studioAdjustments";
import { LUT_PRESETS, parseCubeLUT, type LUT3D } from "@/lib/studioColorScience";

type CurvePoint = { x: number; y: number };

interface Props {
  wheels: ColorWheels;
  onWheelsChange: (w: ColorWheels) => void;
  curvePoints: CurvePoint[];
  onCurveChange: (pts: CurvePoint[], compiled: LumaCurve) => void;
  activeLUT: string | null;
  lutIntensity: number;
  onLUTChange: (id: string | null) => void;
  onLUTIntensityChange: (v: number) => void;
  onCustomLUTLoad: (lut: LUT3D) => void;
  onOpenScopes: () => void;
}

const SECTIONS: { id: "lift" | "gamma" | "gain"; label: string; sub: string }[] = [
  { id: "lift",  label: "LIFT",  sub: "Shadows" },
  { id: "gamma", label: "GAMMA", sub: "Mids" },
  { id: "gain",  label: "GAIN",  sub: "Highlights" },
];

function Wheel({
  id, label, sub, value, onChange,
}: {
  id: "lift" | "gamma" | "gain";
  label: string; sub: string;
  value: { r: number; g: number; b: number };
  onChange: (v: { r: number; g: number; b: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Convert wheel rgb deviation to a 2D position (-1..1)
  const center = id === "lift" ? 0 : 1;
  const dr = value.r - center, dg = value.g - center, db = value.b - center;
  // Map RGB deviations to 2D point: R right, G upper-left, B lower-left (RYB-ish)
  const px = dr * 0.6 + db * 0.6 - dg * 0.3;
  const py = -dg * 0.6 + db * 0.5 + dr * 0.2;

  const apply = useCallback((nx: number, ny: number) => {
    // nx, ny in -1..1
    const r = nx;
    const g = -ny;
    const b = (-nx + ny) * 0.5;
    const scale = id === "lift" ? 0.3 : id === "gamma" ? 0.5 : 0.6;
    if (id === "lift") {
      onChange({ r: r * scale, g: g * scale, b: b * scale });
    } else {
      onChange({ r: 1 + r * scale, g: 1 + g * scale, b: 1 + b * scale });
    }
  }, [id, onChange]);

  const handle = (e: React.PointerEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const dist = Math.min(1, Math.hypot(x, y));
    const ang = Math.atan2(y, x);
    apply(Math.cos(ang) * dist, Math.sin(ang) * dist);
  };

  const reset = () => onChange(id === "lift" ? { r: 0, g: 0, b: 0 } : { r: 1, g: 1, b: 1 });

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center justify-between w-full">
        <span className="text-[9px] font-bold tracking-[0.2em] text-white/70">{label}</span>
        <button onClick={reset} className="opacity-50 hover:opacity-100 transition">
          <RotateCcw className="w-2.5 h-2.5 text-white/60" />
        </button>
      </div>
      <div
        ref={ref}
        onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); setDragging(true); handle(e); }}
        onPointerMove={(e) => { if (dragging) handle(e); }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onDoubleClick={reset}
        className="relative w-[88px] h-[88px] rounded-full cursor-crosshair touch-none select-none"
        style={{
          background: `conic-gradient(from 0deg,
            #ff3b30, #ffcc00, #34c759, #00c7be, #5856d6, #ff2d55, #ff3b30)`,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1), 0 4px 14px rgba(0,0,0,0.5)",
        }}
      >
        <div className="absolute inset-[18%] rounded-full bg-black/55 backdrop-blur-[2px]" />
        <div className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle at 50% 50%, transparent 38%, rgba(0,0,0,0.45) 100%)" }} />
        {/* crosshair */}
        <div className="absolute left-1/2 top-1/2 w-[10px] h-[10px] rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            transform: `translate(calc(-50% + ${px * 32}px), calc(-50% + ${py * 32}px))`,
            background: "white",
            border: "1.5px solid #000",
            boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
          }}
        />
      </div>
      <span className="text-[8px] uppercase tracking-[0.18em] text-white/35">{sub}</span>
    </div>
  );
}

function CurveEditor({
  points, onChange,
}: {
  points: CurvePoint[];
  onChange: (pts: CurvePoint[], compiled: LumaCurve) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const SIZE = 200;

  const compile = (pts: CurvePoint[]) => buildLumaCurve(pts);

  const update = (idx: number, x: number, y: number) => {
    const next = [...points];
    // clamp endpoints horizontally
    if (idx === 0) x = 0;
    if (idx === points.length - 1) x = 1;
    next[idx] = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    next.sort((a, b) => a.x - b.x);
    onChange(next, compile(next));
  };

  const onDown = (e: React.PointerEvent, idx: number) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragIdx(idx);
  };

  const onMove = (e: React.PointerEvent) => {
    if (dragIdx === null || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    update(dragIdx, x, y);
  };

  const addPoint = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    if (x <= 0 || x >= 1) return;
    const next = [...points, { x, y }].sort((a, b) => a.x - b.x);
    onChange(next, compile(next));
  };

  const removePoint = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    if (idx === 0 || idx === points.length - 1) return;
    const next = points.filter((_, i) => i !== idx);
    onChange(next, compile(next));
  };

  const reset = () => {
    const next: CurvePoint[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    onChange(next, identityCurve());
  };

  // Build smooth path via compiled curve
  const compiled = compile(points);
  let path = `M 0 ${SIZE}`;
  for (let i = 0; i < 256; i += 4) {
    const x = (i / 255) * SIZE;
    const y = SIZE - (compiled[i] / 255) * SIZE;
    path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  path += ` L ${SIZE} ${SIZE - SIZE}`;

  return (
    <div className="rounded-xl p-3" style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold tracking-[0.2em] text-white/70">LUMA CURVE</span>
        <button onClick={reset} className="text-[9px] text-white/45 hover:text-white/80 flex items-center gap-1">
          <RotateCcw className="w-2.5 h-2.5" /> Reset
        </button>
      </div>
      <svg
        ref={ref}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full aspect-square rounded-md cursor-crosshair touch-none select-none"
        style={{ background: "linear-gradient(180deg,#101010,#040404)", border: "1px solid #1c1c1c" }}
        onPointerMove={onMove}
        onPointerUp={() => setDragIdx(null)}
        onPointerCancel={() => setDragIdx(null)}
        onDoubleClick={addPoint as any}
      >
        {/* grid */}
        {[1, 2, 3].map(i => (
          <g key={i}>
            <line x1={(SIZE / 4) * i} y1={0} x2={(SIZE / 4) * i} y2={SIZE} stroke="#1d1d1d" strokeWidth={1} />
            <line x1={0} y1={(SIZE / 4) * i} x2={SIZE} y2={(SIZE / 4) * i} stroke="#1d1d1d" strokeWidth={1} />
          </g>
        ))}
        <line x1={0} y1={SIZE} x2={SIZE} y2={0} stroke="#2a2a2a" strokeWidth={1} strokeDasharray="3 3" />
        {/* curve */}
        <path d={path} fill="none" stroke="#fff" strokeWidth={1.5} />
        {/* points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x * SIZE}
            cy={(1 - p.y) * SIZE}
            r={5}
            fill="#fff"
            stroke="#000"
            strokeWidth={1.5}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => onDown(e, i)}
            onContextMenu={(e) => { e.preventDefault(); removePoint(e as any, i); }}
            onDoubleClick={(e) => removePoint(e as any, i)}
          />
        ))}
      </svg>
      <p className="text-[9px] text-white/30 mt-1.5 text-center">Double-tap to add · Right/double-click point to remove</p>
    </div>
  );
}

export default function ColorLabPanel({
  wheels, onWheelsChange,
  curvePoints, onCurveChange,
  activeLUT, lutIntensity, onLUTChange, onLUTIntensityChange, onCustomLUTLoad,
  onOpenScopes,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    const text = await f.text();
    const lut = parseCubeLUT(text);
    if (!lut) { toast.error("Invalid .cube LUT"); return; }
    onCustomLUTLoad(lut);
    toast.success(`Loaded ${lut.title || f.name}`);
  };

  const resetWheels = () => onWheelsChange({ ...NEUTRAL_WHEELS });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] text-white/85">COLOR LAB</p>
          <p className="text-[9px] text-white/30 mt-0.5">Wheels · Curves · LUTs · Scopes</p>
        </div>
        <button
          onClick={onOpenScopes}
          className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
        >
          <Activity className="w-2.5 h-2.5" /> Scopes
        </button>
      </div>

      {/* 3-way wheels */}
      <div className="rounded-xl p-3" style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-[0.2em] text-white/70">3-WAY COLOR</span>
          <button onClick={resetWheels} className="text-[9px] text-white/45 hover:text-white/80 flex items-center gap-1">
            <RotateCcw className="w-2.5 h-2.5" /> Reset
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {SECTIONS.map(s => (
            <Wheel
              key={s.id}
              id={s.id}
              label={s.label}
              sub={s.sub}
              value={wheels[s.id]}
              onChange={(v) => onWheelsChange({ ...wheels, [s.id]: v })}
            />
          ))}
        </div>
      </div>

      {/* Luma Curve */}
      <CurveEditor points={curvePoints} onChange={onCurveChange} />

      {/* LUT loader + presets */}
      <div className="rounded-xl p-3" style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-[0.2em] text-white/70">LUT</span>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md text-black"
            style={{ background: "linear-gradient(135deg,#fff,#bbb)" }}
          >
            <Upload className="w-2.5 h-2.5" /> Load .cube
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".cube"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <button
            onClick={() => onLUTChange(null)}
            className="text-[10px] py-1.5 rounded-md font-semibold"
            style={{
              background: !activeLUT ? "#fff" : "rgba(255,255,255,0.05)",
              color: !activeLUT ? "#000" : "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            None
          </button>
          {LUT_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => onLUTChange(p.id)}
              className="text-[10px] py-1.5 rounded-md font-semibold truncate"
              style={{
                background: activeLUT === p.id ? "#fff" : "rgba(255,255,255,0.05)",
                color: activeLUT === p.id ? "#000" : "#ddd",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {activeLUT && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-white/45 uppercase tracking-wider">Intensity</span>
              <span className="text-[10px] font-mono text-white/80">{Math.round(lutIntensity * 100)}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={Math.round(lutIntensity * 100)}
              onChange={(e) => onLUTIntensityChange(Number(e.target.value) / 100)}
              className="w-full accent-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}