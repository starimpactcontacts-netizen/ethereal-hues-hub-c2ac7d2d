import { useState, useRef, useCallback, useEffect } from 'react';
import { Radio, Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Users, Loader2, Pencil, Search, Send, Scissors, Share2, Heart } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useUserPlaylist, useCuratedPlaylists, UserPlaylistTrack } from '@/hooks/useUserPlaylist';
import MyPlaylistTab from '@/components/loopgate/MyPlaylistTab';
import DeezerSearchTab from '@/components/loopgate/DeezerSearchTab';
import PitchToRadio from '@/components/loopgate/PitchToRadio';
import AudioTrimPicker from '@/components/loopgate/AudioTrimPicker';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '@/hooks/use-mobile';

interface FeaturedTrack {
  id: string;
  song_name: string;
  song_preview_url: string;
  title: string;
  poster_url: string | null;
  artist_name?: string | null;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Tab = 'radio' | 'mine' | 'search' | 'pitch' | 'community';

export default function PlaylistsPage() {
  const isMobile = useIsMobile();
  const [userId, setUserId] = useState<string | null>(null);
  const [featuredTracks, setFeaturedTracks] = useState<FeaturedTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('radio');
  const [activeCuratedUser, setActiveCuratedUser] = useState<string | null>(null);
  const [curatedTrackIndex, setCuratedTrackIndex] = useState(0);
  const [myPlaylistIndex, setMyPlaylistIndex] = useState(0);
  const [playbackSource, setPlaybackSource] = useState<'radio' | 'mine' | 'curated' | 'deezer'>('radio');
  const [deezerNow, setDeezerNow] = useState<{ url: string; title: string; artist: string; cover: string } | null>(null);
  const [trimFile, setTrimFile] = useState<File | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { myTracks, loading: myLoading, uploading, uploadTrack, uploadCover, deleteTrack, togglePublic, playlistName, renamePlaylist } = useUserPlaylist(userId);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const { playlists: curatedPlaylists, loading: curatedLoading } = useCuratedPlaylists();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUserId(s?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: radioData }, { data: dropData }] = await Promise.all([
        supabase.from('radio_tracks').select('id, song_name, artist_name, audio_url, cover_url, is_priority, track_order')
          .order('is_priority', { ascending: false }).order('track_order', { ascending: true }),
        supabase.from('featured_drops').select('id, song_name, song_preview_url, title, poster_url')
          .not('song_preview_url', 'is', null).order('created_at', { ascending: false }).limit(50),
      ]);
      const radio: FeaturedTrack[] = (radioData || []).map(t => ({
        id: t.id, song_name: t.song_name, song_preview_url: t.audio_url,
        title: t.artist_name || 'LOOPGATE Radio', poster_url: t.cover_url, artist_name: t.artist_name,
      }));
      const drops: FeaturedTrack[] = (dropData || []).filter(t => t.song_preview_url).map(t => ({
        id: t.id, song_name: t.song_name, song_preview_url: t.song_preview_url!,
        title: t.title, poster_url: t.poster_url,
      }));
      const all = shuffleArray([...radio, ...drops]);
      setFeaturedTracks(all);
      if (all.length) setCurrentIndex(Math.floor(Math.random() * all.length));
    };
    fetch();
  }, []);

  const isMuted = volume === 0;

  const startProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      if (audioRef.current) {
        const d = audioRef.current.duration;
        if (d && !isNaN(d)) setProgress((audioRef.current.currentTime / d) * 100);
      }
    }, 150);
  }, []);

  const stopProgress = useCallback(() => {
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    stopProgress();
  }, [stopProgress]);

  const playUrl = useCallback((url: string, onEnded: () => void) => {
    cleanupAudio();
    setProgress(0);
    const a = new Audio(url);
    a.volume = volume;
    a.preload = 'auto';
    audioRef.current = a;
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', () => { setIsPlaying(false); stopProgress(); });
    const go = () => { a.play().then(() => { setIsPlaying(true); startProgress(); }).catch(() => {}); };
    if (a.readyState >= 2) go(); else a.addEventListener('canplay', go, { once: true });
  }, [volume, cleanupAudio, startProgress, stopProgress]);

  const playRadio = useCallback((idx: number) => {
    const t = featuredTracks[idx];
    if (!t) return;
    setPlaybackSource('radio');
    setCurrentIndex(idx);
    playUrl(t.song_preview_url, () => {
      const next = (idx + 1) % featuredTracks.length;
      setCurrentIndex(next);
      setTimeout(() => playUrl(featuredTracks[next]?.song_preview_url || '', () => {}), 50);
    });
  }, [featuredTracks, playUrl]);

  const playMy = useCallback((idx: number) => {
    const t = myTracks[idx];
    if (!t) return;
    setPlaybackSource('mine');
    setMyPlaylistIndex(idx);
    playUrl(t.audio_url, () => {
      const next = (idx + 1) % myTracks.length;
      setMyPlaylistIndex(next);
      setTimeout(() => playUrl(myTracks[next]?.audio_url || '', () => {}), 50);
    });
  }, [myTracks, playUrl]);

  const playCurated = useCallback((uid: string, idx: number) => {
    const pl = curatedPlaylists.find(p => p.user_id === uid);
    if (!pl) return;
    const t = pl.tracks[idx];
    if (!t) return;
    setPlaybackSource('curated');
    setActiveCuratedUser(uid);
    setCuratedTrackIndex(idx);
    playUrl(t.audio_url, () => {
      const next = (idx + 1) % pl.tracks.length;
      setCuratedTrackIndex(next);
      setTimeout(() => playUrl(pl.tracks[next]?.audio_url || '', () => {}), 50);
    });
  }, [curatedPlaylists, playUrl]);

  const playDeezer = useCallback((url: string, title: string, artist: string, cover: string) => {
    if (deezerNow?.url === url && isPlaying) {
      audioRef.current?.pause(); setIsPlaying(false); stopProgress(); return;
    }
    setPlaybackSource('deezer');
    setDeezerNow({ url, title, artist, cover });
    playUrl(url, () => { setIsPlaying(false); setProgress(0); });
  }, [deezerNow, isPlaying, playUrl, stopProgress]);

  const pause = useCallback(() => { audioRef.current?.pause(); setIsPlaying(false); stopProgress(); }, [stopProgress]);
  const togglePlay = useCallback(() => {
    if (isPlaying) { pause(); return; }
    if (audioRef.current?.src) { audioRef.current.play().then(() => { setIsPlaying(true); startProgress(); }).catch(() => {}); }
    else if (featuredTracks.length) playRadio(currentIndex);
  }, [isPlaying, pause, startProgress, featuredTracks, currentIndex, playRadio]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
  useEffect(() => () => { cleanupAudio(); }, [cleanupAudio]);

  // Handle upload with trim picker
  const handleUploadIntent = (file: File) => {
    // Check if file needs trimming — show picker for files that might be long
    if (file.size > 1 * 1024 * 1024) { // >1MB, likely long
      setTrimFile(file);
    } else {
      uploadTrack(file);
    }
  };

  const getNowPlaying = () => {
    if (playbackSource === 'deezer' && deezerNow) return { name: deezerNow.title, sub: deezerNow.artist, poster: deezerNow.cover, label: 'Deezer' };
    if (playbackSource === 'mine') {
      const t = myTracks[myPlaylistIndex];
      return { name: t?.track_name || 'No tracks', sub: t?.artist_name || '', poster: t?.cover_url || null, label: playlistName };
    }
    if (playbackSource === 'curated') {
      const pl = curatedPlaylists.find(p => p.user_id === activeCuratedUser);
      const t = pl?.tracks[curatedTrackIndex];
      return { name: t?.track_name || '', sub: `@${pl?.username || ''}`, poster: null, label: 'Community' };
    }
    const t = featuredTracks[currentIndex];
    return { name: t?.song_name || '', sub: t?.artist_name || t?.title || '', poster: t?.poster_url || null, label: 'LOOPGATE' };
  };

  const np = getNowPlaying();

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'radio', label: 'Radio', icon: <Radio size={14} /> },
    { key: 'mine', label: 'Mine', icon: <Music size={14} /> },
    { key: 'search', label: 'Search', icon: <Search size={14} /> },
    { key: 'community', label: 'Community', icon: <Users size={14} /> },
    { key: 'pitch', label: 'Pitch', icon: <Send size={14} /> },
  ];

  return (
    <>
      <Helmet>
        <title>Playlists — LOOPGATE</title>
        <meta name="description" content="Browse LOOPGATE playlists, create your own, search global music, and pitch tracks to Loopgate Radio." />
      </Helmet>

      <div className="min-h-screen bg-background pb-32">
        {/* Header */}
        <div className="px-4 pt-6 pb-2 max-w-5xl mx-auto">
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Playlists</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Radio · Upload · Search · Community · Pitch</p>
        </div>

        {/* Tabs — scrollable on mobile */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-5xl mx-auto px-2 flex overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors shrink-0 ${
                  activeTab === tab.key
                    ? 'text-emerald-500 border-b-2 border-emerald-500'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trim Picker Modal */}
        <AnimatePresence>
          {trimFile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-surface-0 rounded-2xl border border-border p-5"
              >
                <AudioTrimPicker
                  file={trimFile}
                  onConfirm={(f) => { setTrimFile(null); uploadTrack(f); }}
                  onCancel={() => setTrimFile(null)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <div className="max-w-5xl mx-auto px-4 py-4">
          {activeTab === 'radio' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{featuredTracks.length} tracks</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
                <div className="max-h-[60vh] overflow-y-auto">
                  {featuredTracks.map((track, i) => {
                    const active = i === currentIndex && playbackSource === 'radio';
                    return (
                      <button key={track.id}
                        onClick={() => playRadio(i)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          active ? 'bg-emerald-500/10' : 'hover:bg-surface-1'
                        }`}>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-surface-1 overflow-hidden shrink-0">
                          {track.poster_url ? (
                            <img src={track.poster_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Radio size={16} className="text-muted-foreground/40" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${active ? 'text-emerald-400' : 'text-foreground'}`}>{track.song_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{track.artist_name || track.title}</p>
                        </div>
                        {active && isPlaying && (
                          <div className="flex gap-[2px] items-end h-3 shrink-0">
                            {[0,1,2].map(b => (
                              <motion.div key={b} className="w-[2px] bg-emerald-500 rounded-full"
                                animate={{ height: ['4px','12px','4px'] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mine' && (
            <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Music size={14} className="text-emerald-500" />
                {editingName ? (
                  <form className="flex-1" onSubmit={(e) => { e.preventDefault(); renamePlaylist(nameInput); setEditingName(false); }}>
                    <input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                      onBlur={() => { renamePlaylist(nameInput); setEditingName(false); }}
                      maxLength={40} className="text-xs font-bold uppercase tracking-wider bg-transparent border-b border-emerald-500 text-foreground outline-none w-full" />
                  </form>
                ) : (
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    {playlistName}
                    {userId && <button onClick={() => { setNameInput(playlistName); setEditingName(true); }} className="text-muted-foreground hover:text-emerald-500"><Pencil size={10} /></button>}
                  </h2>
                )}
                <span className="text-[9px] text-muted-foreground ml-auto">{myTracks.length}/25</span>
              </div>
              <MyPlaylistTab
                tracks={myTracks}
                loading={myLoading}
                uploading={uploading}
                currentTrackId={playbackSource === 'mine' ? myTracks[myPlaylistIndex]?.id ?? null : null}
                isPlaying={isPlaying && playbackSource === 'mine'}
                isLoggedIn={!!userId}
                onUpload={handleUploadIntent}
                onPlay={(track, idx) => playMy(idx)}
                onDelete={deleteTrack}
                onTogglePublic={togglePublic}
                onUploadCover={uploadCover}
                compact={false}
              />
            </div>
          )}

          {activeTab === 'search' && (
            <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
              <DeezerSearchTab
                onPlayPreview={playDeezer}
                currentPreviewUrl={deezerNow?.url || null}
                isPlaying={isPlaying && playbackSource === 'deezer'}
              />
            </div>
          )}

          {activeTab === 'community' && (
            <div>
              {curatedLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
              ) : curatedPlaylists.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface-0 p-12 text-center">
                  <Users size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No community playlists yet.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Be the first — toggle your tracks to public!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {curatedPlaylists.map(pl => (
                    <div key={pl.user_id} className="rounded-xl border border-border bg-surface-0 overflow-hidden hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                        <div className="w-8 h-8 rounded-full bg-surface-1 overflow-hidden shrink-0 flex items-center justify-center">
                          {pl.avatar_url ? <img src={pl.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users size={14} className="text-muted-foreground/50" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-foreground">{pl.playlist_name || `@${pl.username}'s Playlist`}</p>
                          <p className="text-[9px] text-muted-foreground">@{pl.username} · {pl.tracks.length} track{pl.tracks.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button onClick={() => playCurated(pl.user_id, 0)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition-colors shrink-0">
                          <Play size={14} className="ml-0.5" />
                        </button>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {pl.tracks.map((t, idx) => {
                          const active = playbackSource === 'curated' && activeCuratedUser === pl.user_id && curatedTrackIndex === idx;
                          return (
                            <button key={t.id} onClick={() => playCurated(pl.user_id, idx)}
                              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                                active ? 'bg-emerald-500/10 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
                              }`}>
                              <div className="w-7 h-7 rounded bg-surface-1 flex items-center justify-center shrink-0 overflow-hidden">
                                {t.cover_url ? <img src={t.cover_url} alt="" className="w-full h-full object-cover" /> : <Music size={10} className="text-muted-foreground/40" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs truncate">{t.track_name}</p>
                                {t.artist_name && <p className="text-[8px] text-muted-foreground truncate">{t.artist_name}</p>}
                              </div>
                              {active && isPlaying && (
                                <div className="flex gap-[2px] items-end h-2.5 shrink-0">
                                  {[0,1,2].map(b => (
                                    <motion.div key={b} className="w-[2px] bg-emerald-500 rounded-full"
                                      animate={{ height: ['3px','10px','3px'] }}
                                      transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }} />
                                  ))}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pitch' && (
            <div className="rounded-xl border border-border bg-surface-0 overflow-hidden max-w-lg mx-auto">
              <PitchToRadio userId={userId} />
            </div>
          )}
        </div>

        {/* Sticky Bottom Player */}
        <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 bg-surface-0/95 backdrop-blur-lg border-t border-border safe-area-bottom">
          {/* Progress bar */}
          <div className="w-full h-0.5 bg-border">
            <motion.div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
          </div>

          <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 py-2">
            {/* Cover */}
            <div className="w-10 h-10 rounded-lg bg-surface-1 overflow-hidden shrink-0 flex items-center justify-center">
              {np.poster ? <img src={np.poster} alt="" className="w-full h-full object-cover" /> : <Music size={16} className="text-muted-foreground/40" />}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {isPlaying && (
                  <div className="flex gap-[2px] items-end h-2.5 shrink-0">
                    {[0,1,2].map(b => (
                      <motion.div key={b} className="w-[1.5px] bg-emerald-500 rounded-full"
                        animate={{ height: ['2px','8px','2px'] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: b * 0.12 }} />
                    ))}
                  </div>
                )}
                <span className="text-[8px] uppercase tracking-wider text-emerald-500 font-bold">{np.label}</span>
              </div>
              <p className="text-xs font-medium text-foreground truncate">{np.name || 'Nothing playing'}</p>
              <p className="text-[9px] text-muted-foreground truncate">{np.sub}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button onClick={() => {
                if (playbackSource === 'radio') playRadio((currentIndex - 1 + featuredTracks.length) % featuredTracks.length);
                else if (playbackSource === 'mine') playMy((myPlaylistIndex - 1 + myTracks.length) % myTracks.length);
              }} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <SkipBack size={16} />
              </button>
              <button onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition-colors">
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>
              <button onClick={() => {
                if (playbackSource === 'radio') playRadio((currentIndex + 1) % featuredTracks.length);
                else if (playbackSource === 'mine') playMy((myPlaylistIndex + 1) % myTracks.length);
              }} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <SkipForward size={16} />
              </button>
            </div>

            {/* Volume — desktop only */}
            <div className="hidden md:flex items-center gap-2 w-24">
              <button onClick={() => setVolume(v => v === 0 ? 0.3 : 0)} className="text-muted-foreground hover:text-foreground">
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <Slider value={[volume * 100]} onValueChange={([v]) => setVolume(v / 100)} max={100} step={1}
                className="flex-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-0 [&_.range]:bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
