import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Shuffle, Users, Swords, Music, Play, Pause, X, Film, Search, Loader2, Star, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DIFF_BADGE: Record<string, string> = {
  easy:      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  normal:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  hard:      'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  nightmare: 'bg-red-500/20 text-red-300 border border-red-500/30',
};

const DIFF_STARS: Record<string, number> = { easy: 2, normal: 3, hard: 4, nightmare: 5 };
const DIFF_STAR_COLOR: Record<string, string> = {
  easy: 'text-emerald-400', normal: 'text-blue-400', hard: 'text-orange-400', nightmare: 'text-red-400',
};
const DIFF_STAR_BG: Record<string, string> = {
  easy: 'bg-emerald-500/15 border-emerald-500/35',
  normal: 'bg-blue-500/15 border-blue-500/35',
  hard: 'bg-orange-500/15 border-orange-500/35',
  nightmare: 'bg-red-500/20 border-red-500/50',
};

interface Player {
  username: string;
  avatarUrl: string | null;
  level: number;
}

interface Props {
  open: boolean;
  fightId: string;
  you: Player;
  opponent: Player;
  youSide?: PlayerSide;
  selectionDeadline?: string | null;
  onComplete: () => void;
  onCancel?: () => void;
}

interface Scenepack {
  id: string;
  name: string;
  poster: string;
  packCount: number;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string | null;
  preview: string | null;
  difficulty?: string | null;
  deezer_id?: number | null;
}

const PHASE_TIMER_SEC = 180;

function classFromLevel(level: number): string {
  if (level >= 75) return 'MYTHIC';
  if (level >= 50) return 'ELITE';
  if (level >= 30) return 'VETERAN';
  if (level >= 15) return 'PRO';
  if (level >= 5) return 'ROOKIE';
  return 'NOVICE';
}

const FALLBACK_SONGS: Song[] = [
  { id: 'fb-1', title: 'Virtuoso',    artist: 'Loneliness x Sace', cover: null, preview: null },
  { id: 'fb-2', title: 'LUA NOVA',    artist: 'refri',             cover: null, preview: null },
  { id: 'fb-3', title: 'Toxic Potion',artist: 'Margaux',           cover: null, preview: null },
  { id: 'fb-4', title: 'TOX RABETA',  artist: 'TOXIUM',            cover: null, preview: null },
  { id: 'fb-5', title: 'The Visitor', artist: 'SIENNA SPIRO',      cover: null, preview: null },
];

type Phase = 'select' | 'intro';
type PlayerSide = 'red' | 'blue';
type Tab = 'scenepack' | 'song';

interface PlayerPicks {
  pack: Scenepack | null;
  song: Song | null;
  ready: boolean;
}
const EMPTY_PICKS: PlayerPicks = { pack: null, song: null, ready: false };

function serializePack(pack: Scenepack | null) {
  return pack ? { id: pack.id, name: pack.name, poster: pack.poster, packCount: pack.packCount } : null;
}

function serializeSong(song: Song | null) {
  return song ? { id: song.id, title: song.title, artist: song.artist, cover: song.cover, preview: song.preview } : null;
}

function cleanPack(pack: any): Scenepack | null {
  if (!pack?.id) return null;
  return { id: pack.id, name: pack.name || 'Unknown', poster: pack.poster || '', packCount: Number(pack.packCount || 0) };
}

function cleanSong(song: any): Song | null {
  if (!song?.id) return null;
  return { id: song.id, title: song.title || 'Unknown', artist: song.artist || '', cover: song.cover || null, preview: song.preview || null };
}

