import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, RotateCcw, Palette, ChevronRight, 
  Plus, Minus, Maximize2, Minimize2, Zap, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    id: 'obsidian', 
    label: 'Obsidian', 
    bg: 'bg-black', 
    accent: '#D4AF37',
    gradient: 'from-zinc-950 via-black to-zinc-950',
    segmentColors: ['#D4AF37', '#1a1a1a', '#B8860B', '#0d0d0d', '#FFD700', '#262626'],
    textColor: '#fff',
    glow: 'shadow-[0_0_80px_rgba(212,175,55,0.3)]'
  },
  { 
    id: 'neon', 
    label: 'Neon', 
    bg: 'bg-black', 
    accent: '#00FFFF',
    gradient: 'from-purple-950 via-black to-cyan-950',
    segmentColors: ['#00FFFF', '#1a0030', '#FF00FF', '#0a0020', '#7B2FFF', '#150035'],
    textColor: '#fff',
    glow: 'shadow-[0_0_80px_rgba(0,255,255,0.3)]'
  },
  { 
    id: 'inferno', 
    label: 'Inferno', 
    bg: 'bg-black', 
    accent: '#FF4500',
    gradient: 'from-red-950 via-black to-orange-950',
    segmentColors: ['#FF4500', '#1a0500', '#FF6347', '#0d0200', '#FF8C00', '#261000'],
    textColor: '#fff',
    glow: 'shadow-[0_0_80px_rgba(255,69,0,0.3)]'
  },
  { 
    id: 'arctic', 
    label: 'Arctic', 
    bg: 'bg-black', 
    accent: '#60A5FA',
    gradient: 'from-blue-950 via-slate-950 to-indigo-950',
    segmentColors: ['#60A5FA', '#0a1628', '#3B82F6', '#050d1a', '#93C5FD', '#0f1f3d'],
    textColor: '#fff',
    glow: 'shadow-[0_0_80px_rgba(96,165,250,0.3)]'
  },
  { 
    id: 'matrix', 
    label: 'Matrix', 
    bg: 'bg-black', 
    accent: '#22C55E',
    gradient: 'from-green-950 via-black to-emerald-950',
    segmentColors: ['#22C55E', '#001a0a', '#16A34A', '#000d05', '#4ADE80', '#002612'],
    textColor: '#fff',
    glow: 'shadow-[0_0_80px_rgba(34,197,94,0.3)]'
  },
];

