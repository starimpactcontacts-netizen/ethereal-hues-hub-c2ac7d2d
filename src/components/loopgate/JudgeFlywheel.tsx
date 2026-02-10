import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, RotateCcw, 
  Maximize2, Minimize2, Zap, Crown, Minus, Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { LoopedX } from '@/components/loopgate/LoopedX';
import FlywheelVideoExport from '@/components/loopgate/FlywheelVideoExport';
import { useAuth } from '@/hooks/useAuth';

interface FlywheelEditor {
  id: string;
  username: string;
  avatar_url: string | null;
  platform?: string;
}

interface JudgeFlywheelProps {
  isOpen: boolean;
  onClose: () => void;
  editors: FlywheelEditor[];
  onSelect: (editor: FlywheelEditor) => void;
}

// Helper to generate accent palette from a hue value (0-360)
function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function makeAccentPalette(hue: number) {
  return {
    accent: hslToHex(hue, 0.65, 0.53),
    accentDim: hslToHex(hue, 0.70, 0.36),
    accentBright: hslToHex(hue, 0.55, 0.75),
    segGold: hslToHex(hue, 0.65, 0.53),
    segGoldDim: hslToHex(hue, 0.70, 0.36),
  };
}

const SEG_DARK = '#0c0c0c';
const SEG_DARKER = '#060606';

// ── Web Audio synth (zero latency) ─────────────────────────────────
class FlywheelAudio {
  private ctx: AudioContext | null = null;
  private tickCount = 0;

  private getCtx() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  tick(speed: number) {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    this.tickCount++;

    const baseFreq = this.tickCount % 2 === 0 ? 3200 : 2800;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.value = baseFreq;
    filter.type = 'bandpass';
    filter.frequency.value = 4000;
    filter.Q.value = 2;

    const vol = Math.min(0.12, 0.03 + speed * 0.1);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  whoosh() {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    const dur = 0.6;

    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + dur);
    filter.Q.value = 1;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);
    source.stop(now + dur);
  }

  victory() {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.08;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.8);
    });
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1568;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    }, 300);
  }

  dispose() {
    this.ctx?.close();
    this.ctx = null;
  }
}

