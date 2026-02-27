import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface Track {
  id: string;
  song_name: string;
  song_preview_url: string;
  title: string;
}

export default function HeaderMusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('featured_drops')
        .select('id, song_name, song_preview_url, title')
        .not('song_preview_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setTracks(data.filter(t => t.song_preview_url) as Track[]);
    };
    fetch();
  }, []);

  const current = tracks[currentIndex];

  const play = useCallback(() => {
    if (!current) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(current.song_preview_url);
      audioRef.current.volume = 0.4;
      audioRef.current.addEventListener('ended', () => {
        setCurrentIndex(i => (i + 1) % tracks.length);
      });
    }
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [current, tracks.length]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const skip = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentIndex(i => (i + 1) % tracks.length);
    setIsPlaying(false);
  }, [tracks.length]);

  // Auto-play next track when index changes and was playing
  useEffect(() => {
    if (!current) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Only auto-continue if was playing
    if (isPlaying) {
      const a = new Audio(current.song_preview_url);
      a.volume = muted ? 0 : 0.4;
      audioRef.current = a;
      a.addEventListener('ended', () => {
        setCurrentIndex(i => (i + 1) % tracks.length);
      });
      a.play().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  // Cleanup
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  if (!tracks.length) return null;

  const togglePlay = () => (isPlaying ? pause() : play());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative text-foreground hover:text-gold hover:bg-gold/10"
        >
          <Music className="h-5 w-5" />
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gold rounded-full"
              >
                <motion.div
                  className="w-full h-full bg-gold rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-64 bg-surface-0 border-border p-0 overflow-hidden"
      >
        {/* Now Playing */}
        <div className="p-3 border-b border-border">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
            {isPlaying ? 'Now Playing' : 'Featured Drops'}
          </p>
          <p className="text-sm font-display text-foreground truncate">{current?.song_name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{current?.title}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-3">
          <button
            onClick={() => setMuted(m => !m)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gold text-black hover:bg-gold/80 transition-colors"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button
            onClick={skip}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Track List */}
        <div className="max-h-40 overflow-y-auto border-t border-border">
          {tracks.slice(0, 8).map((track, i) => (
            <button
              key={track.id}
              onClick={() => {
                if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
                setCurrentIndex(i);
                setIsPlaying(false);
                setTimeout(() => {
                  const a = new Audio(track.song_preview_url);
                  a.volume = muted ? 0 : 0.4;
                  audioRef.current = a;
                  a.addEventListener('ended', () => setCurrentIndex(idx => (idx + 1) % tracks.length));
                  a.play().then(() => setIsPlaying(true)).catch(() => {});
                }, 50);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                i === currentIndex ? 'bg-gold/10 text-gold' : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
              }`}
            >
              <span className="text-[10px] w-4 text-center font-mono">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{track.song_name}</p>
              </div>
              {i === currentIndex && isPlaying && (
                <div className="flex gap-[2px] items-end h-3">
                  {[0, 1, 2].map(b => (
                    <motion.div
                      key={b}
                      className="w-[2px] bg-gold rounded-full"
                      animate={{ height: ['4px', '12px', '4px'] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }}
                    />
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
