import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Sparkles, ChevronDown, Palette, X, Image,
  Heart, Lightbulb, Music, Fingerprint, Zap, RotateCcw,
  Smartphone, Monitor, Square
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const BG_PRESETS = [
  { id: 'dark', label: 'Dark', cardBg: '#080808', text: '#ffffff', accent: '#dc2626', grade: '#ffffff' },
  { id: 'bureau', label: 'Bureau', cardBg: '#0c0404', text: '#ffffff', accent: '#dc2626', grade: '#fbbf24' },
  { id: 'gold', label: 'Gold', cardBg: '#0c0a04', text: '#ffffff', accent: '#f59e0b', grade: '#f59e0b' },
  { id: 'white', label: 'Clean', cardBg: '#f5f5f5', text: '#111111', accent: '#111111', grade: '#111111' },
  { id: 'neon', label: 'Neon', cardBg: '#06040c', text: '#ffffff', accent: '#a855f7', grade: '#a855f7' },
];

const FORMATS = [
  { id: 'square', label: 'Square', icon: Square, aspect: '1/1', desc: 'Instagram' },
  { id: 'vertical', label: 'Vertical', icon: Smartphone, aspect: '9/16', desc: 'TikTok / Reels' },
  { id: 'horizontal', label: 'Horizontal', icon: Monitor, aspect: '16/9', desc: 'YouTube / Twitter' },
] as const;

type FormatId = typeof FORMATS[number]['id'];

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

function getGradeColor(grade: string, accent: string): string {
  if (grade.startsWith('S')) return '#fbbf24';
  if (grade === 'A') return '#34d399';
  if (grade === 'B') return '#60a5fa';
  return accent;
}

