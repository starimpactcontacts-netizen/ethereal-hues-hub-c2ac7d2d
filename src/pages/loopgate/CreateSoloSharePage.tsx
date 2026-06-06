import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Music, Film, Link as LinkIcon, Clock, Zap, AlertTriangle, SkipForward, Upload, Video } from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from '@icons-pack/react-simple-icons';
import { useAuth } from '@/hooks/useAuth';
import { createSoloShare } from '@/hooks/useSoloShares';
import { detectPlatform, getEmbedUrl } from '@/lib/videoEmbed';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import SoloLibraryPicker, { type LibrarySong, type LibraryScenepack } from '@/components/loopgate/SoloLibraryPicker';
import GateIcon from '@/components/loopgate/GateIcon';
import BunnyVideo from '@/components/loopgate/BunnyVideo';
import { uploadToBunny, MAX_EDIT_UPLOAD_BYTES, MAX_EDIT_UPLOAD_LABEL } from '@/lib/bunnyUpload';

const teko = { fontFamily: 'Teko, sans-serif' };

type Phase = 'timer' | 'song' | 'upload' | 'publishing';
type Timer = 30 | 60 | 180;

const TIMERS: { value: Timer; label: string; sub: string }[] = [
  { value: 30, label: '30M', sub: 'sprint' },
  { value: 60, label: '1H', sub: 'standard' },
  { value: 180, label: '3H', sub: 'cinematic' },
];

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

  const [phase, setPhase] = useState<Phase>('timer');
  const [timer, setTimer] = useState<Timer | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());

  const [song, setSong] = useState<LibrarySong | null>(null);
  const [scenepack, setScenepack] = useState<LibraryScenepack | null>(null);

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
    setPhase('song');
  };

  const handleSkipLibrary = () => {
    setSong(null);
    setScenepack(null);
    setPhase('upload');
  };

  const handleContinueLibrary = () => setPhase('upload');

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

    setPhase('publishing');
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
    if (!share) { toast.error('Could not publish. Try again.'); setPhase('upload'); return; }
    toast.success(overtime ? 'Published — flagged OVERTIME.' : 'Solo page live.');
    navigate(`/s/${share.slug}`);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <SEO title="Create Solo Page" noindex />

      {/* Amber atmospheric glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/[0.08] blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <GateIcon size={18} className="text-amber-400" />
            <span className="text-[16px] font-extrabold uppercase tracking-[0.2em]" style={teko}>SOLO</span>
          </div>
          <div className="flex-1" />
          {startedAt && timer && (
            <TimerPill remainingMs={remaining} overtime={overtime} />
          )}
        </div>
      </div>

      <main className="relative max-w-xl mx-auto px-4 py-6 pb-32">
        <AnimatePresence mode="wait">
          {phase === 'timer' && (
            <motion.div
              key="timer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 pt-6"
            >
              <div className="text-center">
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-[0.3em]" style={teko}>Step 1</p>
                <h1 className="text-5xl font-black mt-2 leading-none" style={teko}>SET THE CLOCK.</h1>
                <p className="text-sm text-white/50 mt-3 max-w-xs mx-auto">
                  Pick how long you have to ship this edit. Late drops still publish — flagged <span className="text-amber-400 font-bold">OVERTIME</span>.
                </p>
              </div>

              <TimerRing pct={0} label="--:--" sub="awaiting start" />

              <div className="grid grid-cols-3 gap-3">
                {TIMERS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => startTimer(t.value)}
                    className="group relative aspect-square rounded-2xl border border-white/10 bg-white/[0.02] hover:border-amber-400/60 hover:bg-amber-400/[0.06] transition-all active:scale-[0.97] overflow-hidden"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <Clock className="w-4 h-4 text-amber-400/80 mb-1" />
                      <span className="text-3xl font-black text-white" style={teko}>{t.label}</span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">{t.sub}</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'song' && (
            <motion.div
              key="song"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div>
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-[0.3em]" style={teko}>Step 2</p>
                <h2 className="text-4xl font-black mt-1 leading-none" style={teko}>LIBRARY.</h2>
                <p className="text-sm text-white/50 mt-2">Lock a scenepack and a track — or skip and bring your own.</p>
              </div>

              <button
                onClick={handleSkipLibrary}
                className="w-full py-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <SkipForward className="w-4 h-4 text-white/40" />
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Skip — bring my own</span>
              </button>

              <SoloLibraryPicker
                selectedSongId={song?.id || null}
                selectedPackId={scenepack?.id || null}
                onPickSong={setSong}
                onPickPack={setScenepack}
              />

              <button
                onClick={handleContinueLibrary}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#000',
                  boxShadow: '0 4px 30px rgba(245,158,11,0.35)',
                  ...teko,
                }}
              >
                <Zap className="w-5 h-5" />
                <span className="text-[18px] font-extrabold uppercase tracking-[0.18em]">CONTINUE</span>
              </button>
            </motion.div>
          )}

          {phase === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div>
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-[0.3em]" style={teko}>Step 3</p>
                <h2 className="text-4xl font-black mt-1 leading-none" style={teko}>DROP THE EDIT.</h2>
                <p className="text-sm text-white/50 mt-2">Paste your video link. Tune where it starts.</p>
              </div>

              {/* Session recap */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                  <Music className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">Track</p>
                  <p className="text-sm font-bold truncate">{song?.song_name || 'Your choice'}</p>
                </div>
                <button onClick={() => setPhase('song')} className="text-[10px] uppercase tracking-wider text-white/40 hover:text-amber-400">change</button>
              </div>

              {/* Scenepack recap */}
              {scenepack && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-9 h-12 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                    {scenepack.thumbnail_url
                      ? <img src={scenepack.thumbnail_url} alt={scenepack.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Film className="w-4 h-4 text-white/30" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">Scenepack</p>
                    <p className="text-sm font-bold truncate">{scenepack.title}</p>
                  </div>
                  <button onClick={() => setPhase('song')} className="text-[10px] uppercase tracking-wider text-white/40 hover:text-amber-400">change</button>
                </div>
              )}

              {/* Edit URL */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3" /> Your edit URL
                </label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://tiktok.com/@you/video/..."
                  className="bg-white/5 border-white/10"
                />
                <div className="flex gap-2 mt-2">
                  {([
                    { id: 'tiktok', label: 'TikTok', icon: <SiTiktok size={12} /> },
                    { id: 'instagram', label: 'Instagram', icon: <SiInstagram size={12} /> },
                    { id: 'youtube', label: 'YouTube', icon: <SiYoutube size={12} /> },
                  ] as const).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        platform === p.id ? 'bg-amber-400 text-black border-amber-400' : 'bg-white/[0.03] border-white/10 text-white/60'
                      }`}
                    >
                      {p.icon}{p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview + start offset (YouTube only honors it in embed) */}
              {previewUrl && (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Preview</div>
                  <div
                    className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/5"
                    style={{ aspectRatio: platform === 'youtube' && !videoUrl.includes('/shorts/') ? '16/9' : '9/16', maxHeight: 360 }}
                  >
                    <iframe
                      src={previewUrl}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  {platform === 'youtube' && (
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 block">
                        Start at <span className="text-amber-400 font-bold">{startOffset}s</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={120}
                        step={1}
                        value={startOffset}
                        onChange={(e) => setStartOffset(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-400"
                      />
                      <p className="text-[10px] text-white/30 mt-1">Sets where raters start watching.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  placeholder="Title (optional)"
                  className="bg-white/5 border-white/10"
                />
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 200))}
                  placeholder="What to watch for…"
                  className="bg-white/5 border-white/10"
                />
              </div>

              {overtime && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Timer expired. Page will be flagged <b>OVERTIME</b>.</span>
                </div>
              )}

              <button
                onClick={handlePublish}
                disabled={!videoUrl.trim()}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
                style={{
                  background: overtime
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#000',
                  boxShadow: '0 4px 30px rgba(245,158,11,0.35)',
                  ...teko,
                }}
              >
                <Zap className="w-5 h-5" />
                <span className="text-[18px] font-extrabold uppercase tracking-[0.18em]">PUBLISH</span>
              </button>
            </motion.div>
          )}

          {phase === 'publishing' && (
            <motion.div
              key="pub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 gap-3"
            >
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Going live…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* -------- Visual bits -------- */

function TimerPill({ remainingMs, overtime }: { remainingMs: number; overtime: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
        overtime
          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
          : 'bg-white/[0.04] border-white/10 text-white'
      }`}
    >
      <Clock className={`w-3 h-3 ${overtime ? 'text-amber-300' : 'text-amber-400'}`} />
      <span className="text-[12px] font-mono font-bold tracking-wider">
        {overtime ? `+${fmtRemaining(-remainingMs)}` : fmtRemaining(remainingMs)}
      </span>
      {overtime && <span className="text-[8px] font-bold uppercase tracking-wider">OT</span>}
    </div>
  );
}

function TimerRing({ pct, label, sub }: { pct: number; label: string; sub: string }) {
  const size = 200;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#fbbf24"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black tracking-tight text-white" style={teko}>{label}</span>
        <span className="text-[10px] uppercase tracking-[0.25em] text-white/40 mt-1">{sub}</span>
      </div>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: '0 0 80px rgba(251,191,36,0.15) inset' }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </div>
  );
}