export default function JudgeFlywheel({ isOpen, onClose, editors, onSelect }: JudgeFlywheelProps) {
  const [selectedEditors, setSelectedEditors] = useState<FlywheelEditor[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<FlywheelEditor | null>(null);
  const [rotation, setRotation] = useState(0);
  const [themeIndex, setThemeIndex] = useState(0);
  const [phase, setPhase] = useState<'pick' | 'wheel' | 'result'>('pick');
  const [fullscreen, setFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[themeIndex];

  // Toggle editor selection
  const toggleEditor = (editor: FlywheelEditor) => {
    setSelectedEditors(prev => {
      const exists = prev.find(e => e.id === editor.id);
      if (exists) return prev.filter(e => e.id !== editor.id);
      if (prev.length >= 12) return prev;
      return [...prev, editor];
    });
  };

  const selectAll = () => {
    setSelectedEditors(editors.slice(0, 12));
  };

  // Draw wheel on canvas
  const drawWheel = useCallback((angle: number, highlightIndex?: number) => {
    const canvas = canvasRef.current;
    if (!canvas || selectedEditors.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;
    const segAngle = (2 * Math.PI) / selectedEditors.length;

    ctx.clearRect(0, 0, size, size);

    // Draw segments
    selectedEditors.forEach((editor, i) => {
      const startAngle = angle + i * segAngle;
      const endAngle = startAngle + segAngle;
      const colorIdx = i % theme.segmentColors.length;
      const isHighlighted = highlightIndex === i;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = isHighlighted ? theme.accent : theme.segmentColors[colorIdx];
      ctx.fill();

      // Segment border
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = theme.textColor;
      ctx.font = `bold ${Math.max(10, Math.min(14, 160 / selectedEditors.length))}px system-ui`;
      
      const name = `@${editor.username}`;
      const maxLen = selectedEditors.length > 8 ? 8 : 12;
      const display = name.length > maxLen ? name.slice(0, maxLen) + '…' : name;
      ctx.fillText(display, radius - 16, 4);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center text
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('LOOP', center, center - 2);
    ctx.font = 'bold 9px system-ui';
    ctx.fillText('GATE', center, center + 10);

    // Pointer (top)
    ctx.beginPath();
    ctx.moveTo(center - 12, 2);
    ctx.lineTo(center + 12, 2);
    ctx.lineTo(center, 22);
    ctx.closePath();
    ctx.fillStyle = theme.accent;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [selectedEditors, theme]);

  // Spin with physics
  const spin = useCallback(() => {
    if (spinning || selectedEditors.length < 2) return;
    
    setSpinning(true);
    setWinner(null);

    const segAngle = (2 * Math.PI) / selectedEditors.length;
    const totalRotation = (Math.PI * 2 * (8 + Math.random() * 6)); // 8-14 full rotations
    const targetAngle = rotation + totalRotation;
    const duration = 5000 + Math.random() * 2000; // 5-7 seconds
    const startTime = performance.now();
    const startRotation = rotation;

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const currentAngle = startRotation + (targetAngle - startRotation) * eased;

      setRotation(currentAngle);
      drawWheel(currentAngle);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Determine winner
        const normalizedAngle = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        // Pointer is at top (- π/2), we need to find which segment is there
        const pointerAngle = ((2 * Math.PI) - normalizedAngle) % (2 * Math.PI);
        const winnerIndex = Math.floor(pointerAngle / segAngle) % selectedEditors.length;
        
        setWinner(selectedEditors[winnerIndex]);
        setSpinning(false);
        
        // Flash the winning segment
        drawWheel(currentAngle, winnerIndex);
        
        setTimeout(() => setPhase('result'), 800);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, selectedEditors, rotation, drawWheel]);

  // Draw initial wheel when entering wheel phase
  useEffect(() => {
    if (phase === 'wheel' && canvasRef.current) {
      const dpr = window.devicePixelRatio || 1;
      const canvas = canvasRef.current;
      const displaySize = Math.min(340, window.innerWidth - 80);
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
      canvas.style.width = `${displaySize}px`;
      canvas.style.height = `${displaySize}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      // Reset internal dimensions for drawing
      canvas.width = displaySize;
      canvas.height = displaySize;
      drawWheel(rotation);
    }
  }, [phase, drawWheel, rotation]);

  // Cleanup animation
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const reset = () => {
    setWinner(null);
    setPhase('wheel');
    setRotation(0);
    setTimeout(() => drawWheel(0), 50);
  };

  const handleRate = () => {
    if (winner) {
      onSelect(winner);
      onClose();
    }
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
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4" style={{ color: theme.accent }} />
            <span className="font-display text-sm font-bold text-white tracking-wider">FLYWHEEL</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleFullscreen} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              {fullscreen ? <Minimize2 className="w-3.5 h-3.5 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
        </div>

        {/* Theme selector */}
        <div className="flex items-center justify-center gap-2 px-4 pb-3">
          <Palette className="w-3 h-3 text-muted-foreground" />
          {THEMES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => { setThemeIndex(i); if (phase === 'wheel') setTimeout(() => drawWheel(rotation), 50); }}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                i === themeIndex ? 'scale-110 border-white' : 'border-white/20 hover:border-white/40'
              }`}
              style={{ background: t.accent }}
            />
          ))}
        </div>

        {/* Phase: Pick editors */}
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
              <button onClick={selectAll} className="text-xs font-medium px-2 py-1 rounded-md bg-white/10 text-white/70 hover:text-white">
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
                        selected 
                          ? 'border-current bg-white/10' 
                          : 'border-white/10 bg-white/5 hover:bg-white/8'
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
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selected ? 'border-current bg-current' : 'border-white/20'
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

            {/* Continue button */}
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

        {/* Phase: Wheel */}
        {phase === 'wheel' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-4"
          >
            {/* Wheel */}
            <div className={`relative rounded-full ${theme.glow}`}>
              <canvas ref={canvasRef} className="rounded-full" />
              
              {/* Outer glow ring */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ 
                  boxShadow: `inset 0 0 30px ${theme.accent}15, 0 0 60px ${theme.accent}20`,
                  border: `2px solid ${theme.accent}30`
                }}
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
                className="px-8 py-3 rounded-xl font-display text-sm font-bold tracking-widest text-black relative overflow-hidden"
                style={{ backgroundColor: theme.accent }}
              >
                {spinning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
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
              {selectedEditors.length} editors loaded · Tap SPIN to roll
            </p>
          </motion.div>
        )}

        {/* Phase: Result */}
        {phase === 'result' && winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-4"
          >
            {/* Winner reveal */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 0.2 }}
              className="relative"
            >
              {/* Glow rings */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full"
                style={{ 
                  boxShadow: `0 0 80px ${theme.accent}60, 0 0 120px ${theme.accent}30`,
                  margin: '-20px'
                }}
              />
              
              {winner.avatar_url ? (
                <img 
                  src={winner.avatar_url} 
                  alt="" 
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
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.accent }}
              >
                <Crown className="w-5 h-5 text-black" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">The Flywheel Chose</p>
              <h2 className="font-display text-2xl font-bold text-white">@{winner.username}</h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-3 mt-4"
            >
              <Button
                onClick={reset}
                variant="outline"
                className="border-white/20 text-white/70 hover:bg-white/10"
              >
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
