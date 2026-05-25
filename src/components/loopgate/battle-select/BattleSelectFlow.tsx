import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Shuffle, Upload, Users, Swords, Music, Play, Pause, X, Film, Search, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { SCENEPACKS, type Scenepack } from './scenepacks';
import { supabase } from '@/integrations/supabase/client';

const DIFF_BADGE: Record<string, string> = {
  easy:      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  normal:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  hard:      'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  nightmare: 'bg-red-500/20 text-red-300 border border-red-500/30',
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

interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string | null;
  preview: string | null;
  difficulty?: string | null;
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

  // STRICT ISOLATION: local actions only mutate `mine`; opponent picks are
  // fetched from the backend only after both players are locked or timer expires.
  const [mine, setMine] = useState<PlayerPicks>(EMPTY_PICKS);
  const [opp, setOpp] = useState<PlayerPicks>(EMPTY_PICKS);
  const [opponentReady, setOpponentReady] = useState(false);
  const [bothReady, setBothReady] = useState(false);
  const [revealSelections, setRevealSelections] = useState(false);
  const [deadlineIso, setDeadlineIso] = useState<string | null>(selectionDeadline || null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');

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
  const redPicks = mySide === 'red' ? mine : opp;
  const bluePicks = mySide === 'blue' ? mine : opp;
  const redPlayer = mySide === 'red' ? you : opponent;
  const bluePlayer = mySide === 'blue' ? you : opponent;

  const canReady = !!mine.pack && !!mine.song;

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
    const next = { ...mine, pack };
    setMine(next);
    saveSelection(next).catch(() => {});
  };
  const setMySong = (song: Song) => {
    if (mine.ready) return;
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

  // Load songs from battle_songs
  useEffect(() => {
    if (!open) return;
    supabase
      .from('battle_songs' as any)
      .select('id, song_name, artist_name, cover_url, preview_url, audio_url, is_priority, is_featured, difficulty')
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
    setCustomOpen(false);
    setCustomText('');
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
    // Timer expiry auto-fills ONLY this player's missing picks, then asks backend to start.
    const next = {
      ...mine,
      pack: mine.pack || SCENEPACKS[Math.floor(Math.random() * SCENEPACKS.length)],
      song: mine.song || pool[Math.floor(Math.random() * pool.length)],
      ready: true,
    } as PlayerPicks;
    setMine(next);
    saveSelection(next).finally(() => startFromSelection()).catch(() => {});
  }

  function pickRandomPack() {
    setMyPack(SCENEPACKS[Math.floor(Math.random() * SCENEPACKS.length)]);
  }
  function pickRandomSong() {
    const pool = songs.length ? songs : FALLBACK_SONGS;
    setMySong(pool[Math.floor(Math.random() * pool.length)]);
  }

  function togglePreview(s: Song) {
    if (!s.preview) return;
    const a = previewRef.current;
    if (!a) return;

    if (previewingId === s.id) {
      a.pause();
      setPreviewingId(null);
      return;
    }

    a.pause();
    a.src = s.preview;
    a.currentTime = 0;
    a.onended = () => setPreviewingId(p => p === s.id ? null : p);
    setPreviewingId(s.id);
    a.play().catch(() => {
      // Play failed — reset so button goes back to play icon
      setPreviewingId(null);
    });
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
                <TabBtn active={tab === 'scenepack'} done={!!mine.pack} onClick={() => setTab('scenepack')} icon={<Film className="w-3.5 h-3.5" />} label="Scenepack" />
                <TabBtn active={tab === 'song'} done={!!mine.song} onClick={() => setTab('song')} icon={<Music className="w-3.5 h-3.5" />} label="Song" />
              </div>
            </div>

            {tab === 'scenepack' && (
              <div className="flex-1 overflow-y-auto px-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SCENEPACKS.map((p) => {
                    const picked = mine.pack?.id === p.id;
                    return (
                      <button key={p.id} onClick={() => setMyPack(p)} disabled={mine.ready}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all active:scale-[0.97] disabled:opacity-70
                          ${picked ? (mySide === 'red' ? 'border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.55)]' : 'border-blue-500 shadow-[0_0_24px_rgba(59,130,246,0.55)]') :
                            'border-white/10 hover:border-white/30'}`}>
                        <div className="aspect-[2/3] w-full bg-surface-2">
                          <img src={p.poster} alt={p.name} className="w-full h-full object-cover" />
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
              </div>
            )}

            {tab === 'song' && (
              <div className="flex-1 overflow-y-auto px-3">
                {/* Deezer global search */}
                <div className="mb-3">
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

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(deezerResults.length > 0 ? deezerResults : songs).map((s) => {
                    const picked = mine.song?.id === s.id;
                    const playing = previewingId === s.id;
                    return (
                      <div key={s.id} className={`relative rounded-xl overflow-hidden border-2 transition-all
                          ${picked ? (mySide === 'red' ? 'border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.55)]' : 'border-blue-500 shadow-[0_0_24px_rgba(59,130,246,0.55)]') :
                            'border-white/10'}`}>
                        <button onClick={() => setMySong(s)} disabled={mine.ready} className="w-full text-left disabled:opacity-70">
                          <div className="aspect-square w-full bg-surface-2 flex items-center justify-center">
                            {s.cover
                              ? <img src={s.cover} alt={s.title} className="w-full h-full object-cover" />
                              : <Music className="w-8 h-8 text-muted-foreground/40" />}
                          </div>
                          <div className="px-2 py-1.5 bg-black/85">
                            <p className="text-[11px] font-bold truncate">{s.title}</p>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <p className="text-[9px] text-muted-foreground truncate">{s.artist}</p>
                              {s.difficulty && (
                                <span className={`shrink-0 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${DIFF_BADGE[s.difficulty] ?? ''}`}>
                                  {s.difficulty === 'nightmare' ? '☠ NM' : s.difficulty}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                        {s.preview && (
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
              </div>
            )}

            <BottomControls
              onRandom={() => tab === 'scenepack' ? pickRandomPack() : pickRandomSong()}
              onCustom={() => {
                if (mine.ready) return;
                setCustomText(tab === 'scenepack' ? (mine.pack?.name || '') : (mine.song?.title || ''));
                setCustomOpen(true);
              }}
              canReady={canReady}
              ready={mine.ready}
              onReady={lockInReady}
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

      {customOpen && (
        <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setCustomOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-zinc-950 border border-white/15 rounded-t-2xl sm:rounded-2xl p-4 pb-[max(env(safe-area-inset-bottom),16px)]">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-1">Custom</p>
            <h3 className="font-display text-2xl text-white mb-3">
              {tab === 'scenepack' ? 'Enter Your Scenepack' : 'Enter Your Song'}
            </h3>
            <input
              autoFocus
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={tab === 'scenepack' ? 'e.g. Bleach TYBW' : 'e.g. The Weeknd — Blinding Lights'}
              className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
            />
            <p className="text-[10px] text-muted-foreground mt-2">
              This will be used as your {tab === 'scenepack' ? 'scenepack' : 'song'} for the battle. Make sure you actually use it.
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setCustomOpen(false)}
                className="flex-1 py-3 rounded-xl border border-white/15 text-white/70 text-xs font-bold uppercase tracking-wider active:scale-[0.98]">
                Cancel
              </button>
              <button
                onClick={() => {
                  const v = customText.trim();
                  if (!v) return;
                  if (tab === 'scenepack') {
                    setMyPack({ id: `custom:${v}`, name: v, poster: '', packCount: 0 });
                  } else {
                    setMySong({ id: `custom:${v}`, title: v, artist: 'Custom', cover: null, preview: null });
                  }
                  setCustomOpen(false);
                }}
                disabled={!customText.trim()}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-40 active:scale-[0.98]">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
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

function TabBtn({ active, done, onClick, icon, label }: { active: boolean; done: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition
        ${active ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}>
      {done ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : icon}
      {label}
    </button>
  );
}

function BottomControls({
  onRandom,
  onCustom,
  canReady,
  ready,
  onReady,
}: {
  onRandom: () => void;
  onCustom: () => void;
  canReady: boolean;
  ready: boolean;
  onReady: () => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] bg-gradient-to-t from-black via-black/90 to-transparent">
      <div className="flex items-center gap-2">
        <button onClick={onRandom} disabled={ready}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition shadow-lg shadow-red-600/30">
          <Shuffle className="w-4 h-4" /> Random
        </button>
        <button onClick={onCustom} disabled={ready}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 disabled:opacity-40 font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition">
          <Upload className="w-4 h-4" /> Custom
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
