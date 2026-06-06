import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Music, Film, Link as LinkIcon, Zap, AlertTriangle, Upload, Play, Flame, X, Check, Timer as TimerIcon, Clock, Hourglass, ChevronRight, ChevronLeft, PanelLeftOpen, User, Pause, Settings2, Maximize2 } from 'lucide-react';
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

  // Song preview audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const togglePreview = (s: any) => {
    const url = s.preview_url || s.audio_url;
    if (!url) { toast.error('No preview available'); return; }
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    if (previewingId === s.id) {
      a.pause();
      setPreviewingId(null);
      return;
    }
    a.src = url;
    a.currentTime = 0;
    a.volume = 0.7;
    a.play().then(() => setPreviewingId(s.id)).catch(() => toast.error('Could not play preview'));
    a.onended = () => setPreviewingId((p) => (p === s.id ? null : p));
  };
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  // Rotate-to-landscape one-time hint
  const [rotateHintOpen, setRotateHintOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('solo_rotate_hint_seen') !== '1';
  });
  const dismissRotateHint = () => {
    setRotateHintOpen(false);
    try { localStorage.setItem('solo_rotate_hint_seen', '1'); } catch {}
  };

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

      {/* Floating close (only on lobby; in-edit cancel lives on the red title-bar dot) */}
      {lobbyOpen && (
        <button
          onClick={() => navigate('/solo')}
          className="fixed top-3 right-3 z-30 w-10 h-10 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* ====== osu!-STYLE LOBBY (timer not yet locked) ====== */}
      {lobbyOpen && <OsuLobby user={user} profile={profile} onPick={startTimer} />}

      {/* Rotate-to-landscape hint for phones in portrait */}
      {lobbyOpen && rotateHintOpen && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-md flex flex-col items-center justify-center gap-4 portrait:flex landscape:hidden sm:hidden px-8 text-center">
          <button
            onClick={dismissRotateHint}
            aria-label="Dismiss"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center active:scale-90 transition-transform"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 rounded-2xl border border-white/15 bg-white/[0.06] flex items-center justify-center animate-pulse">
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M7 3l-2 2 2 2" />
              <path d="M17 21l2-2-2-2" />
            </svg>
          </div>
          <div style={teko} className="text-[42px] leading-none">ROTATE YOUR PHONE</div>
          <div className="text-[13px] text-white/60 max-w-[260px]">This lobby is designed for landscape. Turn your device sideways for the best view.</div>
          <button
            onClick={dismissRotateHint}
            className="mt-2 px-5 h-9 rounded-full bg-white text-black text-[12px] font-semibold active:opacity-80 transition-opacity"
          >
            GOT IT
          </button>
        </div>
      )}

      <main className={`relative z-10 max-w-5xl mx-auto px-3 sm:px-5 pb-40 ${lobbyOpen ? 'hidden' : ''}`} style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>

        {/* ====== LIBRARY CAROUSELS ====== */}
        {!lobbyOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-7"
          >
            {/* ====== NLE COCKPIT — YOUR EDIT ====== */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
            <NLECockpit
              tone={tonePicked}
              videoUrl={videoUrl}
              uploading={uploading}
              uploadPct={uploadPct}
              platform={platform}
              onPick={() => fileInputRef.current?.click()}
              onReplace={() => { setVideoUrl(''); fileInputRef.current?.click(); }}
              title={title}
              setTitle={setTitle}
              caption={caption}
              setCaption={setCaption}
              overtime={overtime}
              remainingMs={remaining}
              timerLabel={TIMERS.find(t=>t.value===timer)?.sub || ''}
              onCancel={() => navigate('/solo')}
              packs={packs}
              songs={songs}
              libLoading={libLoading}
              scenepack={scenepack}
              setScenepack={setScenepack}
              song={song}
              setSong={setSong}
              previewingId={previewingId}
              togglePreview={togglePreview}
            />
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

/* -------- Visual bits -------- */

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
/* ====== NLE COCKPIT — AE/Premiere/Resolve x Roblox-Draw ====== */
function NLECockpit({
  tone, videoUrl, uploading, uploadPct, platform, onPick, onReplace,
  title, setTitle, caption, setCaption, overtime, remainingMs, timerLabel, onCancel,
  packs, songs, libLoading, scenepack, setScenepack, song, setSong, previewingId, togglePreview,
}: {
  tone: string;
  videoUrl: string;
  uploading: boolean;
  uploadPct: number;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'bunny';
  onPick: () => void;
  onReplace: () => void;
  title: string;
  setTitle: (v: string) => void;
  caption: string;
  setCaption: (v: string) => void;
  overtime: boolean;
  remainingMs: number;
  timerLabel: string;
  onCancel: () => void;
  packs: LibraryScenepack[];
  songs: LibrarySong[];
  libLoading: boolean;
  scenepack: LibraryScenepack | null;
  setScenepack: (p: LibraryScenepack | null) => void;
  song: LibrarySong | null;
  setSong: (s: LibrarySong | null) => void;
  previewingId: string | null;
  togglePreview: (s: LibrarySong) => void;
}) {
  const hasVid = !!videoUrl && platform === 'bunny' && !uploading;
  const timerDisplay = overtime ? `+${fmtRemaining(-remainingMs)}` : fmtRemaining(remainingMs);
  const timerColor = overtime ? '#ef4444' : tone;
  const [bin, setBin] = useState<'packs' | 'tracks'>('packs');
  const [binCollapsed, setBinCollapsed] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden border shadow-2xl"
      style={{
        background: 'linear-gradient(180deg,#101012 0%,#0a0a0c 100%)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: `0 30px 60px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* ===== TITLE BAR (Premiere window chrome) ===== */}
      <div
        className="flex items-center gap-2 px-3 h-9 border-b"
        style={{ background: 'linear-gradient(180deg,#1a1a1d,#131316)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <button
          type="button"
          onClick={() => { if (confirm('Cancel this solo edit?')) onCancel(); }}
          aria-label="Cancel edit"
          className="group relative w-3 h-3 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: '#ff5f57', boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 0 8px rgba(255,95,87,0.5)' }}
        >
          <X className="w-2 h-2 text-black/0 group-hover:text-black/70 transition-colors" strokeWidth={3} />
        </button>
        <div className="flex items-center gap-1.5 ml-2 flex-1 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
            style={{ background: tone, boxShadow: `0 0 8px ${tone}` }}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 80))}
            placeholder="UNTITLED.PROJ"
            spellCheck={false}
            className="flex-1 min-w-0 bg-transparent outline-none border-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/85 placeholder:text-white/30 focus:text-white"
            style={teko}
          />
        </div>
        {/* Inline countdown */}
        <div
          className="ml-auto flex items-center gap-1.5 px-2 h-6 rounded-md"
          style={{ background: `${timerColor}14`, border: `1px solid ${timerColor}55` }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: timerColor }}
          />
          <span className="text-[12px] font-black tabular-nums leading-none" style={{ ...teko, color: timerColor }}>{timerDisplay}</span>
          {timerLabel && (
            <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-white/40" style={teko}>{timerLabel}</span>
          )}
        </div>
      </div>

      {/* ===== BODY: bin panel + monitor ===== */}
      <div className="flex flex-col sm:flex-row" style={{ background: '#08080a' }}>

        {/* ----- LEFT: PROJECT BIN (Scenepacks / Tracks) ----- */}
        {binCollapsed ? (
          <button
            type="button"
            onClick={() => setBinCollapsed(false)}
            className="flex shrink-0 sm:w-7 sm:flex-col items-center justify-center sm:justify-start gap-1 sm:gap-2 py-1 sm:py-2 border-b sm:border-b-0 sm:border-r active:scale-95 transition-transform"
            style={{ background: '#0b0b0e', borderColor: 'rgba(255,255,255,0.06)' }}
            aria-label="Expand project bin"
          >
            <PanelLeftOpen className="w-3.5 h-3.5 text-white/40" />
            <span
              className="text-[8px] font-extrabold uppercase tracking-[0.25em] text-white/30 sm:mt-1"
              style={{ ...teko, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              PROJECT BIN
            </span>
          </button>
        ) : (
        <div
          className="shrink-0 sm:w-[260px] border-b sm:border-b-0 sm:border-r flex flex-col"
          style={{ background: '#0b0b0e', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* tab strip */}
          <div className="flex items-center gap-0 px-1.5 pt-1.5">
            {([
              { id: 'packs' as const, label: 'SCENEPACKS', accent: '#8b5cf6', icon: Film, count: packs.length },
              { id: 'tracks' as const, label: 'TRACKS', accent: '#fbbf24', icon: Music, count: songs.length },
            ]).map((t) => {
              const active = bin === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBin(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-t-md text-[9px] font-extrabold uppercase tracking-[0.15em] transition-colors"
                  style={{
                    ...teko,
                    background: active ? '#1a1a1d' : 'transparent',
                    color: active ? t.accent : 'rgba(255,255,255,0.4)',
                    border: active ? `1px solid ${t.accent}55` : '1px solid transparent',
                    borderBottom: 'none',
                  }}
                >
                  <Icon className="w-3 h-3" />
                  <span>{t.label}</span>
                  <span className="text-[8px] opacity-60">{t.count}</span>
                </button>
              );
            })}
            {/* Collapse-to-full tab */}
            <button
              type="button"
              onClick={() => setBinCollapsed(true)}
              className="flex items-center justify-center gap-1 h-7 px-2 rounded-t-md text-[9px] font-extrabold uppercase tracking-[0.15em] transition-colors active:scale-95"
              style={{
                ...teko,
                background: 'transparent',
                color: 'rgba(255,255,255,0.4)',
                border: '1px solid transparent',
                borderBottom: 'none',
              }}
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">FULL</span>
            </button>
          </div>

          {/* bin list */}
          <div
            className={`flex-1 min-h-0 sm:max-h-[360px] overflow-y-auto overflow-x-hidden p-2 scrollbar-hide ${bin === 'packs' ? 'grid grid-cols-3 sm:grid-cols-2 gap-2' : 'flex flex-col gap-1.5'}`}
            style={{ scrollbarWidth: 'none', background: '#0d0d10', borderTop: `1px solid ${bin === 'packs' ? '#8b5cf655' : '#fbbf2455'}` }}
          >
            {libLoading && (
              <div className="col-span-full text-center text-[10px] uppercase tracking-[0.2em] text-white/30 py-6">Loading…</div>
            )}
            {!libLoading && bin === 'packs' && packs.length === 0 && (
              <div className="col-span-full text-center text-[10px] uppercase tracking-[0.2em] text-white/30 py-6">No packs</div>
            )}
            {!libLoading && bin === 'tracks' && songs.length === 0 && (
              <div className="text-center text-[10px] uppercase tracking-[0.2em] text-white/30 py-6">No tracks</div>
            )}

            {bin === 'packs' && packs.map((p) => {
              const active = scenepack?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setScenepack(active ? null : p)}
                  className="relative aspect-[3/4] rounded-md overflow-hidden active:scale-[0.94] transition-transform"
                  style={{
                    border: active ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: active ? '0 0 0 2px rgba(139,92,246,0.3)' : 'none',
                  }}
                >
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black flex items-center justify-center">
                      <Film className="w-4 h-4 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-1 pt-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
                    <p className="text-[9px] font-bold text-white leading-tight line-clamp-2">{p.title}</p>
                  </div>
                  {active && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}

            {bin === 'tracks' && songs.map((s) => {
              const active = song?.id === s.id;
              const isPlaying = previewingId === s.id;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-2.5 p-1.5 rounded-md transition-colors"
                  style={{
                    border: active ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.08)',
                    background: active ? 'rgba(251,191,36,0.10)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  {/* cover (also click target for select) */}
                  <button
                    type="button"
                    onClick={() => setSong(active ? null : s)}
                    className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-gradient-to-br from-amber-900/40 to-black active:scale-95 transition-transform"
                  >
                    {(s as any).cover_url ? (
                      <img src={(s as any).cover_url} alt={s.song_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Music className="w-5 h-5 text-amber-400/60" /></div>
                    )}
                    {active && (
                      <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center">
                        <Check className="w-2 h-2 text-black" strokeWidth={4} />
                      </div>
                    )}
                  </button>

                  {/* meta */}
                  <button
                    type="button"
                    onClick={() => setSong(active ? null : s)}
                    className="flex-1 min-w-0 text-left active:opacity-80"
                  >
                    <p className="text-[11px] font-bold text-white truncate leading-tight">{s.song_name}</p>
                    <p className="text-[9px] text-white/50 truncate mt-0.5">{(s as any).artist_name || 'Unknown'}</p>
                  </button>

                  {/* preview button — large + isolated */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePreview(s); }}
                    aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    style={{
                      background: isPlaying ? '#fbbf24' : 'rgba(251,191,36,0.15)',
                      border: `1px solid ${isPlaying ? '#fbbf24' : 'rgba(251,191,36,0.5)'}`,
                      boxShadow: isPlaying ? '0 0 12px rgba(251,191,36,0.5)' : 'none',
                    }}
                  >
                    {isPlaying
                      ? <Pause className="w-4 h-4 fill-black text-black" />
                      : <Play className="w-4 h-4 fill-amber-400 text-amber-400 ml-0.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* ----- RIGHT: PROGRAM MONITOR ----- */}
        <div className="flex-1 min-w-0 p-2.5">
          {/* monitor header tabs */}
          <div className="flex items-center gap-1 mb-2">
            <span className="px-2 h-5 rounded-t-md text-[9px] font-extrabold uppercase tracking-wider flex items-center" style={{ ...teko, background: '#1a1a1d', color: tone, border: `1px solid ${tone}55`, borderBottom: 'none' }}>
              PROGRAM
            </span>
            <span className="ml-auto text-[9px] text-white/30 font-mono">9:16 · 1080×1920</span>
          </div>

          {/* The canvas / dropzone */}
          {!videoUrl && !uploading && (
            <button
              type="button"
              onClick={onPick}
              className="relative w-full aspect-[16/10] rounded-md overflow-hidden flex flex-col items-center justify-center group active:scale-[0.995] transition-transform"
              style={{
                background:
                  `radial-gradient(circle at 50% 35%, ${tone}26 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg,#050507,#0a0a0d)`,
                border: `1.5px dashed ${tone}66`,
                boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03), inset 0 0 80px ${tone}14`,
              }}
            >
              {/* Resolve-style grid */}
              <div
                className="absolute inset-0 opacity-[0.12] pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                  maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
                }}
              />
              {/* corner brackets */}
              {[
                'top-2 left-2 border-t-2 border-l-2',
                'top-2 right-2 border-t-2 border-r-2',
                'bottom-2 left-2 border-b-2 border-l-2',
                'bottom-2 right-2 border-b-2 border-r-2',
              ].map((c) => (
                <span key={c} className={`absolute w-4 h-4 ${c}`} style={{ borderColor: tone }} />
              ))}
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                style={{
                  background: `linear-gradient(180deg, ${tone}, ${tone}aa)`,
                  boxShadow: `0 6px 0 rgba(0,0,0,0.4), 0 14px 30px -6px ${tone}66, inset 0 1px 0 rgba(255,255,255,0.35)`,
                }}
              >
                <Upload className="w-6 h-6 text-black" strokeWidth={2.6} />
              </div>
              <p className="text-[20px] font-black uppercase text-white leading-none" style={teko}>IMPORT MEDIA</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/45 mt-1.5 font-mono">
                DRAG · OR · CLICK · MP4 / MOV · {MAX_EDIT_UPLOAD_LABEL}
              </p>
              {/* HUD readouts */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/40 flex items-center gap-2">
                <span style={{ color: tone }}>● LIVE</span>
                <span>00:00:00:00</span>
              </div>
            </button>
          )}

          {uploading && (
            <div
              className="relative w-full aspect-[16/10] rounded-md flex flex-col items-center justify-center"
              style={{
                background: 'linear-gradient(180deg,#050507,#0a0a0d)',
                border: `1.5px solid ${tone}66`,
              }}
            >
              <div className="text-[12px] uppercase tracking-[0.3em] font-extrabold mb-3" style={{ ...teko, color: tone }}>RENDERING IMPORT</div>
              <div className="text-[44px] font-black tabular-nums leading-none" style={{ ...teko, color: '#fff' }}>{uploadPct}<span style={{ color: tone }}>%</span></div>
              <div className="mt-4 w-2/3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full transition-all" style={{ width: `${uploadPct}%`, background: tone, boxShadow: `0 0 12px ${tone}` }} />
              </div>
            </div>
          )}

          {hasVid && (
            <div
              className="relative w-full rounded-md overflow-hidden bg-black"
              style={{ aspectRatio: '16/10', border: `1px solid ${tone}44` }}
            >
              <BunnyVideo src={videoUrl} className="w-full h-full object-contain" controls />
              {[
                'top-1.5 left-1.5 border-t border-l',
                'top-1.5 right-1.5 border-t border-r',
                'bottom-1.5 left-1.5 border-b border-l',
                'bottom-1.5 right-1.5 border-b border-r',
              ].map((c) => (
                <span key={c} className={`absolute w-3 h-3 pointer-events-none ${c}`} style={{ borderColor: tone }} />
              ))}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/70 flex items-center gap-2 pointer-events-none">
                <span style={{ color: tone }}>● LOADED</span>
                <span>SRC.MP4</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== METADATA PANEL ===== */}
      <div
        className="border-t px-3 py-2.5 grid grid-cols-2 gap-2"
        style={{ background: '#0d0d10', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <label className="block">
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/35 font-mono">TITLE</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 80))}
            placeholder="Untitled Sequence"
            className="mt-1 bg-black/60 border-white/10 h-9 rounded-md text-[12px] font-mono"
          />
        </label>
        <label className="block">
          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-white/35 font-mono">
            <LinkIcon className="w-3 h-3" />
            POSTED LINK
            <span className="ml-1 px-1 py-px rounded-sm text-[8px] tracking-[0.15em] font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.35)' }}>
              RECOMMENDED
            </span>
          </span>
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 300))}
            placeholder="tiktok.com / instagram.com / youtube.com …"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="mt-1 bg-black/60 border-white/10 h-9 rounded-md text-[12px] font-mono"
          />
          <span className="block mt-1 text-[9px] text-white/40 leading-snug">
            Drop the link if you posted this edit — drives more ratings & viewer traffic.
          </span>
        </label>
        {hasVid && (
          <button
            type="button"
            onClick={onReplace}
            className="col-span-2 text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white text-left font-mono"
          >
            ↻ replace source clip
          </button>
        )}
        {overtime && (
          <div className="col-span-2 flex items-center gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-[11px] font-mono">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Clock expired — ships flagged <b>OVERTIME</b>.</span>
          </div>
        )}
      </div>
    </div>
  );
}
