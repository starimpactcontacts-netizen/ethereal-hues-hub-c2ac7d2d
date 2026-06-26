import { useEffect, useRef } from "react";

interface WaveformProps {
  peaks: number[];
  color: string;
  progress?: number; // 0-1, how much of the track has played
  height?: number;
}

export default function Waveform({ peaks, color, progress = 0, height = 64 }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const mid = height / 2;
    const barWidth = width / peaks.length;
    const playedBars = Math.floor(peaks.length * progress);

    peaks.forEach((p, i) => {
      const barHeight = Math.max(1, p * height);
      ctx.fillStyle = i < playedBars ? color : `${color}55`;
      ctx.fillRect(i * barWidth, mid - barHeight / 2, Math.max(1, barWidth - 1), barHeight);
    });
  }, [peaks, color, progress, height]);

  return <canvas ref={canvasRef} className="waveform" style={{ height }} />;
}
