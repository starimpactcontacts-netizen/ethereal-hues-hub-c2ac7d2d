/**
 * AI Auto-Clipper Engine — Loopgate Studio
 * Detects highlights using beat analysis, scene changes, and motion peaks.
 */

export type ClipHighlight = {
  id: string;
  startTime: number;
  endTime: number;
  score: number;
  type: "beat" | "scene" | "motion" | "combined";
  label: string;
};

export type AnalysisResult = {
  highlights: ClipHighlight[];
  beats: { time: number; strength: number }[];
  scenes: { time: number; confidence: number }[];
  duration: number;
};

// ─── Beat Detection via Web Audio API ───
export async function detectBeats(
  audioBuffer: AudioBuffer,
  sensitivity: number = 1.0
): Promise<{ time: number; strength: number }[]> {
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
  const beats: { time: number; strength: number }[] = [];

  let prevEnergy = 0;
  const threshold = 1.4 * sensitivity;

  for (let i = 0; i < data.length - windowSize; i += windowSize) {
    let energy = 0;
    for (let j = 0; j < windowSize; j++) {
      energy += data[i + j] ** 2;
    }
    energy = Math.sqrt(energy / windowSize);

    if (energy > prevEnergy * threshold && energy > 0.02) {
      beats.push({
        time: i / sampleRate,
        strength: Math.min(energy * 5, 1),
      });
    }
    prevEnergy = energy * 0.9 + prevEnergy * 0.1; // Smooth
  }

  return beats;
}

// ─── Scene Change Detection via Canvas ───
export async function detectSceneChanges(
  video: HTMLVideoElement,
  sensitivity: number = 1.0
): Promise<{ time: number; confidence: number }[]> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const scenes: { time: number; confidence: number }[] = [];

  const sampleWidth = 64;
  const sampleHeight = 36;
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const duration = video.duration;
  const sampleInterval = 0.5; // Sample every 500ms
  const samples = Math.floor(duration / sampleInterval);

  let prevHistogram: number[] | null = null;
  const threshold = 0.3 / sensitivity;

  for (let i = 0; i < samples; i++) {
    const time = i * sampleInterval;
    video.currentTime = time;
    await new Promise((r) => (video.onseeked = r));

    ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const histogram = computeHistogram(imageData.data);

    if (prevHistogram) {
      const diff = histogramDiff(prevHistogram, histogram);
      if (diff > threshold) {
        scenes.push({ time, confidence: Math.min(diff * 2, 1) });
      }
    }
    prevHistogram = histogram;
  }

  return scenes;
}

function computeHistogram(data: Uint8ClampedArray): number[] {
  const bins = 16;
  const histogram = new Array(bins * 3).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    histogram[Math.floor(data[i] / 16)]++;
    histogram[bins + Math.floor(data[i + 1] / 16)]++;
    histogram[bins * 2 + Math.floor(data[i + 2] / 16)]++;
  }

  const total = data.length / 4;
  return histogram.map((v) => v / total);
}

function histogramDiff(a: number[], b: number[]): number {
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff += Math.abs(a[i] - b[i]);
  }
  return diff / a.length;
}

// ─── Motion Detection ───
export async function detectMotionPeaks(
  video: HTMLVideoElement,
  sensitivity: number = 1.0
): Promise<{ time: number; intensity: number }[]> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const motionPeaks: { time: number; intensity: number }[] = [];

  const w = 64, h = 36;
  canvas.width = w;
  canvas.height = h;

  const duration = video.duration;
  const interval = 0.2;
  const samples = Math.floor(duration / interval);

  let prevFrame: Uint8ClampedArray | null = null;
  const threshold = 0.08 / sensitivity;

  for (let i = 0; i < samples; i++) {
    const time = i * interval;
    video.currentTime = time;
    await new Promise((r) => (video.onseeked = r));

    ctx.drawImage(video, 0, 0, w, h);
    const frame = ctx.getImageData(0, 0, w, h).data;

    if (prevFrame) {
      let diff = 0;
      for (let j = 0; j < frame.length; j += 4) {
        diff += Math.abs(frame[j] - prevFrame[j]);
        diff += Math.abs(frame[j + 1] - prevFrame[j + 1]);
        diff += Math.abs(frame[j + 2] - prevFrame[j + 2]);
      }
      diff /= frame.length * 255;

      if (diff > threshold) {
        motionPeaks.push({ time, intensity: Math.min(diff * 10, 1) });
      }
    }
    prevFrame = new Uint8ClampedArray(frame);
  }

  return motionPeaks;
}

// ─── Combined Highlight Extraction ───
export function extractHighlights(
  beats: { time: number; strength: number }[],
  scenes: { time: number; confidence: number }[],
  motion: { time: number; intensity: number }[],
  duration: number,
  clipDuration: number = 5,
  maxClips: number = 10
): ClipHighlight[] {
  const candidates: { time: number; score: number; type: ClipHighlight["type"] }[] = [];

  // Add scene changes
  scenes.forEach((s) => {
    candidates.push({ time: s.time, score: s.confidence * 40, type: "scene" });
  });

  // Boost scores near beats
  beats.forEach((b) => {
    const nearby = candidates.find((c) => Math.abs(c.time - b.time) < 0.5);
    if (nearby) {
      nearby.score += b.strength * 30;
      nearby.type = "combined";
    } else {
      candidates.push({ time: b.time, score: b.strength * 25, type: "beat" });
    }
  });

  // Boost scores near motion peaks
  motion.forEach((m) => {
    const nearby = candidates.find((c) => Math.abs(c.time - m.time) < 0.3);
    if (nearby) {
      nearby.score += m.intensity * 20;
      nearby.type = "combined";
    } else {
      candidates.push({ time: m.time, score: m.intensity * 15, type: "motion" });
    }
  });

  // Sort by score and filter overlaps
  candidates.sort((a, b) => b.score - a.score);

  const highlights: ClipHighlight[] = [];
  for (const c of candidates) {
    if (highlights.length >= maxClips) break;

    const overlaps = highlights.some(
      (h) => Math.abs(h.startTime - c.time) < clipDuration
    );
    if (!overlaps && c.time + clipDuration <= duration) {
      highlights.push({
        id: `clip-${highlights.length + 1}`,
        startTime: Math.max(0, c.time - 1),
        endTime: Math.min(duration, c.time + clipDuration - 1),
        score: c.score,
        type: c.type,
        label: `Highlight ${highlights.length + 1}`,
      });
    }
  }

  return highlights.sort((a, b) => a.startTime - b.startTime);
}

// ─── Full Analysis Pipeline ───
export async function analyzeVideo(
  video: HTMLVideoElement,
  audioContext: AudioContext,
  file: File,
  sensitivity: number = 1.0,
  onProgress?: (stage: string, percent: number) => void
): Promise<AnalysisResult> {
  const duration = video.duration;

  onProgress?.("Extracting audio", 10);
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  onProgress?.("Detecting beats", 30);
  const beats = await detectBeats(audioBuffer, sensitivity);

  onProgress?.("Analyzing scenes", 50);
  const scenes = await detectSceneChanges(video, sensitivity);

  onProgress?.("Detecting motion", 70);
  const motion = await detectMotionPeaks(video, sensitivity);

  onProgress?.("Extracting highlights", 90);
  const highlights = extractHighlights(beats, scenes, motion, duration);

  onProgress?.("Complete", 100);

  return { highlights, beats, scenes, duration };
}
