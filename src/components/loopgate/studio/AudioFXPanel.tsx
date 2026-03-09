/**
 * AudioFXPanel — Professional audio processing (EQ, Compression, Reverb, Noise Gate)
 */
import { useState } from "react";
import { AudioLines, Volume2, Mic, Waves, Radio, SlidersHorizontal } from "lucide-react";

const ACCENT = "#9999FF";

export type EQBand = { freq: number; gain: number; q: number; label: string };

export type AudioFXState = {
  eqBands: EQBand[];
  compressor: { threshold: number; ratio: number; attack: number; release: number; knee: number; enabled: boolean };
  reverb: { mix: number; decay: number; preDelay: number; enabled: boolean };
  noiseGate: { threshold: number; attack: number; release: number; enabled: boolean };
  limiter: { threshold: number; release: number; enabled: boolean };
  deEsser: { threshold: number; frequency: number; enabled: boolean };
};

export const DEFAULT_AUDIO_FX: AudioFXState = {
  eqBands: [
    { freq: 60, gain: 0, q: 1.0, label: "Sub" },
    { freq: 250, gain: 0, q: 1.0, label: "Low" },
    { freq: 1000, gain: 0, q: 1.0, label: "Mid" },
    { freq: 4000, gain: 0, q: 1.0, label: "Hi-Mid" },
    { freq: 8000, gain: 0, q: 1.0, label: "High" },
    { freq: 16000, gain: 0, q: 1.0, label: "Air" },
  ],
  compressor: { threshold: -24, ratio: 4, attack: 5, release: 100, knee: 10, enabled: false },
  reverb: { mix: 0.2, decay: 1.5, preDelay: 20, enabled: false },
  noiseGate: { threshold: -40, attack: 0.5, release: 50, enabled: false },
  limiter: { threshold: -1, release: 50, enabled: false },
  deEsser: { threshold: -20, frequency: 6000, enabled: false },
};

export type AudioPreset = { id: string; label: string; icon: typeof Mic; state: Partial<AudioFXState> };

export const AUDIO_PRESETS: AudioPreset[] = [
  {
    id: "vocal_clarity", label: "Vocal Clarity", icon: Mic,
    state: {
      eqBands: [
        { freq: 60, gain: -6, q: 1.0, label: "Sub" },
        { freq: 250, gain: -2, q: 1.0, label: "Low" },
        { freq: 1000, gain: 2, q: 1.0, label: "Mid" },
        { freq: 4000, gain: 4, q: 1.0, label: "Hi-Mid" },
        { freq: 8000, gain: 3, q: 1.0, label: "High" },
        { freq: 16000, gain: 2, q: 1.0, label: "Air" },
      ],
      compressor: { threshold: -18, ratio: 3, attack: 10, release: 100, knee: 10, enabled: true },
      deEsser: { threshold: -15, frequency: 6000, enabled: true },
    },
  },
  {
    id: "bass_boost", label: "Bass Boost", icon: AudioLines,
    state: {
      eqBands: [
        { freq: 60, gain: 8, q: 0.8, label: "Sub" },
        { freq: 250, gain: 4, q: 1.0, label: "Low" },
        { freq: 1000, gain: 0, q: 1.0, label: "Mid" },
        { freq: 4000, gain: -1, q: 1.0, label: "Hi-Mid" },
        { freq: 8000, gain: 0, q: 1.0, label: "High" },
        { freq: 16000, gain: 0, q: 1.0, label: "Air" },
      ],
    },
  },
  {
    id: "broadcast", label: "Broadcast", icon: Radio,
    state: {
      eqBands: [
        { freq: 60, gain: -8, q: 1.5, label: "Sub" },
        { freq: 250, gain: 0, q: 1.0, label: "Low" },
        { freq: 1000, gain: 1, q: 1.0, label: "Mid" },
        { freq: 4000, gain: 3, q: 1.0, label: "Hi-Mid" },
        { freq: 8000, gain: 2, q: 1.0, label: "High" },
        { freq: 16000, gain: -2, q: 1.0, label: "Air" },
      ],
      compressor: { threshold: -20, ratio: 6, attack: 3, release: 80, knee: 6, enabled: true },
      limiter: { threshold: -1, release: 50, enabled: true },
      noiseGate: { threshold: -35, attack: 0.5, release: 50, enabled: true },
    },
  },
  {
    id: "cinema", label: "Cinema Mix", icon: Volume2,
    state: {
      reverb: { mix: 0.15, decay: 2.0, preDelay: 30, enabled: true },
      compressor: { threshold: -16, ratio: 2, attack: 20, release: 200, knee: 15, enabled: true },
    },
  },
];

