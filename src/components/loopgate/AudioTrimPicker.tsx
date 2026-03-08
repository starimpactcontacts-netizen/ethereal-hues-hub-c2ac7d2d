import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Scissors, Check, Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';

interface AudioTrimPickerProps {
  file: File;
  onConfirm: (trimmedFile: File) => void;
  onCancel: () => void;
}

export default function AudioTrimPicker({ file, onConfirm, onCancel }: AudioTrimPickerProps) {
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const MAX_CLIP = 30;
  const endTime = Math.min(startTime + MAX_CLIP, duration);
  const clipDuration = endTime - startTime;
  const needsTrim = duration > MAX_CLIP;

  // Decode audio and generate waveform
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const buf = await file.arrayBuffer();
        const ctx = new AudioContext();
        const decoded = await ctx.decodeAudioData(buf.slice(0));
        if (cancelled) { ctx.close(); return; }
        setDuration(decoded.duration);

        // Generate waveform bars
        const raw = decoded.getChannelData(0);
        const bars = 80;
        const blockSize = Math.floor(raw.length / bars);
        const peaks: number[] = [];
        for (let i = 0; i < bars; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(raw[i * blockSize + j]);
          }
          peaks.push(sum / blockSize);
        }
        const max = Math.max(...peaks, 0.01);
        setWaveform(peaks.map(p => p / max));
        ctx.close();
      } catch {
        setDuration(0);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [file]);

  // Create preview audio element
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const a = new Audio(url);
    audioRef.current = a;
    return () => {
      a.pause();
      URL.revokeObjectURL(url);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [file]);

  const playPreview = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    a.currentTime = startTime;
    a.play().then(() => {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        if (a.currentTime >= endTime) {
          a.pause();
          setIsPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
        setCurrentTime(a.currentTime);
      }, 50);
    }).catch(() => {});
  }, [isPlaying, startTime, endTime]);

  // Stop preview when start changes
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime]);

  const handleConfirm = async () => {
    if (!needsTrim) {
      onConfirm(file);
      return;
    }
    setProcessing(true);
    try {
      const buf = await file.arrayBuffer();
      const ctx = new AudioContext();
      const decoded = await ctx.decodeAudioData(buf.slice(0));
      const sampleRate = decoded.sampleRate;
      const numChannels = Math.min(decoded.numberOfChannels, 2);
      const startSample = Math.floor(startTime * sampleRate);
      const frameCount = Math.ceil(clipDuration * sampleRate);

      const offline = new OfflineAudioContext(numChannels, frameCount, sampleRate);
      const source = offline.createBufferSource();
      source.buffer = decoded;
      source.connect(offline.destination);
      source.start(0, startTime, clipDuration);
      const rendered = await offline.startRendering();

      // Encode WAV
      const wavBlob = encodeWAV(rendered);
      const trimmedName = file.name.replace(/\.[^.]+$/, '') + '-clip.wav';
      const trimmedFile = new File([wavBlob], trimmedName, { type: 'audio/wav' });
      ctx.close();
      onConfirm(trimmedFile);
    } catch {
      onConfirm(file); // fallback
    }
    setProcessing(false);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <p className="text-xs text-muted-foreground">Analyzing audio...</p>
      </div>
    );
  }

  // Waveform visual
  const startPct = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPct = duration > 0 ? (endTime / duration) * 100 : 100;
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors size={14} className="text-emerald-500" />
          <span className="text-xs font-bold text-foreground">
            {needsTrim ? 'Pick your 30s clip' : 'Preview track'}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {fmt(clipDuration)} / {fmt(duration)}
        </span>
      </div>

      {/* Waveform */}
      <div className="relative h-16 bg-surface-1 rounded-lg overflow-hidden">
        {/* Selection overlay */}
        <div className="absolute inset-y-0 left-0 bg-black/40 z-10" style={{ width: `${startPct}%` }} />
        <div className="absolute inset-y-0 right-0 bg-black/40 z-10" style={{ width: `${100 - endPct}%` }} />
        
        {/* Selection borders */}
        <div className="absolute inset-y-0 z-20 border-x-2 border-emerald-500/60" 
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }} />

        {/* Playhead */}
        {isPlaying && (
          <motion.div 
            className="absolute top-0 bottom-0 w-0.5 bg-white z-30"
            style={{ left: `${playheadPct}%` }}
          />
        )}

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-px px-1 py-1">
          {waveform.map((v, i) => {
            const barPct = (i / waveform.length) * 100;
            const inRange = barPct >= startPct && barPct <= endPct;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-colors ${
                  inRange ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                }`}
                style={{ height: `${Math.max(8, v * 100)}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Range slider — only if needs trim */}
      {needsTrim && (
        <div>
          <Slider
            value={[startTime]}
            onValueChange={([v]) => setStartTime(Math.min(v, duration - MAX_CLIP))}
            min={0}
            max={Math.max(0, duration - MAX_CLIP)}
            step={0.5}
            className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-0 [&_.range]:bg-emerald-500 [&_[role=slider]]:touch-none"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-muted-foreground font-mono">{fmt(startTime)}</span>
            <span className="text-[9px] text-emerald-500 font-mono font-bold">{fmt(startTime)} — {fmt(endTime)}</span>
            <span className="text-[9px] text-muted-foreground font-mono">{fmt(duration)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={playPreview}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-xs font-bold text-foreground hover:bg-surface-1 transition-colors"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? 'Pause' : 'Preview'}
        </button>
        <button
          onClick={handleConfirm}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
        >
          {processing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          {processing ? 'Processing...' : needsTrim ? 'Use This Clip' : 'Upload'}
        </button>
      </div>

      <button onClick={onCancel} className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground py-1">
        Cancel
      </button>
    </div>
  );
}

function encodeWAV(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numFrames = buffer.length;
  const dataSize = numFrames * blockAlign;
  const totalSize = 44 + dataSize;

  const ab = new ArrayBuffer(totalSize);
  const view = new DataView(ab);

  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

  let off = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}
