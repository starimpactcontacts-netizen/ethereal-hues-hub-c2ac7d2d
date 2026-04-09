import { useState } from 'react';
import { Download, Play, HardDrive } from 'lucide-react';
import { SiYoutube, SiGoogledrive } from '@icons-pack/react-simple-icons';

interface ScenepackButtonsProps {
  youtubeUrl?: string | null;
  gdriveUrl?: string | null;
  /** Legacy single URL fallback */
  legacyUrl?: string | null;
  variant?: 'full' | 'compact' | 'inline';
  className?: string;
}

export default function ScenepackButtons({ youtubeUrl, gdriveUrl, legacyUrl, variant = 'full', className = '' }: ScenepackButtonsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const yt = youtubeUrl || null;
  const gd = gdriveUrl || null;
  const legacy = legacyUrl || null;

  const hasYt = !!yt;
  const hasGd = !!gd;
  const hasLegacy = !!legacy;
  const hasBoth = hasYt && hasGd;
  const hasAny = hasYt || hasGd || hasLegacy;

  if (!hasAny) return null;

  // Single link — go straight
  function getSingleUrl(): string | null {
    if (hasBoth) return null;
    if (hasYt) return yt!;
    if (hasGd) return gd!;
    return legacy;
  }

  const singleUrl = getSingleUrl();

  if (singleUrl && !hasBoth) {
    const isYt = singleUrl.includes('youtube.com') || singleUrl.includes('youtu.be') || singleUrl === yt;
    const label = isYt ? 'YouTube Scenepack' : 'Google Drive Scenepack';
    const Icon = isYt ? SiYoutube : SiGoogledrive;
    const color = isYt ? 'text-red-400' : 'text-amber-400';

    if (variant === 'inline') {
      return (
        <a href={singleUrl} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase shrink-0 ${color} ${className}`}
          style={{ background: isYt ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', border: isYt ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.3)', backdropFilter: 'blur(8px)' }}>
          <Icon className="w-3 h-3" /> Scenepack
        </a>
      );
    }

    if (variant === 'compact') {
      return (
        <a href={singleUrl} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-2 py-2.5 px-3 bg-surface-1 border border-border hover:border-foreground/20 text-foreground font-bold uppercase tracking-wider text-xs rounded-xl transition-colors active:scale-[0.98] ${className}`}>
          <Icon className={`w-4 h-4 ${color}`} /> {label}
        </a>
      );
    }

    return (
      <a href={singleUrl} target="_blank" rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2.5 py-3.5 w-full bg-surface-1 border border-border hover:border-foreground/20 text-foreground font-black uppercase tracking-wider text-sm rounded-xl transition-colors active:scale-[0.98] ${className}`}>
        <Icon className={`w-4 h-4 ${color}`} /> {label}
      </a>
    );
  }

  // Both links — show picker
  if (variant === 'inline') {
    return (
      <div className={`relative ${className}`}>
        <button onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-emerald-400 uppercase shrink-0"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', backdropFilter: 'blur(8px)' }}>
          <Download className="w-3 h-3" /> Scenepack
        </button>
        {showPicker && (
          <div className="absolute top-full mt-1 right-0 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[180px]">
            <a href={yt!} target="_blank" rel="noopener noreferrer" onClick={() => setShowPicker(false)}
              className="flex items-center gap-2.5 px-4 py-3 hover:bg-white/5 transition-colors border-b border-border">
              <SiYoutube className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold">YouTube</span>
            </a>
            <a href={gd!} target="_blank" rel="noopener noreferrer" onClick={() => setShowPicker(false)}
              className="flex items-center gap-2.5 px-4 py-3 hover:bg-white/5 transition-colors">
              <SiGoogledrive className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">Google Drive</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  // Full or compact — show two buttons
  return (
    <div className={`flex gap-2 ${className}`}>
      <a href={yt!} target="_blank" rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-1 border border-red-500/20 hover:border-red-500/40 text-foreground font-bold uppercase tracking-wider text-xs rounded-xl transition-colors active:scale-[0.98]">
        <SiYoutube className="w-4 h-4 text-red-400" /> YouTube
      </a>
      <a href={gd!} target="_blank" rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-1 border border-amber-500/20 hover:border-amber-500/40 text-foreground font-bold uppercase tracking-wider text-xs rounded-xl transition-colors active:scale-[0.98]">
        <SiGoogledrive className="w-4 h-4 text-amber-400" /> Google Drive
      </a>
    </div>
  );
}
