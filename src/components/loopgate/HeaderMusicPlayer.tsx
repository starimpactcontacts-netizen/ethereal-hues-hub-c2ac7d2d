import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Radio, Shuffle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface Track {
  id: string;
  song_name: string;
  song_preview_url: string;
  title: string;
  poster_url: string | null;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HeaderMusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [shuffled, setShuffled] = useState(true);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      const { data } = await supabase
        .from('featured_drops')
        .select('id, song_name, song_preview_url, title, poster_url')
        .not('song_preview_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) {
        const valid = data.filter(t => t.song_preview_url) as Track[];
        setTracks(shuffled ? shuffleArray(valid) : valid);
      }
    };
    fetchTracks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = tracks[currentIndex];

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      if (audioRef.current) {
        const dur = audioRef.current.duration;
        if (dur && !isNaN(dur)) {
          setProgress((audioRef.current.currentTime / dur) * 100);
        }
      }
    }, 200);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const playTrack = useCallback((track: Track) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopProgressTracking();
    const a = new Audio(track.song_preview_url);
    a.volume = muted ? 0 : 0.4;
    audioRef.current = a;
    a.addEventListener('ended', () => {
      setCurrentIndex(i => (i + 1) % tracks.length);
    });
    a.play().then(() => {
      setIsPlaying(true);
      startProgressTracking();
    }).catch(() => {});
  }, [muted, tracks.length, startProgressTracking, stopProgressTracking]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (current) {
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          startProgressTracking();
        }).catch(() => {});
      } else {
        playTrack(current);
      }
    }
  }, [isPlaying, pause, current, playTrack, startProgressTracking]);

  const skip = useCallback(() => {
    setProgress(0);
    setCurrentIndex(i => (i + 1) % tracks.length);
  }, [tracks.length]);

  const prev = useCallback(() => {
    setProgress(0);
    setCurrentIndex(i => (i - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  // When index changes and was playing, auto-play next
  useEffect(() => {
    if (!current) return;
    if (isPlaying) {
      playTrack(current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const toggleShuffle = useCallback(() => {
    setShuffled(s => {
      const next = !s;
      setTracks(t => next ? shuffleArray(t) : t);
      setCurrentIndex(0);
      return next;
    });
  }, []);

  // Cleanup
  useEffect(() => () => {
    audioRef.current?.pause();
    stopProgressTracking();
  }, [stopProgressTracking]);

  if (!tracks.length) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative text-foreground hover:text-gold hover:bg-gold/10"
        >
          <Radio className="h-5 w-5" />
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
        className="w-72 bg-surface-0 border-border p-0 overflow-hidden"
      >
        {/* Now Playing Hero */}
        <div className="relative">
          {current?.poster_url && (
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={current.poster_url}
                alt=""
                className="w-full h-full object-cover opacity-20 blur-sm"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-0" />
            </div>
          )}
          <div className="relative p-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-[2px] items-end h-3">
                {isPlaying ? (
                  [0, 1, 2, 3].map(b => (
                    <motion.div
                      key={b}
                      className="w-[2px] bg-gold rounded-full"
                      animate={{ height: ['3px', '12px', '3px'] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: b * 0.12 }}
                    />
                  ))
                ) : (
                  [0, 1, 2, 3].map(b => (
                    <div key={b} className="w-[2px] h-[3px] bg-muted-foreground/40 rounded-full" />
                  ))
                )}
              </div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-gold font-bold">
                LOOPGATE Radio
              </span>
            </div>
            <p className="text-sm font-display text-foreground truncate">{current?.song_name}</p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{current?.title}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-1">
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 transition-colors ${shuffled ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Shuffle size={14} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipBack size={16} />
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
          <button
            onClick={() => setMuted(m => !m)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>

        {/* Track List */}
        <div className="max-h-48 overflow-y-auto border-t border-border">
          {tracks.slice(0, 12).map((track, i) => (
            <button
              key={track.id}
              onClick={() => {
                setProgress(0);
                setCurrentIndex(i);
                if (!isPlaying) {
                  setTimeout(() => playTrack(track), 50);
                }
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                i === currentIndex ? 'bg-gold/10 text-gold' : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
              }`}
            >
              {/* Poster Thumb */}
              <div className="w-8 h-8 rounded-sm bg-surface-1 overflow-hidden shrink-0">
                {track.poster_url ? (
                  <img src={track.poster_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Radio size={12} className="text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{track.song_name}</p>
                <p className="text-[9px] text-muted-foreground truncate">{track.title}</p>
              </div>
              {i === currentIndex && isPlaying && (
                <div className="flex gap-[2px] items-end h-3 shrink-0">
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
