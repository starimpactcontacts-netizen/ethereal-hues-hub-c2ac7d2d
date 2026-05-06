import { useEffect, useRef, useState, useCallback } from "react";
import { Gamepad2, Zap } from "lucide-react";

/**
 * OsuMania-style 4K rhythm mini-game for the lobby.
 * Lanes: A S | G H  (desktop) — tap zones on mobile.
 * Synthesized beat track via Web Audio (no external deps, no CORS).
 */

const LANE_KEYS = ["a", "s", "g", "h"] as const;
const LANE_LABELS = ["A", "S", "G", "H"] as const;
const LANE_COLORS = [
  "hsl(0 85% 60%)",     // red
  "hsl(45 95% 55%)",    // yellow
  "hsl(150 75% 50%)",   // green
  "hsl(210 90% 60%)",   // blue
];

const BPM = 140;
const BEAT_MS = 60_000 / BPM;            // ~428ms
const NOTE_TRAVEL_MS = 1500;             // time from spawn to hit line
const HIT_WINDOW_PERFECT = 90;
const HIT_WINDOW_GOOD = 160;

type Note = { id: number; lane: number; spawnAt: number; hitAt: number; hit?: "perfect" | "good" | "miss" };

// Hard-coded chart: lane indexes per beat (looped)
const CHART: number[][] = [
  [0], [2], [1], [3],
  [0, 3], [], [1, 2], [],
  [0], [1], [2], [3],
  [0, 2], [], [1, 3], [],
  [3], [2], [1], [0],
  [0, 3], [1, 2], [0, 3], [1, 2],
  [0], [1], [2], [3],
  [0, 1, 2, 3], [], [0, 1, 2, 3], [],
];

