import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Radio, Shuffle, Music, ExternalLink, Pencil, Gauge, Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { useUserPlaylist, UserPlaylistTrack } from '@/hooks/useUserPlaylist';
import { useRadioSettings } from '@/hooks/useRadioSettings';
import MyPlaylistTab from './MyPlaylistTab';
import { useNavigate } from 'react-router-dom';

interface Track {
  id: string;
  song_name: string;
  song_preview_url: string;
  artist_name?: string | null;
  title: string;
  poster_url: string | null;
  is_priority?: boolean;
  source: 'featured_drop' | 'radio_track';
}

type PlaylistMode = 'loopgate' | 'myplaylist';

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

      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      chimeGain.gain.setValueAtTime(0.4, ctx.currentTime + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      chime.connect(chimeGain).connect(master);
      chime.start(ctx.currentTime + 0.1);
      chime.stop(ctx.currentTime + 0.8);

      const ping = ctx.createOscillator();
      const pingGain = ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(1320, ctx.currentTime + 0.2);
      pingGain.gain.setValueAtTime(0.25, ctx.currentTime + 0.2);
      pingGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
      ping.connect(pingGain).connect(master);
      ping.start(ctx.currentTime + 0.2);
      ping.stop(ctx.currentTime + 0.9);

      setTimeout(() => { ctx.close(); resolve(); }, 900);
    } catch { resolve(); }
  });
}

