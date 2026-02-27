import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Radio, Shuffle, Music } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserRadio, UserRadioTrack } from '@/hooks/useUserRadio';
import MyRadioTab from './MyRadioTab';

interface Track {
  id: string;
  song_name: string;
  song_preview_url: string;
  title: string;
  poster_url: string | null;
}

type RadioMode = 'loopgate' | 'myradio';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Iconic LOOPGATE intro chime using Web Audio API
function playIntroChime(vol: number): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const master = ctx.createGain();
      master.gain.value = vol * 0.6;
      master.connect(ctx.destination);

      // Deep sub hit
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(55, ctx.currentTime);
      sub.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.4);
      subGain.gain.setValueAtTime(0.7, ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      sub.connect(subGain).connect(master);
      sub.start(ctx.currentTime);
      sub.stop(ctx.currentTime + 0.5);

      // Rising shimmer tone
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(600, ctx.currentTime + 0.05);
      shimmer.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
      shimmerGain.gain.setValueAtTime(0, ctx.currentTime);
      shimmerGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      shimmer.connect(shimmerGain).connect(master);
      shimmer.start(ctx.currentTime + 0.05);
      shimmer.stop(ctx.currentTime + 0.6);

      // Bright chime hit
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      chimeGain.gain.setValueAtTime(0.4, ctx.currentTime + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      chime.connect(chimeGain).connect(master);
      chime.start(ctx.currentTime + 0.1);
      chime.stop(ctx.currentTime + 0.8);

      // Second harmonic ping
      const ping = ctx.createOscillator();
      const pingGain = ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(1320, ctx.currentTime + 0.2);
      pingGain.gain.setValueAtTime(0.25, ctx.currentTime + 0.2);
      pingGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
      ping.connect(pingGain).connect(master);
      ping.start(ctx.currentTime + 0.2);
      ping.stop(ctx.currentTime + 0.9);

      setTimeout(() => {
        ctx.close();
        resolve();
      }, 900);
    } catch {
      resolve();
    }
  });
}