/**
 * Build AudioContext processing chain from AudioFXState
 */
export function buildAudioChain(audioCtx: AudioContext, state: AudioFXState): { input: AudioNode; output: AudioNode } {
  let currentNode: AudioNode = audioCtx.createGain();
  const inputNode = currentNode;

  // EQ bands
  for (const band of state.eqBands) {
    if (band.gain === 0) continue;
    const eq = audioCtx.createBiquadFilter();
    eq.type = "peaking";
    eq.frequency.value = band.freq;
    eq.gain.value = band.gain;
    eq.Q.value = band.q;
    currentNode.connect(eq);
    currentNode = eq;
  }

  // Compressor
  if (state.compressor.enabled) {
    const comp = audioCtx.createDynamicsCompressor();
    comp.threshold.value = state.compressor.threshold;
    comp.ratio.value = state.compressor.ratio;
    comp.attack.value = state.compressor.attack / 1000;
    comp.release.value = state.compressor.release / 1000;
    comp.knee.value = state.compressor.knee;
    currentNode.connect(comp);
    currentNode = comp;
  }

  // Limiter
  if (state.limiter.enabled) {
    const limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.value = state.limiter.threshold;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = state.limiter.release / 1000;
    limiter.knee.value = 0;
    currentNode.connect(limiter);
    currentNode = limiter;
  }

  return { input: inputNode, output: currentNode };
}

interface AudioFXPanelProps {
  audioFX: AudioFXState;
  onUpdate: (fx: AudioFXState) => void;
  onClose: () => void;
}