export default function HeaderMusicPlayer() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [shuffled, setShuffled] = useState(true);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [pitchSemitones, setPitchSemitones] = useState(0);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [playlistMode, setPlaylistMode] = useState<PlaylistMode>('loopgate');
  const [userId, setUserId] = useState<string | null>(null);
  const [myPlaylistIndex, setMyPlaylistIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioModeRef = useRef<PlaylistMode>('loopgate');

  const { myTracks, loading: myLoading, uploading, uploadTrack, deleteTrack, togglePublic, playlistName, renamePlaylist } = useUserPlaylist(userId);
  const { settings, updateSetting } = useRadioSettings(userId);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isMuted = volume === 0;

  // Fetch tracks from both featured_drops AND radio_tracks, priority first
  useEffect(() => {
    const fetchTracks = async () => {
      // Fetch admin radio tracks
      const { data: radioData } = await supabase
        .from('radio_tracks')
        .select('id, song_name, artist_name, audio_url, cover_url, is_priority, track_order')
        .order('is_priority', { ascending: false })
        .order('track_order', { ascending: true });

      // Fetch featured drops
      const { data: dropData } = await supabase
        .from('featured_drops')
        .select('id, song_name, song_preview_url, title, poster_url')
        .not('song_preview_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      const radioTracks: Track[] = (radioData || []).map(t => ({
        id: t.id,
        song_name: t.song_name,
        song_preview_url: t.audio_url,
        artist_name: t.artist_name,
        title: t.artist_name || 'LOOPGATE Radio',
        poster_url: t.cover_url,
        is_priority: t.is_priority,
        source: 'radio_track' as const,
      }));

      const dropTracks: Track[] = (dropData || []).filter(t => t.song_preview_url).map(t => ({
        id: t.id,
        song_name: t.song_name,
        song_preview_url: t.song_preview_url!,
        title: t.title,
        poster_url: t.poster_url,
        is_priority: false,
        source: 'featured_drop' as const,
      }));

      // Priority tracks first, then shuffle the rest
      const priority = radioTracks.filter(t => t.is_priority);
      const nonPriority = shuffleArray([...radioTracks.filter(t => !t.is_priority), ...dropTracks]);
      setTracks([...priority, ...nonPriority]);
      if (priority.length > 0) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(Math.floor(Math.random() * nonPriority.length));
      }
    };
    fetchTracks();
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
    audioModeRef.current = 'loopgate';
    const a = new Audio(track.song_preview_url);
    a.volume = volume;
    a.preservesPitch = false;
    a.playbackRate = playbackRate * Math.pow(2, pitchSemitones / 12);
    audioRef.current = a;
    a.addEventListener('ended', () => {
      setCurrentIndex(i => (i + 1) % tracks.length);
    });
    a.play().then(() => {
      setIsPlaying(true);
      startProgressTracking();
    }).catch(() => {});
  }, [volume, tracks.length, startProgressTracking, stopProgressTracking, playbackRate, pitchSemitones]);

  const playMyTrack = useCallback((track: UserPlaylistTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopProgressTracking();
    setPlaylistMode('myplaylist');
    audioModeRef.current = 'myplaylist';
    const a = new Audio(track.audio_url);
    a.volume = volume;
    a.preservesPitch = false;
    a.playbackRate = playbackRate * Math.pow(2, pitchSemitones / 12);
    audioRef.current = a;
    a.addEventListener('ended', () => {
      setMyPlaylistIndex(i => {
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
  }, [volume, myTracks, startProgressTracking, stopProgressTracking, playbackRate, pitchSemitones]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (playlistMode === 'myplaylist' && myTracks[myPlaylistIndex]) {
      if (audioRef.current && audioRef.current.src && audioModeRef.current === 'myplaylist') {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          startProgressTracking();
        }).catch(() => {});
      } else {
        playMyTrack(myTracks[myPlaylistIndex]);
      }
    } else if (current) {
      if (audioRef.current && audioRef.current.src && audioModeRef.current === 'loopgate') {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          startProgressTracking();
        }).catch(() => {});
      } else {
        playTrack(current);
      }
    }
  }, [isPlaying, pause, current, playTrack, playMyTrack, startProgressTracking, playlistMode, myTracks, myPlaylistIndex]);

  const skip = useCallback(() => {
    setProgress(0);
    setCurrentIndex(i => (i + 1) % tracks.length);
  }, [tracks.length]);

  const prev = useCallback(() => {
    setProgress(0);
    setCurrentIndex(i => (i - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  // Auto-play on first load (respects user settings)
  useEffect(() => {
    if (tracks.length > 0 && !hasAutoPlayed && current) {
      setHasAutoPlayed(true);

      // Check if autoplay is disabled
      if (!settings.autoplay_enabled) return;

      // Check if user wants their own playlist to play by default
      if (settings.default_playlist === 'myplaylist' && myTracks.length > 0) {
        setPlaylistMode('myplaylist');
        const startMyPlayback = async () => {
          if (!introPlayed) {
            setIntroPlayed(true);
            await playIntroChime(volume);
          }
          playMyTrack(myTracks[0]);
        };
        startMyPlayback().catch(() => {});
        return;
      }

      const startPlayback = async () => {
        if (!introPlayed) {
          setIntroPlayed(true);
          await playIntroChime(volume);
        }
        playTrack(current);
      };
      startPlayback().catch(() => {
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
  }, [tracks, myTracks]);

  // When index changes and was playing, auto-play next
  useEffect(() => {
    if (!current) return;
    if (isPlaying && playlistMode === 'loopgate') {
      playTrack(current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.preservesPitch = false;
      audioRef.current.playbackRate = playbackRate * Math.pow(2, pitchSemitones / 12);
    }
  }, [playbackRate, pitchSemitones]);

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

  useEffect(() => () => {
    audioRef.current?.pause();
    stopProgressTracking();
  }, [stopProgressTracking]);

  if (!tracks.length) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-accent">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2" className={isPlaying ? 'stroke-emerald-500' : 'stroke-current text-muted-foreground'} />
            <motion.path d="M16.24 7.76a6 6 0 0 1 0 8.49" className={isPlaying ? 'stroke-emerald-500' : 'stroke-current text-muted-foreground'}
              animate={isPlaying ? { opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] } : { opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: 'center' }} />
            <motion.path d="M7.76 16.24a6 6 0 0 1 0-8.49" className={isPlaying ? 'stroke-emerald-500' : 'stroke-current text-muted-foreground'}
              animate={isPlaying ? { opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] } : { opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: 'center' }} />
            <motion.path d="M19.07 4.93a10 10 0 0 1 0 14.14" className={isPlaying ? 'stroke-emerald-500' : 'stroke-current text-muted-foreground'}
              animate={isPlaying ? { opacity: [0.2, 0.8, 0.2], scale: [1, 1.12, 1] } : { opacity: 1, scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} style={{ transformOrigin: 'center' }} />
            <motion.path d="M4.93 19.07a10 10 0 0 1 0-14.14" className={isPlaying ? 'stroke-emerald-500' : 'stroke-current text-muted-foreground'}
              animate={isPlaying ? { opacity: [0.2, 0.8, 0.2], scale: [1, 1.12, 1] } : { opacity: 1, scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} style={{ transformOrigin: 'center' }} />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-72 bg-surface-0 border-border p-0 overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setPlaylistMode('loopgate')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              playlistMode === 'loopgate' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Radio size={12} className="inline mr-1 -mt-0.5" /> LOOPGATE
          </button>
          <button
            onClick={() => setPlaylistMode('myplaylist')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${
              playlistMode === 'myplaylist' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Music size={12} className="-mt-0.5" /> {playlistName?.toUpperCase() || 'MY PLAYLIST'}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-2 transition-colors ${showSettings ? 'text-emerald-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Settings size={13} />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && userId && (
          <div className="px-4 py-3 border-b border-border space-y-3 bg-surface-1/50">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Radio Settings</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">Autoplay on open</span>
              <Switch
                checked={settings.autoplay_enabled}
                onCheckedChange={(v) => updateSetting('autoplay_enabled', v)}
                className="scale-75"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">Default to My Playlist</span>
              <Switch
                checked={settings.default_playlist === 'myplaylist'}
                onCheckedChange={(v) => updateSetting('default_playlist', v ? 'myplaylist' : 'loopgate')}
                className="scale-75"
              />
            </div>
          </div>
        )}

        {/* Now Playing Hero */}
        <div className="relative">
          {playlistMode === 'loopgate' && current?.poster_url && (
            <div className="absolute inset-0 overflow-hidden">
              <img src={current.poster_url} alt="" className="w-full h-full object-cover opacity-20 blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-0" />
            </div>
          )}
          <div className="relative p-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-[2px] items-end h-3">
                {isPlaying ? (
                  [0, 1, 2, 3].map(b => (
                    <motion.div key={b} className="w-[2px] bg-emerald-500 rounded-full"
                      animate={{ height: ['3px', '12px', '3px'] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: b * 0.12 }} />
                  ))
                ) : (
                  [0, 1, 2, 3].map(b => (
                    <div key={b} className="w-[2px] h-[3px] bg-muted-foreground/40 rounded-full" />
                  ))
                )}
              </div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-emerald-500 font-bold">
                {playlistMode === 'loopgate' ? 'LOOPGATE Playlist' : playlistName}
              </span>
              {playlistMode === 'myplaylist' && userId && (
                editingName ? (
                  <form className="ml-1" onSubmit={(e) => { e.preventDefault(); renamePlaylist(nameInput); setEditingName(false); }}>
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onBlur={() => { renamePlaylist(nameInput); setEditingName(false); }}
                      maxLength={40}
                      className="text-[9px] bg-transparent border-b border-emerald-500 text-foreground outline-none w-20"
                    />
                  </form>
                ) : (
                  <button onClick={() => { setNameInput(playlistName); setEditingName(true); }} className="ml-1 text-muted-foreground hover:text-emerald-500">
                    <Pencil size={8} />
                  </button>
                )
              )}
            </div>
            <p className="text-sm font-display text-foreground truncate">
              {playlistMode === 'loopgate'
                ? current?.song_name
                : (myTracks[myPlaylistIndex]?.track_name || 'No tracks yet')}
            </p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {playlistMode === 'loopgate'
                ? (current?.artist_name || current?.title)
                : (myTracks[myPlaylistIndex]?.artist_name || '')}
            </p>
          </div>
        </div>

        {/* Seekable Progress Bar */}
        <div className="px-4 pb-1">
          <Slider
            value={[progress]}
            onValueChange={([v]) => {
              setProgress(v);
              if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
                audioRef.current.currentTime = (v / 100) * audioRef.current.duration;
              }
            }}
            max={100}
            step={0.5}
            className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-0 [&_.range]:bg-emerald-500 [&_[role=slider]]:touch-none"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={toggleShuffle}
            className={`p-1.5 transition-colors ${shuffled ? 'text-emerald-500' : 'text-muted-foreground hover:text-foreground'}`}>
            <Shuffle size={14} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (playlistMode === 'myplaylist' && myTracks.length > 0) {
                  setProgress(0);
                  const newIdx = (myPlaylistIndex - 1 + myTracks.length) % myTracks.length;
                  setMyPlaylistIndex(newIdx);
                  playMyTrack(myTracks[newIdx]);
                } else { prev(); }
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <SkipBack size={16} />
            </button>
            <button onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition-colors">
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <button
              onClick={() => {
                if (playlistMode === 'myplaylist' && myTracks.length > 0) {
                  setProgress(0);
                  const newIdx = (myPlaylistIndex + 1) % myTracks.length;
                  setMyPlaylistIndex(newIdx);
                  playMyTrack(myTracks[newIdx]);
                } else { skip(); }
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <SkipForward size={16} />
            </button>
          </div>
          <button onClick={toggleMute} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>

        {/* Volume Slider — mobile-safe with touch-none */}
        <div className="px-4 pb-2 flex items-center gap-3">
          <VolumeX size={12} className="text-muted-foreground shrink-0" />
          <Slider value={[volume * 100]} onValueChange={([v]) => setVolume(v / 100)} max={100} step={1}
            className="flex-1 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-0 [&_.range]:bg-emerald-500 [&_[role=slider]]:touch-none [&_[role=slider]]:select-none" />
          <Volume2 size={12} className="text-muted-foreground shrink-0" />
        </div>

        {/* Speed Presets */}
        <div className="px-4 pb-1.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1">
              <Gauge size={11} className="text-muted-foreground" />
              <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Speed</span>
            </div>
            <button
              onClick={() => setPlaybackRate(1.0)}
              className={`text-[9px] font-mono font-bold px-2 py-1 rounded transition-colors ${
                playbackRate === 1.0 ? 'text-muted-foreground' : 'text-emerald-500 hover:text-emerald-400 bg-emerald-500/10'
              }`}
            >
              {playbackRate < 1 ? '🌙' : playbackRate > 1 ? '⚡' : '•'} {playbackRate.toFixed(2)}x
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[0.5, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0].map(rate => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`text-[10px] font-mono py-2 rounded-md transition-colors tap-target ${
                  Math.abs(playbackRate - rate) < 0.01
                    ? 'text-emerald-500 bg-emerald-500/15 font-bold border border-emerald-500/30'
                    : 'text-muted-foreground bg-surface-2 hover:text-foreground hover:bg-surface-3 border border-transparent'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Pitcher — Real pitch shift in semitones — mobile-safe */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Pitcher</span>
            <span className="text-[8px] text-muted-foreground/60 ml-auto">
              {pitchSemitones === 0 ? 'default' : `${pitchSemitones > 0 ? '+' : ''}${pitchSemitones} st`}
            </span>
            {pitchSemitones !== 0 && (
              <button onClick={() => setPitchSemitones(0)} className="text-[8px] text-emerald-500 hover:text-emerald-400 font-bold ml-1">
                reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-muted-foreground font-bold shrink-0">−8</span>
            <Slider
              value={[pitchSemitones]}
              onValueChange={([v]) => setPitchSemitones(v)}
              min={-8}
              max={8}
              step={1}
              className="flex-1 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-0 [&_.range]:bg-emerald-500 [&_[role=slider]]:touch-none [&_[role=slider]]:select-none"
            />
            <span className="text-[9px] text-muted-foreground font-bold shrink-0">+8</span>
          </div>
        </div>

        {/* Track Lists */}
        {playlistMode === 'loopgate' ? (
          <div className="max-h-48 overflow-y-auto border-t border-border">
            {tracks.slice(0, 15).map((track, i) => (
              <button key={track.id}
                onClick={() => {
                  setPlaylistMode('loopgate');
                  setProgress(0);
                  setCurrentIndex(i);
                  if (!isPlaying) setTimeout(() => playTrack(track), 50);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  i === currentIndex && playlistMode === 'loopgate' ? 'bg-emerald-500/10 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
                }`}>
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
                  <p className="text-[9px] text-muted-foreground truncate">{track.artist_name || track.title}</p>
                </div>
                {track.is_priority && (
                  <span className="text-[7px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded-full shrink-0">⭐</span>
                )}
                {i === currentIndex && playlistMode === 'loopgate' && isPlaying && (
                  <div className="flex gap-[2px] items-end h-3 shrink-0">
                    {[0, 1, 2].map(b => (
                      <motion.div key={b} className="w-[2px] bg-emerald-500 rounded-full"
                        animate={{ height: ['4px', '12px', '4px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }} />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <MyPlaylistTab
            tracks={myTracks}
            loading={myLoading}
            uploading={uploading}
            currentTrackId={playlistMode === 'myplaylist' ? myTracks[myPlaylistIndex]?.id ?? null : null}
            isPlaying={isPlaying && playlistMode === 'myplaylist'}
            isLoggedIn={!!userId}
            onUpload={uploadTrack}
            onPlay={(track, idx) => {
              setPlaylistMode('myplaylist');
              setMyPlaylistIndex(idx);
              setProgress(0);
              playMyTrack(track);
            }}
            onDelete={deleteTrack}
            onTogglePublic={togglePublic}
          />
        )}

        {/* Link to full playlists page */}
        <button
          onClick={() => navigate('/playlists')}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-emerald-500 transition-colors"
        >
          <ExternalLink size={11} /> Browse Curated Playlists
        </button>
      </PopoverContent>
    </Popover>
  );
}
