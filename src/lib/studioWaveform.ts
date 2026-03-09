/**
 * Audio Waveform Renderer — Loopgate Studio
 * Renders professional waveforms for timeline visualization.
 */

export type WaveformStyle = "bars" | "line" | "mirror";

export type WaveformData = {
  peaks: number[];
  duration: number;
  sampleRate: number;
};

// ─── Extract Peaks from AudioBuffer ───
export function extractWaveformPeaks(
  audioBuffer: AudioBuffer,
  samplesPerPixel: number = 256
): number[] {
  const data = audioBuffer.getChannelData(0);
  const peaks: number[] = [];
  const blockSize = Math.floor(data.length / samplesPerPixel);

  for (let i = 0; i < samplesPerPixel; i++) {
    let max = 0;
    for (let j = 0; j < blockSize; j++) {
      const idx = i * blockSize + j;
      if (idx < data.length) {
        const abs = Math.abs(data[idx]);
        if (abs > max) max = abs;
      }
    }
    peaks.push(max);
  }

  return peaks;
}

// ─── Draw Waveform to Canvas ───
export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  peaks: number[],
  width: number,
  height: number,
  style: WaveformStyle = "bars",
  color: string = "hsl(0 0% 60%)",
  activeColor: string = "hsl(0 0% 85%)",
  playheadPosition: number = 0, // 0-1
  trimStart: number = 0, // 0-1
  trimEnd: number = 1 // 0-1
): void {
  ctx.clearRect(0, 0, width, height);

  const barWidth = width / peaks.length;
  const centerY = height / 2;

  if (style === "bars") {
    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const barHeight = peak * height * 0.8;
      const normalizedX = i / peaks.length;

      const inTrim = normalizedX >= trimStart && normalizedX <= trimEnd;
      const isPlayed = normalizedX <= playheadPosition;

      ctx.fillStyle = inTrim
        ? isPlayed
          ? activeColor
          : color
        : "hsl(0 0% 25%)";

      ctx.fillRect(
        x,
        centerY - barHeight / 2,
        Math.max(1, barWidth - 1),
        barHeight
      );
    });
  } else if (style === "line") {
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const y = centerY - peak * height * 0.4;
      ctx.lineTo(x, y);
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mirror bottom
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const y = centerY + peak * height * 0.4;
      ctx.lineTo(x, y);
    });
    ctx.strokeStyle = `${color}80`;
    ctx.stroke();
  } else if (style === "mirror") {
    ctx.beginPath();
    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const barHeight = peak * height * 0.4;
      const normalizedX = i / peaks.length;
      const inTrim = normalizedX >= trimStart && normalizedX <= trimEnd;

      ctx.fillStyle = inTrim ? color : "hsl(0 0% 20%)";
      ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight);
      ctx.fillRect(x, centerY, barWidth - 1, barHeight);
    });
  }

  // Draw playhead
  if (playheadPosition > 0 && playheadPosition < 1) {
    const playX = playheadPosition * width;
    ctx.fillStyle = "hsl(0 0% 100%)";
    ctx.fillRect(playX - 1, 0, 2, height);
  }
}

// ─── Async Waveform Generation ───
export async function generateWaveformData(
  file: File,
  audioContext: AudioContext,
  targetSamples: number = 1000
): Promise<WaveformData> {
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const peaks = extractWaveformPeaks(audioBuffer, targetSamples);

  return {
    peaks,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
  };
}
