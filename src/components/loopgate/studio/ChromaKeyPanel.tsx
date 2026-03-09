/**
 * Loopgate Studio — Chroma Key Panel
 * Green screen removal controls with color picker and live preview
 */
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Palette, Eye, EyeOff, Pipette, RotateCcw, ChevronDown,
  Check, Circle
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_CHROMA_CONFIG,
  CHROMA_COLOR_PRESETS,
  type ChromaKeyConfig,
} from "@/lib/studioChromaKey";

interface ChromaKeyPanelProps {
  config: ChromaKeyConfig;
  onConfigChange: (config: ChromaKeyConfig) => void;
  onPickColor?: () => void; // Trigger eyedropper mode
  isPickingColor?: boolean;
}

export default function ChromaKeyPanel({
  config,
  onConfigChange,
  onPickColor,
  isPickingColor,
}: ChromaKeyPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [customColor, setCustomColor] = useState(config.keyColor);

  const updateConfig = (updates: Partial<ChromaKeyConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    updateConfig({ keyColor: color });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">Chroma Key</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => updateConfig({ enabled })}
            onClick={(e) => e.stopPropagation()}
            className="scale-75"
          />
          <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="space-y-4"
        >
          {/* Color Selection */}
          <div>
            <div className="text-xs text-white/40 mb-2 uppercase tracking-wider">Key Color</div>
            
            {/* Color Presets */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CHROMA_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => updateConfig({ keyColor: preset.color })}
                  className={`relative w-8 h-8 rounded-lg transition-all ${
                    config.keyColor.toLowerCase() === preset.color.toLowerCase()
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                >
                  {config.keyColor.toLowerCase() === preset.color.toLowerCase() && (
                    <Check className={`absolute inset-0 m-auto w-4 h-4 ${
                      preset.id === 'white' || preset.id === 'yellow' ? 'text-black' : 'text-white'
                    }`} />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Color + Eyedropper */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={config.keyColor}
                  onChange={(e) => updateConfig({ keyColor: e.target.value })}
                  className="flex-1 bg-transparent text-sm text-white font-mono uppercase outline-none"
                  placeholder="#00FF00"
                />
              </div>
              {onPickColor && (
                <button
                  onClick={onPickColor}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    isPickingColor
                      ? 'bg-green-500/30 text-green-400 ring-1 ring-green-500/50'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  title="Pick color from video"
                >
                  <Pipette className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Preview Indicator */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
            <div 
              className="w-10 h-10 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center"
              style={{ backgroundColor: config.keyColor }}
            >
              <Circle className="w-5 h-5 text-white/50" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-white/60">Removing this color</div>
              <div className="text-sm text-white font-mono">{config.keyColor}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            {/* Tolerance */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/60">Tolerance</span>
                <span className="text-xs text-white/40 font-mono">{config.tolerance}%</span>
              </div>
              <Slider
                value={[config.tolerance]}
                onValueChange={([v]) => updateConfig({ tolerance: v })}
                min={0}
                max={100}
                step={1}
                disabled={!config.enabled}
              />
              <p className="text-[10px] text-white/30 mt-1">How much color variation to remove</p>
            </div>

            {/* Softness */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/60">Edge Softness</span>
                <span className="text-xs text-white/40 font-mono">{config.softness}%</span>
              </div>
              <Slider
                value={[config.softness]}
                onValueChange={([v]) => updateConfig({ softness: v })}
                min={0}
                max={100}
                step={1}
                disabled={!config.enabled}
              />
              <p className="text-[10px] text-white/30 mt-1">Feather the edges</p>
            </div>

            {/* Spill Suppression */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/60">Spill Suppression</span>
                <span className="text-xs text-white/40 font-mono">{config.spillSuppression}%</span>
              </div>
              <Slider
                value={[config.spillSuppression]}
                onValueChange={([v]) => updateConfig({ spillSuppression: v })}
                min={0}
                max={100}
                step={1}
                disabled={!config.enabled}
              />
              <p className="text-[10px] text-white/30 mt-1">Remove color reflection on subject</p>
            </div>

            {/* Denoise */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/60">Denoise Alpha</span>
                <span className="text-xs text-white/40 font-mono">{config.denoiseAlpha}%</span>
              </div>
              <Slider
                value={[config.denoiseAlpha]}
                onValueChange={([v]) => updateConfig({ denoiseAlpha: v })}
                min={0}
                max={100}
                step={1}
                disabled={!config.enabled}
              />
              <p className="text-[10px] text-white/30 mt-1">Clean up noisy edges</p>
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => onConfigChange(DEFAULT_CHROMA_CONFIG)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>

          {/* Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            config.enabled ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'
          }`}>
            {config.enabled ? (
              <>
                <Eye className="w-4 h-4" />
                <span className="text-xs">Chroma key active</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="text-xs">Chroma key disabled</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
