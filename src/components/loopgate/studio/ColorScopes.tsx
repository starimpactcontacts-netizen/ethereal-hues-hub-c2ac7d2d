/**
 * ColorScopes — Real-time Histogram, Waveform & Vectorscope (DaVinci-grade)
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, BarChart3, Target, X, Upload } from "lucide-react";
import {
  computeHistogram, computeWaveform, computeVectorscope,
  LUT_PRESETS, applyLUTPreset, parseCubeLUT,
  type HistogramData, type WaveformData, type VectorscopePoint, type LUT3D, type LUTPreset
} from "@/lib/studioColorScience";

const ACCENT = "#9999FF";

type ScopeView = "histogram" | "waveform" | "vectorscope";

interface ColorScopesProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isPlaying: boolean;
  activeLUT: string | null;
  lutIntensity: number;
  customLUT: LUT3D | null;
  onLUTChange: (lutId: string | null) => void;
  onLUTIntensityChange: (v: number) => void;
  onCustomLUTLoad: (lut: LUT3D) => void;
  onClose: () => void;
}

function HistogramView({ data }: { data: HistogramData | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!data || !ref.current) return;
    const ctx = ref.current.getContext("2d");
    if (!ctx) return;
    const w = ref.current.width;
    const h = ref.current.height;
    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...data.luma, 1);
    const drawChannel = (vals: number[], color: string, alpha: number) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * w;
        const barH = (vals[i] / maxVal) * h;
        ctx.fillRect(x, h - barH, w / 256 + 1, barH);
      }
    };
    drawChannel(data.r, "#EF4444", 0.4);
    drawChannel(data.g, "#22C55E", 0.4);
    drawChannel(data.b, "#3B82F6", 0.4);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * w;
      const y = h - (data.luma[i] / maxVal) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [data]);

  return <canvas ref={ref} width={256} height={80} className="w-full h-20 rounded-lg" style={{ background: "#080808" }} />;
}

function WaveformView({ data }: { data: WaveformData | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!data || !ref.current) return;
    const ctx = ref.current.getContext("2d");
    if (!ctx) return;
    const w = ref.current.width;
    const h = ref.current.height;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.15;

    const cols = data.columns;
    for (let c = 0; c < cols.length; c++) {
      const x = (c / cols.length) * w;
      const pw = w / cols.length + 1;
      for (const v of cols[c].r) { ctx.fillStyle = "#EF4444"; ctx.fillRect(x, h - v * h, pw, 1); }
      for (const v of cols[c].g) { ctx.fillStyle = "#22C55E"; ctx.fillRect(x, h - v * h, pw, 1); }
      for (const v of cols[c].b) { ctx.fillStyle = "#3B82F6"; ctx.fillRect(x, h - v * h, pw, 1); }
    }
  }, [data]);

  return <canvas ref={ref} width={256} height={80} className="w-full h-20 rounded-lg" style={{ background: "#080808" }} />;
}

function VectorscopeView({ data }: { data: VectorscopePoint[] | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!data || !ref.current) return;
    const ctx = ref.current.getContext("2d");
    if (!ctx) return;
    const s = ref.current.width;
    const cx = s / 2, cy = s / 2, r = s / 2 - 4;
    ctx.clearRect(0, 0, s, s);

    // Graticule
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Skin tone line
    ctx.strokeStyle = "#553300";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const skinAngle = (123 * Math.PI) / 180;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(skinAngle) * r, cy - Math.sin(skinAngle) * r);
    ctx.stroke();

    // Points
    ctx.globalAlpha = 0.08;
    for (const pt of data) {
      const a = (pt.angle * Math.PI) / 180;
      const dist = pt.saturation * r;
      const px = cx + Math.cos(a) * dist;
      const py = cy - Math.sin(a) * dist;
      ctx.fillStyle = `hsl(${pt.angle}, 100%, 60%)`;
      ctx.fillRect(px, py, 2, 2);
    }
  }, [data]);

  return <canvas ref={ref} width={120} height={120} className="w-full aspect-square rounded-lg mx-auto max-w-[120px]" style={{ background: "#080808" }} />;
}

export default function ColorScopes({
  canvasRef, isPlaying, activeLUT, lutIntensity, customLUT,
  onLUTChange, onLUTIntensityChange, onCustomLUTLoad, onClose,
}: ColorScopesProps) {
  const [view, setView] = useState<ScopeView>("histogram");
  const [histogram, setHistogram] = useState<HistogramData | null>(null);
  const [waveform, setWaveform] = useState<WaveformData | null>(null);
  const [vectorscope, setVectorscope] = useState<VectorscopePoint[] | null>(null);
  const [tab, setTab] = useState<"scopes" | "luts">("scopes");
  const lutInputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef(0);

  const sample = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    // Sample at reduced resolution for performance
    const sw = Math.min(w, 320);
    const sh = Math.min(h, 180);
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = sw;
    tmpCanvas.height = sh;
    const tmpCtx = tmpCanvas.getContext("2d");
    if (!tmpCtx) return;
    tmpCtx.drawImage(canvasRef.current, 0, 0, sw, sh);
    const imageData = tmpCtx.getImageData(0, 0, sw, sh);

    if (view === "histogram") setHistogram(computeHistogram(imageData));
    else if (view === "waveform") setWaveform(computeWaveform(imageData, sw, sh, 64));
    else setVectorscope(computeVectorscope(imageData, 4));
  }, [canvasRef, view]);

  useEffect(() => {
    const tick = () => {
      sample();
      frameRef.current = requestAnimationFrame(tick);
    };
    // Update at ~8fps for performance
    const interval = setInterval(() => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(sample);
    }, 125);
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(frameRef.current);
    };
  }, [sample]);

  const handleLUTFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const lut = parseCubeLUT(text);
    if (lut) {
      onCustomLUTLoad(lut);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: "#22C55E" }} />
          <span className="text-[11px] font-bold text-white">Color Science</span>
        </div>
        <button onClick={onClose} className="text-[10px]" style={{ color: "#555" }}>Done</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(["scopes", "luts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: tab === t ? "rgba(34,197,94,0.1)" : "#111",
              color: tab === t ? "#22C55E" : "#555",
              border: tab === t ? "1px solid rgba(34,197,94,0.22)" : "1px solid #1a1a1a",
            }}>
            {t === "scopes" ? "Scopes" : "LUTs"}
          </button>
        ))}
      </div>

      {tab === "scopes" ? (
        <div className="space-y-2">
          {/* Scope type selector */}
          <div className="flex gap-1">
            {([
              { id: "histogram" as ScopeView, icon: BarChart3, label: "Histogram" },
              { id: "waveform" as ScopeView, icon: Activity, label: "Waveform" },
              { id: "vectorscope" as ScopeView, icon: Target, label: "Vector" },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setView(id)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[8px] font-bold"
                style={{
                  background: view === id ? "rgba(153,153,255,0.1)" : "#111",
                  color: view === id ? ACCENT : "#555",
                  border: view === id ? `1px solid rgba(153,153,255,0.22)` : "1px solid #1a1a1a",
                }}>
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>

          {/* Scope display */}
          {view === "histogram" && <HistogramView data={histogram} />}
          {view === "waveform" && <WaveformView data={waveform} />}
          {view === "vectorscope" && <VectorscopeView data={vectorscope} />}

          <p className="text-[7px] text-center" style={{ color: "#444" }}>
            {view === "histogram" ? "RGB + Luma distribution" :
             view === "waveform" ? "Per-column brightness" : "Hue vs Saturation"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* LUT presets by category */}
          {["Technical", "Film", "Cinematic"].map((cat) => {
            const luts = LUT_PRESETS.filter(l => l.category === cat);
            return (
              <div key={cat}>
                <span className="text-[8px] uppercase tracking-wider font-bold block mb-1" style={{ color: "#444" }}>{cat}</span>
                <div className="flex flex-wrap gap-1">
                  {luts.map((lut) => (
                    <button key={lut.id} onClick={() => onLUTChange(activeLUT === lut.id ? null : lut.id)}
                      className="px-2.5 py-1.5 rounded-lg text-[8px] font-bold transition-all"
                      style={{
                        background: activeLUT === lut.id ? "rgba(153,153,255,0.1)" : "#111",
                        color: activeLUT === lut.id ? ACCENT : "#666",
                        border: activeLUT === lut.id ? `1px solid rgba(153,153,255,0.22)` : "1px solid #1a1a1a",
                      }}>
                      {lut.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* LUT intensity */}
          {activeLUT && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px]" style={{ color: "#555" }}>LUT Intensity</span>
                <span className="text-[9px] font-mono" style={{ color: ACCENT }}>{Math.round(lutIntensity * 100)}%</span>
              </div>
              <input type="range" min={0} max={100} value={Math.round(lutIntensity * 100)}
                onChange={(e) => onLUTIntensityChange(Number(e.target.value) / 100)}
                className="w-full accent-[#9999FF]" />
            </div>
          )}

          {/* Custom LUT import */}
          <button onClick={() => lutInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-bold"
            style={{ background: "#111", border: "1px solid #1a1a1a", color: "#666" }}>
            <Upload className="w-3 h-3" /> Import .cube LUT
          </button>
          <input ref={lutInputRef} type="file" accept=".cube" onChange={handleLUTFile} className="hidden" />
        </div>
      )}
    </div>
  );
}
