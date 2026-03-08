import { useState, useRef } from 'react';
import { Search, Play, Pause, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string; picture_small: string };
  album: { title: string; cover_small: string; cover_medium?: string };
  preview: string;
  duration: number;
  link: string;
}

interface DeezerSearchTabProps {
  onPlayPreview: (url: string, title: string, artist: string, cover: string) => void;
  currentPreviewUrl: string | null;
  isPlaying: boolean;
}

type DeezerSearchResponse = { data?: DeezerTrack[] } | DeezerTrack[];

export default function DeezerSearchTab({ onPlayPreview, currentPreviewUrl, isPlaying }: DeezerSearchTabProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = async (q: string) => {
    const clean = q.trim();
    if (!clean) {
      setResults([]);
      setSearched(false);
      setErrorMessage(null);
      return;
    }

    setLoading(true);
    setSearched(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('deezer-search', {
        body: { query: clean, limit: 25 },
      });

      if (error) {
        throw error;
      }

      const payload = data as DeezerSearchResponse | null;
      const tracks = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      setResults(tracks.filter((t) => Boolean(t?.preview)));
    } catch (err) {
      console.error('Deezer search failed:', err);
      setErrorMessage('Search failed. Try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div>
      {/* Search bar — large touch target */}
      <div className="px-4 py-3 border-b border-border">
        <form onSubmit={(e) => { e.preventDefault(); search(query); inputRef.current?.blur(); }} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any song globally..."
            enterKeyHint="search"
            className="w-full bg-surface-1 border border-border/30 rounded-xl pl-10 pr-24 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </button>
        </form>
        <p className="text-[9px] text-muted-foreground/40 mt-1.5 text-center">
          Powered by Deezer · 30s previews · Free worldwide
        </p>
      </div>

      {/* Results */}
      <div className="max-h-[50vh] overflow-y-auto overscroll-contain">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">{errorMessage || 'No results found'}</p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              {errorMessage ? 'Please try again in a few seconds.' : 'Try a different search term'}
            </p>
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-12 px-6">
            <Search className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground/60">Search millions of songs</p>
            <p className="text-xs text-muted-foreground/40 mt-1">Play 30-second previews instantly</p>
          </div>
        )}

        {results.map((track) => {
          const active = currentPreviewUrl === track.preview && isPlaying;
          return (
            <button
              key={track.id}
              onClick={() => onPlayPreview(track.preview, track.title, track.artist.name, track.album.cover_medium || track.album.cover_small)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-emerald-500/15 ${
                active ? 'bg-emerald-500/10' : 'hover:bg-surface-1'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-surface-1 overflow-hidden shrink-0 relative">
                <img src={track.album.cover_small} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  {active ? (
                    <Pause size={18} className="text-white" />
                  ) : (
                    <Play size={18} className="text-white ml-0.5" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${active ? 'text-emerald-400' : 'text-foreground'}`}>
                  {track.title}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {track.artist.name} · {fmt(track.duration)}
                </p>
              </div>
              {active && (
                <div className="flex gap-[2px] items-end h-4 shrink-0">
                  {[0, 1, 2].map(b => (
                    <motion.div key={b} className="w-[3px] bg-emerald-500 rounded-full"
                      animate={{ height: ['5px', '16px', '5px'] }}
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

