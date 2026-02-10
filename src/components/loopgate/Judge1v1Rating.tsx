import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Upload, Trophy, Play, Pause, RotateCcw,
  Download, Share2, Sparkles, ChevronDown, Palette, X, Image
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

const BG_PRESETS = [
  { id: 'dark', label: 'Dark', bg: 'bg-black', text: 'text-white' },
  { id: 'red', label: 'Bureau', bg: 'bg-gradient-to-br from-red-950 to-black', text: 'text-white' },
  { id: 'gold', label: 'Gold', bg: 'bg-gradient-to-br from-amber-950 to-black', text: 'text-white' },
  { id: 'white', label: 'Clean', bg: 'bg-zinc-100', text: 'text-black' },
  { id: 'purple', label: 'Neon', bg: 'bg-gradient-to-br from-purple-950 to-black', text: 'text-white' },
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
      toast.success('Result card downloaded!');
    } catch {
      toast.error('Failed to export');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Setup Phase */}
      {!showResult ? (
        <div className="space-y-4">
          {/* VS Header */}
          <div className="text-center py-3">
            <div className="flex items-center justify-center gap-3">
              <Swords className="w-5 h-5 text-red-500" />
              <h2 className="font-display text-lg font-bold text-white tracking-wide">1v1 EDIT RATING</h2>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Compare two edits, pick a winner, export for TikTok</p>
          </div>

          {/* Two Edit Cards */}
          <div className="grid grid-cols-2 gap-3 px-1">
            {/* Edit A */}
            <div className="space-y-2">
              <div className="text-center">
                <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">Edit A</span>
              </div>
              <div
                onClick={() => fileInputARef.current?.click()}
                className="aspect-[9/16] bg-zinc-900 border border-zinc-700 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-red-500/50 transition-colors overflow-hidden relative"
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
              <input
                ref={fileInputARef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload('A', e.target.files[0])}
              />
            </div>

            {/* Edit B */}
            <div className="space-y-2">
              <div className="text-center">
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">Edit B</span>
              </div>
              <div
                onClick={() => fileInputBRef.current?.click()}
                className="aspect-[9/16] bg-zinc-900 border border-zinc-700 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors overflow-hidden relative"
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
              <input
                ref={fileInputBRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload('B', e.target.files[0])}
              />
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
                <Slider
                  value={[scoreA]}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setScoreA(v)}
                  className="flex-1"
                />
                <span className="text-xs font-bold text-white w-8">{scoreA}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-blue-400 w-16 text-right font-mono">{editB.username || 'B'}</span>
                <Slider
                  value={[scoreB]}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setScoreB(v)}
                  className="flex-1"
                />
                <span className="text-xs font-bold text-white w-8">{scoreB}</span>
              </div>
            </div>
          </div>

          {/* Background Picker */}
          <div className="px-1">
            <button
              onClick={() => setShowBgPicker(!showBgPicker)}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors mx-auto"
            >
              <Palette className="w-3.5 h-3.5" />
              Background: {bg.label}
              <ChevronDown className={`w-3 h-3 transition-transform ${showBgPicker ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showBgPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2 justify-center mt-2">
                    {BG_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setBgPreset(preset.id)}
                        className={`w-8 h-8 rounded-full ${preset.bg} border-2 transition-all ${
                          bgPreset === preset.id ? 'border-white scale-110' : 'border-zinc-700'
                        }`}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Generate Button */}
          <div className="px-1">
            <Button
              onClick={handleGenerate}
              disabled={!editA.username || !editB.username || !winner}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Result Card
            </Button>
          </div>
        </div>
      ) : (
        /* Result Card Phase */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setShowResult(false)}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Edit
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleScreenshot}
                className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          </div>

          {/* The exportable result card — 9:16 TikTok format */}
          <div className="flex justify-center px-1">
            <div
              ref={resultRef}
              className={`w-full max-w-[320px] aspect-[9/16] ${bg.bg} ${bg.text} rounded-2xl overflow-hidden relative flex flex-col`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Loopgate Branding Top */}
              <div className="text-center pt-6 pb-3 relative z-10">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-50">Judged on</p>
                <p className="font-display text-lg font-bold tracking-widest">LOOPGATE</p>
                <p className="text-[9px] font-mono opacity-40 mt-0.5">@{profile?.username || 'judge'}</p>
              </div>

              {/* VS Section */}
              <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
                {/* Thumbnails side by side */}
                <div className="flex items-center gap-3 mb-4 w-full">
                  <div className={`flex-1 aspect-[9/16] rounded-xl overflow-hidden border-2 ${winner === 'A' ? 'border-yellow-400' : 'border-zinc-600'}`}>
                    {editA.thumbnail ? (
                      <img src={editA.thumbnail} alt="A" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-red-950/30 flex items-center justify-center">
                        <span className="text-2xl font-bold opacity-30">A</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Swords className="w-5 h-5 opacity-60" />
                    <span className="text-[9px] font-mono uppercase tracking-wider opacity-40">vs</span>
                  </div>
                  <div className={`flex-1 aspect-[9/16] rounded-xl overflow-hidden border-2 ${winner === 'B' ? 'border-yellow-400' : 'border-zinc-600'}`}>
                    {editB.thumbnail ? (
                      <img src={editB.thumbnail} alt="B" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-950/30 flex items-center justify-center">
                        <span className="text-2xl font-bold opacity-30">B</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Names & Scores */}
                <div className="flex items-center justify-between w-full px-2 mb-3">
                  <div className="text-center">
                    <p className={`text-xs font-bold ${winner === 'A' ? 'text-yellow-400' : ''}`}>
                      @{editA.username}
                    </p>
                    <p className="text-2xl font-display font-bold">{scoreA}</p>
                  </div>
                  <div className="text-[10px] font-mono opacity-40">—</div>
                  <div className="text-center">
                    <p className={`text-xs font-bold ${winner === 'B' ? 'text-yellow-400' : ''}`}>
                      @{editB.username}
                    </p>
                    <p className="text-2xl font-display font-bold">{scoreB}</p>
                  </div>
                </div>

                {/* Winner Banner */}
                <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3 text-center w-full">
                  <p className="text-[9px] font-mono uppercase tracking-wider opacity-60 mb-0.5">Winner</p>
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <p className="text-lg font-display font-bold text-yellow-400">
                      @{winner === 'A' ? editA.username : editB.username}
                    </p>
                  </div>
                  <p className="text-xs font-mono mt-1 opacity-70">
                    Score: {winner === 'A' ? scoreA : scoreB}/100
                  </p>
                </div>
              </div>

              {/* Bottom Branding */}
              <div className="text-center pb-5 pt-3 relative z-10">
                <p className="text-[8px] font-mono uppercase tracking-[0.2em] opacity-30">loopgate.io</p>
              </div>

              {/* Subtle overlay pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px)' }}
              />
            </div>
          </div>

          <p className="text-center text-[10px] text-zinc-600 px-4">
            Screen record or screenshot this card for your TikTok/Reels content
          </p>
        </div>
      )}
    </div>
  );
}
