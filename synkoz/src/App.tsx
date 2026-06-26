import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Play, Pause, RotateCcw } from "lucide-react";
import TrackSlot from "./components/TrackSlot";
import {
  SynkozEngine,
  type SynkozTrack,
  decodeTrack,
  computeTrackStarts,
  totalMixDuration,
} from "./lib/audioEngine";
import "./App.css";

const COLORS = ["#22d3ee", "#f472b6", "#a3e635"];
const MAX_TRACKS = 3;

function App() {
  const [tracks, setTracks] = useState<(SynkozTrack | null)[]>([null, null]);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<SynkozEngine | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      engineRef.current = new SynkozEngine(ctxRef.current);
    }
    return ctxRef.current;
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      ctxRef.current?.close();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const activeTracks = tracks.filter((t): t is SynkozTrack => !!t);
  const duration = totalMixDuration(activeTracks);
  const starts = computeTrackStarts(activeTracks);

  const handleUpload = async (slot: number, file: File) => {
    setLoadingSlot(slot);
    try {
      const ctx = getCtx();
      const track = await decodeTrack(ctx, file, `${slot}-${Date.now()}`);
      setTracks((prev) => {
        const next = [...prev];
        next[slot] = track;
        return next;
      });
    } catch (err) {
      console.error("Failed to decode audio", err);
    } finally {
      setLoadingSlot(null);
    }
  };

  const stopPlayback = () => {
    engineRef.current?.stop();
    setIsPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const handleRemove = (slot: number) => {
    stopPlayback();
    setTracks((prev) => {
      const next = [...prev];
      next[slot] = null;
      return next;
    });
  };

  const handleFadeChange = (slot: number, seconds: number) => {
    setTracks((prev) => {
      const next = [...prev];
      const t = next[slot];
      if (t) next[slot] = { ...t, fadeDuration: seconds };
      return next;
    });
  };

  const addSlot = () => setTracks((prev) => [...prev, null]);

  const tick = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const e = engine.getElapsed();
    setElapsed(e);
    if (e >= duration) {
      stopPlayback();
      setElapsed(0);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [duration]);

  const togglePlay = () => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const engine = engineRef.current;
    if (!engine) return;

    if (isPlaying) {
      engine.pause();
      setIsPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else {
      const fromSeconds = elapsed >= duration ? 0 : elapsed;
      engine.play(activeTracks, fromSeconds);
      setIsPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  const restart = () => {
    stopPlayback();
    setElapsed(0);
  };

  const canPlay = activeTracks.length >= 2;

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <h1>Synkoz</h1>
          <p className="muted">Upload 2-3 songs and blend them together with smooth crossfades.</p>
        </header>

        <div className="tracks">
          {tracks.map((track, i) => (
            <TrackSlot
              key={i}
              index={i}
              track={track}
              color={COLORS[i % COLORS.length]}
              loading={loadingSlot === i}
              isLast={i === tracks.length - 1}
              progress={
                track
                  ? Math.min(1, Math.max(0, (elapsed - starts[i]) / track.buffer.duration))
                  : 0
              }
              onUpload={(file) => handleUpload(i, file)}
              onRemove={() => handleRemove(i)}
              onFadeChange={(s) => handleFadeChange(i, s)}
            />
          ))}

          {tracks.length < MAX_TRACKS && (
            <button className="add-track-btn" onClick={addSlot}>
              <Plus size={16} />
              Add a third song
            </button>
          )}
        </div>

        <div className="transport">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${duration ? (elapsed / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="transport-controls">
            <button className="icon-btn" onClick={restart} disabled={!canPlay}>
              <RotateCcw size={18} />
            </button>
            <button className="play-btn" onClick={togglePlay} disabled={!canPlay}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <span style={{ width: 36 }} />
          </div>
          {!canPlay && <p className="muted center-text">Upload at least 2 songs to mix</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
