import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Trophy, RotateCcw,
  Download, Sparkles, ChevronDown, Palette, X, Image, Crown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

const BG_PRESETS = [
  { id: 'dark', label: 'Dark', cardBg: '#0a0a0a', text: 'white', accent: '#ef4444' },
  { id: 'bureau', label: 'Bureau', cardBg: 'linear-gradient(135deg, #1a0505, #0a0a0a)', text: 'white', accent: '#dc2626' },
  { id: 'gold', label: 'Gold', cardBg: 'linear-gradient(135deg, #1a1505, #0a0a0a)', text: 'white', accent: '#f59e0b' },
  { id: 'white', label: 'Clean', cardBg: '#fafafa', text: '#111', accent: '#111' },
  { id: 'neon', label: 'Neon', cardBg: 'linear-gradient(135deg, #0a050f, #050a14)', text: 'white', accent: '#a855f7' },
];

type WinnerSide = 'A' | 'B' | null;

export default function Judge1v1Rating() {
  const { profile } = useAuth();
  const [editA, setEditA] = useState({ username: '', thumbnail: null as string | null });
  const [editB, setEditB] = useState({ username: '', thumbnail: null as string | null });
  const [winner, setWinner] = useState<WinnerSide>(null);
  const [scoreA, setScoreA] = useState(70);
  const [scoreB, setScoreB] = useState(65);
  const [bgPreset, setBgPreset] = useState('dark');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  const bg = BG_PRESETS.find(b => b.id === bgPreset) || BG_PRESETS[0];
  const isDark = bgPreset !== 'white';

  const handleImageUpload = (side: 'A' | 'B', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (side === 'A') setEditA(prev => ({ ...prev, thumbnail: url }));
      else setEditB(prev => ({ ...prev, thumbnail: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!editA.username || !editB.username) {
      toast.error('Enter both editor usernames');
      return;
    }
    if (!winner) {
      toast.error('Pick a winner first');
      return;
    }
    setShowResult(true);
  };

  const handleScreenshot = async () => {
    if (!resultRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: null, scale: 3, useCORS: true
      });
      const link = document.createElement('a');
      link.download = `loopgate-1v1-${editA.username}-vs-${editB.username}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('VS card downloaded!');
    } catch {
      toast.error('Failed to export');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {!showResult ? (
        <div className="space-y-4">
          {/* VS Header */}
          <div className="text-center py-3">
            <div className="flex items-center justify-center gap-3">
              <Swords className="w-5 h-5 text-red-500" />
              <h2 className="font-display text-lg font-bold text-white tracking-wide">1V1 EDIT RATING</h2>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Compare two edits, pick a winner, export for TikTok</p>
          </div>

          {/* Two Edit Cards — SQUARE screenshots */}
          <div className="grid grid-cols-2 gap-3 px-1">
            {/* Edit A */}
            <div className="space-y-2">
              <div className="text-center">
                <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">Edit A</span>
              </div>
              <div
                onClick={() => fileInputARef.current?.click()}
                className="aspect-square bg-zinc-900 border border-zinc-700 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-red-500/50 transition-colors overflow-hidden relative"
              >
                {editA.thumbnail ? (
                  <>
                    <img src={editA.thumbnail} alt="Edit A" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditA(prev => ({ ...prev, thumbnail: null })); }}
                      className="absolute top-1 right-1 p-1 bg-black/70 rounded-full"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </>
                ) : (
                  <div className="text-center px-2">
                    <Image className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
                    <p className="text-[10px] text-zinc-600">Tap to add screenshot</p>
                  </div>
                )}
              </div>
              <Input
                value={editA.username}
                onChange={(e) => setEditA(prev => ({ ...prev, username: e.target.value }))}
                placeholder="@editor_a"
                className="bg-zinc-900 border-zinc-700 text-xs h-8 text-center"
              />
              <input ref={fileInputARef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload('A', e.target.files[0])} />
            </div>

            {/* Edit B */}
            <div className="space-y-2">
              <div className="text-center">
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">Edit B</span>
              </div>
              <div
                onClick={() => fileInputBRef.current?.click()}
                className="aspect-square bg-zinc-900 border border-zinc-700 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors overflow-hidden relative"
              >
                {editB.thumbnail ? (
                  <>
                    <img src={editB.thumbnail} alt="Edit B" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditB(prev => ({ ...prev, thumbnail: null })); }}
                      className="absolute top-1 right-1 p-1 bg-black/70 rounded-full"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </>
                ) : (
                  <div className="text-center px-2">
                    <Image className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
                    <p className="text-[10px] text-zinc-600">Tap to add screenshot</p>
                  </div>
                )}
              </div>
              <Input
                value={editB.username}
                onChange={(e) => setEditB(prev => ({ ...prev, username: e.target.value }))}
                placeholder="@editor_b"
                className="bg-zinc-900 border-zinc-700 text-xs h-8 text-center"
              />
              <input ref={fileInputBRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload('B', e.target.files[0])} />
            </div>
          </div>

          {/* Winner Pick */}
          <div className="px-1 space-y-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider text-center font-mono">Pick Winner</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setWinner('A')}
                className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                  winner === 'A'
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-red-500/50'
                }`}
              >
                <Trophy className={`w-4 h-4 mx-auto mb-1 ${winner === 'A' ? 'text-yellow-300' : ''}`} />
                {editA.username || 'Edit A'}
              </button>
              <button
                onClick={() => setWinner('B')}
                className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                  winner === 'B'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-blue-500/50'
                }`}
              >
                <Trophy className={`w-4 h-4 mx-auto mb-1 ${winner === 'B' ? 'text-yellow-300' : ''}`} />
                {editB.username || 'Edit B'}
              </button>
            </div>
          </div>

          {/* Scores */}
          <div className="px-1 space-y-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider text-center font-mono">Scores</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-red-400 w-16 text-right font-mono">{editA.username || 'A'}</span>
                <Slider value={[scoreA]} max={100} step={1} onValueChange={([v]) => setScoreA(v)} className="flex-1" />
                <span className="text-xs font-bold text-white w-8">{scoreA}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-blue-400 w-16 text-right font-mono">{editB.username || 'B'}</span>
                <Slider value={[scoreB]} max={100} step={1} onValueChange={([v]) => setScoreB(v)} className="flex-1" />
                <span className="text-xs font-bold text-white w-8">{scoreB}</span>
              </div>
            </div>
          </div>

          {/* Background Picker */}
          <div className="px-1">
            <button onClick={() => setShowBgPicker(!showBgPicker)}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors mx-auto">
              <Palette className="w-3.5 h-3.5" />
              Background: {bg.label}
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
            <Button onClick={handleGenerate} disabled={!editA.username || !editB.username || !winner}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate VS Card
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
              {/* Scanline overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, currentColor 1px, currentColor 2px)' }} />

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-2xl" style={{ borderColor: bg.accent }} />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-2xl" style={{ borderColor: bg.accent }} />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-2xl" style={{ borderColor: bg.accent }} />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-2xl" style={{ borderColor: bg.accent }} />

              {/* Top Bar */}
              <div className="relative z-10 flex items-center justify-between px-5 pt-4">
                <div>
                  <p style={{ fontSize: 8, letterSpacing: '0.25em', opacity: 0.4, fontFamily: 'monospace', textTransform: 'uppercase' }}>Judged on</p>
                  <p style={{ fontSize: 16, fontWeight: 900, letterSpacing: '0.15em', fontFamily: "'Bebas Neue', sans-serif" }}>LOOPGATE</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 8, letterSpacing: '0.2em', opacity: 0.4, fontFamily: 'monospace', textTransform: 'uppercase' }}>Judge</p>
                  <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>@{profile?.username || 'judge'}</p>
                </div>
              </div>

              {/* VS Title */}
              <div className="relative z-10 text-center" style={{ marginTop: 8 }}>
                <p style={{ fontSize: 10, letterSpacing: '0.3em', opacity: 0.5, fontFamily: 'monospace', textTransform: 'uppercase' }}>1v1 Edit Battle</p>
              </div>

              {/* Main VS Content */}
              <div className="relative z-10 flex-1 flex items-center px-5" style={{ gap: 12 }}>
                {/* Editor A */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden',
                    border: winner === 'A' ? `3px solid ${bg.accent}` : '2px solid rgba(128,128,128,0.3)',
                    boxShadow: winner === 'A' ? `0 0 20px ${bg.accent}40` : 'none',
                    position: 'relative'
                  }}>
                    {editA.thumbnail ? (
                      <img src={editA.thumbnail} alt="A" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 28, fontWeight: 900, opacity: 0.2 }}>A</span>
                      </div>
                    )}
                    {winner === 'A' && (
                      <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: bg.accent, padding: '2px 8px', borderRadius: '0 0 6px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontSize: 8, fontWeight: 900, color: 'white', letterSpacing: '0.1em' }}>WINNER</span>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 800, marginTop: 8 }}>@{editA.username}</p>
                  <p style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", lineHeight: 1, color: winner === 'A' ? bg.accent : 'inherit' }}>{scoreA}</p>
                </div>

                {/* VS Divider */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 1, height: 30, background: 'currentColor', opacity: 0.15 }} />
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${bg.accent}`, background: `${bg.accent}15`
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.05em', color: bg.accent }}>VS</span>
                  </div>
                  <div style={{ width: 1, height: 30, background: 'currentColor', opacity: 0.15 }} />
                </div>

                {/* Editor B */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden',
                    border: winner === 'B' ? `3px solid ${bg.accent}` : '2px solid rgba(128,128,128,0.3)',
                    boxShadow: winner === 'B' ? `0 0 20px ${bg.accent}40` : 'none',
                    position: 'relative'
                  }}>
                    {editB.thumbnail ? (
                      <img src={editB.thumbnail} alt="B" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 28, fontWeight: 900, opacity: 0.2 }}>B</span>
                      </div>
                    )}
                    {winner === 'B' && (
                      <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: bg.accent, padding: '2px 8px', borderRadius: '0 0 6px 6px' }}>
                        <span style={{ fontSize: 8, fontWeight: 900, color: 'white', letterSpacing: '0.1em' }}>WINNER</span>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 800, marginTop: 8 }}>@{editB.username}</p>
                  <p style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", lineHeight: 1, color: winner === 'B' ? bg.accent : 'inherit' }}>{scoreB}</p>
                </div>
              </div>

              {/* Bottom */}
              <div className="relative z-10 px-5 pb-4 flex items-end justify-between">
                <p style={{ fontSize: 7, letterSpacing: '0.2em', opacity: 0.25, fontFamily: 'monospace', textTransform: 'uppercase' }}>loopgate.io</p>
                <p style={{ fontSize: 7, letterSpacing: '0.2em', opacity: 0.25, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  {scoreA} – {scoreB}
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-zinc-600 px-4">
            Square format — perfect for Instagram, Twitter, and TikTok overlays
          </p>
        </div>
      )}
    </div>
  );
}