export default function AudioFXPanel({ audioFX, onUpdate, onClose }: AudioFXPanelProps) {
  const [tab, setTab] = useState<"eq" | "dynamics" | "presets">("presets");

  const updateBand = (idx: number, gain: number) => {
    const bands = [...audioFX.eqBands];
    bands[idx] = { ...bands[idx], gain };
    onUpdate({ ...audioFX, eqBands: bands });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AudioLines className="w-4 h-4" style={{ color: "#8B5CF6" }} />
          <span className="text-[11px] font-bold text-white">Audio FX</span>
        </div>
        <button onClick={onClose} className="text-[10px]" style={{ color: "#555" }}>Done</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(["presets", "eq", "dynamics"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: tab === t ? "rgba(139,92,246,0.1)" : "#111",
              color: tab === t ? "#8B5CF6" : "#555",
              border: tab === t ? "1px solid rgba(139,92,246,0.22)" : "1px solid #1a1a1a",
            }}>
            {t === "eq" ? "EQ" : t === "dynamics" ? "Dynamics" : "Presets"}
          </button>
        ))}
      </div>

      {tab === "presets" && (
        <div className="grid grid-cols-2 gap-1.5">
          {AUDIO_PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button key={preset.id}
                onClick={() => onUpdate({ ...DEFAULT_AUDIO_FX, ...preset.state } as AudioFXState)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl text-[9px] font-bold transition-all active:scale-95"
                style={{ background: "#111", border: "1px solid #1a1a1a", color: "#888" }}>
                <Icon className="w-4 h-4" style={{ color: "#8B5CF6" }} />
                {preset.label}
              </button>
            );
          })}
          <button
            onClick={() => onUpdate({ ...DEFAULT_AUDIO_FX })}
            className="flex items-center gap-2 px-3 py-3 rounded-xl text-[9px] font-bold col-span-2"
            style={{ background: "#111", border: "1px solid #1a1a1a", color: "#555" }}>
            Reset All
          </button>
        </div>
      )}

      {tab === "eq" && (
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-1 h-24 px-1" style={{ background: "#080808", borderRadius: 12, border: "1px solid #1a1a1a", padding: "8px 4px" }}>
            {audioFX.eqBands.map((band, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-1">
                <div className="flex-1 flex items-center">
                  <input type="range" min={-12} max={12} value={band.gain}
                    onChange={(e) => updateBand(i, Number(e.target.value))}
                    className="w-16 accent-[#8B5CF6]"
                    style={{ writingMode: "vertical-lr" as any, direction: "rtl", height: 60 }} />
                </div>
                <span className="text-[6px] font-bold" style={{ color: band.gain !== 0 ? "#8B5CF6" : "#555" }}>
                  {band.gain > 0 ? "+" : ""}{band.gain}
                </span>
                <span className="text-[6px]" style={{ color: "#444" }}>{band.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "dynamics" && (
        <div className="space-y-2">
          {/* Compressor */}
          <div className="rounded-xl p-2.5" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
            <button onClick={() => onUpdate({ ...audioFX, compressor: { ...audioFX.compressor, enabled: !audioFX.compressor.enabled } })}
              className="w-full flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: audioFX.compressor.enabled ? "#8B5CF6" : "#333" }} />
              <span className="text-[9px] font-bold" style={{ color: audioFX.compressor.enabled ? "#fff" : "#666" }}>Compressor</span>
            </button>
            {audioFX.compressor.enabled && (
              <div className="space-y-1.5">
                {[
                  { label: "Threshold", key: "threshold" as const, min: -60, max: 0, val: audioFX.compressor.threshold, unit: "dB" },
                  { label: "Ratio", key: "ratio" as const, min: 1, max: 20, val: audioFX.compressor.ratio, unit: ":1" },
                ].map(({ label, key, min, max, val, unit }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[7px] w-12" style={{ color: "#555" }}>{label}</span>
                    <input type="range" min={min} max={max} value={val}
                      onChange={(e) => onUpdate({ ...audioFX, compressor: { ...audioFX.compressor, [key]: Number(e.target.value) } })}
                      className="flex-1 accent-[#8B5CF6]" />
                    <span className="text-[7px] font-mono w-10 text-right" style={{ color: "#8B5CF6" }}>{val}{unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Noise Gate */}
          <div className="rounded-xl p-2.5" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
            <button onClick={() => onUpdate({ ...audioFX, noiseGate: { ...audioFX.noiseGate, enabled: !audioFX.noiseGate.enabled } })}
              className="w-full flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: audioFX.noiseGate.enabled ? "#8B5CF6" : "#333" }} />
              <span className="text-[9px] font-bold" style={{ color: audioFX.noiseGate.enabled ? "#fff" : "#666" }}>Noise Gate</span>
            </button>
            {audioFX.noiseGate.enabled && (
              <div className="flex items-center gap-2">
                <span className="text-[7px] w-12" style={{ color: "#555" }}>Thresh</span>
                <input type="range" min={-60} max={0} value={audioFX.noiseGate.threshold}
                  onChange={(e) => onUpdate({ ...audioFX, noiseGate: { ...audioFX.noiseGate, threshold: Number(e.target.value) } })}
                  className="flex-1 accent-[#8B5CF6]" />
                <span className="text-[7px] font-mono w-10 text-right" style={{ color: "#8B5CF6" }}>{audioFX.noiseGate.threshold}dB</span>
              </div>
            )}
          </div>

          {/* Limiter */}
          <div className="rounded-xl p-2.5" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
            <button onClick={() => onUpdate({ ...audioFX, limiter: { ...audioFX.limiter, enabled: !audioFX.limiter.enabled } })}
              className="w-full flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: audioFX.limiter.enabled ? "#8B5CF6" : "#333" }} />
              <span className="text-[9px] font-bold" style={{ color: audioFX.limiter.enabled ? "#fff" : "#666" }}>Limiter</span>
            </button>
          </div>

          {/* Reverb */}
          <div className="rounded-xl p-2.5" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
            <button onClick={() => onUpdate({ ...audioFX, reverb: { ...audioFX.reverb, enabled: !audioFX.reverb.enabled } })}
              className="w-full flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: audioFX.reverb.enabled ? "#8B5CF6" : "#333" }} />
              <span className="text-[9px] font-bold" style={{ color: audioFX.reverb.enabled ? "#fff" : "#666" }}>Reverb</span>
            </button>
            {audioFX.reverb.enabled && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[7px] w-12" style={{ color: "#555" }}>Mix</span>
                  <input type="range" min={0} max={100} value={Math.round(audioFX.reverb.mix * 100)}
                    onChange={(e) => onUpdate({ ...audioFX, reverb: { ...audioFX.reverb, mix: Number(e.target.value) / 100 } })}
                    className="flex-1 accent-[#8B5CF6]" />
                  <span className="text-[7px] font-mono w-10 text-right" style={{ color: "#8B5CF6" }}>{Math.round(audioFX.reverb.mix * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] w-12" style={{ color: "#555" }}>Decay</span>
                  <input type="range" min={1} max={80} value={Math.round(audioFX.reverb.decay * 10)}
                    onChange={(e) => onUpdate({ ...audioFX, reverb: { ...audioFX.reverb, decay: Number(e.target.value) / 10 } })}
                    className="flex-1 accent-[#8B5CF6]" />
                  <span className="text-[7px] font-mono w-10 text-right" style={{ color: "#8B5CF6" }}>{audioFX.reverb.decay.toFixed(1)}s</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
