/**
 * Loopgate Studio — Timeline Markers Panel
 * Add, edit, and manage timeline markers for precise editing
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Flag, Plus, Trash2, Edit2, Check, X, Clock,
  ChevronDown, Zap, Music, Circle
} from "lucide-react";
import { MARKER_COLORS, type TimelineMarker } from "@/lib/studioTimeline";

interface TimelineMarkersPanelProps {
  markers: TimelineMarker[];
  onAddMarker: (marker: Omit<TimelineMarker, 'id'>) => void;
  onUpdateMarker: (id: string, updates: Partial<TimelineMarker>) => void;
  onDeleteMarker: (id: string) => void;
  onJumpToMarker: (time: number) => void;
  currentTime: number;
  duration: number;
}

export default function TimelineMarkersPanel({
  markers,
  onAddMarker,
  onUpdateMarker,
  onDeleteMarker,
  onJumpToMarker,
  currentTime,
  duration,
}: TimelineMarkersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(MARKER_COLORS[0].color);
  const [selectedType, setSelectedType] = useState<TimelineMarker['type']>('custom');

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleAddMarker = () => {
    onAddMarker({
      time: currentTime,
      label: `Marker ${markers.length + 1}`,
      color: selectedColor,
      type: selectedType,
    });
  };

  const handleStartEdit = (marker: TimelineMarker) => {
    setEditingId(marker.id);
    setEditLabel(marker.label);
  };

  const handleSaveEdit = () => {
    if (editingId && editLabel.trim()) {
      onUpdateMarker(editingId, { label: editLabel.trim() });
    }
    setEditingId(null);
    setEditLabel('');
  };

  const sortedMarkers = [...markers].sort((a, b) => a.time - b.time);

  const markerTypeIcons = {
    beat: Music,
    scene: Flag,
    custom: Circle,
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium text-white">Markers</span>
          <span className="text-xs text-white/40">({markers.length})</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="space-y-3"
        >
          {/* Add Marker Controls */}
          <div className="bg-white/5 rounded-lg p-3 space-y-3">
            {/* Type Selection */}
            <div className="flex gap-1.5">
              {(['custom', 'beat', 'scene'] as const).map((type) => {
                const Icon = markerTypeIcons[type];
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedType === type
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                );
              })}
            </div>

            {/* Color Selection */}
            <div className="flex gap-1.5">
              {MARKER_COLORS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedColor(preset.color)}
                  className={`w-6 h-6 rounded-md transition-all ${
                    selectedColor === preset.color
                      ? 'ring-2 ring-white ring-offset-1 ring-offset-black scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.label}
                />
              ))}
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddMarker}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Marker at {formatTime(currentTime)}
            </button>
          </div>

          {/* Markers List */}
          <div className="space-y-1">
            {sortedMarkers.length === 0 ? (
              <div className="text-center py-4 text-xs text-white/30">
                No markers yet. Add one to mark important moments.
              </div>
            ) : (
              sortedMarkers.map((marker) => {
                const Icon = markerTypeIcons[marker.type];
                const isEditing = editingId === marker.id;

                return (
                  <motion.div
                    key={marker.id}
                    layout
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 group"
                  >
                    {/* Color indicator */}
                    <div
                      className="w-1.5 h-8 rounded-full"
                      style={{ backgroundColor: marker.color }}
                    />

                    {/* Type icon */}
                    <Icon className="w-3.5 h-3.5 text-white/40" />

                    {/* Time - clickable */}
                    <button
                      onClick={() => onJumpToMarker(marker.time)}
                      className="text-xs font-mono text-white/60 hover:text-white w-16 text-left"
                    >
                      {formatTime(marker.time)}
                    </button>

                    {/* Label */}
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="flex-1 bg-white/10 px-2 py-1 rounded text-xs text-white outline-none"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        />
                        <button onClick={handleSaveEdit} className="p-1 text-green-400 hover:text-green-300">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-white/40 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-xs text-white truncate">
                          {marker.label}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Color picker */}
                          <div className="relative">
                            <input
                              type="color"
                              value={marker.color}
                              onChange={(e) => onUpdateMarker(marker.id, { color: e.target.value })}
                              className="w-5 h-5 rounded cursor-pointer opacity-0 absolute inset-0"
                            />
                            <div
                              className="w-5 h-5 rounded border border-white/20"
                              style={{ backgroundColor: marker.color }}
                            />
                          </div>
                          <button
                            onClick={() => handleStartEdit(marker)}
                            className="p-1 text-white/40 hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteMarker(marker.id)}
                            className="p-1 text-red-400/60 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Quick Actions */}
          {markers.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const prev = sortedMarkers.filter(m => m.time < currentTime).pop();
                  if (prev) onJumpToMarker(prev.time);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5"
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  const next = sortedMarkers.find(m => m.time > currentTime);
                  if (next) onJumpToMarker(next.time);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5"
              >
                Next →
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
