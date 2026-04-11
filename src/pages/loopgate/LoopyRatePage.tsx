import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Heart, Lightbulb, Music, Fingerprint, Zap,
  Trophy, TrendingUp, Star, Clock, ChevronRight,
  RotateCcw, Brain, Shield, Target, Activity,
  Award, BarChart3, Eye, Swords, DollarSign, ArrowRight, Sparkles, Users,
  Share2, Upload, Film, Play, X
} from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import loopyAvatar from '@/assets/loopy-avatar.png';
import { extractVideoFrames, getVideoPreviewFrame } from '@/lib/extractVideoFrames';

type Platform = 'tiktok' | 'instagram' | 'youtube' | 'unknown';

interface RatingMeta {
  hadFrames?: boolean;
  frameCount?: number;
  hadThumbnail?: boolean;
  analysisMode?: string;
}

interface LoopyRating {
  emotion: number;
  creativity: number;
  sync: number;
  identity: number;
  execution: number;
  total: number;
  grade: string;
  strengths: string[];
  improvements: string[];
  vibe_check: string;
  detailed_feedback: string;
  _meta?: RatingMeta;
}

interface SavedRating {
  id: string;
  submission_url: string;
  platform: string;
  total_score: number;
  grade: string;
  vibe_check: string;
  created_at: string;
  emotion_score: number;
  creativity_score: number;
  sync_score: number;
  identity_score: number;
  execution_score: number;
}

const TEKO = { fontFamily: 'Teko, sans-serif' };

const PILLARS = [
  { key: 'emotion', label: 'EMOTION', max: 15, icon: Heart, accent: 'text-pink-400', bar: 'bg-pink-500/150', ring: '#ec4899' },
  { key: 'creativity', label: 'CREATIVITY', max: 25, icon: Lightbulb, accent: 'text-amber-400', bar: 'bg-amber-500/150', ring: '#f59e0b' },
  { key: 'sync', label: 'SYNC', max: 25, icon: Music, accent: 'text-purple-400', bar: 'bg-purple-500/150', ring: '#a855f7' },
  { key: 'identity', label: 'IDENTITY', max: 10, icon: Fingerprint, accent: 'text-cyan-400', bar: 'bg-cyan-500', ring: '#06b6d4' },
  { key: 'execution', label: 'EXECUTION', max: 25, icon: Zap, accent: 'text-green-400', bar: 'bg-green-500', ring: '#22c55e' },
];

const GRADE_COLORS: Record<string, string> = {
  'S++': 'from-amber-400 to-yellow-300 text-black',
  'S+': 'from-amber-500 to-orange-400 text-black',
  'S': 'from-orange-500 to-red-400 text-white',
  'A': 'from-emerald-500 to-green-400 text-white',
  'B': 'from-blue-500 to-cyan-400 text-white',
  'C': 'from-slate-500 to-gray-400 text-white',
  'D': 'from-red-600 to-rose-500 text-white',
  'F': 'from-red-800 to-red-600 text-white',
};

const GRADE_GLOW: Record<string, string> = {
  'S++': 'shadow-[0_0_60px_rgba(251,191,36,0.5)]',
  'S+': 'shadow-[0_0_60px_rgba(245,158,11,0.4)]',
  'S': 'shadow-[0_0_50px_rgba(249,115,22,0.35)]',
  'A': 'shadow-[0_0_40px_rgba(34,197,94,0.3)]',
  'B': 'shadow-[0_0_30px_rgba(59,130,246,0.25)]',
  'C': 'shadow-[0_0_20px_rgba(148,163,184,0.15)]',
  'D': 'shadow-[0_0_30px_rgba(220,38,38,0.25)]',
  'F': 'shadow-[0_0_40px_rgba(220,38,38,0.35)]',
};

