/**
 * ViralPresetsPanel — TikTok / IG / AMV one-tap viral pack
 * - Beat detection from current audio/video
 * - One-tap viral presets (Beat Punch, Anime Flash, RGB Shake, etc)
 * - Auto cuts on beats, preset combos that activate filters/effects
 */
import { useState } from "react";
import { Loader2, Music2, Zap, Activity, Flame, Sparkles, Scissors, Wand2, Check, Vibrate, Rainbow, Sun } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { detectBeats, type BeatAnalysis } from "@/lib/studioBeatDetector";

const ACCENT = "hsl(0 0% 95%)";
const ACCENT_DIM = "hsl(0 0% 100% / 0.08)";
const ACCENT_BORDER = "hsl(0 0% 100% / 0.22)";

export type ViralPresetId =
  | "amv_classic"
  | "tiktok_punch"
  | "anime_flash"
  | "phonk_drift"
  | "ig_smooth"
  | "trailer_drop";

export type ViralPresetApply = {
  id: ViralPresetId;
  filter?: string;            // FILTER_PRESETS.name
  effects?: { id: string; intensity: number }[];
  speed?: number;
  beatPulse?: boolean;        // enable beat-driven zoom pulse on canvas
  cutOnBeats?: boolean;       // create segments on every Nth beat
  cutInterval?: number;       // every N beats (default 2)
};

export const VIRAL_PRESETS: {
  id: ViralPresetId;
  label: string;
  desc: string;
  icon: typeof Zap;
  accent: string;
  apply: ViralPresetApply;
}[] = [
  {
    id: "amv_classic", label: "AMV Classic", desc: "Anime energy · beat cuts · zoom pulse",
    icon: Flame, accent: "#FF3D7F",
    apply: { id: "amv_classic", filter: "blockbuster", effects: [{ id: "zoom_pulse", intensity: 0.85 }, { id: "rgb_split", intensity: 0.4 }], beatPulse: true, cutOnBeats: true, cutInterval: 2 },
  },
  {
    id: "tiktok_punch", label: "TikTok Punch", desc: "Beat zoom · shake · viral edit",
    icon: Zap, accent: "#00E5FF",
    apply: { id: "tiktok_punch", filter: "neon", effects: [{ id: "zoom_pulse", intensity: 1.0 }, { id: "shake", intensity: 0.5 }], beatPulse: true, cutOnBeats: true, cutInterval: 4 },
  },
  {
    id: "anime_flash", label: "Anime Flash", desc: "White flash · chromatic aberration",
    icon: Sun, accent: "#FFD60A",
    apply: { id: "anime_flash", filter: "cinematic", effects: [{ id: "flash", intensity: 0.8 }, { id: "chromatic", intensity: 0.6 }], beatPulse: true, cutOnBeats: true, cutInterval: 2 },
  },
  {
    id: "phonk_drift", label: "Phonk Drift", desc: "Heavy phonk · drift · grain",
    icon: Vibrate, accent: "#A855F7",
    apply: { id: "phonk_drift", filter: "phonk", effects: [{ id: "shake", intensity: 0.7 }, { id: "grain", intensity: 0.5 }, { id: "vhs", intensity: 0.4 }], speed: 0.95, beatPulse: true, cutOnBeats: true, cutInterval: 4 },
  },
  {
    id: "ig_smooth", label: "IG Smooth", desc: "Clean cinema · subtle grade",
    icon: Sparkles, accent: "#34C759",
    apply: { id: "ig_smooth", filter: "teal_orange", effects: [{ id: "grain", intensity: 0.25 }], beatPulse: false, cutOnBeats: false },
  },
  {
    id: "trailer_drop", label: "Trailer Drop", desc: "Cinema · slow build · big cuts",
    icon: Rainbow, accent: "#FF6B35",
    apply: { id: "trailer_drop", filter: "anamorphic", effects: [{ id: "light_leak", intensity: 0.5 }, { id: "flash", intensity: 0.5 }], beatPulse: true, cutOnBeats: true, cutInterval: 8 },
  },
];

interface ViralPresetsPanelProps {
  audioFile: File | null;
  videoFile: File | null;
  beats: BeatAnalysis | null;
  onBeatsDetected: (b: BeatAnalysis) => void;
  beatPulse: boolean;
  onBeatPulseChange: (v: boolean) => void;
  beatIntensity: number;
  onBeatIntensityChange: (v: number) => void;
  activePresetId: ViralPresetId | null;
  onApplyPreset: (preset: typeof VIRAL_PRESETS[number]) => void;
  onCutOnBeats: (interval: number) => void;
}

