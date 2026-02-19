import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Sparkles, ChevronDown, Palette, X, Image,
  Heart, Lightbulb, Music, Fingerprint, Zap, RotateCcw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const BG_PRESETS = [
  { id: 'dark', label: 'Dark', cardBg: '#0a0a0a', text: 'white', accent: '#ef4444', grade: '#fff' },
  { id: 'bureau', label: 'Bureau', cardBg: 'linear-gradient(135deg, #1a0505, #0a0a0a)', text: 'white', accent: '#dc2626', grade: '#fbbf24' },
  { id: 'gold', label: 'Gold', cardBg: 'linear-gradient(135deg, #1a1505, #0a0a0a)', text: 'white', accent: '#f59e0b', grade: '#f59e0b' },
  { id: 'white', label: 'Clean', cardBg: '#fafafa', text: '#111', accent: '#111', grade: '#111' },
  { id: 'neon', label: 'Neon', cardBg: 'linear-gradient(135deg, #0a050f, #050a14)', text: 'white', accent: '#a855f7', grade: '#a855f7' },
];

const PILLARS = [
  { id: 'emotion', label: 'Emotion', max: 15, icon: Heart, color: '#f472b6' },
  { id: 'creativity', label: 'Creativity', max: 25, icon: Lightbulb, color: '#fbbf24' },
  { id: 'sync', label: 'Sync', max: 25, icon: Music, color: '#a78bfa' },
  { id: 'identity', label: 'Identity', max: 10, icon: Fingerprint, color: '#60a5fa' },
  { id: 'execution', label: 'Execution', max: 25, icon: Zap, color: '#34d399' },
];

function getGrade(score: number): { grade: string; label: string } {
  if (score >= 95) return { grade: 'S++', label: 'LEGENDARY' };
  if (score >= 85) return { grade: 'S+', label: 'ELITE' };
  if (score >= 75) return { grade: 'S', label: 'EXCEPTIONAL' };
  if (score >= 65) return { grade: 'A', label: 'EXCELLENT' };
  if (score >= 50) return { grade: 'B', label: 'SOLID' };
  if (score >= 40) return { grade: 'C', label: 'AVERAGE' };
  if (score >= 30) return { grade: 'D', label: 'BELOW AVG' };
  return { grade: 'F', label: 'NEEDS WORK' };
}

