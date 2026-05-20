import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Shuffle, Upload, Users, Swords, Music, Play, Pause, X, Film } from 'lucide-react';
import { createPortal } from 'react-dom';
import { SCENEPACKS, type Scenepack } from './scenepacks';
import { supabase } from '@/integrations/supabase/client';

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
  const [syncPack, setSyncPack] = useState(false);
  const [syncSong, setSyncSong] = useState(false);

  const [intro, setIntro] = useState({ pct: 0, count: 3 });

  const previewRef = useRef<HTMLAudioElement | null>(null);
  const timeoutHandledRef = useRef(false);
  const startingRef = useRef(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

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

  // Load songs from radio_tracks
  useEffect(() => {
    if (!open) return;
    supabase
      .from('radio_tracks' as any)
      .select('id, song_name, artist_name, cover_url, preview_url')
      .limit(40)
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setSongs(data.map((t: any) => ({
            id: t.id, title: t.song_name, artist: t.artist_name, cover: t.cover_url, preview: t.preview_url,
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
    setSyncPack(false);
    setSyncSong(false);
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
    if (previewingId === s.id) {
      previewRef.current?.pause();
      setPreviewingId(null);
      return;
    }
    if (previewRef.current) previewRef.current.pause();
    const a = new Audio(s.preview);
    a.volume = 0.5;
    a.play().catch(() => {});
    previewRef.current = a;
    setPreviewingId(s.id);
    setTimeout(() => { a.pause(); setPreviewingId(p => p === s.id ? null : p); }, 5000);
  }

  useEffect(() => () => { previewRef.current?.pause(); }, []);

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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {songs.map((s) => {
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
                            <p className="text-[9px] text-muted-foreground truncate">{s.artist}</p>
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
              canReady={canReady}
              ready={mine.ready}
              onReady={lockInReady}
              syncOn={tab === 'scenepack' ? syncPack : syncSong}
              canSync={opp.ready && !mine.ready}
              onToggleSync={() => {
                if (mine.ready || !opp.ready) return;
                if (tab === 'scenepack') {
                  const next = !syncPack;
                  setSyncPack(next);
                  if (next && opp.pack) setMyPack(opp.pack);
                } else {
                  const next = !syncSong;
                  setSyncSong(next);
                  if (next && opp.song) setMySong(opp.song);
                }
              }}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex">
            <IntroSide color="red"  player={redPlayer}  pack={redPicks.pack}  song={redPicks.song}  pct={intro.pct} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>
                  <Swords className="w-12 h-12 mx-auto text-gold mb-2" />
                  <p className="font-display text-6xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">VS</p>
                </motion.div>
                <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-white/80 font-bold">Fight Starting</p>
                {intro.count > 0 && intro.pct >= 100 && (
                  <p className="mt-2 font-display text-4xl text-red-500 tabular-nums">{intro.count}</p>
                )}
                {intro.count === 0 && intro.pct >= 100 && (
                  <p className="mt-2 font-display text-4xl text-emerald-400">START!</p>
                )}
              </div>
            </div>
            <IntroSide color="blue" player={bluePlayer} pack={bluePicks.pack} song={bluePicks.song} pct={intro.pct} mirrored />
          </motion.div>
        )}
      </AnimatePresence>

      {phase !== 'intro' && onCancel && (
        <button onClick={onCancel}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
          Forfeit Match
        </button>
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
  canReady,
  ready,
  onReady,
  syncOn,
  canSync,
  onToggleSync,
}: {
  onRandom: () => void;
  canReady: boolean;
  ready: boolean;
  onReady: () => void;
  syncOn?: boolean;
  canSync?: boolean;
  onToggleSync?: () => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] bg-gradient-to-t from-black via-black/90 to-transparent">
      <div className="flex items-center gap-2">
        <button onClick={onRandom} disabled={ready}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition shadow-lg shadow-red-600/30">
          <Shuffle className="w-4 h-4" /> Random
        </button>
        <button disabled
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/20 text-white/70 font-bold uppercase tracking-wider text-xs opacity-60">
          <Upload className="w-4 h-4" /> Custom
        </button>
        <button
          onClick={onToggleSync}
          disabled={ready || !canSync}
          aria-pressed={!!syncOn}
          title={canSync ? 'Copy opponent pick' : 'Waiting for opponent to lock in'}
          className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border font-bold uppercase tracking-wider text-[10px] transition active:scale-[0.97] ${
            syncOn
              ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
              : 'border-white/20 text-white/70 disabled:opacity-30'
          }`}>
          <Users className="w-3.5 h-3.5" /> Sync
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

function IntroSide({ color, player, pack, song, pct, mirrored }: { color: 'red' | 'blue'; player: Player; pack: Scenepack | null; song: Song | null; pct: number; mirrored?: boolean }) {
  const bg = color === 'red'
    ? 'linear-gradient(135deg, rgba(239,68,68,0.35), rgba(0,0,0,0.95) 70%)'
    : 'linear-gradient(225deg, rgba(59,130,246,0.35), rgba(0,0,0,0.95) 70%)';
  const tint = color === 'red' ? 'text-red-400' : 'text-blue-400';
  return (
    <motion.div initial={{ x: mirrored ? 60 : -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}
      className={`flex-1 relative overflow-hidden ${mirrored ? 'text-right items-end' : 'text-left items-start'} flex flex-col justify-center p-5`}
      style={{ background: bg }}>
      {pack && (
        <img src={pack.poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
      )}
      <div className={`relative z-10 ${mirrored ? 'ml-auto' : ''}`}>
        <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} transition={{ duration: 0.6 }}
          className={`w-24 h-24 rounded-full overflow-hidden border-4 ${color === 'red' ? 'border-red-500' : 'border-blue-500'} bg-surface-2 mb-3 ${mirrored ? 'ml-auto' : ''}`}>
          {player.avatarUrl
            ? <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-3xl font-bold">{player.username[0]?.toUpperCase()}</div>}
        </motion.div>
        <p className={`text-[9px] uppercase tracking-[0.22em] font-bold ${tint}`}>{classFromLevel(player.level)} · LV {player.level}</p>
        <p className="font-display text-xl text-white truncate max-w-[160px]">{player.username}</p>
        <div className="mt-3 space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-white/50">Scenepack</p>
          <p className="text-[12px] font-bold text-white truncate max-w-[180px]">{pack?.name || '—'}</p>
          <p className="text-[9px] uppercase tracking-wider text-white/50 mt-1.5">Song</p>
          <p className="text-[12px] font-bold text-white truncate max-w-[180px]">{song?.title || '—'}</p>
        </div>
        <p className={`mt-4 font-mono text-[10px] ${tint} tabular-nums`}>{pct.toFixed(1)}%</p>
        <div className={`mt-1 h-[2px] w-32 bg-white/10 rounded overflow-hidden ${mirrored ? 'ml-auto' : ''}`}>
          <div className={`h-full ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </motion.div>
  );
}