const GRADE_REACTIONS: Record<string, { emoji: string; headline: string; sub: string }> = {
  'S++': { emoji: '👑', headline: 'GENERATIONAL TALENT', sub: 'You didn\'t just pass the test. You ARE the test.' },
  'S+': { emoji: '🔥', headline: 'BUILT DIFFERENT', sub: 'The editors below you are looking up right now.' },
  'S': { emoji: '⚡', headline: 'THAT\'S ELITE', sub: 'Most editors dream about this score. You just got it.' },
  'A': { emoji: '💪', headline: 'ABOVE THE PACK', sub: 'Solid work. Not untouchable yet, but you\'re getting there.' },
  'B': { emoji: '📈', headline: 'MID BUT PROMISING', sub: 'You have ingredients. The recipe needs work.' },
  'C': { emoji: '😬', headline: 'THAT\'S... OKAY', sub: 'Your edit exists. That\'s the nicest thing Loopy can say.' },
  'D': { emoji: '💀', headline: 'PACK IT UP', sub: 'This edit needs CPR. Actually, it might be too late.' },
  'F': { emoji: '☠️', headline: 'CERTIFIED NIGHTMARE', sub: 'Loopy had to look away. Twice. Then three more times.' },
};

const GRADE_PERCENTILE: Record<string, string> = {
  'S++': 'Top 1%', 'S+': 'Top 5%', 'S': 'Top 10%', 'A': 'Top 25%',
  'B': 'Top 50%', 'C': 'Bottom 40%', 'D': 'Bottom 20%', 'F': 'Bottom 5%',
};

const VERDICT = (score: number, max: number) => {
  const pct = (score / max) * 100;
  if (pct >= 90) return { label: 'ELITE', cls: 'text-amber-400 bg-amber-500/150/15' };
  if (pct >= 70) return { label: 'STRONG', cls: 'text-emerald-400 bg-emerald-500/150/15' };
  if (pct >= 50) return { label: 'AVERAGE', cls: 'text-blue-400 bg-blue-500/150/15' };
  if (pct >= 30) return { label: 'WEAK', cls: 'text-orange-400 bg-orange-500/15' };
  return { label: 'CRITICAL', cls: 'text-red-400 bg-red-500/150/15' };
};

function ScoreRing({ score, max, color, size = 44 }: { score: number; max: number; color: string; size?: number }) {
  const pct = (score / max) * 100;
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={3} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

const MAX_VIDEO_SIZE_MB = 50;
const ACCEPTED_VIDEO = 'video/mp4,video/webm,video/quicktime,video/x-msvideo';

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Loopy Rating — Video Edit Analyzer",
  "alternateName": "Rate My Edit",
  "url": "https://loopgate.io/loopy",
  "description": "Upload your video edit and get instant AI-powered scores across 5 diagnostic pillars. Free, brutal, and accurate.",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "creator": { "@type": "Organization", "name": "Loopgate", "url": "https://loopgate.io" },
  "featureList": ["Direct video upload analysis", "Frame-by-frame AI evaluation", "5-pillar QOI scoring", "Viral-worthy feedback", "Screenshot-ready results"],
};

