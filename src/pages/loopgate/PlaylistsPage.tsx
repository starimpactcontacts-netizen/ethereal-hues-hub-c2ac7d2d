import { useState, useRef, useCallback, useEffect } from 'react';
import { Radio, Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Shuffle, Users, Loader2, Pencil } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useUserPlaylist, useCuratedPlaylists, UserPlaylistTrack } from '@/hooks/useUserPlaylist';
import MyPlaylistTab from '@/components/loopgate/MyPlaylistTab';
import { Helmet } from 'react-helmet-async';

interface FeaturedTrack {
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

export default function PlaylistsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [featuredTracks, setFeaturedTracks] = useState<FeaturedTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<'loopgate' | 'myplaylist' | 'curated'>('loopgate');
  const [activeCuratedUser, setActiveCuratedUser] = useState<string | null>(null);
  const [curatedTrackIndex, setCuratedTrackIndex] = useState(0);
  const [myPlaylistIndex, setMyPlaylistIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const { myTracks, loading: myLoading, uploading, uploadTrack, deleteTrack, togglePublic, playlistName, renamePlaylist } = useUserPlaylist(userId);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const { playlists: curatedPlaylists, loading: curatedLoading } = useCuratedPlaylists();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await supabase
        .from('featured_drops')
        .select('id, song_name, song_preview_url, title, poster_url')
        .not('song_preview_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) {
        const valid = data.filter(t => t.song_preview_url) as FeaturedTrack[];
        setFeaturedTracks(shuffleArray(valid));
        setCurrentIndex(Math.floor(Math.random() * valid.length));
      }
    };
    fetchFeatured();
  }, []);

  const isMuted = volume === 0;

  const startProgress = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      if (audioRef.current) {
        const dur = audioRef.current.duration;
        if (dur && !isNaN(dur)) setProgress((audioRef.current.currentTime / dur) * 100);
      }
    }, 200);
  }, []);

  const stopProgress = useCallback(() => {
    if (progressInterval.current) { clearInterval(progressInterval.current); progressInterval.current = null; }
  }, []);

  const playAudio = useCallback((url: string, onEnded: () => void) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    stopProgress();
    const a = new Audio(url);
    a.volume = volume;
    audioRef.current = a;
    a.addEventListener('ended', onEnded);
    a.play().then(() => { setIsPlaying(true); startProgress(); }).catch(() => {});
  }, [volume, startProgress, stopProgress]);

  const playLoopgateTrack = useCallback((idx: number) => {
    const track = featuredTracks[idx];
    if (!track) return;
    setActiveSection('loopgate');
    setCurrentIndex(idx);
    setProgress(0);
    playAudio(track.song_preview_url, () => {
      const next = (idx + 1) % featuredTracks.length;
      setCurrentIndex(next);
      playLoopgateTrack(next);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredTracks, playAudio]);

  const playMyTrack = useCallback((idx: number) => {
    const track = myTracks[idx];
    if (!track) return;
    setActiveSection('myplaylist');
    setMyPlaylistIndex(idx);
    setProgress(0);
    playAudio(track.audio_url, () => {
      const next = (idx + 1) % myTracks.length;
      setMyPlaylistIndex(next);
      playMyTrack(next);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTracks, playAudio]);

  const playCuratedTrack = useCallback((userId: string, idx: number) => {
    const playlist = curatedPlaylists.find(p => p.user_id === userId);
    if (!playlist) return;
    const track = playlist.tracks[idx];
    if (!track) return;
    setActiveSection('curated');
    setActiveCuratedUser(userId);
    setCuratedTrackIndex(idx);
    setProgress(0);
    playAudio(track.audio_url, () => {
      const next = (idx + 1) % playlist.tracks.length;
      setCuratedTrackIndex(next);
      playCuratedTrack(userId, next);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curatedPlaylists, playAudio]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    stopProgress();
  }, [stopProgress]);

  const togglePlay = useCallback(() => {
    if (isPlaying) { pause(); return; }
    if (audioRef.current?.src) {
      audioRef.current.play().then(() => { setIsPlaying(true); startProgress(); }).catch(() => {});
    } else if (featuredTracks.length) {
      playLoopgateTrack(currentIndex);
    }
  }, [isPlaying, pause, startProgress, featuredTracks, currentIndex, playLoopgateTrack]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => () => { audioRef.current?.pause(); stopProgress(); }, [stopProgress]);

  const currentActiveCurated = curatedPlaylists.find(p => p.user_id === activeCuratedUser);

  // Get now-playing info
  const getNowPlaying = () => {
    if (activeSection === 'loopgate') {
      const t = featuredTracks[currentIndex];
      return { name: t?.song_name || '', sub: t?.title || '', poster: t?.poster_url };
    }
    if (activeSection === 'myplaylist') {
      const t = myTracks[myPlaylistIndex];
      return { name: t?.track_name || 'No tracks', sub: t?.artist_name || '', poster: null };
    }
    if (activeSection === 'curated' && currentActiveCurated) {
      const t = currentActiveCurated.tracks[curatedTrackIndex];
      return { name: t?.track_name || '', sub: `@${currentActiveCurated.username}`, poster: null };
    }
    return { name: '', sub: '', poster: null };
  };

  const nowPlaying = getNowPlaying();

  return (
    <>
      <Helmet>
        <title>Playlists — LOOPGATE</title>
        <meta name="description" content="Browse LOOPGATE playlists, create your own, and discover curated playlists from the community." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">Playlists</h1>
          <p className="text-sm text-muted-foreground mb-8">LOOPGATE curated drops, your personal playlist, and community picks.</p>

          {/* Now Playing Bar */}
          <div className="mb-8 rounded-xl border border-border bg-surface-0 p-4">
            <div className="flex items-center gap-4">
              {/* Poster / icon */}
              <div className="w-14 h-14 rounded-lg bg-surface-1 overflow-hidden shrink-0 flex items-center justify-center">
                {nowPlaying.poster ? (
                  <img src={nowPlaying.poster} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music size={20} className="text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex gap-[2px] items-end h-3">
                    {isPlaying ? [0,1,2,3].map(b => (
                      <motion.div key={b} className="w-[2px] bg-emerald-500 rounded-full"
                        animate={{ height: ['3px','12px','3px'] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: b * 0.12 }} />
                    )) : [0,1,2,3].map(b => (
                      <div key={b} className="w-[2px] h-[3px] bg-muted-foreground/40 rounded-full" />
                    ))}
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-emerald-500 font-bold">
                    {activeSection === 'loopgate' ? 'LOOPGATE' : activeSection === 'myplaylist' ? 'MY PLAYLIST' : 'CURATED'}
                  </span>
                </div>
                <p className="text-sm font-display text-foreground truncate">{nowPlaying.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{nowPlaying.sub}</p>
              </div>
              {/* Controls */}
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  if (activeSection === 'loopgate') playLoopgateTrack((currentIndex - 1 + featuredTracks.length) % featuredTracks.length);
                  else if (activeSection === 'myplaylist') playMyTrack((myPlaylistIndex - 1 + myTracks.length) % myTracks.length);
                  else if (activeCuratedUser && currentActiveCurated) playCuratedTrack(activeCuratedUser, (curatedTrackIndex - 1 + currentActiveCurated.tracks.length) % currentActiveCurated.tracks.length);
                }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <SkipBack size={18} />
                </button>
                <button onClick={togglePlay}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition-colors">
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
                <button onClick={() => {
                  if (activeSection === 'loopgate') playLoopgateTrack((currentIndex + 1) % featuredTracks.length);
                  else if (activeSection === 'myplaylist') playMyTrack((myPlaylistIndex + 1) % myTracks.length);
                  else if (activeCuratedUser && currentActiveCurated) playCuratedTrack(activeCuratedUser, (curatedTrackIndex + 1) % currentActiveCurated.tracks.length);
                }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <SkipForward size={18} />
                </button>
              </div>
              {/* Volume */}
              <div className="hidden sm:flex items-center gap-2 w-28">
                <button onClick={() => setVolume(v => v === 0 ? 0.3 : 0)} className="text-muted-foreground hover:text-foreground">
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <Slider value={[volume * 100]} onValueChange={([v]) => setVolume(v / 100)} max={100} step={1}
                  className="flex-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-0 [&_.range]:bg-emerald-500" />
              </div>
            </div>
            {/* Progress */}
            <div className="mt-3">
              <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                <motion.div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} transition={{ duration: 0.2 }} />
              </div>
            </div>
          </div>

          {/* Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* LOOPGATE Playlist */}
            <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Radio size={14} className="text-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">LOOPGATE Playlist</h2>
                <span className="text-[9px] text-muted-foreground ml-auto">{featuredTracks.length} tracks</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {featuredTracks.map((track, i) => (
                  <button key={track.id}
                    onClick={() => playLoopgateTrack(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === currentIndex && activeSection === 'loopgate' ? 'bg-emerald-500/10 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
                    }`}>
                    <div className="w-10 h-10 rounded bg-surface-1 overflow-hidden shrink-0">
                      {track.poster_url ? (
                        <img src={track.poster_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Radio size={14} className="text-muted-foreground/50" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.song_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{track.title}</p>
                    </div>
                    {i === currentIndex && activeSection === 'loopgate' && isPlaying && (
                      <div className="flex gap-[2px] items-end h-3 shrink-0">
                        {[0,1,2].map(b => (
                          <motion.div key={b} className="w-[2px] bg-emerald-500 rounded-full"
                            animate={{ height: ['4px','12px','4px'] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }} />
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* My Playlist */}
            <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Music size={14} className="text-emerald-500" />
                {editingName ? (
                  <form className="flex-1" onSubmit={(e) => { e.preventDefault(); renamePlaylist(nameInput); setEditingName(false); }}>
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onBlur={() => { renamePlaylist(nameInput); setEditingName(false); }}
                      maxLength={40}
                      className="text-xs font-bold uppercase tracking-wider bg-transparent border-b border-emerald-500 text-foreground outline-none w-full"
                    />
                  </form>
                ) : (
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    {playlistName}
                    {userId && (
                      <button onClick={() => { setNameInput(playlistName); setEditingName(true); }} className="text-muted-foreground hover:text-emerald-500">
                        <Pencil size={10} />
                      </button>
                    )}
                  </h2>
                )}
                <span className="text-[9px] text-muted-foreground ml-auto">{myTracks.length}/25</span>
              </div>
              <MyPlaylistTab
                tracks={myTracks}
                loading={myLoading}
                uploading={uploading}
                currentTrackId={activeSection === 'myplaylist' ? myTracks[myPlaylistIndex]?.id ?? null : null}
                isPlaying={isPlaying && activeSection === 'myplaylist'}
                isLoggedIn={!!userId}
                onUpload={uploadTrack}
                onPlay={(track, idx) => playMyTrack(idx)}
                onDelete={deleteTrack}
                onTogglePublic={togglePublic}
                compact={false}
              />
            </div>
          </div>

          {/* Curated Playlists */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-emerald-500" />
              <h2 className="text-lg font-display font-bold text-foreground">Curated Playlists</h2>
              <span className="text-xs text-muted-foreground ml-2">
                Public playlists from the community
              </span>
            </div>

            {curatedLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              </div>
            ) : curatedPlaylists.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface-0 p-12 text-center">
                <Users size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No curated playlists yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Be the first — toggle your tracks to public!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {curatedPlaylists.map(playlist => (
                  <div key={playlist.user_id} className="rounded-xl border border-border bg-surface-0 overflow-hidden hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                      <div className="w-8 h-8 rounded-full bg-surface-1 overflow-hidden shrink-0 flex items-center justify-center">
                        {playlist.avatar_url ? (
                          <img src={playlist.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users size={14} className="text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-foreground">{playlist.playlist_name || `@${playlist.username}'s Playlist`}</p>
                        <p className="text-[9px] text-muted-foreground">@{playlist.username} · {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}</p>
                      </div>
                      <button
                        onClick={() => playCuratedTrack(playlist.user_id, 0)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition-colors shrink-0"
                      >
                        <Play size={14} className="ml-0.5" />
                      </button>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {playlist.tracks.map((track, idx) => (
                        <button key={track.id}
                          onClick={() => playCuratedTrack(playlist.user_id, idx)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                            activeSection === 'curated' && activeCuratedUser === playlist.user_id && curatedTrackIndex === idx
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
                          }`}>
                          <div className="w-6 h-6 rounded-sm bg-surface-1 flex items-center justify-center shrink-0">
                            <Music size={10} className="text-muted-foreground/50" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">{track.track_name}</p>
                            {track.artist_name && <p className="text-[8px] text-muted-foreground truncate">{track.artist_name}</p>}
                          </div>
                          {activeSection === 'curated' && activeCuratedUser === playlist.user_id && curatedTrackIndex === idx && isPlaying && (
                            <div className="flex gap-[2px] items-end h-2.5 shrink-0">
                              {[0,1,2].map(b => (
                                <motion.div key={b} className="w-[2px] bg-emerald-500 rounded-full"
                                  animate={{ height: ['3px','10px','3px'] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }} />
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