export default function BattleSelectFlow({ open, fightId, you, opponent, youSide = 'red', selectionDeadline, onComplete, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('select');
  const [tab, setTab] = useState<Tab>('scenepack');
  const [timeLeft, setTimeLeft] = useState(PHASE_TIMER_SEC);
  const [songs, setSongs] = useState<Song[]>(FALLBACK_SONGS);
  const [scenepacks, setScenepacks] = useState<Scenepack[]>([]);

  // STRICT ISOLATION: local actions only mutate `mine`; opponent picks are
  // fetched from the backend only after both players are locked or timer expires.
  const [mine, setMine] = useState<PlayerPicks>(EMPTY_PICKS);
  const [opp, setOpp] = useState<PlayerPicks>(EMPTY_PICKS);
  const [opponentReady, setOpponentReady] = useState(false);
  const [bothReady, setBothReady] = useState(false);
  const [revealSelections, setRevealSelections] = useState(false);
  const [deadlineIso, setDeadlineIso] = useState<string | null>(selectionDeadline || null);
  const [mySyncVote, setMySyncVote] = useState(false);
  const [oppSyncVote, setOppSyncVote] = useState(false);
  const syncChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mySyncVoteRef = useRef(false);

  const [intro, setIntro] = useState({ pct: 0, count: 3 });

  const previewRef = useRef<HTMLAudioElement | null>(null);
  const timeoutHandledRef = useRef(false);
  const startingRef = useRef(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Single persistent audio element — reusing it keeps mobile browser user-gesture context intact
  useEffect(() => {
    const a = new Audio();
    a.volume = 0.5;
    a.preload = 'none';
    previewRef.current = a;
    return () => { a.pause(); a.src = ''; };
  }, []);

  const [deezerQuery, setDeezerQuery] = useState('');
  const [deezerLoading, setDeezerLoading] = useState(false);
  const [deezerResults, setDeezerResults] = useState<Song[]>([]);

  const runDeezerSearch = useCallback(async (q: string) => {
    const text = q.trim();
    if (!text) { setDeezerResults([]); return; }
    setDeezerLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('deezer-search', {
        body: { query: text, limit: 24 },
      });
      if (error) throw error;
      const tracks: any[] = Array.isArray((data as any)?.data) ? (data as any).data : [];
      setDeezerResults(
        tracks
          .filter((t) => t?.preview)
          .map((t: any) => ({
            id: `dz:${t.id}`,
            title: t.title,
            artist: t?.artist?.name || 'Unknown',
            cover: t?.album?.cover_medium || t?.album?.cover_small || null,
            preview: t.preview,
          })),
      );
    } catch {
      setDeezerResults([]);
    } finally {
      setDeezerLoading(false);
    }
  }, []);

  const mySide: PlayerSide = youSide;
  const opponentSide: PlayerSide = mySide === 'red' ? 'blue' : 'red';
  // Sync mode: red picks song, blue picks scenepack
  const syncRole: Tab = mySide === 'red' ? 'song' : 'scenepack';
  const syncActive = mySyncVote && oppSyncVote;
  const redPicks = mySide === 'red' ? mine : opp;
  const bluePicks = mySide === 'blue' ? mine : opp;
  const redPlayer = mySide === 'red' ? you : opponent;
  const bluePlayer = mySide === 'blue' ? you : opponent;

  const canReady = syncActive
    ? (syncRole === 'song' ? !!mine.song : !!mine.pack)
    : !!mine.pack && !!mine.song;

  const applySelectionState = useCallback((state: any) => {
    if (!state) return;
    setOpponentReady(!!state.opponentReady);
    setBothReady(!!state.bothReady);
    setRevealSelections(!!state.reveal);
    if (state.selectionDeadline) setDeadlineIso(state.selectionDeadline);
    if (state.mine) {
      setMine(prev => ({
        pack: cleanPack(state.mine.pack) || prev.pack,
        song: cleanSong(state.mine.song) || prev.song,
        ready: !!state.myReady || prev.ready,
      }));
    }
    if (state.reveal && state.opponent) {
      setOpp({ pack: cleanPack(state.opponent.pack), song: cleanSong(state.opponent.song), ready: !!state.opponent.ready });
    } else {
      setOpp(prev => ({ ...prev, ready: !!state.opponentReady }));
    }
  }, []);

  const saveSelection = useCallback(async (next: PlayerPicks) => {
    const { data } = await supabase.rpc('upsert_quick_fight_selection' as any, {
      p_fight_id: fightId,
      p_scenepack: serializePack(next.pack),
      p_song: serializeSong(next.song),
      p_ready: next.ready,
    } as any);
    applySelectionState(data);
    return data as any;
  }, [applySelectionState, fightId]);

  const startFromSelection = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    await supabase.rpc('start_quick_fight_from_selection' as any, { p_fight_id: fightId } as any);
  }, [fightId]);

  const setMyPack = (pack: Scenepack) => {
    if (mine.ready) return;
    if (syncActive && syncRole !== 'scenepack') return;
    const next = { ...mine, pack };
    setMine(next);
    saveSelection(next).catch(() => {});
  };
  const setMySong = (song: Song) => {
    if (mine.ready) return;
    if (syncActive && syncRole !== 'song') return;
    const next = { ...mine, song };
    setMine(next);
    saveSelection(next).catch(() => {});
  };
  const lockInReady = async () => {
    if (!canReady || mine.ready) return;
    const next = { ...mine, ready: true };
    setMine(next);
    const state = await saveSelection(next);
    if (state?.bothReady || state?.reveal) await startFromSelection();
  };

  const handleSyncVote = () => {
    if (mySyncVoteRef.current || mine.ready) return;
    mySyncVoteRef.current = true;
    setMySyncVote(true);
    syncChannelRef.current?.send({ type: 'broadcast', event: 'sync_vote', payload: { voted: true } });
  };

  // Load scenepacks from DB
  useEffect(() => {
    if (!open) return;
    supabase
      .from('scenepack_pool')
      .select('id, title, thumbnail_url, pack_count')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setScenepacks(data.map((p: any) => ({
            id: p.id,
            name: p.title,
            poster: p.thumbnail_url || '',
            packCount: p.pack_count || 0,
          })));
        }
      });
  }, [open]);

  // Load songs from battle_songs
  useEffect(() => {
    if (!open) return;
    supabase
      .from('battle_songs' as any)
      .select('id, song_name, artist_name, cover_url, preview_url, audio_url, is_priority, is_featured, difficulty, deezer_id')
      .eq('is_featured', true)
      .order('is_priority', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setSongs(data.map((t: any) => ({
            id: t.id,
            title: t.song_name,
            artist: t.artist_name,
            cover: t.cover_url,
            preview: t.preview_url || t.audio_url,
            difficulty: t.difficulty || null,
            deezer_id: t.deezer_id || null,
          })));
        }
      });
  }, [open]);

  // Reset when opened
  useEffect(() => {
    if (!open) return;
    setPhase('select');
    setTab('scenepack');
    setTimeLeft(PHASE_TIMER_SEC);
    setMine(EMPTY_PICKS);
    setOpp(EMPTY_PICKS);
    setOpponentReady(false);
    setBothReady(false);
    setRevealSelections(false);
    setDeadlineIso(selectionDeadline || null);
    timeoutHandledRef.current = false;
    startingRef.current = false;
    mySyncVoteRef.current = false;
    setMySyncVote(false);
    setOppSyncVote(false);
    setIntro({ pct: 0, count: 3 });
  }, [open, selectionDeadline]);

  // Read sanitized lobby state; opponent picks stay hidden until reveal.
  useEffect(() => {
    if (!open || !fightId || phase !== 'select') return;
    let cancelled = false;
    const fetchState = async () => {
      const { data } = await supabase.rpc('get_quick_fight_selection_state' as any, { p_fight_id: fightId } as any);
      if (!cancelled) applySelectionState(data);
      if (!cancelled && (data as any)?.status === 'active') setPhase('intro');
    };
    fetchState();
    const iv = setInterval(fetchState, 2000);
    const channel = supabase
      .channel(`quick_fight_selection_${fightId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fights', filter: `id=eq.${fightId}` }, fetchState)
      .subscribe();
    return () => {
      cancelled = true;
      clearInterval(iv);
      supabase.removeChannel(channel);
    };
  }, [applySelectionState, fightId, open, phase]);

  // Sync vote channel: broadcast-based so no DB schema changes needed
  useEffect(() => {
    if (!open || !fightId) return;
    const ch = supabase.channel(`qfs_sync_${fightId}`);
    syncChannelRef.current = ch;
    ch.on('broadcast', { event: 'sync_vote' }, ({ payload }: any) => {
      if (payload?.voted) setOppSyncVote(true);
    }).subscribe();
    // Re-broadcast our vote every 2s so late-joiners pick it up
    const iv = setInterval(() => {
      if (mySyncVoteRef.current) {
        ch.send({ type: 'broadcast', event: 'sync_vote', payload: { voted: true } });
      }
    }, 2000);
    return () => {
      clearInterval(iv);
      supabase.removeChannel(ch);
      syncChannelRef.current = null;
    };
  }, [open, fightId]);

  // Auto-switch to assigned tab when sync activates
  useEffect(() => {
    if (syncActive) setTab(syncRole);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncActive]);

  // Phase timer — lobby countdown. It does not start the battle until 0:00.
  useEffect(() => {
    if (!open || phase !== 'select') return;
    const iv = setInterval(() => {
      const remaining = deadlineIso
        ? Math.max(0, Math.ceil((new Date(deadlineIso).getTime() - Date.now()) / 1000))
        : Math.max(0, timeLeft - 1);
      setTimeLeft(remaining);
      if (remaining <= 0 && !timeoutHandledRef.current) {
        timeoutHandledRef.current = true;
        handleTimeout();
      }
    }, 500);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, deadlineIso, mine.pack, mine.song, mine.ready, songs]);

  // Advance only when backend confirms both ready / reveal condition.
  useEffect(() => {
    if (!open || phase !== 'select') return;
    if (bothReady && revealSelections) {
      startFromSelection().catch(() => {});
    }
  }, [bothReady, revealSelections, open, phase, startFromSelection]);

  // Intro animation
  useEffect(() => {
    if (phase !== 'intro') return;
    let raf = 0;
    const start = performance.now();
    const dur = 1800;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setIntro(s => ({ ...s, pct: p * 100 }));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        let c = 3;
        const iv = setInterval(() => {
          c -= 1;
          setIntro(s => ({ ...s, count: c }));
          if (c <= 0) {
            clearInterval(iv);
            setTimeout(() => onComplete(), 400);
          }
        }, 800);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Force-reveal both players' picks when intro starts (poll stopped at this point)
  useEffect(() => {
    if (phase !== 'intro') return;
    let cancelled = false;
    supabase.rpc('get_quick_fight_selection_state' as any, { p_fight_id: fightId } as any)
      .then(({ data }) => {
        if (cancelled || !data) return;
        applySelectionState(data as any);
      });
    return () => { cancelled = true; };
  }, [phase, fightId, applySelectionState]);

  function handleTimeout() {
    const pool = songs.length ? songs : FALLBACK_SONGS;
    const packPool = scenepacks.length ? scenepacks : [];
    const randomPack = packPool.length ? packPool[Math.floor(Math.random() * packPool.length)] : null;
    const randomSong = pool[Math.floor(Math.random() * pool.length)];
    const needsPack = !mine.pack && (syncActive ? syncRole === 'scenepack' : true);
    const needsSong = !mine.song && (syncActive ? syncRole === 'song' : true);
    const next = {
      ...mine,
      pack: needsPack ? randomPack : mine.pack,
      song: needsSong ? randomSong : mine.song,
      ready: true,
    } as PlayerPicks;
    const assignedPack = needsPack && randomPack;
    const assignedSong = needsSong && randomSong;
    if (assignedPack || assignedSong) {
      const parts: string[] = [];
      if (assignedPack) parts.push(`scenepack: ${randomPack!.name}`);
      if (assignedSong) parts.push(`song: ${randomSong.title}`);
      toast(`🎲 Time's up! Random picks assigned — ${parts.join(', ')}`, { duration: 6000 });
    }
    setMine(next);
    saveSelection(next).finally(() => startFromSelection()).catch(() => {});
  }

  function pickRandomPack() {
    if (!scenepacks.length) return;
    setMyPack(scenepacks[Math.floor(Math.random() * scenepacks.length)]);
  }
  function pickRandomSong() {
    const pool = songs.length ? songs : FALLBACK_SONGS;
    setMySong(pool[Math.floor(Math.random() * pool.length)]);
  }

  async function togglePreview(s: Song) {
    if (!s.preview && !s.deezer_id) return;
    const a = previewRef.current;
    if (!a) return;

    if (previewingId === s.id) {
      a.pause();
      setPreviewingId(null);
      return;
    }

    a.pause();
    setPreviewingId(s.id);

    let src = s.preview;
    if (s.deezer_id) {
      try {
        const res = await fetch(`https://api.deezer.com/track/${s.deezer_id}`);
        const data = await res.json();
        if (data?.preview) src = data.preview;
      } catch { /* fall back to stored url */ }
    }
    if (!src) { setPreviewingId(null); return; }
    a.src = src;
    a.onended = () => setPreviewingId(p => p === s.id ? null : p);
    a.load();
    a.play().catch(() => setPreviewingId(null));
  }

  if (!open) return null;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const lowTime = timeLeft <= 30;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black text-foreground overflow-hidden" style={{
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(239,68,68,0.10), transparent 60%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      backgroundSize: 'auto, 28px 28px, 28px 28px',
    }}>
      {/* Exit button — top left */}
      {phase !== 'intro' && onCancel && (
        <button
          onClick={onCancel}
          aria-label="Exit"
          className="absolute z-30 top-[max(env(safe-area-inset-top),12px)] left-3 w-9 h-9 rounded-full bg-black/70 backdrop-blur border border-white/15 flex items-center justify-center active:scale-90 transition"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Top bar: you + timer + opponent status. NEVER shows opponent picks. */}
      {phase !== 'intro' && (
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between pl-14 pr-3 pt-[max(env(safe-area-inset-top),12px)] pb-2 bg-gradient-to-b from-black/90 to-transparent">
          <PlayerChip color={mySide} player={you} ready={mine.ready} label="You" />
          <div className="text-center px-2">
            <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground font-bold">Time Left</p>
            <p className={`font-display text-2xl tabular-nums leading-none ${lowTime ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>{mm}:{ss}</p>
          </div>
          <PlayerChip color={opponentSide} player={opponent} ready={opp.ready} label="Opponent" align="right" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'select' && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col pt-[78px] pb-[120px]">
            {/* Tabs */}
            <div className="px-3 mb-2">
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                <TabBtn active={tab === 'scenepack'} done={!!mine.pack} onClick={() => setTab('scenepack')} icon={<Film className="w-3.5 h-3.5" />} label="Scenepack" disabled={syncActive && syncRole !== 'scenepack'} />
                <TabBtn active={tab === 'song'} done={!!mine.song} onClick={() => setTab('song')} icon={<Music className="w-3.5 h-3.5" />} label="Song" disabled={syncActive && syncRole !== 'song'} />
              </div>
            </div>

            {tab === 'scenepack' && (
              <div className="flex-1 relative min-h-0">
                <div className="h-full overflow-y-auto px-3">
                {scenepacks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-white/30">
                    <Film className="w-8 h-8" />
                    <p className="text-xs">No scenepacks available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-8">
                    {scenepacks.map((p) => {
                      const picked = mine.pack?.id === p.id;
                      return (
                        <button key={p.id} onClick={() => setMyPack(p)} disabled={mine.ready}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all active:scale-[0.97] disabled:opacity-70
                            ${picked ? (mySide === 'red' ? 'border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.55)]' : 'border-blue-500 shadow-[0_0_24px_rgba(59,130,246,0.55)]') :
                              'border-white/10 hover:border-white/30'}`}>
                          <div className="aspect-[2/3] w-full bg-white/5 flex items-center justify-center overflow-hidden">
                            {p.poster
                              ? <img src={p.poster} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              : <Film className="w-8 h-8 text-white/20" />}
                          </div>
                          <div className="px-2 py-1.5 bg-black/85 text-left">
                            <p className="text-[11px] font-bold truncate">{p.name}</p>
                            <p className="text-[9px] text-muted-foreground">{p.packCount} scenepacks</p>
                          </div>
                          {picked && (
                            <div className={`absolute top-1.5 left-1.5 w-6 h-6 rounded-full ${mySide === 'red' ? 'bg-red-500' : 'bg-blue-500'} flex items-center justify-center shadow-lg`}>
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                </div>
                {/* Scroll indicator */}
                {scenepacks.length > 0 && (
                  <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none flex flex-col items-center justify-end pb-1.5"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
                    <ChevronDown className="w-4 h-4 text-white/30 animate-bounce" />
                  </div>
                )}
              </div>
            )}

            {tab === 'song' && (
              <div className="flex-1 relative min-h-0">
              <div className="h-full overflow-y-auto overflow-x-hidden">
                {/* Search bar */}
                <div className="mb-3 px-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                    <input
                      value={deezerQuery}
                      onChange={(e) => setDeezerQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') runDeezerSearch(deezerQuery); }}
                      placeholder="Search any song globally…"
                      disabled={mine.ready}
                      className="w-full pl-8 pr-9 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    />
                    {deezerLoading ? (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 animate-spin" />
                    ) : deezerQuery.trim() ? (
                      <button
                        onClick={() => { setDeezerQuery(''); setDeezerResults([]); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                        aria-label="Clear"
                      >
                        <X className="w-3 h-3 text-white/70" />
                      </button>
                    ) : null}
                  </div>
                  {deezerResults.length > 0 && (
                    <p className="text-[9px] uppercase tracking-wider text-white/40 mt-2 px-1">
                      Deezer · {deezerResults.length} results · 30s previews
                    </p>
                  )}
                </div>

                {deezerResults.length > 0 ? (
                  /* Deezer search results — grid cards */
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-3">
                    {deezerResults.map((s) => {
                      const picked = mine.song?.id === s.id;
                      const playing = previewingId === s.id;
                      return (
                        <div key={s.id} className={`relative rounded-xl overflow-hidden border-2 transition-all
                            ${picked ? (mySide === 'red' ? 'border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.55)]' : 'border-blue-500 shadow-[0_0_24px_rgba(59,130,246,0.55)]') : 'border-white/10'}`}>
                          <button onClick={() => setMySong(s)} disabled={mine.ready} className="w-full text-left disabled:opacity-70">
                            <div className="aspect-square w-full bg-surface-2 flex items-center justify-center overflow-hidden relative">
                              <Music className="w-8 h-8 text-muted-foreground/40" />
                              {s.cover && <img src={s.cover} alt={s.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                            </div>
                            <div className="px-2 py-1.5 bg-black/85">
                              <p className="text-[11px] font-bold truncate">{s.title}</p>
                              <p className="text-[9px] text-muted-foreground truncate mt-0.5">{s.artist}</p>
                            </div>
                          </button>
                          {(s.preview || s.deezer_id) && (
                            <button onClick={() => togglePreview(s)} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/80 backdrop-blur flex items-center justify-center border border-white/20 active:scale-90">
                              {playing ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white ml-0.5" />}
                            </button>
                          )}
                          {picked && (
                            <div className={`absolute top-1.5 left-1.5 w-6 h-6 rounded-full ${mySide === 'red' ? 'bg-red-500' : 'bg-blue-500'} flex items-center justify-center shadow-lg`}>
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* osu!-style curated library list */
                  <div className="relative">
                    {/* Blurred cover background from selected song */}
                    {mine.song?.cover && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <img src={mine.song.cover} alt="" className="w-full h-full object-cover blur-2xl scale-110 opacity-[0.13]" />
                      </div>
                    )}
                    <div className="relative space-y-px">
                      {songs.map((s) => {
                        const picked = mine.song?.id === s.id;
                        const playing = previewingId === s.id;
                        const red = mySide === 'red';
                        const starCount = DIFF_STARS[s.difficulty ?? ''] ?? 0;
                        const starColor = DIFF_STAR_COLOR[s.difficulty ?? ''] ?? 'text-white/30';
                        const starBg = DIFF_STAR_BG[s.difficulty ?? ''] ?? 'bg-white/5 border-white/15';
                        return (
                          <div
                            key={s.id}
                            className={`flex items-stretch transition-all duration-200 ${picked ? 'pl-0 h-[62px]' : 'pl-4 h-[52px]'}`}
                          >
                            {/* Cover thumbnail */}
                            <div className={`shrink-0 bg-black/50 overflow-hidden relative transition-all duration-200 ${picked ? 'w-[62px]' : 'w-[52px]'}`}>
                              <Music className="absolute inset-0 m-auto w-4 h-4 text-white/20" />
                              {s.cover && (
                                <img src={s.cover} alt="" className="absolute inset-0 w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              )}
                            </div>
                            {/* Song ribbon */}
                            <button
                              onClick={() => !mine.ready && setMySong(s)}
                              disabled={mine.ready}
                              style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}
                              className={`flex-1 flex items-center gap-2 px-3 text-left min-w-0 disabled:opacity-60 transition-all duration-200
                                ${picked
                                  ? red
                                    ? 'bg-gradient-to-r from-red-600 via-red-800/90 to-black/60 border-l-[3px] border-red-400'
                                    : 'bg-gradient-to-r from-blue-600 via-blue-800/90 to-black/60 border-l-[3px] border-blue-400'
                                  : 'bg-black/55 hover:bg-white/[0.07]'}`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold truncate leading-snug ${picked ? 'text-white text-[14px]' : 'text-white/70 text-[12px]'}`}>{s.title}</p>
                                <p className={`truncate ${picked ? 'text-[11px] text-white/55' : 'text-[9px] text-white/30'}`}>{s.artist}</p>
                              </div>
                              {s.difficulty && (
                                <div className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg border ${starBg} shrink-0`}>
                                  <div className="flex items-center gap-px">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`${picked ? 'w-2.5 h-2.5' : 'w-2 h-2'} ${i < starCount ? `fill-current ${starColor}` : 'text-white/10'}`} />
                                    ))}
                                  </div>
                                  <span className={`text-[7px] font-black uppercase tracking-wider leading-none ${starColor}`}>{s.difficulty}</span>
                                </div>
                              )}
                            </button>
                            {/* Preview / selection indicator */}
                            <button
                              onClick={() => (s.preview || s.deezer_id) ? togglePreview(s) : undefined}
                              className={`w-11 shrink-0 flex items-center justify-center transition-all duration-200
                                ${picked ? (red ? 'bg-red-800/70' : 'bg-blue-800/70') : 'bg-black/35 hover:bg-white/[0.06]'}`}
                            >
                              {playing
                                ? <Pause className="w-3.5 h-3.5 text-white" />
                                : picked
                                  ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                  : (s.preview || s.deezer_id)
                                    ? <Play className="w-3 h-3 text-white/50 ml-0.5" />
                                    : null}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
                {/* Scroll indicator */}
                <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none flex flex-col items-center justify-end pb-1.5"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
                  <ChevronDown className="w-4 h-4 text-white/30 animate-bounce" />
                </div>
              </div>
            )}

            <BottomControls
              onRandom={() => tab === 'scenepack' ? pickRandomPack() : pickRandomSong()}
              onSync={handleSyncVote}
              canReady={canReady}
              ready={mine.ready}
              onReady={lockInReady}
              mySyncVote={mySyncVote}
              syncActive={syncActive}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex">
            <IntroSide color="red"  player={redPlayer}  pack={redPicks.pack}  song={redPicks.song} />
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center">
                <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.9, repeat: Infinity }} className="flex flex-col items-center">
                  <Swords className="w-8 h-8 text-amber-400 mb-1" style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.6))' }} />
                  <p
                    className="text-[72px] leading-none font-black text-white"
                    style={{ fontFamily: 'Teko, sans-serif', WebkitTextStroke: '3px #000', textShadow: '4px 4px 0 #000', letterSpacing: '0.02em' }}
                  >
                    VS
                  </p>
                </motion.div>
                <p className="mt-1 text-[8px] uppercase tracking-[0.4em] text-white/50 font-black">Fight Starting</p>
                {intro.pct >= 100 && intro.count > 0 && (
                  <motion.p
                    key={intro.count}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                    className="mt-1 text-[48px] leading-none font-black text-red-500"
                    style={{ fontFamily: 'Teko, sans-serif', WebkitTextStroke: '2px #000', textShadow: '3px 3px 0 #000' }}
                  >
                    {intro.count}
                  </motion.p>
                )}
                {intro.pct >= 100 && intro.count === 0 && (
                  <motion.p
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                    className="mt-1 text-[48px] leading-none font-black text-emerald-400"
                    style={{ fontFamily: 'Teko, sans-serif', WebkitTextStroke: '2px #000', textShadow: '3px 3px 0 #000' }}
                  >
                    GO!
                  </motion.p>
                )}
              </div>
            </div>
            <IntroSide color="blue" player={bluePlayer} pack={bluePicks.pack} song={bluePicks.song} mirrored />
          </motion.div>
        )}
      </AnimatePresence>

    </div>,
    document.body,
  );
}

function PlayerChip({ player, color, ready, label, align = 'left' }: { player: Player; color: 'red' | 'blue'; ready: boolean; label?: string; align?: 'left' | 'right' }) {
  const ring = color === 'red' ? 'border-red-500/70 shadow-[0_0_14px_rgba(239,68,68,0.5)]' : 'border-blue-500/70 shadow-[0_0_14px_rgba(59,130,246,0.5)]';
  const tint = color === 'red' ? 'text-red-400' : 'text-blue-400';
  return (
    <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${ring} bg-surface-2 flex items-center justify-center shrink-0`}>
        {player.avatarUrl
          ? <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover" />
          : <span className="text-sm font-bold">{player.username[0]?.toUpperCase()}</span>}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold truncate max-w-[90px]">
          {label && <span className="text-muted-foreground font-medium mr-1">{label}:</span>}
          {player.username}
        </p>
        <p className={`text-[8px] font-bold uppercase tracking-[0.18em] ${ready ? 'text-emerald-400' : tint}`}>
          {ready ? '✓ Ready' : 'Selecting…'}
        </p>
      </div>
    </div>
  );
}

function TabBtn({ active, done, onClick, icon, label, disabled }: { active: boolean; done: boolean; onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition
        ${active ? 'bg-white text-black' : disabled ? 'text-white/20 cursor-not-allowed' : 'text-white/70 hover:text-white'}`}>
      {done ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : icon}
      {label}
    </button>
  );
}

function BottomControls({
  onRandom,
  onSync,
  canReady,
  ready,
  onReady,
  mySyncVote,
  syncActive,
}: {
  onRandom: () => void;
  onSync: () => void;
  canReady: boolean;
  ready: boolean;
  onReady: () => void;
  mySyncVote: boolean;
  syncActive: boolean;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] bg-gradient-to-t from-black via-black/90 to-transparent">
      <div className="flex items-center gap-2">
        <button onClick={onRandom} disabled={ready}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition shadow-lg shadow-red-600/30">
          <Shuffle className="w-4 h-4" /> Random
        </button>
        <button onClick={onSync} disabled={ready || mySyncVote}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition ${
            syncActive
              ? 'bg-emerald-600/20 border border-emerald-400/60 text-emerald-300'
              : mySyncVote
                ? 'border border-amber-400/50 text-amber-300 bg-amber-500/10 opacity-70'
                : 'border border-white/20 text-white/80 hover:text-white hover:border-white/40'
          }`}>
          <Users className="w-4 h-4" />
          {syncActive ? '2/2 SYNCED' : mySyncVote ? '1/2…' : 'SYNC'}
        </button>
        <button onClick={onReady} disabled={!canReady || ready}
          className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border font-bold uppercase tracking-wider text-[10px] transition active:scale-[0.97] ${
            ready
              ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
              : canReady
                ? 'bg-emerald-600 border-emerald-400/70 text-white shadow-lg shadow-emerald-600/25'
                : 'border-white/15 text-white/40'
          }`}>
          <Check className="w-3.5 h-3.5" /> {ready ? 'Locked' : 'Ready'}
        </button>
      </div>
    </div>
  );
}

function IntroSide({ color, player, pack, song, mirrored }: { color: 'red' | 'blue'; player: Player; pack: Scenepack | null; song: Song | null; mirrored?: boolean }) {
  const isRed = color === 'red';
  const borderColor = isRed ? '#ef4444' : '#3b82f6';
  const accent = isRed ? 'text-red-400' : 'text-blue-400';
  const grad = isRed
    ? 'linear-gradient(180deg, rgba(239,68,68,0.25) 0%, rgba(0,0,0,0.98) 100%)'
    : 'linear-gradient(180deg, rgba(59,130,246,0.25) 0%, rgba(0,0,0,0.98) 100%)';
  return (
    <motion.div
      initial={{ x: mirrored ? 50 : -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="flex-1 relative overflow-hidden flex flex-col items-center justify-center px-4 py-6"
      style={{ background: grad }}
    >
      {pack?.poster && (
        <img src={pack.poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.12]" />
      )}
      <div className="relative z-10 flex flex-col items-center text-center w-full">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-24 h-24 rounded-full overflow-hidden border-4 bg-black mb-2.5"
          style={{ borderColor }}
        >
          {player.avatarUrl
            ? <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-3xl font-black" style={{ fontFamily: 'Teko, sans-serif', color: borderColor }}>
                {player.username[0]?.toUpperCase()}
              </div>}
        </motion.div>

        <p className={`text-[8px] font-black uppercase tracking-[0.3em] ${accent}`} style={{ fontFamily: 'Teko, sans-serif' }}>
          {color.toUpperCase()}
        </p>
        <p
          className="text-[22px] font-black text-white uppercase leading-tight w-full max-w-[140px] truncate"
          style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}
        >
          {player.username}
        </p>

        <div className="mt-4 w-full max-w-[140px] space-y-2.5 text-left">
          <div>
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold mb-0.5">Scenepack</p>
            <p className="text-[15px] font-black text-white leading-tight truncate" style={{ fontFamily: 'Teko, sans-serif' }}>
              {pack?.name || '—'}
            </p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold mb-0.5">Song</p>
            <p className="text-[15px] font-black text-white leading-tight truncate" style={{ fontFamily: 'Teko, sans-serif' }}>
              {song?.title || '—'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
