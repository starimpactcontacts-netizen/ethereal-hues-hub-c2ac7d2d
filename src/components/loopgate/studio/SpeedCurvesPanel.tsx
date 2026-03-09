/**
 * Loopgate Studio — Speed Curves Panel
 * Visual speed ramping editor with presets and curve visualization
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Gauge, Play, Pause, RotateCcw, Check, ChevronDown,
  Zap, Timer, Rewind, FastForward
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  SPEED_CURVE_PRESETS,
  generateCurvePoints,
  getSpeedAtTime,
  getModifiedDuration,
  type SpeedCurve,
  type SpeedKeyframe,
} from "@/lib/studioSpeedCurves";

interface SpeedCurvesPanelProps {
  duration: number;
  currentCurve: SpeedCurve;
  onCurveChange: (curve: SpeedCurve) => void;
  playheadPosition?: number; // 0-1 normalized
}

export default function SpeedCurvesPanel({
  duration,
  currentCurve,
  onCurveChange,
  playheadPosition = 0,
}: SpeedCurvesPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedKeyframe, setSelectedKeyframe] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate modified duration
  const modifiedDuration = getModifiedDuration(currentCurve, duration);
  const currentSpeed = getSpeedAtTime(currentCurve, playheadPosition);

  // Draw speed curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const padding = 20;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = 'hsl(0 0% 8%)';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'hsl(0 0% 20%)';
    ctx.lineWidth = 1;
    
    // Horizontal lines (speed levels)
    const speedLines = [0.25, 0.5, 1, 1.5, 2, 2.5, 3];
    speedLines.forEach(speed => {
      const y = padding + graphHeight - ((speed / 3) * graphHeight);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = 'hsl(0 0% 40%)';
      ctx.font = '9px system-ui';
      ctx.fillText(`${speed}x`, 2, y + 3);
    });

    // 1x line highlight
    const oneXY = padding + graphHeight - ((1 / 3) * graphHeight);
    ctx.strokeStyle = 'hsl(0 0% 35%)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, oneXY);
    ctx.lineTo(width - padding, oneXY);
    ctx.stroke();

    // Generate and draw curve
    const points = generateCurvePoints(currentCurve, graphWidth, graphHeight, 0, 3);
    
    // Gradient fill under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'hsla(220 80% 60% / 0.3)');
    gradient.addColorStop(1, 'hsla(220 80% 60% / 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    points.forEach((p, i) => {
      if (i === 0) {
        ctx.lineTo(padding + p.x, padding + p.y);
      } else {
        ctx.lineTo(padding + p.x, padding + p.y);
      }
    });
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Curve line
    ctx.strokeStyle = 'hsl(220 80% 60%)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(padding + p.x, padding + p.y);
      } else {
        ctx.lineTo(padding + p.x, padding + p.y);
      }
    });
    ctx.stroke();

    // Keyframe dots
    currentCurve.keyframes.forEach((kf, i) => {
      const x = padding + kf.time * graphWidth;
      const y = padding + graphHeight - ((kf.speed / 3) * graphHeight);
      
      ctx.beginPath();
      ctx.arc(x, y, selectedKeyframe === i ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = selectedKeyframe === i ? 'hsl(220 80% 70%)' : 'hsl(220 80% 60%)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Playhead
    if (playheadPosition >= 0 && playheadPosition <= 1) {
      const phX = padding + playheadPosition * graphWidth;
      ctx.strokeStyle = 'hsl(0 80% 60%)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(phX, padding);
      ctx.lineTo(phX, height - padding);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current speed indicator
      const phY = padding + graphHeight - ((currentSpeed / 3) * graphHeight);
      ctx.beginPath();
      ctx.arc(phX, phY, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'hsl(0 80% 60%)';
      ctx.fill();
    }

  }, [currentCurve, playheadPosition, selectedKeyframe, currentSpeed]);

  // Handle canvas click to add/select keyframes
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const padding = 20;
    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;

    const time = Math.max(0, Math.min(1, (x - padding) / graphWidth));
    const speed = Math.max(0.1, Math.min(3, (1 - (y - padding) / graphHeight) * 3));

    // Check if clicking near existing keyframe
    const clickRadius = 15;
    for (let i = 0; i < currentCurve.keyframes.length; i++) {
      const kf = currentCurve.keyframes[i];
      const kfX = padding + kf.time * graphWidth;
      const kfY = padding + graphHeight - ((kf.speed / 3) * graphHeight);
      
      if (Math.sqrt((x - kfX) ** 2 + (y - kfY) ** 2) < clickRadius) {
        setSelectedKeyframe(i);
        return;
      }
    }

    // Add new keyframe
    const newKeyframes = [...currentCurve.keyframes, { time, speed }]
      .sort((a, b) => a.time - b.time);
    
    onCurveChange({ ...currentCurve, keyframes: newKeyframes });
    setSelectedKeyframe(newKeyframes.findIndex(kf => kf.time === time));
  }, [currentCurve, onCurveChange]);

  // Update selected keyframe
  const updateKeyframeSpeed = (speed: number) => {
    if (selectedKeyframe === null) return;
    
    const newKeyframes = [...currentCurve.keyframes];
    newKeyframes[selectedKeyframe] = { ...newKeyframes[selectedKeyframe], speed };
    onCurveChange({ ...currentCurve, keyframes: newKeyframes });
  };

  const deleteSelectedKeyframe = () => {
    if (selectedKeyframe === null || currentCurve.keyframes.length <= 2) return;
    
    const newKeyframes = currentCurve.keyframes.filter((_, i) => i !== selectedKeyframe);
    onCurveChange({ ...currentCurve, keyframes: newKeyframes });
    setSelectedKeyframe(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Speed Ramping</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="space-y-3"
        >
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/5 rounded-lg px-2 py-1.5">
              <div className="text-[10px] text-white/40 uppercase">Original</div>
              <div className="text-xs font-mono text-white">{formatTime(duration)}</div>
            </div>
            <div className="bg-white/5 rounded-lg px-2 py-1.5">
              <div className="text-[10px] text-white/40 uppercase">Modified</div>
              <div className="text-xs font-mono text-blue-400">{formatTime(modifiedDuration)}</div>
            </div>
            <div className="bg-white/5 rounded-lg px-2 py-1.5">
              <div className="text-[10px] text-white/40 uppercase">Current</div>
              <div className="text-xs font-mono text-white">{currentSpeed.toFixed(2)}x</div>
            </div>
          </div>

          {/* Curve Canvas */}
          <div className="relative rounded-lg overflow-hidden border border-white/10">
            <canvas
              ref={canvasRef}
              width={320}
              height={160}
              onClick={handleCanvasClick}
              className="w-full cursor-crosshair"
            />
          </div>

          {/* Keyframe Controls */}
          {selectedKeyframe !== null && (
            <div className="bg-white/5 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Keyframe #{selectedKeyframe + 1}</span>
                <button
                  onClick={deleteSelectedKeyframe}
                  disabled={currentCurve.keyframes.length <= 2}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-30"
                >
                  Delete
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40 w-12">Speed</span>
                <Slider
                  value={[currentCurve.keyframes[selectedKeyframe]?.speed || 1]}
                  onValueChange={([v]) => updateKeyframeSpeed(v)}
                  min={0.1}
                  max={3}
                  step={0.05}
                  className="flex-1"
                />
                <span className="text-xs font-mono text-white w-10 text-right">
                  {(currentCurve.keyframes[selectedKeyframe]?.speed || 1).toFixed(2)}x
                </span>
              </div>
            </div>
          )}

          {/* Presets */}
          <div>
            <div className="text-xs text-white/40 mb-2 uppercase tracking-wider">Presets</div>
            <div className="grid grid-cols-2 gap-1.5">
              {SPEED_CURVE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onCurveChange(preset);
                    setSelectedKeyframe(null);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentCurve.id === preset.id
                      ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {preset.id.includes('slow') && <Timer className="w-3.5 h-3.5" />}
                  {preset.id.includes('fast') || preset.id.includes('whip') && <FastForward className="w-3.5 h-3.5" />}
                  {preset.id.includes('reverse') && <Rewind className="w-3.5 h-3.5" />}
                  {!preset.id.includes('slow') && !preset.id.includes('fast') && !preset.id.includes('reverse') && !preset.id.includes('whip') && <Zap className="w-3.5 h-3.5" />}
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              onCurveChange(SPEED_CURVE_PRESETS[0]);
              setSelectedKeyframe(null);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Linear
          </button>
        </motion.div>
      )}
    </div>
  );
}
