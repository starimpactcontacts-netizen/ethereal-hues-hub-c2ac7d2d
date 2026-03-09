import { useEffect, useRef, useState } from "react";
import { generateWaveformData, drawWaveform, type WaveformStyle, type WaveformData } from "@/lib/studioWaveform";

type TimelineWaveformProps = {
  file: File | null;
  width: number;
  height: number;
  playheadPosition: number; // 0-1
  trimStart: number; // 0-1
  trimEnd: number; // 0-1
  style?: WaveformStyle;
  color?: string;
  activeColor?: string;
};

export default function TimelineWaveform({
  file,
  width,
  height,
  playheadPosition,
  trimStart,
  trimEnd,
  style = "bars",
  color = "hsl(0 0% 50%)",
  activeColor = "hsl(0 0% 80%)",
}: TimelineWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!file) {
      setWaveformData(null);
      return;
    }

    const loadWaveform = async () => {
      setIsLoading(true);
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        const targetSamples = Math.max(100, Math.min(width * 2, 2000));
        const data = await generateWaveformData(file, audioContextRef.current, targetSamples);
        setWaveformData(data);
      } catch (err) {
        console.error("Failed to generate waveform:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWaveform();
  }, [file, width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !waveformData) return;

    // Set canvas size for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    drawWaveform(
      ctx,
      waveformData.peaks,
      width,
      height,
      style,
      color,
      activeColor,
      playheadPosition,
      trimStart,
      trimEnd
    );
  }, [waveformData, width, height, playheadPosition, trimStart, trimEnd, style, color, activeColor]);

  return (
    <div className="relative" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="absolute inset-0"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1 w-16 rounded-full bg-border/30 overflow-hidden">
            <div className="h-full w-1/3 bg-foreground/50 animate-pulse rounded-full" />
          </div>
        </div>
      )}
      {!file && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground/50">No audio</span>
        </div>
      )}
    </div>
  );
}
