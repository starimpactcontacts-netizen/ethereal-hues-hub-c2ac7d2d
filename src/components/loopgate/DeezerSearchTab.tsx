import { useState } from 'react';
import { Search, Play, Pause, Loader2, Plus, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string; picture_small: string };
  album: { title: string; cover_small: string };
  preview: string; // 30s MP3 preview URL
  duration: number;
  link: string;
}

interface DeezerSearchTabProps {
  onPlayPreview: (url: string, title: string, artist: string, cover: string) => void;
  currentPreviewUrl: string | null;
  isPlaying: boolean;
}

export default function DeezerSearchTab({ onPlayPreview, currentPreviewUrl, isPlaying }: DeezerSearchTabProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      // Deezer API supports CORS via JSONP, but we'll use a proxy approach
      // Using the cors-anywhere pattern or direct fetch (Deezer allows it for search)
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=20`)}`);
      const data = await res.json();
      setResults(data.data || []);
    } catch (err) {
      console.error('Deezer search failed:', err);
      // Fallback: try direct (may work in some browsers)
      try {
        const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=20`);
        const data = await res.json();
        setResults(data.data || []);
      } catch {
        setResults([]);
      }
    }
    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      {/* Search bar */}
      <div className="px-3 py-2 border-b border-border">
        <form onSubmit={(e) => { e.preventDefault(); search(query); }} className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any song globally..."
            className="w-full bg-surface-1 border border-border/30 rounded-md pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-emerald-500/40"
          />
        </form>
        <p className="text-[8px] text-muted-foreground/40 mt-1 text-center">
          Powered by Deezer · 30s previews · Free worldwide
        </p>
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">No results found</p>
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-8 px-4">
            <Search className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground/60">Search millions of songs</p>
            <p className="text-[9px] text-muted-foreground/40 mt-0.5">Play 30-second previews instantly</p>
          </div>
        )}

        {results.map((track) => {
          const isCurrentlyPlaying = currentPreviewUrl === track.preview && isPlaying;

          return (
            <button
              key={track.id}
              onClick={() => onPlayPreview(track.preview, track.title, track.artist.name, track.album.cover_small)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                isCurrentlyPlaying ? 'bg-emerald-500/10' : 'hover:bg-surface-1'
              }`}
            >
              <div className="w-9 h-9 rounded-sm bg-surface-1 overflow-hidden shrink-0 relative group">
                <img src={track.album.cover_small} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isCurrentlyPlaying ? (
                    <Pause size={14} className="text-white" />
                  ) : (
                    <Play size={14} className="text-white ml-0.5" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isCurrentlyPlaying ? 'text-emerald-400' : 'text-foreground'}`}>
                  {track.title}
                </p>
                <p className="text-[9px] text-muted-foreground truncate">
                  {track.artist.name} · {formatDuration(track.duration)}
                </p>
              </div>
              {isCurrentlyPlaying && (
                <div className="flex gap-[2px] items-end h-3 shrink-0">
                  {[0, 1, 2].map(b => (
                    <motion.div key={b} className="w-[2px] bg-emerald-500 rounded-full"
                      animate={{ height: ['4px', '12px', '4px'] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
