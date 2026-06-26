import { Music, Upload, X } from "lucide-react";
import Waveform from "./Waveform";
import type { SynkozTrack } from "../lib/audioEngine";

interface TrackSlotProps {
  index: number;
  track: SynkozTrack | null;
  color: string;
  loading: boolean;
  progress: number;
  isLast: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onFadeChange: (seconds: number) => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function TrackSlot({
  index,
  track,
  color,
  loading,
  progress,
  isLast,
  onUpload,
  onRemove,
  onFadeChange,
}: TrackSlotProps) {
  return (
    <div className="track-slot" style={track ? { borderColor: color } : undefined}>
      <div className="track-slot-header">
        <span className="track-slot-label">Track {index + 1}</span>
        {track && (
          <button className="icon-btn" onClick={onRemove} aria-label="Remove track">
            <X size={16} />
          </button>
        )}
      </div>

      {!track ? (
        <label className="upload-zone">
          {loading ? (
            <span className="muted">Decoding audio…</span>
          ) : (
            <>
              <Upload size={20} />
              <span className="muted">Upload a song</span>
            </>
          )}
          <input
            type="file"
            accept="audio/*"
            hidden
            disabled={loading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </label>
      ) : (
        <div className="track-body">
          <div className="track-title-row">
            <Music size={16} color={color} />
            <span className="track-name">{track.name}</span>
            <span className="muted track-duration">{formatTime(track.buffer.duration)}</span>
          </div>
          <Waveform peaks={track.peaks} color={color} progress={progress} />
          {!isLast && (
            <div className="fade-control">
              <div className="fade-control-label">
                <span>Crossfade into next track</span>
                <span>{track.fadeDuration.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={1}
                max={Math.max(2, Math.min(30, track.buffer.duration / 2))}
                step={0.5}
                value={track.fadeDuration}
                onChange={(e) => onFadeChange(parseFloat(e.target.value))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