// ── Component ──────────────────────────────────────────────────────
export default function JudgeFlywheel({ isOpen, onClose, editors, onSelect }: JudgeFlywheelProps) {
  const { profile } = useAuth();
  const [selectedEditors, setSelectedEditors] = useState<FlywheelEditor[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<FlywheelEditor | null>(null);
  const [phase, setPhase] = useState<'pick' | 'wheel' | 'result'>('pick');
  const [fullscreen, setFullscreen] = useState(false);
  const [hue, setHue] = useState(45); // default gold ~45
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);

  const palette = useMemo(() => makeAccentPalette(hue), [hue]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const lastTickSegment = useRef(-1);
  const audioRef = useRef<FlywheelAudio | null>(null);
  const canvasSizeRef = useRef(0);

  useEffect(() => {
    audioRef.current = new FlywheelAudio();
    return () => { audioRef.current?.dispose(); };
  }, []);

  // ── Canvas drawing ───────────────────────────────────────────────
  const drawWheel = useCallback((angle: number, highlightIndex?: number) => {
    const canvas = canvasRef.current;
    if (!canvas || selectedEditors.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = canvas.clientWidth;

    // Only resize buffer when display size actually changes
    if (canvasSizeRef.current !== displaySize) {
      canvasSizeRef.current = displaySize;
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const center = displaySize / 2;
    const radius = center - 8;
    const segAngle = (2 * Math.PI) / selectedEditors.length;

    ctx.clearRect(0, 0, displaySize, displaySize);

    // Outer ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = palette.accent + '50';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Segments — alternating black/accent
    selectedEditors.forEach((editor, i) => {
      const startA = angle + i * segAngle;
      const endA = startA + segAngle;
      const isColored = i % 2 === 0;
      const isHl = highlightIndex === i;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startA, endA);
      ctx.closePath();

      if (isHl) {
        const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
        grad.addColorStop(0, palette.accentBright);
        grad.addColorStop(0.5, palette.accent);
        grad.addColorStop(1, palette.accentDim);
        ctx.fillStyle = grad;
      } else if (isColored) {
        const midA = startA + segAngle / 2;
        const gx = center + Math.cos(midA) * radius * 0.5;
        const gy = center + Math.sin(midA) * radius * 0.5;
        const grad = ctx.createRadialGradient(gx, gy, 0, center, center, radius);
        grad.addColorStop(0, palette.segGold);
        grad.addColorStop(1, palette.segGoldDim);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = i % 4 === 1 ? SEG_DARK : SEG_DARKER;
      }
      ctx.fill();

      // Separator line
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + Math.cos(startA) * radius, center + Math.sin(startA) * radius);
      ctx.strokeStyle = palette.accent + '1F';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Username text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startA + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = isHl ? '#000' : (isColored ? '#000' : '#fff');
      const fontSize = Math.max(10, Math.min(14, 150 / selectedEditors.length));
      ctx.font = `700 ${fontSize}px "Bebas Neue", system-ui, sans-serif`;
      ctx.letterSpacing = '0.5px';

      const name = `@${editor.username}`;
      const maxLen = selectedEditors.length > 8 ? 8 : 12;
      const display = name.length > maxLen ? name.slice(0, maxLen) + '…' : name;
      ctx.fillText(display, radius - 16, fontSize * 0.35);
      ctx.restore();
    });

    // Center hub
    const hubR = 26;
    const hubGrad = ctx.createRadialGradient(center, center, 0, center, center, hubR);
    hubGrad.addColorStop(0, '#1a1a1a');
    hubGrad.addColorStop(1, '#000');
    ctx.beginPath();
    ctx.arc(center, center, hubR, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hub text
    ctx.fillStyle = palette.accent;
    ctx.font = '700 10px "Bebas Neue", system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('LOOP', center, center);
    ctx.font = '700 8px "Bebas Neue", system-ui';
    ctx.fillText('GATE', center, center + 10);

    // Pointer (top)
    const ptrW = 11, ptrH = 20;
    ctx.beginPath();
    ctx.moveTo(center - ptrW, 0);
    ctx.lineTo(center + ptrW, 0);
    ctx.lineTo(center, ptrH);
    ctx.closePath();
    const ptrGrad = ctx.createLinearGradient(center, 0, center, ptrH);
    ptrGrad.addColorStop(0, palette.accentBright);
    ptrGrad.addColorStop(1, palette.accent);
    ctx.fillStyle = ptrGrad;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [selectedEditors, palette]);

  // ── Spin ─────────────────────────────────────────────────────────
  const spin = useCallback(() => {
    if (spinning || selectedEditors.length < 2) return;

    setSpinning(true);
    setWinner(null);
    lastTickSegment.current = -1;
    audioRef.current?.whoosh();

    const segAngle = (2 * Math.PI) / selectedEditors.length;
    const totalRot = Math.PI * 2 * (10 + Math.random() * 8);
    const startRot = rotationRef.current;
    const targetRot = startRot + totalRot;
    const duration = 6000 + Math.random() * 2000;
    const startTime = performance.now();

    const ease = (t: number) => 1 - Math.pow(1 - t, 5);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = ease(progress);
      const currentAngle = startRot + (targetRot - startRot) * eased;
      const speed = 1 - progress;

      const norm = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const seg = Math.floor(norm / segAngle) % selectedEditors.length;
      if (seg !== lastTickSegment.current) {
        lastTickSegment.current = seg;
        audioRef.current?.tick(speed);
      }

      rotationRef.current = currentAngle;
      drawWheel(currentAngle);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Pointer is at the top of the canvas = -π/2 radians
        const pointerAngle = -Math.PI / 2;
        const relativeAngle = ((pointerAngle - currentAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const winIdx = Math.floor(relativeAngle / segAngle) % selectedEditors.length;

        setWinner(selectedEditors[winIdx]);
        setSpinning(false);
        drawWheel(currentAngle, winIdx);
        audioRef.current?.victory();
        setTimeout(() => setPhase('result'), 600);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, selectedEditors, drawWheel]);

  // Init canvas
  useEffect(() => {
    if (phase === 'wheel') {
      canvasSizeRef.current = 0; // force re-init
      requestAnimationFrame(() => drawWheel(rotationRef.current));
    }
  }, [phase, drawWheel]);

  // Redraw when hue changes
  useEffect(() => {
    if (phase === 'wheel' && !spinning) {
      requestAnimationFrame(() => drawWheel(rotationRef.current));
    }
  }, [hue, phase, spinning, drawWheel]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────
  const toggleEditor = (editor: FlywheelEditor) => {
    setSelectedEditors(prev => {
      const exists = prev.find(e => e.id === editor.id);
      if (exists) return prev.filter(e => e.id !== editor.id);
      if (prev.length >= 200) return prev;
      return [...prev, editor];
    });
  };

  const selectAll = () => setSelectedEditors(editors.slice(0, 200));

  const reset = () => {
    setWinner(null);
    setPhase('wheel');
    rotationRef.current = 0;
    canvasSizeRef.current = 0;
    requestAnimationFrame(() => drawWheel(0));
  };

  const handleRate = () => {
    if (winner) { onSelect(winner); onClose(); }
  };

  const toggleFullscreen = () => {
    if (!fullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (!isOpen) return null;

  const wheelSize = Math.min(340, window.innerWidth - 48);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 relative z-10">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/12 transition-colors">
            <LoopedX className="w-4 h-4 text-white/70" />
          </button>
          
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold" />
            <span className="font-display text-sm font-bold text-white tracking-[0.2em]">FLYWHEEL</span>
          </div>

          <button onClick={toggleFullscreen} className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/12 transition-colors">
            {fullscreen ? <Minimize2 className="w-4 h-4 text-white/70" /> : <Maximize2 className="w-4 h-4 text-white/70" />}
          </button>
        </div>

        {/* ── PICK PHASE ──────────────────────────────────────── */}
        {phase === 'pick' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 overflow-auto px-4 pb-24"
          >
            <div className="text-center mb-5">
              <h2 className="font-display text-xl font-bold text-white mb-1 tracking-wide">Pick Your Lineup</h2>
              <p className="text-xs text-white/40">Select 2-200 editors for the flywheel</p>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 font-display tracking-wide">{selectedEditors.length}/200</span>
              <button onClick={selectAll} className="text-xs font-display font-bold tracking-wider px-3 py-1.5 rounded-lg bg-white/8 text-white/60 hover:text-white hover:bg-white/12 transition-colors">
                SELECT ALL
              </button>
            </div>

            {editors.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white/40 text-sm font-display">No editors in inbox</p>
                <p className="text-white/25 text-xs mt-1">Review requests will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {editors.map(editor => {
                  const selected = selectedEditors.some(e => e.id === editor.id);
                  return (
                    <button
                      key={editor.id}
                      onClick={() => toggleEditor(editor)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                        selected 
                          ? 'border-gold/50 bg-gold/8' 
                          : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06]'
                      }`}
                    >
                      {editor.avatar_url ? (
                        <img src={editor.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{editor.username[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-medium text-white truncate">@{editor.username}</p>
                        {editor.platform && (
                          <p className="text-[9px] text-white/30 uppercase tracking-wider">{editor.platform}</p>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selected ? 'border-gold bg-gold' : 'border-white/15'
                        }`}
                      >
                        {selected && <span className="text-black text-[10px] font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
              <Button
                onClick={() => setPhase('wheel')}
                disabled={selectedEditors.length < 2}
                className="w-full h-12 rounded-xl font-display text-sm font-bold tracking-[0.15em] text-black bg-gold hover:bg-gold/90 disabled:opacity-30"
              >
                <Zap className="w-4 h-4 mr-2" />
                LOAD FLYWHEEL ({selectedEditors.length})
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── WHEEL PHASE ─────────────────────────────────────── */}
        {phase === 'wheel' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center gap-8 px-4"
          >
            {/* Wheel + Color adjuster */}
            <div className="flex items-center gap-4">
              {/* Color adjuster (left side) */}
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white/20"
                      style={{ background: palette.accent }}
                    />
                    <div className="h-[200px] flex items-center">
                      <Slider
                        orientation="vertical"
                        min={0}
                        max={360}
                        step={1}
                        value={[hue]}
                        onValueChange={(v) => {
                          setHue(v[0]);
                          requestAnimationFrame(() => drawWheel(rotationRef.current));
                        }}
                        className="h-full [&_[data-orientation=vertical]]:w-3"
                      />
                    </div>
                    <span className="text-[8px] text-white/30 font-display tracking-widest">HUE</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wheel */}
              <div 
                className="relative"
                style={{ filter: `drop-shadow(0 0 60px ${palette.accent}26)` }}
              >
                <canvas
                  ref={canvasRef}
                  className="rounded-full"
                  style={{ width: wheelSize, height: wheelSize }}
                />
                <div
                  className="absolute inset-[-5px] rounded-full pointer-events-none"
                  style={{ border: `1px solid ${palette.accent}26` }}
                />
              </div>

              {/* Color toggle button (right side) */}
              <button
                onClick={() => setShowColorPicker(p => !p)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  showColorPicker ? 'bg-white/12' : 'bg-white/6 hover:bg-white/10'
                }`}
                title="Adjust color"
              >
                <Palette className="w-4 h-4 text-white/50" />
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setPhase('pick')}
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-white hover:bg-white/8 text-xs font-display tracking-wider border border-white/10"
              >
                <Minus className="w-3 h-3 mr-1.5" />
                Edit
              </Button>
              
              <Button
                onClick={spin}
                disabled={spinning}
                className="px-10 h-12 rounded-xl font-display text-sm font-bold tracking-[0.2em] text-black bg-gold hover:bg-gold/90 disabled:opacity-50 relative overflow-hidden"
              >
                {spinning ? (
                  <span className="flex items-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="mr-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.div>
                    SPINNING...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    SPIN
                  </span>
                )}
              </Button>

              <Button
                onClick={reset}
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-white hover:bg-white/8 text-xs font-display tracking-wider border border-white/10"
                disabled={spinning}
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                Reset
              </Button>
            </div>

            {/* Video Export */}
            <div className="flex items-center gap-2">
              <FlywheelVideoExport
                isRecording={isVideoRecording}
                onStartRecording={() => setIsVideoRecording(true)}
                onStopRecording={() => setIsVideoRecording(false)}
                sourceCanvas={canvasRef.current}
                judgeUsername={profile?.username || 'judge'}
                winnerUsername={winner?.username || null}
                accentColor={palette.accent}
              />
            </div>

            <p className="text-[10px] text-white/25 text-center font-display tracking-wider">
              {selectedEditors.length} editors · Tap SPIN to roll{isVideoRecording ? ' · 🔴 Recording' : ''}
            </p>
          </motion.div>
        )}

        {/* ── RESULT PHASE ────────────────────────────────────── */}
        {phase === 'result' && winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 14, delay: 0.15 }}
              className="relative"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-[-28px] rounded-full"
                style={{ boxShadow: `0 0 80px ${palette.accent}59, 0 0 140px ${palette.accent}1F` }}
              />
              
              {winner.avatar_url ? (
                <img 
                  src={winner.avatar_url} alt=""
                  className="w-28 h-28 rounded-full object-cover border-[3px]"
                  style={{ borderColor: palette.accent }}
                />
              ) : (
                <div 
                  className="w-28 h-28 rounded-full flex items-center justify-center border-[3px]"
                  style={{ borderColor: palette.accent, background: palette.accent + '1A' }}
                >
                  <span className="text-3xl font-bold text-white">{winner.username[0]?.toUpperCase()}</span>
                </div>
              )}
              
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: 'spring', damping: 12 }}
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: palette.accent }}
              >
                <Crown className="w-5 h-5 text-black" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-center"
            >
              <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-display mb-2">The Flywheel Chose</p>
              <h2 className="font-display text-3xl font-bold text-white tracking-wide">@{winner.username}</h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="flex gap-3 mt-4"
            >
              <Button 
                onClick={reset} 
                variant="ghost" 
                className="text-white/50 hover:text-white hover:bg-white/8 border border-white/10 font-display tracking-wider"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Spin Again
              </Button>
              <Button
                onClick={handleRate}
                className="font-display font-bold tracking-[0.15em] text-black"
                style={{ background: palette.accent }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                RATE NOW
              </Button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
