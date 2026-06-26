export interface SynkozTrack {
  id: string;
  name: string;
  file: File;
  buffer: AudioBuffer;
  peaks: number[];
  /** seconds of overlap crossfading into the next track (ignored for the last track) */
  fadeDuration: number;
}

const PEAK_SAMPLES = 600;

export async function decodeTrack(ctx: AudioContext, file: File, id: string): Promise<SynkozTrack> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arrayBuffer);
  return {
    id,
    name: file.name.replace(/\.[^/.]+$/, ""),
    file,
    buffer,
    peaks: computePeaks(buffer, PEAK_SAMPLES),
    fadeDuration: Math.min(8, buffer.duration / 4),
  };
}

function computePeaks(buffer: AudioBuffer, samples: number): number[] {
  const data = buffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(data.length / samples));
  const peaks: number[] = [];
  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize && start + j < data.length; j++) {
      const v = Math.abs(data[start + j]);
      if (v > max) max = v;
    }
    peaks.push(max);
  }
  return peaks;
}

/** Computes the absolute start time (seconds from mix start) of each track given crossfades. */
export function computeTrackStarts(tracks: SynkozTrack[]): number[] {
  const starts: number[] = [];
  let t = 0;
  for (let i = 0; i < tracks.length; i++) {
    starts.push(t);
    const fade = i < tracks.length - 1 ? tracks[i].fadeDuration : 0;
    t += tracks[i].buffer.duration - fade;
  }
  return starts;
}

export function totalMixDuration(tracks: SynkozTrack[]): number {
  const starts = computeTrackStarts(tracks);
  if (tracks.length === 0) return 0;
  const last = tracks[tracks.length - 1];
  return starts[starts.length - 1] + last.buffer.duration;
}

interface ScheduledSource {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

export class SynkozEngine {
  private ctx: AudioContext;
  private sources: ScheduledSource[] = [];
  private startedAtCtxTime = 0;
  private mixStartOffset = 0;
  private playing = false;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  get isPlaying() {
    return this.playing;
  }

  /** seconds elapsed into the overall mix */
  getElapsed(): number {
    if (!this.playing) return this.mixStartOffset;
    return this.mixStartOffset + (this.ctx.currentTime - this.startedAtCtxTime);
  }

  stop() {
    this.sources.forEach(({ source }) => {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    });
    this.sources = [];
    this.playing = false;
  }

  play(tracks: SynkozTrack[], fromSeconds = 0) {
    this.stop();
    const starts = computeTrackStarts(tracks);
    const now = this.ctx.currentTime;
    this.startedAtCtxTime = now;
    this.mixStartOffset = fromSeconds;
    this.playing = true;

    tracks.forEach((track, i) => {
      const trackStart = starts[i];
      const trackEnd = trackStart + track.buffer.duration;
      if (trackEnd <= fromSeconds) return;

      const offsetIntoTrack = Math.max(0, fromSeconds - trackStart);
      const whenToStart = now + Math.max(0, trackStart - fromSeconds);

      const gain = this.ctx.createGain();
      const source = this.ctx.createBufferSource();
      source.buffer = track.buffer;
      source.connect(gain);
      gain.connect(this.ctx.destination);

      const fadeIn = i > 0 ? tracks[i - 1].fadeDuration : 0;
      const fadeOut = i < tracks.length - 1 ? track.fadeDuration : 0;
      const fadeInEndAbs = trackStart + fadeIn;
      const fadeOutStartAbs = trackEnd - fadeOut;

      gain.gain.setValueAtTime(fadeIn > 0 ? 0 : 1, whenToStart);
      if (fadeIn > 0) {
        const rampWhen = now + Math.max(0, fadeInEndAbs - fromSeconds);
        gain.gain.linearRampToValueAtTime(1, rampWhen);
      }
      if (fadeOut > 0) {
        const fadeOutStartWhen = now + Math.max(0, fadeOutStartAbs - fromSeconds);
        const fadeOutEndWhen = now + (trackEnd - fromSeconds);
        gain.gain.setValueAtTime(1, fadeOutStartWhen);
        gain.gain.linearRampToValueAtTime(0, fadeOutEndWhen);
      }

      source.start(whenToStart, offsetIntoTrack);
      source.stop(now + (trackEnd - fromSeconds));
      this.sources.push({ source, gain });
    });
  }

  pause() {
    this.mixStartOffset = this.getElapsed();
    this.stop();
  }
}