export default function JudgeQOIResultCard() {
  const { profile } = useAuth();
  const [editorUsername, setEditorUsername] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [scores, setScores] = useState({ emotion: 10, creativity: 18, sync: 18, identity: 7, execution: 18 });
  const [comment, setComment] = useState('');
  const [bgPreset, setBgPreset] = useState('dark');
  const [format, setFormat] = useState<FormatId>('square');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bg = BG_PRESETS.find(b => b.id === bgPreset) || BG_PRESETS[0];
  const fmt = FORMATS.find(f => f.id === format) || FORMATS[0];
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const { grade, label } = getGrade(totalScore);
  const gradeColor = getGradeColor(grade, bg.accent);

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
      toast.success('QOI card saved!');
    } catch {
      toast.error('Failed to export');
    }
  };

  const isVert = format === 'vertical';
  const isHoriz = format === 'horizontal';

  return (
    <div className="space-y-4 pb-20">
      {!showResult ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center py-3">
            <h2 className="text-base font-semibold text-foreground">QOI Result Card</h2>
            <p className="text-[11px] text-muted-foreground mt-1">Generate a shareable score card for any edit</p>
          </div>

          {/* Format Selector */}
          <div className="px-1">
            <p className="text-[10px] text-muted-foreground/60 mb-2 text-center">Card Format</p>
            <div className="flex gap-2">
              {FORMATS.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`flex-1 py-2.5 border text-center transition-all ${
                      format === f.id
                        ? 'border-red-600 bg-red-600/10 text-foreground'
                        : 'border-border/30 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <Icon size={16} className="mx-auto mb-1" />
                    <p className="text-[10px] font-medium">{f.label}</p>
                    <p className="text-[8px] opacity-50">{f.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor Info */}
          <div className="px-1 space-y-3">
            <div className="flex gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 bg-muted border border-border/40 border-dashed flex items-center justify-center cursor-pointer hover:border-red-600/50 transition-colors overflow-hidden relative shrink-0"
              >
                {thumbnail ? (
                  <>
                    <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                    <button onClick={(e) => { e.stopPropagation(); setThumbnail(null); }}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-black/70">
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </>
                ) : (
                  <Image className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
              <div className="flex-1 space-y-2">
                <Input value={editorUsername} onChange={(e) => setEditorUsername(e.target.value)}
                  placeholder="@editor_username" className="bg-background border-border/40 text-xs h-9" />
                <p className="text-[11px] text-muted-foreground">
                  Score: <span className="text-foreground font-semibold">{totalScore}/100</span> · Grade: <span className="font-semibold" style={{ color: gradeColor }}>{grade}</span>
                </p>
              </div>
            </div>
          </div>

          {/* QOI Pillar Sliders */}
          <div className="px-1 space-y-3">
            <p className="text-[10px] text-muted-foreground/60 text-center">QOI Breakdown</p>
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const score = scores[pillar.id as keyof typeof scores];
              return (
                <div key={pillar.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} style={{ color: pillar.color }} />
                      <span className="text-[11px] text-foreground/80">{pillar.label}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-foreground tabular-nums">{score}/{pillar.max}</span>
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
              placeholder="Judge verdict (optional)..." className="bg-background border-border/40 text-xs h-16 resize-none" />
          </div>

          {/* BG Picker */}
          <div className="px-1">
            <button onClick={() => setShowBgPicker(!showBgPicker)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto">
              <Palette className="w-3.5 h-3.5" /> Theme: {bg.label}
              <ChevronDown className={`w-3 h-3 transition-transform ${showBgPicker ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showBgPicker && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex gap-2 justify-center mt-2">
                    {BG_PRESETS.map((preset) => (
                      <button key={preset.id} onClick={() => setBgPreset(preset.id)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${bgPreset === preset.id ? 'border-white scale-110' : 'border-border/40'}`}
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
              className="w-full bg-red-600 hover:bg-red-500 text-white font-medium h-11">
              <Sparkles className="w-4 h-4 mr-2" /> Generate Card
            </Button>
          </div>
        </div>
      ) : (
        /* ===== RESULT VIEW ===== */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <button onClick={() => setShowResult(false)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={handleScreenshot}
              className="px-4 py-2 bg-foreground text-background text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 transition-opacity">
              <Download className="w-3.5 h-3.5" /> Save PNG
            </button>
          </div>

          <div className="flex justify-center px-1">
            <div
              ref={resultRef}
              style={{
                aspectRatio: fmt.aspect,
                background: bg.cardBg,
                color: bg.text,
                fontFamily: "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
                maxWidth: isVert ? 360 : isHoriz ? 560 : 420,
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Subtle grain overlay */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04,
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px)',
              }} />

              {/* Top accent line */}
              <div style={{ height: 3, background: bg.accent, flexShrink: 0 }} />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: isVert ? '20px 24px 0' : '16px 24px 0', position: 'relative', zIndex: 1 }}>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.08em' }}>LOOPGATE</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 9, opacity: 0.35, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Judge</p>
                  <p style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>@{profile?.username || 'judge'}</p>
                </div>
              </div>

              {/* Main body — layout adapts to format */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: isVert ? 'column' : 'row',
                padding: isVert ? '16px 24px' : isHoriz ? '12px 24px' : '12px 24px',
                gap: isVert ? 16 : 20,
                alignItems: isVert ? 'center' : 'stretch',
                position: 'relative',
                zIndex: 1,
              }}>
                {/* Left column: thumbnail + editor + grade */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isVert ? 12 : 8,
                  width: isVert ? '100%' : isHoriz ? '35%' : '40%',
                  flexShrink: 0,
                }}>
                  {/* Thumbnail */}
                  {thumbnail && (
                    <div style={{
                      width: isVert ? 140 : isHoriz ? '90%' : '85%',
                      aspectRatio: isHoriz ? '16/9' : '1',
                      overflow: 'hidden',
                      border: `2px solid ${bg.accent}25`,
                    }}>
                      <img src={thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  {/* Editor name */}
                  <p style={{ fontSize: 14, fontWeight: 700 }}>@{editorUsername}</p>

                  {/* Grade + Score */}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{
                      fontSize: isVert ? 64 : isHoriz ? 48 : 56,
                      fontWeight: 900,
                      lineHeight: 0.85,
                      color: gradeColor,
                      letterSpacing: '-0.02em',
                    }}>{grade}</p>
                    <p style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.4, textTransform: 'uppercase', marginTop: 4 }}>{label}</p>
                  </div>

                  <p style={{ fontSize: 24, fontWeight: 800, opacity: 0.6 }}>
                    {totalScore}<span style={{ fontSize: 12, opacity: 0.5 }}>/100</span>
                  </p>
                </div>

                {/* Right column: QOI breakdown */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: isVert ? 10 : isHoriz ? 8 : 10,
                  width: isVert ? '100%' : 'auto',
                }}>
                  <p style={{ fontSize: 10, letterSpacing: '0.25em', opacity: 0.3, textTransform: 'uppercase', marginBottom: 2 }}>QOI Breakdown</p>
                  {PILLARS.map((pillar) => {
                    const score = scores[pillar.id as keyof typeof scores];
                    const pct = (score / pillar.max) * 100;
                    return (
                      <div key={pillar.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>{pillar.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: pillar.color }}>
                            {score}<span style={{ opacity: 0.35, fontSize: 10, fontWeight: 500 }}>/{pillar.max}</span>
                          </span>
                        </div>
                        <div style={{ height: 6, background: `${bg.text === '#ffffff' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pillar.color, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Comment */}
                  {comment && (
                    <div style={{ marginTop: 4, padding: '8px 10px', borderLeft: `3px solid ${bg.accent}60`, background: `${bg.accent}08` }}>
                      <p style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5, fontStyle: 'italic' }}>
                        "{comment.length > 100 ? comment.slice(0, 100) + '...' : comment}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom CTA bar */}
              <div style={{
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: `1px solid ${bg.text === '#ffffff' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                position: 'relative',
                zIndex: 1,
                flexShrink: 0,
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', opacity: 0.5 }}>LOOPGATE.IO</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: bg.accent, opacity: 0.7 }}>Get your edit rated →</p>
              </div>

              {/* Bottom accent line */}
              <div style={{ height: 3, background: bg.accent, flexShrink: 0 }} />
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/50 px-4">
            {fmt.label} format ({fmt.desc}) — screenshot or save as PNG
          </p>
        </div>
      )}
    </div>
  );
}