export default function LoopyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [scanPhase, setScanPhase] = useState(0);

  // Result state
  const [rating, setRating] = useState<LoopyRating | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [animateScores, setAnimateScores] = useState(false);
  const [revealPhase, setRevealPhase] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  // History
  const [history, setHistory] = useState<SavedRating[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) { setLoadingHistory(false); return; }
    const { data } = await supabase
      .from('loopy_ratings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setHistory(data as unknown as SavedRating[]);
    setLoadingHistory(false);
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    if (!loading) { setScanPhase(0); return; }
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % 5; setScanPhase(i); }, 2800);
    return () => clearInterval(interval);
  }, [loading]);

  const scanMessages = [
    'Extracting frames...',
    'Analyzing visuals...',
    'Evaluating transitions...',
    'Computing scores...',
    'Generating verdict...'
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`Video must be under ${MAX_VIDEO_SIZE_MB}MB`);
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }

    setVideoFile(file);
    // Get preview frame
    try {
      setExtracting(true);
      const preview = await getVideoPreviewFrame(file);
      setVideoPreview(preview);
    } catch (e) {
      console.warn('Preview extraction failed:', e);
    } finally {
      setExtracting(false);
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!videoFile || loading) return;

    setLoading(true);
    setRating(null);
    setShowResult(false);
    setAnimateScores(false);

    try {
      // Extract frames from video
      const frames = await extractVideoFrames(videoFile, 12);
      console.log(`Extracted ${frames.length} frames`);

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loopy-rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          frames,
          videoTitle: title.trim() || videoFile.name.replace(/\.[^.]+$/, ''),
          userContext: notes.trim() || undefined,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'something broke' }));
        toast.error(err.error || 'Failed to rate');
        setLoading(false);
        return;
      }

      const data: LoopyRating = await resp.json();
      setRating(data);
      setShowResult(true);
      setRevealPhase(0);
      setDisplayScore(0);

      // Dramatic reveal sequence
      setTimeout(() => setRevealPhase(1), 100);
      setTimeout(() => setRevealPhase(2), 600);
      setTimeout(() => setRevealPhase(3), 1200);
      setTimeout(() => { setRevealPhase(4); setAnimateScores(true); }, 2400);

      // Animated counter
      const target = data.total;
      const startTime = Date.now() + 1200;
      const countDuration = 1000;
      const tick = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 0) { requestAnimationFrame(tick); return; }
        const progress = Math.min(elapsed / countDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      // Save to history
      if (user) {
        await supabase.from('loopy_ratings').insert({
          user_id: user.id,
          submission_url: `uploaded:${videoFile.name}`,
          platform: 'upload',
          emotion_score: data.emotion,
          creativity_score: data.creativity,
          sync_score: data.sync,
          identity_score: data.identity,
          execution_score: data.execution,
          total_score: data.total,
          grade: data.grade,
          strengths: data.strengths,
          improvements: data.improvements,
          vibe_check: data.vibe_check,
          detailed_feedback: data.detailed_feedback,
        } as any);
        fetchHistory();
      }
    } catch (e) {
      console.error('Rating error:', e);
      toast.error('Failed to analyze — try a shorter video or different format');
    }
    setLoading(false);
  };

  const handleReset = () => {
    clearVideo();
    setTitle(''); setNotes('');
    setRating(null); setShowResult(false); setAnimateScores(false);
    setRevealPhase(0); setDisplayScore(0);
  };

  const handleShare = async () => {
    const reaction = GRADE_REACTIONS[rating?.grade || 'C'];
    const text = `${reaction?.emoji} I got a ${rating?.grade} (${rating?.total}/100) on Loopy Rating\n\n"${rating?.vibe_check}"\n\n${reaction?.headline}\n\nRate your edit free → loopgate.io/loopy`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `My Loopy Rating: ${rating?.grade}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
      }
    } catch {}
  };

  const gradeScore = rating?.total ?? 0;
  const isHighScore = gradeScore >= 50;

  return (
    <>
      <Helmet>
        <title>Rate My Edit — Free AI Video Analysis | Loopy by Loopgate</title>
        <meta name="description" content="Upload your video edit and get instant AI-powered diagnostic scores. Brutally honest, hilariously accurate. 5 pillars, 100 points, zero filter. Free." />
        <meta name="keywords" content="rate my edit, video edit rating, AMV rating, edit analyzer, free edit feedback, loopy rating, video editing score, edit quality" />
        <link rel="canonical" href="https://loopgate.io/loopy" />
        <meta property="og:title" content="Rate My Edit — Drop Your Video, Get Roasted (or Hyped)" />
        <meta property="og:description" content="Upload your edit. Loopy will analyze every frame and tell you exactly how good (or bad) it is. No cap." />
        <meta property="og:url" content="https://loopgate.io/loopy" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Loopy Rating — The Edit Judge That Doesn't Hold Back" />
        <meta name="twitter:description" content="Upload. Get scored. Get roasted. Share the results. Free." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-[#222222] pb-32 relative">
        {/* ═══ HERO ═══ */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#1a1a2e] via-[#16162a] to-[#0f0f1a]">
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          {/* Purple glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15)_0%,transparent_60%)]" />

          <div className="relative max-w-2xl mx-auto px-5 pt-10 pb-8 text-center">
            {/* Loopy avatar */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="relative w-20 h-20 mx-auto mb-5"
            >
              <div className="absolute inset-[-6px] bg-gradient-to-br from-purple-500/30 to-fuchsia-500/20 rounded-2xl blur-xl" />
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#222222]/10 shadow-xl">
                <img src={loopyAvatar} alt="Loopy" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-violet-500/150 rounded-full flex items-center justify-center border-2 border-[#1a1a2e] shadow-lg">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.06] backdrop-blur-sm rounded-full border border-white/[0.08] mb-3">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Frame-by-Frame Analysis</span>
              </div>
            </motion.div>

            <h1 className="text-[44px] sm:text-[56px] font-black text-white leading-[0.9] tracking-wide mb-3" style={TEKO}>
              RATE MY EDIT
            </h1>

            <p className="text-[14px] text-white/40 max-w-sm mx-auto leading-relaxed">
              Upload your edit. Get <span className="text-white/80 font-semibold">brutally honest</span> scores across 5 pillars.
              <br/>No filter. No mercy. Just facts.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mt-5 mb-2">
              {[
                { label: '12 FRAMES', sub: 'ANALYZED' },
                { label: 'PRO AI', sub: 'MODEL' },
                { label: '100%', sub: 'FREE' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <span className="text-[14px] font-bold text-white/70 tracking-wider" style={TEKO}>{s.label}</span>
                  <span className="text-[9px] text-white/25 uppercase tracking-widest block" style={TEKO}>{s.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rounded bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#222222] rounded-t-3xl" />
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="max-w-lg mx-auto px-4 space-y-4 relative z-10 -mt-1">
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                {/* ═══ UPLOAD CARD ═══ */}
                <div className="bg-[#2a2a2e] rounded-2xl shadow-lg shadow-black/20 border border-white/[0.06] overflow-hidden">
                  {/* Top accent */}
                  <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

                  <div className="p-5 space-y-5">
                    {/* Upload area */}
                    <div>
                      <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 mb-2.5" style={TEKO}>
                        <Film className="w-3.5 h-3.5 text-violet-500" /> YOUR EDIT
                      </label>

                      {!videoFile ? (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-white/[0.1] hover:border-violet-400/40 rounded-2xl p-8 flex flex-col items-center gap-3 transition-all group hover:bg-violet-500/150/10"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                            <Upload className="w-6 h-6 text-violet-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-white/80">Upload your video</p>
                            <p className="text-xs text-white/40 mt-0.5">MP4, WebM, MOV — up to {MAX_VIDEO_SIZE_MB}MB</p>
                          </div>
                        </button>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden bg-white/[0.06] border border-white/[0.08]">
                          {videoPreview ? (
                            <img src={videoPreview} alt="Preview" className="w-full h-44 object-cover" />
                          ) : (
                            <div className="w-full h-44 flex items-center justify-center">
                              <Play className="w-10 h-10 text-white/25" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                            <p className="text-xs text-white/90 font-medium truncate">{videoFile.name}</p>
                            <p className="text-[10px] text-white/50">{(videoFile.size / (1024 * 1024)).toFixed(1)}MB</p>
                          </div>
                          <button
                            onClick={clearVideo}
                            className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80 hover:bg-black/70 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {extracting && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_VIDEO}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 mb-2" style={TEKO}>
                        <Award className="w-3.5 h-3.5 text-violet-500" /> TITLE
                        <span className="text-white/25 text-[9px] normal-case tracking-normal font-normal">optional</span>
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Demon Slayer AMV — Akeboshi"
                        className="bg-[#333338] border-white/[0.08] text-white/80 placeholder:text-white/25 h-11 text-sm rounded-xl focus:border-violet-400 focus:ring-1 focus:ring-violet-200 placeholder:text-white/25"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 mb-2" style={TEKO}>
                        <Brain className="w-3.5 h-3.5 text-violet-500" /> NOTES FOR LOOPY
                        <span className="text-white/25 text-[9px] normal-case tracking-normal font-normal">optional</span>
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="anything u want loopy to know — editing software, how long it took, what u tried new..."
                        className="bg-[#333338] border-white/[0.08] text-white/80 placeholder:text-white/25 resize-none h-20 text-sm rounded-xl focus:border-violet-400 focus:ring-1 focus:ring-violet-200 placeholder:text-white/25"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={!videoFile || loading}
                      className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25 active:scale-[0.98]"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-[14px] tracking-wider" style={TEKO}>{scanMessages[scanPhase]}</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <GateIcon className="w-4 h-4" />
                          <span className="text-[16px] uppercase tracking-[0.2em]" style={TEKO}>Analyze My Edit</span>
                        </span>
                      )}
                    </button>

                    {loading && (
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: '95%' }}
                          transition={{ duration: 20, ease: 'linear' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pillar chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
                  {PILLARS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <div key={p.key} className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-full border border-white/[0.06] shadow-sm">
                        <Icon className={`w-3 h-3 ${p.accent}`} />
                        <span className="text-[10px] text-white/50 font-bold tracking-wider" style={TEKO}>{p.label}</span>
                        <span className="text-[9px] text-white/25" style={TEKO}>/{p.max}</span>
                      </div>
                    );
                  })}
                </div>

                {/* How it works */}
                <div className="mt-6 bg-[#2a2a2e] rounded-2xl shadow-sm border border-white/[0.06] p-5">
                  <h3 className="text-[13px] font-bold text-white/40 uppercase tracking-widest mb-4 text-center" style={TEKO}>
                    <GateIcon className="w-3 h-3 inline mr-1.5 text-violet-400" /> How It Works
                  </h3>
                  <div className="space-y-3.5">
                    {[
                      { icon: Upload, title: 'Upload your edit', desc: 'Any video file — MP4, WebM, MOV. Direct from your camera roll.', color: 'bg-violet-500/15 text-violet-500' },
                      { icon: Film, title: 'Loopy extracts 12 key frames', desc: 'Spread across your entire edit for comprehensive analysis.', color: 'bg-purple-500/15 text-purple-500' },
                      { icon: Brain, title: 'Pro AI analyzes every frame', desc: 'Color grading, transitions, effects, composition — nothing escapes Loopy.', color: 'bg-fuchsia-500/15 text-fuchsia-500' },
                      { icon: BarChart3, title: 'Get your scores + roast', desc: 'Pillar breakdown, grade, and a brutally honest verdict.', color: 'bg-pink-500/15 text-pink-500' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl ${step.color} flex items-center justify-center shrink-0`}>
                          <step.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-white/80">{step.title}</p>
                          <p className="text-[11px] text-white/40 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Viral social proof */}
                <div className="mt-4 bg-[#2a2a2e] rounded-2xl border border-violet-500/20 p-4 text-center">
                  <p className="text-[11px] text-violet-400 font-semibold">
                    💀 People share Loopy's roasts on TikTok. Will yours be screenshot-worthy?
                  </p>
                </div>
              </motion.div>
            ) : rating && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">

                {/* Flash overlay */}
                <AnimatePresence>
                  {revealPhase === 1 && (
                    <motion.div
                      key="flash"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.5 }}
                      className="fixed inset-0 z-[200] pointer-events-none"
                      style={{ background: rating.total >= 50 ? 'rgba(139,92,246,0.3)' : 'rgba(220,38,38,0.25)' }}
                    />
                  )}
                </AnimatePresence>

                {/* ═══ GRADE HERO ═══ */}
                <div className="bg-gradient-to-b from-[#1a1a2e] to-[#111128] rounded-2xl overflow-hidden shadow-xl">
                  <motion.div
                    className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: revealPhase >= 2 ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ transformOrigin: 'left' }}
                  />

                  <div className="relative p-6 pb-5">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest" style={TEKO}>QOI Result</span>
                      <span className="text-[9px] text-white/15 uppercase tracking-wider" style={TEKO}>LOOPY v2.0</span>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <AnimatePresence>
                        {revealPhase >= 2 && (
                          <motion.div
                            initial={{ scale: 3, opacity: 0, rotate: -20 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="relative mb-4"
                          >
                            <div className={`absolute inset-[-20px] blur-3xl opacity-60 bg-gradient-to-br ${GRADE_COLORS[rating.grade] || 'from-gray-500 to-gray-400'}`} />
                            <motion.div
                              animate={{ scale: [1, 1.03, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              className={`relative w-28 h-28 bg-gradient-to-br ${GRADE_COLORS[rating.grade] || 'from-gray-500 to-gray-400 text-white'} flex items-center justify-center rounded-3xl border-2 border-[#222222]/20 ${GRADE_GLOW[rating.grade] || ''}`}
                            >
                              <span className="text-[64px] font-black leading-none" style={TEKO}>{rating.grade}</span>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {revealPhase >= 3 && (
                          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-[48px] font-black text-white tabular-nums" style={TEKO}>{displayScore}</span>
                              <span className="text-[20px] text-white/25 font-bold" style={TEKO}>/100</span>
                            </div>
                            {GRADE_PERCENTILE[rating.grade] && (
                              <span className="text-[10px] px-2.5 py-0.5 bg-white/[0.06] rounded-full text-white/40 font-semibold tracking-wider">{GRADE_PERCENTILE[rating.grade]}</span>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {revealPhase >= 4 && (
                          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-4 space-y-2">
                            {GRADE_REACTIONS[rating.grade] && (
                              <>
                                <p className="text-[22px] font-black text-white tracking-wider" style={TEKO}>
                                  {GRADE_REACTIONS[rating.grade].emoji} {GRADE_REACTIONS[rating.grade].headline}
                                </p>
                                <p className="text-[12px] text-white/30 max-w-xs mx-auto">{GRADE_REACTIONS[rating.grade].sub}</p>
                              </>
                            )}
                            <p className="text-[14px] text-white/60 italic leading-relaxed max-w-sm mx-auto mt-3">
                              "{rating.vibe_check}"
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-3">
                              <button
                                onClick={handleShare}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] rounded-full text-white/70 text-xs font-semibold transition-colors"
                              >
                                <Share2 className="w-3.5 h-3.5" /> Share Result
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* ═══ PILLAR BREAKDOWN ═══ */}
                <div className="bg-[#2a2a2e] rounded-2xl shadow-sm border border-white/[0.06] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2" style={TEKO}>
                      <Trophy className="w-3.5 h-3.5 text-amber-400" /> PILLAR BREAKDOWN
                    </span>
                    <span className="text-[9px] text-white/25 uppercase tracking-wider" style={TEKO}>scored by loopy</span>
                  </div>

                  {PILLARS.map((pillar, i) => {
                    const Icon = pillar.icon;
                    const score = rating[pillar.key as keyof LoopyRating] as number;
                    const pct = (score / pillar.max) * 100;
                    const verdict = VERDICT(score, pillar.max);

                    return (
                      <motion.div key={pillar.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <ScoreRing score={score} max={pillar.max} color={pillar.ring} size={34} />
                              <Icon size={12} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${pillar.accent}`} />
                            </div>
                            <span className="text-[13px] font-bold text-white/70 tracking-wider" style={TEKO}>{pillar.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded ${verdict.cls}`} style={TEKO}>{verdict.label}</span>
                            <span className="text-[14px] font-black text-white/80 tabular-nums" style={TEKO}>
                              {score}<span className="text-white/25 text-[11px]">/{pillar.max}</span>
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: animateScores ? `${pct}%` : 0 }}
                            transition={{ duration: 1, delay: 0.1 * i, ease: 'easeOut' }}
                            className={`h-full rounded-full ${pillar.bar}`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ═══ STRENGTHS & IMPROVEMENTS ═══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#2a2a2e] rounded-2xl shadow-sm border border-white/[0.06] p-4 space-y-2.5">
                    <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full -mx-4 -mt-4 mx-0 mt-0 mb-2 rounded-t-2xl rounded-b-none" style={{ margin: '-1rem -1rem 0.5rem -1rem', borderRadius: '1rem 1rem 0 0' }} />
                    <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5" style={TEKO}>
                      <Star className="w-3 h-3" /> STRENGTHS
                    </span>
                    {rating.strengths.map((s, i) => (
                      <p key={i} className="flex items-start gap-2 text-[11px] text-white/50 leading-relaxed">
                        <span className="text-emerald-400 mt-0.5 shrink-0">✦</span>{s}
                      </p>
                    ))}
                  </div>
                  <div className="bg-[#2a2a2e] rounded-2xl shadow-sm border border-white/[0.06] p-4 space-y-2.5">
                    <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-300 rounded-full" style={{ margin: '-1rem -1rem 0.5rem -1rem', borderRadius: '1rem 1rem 0 0' }} />
                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5" style={TEKO}>
                      <TrendingUp className="w-3 h-3" /> LEVEL UP
                    </span>
                    {rating.improvements.map((s, i) => (
                      <p key={i} className="flex items-start gap-2 text-[11px] text-white/50 leading-relaxed">
                        <span className="text-amber-400 mt-0.5 shrink-0">→</span>{s}
                      </p>
                    ))}
                  </div>
                </div>

                {/* ═══ LOOPY FEEDBACK ═══ */}
                <div className="bg-[#2a2a2e] rounded-2xl shadow-sm border border-white/[0.06] p-4">
                  <div className="h-1 bg-gradient-to-r from-violet-400 to-purple-400" style={{ margin: '-1rem -1rem 0.75rem -1rem', borderRadius: '1rem 1rem 0 0' }} />
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img src={loopyAvatar} alt="Loopy" className="w-10 h-10 rounded-xl border border-white/[0.06]" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-violet-500/150 rounded-full border-2 border-[#222222] flex items-center justify-center">
                        <GateIcon className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[13px] font-bold text-white/80" style={TEKO}>LOOPY</span>
                        <span className="text-[8px] px-1.5 py-0.5 bg-violet-500/20 text-violet-400 font-bold uppercase tracking-wider rounded-full" style={TEKO}>AI JUDGE</span>
                      </div>
                      <p className="text-[12px] text-white/50 leading-relaxed">{rating.detailed_feedback}</p>
                    </div>
                  </div>
                </div>

                {/* ═══ CONVERSION FUNNEL ═══ */}
                {!user ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="bg-gradient-to-b from-[#1a1a2e] to-[#111128] rounded-2xl overflow-hidden shadow-xl"
                  >
                    <div className="h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
                    <div className="p-5 text-center space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.06] rounded-full border border-white/[0.08]">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400" style={TEKO}>
                          {isHighScore ? "You're Competition Ready" : "Turn This Around"}
                        </span>
                      </div>

                      <h3 className="text-[28px] font-black text-white leading-none tracking-wide" style={TEKO}>
                        {isHighScore
                          ? <>YOUR EDIT IS <span className="text-amber-400">FIRE</span><br/>NOW GET PAID</>
                          : <>COMPETE. IMPROVE.<br/><span className="text-red-400">GET REAL RATINGS</span></>
                        }
                      </h3>

                      <p className="text-[12px] text-white/40 leading-relaxed max-w-xs mx-auto">
                        {isHighScore
                          ? <>With a <span className="text-white/70 font-semibold">{rating.grade} grade</span>, you'd crush 1v1 battles and earn cash from missions.</>
                          : <>Get rated by <span className="text-white/70 font-semibold">certified human judges</span>, compete in edit battles, and level up for real.</>
                        }
                      </p>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { icon: Swords, label: '1v1 BATTLES', sub: 'Cash Prizes', color: 'text-red-400' },
                          { icon: DollarSign, label: 'MISSIONS', sub: 'Get Paid', color: 'text-emerald-400' },
                          { icon: Shield, label: 'REAL JUDGES', sub: 'QOI Scores', color: 'text-amber-400' },
                        ].map((path, i) => (
                          <div key={i} className="py-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                            <path.icon className={`w-4 h-4 mx-auto mb-1 ${path.color}`} />
                            <span className="text-[10px] font-bold text-white/60 tracking-wider block" style={TEKO}>{path.label}</span>
                            <span className="text-[8px] text-white/20 uppercase tracking-widest" style={TEKO}>{path.sub}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => navigate('/start')}
                        className="w-full h-13 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] py-3.5"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <GateIcon className="w-4 h-4" />
                          <span className="text-[15px] uppercase tracking-[0.2em]" style={TEKO}>Sign Up — Start Competing</span>
                          <ArrowRight className="w-4 h-4 opacity-70" />
                        </span>
                      </button>

                      <p className="text-[9px] text-white/15">Free account • 30 seconds • Compete. Create. Get paid.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="space-y-2.5"
                  >
                    <div className="bg-[#2a2a2e] rounded-2xl shadow-sm border border-white/[0.06] p-4 text-center">
                      <p className="text-[12px] text-white/50">
                        {isHighScore
                          ? <>Your <span className="text-amber-500 font-bold">{rating.grade}</span> grade is competition-ready. Take it to the arena.</>
                          : <>Now you know where you stand. Time to sharpen up and compete.</>
                        }
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { icon: Swords, title: '1v1 CASH BATTLE', desc: 'Put your skills on the line for real money', route: '/arena', color: 'bg-red-500/15 text-red-500 border-red-500/20', cta: 'Enter Arena' },
                        { icon: DollarSign, title: 'EARN FROM MISSIONS', desc: isHighScore ? `Your ${rating.grade} grade could earn S-tier payouts` : 'Complete editing missions for cash', route: '/hub', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20', cta: 'View Missions' },
                        { icon: Shield, title: 'GET RATED BY REAL JUDGES', desc: 'Official QOI score on your profile', route: '/arena', color: 'bg-amber-500/15 text-amber-500 border-amber-500/20', cta: 'Submit Edit' },
                        { icon: Users, title: 'JOIN A UNIT', desc: 'Find your crew and compete together', route: '/units', color: 'bg-blue-500/15 text-blue-500 border-blue-500/20', cta: 'Browse' },
                      ].map((action, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.2 + i * 0.1 }}
                          onClick={() => navigate(action.route)}
                          className={`w-full flex items-center gap-3 p-3.5 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all text-left group ${action.color}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
                            <action.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-white/80 tracking-wider" style={TEKO}>{action.title}</p>
                            <p className="text-[10px] text-white/40 truncate">{action.desc}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-bold tracking-wider" style={TEKO}>{action.cta}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Rate Another */}
                <button
                  onClick={handleReset}
                  className="w-full h-12 bg-white border border-violet-500/30 hover:border-violet-400/50 rounded-2xl text-violet-400 font-bold transition-all active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="text-[13px] uppercase tracking-[0.18em]" style={TEKO}>Analyze Another Edit</span>
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ HISTORY ═══ */}
          {history.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="text-[12px] font-bold text-white/25 uppercase tracking-widest text-center" style={TEKO}>
                <Clock className="w-3 h-3 inline mr-1" /> Rating History
              </h3>
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-white/[0.06] shadow-sm"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${GRADE_COLORS[r.grade] || 'from-gray-500 to-gray-400 text-white'} flex items-center justify-center rounded-xl shrink-0`}>
                    <span className="text-[16px] font-black" style={TEKO}>{r.grade}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/70 truncate">{r.vibe_check}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-white/40 font-bold" style={TEKO}>{r.total_score}/100</span>
                      <span className="text-[10px] text-white/25">•</span>
                      <span className="text-[10px] text-white/25">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
