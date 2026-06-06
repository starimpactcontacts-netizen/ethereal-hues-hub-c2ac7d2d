import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Music, Film, Link as LinkIcon, Zap, AlertTriangle, Upload, Play, Flame, X, Check, Timer as TimerIcon, Clock, Hourglass, ChevronRight, User } from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from '@icons-pack/react-simple-icons';
import { useAuth } from '@/hooks/useAuth';
import { createSoloShare } from '@/hooks/useSoloShares';
import { detectPlatform, getEmbedUrl } from '@/lib/videoEmbed';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { type LibrarySong, type LibraryScenepack } from '@/components/loopgate/SoloLibraryPicker';
import { supabase } from '@/integrations/supabase/client';
import GateIcon from '@/components/loopgate/GateIcon';
import BunnyVideo from '@/components/loopgate/BunnyVideo';
import { uploadToBunny, MAX_EDIT_UPLOAD_BYTES, MAX_EDIT_UPLOAD_LABEL } from '@/lib/bunnyUpload';

const teko = { fontFamily: 'Teko, sans-serif' };

type Timer = 30 | 60 | 180;

const TIMERS: { value: Timer; label: string; sub: string; tone: string }[] = [
  { value: 30,  label: '30M', sub: 'SPRINT',    tone: '#ef4444' },
  { value: 60,  label: '1H',  sub: 'STANDARD',  tone: '#fbbf24' },
  { value: 180, label: '3H',  sub: 'CINEMATIC', tone: '#8b5cf6' },
];

const TIMER_ICONS: Record<Timer, typeof TimerIcon> = {
  30: TimerIcon,
  60: Clock,
  180: Hourglass,
};