export default function OsuManiaMiniGame() {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [judgement, setJudgement] = useState<{ text: string; color: string; key: number } | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [pressed, setPressed] = useState<boolean[]>([false, false, false, false]);

  const startTimeRef = useRef<number>(0);
  const noteIdRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSpawnedBeatRef = useRef(-1);
  const rafRef = useRef<number | null>(null);
  const notesRef = useRef<Note[]>([]);
  notesRef.current = notes;

  // ── synth beat / hit sounds ──────────────────────────────────────
  const ensureCtx = () => {
    if (!audioCtxRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current!;
  };

  const playKick = (when: number) => {
    const ctx = ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(120, when);
    osc.frequency.exponentialRampToValueAtTime(40, when + 0.18);
    gain.gain.setValueAtTime(0.45, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(when); osc.stop(when + 0.25);
  };

  const playHat = (when: number) => {
    const ctx = ensureCtx();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 7000;
    src.buffer = buf;
    gain.gain.setValueAtTime(0.18, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
    src.connect(hp).connect(gain).connect(ctx.destination);
    src.start(when);
  };

  const playSynth = (when: number, freq: number) => {
    const ctx = ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.06, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(when); osc.stop(when + 0.2);
  };

  const playHitFx = (perfect: boolean) => {
    const ctx = ensureCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = perfect ? 880 : 600;
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.1);
  };

  // ── game loop ────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    const ctx = audioCtxRef.current;

    const currentBeat = Math.floor(elapsed / BEAT_MS);

    // Spawn notes & schedule audio for upcoming beats
    while (lastSpawnedBeatRef.current < currentBeat + Math.ceil(NOTE_TRAVEL_MS / BEAT_MS) + 1) {
      lastSpawnedBeatRef.current += 1;
      const beat = lastSpawnedBeatRef.current;
      const beatTimeMs = beat * BEAT_MS;
      const lanes = CHART[beat % CHART.length];

      // schedule audio for that beat
      if (ctx) {
        const audioWhen = ctx.currentTime + (beatTimeMs - elapsed) / 1000;
        if (audioWhen > ctx.currentTime) {
          // kick on every beat, hat off-beat, melody on note beats
          playKick(audioWhen);
          playHat(audioWhen + BEAT_MS / 2000);
          if (lanes.length) {
            const freqs = [220, 277, 330, 415];
            lanes.forEach((l) => playSynth(audioWhen, freqs[l]));
          }
        }
      }

      // spawn visual notes
      if (lanes.length) {
        const newNotes: Note[] = lanes.map((lane) => ({
          id: noteIdRef.current++,
          lane,
          spawnAt: beatTimeMs - NOTE_TRAVEL_MS,
          hitAt: beatTimeMs,
        }));
        setNotes((prev) => [...prev, ...newNotes]);
      }
    }

    // Mark missed notes
    setNotes((prev) => {
      let comboBroken = false;
      const next = prev.filter((n) => {
        if (n.hit) return elapsed - n.hitAt < 200;
        if (elapsed - n.hitAt > HIT_WINDOW_GOOD) {
          comboBroken = true;
          return false;
        }
        return true;
      });
      if (comboBroken) {
        setCombo(0);
        setJudgement({ text: "MISS", color: "hsl(0 85% 60%)", key: Date.now() });
      }
      return next;
    });

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── input ────────────────────────────────────────────────────────
  const hitLane = useCallback((lane: number) => {
    if (!running) return;
    const elapsed = performance.now() - startTimeRef.current;

    // find closest unhit note in this lane
    let target: Note | null = null;
    let bestDelta = Infinity;
    for (const n of notesRef.current) {
      if (n.lane !== lane || n.hit) continue;
      const delta = Math.abs(elapsed - n.hitAt);
      if (delta < bestDelta) { bestDelta = delta; target = n; }
    }

    if (target && bestDelta <= HIT_WINDOW_GOOD) {
      const perfect = bestDelta <= HIT_WINDOW_PERFECT;
      const points = perfect ? 300 : 100;
      target.hit = perfect ? "perfect" : "good";
      setNotes((prev) => prev.map((n) => (n.id === target!.id ? { ...n, hit: target!.hit } : n)));
      setScore((s) => s + points);
      setCombo((c) => {
        const nc = c + 1;
        setMaxCombo((m) => Math.max(m, nc));
        return nc;
      });
      setJudgement({
        text: perfect ? "PERFECT" : "GOOD",
        color: perfect ? "hsl(45 95% 55%)" : "hsl(150 75% 50%)",
        key: Date.now() + lane,
      });
      playHitFx(perfect);
    }
  }, [running]);

  // keyboard
  useEffect(() => {
    if (!running) return;
    const down = (e: KeyboardEvent) => {
      const idx = LANE_KEYS.indexOf(e.key.toLowerCase() as typeof LANE_KEYS[number]);
      if (idx === -1) return;
      e.preventDefault();
      setPressed((p) => { const np = [...p]; np[idx] = true; return np; });
      hitLane(idx);
    };
    const up = (e: KeyboardEvent) => {
      const idx = LANE_KEYS.indexOf(e.key.toLowerCase() as typeof LANE_KEYS[number]);
      if (idx === -1) return;
      setPressed((p) => { const np = [...p]; np[idx] = false; return np; });
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [running, hitLane]);

  // start/stop loop
  useEffect(() => {
    if (running) {
      startTimeRef.current = performance.now();
      lastSpawnedBeatRef.current = -1;
      noteIdRef.current = 0;
      setNotes([]); setScore(0); setCombo(0); setMaxCombo(0);
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [running, tick]);

  // cleanup audio on unmount
  useEffect(() => () => {
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  const handleStart = () => {
    ensureCtx().resume().catch(() => {});
    setRunning(true);
  };
  const handleStop = () => setRunning(false);

  const elapsed = running ? performance.now() - startTimeRef.current : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-surface-1/70 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-purple-600/20 border border-fuchsia-500/40 grid place-items-center">
            <Gamepad2 className="w-4 h-4 text-fuchsia-300" />
          </div>
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-foreground" style={{ fontFamily: "Teko, sans-serif" }}>
              Loop Mania
            </p>
            <p className="text-[9px] text-muted-foreground/70 uppercase tracking-wider">Kill time while you wait</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-amber-300">
          <Zap className="w-3 h-3" /> 140 BPM
        </div>
      </div>

      {/* Score row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg border border-border/60 bg-background/60 py-1.5 text-center">
          <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">Score</p>
          <p className="text-[18px] leading-none font-black tabular-nums text-foreground" style={{ fontFamily: "Teko, sans-serif" }}>{score}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/60 py-1.5 text-center">
          <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">Combo</p>
          <p className="text-[18px] leading-none font-black tabular-nums text-amber-300" style={{ fontFamily: "Teko, sans-serif" }}>{combo}x</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/60 py-1.5 text-center">
          <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">Best</p>
          <p className="text-[18px] leading-none font-black tabular-nums text-emerald-300" style={{ fontFamily: "Teko, sans-serif" }}>{maxCombo}x</p>
        </div>
      </div>

      {/* Playfield */}
      <div className="relative h-[300px] rounded-xl border border-border/60 bg-black overflow-hidden select-none">
        {/* lanes */}
        <div className="absolute inset-0 grid grid-cols-4">
          {LANE_KEYS.map((k, i) => (
            <div
              key={k}
              onTouchStart={(e) => { e.preventDefault(); setPressed((p)=>{const np=[...p];np[i]=true;return np;}); hitLane(i); }}
              onTouchEnd={(e) => { e.preventDefault(); setPressed((p)=>{const np=[...p];np[i]=false;return np;}); }}
              onMouseDown={() => { setPressed((p)=>{const np=[...p];np[i]=true;return np;}); hitLane(i); }}
              onMouseUp={() => setPressed((p)=>{const np=[...p];np[i]=false;return np;})}
              onMouseLeave={() => setPressed((p)=>{const np=[...p];np[i]=false;return np;})}
              className="relative border-r border-white/5 last:border-r-0 cursor-pointer"
              style={{ background: pressed[i] ? `${LANE_COLORS[i].replace(")", " / 0.18)")}` : "transparent" }}
            />
          ))}
        </div>

        {/* notes */}
        {running && notes.map((n) => {
          const progress = (elapsed - n.spawnAt) / NOTE_TRAVEL_MS; // 0 → 1 reaches hit line
          if (progress < 0 || progress > 1.15) return null;
          const top = `${Math.min(progress, 1) * 88}%`;
          const isHit = !!n.hit && n.hit !== "miss";
          return (
            <div
              key={n.id}
              className="absolute"
              style={{
                left: `${n.lane * 25 + 2}%`,
                width: "21%",
                top,
                height: "16px",
                background: isHit
                  ? `linear-gradient(180deg, ${LANE_COLORS[n.lane]}, transparent)`
                  : `linear-gradient(180deg, ${LANE_COLORS[n.lane]}, ${LANE_COLORS[n.lane].replace(")", " / 0.7)")} )`,
                borderRadius: "4px",
                opacity: isHit ? 0.3 : 1,
                boxShadow: `0 0 12px ${LANE_COLORS[n.lane].replace(")", " / 0.6)")}`,
                transform: isHit ? "scale(1.3)" : "scale(1)",
                transition: isHit ? "transform 0.15s, opacity 0.15s" : "none",
              }}
            />
          );
        })}

        {/* hit line */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: "88%",
            height: "3px",
            background: "linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.8), transparent)",
            boxShadow: "0 0 14px hsl(var(--foreground) / 0.6)",
          }}
        />

        {/* lane keys at bottom */}
        <div className="absolute left-0 right-0 bottom-0 grid grid-cols-4 pointer-events-none">
          {LANE_LABELS.map((label, i) => (
            <div key={label} className="h-[10%] flex items-center justify-center border-r border-white/5 last:border-r-0">
              <span
                className="text-[14px] font-black tabular-nums"
                style={{ fontFamily: "Teko, sans-serif", color: pressed[i] ? LANE_COLORS[i] : "hsl(var(--muted-foreground))" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* judgement popup */}
        {judgement && (
          <div
            key={judgement.key}
            className="absolute left-1/2 top-[55%] -translate-x-1/2 pointer-events-none animate-[fadeUp_0.5s_ease-out_forwards] text-[22px] font-black tracking-wider"
            style={{ color: judgement.color, fontFamily: "Teko, sans-serif", textShadow: `0 0 12px ${judgement.color}` }}
          >
            {judgement.text}
          </div>
        )}

        {/* start overlay */}
        {!running && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur-sm">
            <button
              onClick={handleStart}
              className="px-6 h-12 rounded-xl bg-foreground text-background font-black uppercase tracking-[0.18em] text-[13px] active:scale-95 transition-transform"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              ▶ Start Loop Mania
            </button>
          </div>
        )}
      </div>

      {/* footer hint + stop */}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
          <span className="hidden md:inline">Keys: A · S · G · H</span>
          <span className="md:hidden">Tap the lanes to hit notes</span>
        </p>
        {running && (
          <button onClick={handleStop} className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
            Stop
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translate(-50%, 10px) scale(0.8); }
          30% { opacity: 1; transform: translate(-50%, 0) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -20px) scale(1); }
        }
      `}</style>
    </div>
  );
}
