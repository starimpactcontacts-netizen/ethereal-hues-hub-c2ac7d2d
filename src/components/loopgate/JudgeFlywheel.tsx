import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, RotateCcw, Palette, 
  Maximize2, Minimize2, Zap, Crown, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoopedX } from '@/components/loopgate/LoopedX';

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

const THEMES = [
  { 
    id: 'obsidian', label: 'Obsidian', accent: '#D4AF37',
    gradient: 'from-zinc-950 via-black to-zinc-950',
    segmentColors: ['#D4AF37', '#111111', '#B8860B', '#0a0a0a', '#FFD700', '#1a1a1a'],
    glow: '0 0 80px rgba(212,175,55,0.25)'
  },
  { 
    id: 'neon', label: 'Neon', accent: '#00FFFF',
    gradient: 'from-purple-950 via-black to-cyan-950',
    segmentColors: ['#00FFFF', '#12002a', '#FF00FF', '#08001a', '#7B2FFF', '#100030'],
    glow: '0 0 80px rgba(0,255,255,0.25)'
  },
  { 
    id: 'inferno', label: 'Inferno', accent: '#FF4500',
    gradient: 'from-red-950 via-black to-orange-950',
    segmentColors: ['#FF4500', '#150400', '#FF6347', '#0a0200', '#FF8C00', '#1a0800'],
    glow: '0 0 80px rgba(255,69,0,0.25)'
  },
  { 
    id: 'arctic', label: 'Arctic', accent: '#60A5FA',
    gradient: 'from-blue-950 via-slate-950 to-indigo-950',
    segmentColors: ['#60A5FA', '#081428', '#3B82F6', '#040c18', '#93C5FD', '#0c1a38'],
    glow: '0 0 80px rgba(96,165,250,0.25)'
  },
  { 
    id: 'matrix', label: 'Matrix', accent: '#22C55E',
    gradient: 'from-green-950 via-black to-emerald-950',
    segmentColors: ['#22C55E', '#001508', '#16A34A', '#000a04', '#4ADE80', '#001e10'],
    glow: '0 0 80px rgba(34,197,94,0.25)'
  },
];