function fmtRemaining(ms: number) {
  if (ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CreateSoloSharePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [timer, setTimer] = useState<Timer | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());
  const [publishing, setPublishing] = useState(false);

  const [song, setSong] = useState<LibrarySong | null>(null);
  const [scenepack, setScenepack] = useState<LibraryScenepack | null>(null);
  const [songs, setSongs] = useState<LibrarySong[]>([]);
  const [packs, setPacks] = useState<LibraryScenepack[]>([]);
  const [libLoading, setLibLoading] = useState(true);

  const [videoUrl, setVideoUrl] = useState('');
  const [platform, setPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'bunny'>('tiktok');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [startOffset, setStartOffset] = useState(0);

  // Upload vs paste-link mode
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [uploadPct, setUploadPct] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pull library content once
  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('battle_songs' as any).select('*').eq('is_featured', true).order('is_priority', { ascending: false }).limit(40),
        supabase.from('scenepack_pool' as any).select('*').eq('active', true).order('sort_order', { ascending: true }).limit(30),
      ]);
      setSongs((s as any) || []);
      setPacks((p as any) || []);
      setLibLoading(false);
    })();
  }, []);

  // Tick clock once the session starts
  useEffect(() => {
    if (!startedAt) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [startedAt]);

  const deadline = useMemo(
    () => (startedAt && timer ? new Date(startedAt.getTime() + timer * 60_000) : null),
    [startedAt, timer]
  );
  const remaining = deadline ? deadline.getTime() - now : 0;
  const elapsedPct = deadline && startedAt && timer
    ? Math.min(1, (now - startedAt.getTime()) / (timer * 60_000))
    : 0;
  const overtime = !!(deadline && remaining < 0);

  const startTimer = (t: Timer) => {
    setTimer(t);
    setStartedAt(new Date());
  };

  // Auto-detect platform when URL changes
  useEffect(() => {
    if (mode !== 'link' || !videoUrl.trim()) return;
    const detected = detectPlatform(videoUrl.trim());
    if (detected !== 'other') setPlatform(detected);
  }, [videoUrl, mode]);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) { toast.error('Pick a video file.'); return; }
    if (file.size > MAX_EDIT_UPLOAD_BYTES) { toast.error(`Too large — ${MAX_EDIT_UPLOAD_LABEL} max`); return; }
    setUploading(true);
    setUploadPct(0);
    try {
      const res = await uploadToBunny(file, {
        folder: `solo/${user?.id || 'anon'}`,
        onProgress: (p) => setUploadPct(Math.round(p * 100)),
      });
      setVideoUrl(res.url);
      setPlatform('bunny');
      toast.success('Edit uploaded.');
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = useMemo(
    () => (videoUrl && platform !== 'bunny' ? getEmbedUrl(videoUrl, platform, startOffset) : null),
    [videoUrl, platform, startOffset]
  );

  const handlePublish = async () => {
    if (!user || !profile) { toast.error('Sign in first.'); navigate('/start'); return; }
    if (!videoUrl.trim()) { toast.error('Paste your edit URL first.'); return; }
    try { new URL(videoUrl.trim()); } catch { toast.error('That URL looks invalid.'); return; }

    setPublishing(true);
    const finalPlatform = platform === 'bunny'
      ? 'bunny'
      : (detectPlatform(videoUrl.trim()) !== 'other' ? detectPlatform(videoUrl.trim()) : platform);
    const share = await createSoloShare({
      user_id: user.id,
      username: profile.username || 'editor',
      avatar_url: profile.avatar_url || null,
      video_url: videoUrl.trim(),
      platform: finalPlatform,
      title: title.trim() || null,
      caption: caption.trim() || null,
      timer_minutes: timer,
      started_at: startedAt?.toISOString() || null,
      deadline_at: deadline?.toISOString() || null,
      is_overtime: overtime,
      start_offset_seconds: Math.max(0, Math.floor(startOffset)),
      song_name: song?.song_name || null,
      scenepack_url: scenepack ? `scenepack:${scenepack.id}` : null,
    });
    if (!share) { toast.error('Could not publish. Try again.'); setPublishing(false); return; }
    toast.success(overtime ? 'Published — flagged OVERTIME.' : 'Solo page live.');
    navigate(`/s/${share.slug}`);
  };

  const lobbyOpen = !startedAt;
  const tonePicked = TIMERS.find((t) => t.value === timer)?.tone || '#fbbf24';

  if (publishing) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center gap-4">
        <SEO title="Publishing Solo" noindex />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-3xl border-4 border-amber-400/30 border-t-amber-400"
        />
        <p className="text-[11px] uppercase tracking-[0.35em] text-amber-400 font-bold" style={teko}>GOING LIVE</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <SEO title="Create Solo Page" noindex />

      {/* Stage lights — Roblox lobby vibe */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-3xl transition-colors duration-700"
          style={{ backgroundColor: `${tonePicked}22` }}
        />
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(circle at 50% 0%, black, transparent 70%)',
        }} />
      </div>

      {/* Floating close */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-3 left-3 z-30 w-10 h-10 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <X className="w-5 h-5" />
      </button>

      {/* ====== osu!-STYLE LOBBY (timer not yet locked) ====== */}
      {lobbyOpen && <OsuLobby user={user} profile={profile} onPick={startTimer} />}

      <main className={`relative z-10 max-w-xl mx-auto px-4 pb-40 ${lobbyOpen ? 'hidden' : ''}`} style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)' }}>

        {/* ====== TIMER HUD (after lock) ====== */}
        <div className="text-center pt-2 pb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 mb-3">
            <GateIcon size={11} className="text-amber-400" />
            <span className="text-[11px] font-extrabold uppercase text-white/80" style={teko}>SOLO LOBBY</span>
          </div>
          <LobbyTimerHud remainingMs={remaining} overtime={overtime} pct={elapsedPct} tone={tonePicked} timerLabel={TIMERS.find(t=>t.value===timer)?.sub || ''} />
        </div>

        {/* ====== LIBRARY CAROUSELS ====== */}
        {!lobbyOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-7"
          >
            {/* Scenepacks */}
            <CarouselRow
              label="SCENEPACKS"
              accent="#8b5cf6"
              count={packs.length}
              empty={libLoading ? 'Loading…' : 'No packs available'}
            >
              {packs.map((p) => {
                const active = scenepack?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setScenepack(active ? null : p)}
                    className="snap-start shrink-0 relative w-[120px] aspect-[3/4] rounded-2xl overflow-hidden active:scale-[0.94] transition-transform"
                    style={{
                      border: active ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: active ? '0 0 0 4px rgba(139,92,246,0.25), 0 10px 30px -10px rgba(139,92,246,0.6)' : '0 6px 20px -10px rgba(0,0,0,0.8)',
                    }}
                  >
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black flex items-center justify-center">
                        <Film className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2 pt-8 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
                      <p className="text-[11px] font-bold text-white leading-tight line-clamp-2">{p.title}</p>
                    </div>
                    {active && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </CarouselRow>

            {/* Songs */}
            <CarouselRow
              label="TRACKS"
              accent="#fbbf24"
              count={songs.length}
              empty={libLoading ? 'Loading…' : 'No tracks available'}
            >
              {songs.map((s) => {
                const active = song?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSong(active ? null : s)}
                    className="snap-start shrink-0 w-[140px] rounded-2xl overflow-hidden active:scale-[0.94] transition-transform text-left"
                    style={{
                      border: active ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.08)',
                      background: active ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
                      boxShadow: active ? '0 0 0 4px rgba(251,191,36,0.25), 0 10px 30px -10px rgba(251,191,36,0.6)' : '0 6px 20px -10px rgba(0,0,0,0.8)',
                    }}
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-amber-900/40 to-black overflow-hidden">
                      {(s as any).cover_url ? (
                        <img src={(s as any).cover_url} alt={s.song_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music className="w-7 h-7 text-amber-400/60" /></div>
                      )}
                      <div className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 backdrop-blur flex items-center justify-center border border-white/10">
                        <Play className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-bold text-white truncate">{s.song_name}</p>
                      <p className="text-[10px] text-white/50 truncate">{(s as any).artist_name || 'Unknown'}</p>
                    </div>
                  </button>
                );
              })}
            </CarouselRow>

            {/* ====== DROP THE EDIT ====== */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-[13px] font-extrabold uppercase tracking-[0.22em]" style={teko}>YOUR EDIT</span>
                </div>
                <button
                  onClick={() => { setMode(mode === 'upload' ? 'link' : 'upload'); setVideoUrl(''); }}
                  className="text-[10px] uppercase tracking-wider text-white/40 hover:text-amber-400 font-bold"
                >
                  {mode === 'upload' ? '→ paste link instead' : '→ upload file instead'}
                </button>
              </div>

              {mode === 'upload' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
                  />
                  {!videoUrl && !uploading && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-[16/9] rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform relative overflow-hidden"
                      style={{
                        background: 'radial-gradient(circle at 50% 30%, rgba(251,191,36,0.15), rgba(0,0,0,0) 60%)',
                        border: '2px dashed rgba(251,191,36,0.4)',
                      }}
                    >
                      <div className="w-16 h-16 rounded-3xl bg-amber-400 flex items-center justify-center" style={{ boxShadow: '0 6px 0 0 #b45309, 0 14px 30px -8px rgba(251,191,36,0.5)' }}>
                        <Upload className="w-7 h-7 text-black" strokeWidth={2.5} />
                      </div>
                      <div className="text-center">
                        <p className="text-[18px] font-black uppercase tracking-wider text-white" style={teko}>TAP TO UPLOAD</p>
                        <p className="text-[9px] uppercase tracking-[0.25em] text-white/40 mt-0.5">MP4 / MOV · {MAX_EDIT_UPLOAD_LABEL}</p>
                      </div>
                    </button>
                  )}
                  {uploading && (
                    <div className="rounded-3xl border-2 border-amber-400/40 bg-amber-400/[0.05] p-5 space-y-3">
                      <div className="flex items-center justify-between text-amber-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.25em]" style={teko}>UPLOADING</span>
                        <span className="text-[20px] font-black" style={teko}>{uploadPct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-amber-400 transition-all" style={{ width: `${uploadPct}%`, boxShadow: '0 0 12px #fbbf24' }} />
                      </div>
                    </div>
                  )}
                  {videoUrl && !uploading && platform === 'bunny' && (
                    <div className="space-y-2">
                      <div className="rounded-3xl overflow-hidden bg-black border-2 border-emerald-500/40 relative" style={{ aspectRatio: '9/16', maxHeight: 360 }}>
                        <BunnyVideo src={videoUrl} className="w-full h-full object-contain" controls />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Check className="w-3 h-3" strokeWidth={3} /> LOADED
                        </div>
                      </div>
                      <button onClick={() => { setVideoUrl(''); fileInputRef.current?.click(); }} className="text-[10px] uppercase tracking-wider text-white/40 hover:text-amber-400">replace file</button>
                    </div>
                  )}
                </>
              )}

              {mode === 'link' && (
                <div className="space-y-2">
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="paste tiktok / ig / yt url"
                    className="bg-white/5 border-white/10 h-12 rounded-2xl text-sm"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: 'tiktok', label: 'TikTok', icon: <SiTiktok size={12} /> },
                      { id: 'instagram', label: 'IG', icon: <SiInstagram size={12} /> },
                      { id: 'youtube', label: 'YT', icon: <SiYoutube size={12} /> },
                    ] as const).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          platform === p.id ? 'bg-amber-400 text-black' : 'bg-white/[0.04] text-white/60 border border-white/10'
                        }`}
                      >
                        {p.icon}{p.label}
                      </button>
                    ))}
                  </div>
                  {previewUrl && (
                    <div className="rounded-3xl overflow-hidden bg-black border border-white/10 mt-2" style={{ aspectRatio: platform === 'youtube' && !videoUrl.includes('/shorts/') ? '16/9' : '9/16', maxHeight: 360 }}>
                      <iframe src={previewUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  )}
                  {platform === 'youtube' && previewUrl && (
                    <div className="pt-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 block">
                        Start at <span className="text-amber-400 font-bold">{startOffset}s</span>
                      </label>
                      <input type="range" min={0} max={120} step={1} value={startOffset} onChange={(e) => setStartOffset(parseInt(e.target.value, 10))} className="w-full accent-amber-400" />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="Title" className="bg-white/5 border-white/10 h-11 rounded-2xl text-sm" />
                <Input value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 200))} placeholder="Caption" className="bg-white/5 border-white/10 h-11 rounded-2xl text-sm" />
              </div>

              {overtime && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Clock expired — page ships flagged <b>OVERTIME</b>.</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* ====== STICKY PUBLISH ====== */}
      {!lobbyOpen && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-4 px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          <button
            onClick={handlePublish}
            disabled={!videoUrl.trim()}
            className="w-full max-w-xl mx-auto h-16 rounded-3xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-40 disabled:active:scale-100 relative overflow-hidden"
            style={{
              background: overtime ? 'linear-gradient(180deg, #f59e0b, #b45309)' : 'linear-gradient(180deg, #fde047, #f59e0b)',
              color: '#000',
              boxShadow: '0 8px 0 0 #92400e, 0 18px 40px -8px rgba(251,191,36,0.6), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}
          >
            <Zap className="w-6 h-6" strokeWidth={2.5} />
          <span className="text-[24px] font-black uppercase" style={teko}>{overtime ? 'SHIP OVERTIME' : 'PUBLISH SOLO'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* -------- Visual bits -------- */

function CarouselRow({ label, accent, count, empty, children }: { label: string; accent: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
          <span className="text-[15px] font-extrabold uppercase text-white" style={teko}>{label}</span>
          <span className="text-[10px] font-bold text-white/30">{count}</span>
        </div>
      </div>
      {count === 0 ? (
        <div className="h-32 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/30">{empty}</span>
        </div>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function LobbyTimerHud({ remainingMs, overtime, pct, tone, timerLabel }: { remainingMs: number; overtime: boolean; pct: number; tone: string; timerLabel: string }) {
  const size = 180;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, pct)));
  const display = overtime ? `+${fmtRemaining(-remainingMs)}` : fmtRemaining(remainingMs);
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          stroke={overtime ? '#ef4444' : tone}
          strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={c}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6 }}
          style={{ filter: `drop-shadow(0 0 8px ${overtime ? '#ef4444' : tone})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center gap-1.5 mb-1">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: overtime ? '#ef4444' : tone }}
          />
          <span className="text-[9px] font-extrabold uppercase tracking-[0.3em]" style={{ ...teko, color: overtime ? '#ef4444' : tone }}>
            {overtime ? 'OVERTIME' : 'LIVE'}
          </span>
        </div>
        <span className="text-[56px] leading-none font-black tabular-nums tracking-tight text-white" style={teko}>{display}</span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-1" style={teko}>{timerLabel}</span>
      </div>
    </div>
  );
}

