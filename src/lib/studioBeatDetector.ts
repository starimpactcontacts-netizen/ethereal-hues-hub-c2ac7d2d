/**
 * Loopgate Studio — Beat Detection Engine
 * Decodes audio (from a file or video) and finds onset/beat times via
 * energy spectral flux. Lightweight, all client-side.
 */

export type BeatAnalysis = {
  beats: number[];        // beat times in seconds
  bpm: number;            // estimated BPM
  duration: number;       // audio duration
  energy: number[];       // per-frame energy 0..1 (for waveform/anim)
  frameDuration: number;  // seconds per frame
};

const FRAME_SIZE = 1024;
const HOP_SIZE = 512;

/**
 * Detect beats from a File (audio or video file with audio track).
 */
export async function detectBeats(file: File, opts?: { sensitivity?: number }): Promise<BeatAnalysis> {
  const arrayBuf = await file.arrayBuffer();
  const Ctx: typeof AudioContext =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx = new Ctx();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
  } finally {
    try { ctx.close(); } catch {}
  }
  return analyzeBuffer(audioBuffer, opts?.sensitivity ?? 1.5);
}

/**
 * Detect beats directly from a video URL by extracting its audio.
 */
export async function detectBeatsFromUrl(url: string, opts?: { sensitivity?: number }): Promise<BeatAnalysis> {
  const res = await fetch(url);
  const blob = await res.blob();
  return detectBeats(new File([blob], "audio"), opts);
}

function analyzeBuffer(buffer: AudioBuffer, sensitivity: number): BeatAnalysis {
  const sr = buffer.sampleRate;
  // Mix to mono
  const channels = buffer.numberOfChannels;
  const len = buffer.length;
  const mono = new Float32Array(len);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i] += data[i] / channels;
  }

  // Compute per-frame energy (RMS) on hopped windows
  const numFrames = Math.max(1, Math.floor((len - FRAME_SIZE) / HOP_SIZE));
  const energy = new Float32Array(numFrames);
  for (let f = 0; f < numFrames; f++) {
    let sum = 0;
    const start = f * HOP_SIZE;
    for (let i = 0; i < FRAME_SIZE; i++) {
      const v = mono[start + i] || 0;
      sum += v * v;
    }
    energy[f] = Math.sqrt(sum / FRAME_SIZE);
  }

  // Normalize energy
  let maxE = 0;
  for (let i = 0; i < energy.length; i++) if (energy[i] > maxE) maxE = energy[i];
  const energyNorm: number[] = [];
  for (let i = 0; i < energy.length; i++) energyNorm.push(maxE > 0 ? energy[i] / maxE : 0);

  // Onset detection — spectral flux substitute via energy diff with adaptive threshold
  const frameDur = HOP_SIZE / sr;
  const onsets: number[] = [];
  const windowFrames = Math.max(8, Math.floor(0.5 / frameDur)); // 0.5s window
  for (let f = 1; f < energy.length; f++) {
    const diff = Math.max(0, energy[f] - energy[f - 1]);
    // Local mean
    let mean = 0;
    const w0 = Math.max(0, f - windowFrames);
    let count = 0;
    for (let j = w0; j < f; j++) {
      const d = Math.max(0, energy[j] - (energy[j - 1] || 0));
      mean += d;
      count++;
    }
    mean = count > 0 ? mean / count : 0;
    const threshold = mean * sensitivity + 0.005;
    if (diff > threshold) {
      const t = f * frameDur;
      // Min spacing: 120ms (max ~500 BPM, plenty for filtering)
      if (onsets.length === 0 || t - onsets[onsets.length - 1] > 0.12) {
        onsets.push(t);
      }
    }
  }

  // Estimate BPM from median inter-onset interval
  const bpm = estimateBPM(onsets);

  return {
    beats: onsets,
    bpm,
    duration: buffer.duration,
    energy: energyNorm,
    frameDuration: frameDur,
  };
}

function estimateBPM(beats: number[]): number {
  if (beats.length < 4) return 0;
  const intervals: number[] = [];
  for (let i = 1; i < beats.length; i++) intervals.push(beats[i] - beats[i - 1]);
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];
  if (!median) return 0;
  let bpm = 60 / median;
  // Fold into a musical range (60-180)
  while (bpm > 200) bpm /= 2;
  while (bpm < 60) bpm *= 2;
  return Math.round(bpm);
}

/**
 * Snap a time value to the nearest beat within a tolerance (seconds).
 */
export function snapToBeat(time: number, beats: number[], tolerance = 0.15): number {
  if (!beats.length) return time;
  let best = time;
  let bestDist = Infinity;
  for (const b of beats) {
    const d = Math.abs(b - time);
    if (d < bestDist) { bestDist = d; best = b; }
    if (b > time + tolerance) break;
  }
  return bestDist <= tolerance ? best : time;
}

/**
 * Get the current beat phase (0..1) for an animation pulse, given current time.
 * Returns 0 right on the beat and ramps to 1 by the next beat.
 */
export function beatPhase(time: number, beats: number[]): { phase: number; sinceBeat: number; intensity: number } {
  if (!beats.length) return { phase: 0, sinceBeat: Infinity, intensity: 0 };
  // binary search nearest beat <= time
  let lo = 0, hi = beats.length - 1, idx = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (beats[mid] <= time) { idx = mid; lo = mid + 1; } else hi = mid - 1;
  }
  const prev = beats[idx];
  const next = beats[idx + 1] ?? prev + 0.5;
  const span = Math.max(0.05, next - prev);
  const sinceBeat = time - prev;
  const phase = Math.min(1, sinceBeat / span);
  // Pulse intensity decays exponentially over ~150ms after a beat
  const intensity = Math.max(0, Math.exp(-sinceBeat * 12));
  return { phase, sinceBeat, intensity };
}
