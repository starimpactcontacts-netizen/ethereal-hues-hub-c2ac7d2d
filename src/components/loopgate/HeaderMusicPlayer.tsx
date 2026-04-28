import { useState, useRef, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Radio, Shuffle, Music, ExternalLink, Pencil, Settings, Search, Send, X, Repeat, Repeat1 } from 'lucide-react';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { useUserPlaylist, UserPlaylistTrack } from '@/hooks/useUserPlaylist';
import { useRadioSettings } from '@/hooks/useRadioSettings';
import MyPlaylistTab from './MyPlaylistTab';
import DeezerSearchTab from './DeezerSearchTab';
import PitchToRadio from './PitchToRadio';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface Track {
  id: string;
  song_name: string;
  song_preview_url: string;
  artist_name?: string | null;
  title: string;
  poster_url: string | null;
  is_priority?: boolean;
  source: 'featured_drop' | 'radio_track' | 'deezer';
}

type TabMode = 'loopgate' | 'myplaylist' | 'search' | 'pitch';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.03);
  const [shuffled, setShuffled] = useState(true);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [pitchSemitones, setPitchSemitones] = useState(0);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabMode>('loopgate');
  const [playlistMode, setPlaylistMode] = useState<'loopgate' | 'myplaylist' | 'deezer'>('loopgate');
  const [userId, setUserId] = useState<string | null>(null);
  const [myPlaylistIndex, setMyPlaylistIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [deezerNowPlaying, setDeezerNowPlaying] = useState<{ url: string; title: string; artist: string; cover: string } | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(true); // Loop on by default for theme song
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioModeRef = useRef<string>('loopgate');

  const { myTracks, loading: myLoading, uploading, uploadTrack, uploadCover, deleteTrack, togglePublic, playlistName, renamePlaylist } = useUserPlaylist(userId);
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

  // Theme song — always first in the playlist
  const THEME_TRACK: Track = {
    id: '__loopgate_theme__',
    song_name: 'Virtuoso',
    song_preview_url: '/audio/loopgate-theme.mp3?v=quietmix2',
    artist_name: 'Loneliness x Sace',
    title: 'LOOPGATE Theme',
    poster_url: '/images/loopgate-logo-cover.jpeg',
    is_priority: true,
    source: 'radio_track',
  };

  useEffect(() => {
    const fetchTracks = async () => {
      const { data: radioData } = await supabase
        .from('radio_tracks')
        .select('id, song_name, artist_name, audio_url, cover_url, is_priority, track_order')
        .order('is_priority', { ascending: false })
        .order('track_order', { ascending: true });

      const { data: dropData } = await supabase
        .from('featured_drops')
        .select('id, song_name, song_preview_url, title, poster_url')
        .not('song_preview_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      const radioTracks: Track[] = (radioData || []).map(t => ({
        id: t.id, song_name: t.song_name, song_preview_url: t.audio_url,
        artist_name: t.artist_name, title: t.artist_name || 'LOOPGATE Radio',
        poster_url: t.cover_url, is_priority: t.is_priority, source: 'radio_track' as const,
      }));

      const dropTracks: Track[] = (dropData || []).filter(t => t.song_preview_url).map(t => ({
        id: t.id, song_name: t.song_name, song_preview_url: t.song_preview_url!,
        title: t.title, poster_url: t.poster_url, is_priority: false, source: 'featured_drop' as const,
      }));

      const priority = radioTracks.filter(t => t.is_priority);
      const nonPriority = shuffleArray([...radioTracks.filter(t => !t.is_priority), ...dropTracks]);
      // Theme song always first
      setTracks([THEME_TRACK, ...priority, ...nonPriority]);
      setCurrentIndex(0); // Start on theme song
    };
    fetchTracks();
  }, []);

  const current = tracks[currentIndex];

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      if (audioRef.current) {
        const dur = audioRef.current.duration;
        if (dur && !isNaN(dur)) setProgress((audioRef.current.currentTime / dur) * 100);
      }
    }, 200);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) { clearInterval(progressInterval.current); progressInterval.current = null; }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    stopProgressTracking();
  }, [stopProgressTracking]);

  const playAudioUrl = useCallback((url: string, mode: string, onEnded: () => void) => {
    cleanupAudio();
    setAudioError(false);
    setProgress(0);
    audioModeRef.current = mode;

    const a = new Audio(url);
    a.preload = 'auto';
    a.volume = volume;
    a.preservesPitch = false;
    a.playbackRate = playbackRate * Math.pow(2, pitchSemitones / 12);
    audioRef.current = a;

    a.addEventListener('ended', onEnded);
    a.loop = loopEnabled;
    a.addEventListener('error', () => {
      setAudioError(true);
      setIsPlaying(false);
      stopProgressTracking();
    });

    const tryPlay = () => {
      a.play().then(() => {
        setIsPlaying(true);
        setAudioError(false);
        startProgressTracking();
      }).catch(() => {});
    };

    if (a.readyState >= 2) tryPlay();
    else a.addEventListener('canplay', tryPlay, { once: true });
  }, [volume, playbackRate, pitchSemitones, loopEnabled, cleanupAudio, startProgressTracking, stopProgressTracking]);

  const playTrack = useCallback((track: Track) => {
    setPlaylistMode('loopgate');
    setDeezerNowPlaying(null);
    playAudioUrl(track.song_preview_url, 'loopgate', () => {
      setCurrentIndex(i => (i + 1) % tracks.length);
    });
  }, [playAudioUrl, tracks.length]);

  const playMyTrack = useCallback((track: UserPlaylistTrack, nextTracks: UserPlaylistTrack[], nextIdx: number) => {
    setPlaylistMode('myplaylist');
    setDeezerNowPlaying(null);
    playAudioUrl(track.audio_url, 'myplaylist', () => {
      const next = (nextIdx + 1) % nextTracks.length;
      if (nextTracks[next]) {
        setMyPlaylistIndex(next);
        setTimeout(() => {
          playAudioUrl(nextTracks[next].audio_url, 'myplaylist', () => {});
        }, 50);
      }
    });
  }, [playAudioUrl]);

  const playDeezerPreview = useCallback((url: string, title: string, artist: string, cover: string) => {
    if (deezerNowPlaying?.url === url && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      stopProgressTracking();
      return;
    }
    setPlaylistMode('deezer');
    setDeezerNowPlaying({ url, title, artist, cover });
    playAudioUrl(url, 'deezer', () => {
      setIsPlaying(false);
      setProgress(0);
    });
  }, [playAudioUrl, deezerNowPlaying, isPlaying, stopProgressTracking]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const togglePlay = useCallback(() => {
    if (isPlaying) { pause(); return; }
    if (playlistMode === 'deezer' && deezerNowPlaying) {
      if (audioRef.current && audioModeRef.current === 'deezer') {
        audioRef.current.play().then(() => { setIsPlaying(true); startProgressTracking(); }).catch(() => {});
      } else {
        playDeezerPreview(deezerNowPlaying.url, deezerNowPlaying.title, deezerNowPlaying.artist, deezerNowPlaying.cover);
      }
    } else if (playlistMode === 'myplaylist' && myTracks[myPlaylistIndex]) {
      if (audioRef.current && audioModeRef.current === 'myplaylist') {
        audioRef.current.play().then(() => { setIsPlaying(true); startProgressTracking(); }).catch(() => {});
      } else {
        playMyTrack(myTracks[myPlaylistIndex], myTracks, myPlaylistIndex);
      }
    } else if (current) {
      if (audioRef.current && audioModeRef.current === 'loopgate') {
        audioRef.current.play().then(() => { setIsPlaying(true); startProgressTracking(); }).catch(() => {});
      } else {
        playTrack(current);
      }
    }
  }, [isPlaying, pause, current, playTrack, playMyTrack, playDeezerPreview, startProgressTracking, playlistMode, myTracks, myPlaylistIndex, deezerNowPlaying]);

  const skip = useCallback(() => {
    setProgress(0);
    setCurrentIndex(i => (i + 1) % tracks.length);
  }, [tracks.length]);

  const prev = useCallback(() => {
    setProgress(0);
    setCurrentIndex(i => (i - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  // Autoplay disabled — user must manually press play
  // useEffect(() => { ... }, [tracks]);

  useEffect(() => {
    if (!current) return;
    if (isPlaying && playlistMode === 'loopgate') playTrack(current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
  useEffect(() => { if (audioRef.current) audioRef.current.loop = loopEnabled; }, [loopEnabled]);
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

  const toggleMute = useCallback(() => { setVolume(v => v === 0 ? 0.03 : 0); }, []);
  useEffect(() => () => { cleanupAudio(); }, [cleanupAudio]);

  const nowPlayingName = playlistMode === 'deezer' ? deezerNowPlaying?.title
    : playlistMode === 'myplaylist' ? (myTracks[myPlaylistIndex]?.track_name || 'No tracks')
    : current?.song_name;
  const nowPlayingArtist = playlistMode === 'deezer' ? deezerNowPlaying?.artist
    : playlistMode === 'myplaylist' ? (myTracks[myPlaylistIndex]?.artist_name || '')
    : (current?.artist_name || current?.title);
  const nowPlayingCover = playlistMode === 'deezer' ? deezerNowPlaying?.cover
    : playlistMode === 'myplaylist' ? myTracks[myPlaylistIndex]?.cover_url
    : current?.poster_url;
  const nowPlayingLabel = playlistMode === 'deezer' ? 'Deezer Preview'
    : playlistMode === 'myplaylist' ? playlistName
    : 'LOOPGATE Playlist';

  if (!tracks.length) return null;

  const tabs: { key: TabMode; label: string; icon: React.ReactNode }[] = [
    { key: 'loopgate', label: 'Radio', icon: <Radio size={13} /> },
    { key: 'myplaylist', label: 'Mine', icon: <Music size={13} /> },
    { key: 'search', label: 'Search', icon: <Search size={13} /> },
    { key: 'pitch', label: 'Pitch', icon: <Send size={13} /> },
  ];

  const triggerButton = isMobile ? (
    <button
      onClick={() => setOpen(true)}
      className="relative flex items-center justify-center w-10 h-10 transition-colors hover:bg-accent"
    >
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
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="relative flex items-center gap-2 px-3 py-2 transition-colors hover:bg-white/[0.04] border border-white/[0.06] group"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%)', fontFamily: 'Teko, sans-serif' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" className={isPlaying ? 'stroke-emerald-400' : 'stroke-current text-white/40'} />
        <motion.path d="M16.24 7.76a6 6 0 0 1 0 8.49" className={isPlaying ? 'stroke-emerald-400' : 'stroke-current text-white/40'}
          animate={isPlaying ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.path d="M7.76 16.24a6 6 0 0 1 0-8.49" className={isPlaying ? 'stroke-emerald-400' : 'stroke-current text-white/40'}
          animate={isPlaying ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
      </svg>
      <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-white/50 group-hover:text-emerald-400 transition-colors">
        {isPlaying ? (nowPlayingName || 'Radio').substring(0, 20).toUpperCase() : 'RADIO'}
      </span>
      {isPlaying && (
        <div className="flex gap-[2px] items-end h-3 ml-1">
          {[0, 1, 2].map(b => (
            <motion.div key={b} className="w-[2px] bg-emerald-400"
              animate={{ height: ['3px', '10px', '3px'] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: b * 0.12 }} />
          ))}
        </div>
      )}
    </button>
  );

  const TEKO = { fontFamily: 'Teko, sans-serif' };

  const playerContent = (
    <div className="flex flex-col h-full bg-[#070708] relative">
      {/* Ambient cover glow background */}
      {nowPlayingCover && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img src={nowPlayingCover} alt="" className="w-full h-full object-cover opacity-[0.18] blur-3xl scale-150" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070708]/40 via-[#070708]/85 to-[#070708]" />
        </div>
      )}

      {/* Tab Switcher — segmented pill */}
      <div className="relative shrink-0 px-3 pt-3 pb-2">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06]">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-[0.14em] transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                  : 'text-white/45 hover:text-white/80'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl transition-all ${showSettings ? 'bg-white text-black' : 'text-white/45 hover:text-white/80'}`}
            aria-label="Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && userId && (
        <div className="relative mx-3 mb-2 px-4 py-3 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] space-y-2 shrink-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">Radio Settings</p>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white/75">Autoplay on open</span>
            <Switch checked={settings.autoplay_enabled} onCheckedChange={(v) => updateSetting('autoplay_enabled', v)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white/75">Default to My Playlist</span>
            <Switch checked={settings.default_playlist === 'myplaylist'} onCheckedChange={(v) => updateSetting('default_playlist', v ? 'myplaylist' : 'loopgate')} />
          </div>
        </div>
      )}

      {/* Now Playing Hero — album-art forward */}
      <div className="relative shrink-0 px-4 pt-1 pb-2">
        <div className="flex items-center gap-3.5">
          <div className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden shrink-0 border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
            {nowPlayingCover ? (
              <img src={nowPlayingCover} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-white/[0.04] flex items-center justify-center">
                <Radio size={22} className="text-white/40" />
              </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="flex gap-[3px] items-end h-5">
                  {[0, 1, 2, 3].map(b => (
                    <motion.div key={b} className="w-[2.5px] rounded-full bg-emerald-400"
                      animate={{ height: ['4px', '18px', '4px'] }}
                      transition={{ duration: 0.55, repeat: Infinity, delay: b * 0.1 }} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-[9px] uppercase tracking-[0.2em] font-semibold ${isPlaying ? 'text-emerald-400' : 'text-white/35'}`}>
                {isPlaying ? 'Now Playing' : nowPlayingLabel}
              </span>
              {activeTab === 'myplaylist' && playlistMode === 'myplaylist' && userId && (
                editingName ? (
                  <form onSubmit={(e) => { e.preventDefault(); renamePlaylist(nameInput); setEditingName(false); }}>
                    <input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                      onBlur={() => { renamePlaylist(nameInput); setEditingName(false); }}
                      maxLength={40} className="text-[10px] bg-transparent border-b border-emerald-400 text-white outline-none w-24" />
                  </form>
                ) : (
                  <button onClick={() => { setNameInput(playlistName); setEditingName(true); }} className="p-0.5 text-white/25 hover:text-emerald-400">
                    <Pencil size={9} />
                  </button>
                )
              )}
            </div>
            <p className="text-[15px] font-semibold text-white truncate leading-tight tracking-[-0.01em]">{nowPlayingName || 'Nothing playing'}</p>
            <p className="text-[12px] text-white/45 truncate mt-0.5">{nowPlayingArtist || '—'}</p>
            {audioError && <p className="text-[10px] text-red-400 mt-0.5">Failed to load audio</p>}
          </div>
        </div>
      </div>

      {/* Hidden EQ banner — kept for visual rhythm on big covers */}
      <div className="hidden">
        <div className="flex gap-[2px] items-end h-3">
              {isPlaying ? (
                [0, 1, 2, 3].map(b => (
                  <motion.div key={b} className="w-[2px] bg-emerald-400"
                    animate={{ height: ['3px', '12px', '3px'] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: b * 0.12 }} />
                ))
              ) : (
                [0, 1, 2, 3].map(b => (
                  <div key={b} className="w-[2px] h-[3px] bg-white/15" />
                ))
              )}
            </div>
      </div>

      {/* Seekable Progress Bar */}
      <div className="relative px-4 pt-1 pb-1.5 shrink-0">
        <Slider value={[progress]}
          onValueChange={([v]) => {
            setProgress(v);
            if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
              audioRef.current.currentTime = (v / 100) * audioRef.current.duration;
            }
          }}
          max={100} step={0.5}
          className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:rounded-full [&_[role=slider]]:shadow-md [&_.range]:bg-white [&_[data-orientation=horizontal]]:h-[3px] [&_[data-orientation=horizontal]]:rounded-full" />
      </div>

      {/* Transport Controls */}
      <div className="relative flex items-center justify-between px-5 pt-1 pb-2.5 shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={toggleShuffle}
            className={`p-2 rounded-full transition-all ${shuffled ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'}`}>
            <Shuffle size={15} />
          </button>
          <button onClick={() => setLoopEnabled(l => !l)}
            className={`p-2 rounded-full transition-all ${loopEnabled ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'}`}
            title={loopEnabled ? 'Loop: ON' : 'Loop: OFF'}>
            {loopEnabled ? <Repeat1 size={15} /> : <Repeat size={15} />}
          </button>
        </div>
        <div className="flex items-center gap-5">
          <button
            onClick={() => {
              setProgress(0);
              if (playlistMode === 'myplaylist' && myTracks.length > 0) {
                const newIdx = (myPlaylistIndex - 1 + myTracks.length) % myTracks.length;
                setMyPlaylistIndex(newIdx);
                playMyTrack(myTracks[newIdx], myTracks, newIdx);
              } else { prev(); }
            }}
            className="p-1.5 text-white/65 hover:text-white transition-all active:scale-90">
            <SkipBack size={22} fill="currentColor" />
          </button>
          <button onClick={togglePlay}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white text-black hover:bg-white/90 transition-all active:scale-95 shadow-[0_8px_24px_rgba(255,255,255,0.18)]">
            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={() => {
              setProgress(0);
              if (playlistMode === 'myplaylist' && myTracks.length > 0) {
                const newIdx = (myPlaylistIndex + 1) % myTracks.length;
                setMyPlaylistIndex(newIdx);
                playMyTrack(myTracks[newIdx], myTracks, newIdx);
              } else { skip(); }
            }}
            className="p-1.5 text-white/65 hover:text-white transition-all active:scale-90">
            <SkipForward size={22} fill="currentColor" />
          </button>
        </div>
        <button onClick={toggleMute} className="p-2 rounded-full text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-all">
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      </div>

      {/* Volume */}
      <div className="relative px-5 pb-2.5 flex items-center gap-2.5 shrink-0">
        <VolumeX size={12} className="text-white/30 shrink-0" />
        <Slider value={[volume * 100]} onValueChange={([v]) => setVolume(v / 100)} max={100} step={1}
          className="flex-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:rounded-full [&_.range]:bg-white/85 [&_[data-orientation=horizontal]]:h-[3px] [&_[data-orientation=horizontal]]:rounded-full" />
        <Volume2 size={12} className="text-white/30 shrink-0" />
      </div>

      {/* Speed + Pitch — compact glass card */}
      <div className="relative mx-3 mb-2 p-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shrink-0 space-y-2.5">
        {/* Speed */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] uppercase tracking-[0.18em] font-semibold text-white/35">Speed</span>
            <button onClick={() => setPlaybackRate(1.0)}
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-colors ${
                playbackRate === 1.0 ? 'text-white/35' : 'text-emerald-400 bg-emerald-400/10'
              }`}>
              {playbackRate.toFixed(2)}×
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
              <button key={rate} onClick={() => setPlaybackRate(rate)}
                className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                  Math.abs(playbackRate - rate) < 0.01
                    ? 'bg-white text-black'
                    : 'text-white/55 bg-white/[0.04] hover:text-white hover:bg-white/[0.08]'
                }`}>
                {rate}×
              </button>
            ))}
          </div>
        </div>

        {/* Pitch */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase tracking-[0.18em] font-semibold text-white/35">Pitch</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/45 tabular-nums">
                {pitchSemitones === 0 ? '0 st' : `${pitchSemitones > 0 ? '+' : ''}${pitchSemitones} st`}
              </span>
              {pitchSemitones !== 0 && (
                <button onClick={() => setPitchSemitones(0)} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold">Reset</button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[9px] text-white/25 font-semibold shrink-0 tabular-nums">−8</span>
            <Slider value={[pitchSemitones]} onValueChange={([v]) => setPitchSemitones(v)} min={-8} max={8} step={1}
              className="flex-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:rounded-full [&_.range]:bg-white/85 [&_[data-orientation=horizontal]]:h-[3px] [&_[data-orientation=horizontal]]:rounded-full" />
            <span className="text-[9px] text-white/25 font-semibold shrink-0 tabular-nums">+8</span>
          </div>
        </div>
      </div>

      {/* Tab Content — scrollable area */}
      <div className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {activeTab === 'loopgate' && (
          <div className="px-2 pt-1 pb-2">
            {tracks.slice(0, 20).map((track, i) => (
              <button key={track.id}
                onClick={() => { setProgress(0); setCurrentIndex(i); playTrack(track); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                  i === currentIndex && playlistMode === 'loopgate' ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                }`}>
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] overflow-hidden shrink-0 border border-white/[0.06]">
                  {track.poster_url ? (
                    <img src={track.poster_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Radio size={14} className="text-white/15" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold truncate tracking-[-0.01em] ${i === currentIndex && playlistMode === 'loopgate' ? 'text-emerald-400' : 'text-white/85'}`}>{track.song_name}</p>
                  <p className="text-[11px] text-white/40 truncate mt-0.5">{track.artist_name || track.title}</p>
                </div>
                {track.id === '__loopgate_theme__' && (
                  <span className="text-[8px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full shrink-0 border border-amber-400/20">Theme</span>
                )}
                {track.is_priority && track.id !== '__loopgate_theme__' && (
                  <span className="text-[8px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full shrink-0 border border-emerald-400/20">Priority</span>
                )}
                {i === currentIndex && playlistMode === 'loopgate' && isPlaying && (
                  <div className="flex gap-[2px] items-end h-4 shrink-0">
                    {[0, 1, 2].map(b => (
                      <motion.div key={b} className="w-[2px] rounded-full bg-emerald-400"
                        animate={{ height: ['4px', '14px', '4px'] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: b * 0.15 }} />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'myplaylist' && (
          <MyPlaylistTab
            tracks={myTracks}
            loading={myLoading}
            uploading={uploading}
            currentTrackId={playlistMode === 'myplaylist' ? myTracks[myPlaylistIndex]?.id ?? null : null}
            isPlaying={isPlaying && playlistMode === 'myplaylist'}
            isLoggedIn={!!userId}
            onUpload={uploadTrack}
            onPlay={(track, idx) => {
              setMyPlaylistIndex(idx);
              setProgress(0);
              playMyTrack(track, myTracks, idx);
            }}
            onDelete={deleteTrack}
            onTogglePublic={togglePublic}
            onUploadCover={uploadCover}
          />
        )}

        {activeTab === 'search' && (
          <DeezerSearchTab
            onPlayPreview={playDeezerPreview}
            currentPreviewUrl={deezerNowPlaying?.url || null}
            isPlaying={isPlaying && playlistMode === 'deezer'}
          />
        )}

        {activeTab === 'pitch' && (
          <PitchToRadio userId={userId} />
        )}
      </div>

      {/* Bottom link */}
      <button
        onClick={() => { setOpen(false); navigate('/playlists'); }}
        className="relative w-full flex items-center justify-center gap-1.5 py-3 border-t border-white/[0.06] text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 hover:text-emerald-400 transition-colors shrink-0"
      >
        <ExternalLink size={11} /> Browse Curated Playlists
      </button>
    </div>
  );

  // Mobile: Sheet player, Desktop: just navigate to /playlists
  if (isMobile) {
    return (
      <>
        {triggerButton}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="h-[88vh] max-h-[88vh] rounded-t-[28px] px-0 pt-0 pb-0 overflow-hidden flex flex-col bg-[#070708] border-t border-white/[0.08]">
            <VisuallyHidden><SheetTitle>Radio Player</SheetTitle></VisuallyHidden>
            <div className="flex justify-center py-2.5 shrink-0 relative z-10">
              <div className="w-9 h-[5px] rounded-full bg-white/15" />
            </div>
            {playerContent}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Popover with full radio player
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent 
        side="bottom" 
        align="end" 
        sideOffset={8}
        className="w-[400px] h-[80vh] max-h-[720px] p-0 overflow-hidden border border-white/[0.08] bg-[#070708] rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.7)]"
      >
        {playerContent}
      </PopoverContent>
    </Popover>
  );
}