export default function HeaderMusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [shuffled, setShuffled] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [radioMode, setRadioMode] = useState<RadioMode>('loopgate');
  const [userId, setUserId] = useState<string | null>(null);
  const [myRadioIndex, setMyRadioIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const { myTracks, loading: myLoading, uploading, uploadTrack, deleteTrack, togglePublic } = useUserRadio(userId);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isMuted = volume === 0;

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
    a.volume = volume;
    audioRef.current = a;
    a.addEventListener('ended', () => {
      setCurrentIndex(i => (i + 1) % tracks.length);
    });
    a.play().then(() => {
      setIsPlaying(true);
      startProgressTracking();
    }).catch(() => {});
  }, [volume, tracks.length, startProgressTracking, stopProgressTracking]);
  const playMyTrack = useCallback((track: UserRadioTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopProgressTracking();
    setRadioMode('myradio');
    const a = new Audio(track.audio_url);
    a.volume = volume;
    audioRef.current = a;
    a.addEventListener('ended', () => {
      setMyRadioIndex(i => {
        const next = (i + 1) % myTracks.length;
        if (myTracks[next]) {
          setTimeout(() => playMyTrack(myTracks[next]), 50);
        }
        return next;
      });
    });
    a.play().then(() => {
      setIsPlaying(true);
      startProgressTracking();
    }).catch(() => {});
  }, [volume, myTracks, startProgressTracking, stopProgressTracking]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (radioMode === 'myradio' && myTracks[myRadioIndex]) {
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          startProgressTracking();
        }).catch(() => {});
      } else {
        playMyTrack(myTracks[myRadioIndex]);
      }
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
  }, [isPlaying, pause, current, playTrack, playMyTrack, startProgressTracking, radioMode, myTracks, myRadioIndex]);

  const skip = useCallback(() => {
    setProgress(0);
    setCurrentIndex(i => (i + 1) % tracks.length);
  }, [tracks.length]);

  const prev = useCallback(() => {
    setProgress(0);
    setCurrentIndex(i => (i - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  // Auto-play on first load — intro chime then music
  useEffect(() => {
    if (tracks.length > 0 && !hasAutoPlayed && current) {
      setHasAutoPlayed(true);
      const startPlayback = async () => {
        if (!introPlayed) {
          setIntroPlayed(true);
          await playIntroChime(volume);
        }
        playTrack(current);
      };
      // Try immediately
      startPlayback().catch(() => {
        // Browser blocked autoplay — start on first user interaction
        const unlock = () => {
          startPlayback();
          window.removeEventListener('click', unlock);
          window.removeEventListener('touchstart', unlock);
          window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  // When index changes and was playing, auto-play next
  useEffect(() => {
    if (!current) return;
    if (isPlaying) {
      playTrack(current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Volume change
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggleShuffle = useCallback(() => {
    setShuffled(s => {
      const next = !s;
      setTracks(t => next ? shuffleArray(t) : t);
      setCurrentIndex(0);
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setVolume(v => v === 0 ? 0.3 : 0);
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
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-accent"
        >
          {/* Custom Radio icon with animated waves */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Center dot - always visible */}
            <circle
              cx="12"
              cy="12"
              r="2"
              className={isPlaying ? 'stroke-emerald-500' : 'stroke-current text-muted-foreground'}
            />
            {/* Inner wave arcs */}
            <motion.path
              d="M16.24 7.76a6 6 0 0 1 0 8.49"
              className={isPlaying ? 'stroke-emerald-500' : 'stroke-current text-muted-foreground'}
              animate={isPlaying ? {
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.05, 1],
              } : { opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: 'center' }}
            />
            <motion.path
              d="M7.76 16.24a6 6 0 0 1 0-8.49"
              className={isPlaying ? 'stroke-emerald-500' : 'stroke-current text-muted-foreground'}
              animate={isPlaying ? {
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.05, 1],
              } : { opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: 'center' }}
            />
            {/* Outer wave arcs - throb outward when playing */}
            <motion.path
              d="M19.07 4.93a10 10 0 0 1 0 14.14"
              className={isPlaying ? 'stroke-emerald-500' : 'stroke-current text-muted-foreground'}
              animate={isPlaying ? {
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.12, 1],
              } : { opacity: 1, scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              style={{ transformOrigin: 'center' }}
            />
            <motion.path
              d="M4.93 19.07a10 10 0 0 1 0-14.14"
              className={isPlaying ? 'stroke-emerald-500' : 'stroke-current text-muted-foreground'}
              animate={isPlaying ? {
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.12, 1],
              } : { opacity: 1, scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              style={{ transformOrigin: 'center' }}
            />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-72 bg-surface-0 border-border p-0 overflow-hidden"
      >
        {/* Tab Switcher - only show tabs if logged in */}
        {userId ? (
          <div className="flex border-b border-border">
            <button
              onClick={() => setRadioMode('loopgate')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                radioMode === 'loopgate' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Radio size={12} className="inline mr-1 -mt-0.5" /> LOOPGATE
            </button>
            <button
              onClick={() => setRadioMode('myradio')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                radioMode === 'myradio' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Music size={12} className="inline mr-1 -mt-0.5" /> MY RADIO
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
            <Radio size={12} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">LOOPGATE Radio</span>
          </div>
        )}

        {/* Now Playing Hero */}
        <div className="relative">
          {radioMode === 'loopgate' && current?.poster_url && (
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
                      className="w-[2px] bg-emerald-500 rounded-full"
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
              <span className="text-[9px] uppercase tracking-[0.2em] text-emerald-500 font-bold">
                {radioMode === 'loopgate' ? 'LOOPGATE Radio' : 'My Radio'}
              </span>
            </div>
            <p className="text-sm font-display text-foreground truncate">
              {radioMode === 'loopgate'
                ? current?.song_name
                : (myTracks[myRadioIndex]?.track_name || 'No tracks yet')}
            </p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {radioMode === 'loopgate'
                ? current?.title
                : (myTracks[myRadioIndex]?.artist_name || '')}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-1">
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 transition-colors ${shuffled ? 'text-emerald-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Shuffle size={14} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (radioMode === 'myradio' && myTracks.length > 0) {
                  setProgress(0);
                  const newIdx = (myRadioIndex - 1 + myTracks.length) % myTracks.length;
                  setMyRadioIndex(newIdx);
                  playMyTrack(myTracks[newIdx]);
                } else {
                  prev();
                }
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <button
              onClick={() => {
                if (radioMode === 'myradio' && myTracks.length > 0) {
                  setProgress(0);
                  const newIdx = (myRadioIndex + 1) % myTracks.length;
                  setMyRadioIndex(newIdx);
                  playMyTrack(myTracks[newIdx]);
                } else {
                  skip();
                }
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipForward size={16} />
            </button>
          </div>
          <button
            onClick={toggleMute}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>

        {/* Volume Slider */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <VolumeX size={12} className="text-muted-foreground shrink-0" />
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => setVolume(v / 100)}
            max={100}
            step={1}
            className="flex-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-0 [&_.range]:bg-emerald-500"
          />
          <Volume2 size={12} className="text-muted-foreground shrink-0" />
        </div>

        {/* Track Lists */}
        {radioMode === 'loopgate' ? (
          <div className="max-h-48 overflow-y-auto border-t border-border">
            {tracks.slice(0, 12).map((track, i) => (
              <button
                key={track.id}
                onClick={() => {
                  setRadioMode('loopgate');
                  setProgress(0);
                  setCurrentIndex(i);
                  if (!isPlaying) {
                    setTimeout(() => playTrack(track), 50);
                  }
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  i === currentIndex && radioMode === 'loopgate' ? 'bg-emerald-500/10 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
                }`}
              >
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
                {i === currentIndex && radioMode === 'loopgate' && isPlaying && (
                  <div className="flex gap-[2px] items-end h-3 shrink-0">
                    {[0, 1, 2].map(b => (
                      <motion.div
                        key={b}
                        className="w-[2px] bg-emerald-500 rounded-full"
                        animate={{ height: ['4px', '12px', '4px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }}
                      />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <MyRadioTab
            tracks={myTracks}
            loading={myLoading}
            uploading={uploading}
            currentTrackId={radioMode === 'myradio' ? myTracks[myRadioIndex]?.id ?? null : null}
            isPlaying={isPlaying && radioMode === 'myradio'}
            isLoggedIn={!!userId}
            onUpload={uploadTrack}
            onPlay={(track, idx) => {
              setRadioMode('myradio');
              setMyRadioIndex(idx);
              setProgress(0);
              playMyTrack(track);
            }}
            onDelete={deleteTrack}
            onTogglePublic={togglePublic}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