export default function ViralPresetsPanel({
  audioFile, videoFile, beats, onBeatsDetected,
  beatPulse, onBeatPulseChange, beatIntensity, onBeatIntensityChange,
  activePresetId, onApplyPreset, onCutOnBeats,
}: ViralPresetsPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);

  const handleDetect = async () => {
    const file = audioFile || videoFile;
    if (!file) { toast.error("Add audio or video first"); return; }
    setAnalyzing(true);
    try {
      const result = await detectBeats(file, { sensitivity: 1.5 });
      onBeatsDetected(result);
      toast.success(`Found ${result.beats.length} beats · ${result.bpm} BPM`);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't analyze audio");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header note */}
      <p className="text-[10px] leading-relaxed" style={{ color: "#888" }}>
        One-tap viral packs for TikTok, Reels and AMV. Detect beats first to unlock beat-sync.
      </p>

      {/* ─── Beat Detection ─── */}
      <div className="rounded-xl p-3 space-y-2.5"
        style={{ background: "linear-gradient(135deg, rgba(255,61,127,0.08), rgba(0,229,255,0.04))", border: "1px solid rgba(255,61,127,0.2)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(255,61,127,0.15)" }}>
            <Activity className="w-3.5 h-3.5" style={{ color: "#FF3D7F" }} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold" style={{ color: "#fff" }}>Beat Detector</p>
            <p className="text-[9px]" style={{ color: "#888" }}>
              {beats ? `${beats.beats.length} beats · ${beats.bpm} BPM` : "Analyze audio for sync"}
            </p>
          </div>
        </div>
        <button
          onClick={handleDetect}
          disabled={analyzing || (!audioFile && !videoFile)}
          className="w-full h-8 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
          style={{ background: "linear-gradient(135deg, #FF3D7F, #FF6B35)", color: "#fff", boxShadow: "0 4px 16px rgba(255,61,127,0.3)" }}
        >
          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Music2 className="w-3.5 h-3.5" />}
          {analyzing ? "Analyzing…" : beats ? "Re-analyze" : "Detect Beats"}
        </button>

        {beats && (
          <>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3" style={{ color: beatPulse ? "#FF3D7F" : "#555" }} />
                <span className="text-[10px] font-medium" style={{ color: beatPulse ? "#fff" : "#888" }}>Beat Pulse</span>
              </div>
              <button
                onClick={() => onBeatPulseChange(!beatPulse)}
                className="relative w-9 h-5 rounded-full transition-all"
                style={{ background: beatPulse ? "#FF3D7F" : "#2a2a2a" }}
              >
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: beatPulse ? "calc(100% - 18px)" : "2px" }} />
              </button>
            </div>
            {beatPulse && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-[9px]" style={{ color: "#888" }}>Pulse strength</span>
                  <span className="text-[9px] font-mono" style={{ color: "#888" }}>{Math.round(beatIntensity * 100)}%</span>
                </div>
                <Slider value={[beatIntensity * 100]} onValueChange={(v) => onBeatIntensityChange(v[0] / 100)} min={10} max={100} step={5} />
              </div>
            )}

            {/* Auto-cut on beats */}
            <div className="pt-2 mt-1 space-y-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3 h-3" style={{ color: "#888" }} />
                <span className="text-[10px] font-semibold" style={{ color: "#ddd" }}>Cut on beats</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[2, 4, 8].map(n => (
                  <button
                    key={n}
                    onClick={() => onCutOnBeats(n)}
                    className="py-1.5 rounded text-[10px] font-bold transition-all"
                    style={{ background: "#1a1a1a", color: "#ccc", border: "1px solid #2a2a2a" }}
                  >
                    Every {n}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Viral Presets ─── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Wand2 className="w-3 h-3" style={{ color: "#888" }} />
          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "#999" }}>One-Tap Packs</span>
        </div>
        <div className="space-y-1.5">
          {VIRAL_PRESETS.map((p) => {
            const isActive = activePresetId === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => onApplyPreset(p)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left"
                style={{
                  background: isActive ? `${p.accent}1F` : "#151515",
                  border: isActive ? `1px solid ${p.accent}66` : "1px solid #2a2a2a",
                  boxShadow: isActive ? `0 4px 16px ${p.accent}22` : "none",
                }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${p.accent}22`, border: `1px solid ${p.accent}44` }}>
                  <Icon className="w-4 h-4" style={{ color: p.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold truncate" style={{ color: isActive ? "#fff" : "#ddd" }}>{p.label}</p>
                  <p className="text-[9px] truncate" style={{ color: "#888" }}>{p.desc}</p>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: p.accent }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