/* -------- Visual bits -------- */

/* (legacy TimerPill / TimerRing removed — replaced by LobbyTimerHud) */

/* ====== osu!-style LOBBY ====== */
function OsuLobby({ user, profile, onPick }: { user: any; profile: any; onPick: (t: Timer) => void }) {
  const [hover, setHover] = useState<Timer | null>(null);
  const tone = TIMERS.find((t) => t.value === hover)?.tone || '#fbbf24';

  return (
    <div className="fixed inset-0 z-10 overflow-hidden bg-black">
      {/* Cinematic background wash */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ backgroundColor: `${tone}1a` }}
          transition={{ duration: 0.6 }}
          className="absolute -inset-32 blur-[120px]"
          style={{ backgroundColor: `${tone}1a` }}
        />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at 30% 50%, black, transparent 75%)',
          }}
        />
        {/* film grain vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
      </div>

      {/* Top-left guest / user chip — osu!-style */}
      <div
        className="absolute z-20 left-4 top-0 flex items-center gap-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-xl flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-white/60" />
          )}
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold text-white" style={teko}>{profile?.username || 'GUEST'}</p>
          <p className="text-[9px] uppercase tracking-[0.25em] text-white/40">
            {user ? 'READY TO DROP' : 'Sign in to publish'}
          </p>
        </div>
      </div>

      {/* Top-center status text */}
      <div
        className="absolute z-20 inset-x-0 flex flex-col items-center text-center px-4"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 18px)' }}
      >
        <p className="text-[12px] sm:text-[13px] text-white/80 font-semibold" style={teko}>
          You have a fresh slot — pick your clock.
        </p>
        <p className="text-[10px] text-white/35 uppercase tracking-[0.25em] mt-0.5" style={teko}>
          Solo Mode · Soft-lock timer
        </p>
      </div>

      {/* MAIN STAGE — circle on left, pills cascading right */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-[920px] mx-auto px-4 grid grid-cols-12 items-center gap-2 pointer-events-auto">

          {/* The disc */}
          <div className="col-span-5 sm:col-span-5 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 140, damping: 14 }}
              className="relative"
            >
              {/* outer halo rings */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: `0 0 0 12px ${tone}22, 0 0 80px 10px ${tone}55` }}
              />
              <div
                className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] rounded-full flex items-center justify-center"
                style={{
                  background:
                    'radial-gradient(circle at 35% 30%, #1a1a1a 0%, #050505 70%)',
                  border: '4px solid rgba(255,255,255,0.85)',
                  boxShadow:
                    'inset 0 0 60px rgba(0,0,0,0.8), 0 30px 60px -10px rgba(0,0,0,0.9)',
                }}
              >
                {/* triangle texture (osu! style) */}
                <div
                  className="absolute inset-0 rounded-full opacity-[0.07] overflow-hidden"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><polygon points='20,4 36,32 4,32' fill='white'/></svg>\")",
                    backgroundSize: '40px 40px',
                  }}
                />
                <div className="text-center leading-none">
                  <div className="text-white font-black tracking-tight" style={{ ...teko, fontSize: 90 }}>
                    solo<span className="text-amber-400">!</span>
                  </div>
                </div>
                {/* gloss */}
                <div
                  className="absolute inset-2 rounded-full pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 35%)',
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Pill menu */}
          <div className="col-span-7 sm:col-span-7 flex flex-col gap-2 sm:gap-2.5 -ml-6 sm:-ml-10">
            {TIMERS.map((t, idx) => {
              const Icon = TIMER_ICONS[t.value];
              const isHover = hover === t.value;
              return (
                <motion.button
                  key={t.value}
                  initial={{ x: 120, opacity: 0 }}
                  animate={{ x: isHover ? -10 : 0, opacity: 1 }}
                  transition={{ delay: 0.15 + idx * 0.08, type: 'spring', stiffness: 200, damping: 18 }}
                  onMouseEnter={() => setHover(t.value)}
                  onMouseLeave={() => setHover(null)}
                  onTouchStart={() => setHover(t.value)}
                  onClick={() => onPick(t.value)}
                  className="group relative w-full h-[58px] sm:h-[68px] rounded-l-full rounded-r-2xl flex items-center justify-between pl-10 pr-4 sm:pl-14 sm:pr-5 overflow-hidden active:scale-[0.97] transition-transform"
                  style={{
                    background: `linear-gradient(90deg, ${t.tone}cc 0%, ${t.tone}88 60%, ${t.tone}55 100%)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 10px 30px -10px ${t.tone}88, 0 4px 0 0 rgba(0,0,0,0.4)`,
                  }}
                >
                  {/* triangle texture */}
                  <div
                    className="absolute inset-0 opacity-[0.15] pointer-events-none"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><polygon points='14,3 25,23 3,23' fill='white'/></svg>\")",
                      backgroundSize: '28px 28px',
                    }}
                  />
                  <div className="relative flex items-center gap-3">
                    <span
                      className="text-white font-black"
                      style={{ ...teko, fontSize: 38, lineHeight: 1, textShadow: '0 2px 0 rgba(0,0,0,0.35)' }}
                    >
                      {t.label}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.25em] text-white/90" style={teko}>
                      {t.sub}
                    </span>
                  </div>
                  <div className="relative flex items-center gap-2 text-white/90">
                    <Icon className="w-5 h-5" />
                    <ChevronRight className="w-5 h-5 -ml-1 opacity-70" />
                  </div>
                  {/* gloss top */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom-left footer chip (osu!-style "ppy powered") */}
      <div
        className="absolute z-20 left-4 text-left"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}
      >
        <p className="text-[12px] font-bold text-white/60 leading-tight" style={teko}>LOOPGATE SOLO LOBBY</p>
        <p className="text-[9px] text-white/30 uppercase tracking-wider">soft-lock · overtime allowed</p>
      </div>
    </div>
  );
}