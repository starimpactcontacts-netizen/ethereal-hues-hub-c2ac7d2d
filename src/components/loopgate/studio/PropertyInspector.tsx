/**
 * Loopgate Studio — Property Inspector Panel
 * Detailed editor for selected clips, overlays, and effects with keyframe support
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Type, Film, Music, Sparkles, Settings,
  ChevronRight, ChevronDown, Lock, Unlock, Eye, EyeOff,
  Copy, Trash2, Move, RotateCw, Maximize, Blend,
  Clock, Zap, Hash, Palette
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

// ─── Types ───
export type InspectorTarget =
  | { type: 'clip'; id: string; data: ClipInspectorData }
  | { type: 'text'; id: string; data: TextInspectorData }
  | { type: 'audio'; id: string; data: AudioInspectorData }
  | { type: 'effect'; id: string; data: EffectInspectorData }
  | null;

type ClipInspectorData = {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  sourceStart: number;
  sourceEnd: number;
  speed: number;
  opacity: number;
  scale: number;
  scaleX: number;
  scaleY: number;
  scaleLocked: boolean;
  rotation: number;
  positionX: number;
  positionY: number;
  locked: boolean;
  visible: boolean;
};

type TextInspectorData = {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  shadow: boolean;
  glow: boolean;
  animation: string;
  positionX: number;
  positionY: number;
  startTime: number;
  endTime: number;
};

type AudioInspectorData = {
  name: string;
  duration: number;
  volume: number;
  pan: number;
  fadeIn: number;
  fadeOut: number;
  startTime: number;
  endTime: number;
  muted: boolean;
};

type EffectInspectorData = {
  name: string;
  intensity: number;
  startTime: number;
  endTime: number;
  params: Record<string, number>;
};

interface PropertyInspectorProps {
  target: InspectorTarget;
  onUpdate: (updates: Partial<any>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function PropertyInspector({
  target,
  onUpdate,
  onDelete,
  onDuplicate,
}: PropertyInspectorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['transform', 'timing', 'appearance'])
  );

  const toggleSection = (section: string) => {
    const next = new Set(expandedSections);
    if (next.has(section)) {
      next.delete(section);
    } else {
      next.add(section);
    }
    setExpandedSections(next);
  };

  if (!target) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
          <Layers className="w-6 h-6 text-white/30" />
        </div>
        <h3 className="text-sm font-medium text-white/50 mb-1">No Selection</h3>
        <p className="text-xs text-white/30">Select a clip, text, or effect to edit its properties</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * 30); // 30fps frames
    return `${m}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  const SectionHeader = ({ 
    id, 
    icon: Icon, 
    label 
  }: { 
    id: string; 
    icon: typeof Layers; 
    label: string 
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/70 hover:text-white uppercase tracking-wider"
    >
      {expandedSections.has(id) ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronRight className="w-3 h-3" />
      )}
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  const SliderRow = ({
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    unit = '',
    precision = 0,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    precision?: number;
  }) => (
    <div className="px-3 py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-xs font-mono text-white/70">
          {value.toFixed(precision)}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );

  const renderClipInspector = (data: ClipInspectorData) => (
    <>
      {/* Header */}
      <div className="px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Film className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white truncate">{data.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate({ locked: !data.locked })}
            className={`p-1.5 rounded ${data.locked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/40'}`}
          >
            {data.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onUpdate({ visible: !data.visible })}
            className={`p-1.5 rounded ${!data.visible ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/40'}`}
          >
            {data.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <div className="flex-1" />
          <button onClick={onDuplicate} className="p-1.5 rounded bg-white/5 text-white/40 hover:text-white">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timing */}
      <SectionHeader id="timing" icon={Clock} label="Timing" />
      {expandedSections.has('timing') && (
        <div className="border-b border-white/5 pb-2">
          <div className="px-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/5 rounded px-2 py-1.5">
              <div className="text-white/40 text-[10px]">Start</div>
              <div className="text-white font-mono">{formatTime(data.startTime)}</div>
            </div>
            <div className="bg-white/5 rounded px-2 py-1.5">
              <div className="text-white/40 text-[10px]">End</div>
              <div className="text-white font-mono">{formatTime(data.endTime)}</div>
            </div>
            <div className="bg-white/5 rounded px-2 py-1.5">
              <div className="text-white/40 text-[10px]">Duration</div>
              <div className="text-white font-mono">{formatTime(data.duration)}</div>
            </div>
            <div className="bg-white/5 rounded px-2 py-1.5">
              <div className="text-white/40 text-[10px]">Speed</div>
              <div className="text-white font-mono">{data.speed}x</div>
            </div>
          </div>
        </div>
      )}

      {/* Transform */}
      <SectionHeader id="transform" icon={Move} label="Transform" />
      {expandedSections.has('transform') && (
        <div className="border-b border-white/5 pb-2">
          <SliderRow
            label="Position X"
            value={data.positionX}
            onChange={(v) => onUpdate({ positionX: v })}
            min={-100}
            max={100}
            unit="%"
          />
          <SliderRow
            label="Position Y"
            value={data.positionY}
            onChange={(v) => onUpdate({ positionY: v })}
            min={-100}
            max={100}
            unit="%"
          />
          <SliderRow
            label="Scale"
            value={data.scale}
            onChange={(v) => onUpdate({ scale: v })}
            min={10}
            max={200}
            unit="%"
          />
          <SliderRow
            label="Rotation"
            value={data.rotation}
            onChange={(v) => onUpdate({ rotation: v })}
            min={-180}
            max={180}
            unit="°"
          />
        </div>
      )}

      {/* Appearance */}
      <SectionHeader id="appearance" icon={Blend} label="Appearance" />
      {expandedSections.has('appearance') && (
        <div className="pb-2">
          <SliderRow
            label="Opacity"
            value={data.opacity}
            onChange={(v) => onUpdate({ opacity: v })}
            min={0}
            max={100}
            unit="%"
          />
        </div>
      )}
    </>
  );

  const renderTextInspector = (data: TextInspectorData) => (
    <>
      {/* Header */}
      <div className="px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Type className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Text Overlay</span>
        </div>
        <textarea
          value={data.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none outline-none focus:border-white/30"
          rows={2}
          placeholder="Enter text..."
        />
      </div>

      {/* Typography */}
      <SectionHeader id="typography" icon={Type} label="Typography" />
      {expandedSections.has('typography') && (
        <div className="border-b border-white/5 pb-2">
          <SliderRow
            label="Font Size"
            value={data.fontSize}
            onChange={(v) => onUpdate({ fontSize: v })}
            min={12}
            max={200}
            unit="px"
          />
          <SliderRow
            label="Font Weight"
            value={data.fontWeight}
            onChange={(v) => onUpdate({ fontWeight: v })}
            min={100}
            max={900}
            step={100}
          />
          <SliderRow
            label="Stroke Width"
            value={data.strokeWidth}
            onChange={(v) => onUpdate({ strokeWidth: v })}
            min={0}
            max={20}
            unit="px"
          />
        </div>
      )}

      {/* Style */}
      <SectionHeader id="style" icon={Palette} label="Style" />
      {expandedSections.has('style') && (
        <div className="border-b border-white/5 pb-2 px-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Shadow</span>
            <Switch
              checked={data.shadow}
              onCheckedChange={(v) => onUpdate({ shadow: v })}
              className="scale-75"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Glow</span>
            <Switch
              checked={data.glow}
              onCheckedChange={(v) => onUpdate({ glow: v })}
              className="scale-75"
            />
          </div>
        </div>
      )}

      {/* Position */}
      <SectionHeader id="position" icon={Move} label="Position" />
      {expandedSections.has('position') && (
        <div className="pb-2">
          <SliderRow
            label="X Position"
            value={data.positionX}
            onChange={(v) => onUpdate({ positionX: v })}
            min={0}
            max={100}
            unit="%"
          />
          <SliderRow
            label="Y Position"
            value={data.positionY}
            onChange={(v) => onUpdate({ positionY: v })}
            min={0}
            max={100}
            unit="%"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-3 py-2 flex gap-2">
        <button onClick={onDuplicate} className="flex-1 py-2 rounded-lg bg-white/5 text-xs text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center gap-1.5">
          <Copy className="w-3.5 h-3.5" /> Duplicate
        </button>
        <button onClick={onDelete} className="flex-1 py-2 rounded-lg bg-red-500/10 text-xs text-red-400 hover:bg-red-500/20 flex items-center justify-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </>
  );

  const renderAudioInspector = (data: AudioInspectorData) => (
    <>
      <div className="px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white truncate">{data.name}</span>
        </div>
      </div>

      <SectionHeader id="levels" icon={Settings} label="Levels" />
      {expandedSections.has('levels') && (
        <div className="border-b border-white/5 pb-2">
          <SliderRow
            label="Volume"
            value={data.volume}
            onChange={(v) => onUpdate({ volume: v })}
            min={0}
            max={200}
            unit="%"
          />
          <SliderRow
            label="Pan"
            value={data.pan}
            onChange={(v) => onUpdate({ pan: v })}
            min={-100}
            max={100}
          />
        </div>
      )}

      <SectionHeader id="fades" icon={Blend} label="Fades" />
      {expandedSections.has('fades') && (
        <div className="pb-2">
          <SliderRow
            label="Fade In"
            value={data.fadeIn}
            onChange={(v) => onUpdate({ fadeIn: v })}
            min={0}
            max={5}
            step={0.1}
            unit="s"
            precision={1}
          />
          <SliderRow
            label="Fade Out"
            value={data.fadeOut}
            onChange={(v) => onUpdate({ fadeOut: v })}
            min={0}
            max={5}
            step={0.1}
            unit="s"
            precision={1}
          />
        </div>
      )}
    </>
  );

  const renderEffectInspector = (data: EffectInspectorData) => (
    <>
      <div className="px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-white">{data.name}</span>
        </div>
      </div>

      <SectionHeader id="params" icon={Settings} label="Parameters" />
      {expandedSections.has('params') && (
        <div className="pb-2">
          <SliderRow
            label="Intensity"
            value={data.intensity}
            onChange={(v) => onUpdate({ intensity: v })}
            min={0}
            max={100}
            unit="%"
          />
          {Object.entries(data.params).map(([key, value]) => (
            <SliderRow
              key={key}
              label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              value={value}
              onChange={(v) => onUpdate({ params: { ...data.params, [key]: v } })}
              min={0}
              max={100}
            />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${target.type}-${target.id}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          {target.type === 'clip' && renderClipInspector(target.data)}
          {target.type === 'text' && renderTextInspector(target.data)}
          {target.type === 'audio' && renderAudioInspector(target.data)}
          {target.type === 'effect' && renderEffectInspector(target.data)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