// ── Web Audio synth sounds (zero latency, no network) ──────────────
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

    // Alternating pitch for a mechanical ratchet feel
    const baseFreq = this.tickCount % 2 === 0 ? 3200 : 2800;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.value = baseFreq;
    filter.type = 'bandpass';
    filter.frequency.value = 4000;
    filter.Q.value = 2;

    // Volume scales with speed (louder when fast)
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

    // White noise burst filtered into a whoosh
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

    // Triumphant ascending chord
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
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

    // Shimmer overlay
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1568; // G6
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
  const [selectedEditors, setSelectedEditors] = useState<FlywheelEditor[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<FlywheelEditor | null>(null);
  const [themeIndex, setThemeIndex] = useState(0);
  const [phase, setPhase] = useState<'pick' | 'wheel' | 'result'>('pick');
  const [fullscreen, setFullscreen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const lastTickSegment = useRef(-1);
  const audioRef = useRef<FlywheelAudio | null>(null);

  // Audio lifecycle
  useEffect(() => {
    audioRef.current = new FlywheelAudio();
    return () => { audioRef.current?.dispose(); };
  }, []);

  const theme = THEMES[themeIndex];

  // ── Canvas drawing ───────────────────────────────────────────────
  const drawWheel = useCallback((angle: number, highlightIndex?: number) => {
    const canvas = canvasRef.current;
    if (!canvas || selectedEditors.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = canvas.clientWidth;
    
    // Only resize buffer when display size changes
    if (canvas.width !== displaySize * dpr || canvas.height !== displaySize * dpr) {
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
      ctx.scale(dpr, dpr);
    }

    const center = displaySize / 2;
    const radius = center - 6;
    const segAngle = (2 * Math.PI) / selectedEditors.length;

    ctx.clearRect(0, 0, displaySize, displaySize);

    // Outer ring glow
    ctx.beginPath();
    ctx.arc(center, center, radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = theme.accent + '40';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Segments
    selectedEditors.forEach((editor, i) => {
      const startA = angle + i * segAngle;
      const endA = startA + segAngle;
      const colorIdx = i % theme.segmentColors.length;
      const isHl = highlightIndex === i;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startA, endA);
      ctx.closePath();

      if (isHl) {
        // Highlighted segment gets a radial gradient
        const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
        grad.addColorStop(0, theme.accent + '80');
        grad.addColorStop(1, theme.accent);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = theme.segmentColors[colorIdx];
      }
      ctx.fill();

      // Thin separator
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(
        center + Math.cos(startA) * radius,
        center + Math.sin(startA) * radius
      );
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startA + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = isHl ? '#000' : '#fff';
      const fontSize = Math.max(9, Math.min(13, 140 / selectedEditors.length));
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      
      const name = `@${editor.username}`;
      const maxLen = selectedEditors.length > 8 ? 7 : 11;
      const display = name.length > maxLen ? name.slice(0, maxLen) + '…' : name;
      ctx.fillText(display, radius - 14, fontSize * 0.35);
      ctx.restore();
    });

    // Center hub
    const hubR = 24;
    const hubGrad = ctx.createRadialGradient(center, center, 0, center, center, hubR);
    hubGrad.addColorStop(0, '#1a1a1a');
    hubGrad.addColorStop(1, '#000');
    ctx.beginPath();
    ctx.arc(center, center, hubR, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Hub text
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('LOOP', center, center - 1);
    ctx.font = 'bold 7px system-ui';
    ctx.fillText('GATE', center, center + 9);

    // Pointer triangle (top center)
    const ptrW = 10, ptrH = 18;
    ctx.beginPath();
    ctx.moveTo(center - ptrW, 0);
    ctx.lineTo(center + ptrW, 0);
    ctx.lineTo(center, ptrH);
    ctx.closePath();
    ctx.fillStyle = theme.accent;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [selectedEditors, theme]);

  // ── Spin logic ───────────────────────────────────────────────────
  const spin = useCallback(() => {
    if (spinning || selectedEditors.length < 2) return;

    setSpinning(true);
    setWinner(null);
    lastTickSegment.current = -1;
    audioRef.current?.whoosh();

    const segAngle = (2 * Math.PI) / selectedEditors.length;
    const totalRot = Math.PI * 2 * (10 + Math.random() * 8); // 10-18 rotations
    const startRot = rotationRef.current;
    const targetRot = startRot + totalRot;
    const duration = 6000 + Math.random() * 2000; // 6-8s
    const startTime = performance.now();

    // Custom easing: fast start, very smooth deceleration
    const ease = (t: number) => {
      // Quintic ease-out for ultra-smooth stop
      return 1 - Math.pow(1 - t, 5);
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = ease(progress);
      const currentAngle = startRot + (targetRot - startRot) * eased;
      const speed = 1 - progress; // Approximate speed 0-1

      // Tick on segment boundary cross
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
        // Winner
        const normA = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const ptrA = ((Math.PI * 2) - normA) % (Math.PI * 2);
        const winIdx = Math.floor(ptrA / segAngle) % selectedEditors.length;

        setWinner(selectedEditors[winIdx]);
        setSpinning(false);
        drawWheel(currentAngle, winIdx);
        audioRef.current?.victory();
        setTimeout(() => setPhase('result'), 600);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, selectedEditors, drawWheel]);

  // ── Init canvas on wheel phase ───────────────────────────────────
  useEffect(() => {
    if (phase === 'wheel' && canvasRef.current) {
      // Small delay to let layout settle
      requestAnimationFrame(() => drawWheel(rotationRef.current));
    }
  }, [phase, drawWheel]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────
  const toggleEditor = (editor: FlywheelEditor) => {
    setSelectedEditors(prev => {
      const exists = prev.find(e => e.id === editor.id);
      if (exists) return prev.filter(e => e.id !== editor.id);
      if (prev.length >= 12) return prev;
      return [...prev, editor];
    });
  };

  const selectAll = () => setSelectedEditors(editors.slice(0, 12));

  const reset = () => {
    setWinner(null);
    setPhase('wheel');
    rotationRef.current = 0;
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

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[100] bg-gradient-to-br ${theme.gradient} flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 relative z-10">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <LoopedX className="w-4 h-4 text-white" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4" style={{ color: theme.accent }} />
            <span className="font-display text-sm font-bold text-white tracking-wider">FLYWHEEL</span>
          </div>

          <button onClick={toggleFullscreen} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>

        {/* Theme selector */}
        <div className="flex items-center justify-center gap-2 px-4 pb-3">
          {THEMES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => {
                setThemeIndex(i);
                if (phase === 'wheel') requestAnimationFrame(() => drawWheel(rotationRef.current));
              }}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                i === themeIndex ? 'scale-110 border-white ring-2 ring-white/20' : 'border-white/20 hover:border-white/40'
              }`}
              style={{ background: t.accent }}
            />
          ))}
        </div>

        {/* ── PICK PHASE ──────────────────────────────────────────── */}
        {phase === 'pick' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 overflow-auto px-4 pb-24"
          >
            <div className="text-center mb-4">
              <h2 className="font-display text-xl font-bold text-white mb-1">Pick Your Lineup</h2>
              <p className="text-xs text-white/50">Select 2-12 editors for the flywheel</p>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40">{selectedEditors.length}/12 selected</span>
              <button onClick={selectAll} className="text-xs font-medium px-2 py-1 rounded-md bg-white/10 text-white/70 hover:text-white transition-colors">
                Select All
              </button>
            </div>

            {editors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/50 text-sm">No editors in inbox</p>
                <p className="text-white/30 text-xs mt-1">Review requests will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {editors.map(editor => {
                  const selected = selectedEditors.some(e => e.id === editor.id);
                  return (
                    <button
                      key={editor.id}
                      onClick={() => toggleEditor(editor)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                        selected ? 'bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/8'
                      }`}
                      style={selected ? { borderColor: theme.accent } : undefined}
                    >
                      {editor.avatar_url ? (
                        <img src={editor.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{editor.username[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-medium text-white truncate">@{editor.username}</p>
                        {editor.platform && (
                          <p className="text-[9px] text-white/40 uppercase">{editor.platform}</p>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selected ? '' : 'border-white/20'
                        }`}
                        style={selected ? { borderColor: theme.accent, backgroundColor: theme.accent } : undefined}
                      >
                        {selected && <span className="text-black text-[10px] font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
              <Button
                onClick={() => setPhase('wheel')}
                disabled={selectedEditors.length < 2}
                className="w-full py-3 rounded-xl font-display text-sm font-bold tracking-wider text-black disabled:opacity-40"
                style={{ backgroundColor: theme.accent }}
              >
                <Zap className="w-4 h-4 mr-2" />
                LOAD FLYWHEEL ({selectedEditors.length})
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── WHEEL PHASE ─────────────────────────────────────────── */}
        {phase === 'wheel' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-4"
          >
            {/* Wheel container */}
            <div className="relative" style={{ filter: `drop-shadow(${theme.glow})` }}>
              <canvas
                ref={canvasRef}
                className="rounded-full"
                style={{ width: Math.min(320, window.innerWidth - 64), height: Math.min(320, window.innerWidth - 64) }}
              />
              {/* Animated outer ring */}
              <motion.div
                animate={spinning ? { rotate: 360 } : {}}
                transition={spinning ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
                className="absolute inset-[-4px] rounded-full pointer-events-none"
                style={{ border: `1.5px solid ${theme.accent}25` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setPhase('pick')}
                variant="outline"
                size="sm"
                className="border-white/20 text-white/70 hover:bg-white/10 text-xs"
              >
                <Minus className="w-3 h-3 mr-1" />
                Edit
              </Button>
              
              <Button
                onClick={spin}
                disabled={spinning}
                className="px-8 py-3 rounded-xl font-display text-sm font-bold tracking-widest text-black relative overflow-hidden disabled:opacity-60"
                style={{ backgroundColor: theme.accent }}
              >
                {spinning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="mr-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.div>
                    SPINNING...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    SPIN
                  </>
                )}
              </Button>

              <Button
                onClick={reset}
                variant="outline"
                size="sm"
                className="border-white/20 text-white/70 hover:bg-white/10 text-xs"
                disabled={spinning}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>

            <p className="text-[10px] text-white/30 text-center">
              {selectedEditors.length} editors · Tap SPIN to roll
            </p>
          </motion.div>
        )}

        {/* ── RESULT PHASE ────────────────────────────────────────── */}
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
              {/* Pulsing glow */}
              <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.5, 0.25] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-[-24px] rounded-full"
                style={{ boxShadow: `0 0 80px ${theme.accent}50, 0 0 140px ${theme.accent}20` }}
              />
              
              {winner.avatar_url ? (
                <img 
                  src={winner.avatar_url} alt=""
                  className="w-28 h-28 rounded-full object-cover border-4"
                  style={{ borderColor: theme.accent }}
                />
              ) : (
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center border-4"
                  style={{ borderColor: theme.accent, backgroundColor: `${theme.accent}20` }}
                >
                  <span className="text-3xl font-bold text-white">{winner.username[0]?.toUpperCase()}</span>
                </div>
              )}
              
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: 'spring', damping: 12 }}
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.accent }}
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
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">The Flywheel Chose</p>
              <h2 className="font-display text-2xl font-bold text-white">@{winner.username}</h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="flex gap-3 mt-2"
            >
              <Button onClick={reset} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10">
                <RotateCcw className="w-4 h-4 mr-2" />
                Spin Again
              </Button>
              <Button
                onClick={handleRate}
                className="font-display font-bold tracking-wider text-black"
                style={{ backgroundColor: theme.accent }}
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
