import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Shuffle, Upload, Users, Swords, Music, Play, Pause, ChevronRight, Loader2, X } from 'lucide-react';
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
  you: Player;
  opponent: Player;
  youSide?: PlayerSide;
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

type Phase = 'scenepack' | 'song' | 'intro';
type PlayerSide = 'red' | 'blue';
type SideSelections<T> = Record<PlayerSide, T | null>;
type SideReady = Record<PlayerSide, boolean>;

export default function BattleSelectFlow({ open, you, opponent, youSide = 'red', onComplete, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('scenepack');
  const [timeLeft, setTimeLeft] = useState(PHASE_TIMER_SEC);
  const [songs, setSongs] = useState<Song[]>(FALLBACK_SONGS);

  const [packSelections, setPackSelections] = useState<SideSelections<Scenepack>>({ red: null, blue: null });
  const [songSelections, setSongSelections] = useState<SideSelections<Song>>({ red: null, blue: null });
  const [packReady, setPackReady] = useState<SideReady>({ red: false, blue: false });
  const [songReady, setSongReady] = useState<SideReady>({ red: false, blue: false });
  const [syncPack, setSyncPack] = useState<SideReady>({ red: false, blue: false });
  const [syncSong, setSyncSong] = useState<SideReady>({ red: false, blue: false });

  const [intro, setIntro] = useState({ pct: 0, count: 3 });

  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const mySide: PlayerSide = youSide;
  const opponentSide: PlayerSide = mySide === 'red' ? 'blue' : 'red';
  const redPlayer = mySide === 'red' ? you : opponent;
  const bluePlayer = mySide === 'blue' ? you : opponent;
  const myPack = packSelections[mySide];
  const opponentPack = packSelections[opponentSide];
  const mySong = songSelections[mySide];
  const opponentSong = songSelections[opponentSide];
  const myTint = mySide === 'red' ? 'red' : 'blue';

  const setMyPack = (pack: Scenepack) => {
    setPackSelections(prev => ({ ...prev, [mySide]: pack }));
    setPackReady(prev => ({ ...prev, [mySide]: false }));
  };

  const setOpponentPack = (pack: Scenepack) => {
    setPackSelections(prev => ({ ...prev, [opponentSide]: pack }));
    setPackReady(prev => ({ ...prev, [opponentSide]: true }));
  };

  const setMySong = (song: Song) => {
    setSongSelections(prev => ({ ...prev, [mySide]: song }));
    setSongReady(prev => ({ ...prev, [mySide]: false }));
  };

  const setOpponentSong = (song: Song) => {
    setSongSelections(prev => ({ ...prev, [opponentSide]: song }));
    setSongReady(prev => ({ ...prev, [opponentSide]: true }));
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
    setPhase('scenepack');
    setTimeLeft(PHASE_TIMER_SEC);
    setMyPack(null); setOppPack(null); setMySong(null); setOppSong(null);
    setIntro({ pct: 0, count: 3 });
  }, [open]);

  // Simulated opponent picks
  useEffect(() => {
    if (!open) return;
    if (phase === 'scenepack' && !oppPack) {
      const t = setTimeout(() => {
        setOppPack(SCENEPACKS[Math.floor(Math.random() * SCENEPACKS.length)]);
      }, 3500 + Math.random() * 4000);
      return () => clearTimeout(t);
    }
    if (phase === 'song' && !oppSong) {
      const t = setTimeout(() => {
        setOppSong(songs[Math.floor(Math.random() * songs.length)] || FALLBACK_SONGS[0]);
      }, 3500 + Math.random() * 4000);
      return () => clearTimeout(t);
    }
  }, [open, phase, oppPack, oppSong, songs]);

  // Phase timer
  useEffect(() => {
    if (!open || phase === 'intro') return;
    setTimeLeft(PHASE_TIMER_SEC);
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(iv); handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase]);

  // Auto-advance when both ready
  useEffect(() => {
    if (!open) return;
    if (phase === 'scenepack' && myPack && oppPack) {
      const t = setTimeout(() => setPhase('song'), 600);
      return () => clearTimeout(t);
    }
    if (phase === 'song' && mySong && oppSong) {
      const t = setTimeout(() => setPhase('intro'), 600);
      return () => clearTimeout(t);
    }
  }, [open, phase, myPack, oppPack, mySong, oppSong]);

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
    if (phase === 'scenepack') {
      setMyPack(p => p || SCENEPACKS[Math.floor(Math.random() * SCENEPACKS.length)]);
      setOppPack(p => p || SCENEPACKS[Math.floor(Math.random() * SCENEPACKS.length)]);
    } else if (phase === 'song') {
      const pool = songs.length ? songs : FALLBACK_SONGS;
      setMySong(p => p || pool[Math.floor(Math.random() * pool.length)]);
      setOppSong(p => p || pool[Math.floor(Math.random() * pool.length)]);
    }
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

      {/* Top bar: players + timer */}
      {phase !== 'intro' && (
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between pl-14 pr-3 pt-[max(env(safe-area-inset-top),12px)] pb-2 bg-gradient-to-b from-black/90 to-transparent">
          <PlayerChip color="red"  player={you}      ready={phase === 'scenepack' ? !!myPack : !!mySong} />
          <div className="text-center px-2">
            <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground font-bold">Time Remaining</p>
            <p className={`font-display text-2xl tabular-nums leading-none ${lowTime ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>{mm}:{ss}</p>
          </div>
          <PlayerChip color="blue" player={opponent} ready={phase === 'scenepack' ? !!oppPack : !!oppSong} align="right" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'scenepack' && (
          <motion.div key="scenepack" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col pt-[88px] pb-[110px]">
            <div className="px-4 mb-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-bold">Phase 1 of 2</p>
              <h2 className="font-display text-2xl">Select Your Scenepack</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SCENEPACKS.map((p) => {
                  const mine = myPack?.id === p.id;
                  return (
                    <button key={p.id} onClick={() => setMyPack(p)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all active:scale-[0.97]
                        ${mine ? 'border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.55)]' :
                          'border-white/10 hover:border-white/30'}`}>
                      <div className="aspect-[2/3] w-full bg-surface-2">
                        <img src={p.poster} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="px-2 py-1.5 bg-black/85 text-left">
                        <p className="text-[11px] font-bold truncate">{p.name}</p>
                        <p className="text-[9px] text-muted-foreground">{p.packCount} scenepacks</p>
                      </div>
                      {mine && (
                        <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <BottomControls
              onRandom={pickRandomPack}
              syncOn={syncPack}
              onToggleSync={() => {
                const next = !syncPack;
                setSyncPack(next);
                if (next && oppPack) setMyPack(oppPack);
              }}
            />
          </motion.div>
        )}

        {phase === 'song' && (
          <motion.div key="song" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col pt-[88px] pb-[110px]">
            <div className="px-4 mb-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-bold">Phase 2 of 2</p>
              <h2 className="font-display text-2xl">Select Your Song</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {songs.map((s) => {
                  const mine = mySong?.id === s.id;
                  const playing = previewingId === s.id;
                  return (
                    <div key={s.id} className={`relative rounded-xl overflow-hidden border-2 transition-all
                        ${mine ? 'border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.55)]' :
                          'border-white/10'}`}>
                      <button onClick={() => setMySong(s)} className="w-full text-left">
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
                      {mine && (
                        <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <BottomControls
              onRandom={pickRandomSong}
              syncOn={syncSong}
              onToggleSync={() => {
                const next = !syncSong;
                setSyncSong(next);
                if (next && oppSong) setMySong(oppSong);
              }}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex">
            <IntroSide color="red"  player={you}      pack={myPack}  song={mySong}  pct={intro.pct} />
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
            <IntroSide color="blue" player={opponent} pack={oppPack} song={oppSong} pct={intro.pct} mirrored />
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

function PlayerChip({ player, color, ready, align = 'left' }: { player: Player; color: 'red' | 'blue'; ready: boolean; align?: 'left' | 'right' }) {
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
        <p className="text-[11px] font-bold truncate max-w-[90px]">{player.username}</p>
        <p className={`text-[8px] font-bold uppercase tracking-[0.18em] ${ready ? 'text-emerald-400' : tint}`}>
          {ready ? '✓ Ready' : 'Selecting…'}
        </p>
      </div>
    </div>
  );
}

function BottomControls({ onRandom, syncOn, onToggleSync }: { onRandom: () => void; syncOn?: boolean; onToggleSync?: () => void }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] bg-gradient-to-t from-black via-black/90 to-transparent">
      <div className="flex items-center gap-2">
        <button onClick={onRandom}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition shadow-lg shadow-red-600/30">
          <Shuffle className="w-4 h-4" /> Random
        </button>
        <button disabled
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/20 text-white/70 font-bold uppercase tracking-wider text-xs opacity-60">
          <Upload className="w-4 h-4" /> Custom
        </button>
        <button
          onClick={onToggleSync}
          aria-pressed={!!syncOn}
          className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border font-bold uppercase tracking-wider text-[10px] transition active:scale-[0.97] ${
            syncOn
              ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
              : 'border-white/20 text-white/70'
          }`}>
          <Users className="w-3.5 h-3.5" /> Sync
        </button>
      </div>
      {syncOn !== undefined && (
        <p className="text-center text-[9px] uppercase tracking-[0.22em] text-muted-foreground mt-2">
          {syncOn ? 'Will copy opponent pick when revealed' : 'Selections hidden until lock-in'}
        </p>
      )}
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