export default function JudgeQOIResultCard() {
  const { profile } = useAuth();
  const [editorUsername, setEditorUsername] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [scores, setScores] = useState({ emotion: 10, creativity: 18, sync: 18, identity: 7, execution: 18 });
  const [comment, setComment] = useState('');
  const [bgPreset, setBgPreset] = useState('dark');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bg = BG_PRESETS.find(b => b.id === bgPreset) || BG_PRESETS[0];
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const { grade, label } = getGrade(totalScore);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setThumbnail(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!editorUsername) { toast.error('Enter editor username'); return; }
    setShowResult(true);
  };

  const handleScreenshot = async () => {
    if (!resultRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(resultRef.current, { backgroundColor: null, scale: 3, useCORS: true });
      const link = document.createElement('a');
      link.download = `loopgate-qoi-${editorUsername}-${totalScore}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('QOI card downloaded!');
    } catch {
      toast.error('Failed to export');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {!showResult ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center py-3">
            <div className="flex items-center justify-center gap-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h2 className="font-display text-lg font-bold text-white tracking-wide">QOI RESULT CARD</h2>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Full breakdown card — goes viral every time</p>
          </div>

          {/* Editor Info */}
          <div className="px-1 space-y-3">
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl bg-zinc-900 border border-zinc-700 border-dashed flex items-center justify-center cursor-pointer hover:border-red-500/50 transition-colors overflow-hidden relative shrink-0"
              >
                {thumbnail ? (
                  <>
                    <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                    <button onClick={(e) => { e.stopPropagation(); setThumbnail(null); }}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 rounded-full">
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </>
                ) : (
                  <Image className="w-5 h-5 text-zinc-600" />
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
              <div className="flex-1 space-y-2">
                <Input value={editorUsername} onChange={(e) => setEditorUsername(e.target.value)}
                  placeholder="@editor_username" className="bg-zinc-900 border-zinc-700 text-xs h-8" />
                <p className="text-[10px] text-zinc-500">Total: <span className="text-white font-bold">{totalScore}/100</span> — <span className="text-yellow-400 font-bold">{grade}</span></p>
              </div>
            </div>
          </div>

          {/* QOI Pillar Sliders */}
          <div className="px-1 space-y-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider text-center font-mono">QOI Breakdown</p>
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const score = scores[pillar.id as keyof typeof scores];
              return (
                <div key={pillar.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} style={{ color: pillar.color }} />
                      <span className="text-[10px] text-zinc-300">{pillar.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white">{score}/{pillar.max}</span>
                  </div>
                  <Slider value={[score]} max={pillar.max} step={1}
                    onValueChange={([v]) => setScores(prev => ({ ...prev, [pillar.id]: v }))} className="py-0.5" />
                </div>
              );
            })}
          </div>

          {/* Comment */}
          <div className="px-1">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Judge verdict (optional)..." className="bg-zinc-900 border-zinc-700 text-xs h-16 resize-none" />
          </div>

          {/* BG Picker */}
          <div className="px-1">
            <button onClick={() => setShowBgPicker(!showBgPicker)}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors mx-auto">
              <Palette className="w-3.5 h-3.5" /> Background: {bg.label}
              <ChevronDown className={`w-3 h-3 transition-transform ${showBgPicker ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showBgPicker && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex gap-2 justify-center mt-2">
                    {BG_PRESETS.map((preset) => (
                      <button key={preset.id} onClick={() => setBgPreset(preset.id)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${bgPreset === preset.id ? 'border-white scale-110' : 'border-zinc-700'}`}
                        style={{ background: preset.cardBg }} title={preset.label} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Generate */}
          <div className="px-1">
            <Button onClick={handleGenerate} disabled={!editorUsername}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold">
              <Sparkles className="w-4 h-4 mr-2" /> Generate QOI Card
            </Button>
          </div>
        </div>
      ) : (
        /* ===== RESULT CARD — SQUARE FORMAT ===== */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <button onClick={() => setShowResult(false)} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={handleScreenshot}
              className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Save PNG
            </button>
          </div>

          <div className="flex justify-center px-1">
            <div
              ref={resultRef}
              className="w-full max-w-[400px] aspect-square rounded-2xl overflow-hidden relative flex flex-col"
              style={{ background: bg.cardBg, color: bg.text, fontFamily: "'Inter', sans-serif" }}
            >
              {/* Scanline */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, currentColor 1px, currentColor 2px)' }} />

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl-2xl" style={{ borderColor: bg.accent }} />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr-2xl" style={{ borderColor: bg.accent }} />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-2xl" style={{ borderColor: bg.accent }} />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br-2xl" style={{ borderColor: bg.accent }} />

              {/* Top Bar */}
              <div className="relative z-10 flex items-center justify-between px-5 pt-4">
                <div>
                  <p style={{ fontSize: 7, letterSpacing: '0.25em', opacity: 0.4, fontFamily: 'monospace', textTransform: 'uppercase' }}>Rated on</p>
                  <p style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.15em', fontFamily: "'Bebas Neue', sans-serif" }}>LOOPGATE</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 7, letterSpacing: '0.2em', opacity: 0.4, fontFamily: 'monospace', textTransform: 'uppercase' }}>Judge</p>
                  <p style={{ fontSize: 10, fontWeight: 700, opacity: 0.7 }}>@{profile?.username || 'judge'}</p>
                </div>
              </div>

              {/* Main Content */}
              <div className="relative z-10 flex-1 flex px-5" style={{ gap: 16, paddingTop: 8, paddingBottom: 8 }}>
                {/* Left — Thumbnail + Editor + Grade */}
                <div style={{ width: '38%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {thumbnail ? (
                    <div style={{ width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', border: `2px solid ${bg.accent}30` }}>
                      <img src={thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '1', borderRadius: 12, background: `${bg.accent}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${bg.accent}20` }}>
                      <span style={{ fontSize: 32, fontWeight: 900, opacity: 0.15 }}>?</span>
                    </div>
                  )}
                  <p style={{ fontSize: 11, fontWeight: 800 }}>@{editorUsername}</p>
                  {/* Giant Grade */}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 44, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", lineHeight: 0.9, color: bg.grade }}>{grade}</p>
                    <p style={{ fontSize: 8, letterSpacing: '0.2em', opacity: 0.5, fontFamily: 'monospace', textTransform: 'uppercase', marginTop: 2 }}>{label}</p>
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", opacity: 0.7 }}>{totalScore}<span style={{ fontSize: 10, opacity: 0.5 }}>/100</span></p>
                </div>

                {/* Right — QOI Breakdown */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                  <p style={{ fontSize: 8, letterSpacing: '0.3em', opacity: 0.4, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 2 }}>QOI Breakdown</p>
                  {PILLARS.map((pillar) => {
                    const score = scores[pillar.id as keyof typeof scores];
                    const pct = (score / pillar.max) * 100;
                    return (
                      <div key={pillar.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.8 }}>{pillar.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 900, color: pillar.color }}>{score}<span style={{ opacity: 0.4, fontSize: 8 }}>/{pillar.max}</span></span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(128,128,128,0.15)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: pillar.color, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Comment */}
                  {comment && (
                    <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 8, background: `${bg.accent}08`, borderLeft: `3px solid ${bg.accent}40` }}>
                      <p style={{ fontSize: 8, opacity: 0.9, lineHeight: 1.4, fontStyle: 'italic' }}>"{comment.length > 80 ? comment.slice(0, 80) + '...' : comment}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom */}
              <div className="relative z-10 px-5 pb-3 flex items-end justify-between">
                <p style={{ fontSize: 7, letterSpacing: '0.2em', opacity: 0.25, fontFamily: 'monospace', textTransform: 'uppercase' }}>loopgate.io</p>
                <p style={{ fontSize: 7, letterSpacing: '0.2em', opacity: 0.25, fontFamily: 'monospace', textTransform: 'uppercase' }}>Quality · Originality · Impact</p>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-zinc-600 px-4">
            Square format — screenshot or save for TikTok/Instagram overlay
          </p>
        </div>
      )}
    </div>
  );
}
