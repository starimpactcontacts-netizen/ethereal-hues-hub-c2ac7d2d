import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Send, Loader2, Heart, Lightbulb, Music, Fingerprint, Zap,
  Trophy, TrendingUp, Star, Clock, ChevronRight, ExternalLink,
  MessageSquare, RotateCcw, Brain, Shield, Target, Activity,
  Award, BarChart3, Eye, Swords, DollarSign, ArrowRight, Sparkles, Users, AlertTriangle,
  Share2, Copy, Camera
} from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import GatePattern from '@/components/loopgate/GatePattern';
import { SiTiktok, SiInstagram, SiYoutube } from '@icons-pack/react-simple-icons';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import loopyAvatar from '@/assets/loopy-avatar.png';

type Platform = 'tiktok' | 'instagram' | 'youtube' | 'unknown';

interface RatingMeta {
  thumbnailUrl?: string;
  authorName?: string;
  videoTitle?: string;
  viewCount?: string;
  duration?: string;
  hadThumbnail?: boolean;
  tagCount?: number;
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
  { key: 'emotion', label: 'EMOTION', max: 15, icon: Heart, accent: 'text-pink-400', bar: 'bg-pink-500', ring: '#ec4899' },
  { key: 'creativity', label: 'CREATIVITY', max: 25, icon: Lightbulb, accent: 'text-amber-400', bar: 'bg-amber-500', ring: '#f59e0b' },
  { key: 'sync', label: 'SYNC', max: 25, icon: Music, accent: 'text-purple-400', bar: 'bg-purple-500', ring: '#a855f7' },
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
  'S++': 'shadow-[0_0_60px_rgba(251,191,36,0.5),0_0_120px_rgba(251,191,36,0.2)]',
  'S+': 'shadow-[0_0_60px_rgba(245,158,11,0.5),0_0_120px_rgba(245,158,11,0.2)]',
  'S': 'shadow-[0_0_60px_rgba(249,115,22,0.4),0_0_100px_rgba(249,115,22,0.15)]',
  'A': 'shadow-[0_0_50px_rgba(34,197,94,0.4),0_0_100px_rgba(34,197,94,0.15)]',
  'B': 'shadow-[0_0_40px_rgba(59,130,246,0.3),0_0_80px_rgba(59,130,246,0.1)]',
  'C': 'shadow-[0_0_30px_rgba(148,163,184,0.2)]',
  'D': 'shadow-[0_0_40px_rgba(220,38,38,0.3)]',
  'F': 'shadow-[0_0_50px_rgba(220,38,38,0.4)]',
};

// Grade-specific roasts/hypes that make people want to screenshot
const GRADE_REACTIONS: Record<string, { emoji: string; headline: string; sub: string }> = {
  'S++': { emoji: '👑', headline: 'GENERATIONAL TALENT', sub: 'You didn\'t just pass the test. You ARE the test.' },
  'S+': { emoji: '🔥', headline: 'BUILT DIFFERENT', sub: 'The editors below you are looking up right now.' },
  'S': { emoji: '⚡', headline: 'THAT\'S ELITE', sub: 'Most editors dream about this score. You just got it.' },
  'A': { emoji: '💪', headline: 'ABOVE THE PACK', sub: 'Solid work. You\'re better than most, but not untouchable yet.' },
  'B': { emoji: '📈', headline: 'MID BUT PROMISING', sub: 'You have the ingredients. The recipe needs work.' },
  'C': { emoji: '😬', headline: 'THAT\'S... OKAY', sub: 'Your edit exists. That\'s about the nicest thing Loopy can say.' },
  'D': { emoji: '💀', headline: 'PACK IT UP', sub: 'This edit needs CPR. Actually, it might be too late for that.' },
  'F': { emoji: '☠️', headline: 'CERTIFIED NIGHTMARE', sub: 'Loopy had to look away. Twice. Then three more times.' },
};

const GRADE_PERCENTILE: Record<string, string> = {
  'S++': 'Top 1%', 'S+': 'Top 5%', 'S': 'Top 10%', 'A': 'Top 25%',
  'B': 'Top 50%', 'C': 'Bottom 40%', 'D': 'Bottom 20%', 'F': 'Bottom 5%',
};

const VERDICT = (score: number, max: number) => {
  const pct = (score / max) * 100;
  if (pct >= 90) return { label: 'ELITE', cls: 'text-amber-400 bg-amber-500/15' };
  if (pct >= 70) return { label: 'STRONG', cls: 'text-emerald-400 bg-emerald-500/15' };
  if (pct >= 50) return { label: 'AVERAGE', cls: 'text-blue-400 bg-blue-500/15' };
  if (pct >= 30) return { label: 'WEAK', cls: 'text-orange-400 bg-orange-500/15' };
  return { label: 'CRITICAL', cls: 'text-red-400 bg-red-500/15' };
};

function detectPlatform(url: string): Platform {
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/youtu(be\.com|\.be)/i.test(url)) return 'youtube';
  return 'unknown';
}

function PlatformIcon({ platform, size = 16 }: { platform: string; size?: number }) {
  switch (platform) {
    case 'tiktok': return <SiTiktok size={size} />;
    case 'instagram': return <SiInstagram size={size} />;
    case 'youtube': return <SiYoutube size={size} />;
    default: return <ExternalLink size={size} />;
  }
}

function ScoreRing({ score, max, color, size = 44 }: { score: number; max: number; color: string; size?: number }) {
  const pct = (score / max) * 100;
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeLinecap="square" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

/** Architectural corner marks for section framing */
function CornerMarks({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* TL */}
      <div className="absolute top-0 left-0 w-4 h-4">
        <div className="absolute top-0 left-0 w-full h-px bg-white/20" />
        <div className="absolute top-0 left-0 h-full w-px bg-white/20" />
      </div>
      {/* TR */}
      <div className="absolute top-0 right-0 w-4 h-4">
        <div className="absolute top-0 right-0 w-full h-px bg-white/20" />
        <div className="absolute top-0 right-0 h-full w-px bg-white/20" />
      </div>
      {/* BL */}
      <div className="absolute bottom-0 left-0 w-4 h-4">
        <div className="absolute bottom-0 left-0 w-full h-px bg-white/20" />
        <div className="absolute bottom-0 left-0 h-full w-px bg-white/20" />
      </div>
      {/* BR */}
      <div className="absolute bottom-0 right-0 w-4 h-4">
        <div className="absolute bottom-0 right-0 w-full h-px bg-white/20" />
        <div className="absolute bottom-0 right-0 h-full w-px bg-white/20" />
      </div>
    </div>
  );
}

/** Tactical section divider */
function SectionDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {label && (
        <span className="text-[9px] font-bold text-white/15 uppercase tracking-[0.3em] flex items-center gap-1.5" style={TEKO}>
          <GateIcon className="w-2.5 h-2.5" />
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Loopy AI Rating — AI Video Edit Analyzer",
  "alternateName": "Loopy Rate My Edit",
  "url": "https://loopgate.io/loopy",
  "description": "Free AI-powered video editing quality analyzer. Get instant diagnostic scores across 5 pillars.",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "creator": { "@type": "Organization", "name": "Loopgate", "url": "https://loopgate.io" },
  "featureList": ["AI video edit analysis", "5-pillar QOI scoring", "Instant feedback", "Improvement tips", "Rating history"],
};

export default function LoopyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<LoopyRating | null>(null);
  const [history, setHistory] = useState<SavedRating[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [animateScores, setAnimateScores] = useState(false);
  const [scanPhase, setScanPhase] = useState(0);
  const [revealPhase, setRevealPhase] = useState(0); // 0=hidden, 1=flash, 2=grade slam, 3=score count, 4=full
  const [displayScore, setDisplayScore] = useState(0);

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

  const scanMessages = ['Scanning URL...', 'Analyzing visuals...', 'Evaluating sync...', 'Computing identity...', 'Generating scores...'];

  const handleSubmit = async () => {
    if (!url.trim() || loading) return;
    const platform = detectPlatform(url);
    setLoading(true);
    setRating(null);
    setShowResult(false);
    setAnimateScores(false);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loopy-rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          submissionUrl: url.trim(),
          platform,
          videoTitle: title.trim() || undefined,
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
      setTimeout(() => setAnimateScores(true), 300);

      if (user) {
        await supabase.from('loopy_ratings').insert({
          user_id: user.id,
          submission_url: url.trim(),
          platform,
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
      toast.error('Failed to connect to Loopy');
    }
    setLoading(false);
  };

  const handleReset = () => {
    setUrl(''); setTitle(''); setNotes('');
    setRating(null); setShowResult(false); setAnimateScores(false);
  };

  const gradeScore = rating?.total ?? 0;
  const isHighScore = gradeScore >= 50;

  return (
    <>
      <Helmet>
        <title>AI Video Edit Rating Tool — Free Instant QOI Scores | Loopy by Loopgate</title>
        <meta name="description" content="Rate your video edits with AI instantly. Loopy analyzes your AMV, edit, or content across 5 diagnostic pillars — Emotion, Creativity, Sync, Identity & Execution — and gives you a full QOI score with tips to level up. Free to use." />
        <meta name="keywords" content="AI video edit rating, rate my edit, AMV rating AI, video editing score, QOI score, edit quality analyzer, AI edit feedback, loopy AI, video edit analyzer, free AI rating tool" />
        <link rel="canonical" href="https://loopgate.io/loopy" />
        <meta property="og:title" content="Loopy AI Rating — Free Video Edit Analyzer" />
        <meta property="og:description" content="Drop your edit link and get instant AI diagnostic scores across 5 pillars." />
        <meta property="og:url" content="https://loopgate.io/loopy" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Loopy AI Rating — Free Video Edit Analyzer" />
        <meta name="twitter:description" content="AI-powered edit analysis across 5 QOI pillars. Get instant scores & tips." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-[#080808] pb-32 relative">
        {/* ═══ GLOBAL BACKGROUND BONES ═══ */}
        <GatePattern opacity={2} color="white" tileSize={56} />

        {/* Vertical frame lines */}
        <div className="fixed inset-y-0 left-4 sm:left-8 w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent pointer-events-none z-0" />
        <div className="fixed inset-y-0 right-4 sm:right-8 w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent pointer-events-none z-0" />

        {/* ═══════ HERO ═══════ */}
        <div className="relative overflow-hidden">
          {/* Scan lines texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }} />
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08)_0%,transparent_60%)]" />
          
          {/* Top frame line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

          <div className="relative max-w-2xl mx-auto px-4 pt-10 pb-6 text-center">
            {/* System status bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <div className="flex items-center gap-1.5 px-2 py-0.5 border border-white/[0.06]">
                <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[8px] font-bold text-white/25 uppercase tracking-[0.3em]" style={TEKO}>System Online</span>
              </div>
              <div className="w-px h-3 bg-white/[0.08]" />
              <span className="text-[8px] font-bold text-white/15 uppercase tracking-[0.2em]" style={TEKO}>Loopgate AI Engine</span>
              <div className="w-px h-3 bg-white/[0.08]" />
              <div className="flex items-center gap-1 px-2 py-0.5 border border-purple-500/20 bg-purple-500/[0.06]">
                <span className="text-[8px] font-bold text-purple-400/60 uppercase tracking-[0.2em]" style={TEKO}>v1.1</span>
              </div>
            </motion.div>

            {/* Loopy avatar */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="relative w-20 h-20 mx-auto mb-4"
            >
              <div className="absolute inset-[-4px] bg-gradient-to-br from-purple-500/40 to-fuchsia-500/20 blur-xl" />
              <div className="relative w-20 h-20 border-2 border-white/10 overflow-hidden"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
                <img src={loopyAvatar} alt="Loopy AI" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 flex items-center justify-center border-2 border-[#080808]">
                <Brain className="w-3 h-3 text-white" />
              </div>
              {/* Corner frame around avatar */}
              <CornerMarks className="-inset-2" />
            </motion.div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/[0.08] mb-3">
              <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50" style={TEKO}>AI-Powered Analysis</span>
            </div>

            <h1 className="text-[42px] sm:text-[56px] font-black text-white leading-[0.9] tracking-wide mb-3" style={TEKO}>
              LOOPY AI RATING
            </h1>

            <p className="text-[13px] text-white/30 max-w-sm mx-auto leading-relaxed">
              Drop your edit link. Get <span className="text-white/70 font-semibold">instant diagnostic scores</span> across 5 QOI pillars.
            </p>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-5 mt-4">
              {[
                { label: '5 PILLARS', sub: 'DIAGNOSTIC' },
                { label: 'INSTANT', sub: 'ANALYSIS' },
                { label: '100%', sub: 'FREE' },
              ].map((s, i) => (
                <div key={i} className="text-center relative">
                  <span className="text-[13px] font-bold text-white/60 tracking-wider" style={TEKO}>{s.label}</span>
                  <span className="text-[9px] text-white/20 uppercase tracking-widest block" style={TEKO}>{s.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom border with accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
        </div>

        <div className="max-w-lg mx-auto px-4 space-y-4 relative z-10 mt-6">
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                {/* ═══════ FORM CARD ═══════ */}
                <div className="relative overflow-hidden bg-[#111] border border-white/[0.06]"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}>
                  <CornerMarks />
                  {/* Top accent */}
                  <div className="h-[2px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500" />

                  {/* Section label */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-0">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-1.5" style={TEKO}>
                      <Activity className="w-3 h-3 text-purple-400/50" /> Submission Panel
                    </span>
                    <span className="text-[8px] text-white/10 uppercase tracking-widest" style={TEKO}>QOI-ENGINE</span>
                  </div>

                  <div className="p-5 pt-3 space-y-4">
                    {/* How it works */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { icon: Send, text: 'DROP LINK', num: '01' },
                        { icon: Brain, text: 'AI ANALYZES', num: '02' },
                        { icon: BarChart3, text: 'GET SCORES', num: '03' },
                      ].map((step, i) => (
                        <div key={i} className="relative flex flex-col items-center gap-1 py-2.5 bg-white/[0.04] border border-white/[0.08]">
                          <span className="absolute top-1 left-1.5 text-[7px] text-white/10 font-bold" style={TEKO}>{step.num}</span>
                          <step.icon className="w-3.5 h-3.5 text-white/40" />
                          <span className="text-[10px] font-bold text-white/50 tracking-wider" style={TEKO}>{step.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <GateIcon className="w-2.5 h-2.5 text-white/10" />
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    {/* URL */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em] flex items-center gap-1.5" style={TEKO}>
                        <Target className="w-3 h-3 text-purple-400" /> EDIT URL <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://tiktok.com/@you/video/... or youtube/instagram"
                          className="bg-[#0a0a0a] border-white/[0.12] h-12 text-sm text-white/90 rounded-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 placeholder:text-white/25"
                        />
                        {url && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 bg-purple-500/15 text-purple-400">
                            <PlatformIcon platform={detectPlatform(url)} size={10} />
                            <span className="text-[9px] font-bold uppercase tracking-wider" style={TEKO}>{detectPlatform(url)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em] flex items-center gap-1.5" style={TEKO}>
                        <Award className="w-3 h-3 text-purple-400" /> VIDEO TITLE
                        <span className="text-white/30 text-[9px] normal-case tracking-normal font-normal">optional</span>
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Demon Slayer AMV — Akeboshi"
                        className="bg-[#0a0a0a] border-white/[0.12] h-11 text-sm text-white/90 rounded-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 placeholder:text-white/25"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em] flex items-center gap-1.5" style={TEKO}>
                        <MessageSquare className="w-3 h-3 text-purple-400" /> NOTES FOR LOOPY
                        <span className="text-white/30 text-[9px] normal-case tracking-normal font-normal">optional</span>
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="anything u want loopy to know — editing software, how long it took, what u tried new..."
                        className="bg-[#0a0a0a] border-white/[0.12] resize-none h-20 text-sm text-white/90 rounded-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 placeholder:text-white/25"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={!url.trim() || loading}
                      className="group relative w-full h-14 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 group-hover:from-purple-500 group-hover:to-fuchsia-500 transition-all" />
                      <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/10 to-transparent" />
                      <div className="relative flex items-center justify-center gap-2.5">
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span className="text-[14px] font-bold text-white tracking-wider" style={TEKO}>{scanMessages[scanPhase]}</span>
                          </>
                        ) : (
                          <>
                            <GateIcon className="w-4 h-4 text-white" />
                            <span className="text-[16px] font-bold text-white uppercase tracking-[0.2em]" style={TEKO}>Analyze My Edit</span>
                          </>
                        )}
                      </div>
                      {loading && (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/30">
                          <motion.div className="h-full bg-white/40" initial={{ width: '0%' }} animate={{ width: '95%' }} transition={{ duration: 15, ease: 'linear' }} />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pillar chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
                  {PILLARS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <div key={p.key} className="flex items-center gap-1 px-2 py-1 bg-white/[0.03] border border-white/[0.06]">
                        <Icon className={`w-3 h-3 ${p.accent}`} />
                        <span className="text-[10px] text-white/50 font-bold tracking-wider" style={TEKO}>{p.label}</span>
                        <span className="text-[9px] text-white/25" style={TEKO}>/{p.max}</span>
                      </div>
                    );
                  })}
                </div>

                {/* How it works explainer */}
                <SectionDivider label="How It Works" />
                <div className="relative bg-[#0e0e0e] border border-white/[0.05] p-4">
                  <CornerMarks />
                  <div className="space-y-3">
                    {[
                      { icon: Send, title: 'Paste your edit link', desc: 'TikTok, Instagram Reels, or YouTube — any platform works.' },
                      { icon: Brain, title: 'Loopy runs multimodal AI analysis', desc: 'Thumbnail vision + metadata extraction across 5 QOI pillars.' },
                      { icon: BarChart3, title: 'Get instant diagnostic scores', desc: 'Pillar breakdown, grade, strengths, and improvement tips.' },
                      { icon: Swords, title: 'Take your score to the Arena', desc: 'Challenge editors, enter drops, and get paid for your edits.' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-7 h-7 shrink-0 bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                          <step.icon className="w-3 h-3 text-purple-400/60" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-white/60" style={TEKO}>{step.title}</p>
                          <p className="text-[10px] text-white/25 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : rating && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">

                {/* ═══════ GRADE HERO ═══════ */}
                <div className="relative overflow-hidden bg-[#111] border border-white/[0.06]"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}>
                  <CornerMarks />
                  <div className="h-[2px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500" />
                  <motion.div
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />

                  {/* Section label */}
                  <div className="flex items-center justify-between px-6 pt-4">
                    <span className="text-[9px] font-bold text-white/15 uppercase tracking-[0.2em]" style={TEKO}>QOI Diagnostic Result</span>
                    <span className="text-[8px] text-white/10 uppercase tracking-widest" style={TEKO}>LOOPY v1.1</span>
                  </div>

                  <div className="relative p-6 pt-3 text-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                      className="relative inline-block mb-3"
                    >
                      <div className="absolute inset-[-8px] bg-gradient-to-br from-amber-400/30 to-purple-500/20 blur-2xl" />
                      <div className={`relative w-24 h-24 bg-gradient-to-br ${GRADE_COLORS[rating.grade] || 'from-gray-500 to-gray-400 text-white'} flex items-center justify-center border border-white/10`}
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
                        <span className="text-[48px] font-black leading-none" style={TEKO}>{rating.grade}</span>
                      </div>
                    </motion.div>

                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[40px] font-black text-white leading-none" style={TEKO}>{rating.total}</span>
                      <span className="text-[20px] text-white/30" style={TEKO}>/100</span>
                    </div>
                    <p className="text-[12px] text-purple-400/80 mt-2 italic max-w-xs mx-auto">"{rating.vibe_check}"</p>

                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20">
                      <Eye className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-400" style={TEKO}>QOI Diagnostic Complete</span>
                    </div>
                  </div>
                </div>

                {/* ═══════ VIDEO CONTEXT ═══════ */}
                {rating._meta && (rating._meta.thumbnailUrl || rating._meta.authorName || rating._meta.videoTitle) && (
                  <div className="relative bg-[#111] border border-white/[0.06] p-3.5">
                    <CornerMarks />
                    <div className="flex gap-3">
                      {rating._meta.thumbnailUrl && (
                        <div className="w-24 h-16 overflow-hidden shrink-0 border border-white/[0.06]">
                          <img src={rating._meta.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        {rating._meta.videoTitle && <p className="text-xs font-bold text-white/80 truncate">{rating._meta.videoTitle}</p>}
                        {rating._meta.authorName && <p className="text-[10px] text-white/30">by <span className="text-white/60">{rating._meta.authorName}</span></p>}
                        <div className="flex flex-wrap items-center gap-2">
                          {rating._meta.viewCount && <span className="text-[9px] text-white/25 flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> {rating._meta.viewCount}</span>}
                          {rating._meta.duration && <span className="text-[9px] text-white/25 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {rating._meta.duration}</span>}
                          <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-wider ${rating._meta.hadThumbnail ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`} style={TEKO}>
                            {rating._meta.hadThumbnail ? 'VISUAL ANALYSIS' : 'METADATA ONLY'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══════ METADATA-ONLY DISCLAIMER ═══════ */}
                {rating._meta && !rating._meta.hadThumbnail && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative bg-amber-500/[0.06] border border-amber-500/20 p-4 space-y-3"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
                  >
                    <CornerMarks />
                    <div className="h-[2px] bg-gradient-to-r from-amber-500 to-transparent -mx-4 -mt-4 mb-2" />
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-amber-400 uppercase tracking-[0.12em]" style={TEKO}>
                          Limited Analysis — No Visual Data
                        </p>
                        <p className="text-[11px] text-white/40 leading-relaxed">
                          {detectPlatform(url) === 'tiktok' || detectPlatform(url) === 'instagram'
                            ? <>TikTok and Instagram don't allow thumbnail access, so Loopy scored based on <span className="text-white/60 font-semibold">metadata only</span> (title, tags, description). Your actual edit could be way better than this score.</>
                            : <>Loopy couldn't load a thumbnail for this edit, so the score is based on <span className="text-white/60 font-semibold">metadata only</span>.</>
                          }
                        </p>
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold" style={TEKO}>For a real score:</p>
                          {(detectPlatform(url) === 'tiktok' || detectPlatform(url) === 'instagram') && (
                            <p className="flex items-start gap-2 text-[11px] text-white/50 leading-relaxed">
                              <span className="text-emerald-400 mt-0.5 shrink-0">→</span>
                              <span>Re-upload your edit to <span className="text-emerald-400 font-semibold">YouTube / Shorts</span> and paste that link here for full visual analysis</span>
                            </p>
                          )}
                          <p className="flex items-start gap-2 text-[11px] text-white/50 leading-relaxed">
                            <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                            <span>Submit to the <span className="text-amber-400 font-semibold">Arena</span> and get rated by a <span className="text-amber-400 font-semibold">certified human judge</span> with a real QOI score on your profile</span>
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(user ? '/arena' : '/start')}
                          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 border border-amber-500/25 hover:bg-amber-500/25 transition-all text-[10px] font-bold text-amber-400 uppercase tracking-[0.15em]"
                          style={{ ...TEKO, clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
                        >
                          <Shield className="w-3 h-3" />
                          {user ? 'Get Real Rating' : 'Sign Up & Get Rated'}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ═══════ PILLAR SCORES ═══════ */}
                <div className="relative bg-[#111] border border-white/[0.06] p-4 space-y-4"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
                  <CornerMarks />
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-white/40 uppercase tracking-[0.15em] flex items-center gap-2" style={TEKO}>
                      <Trophy className="w-3.5 h-3.5 text-amber-400" /> PILLAR BREAKDOWN
                    </span>
                    <span className="text-[9px] text-white/15 uppercase tracking-wider" style={TEKO}>scored by loopy</span>
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
                            <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 ${verdict.cls}`} style={TEKO}>{verdict.label}</span>
                            <span className="text-[14px] font-black text-white/80 tabular-nums" style={TEKO}>
                              {score}<span className="text-white/20 text-[11px]">/{pillar.max}</span>
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/[0.04] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: animateScores ? `${pct}%` : 0 }}
                            transition={{ duration: 1, delay: 0.1 * i, ease: 'easeOut' }}
                            className={`h-full ${pillar.bar}`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ═══════ STRENGTHS & IMPROVEMENTS ═══════ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative bg-[#111] border border-white/[0.06] p-4 space-y-2.5">
                    <CornerMarks />
                    <div className="h-[2px] bg-gradient-to-r from-emerald-500 to-transparent -mx-4 -mt-4 mb-3" />
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.15em] flex items-center gap-1.5" style={TEKO}>
                      <Star className="w-3 h-3" /> STRENGTHS
                    </span>
                    {rating.strengths.map((s, i) => (
                      <p key={i} className="flex items-start gap-2 text-[11px] text-white/50 leading-relaxed">
                        <span className="text-emerald-400 mt-0.5 shrink-0">✦</span>{s}
                      </p>
                    ))}
                  </div>
                  <div className="relative bg-[#111] border border-white/[0.06] p-4 space-y-2.5">
                    <CornerMarks />
                    <div className="h-[2px] bg-gradient-to-r from-amber-500 to-transparent -mx-4 -mt-4 mb-3" />
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-[0.15em] flex items-center gap-1.5" style={TEKO}>
                      <TrendingUp className="w-3 h-3" /> LEVEL UP
                    </span>
                    {rating.improvements.map((s, i) => (
                      <p key={i} className="flex items-start gap-2 text-[11px] text-white/50 leading-relaxed">
                        <span className="text-amber-400 mt-0.5 shrink-0">→</span>{s}
                      </p>
                    ))}
                  </div>
                </div>

                {/* ═══════ LOOPY FEEDBACK ═══════ */}
                <div className="relative bg-[#111] border border-white/[0.06] p-4">
                  <CornerMarks />
                  <div className="h-[2px] bg-gradient-to-r from-purple-500 to-transparent -mx-4 -mt-4 mb-3" />
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img src={loopyAvatar} alt="Loopy" className="w-10 h-10 border border-white/10" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border border-[#111] flex items-center justify-center">
                        <GateIcon className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[13px] font-bold text-white/80" style={TEKO}>LOOPY</span>
                        <span className="text-[8px] px-1.5 py-0.5 bg-purple-500/15 text-purple-400 font-bold uppercase tracking-wider" style={TEKO}>AI JUDGE</span>
                      </div>
                      <p className="text-[12px] text-white/40 leading-relaxed">{rating.detailed_feedback}</p>
                    </div>
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/* ═══ POST-RATING CONVERSION FUNNEL ═══ */}
                {/* ═══════════════════════════════════════════════ */}
                <SectionDivider label="What's Next?" />

                {/* ═══ FOR GUESTS — SIGN UP CTA ═══ */}
                {!user && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="relative overflow-hidden border border-red-500/30 bg-gradient-to-br from-red-500/[0.08] to-amber-500/[0.04]"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                  >
                    <CornerMarks />
                    <div className="h-[2px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
                    <motion.div
                      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/20 to-transparent"
                      animate={{ top: ['0%', '100%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="relative p-5 text-center space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20">
                        <Sparkles className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400" style={TEKO}>
                          {isHighScore ? "You're Ready" : "Level Up For Real"}
                        </span>
                      </div>

                      <h3 className="text-[28px] sm:text-[34px] font-black text-white leading-none tracking-wide" style={TEKO}>
                        {isHighScore 
                          ? <>YOUR EDIT IS <span className="text-amber-400">FIRE</span> — NOW GET PAID</>
                          : <>TURN YOUR SCORE INTO <span className="text-red-400">REAL MONEY</span></>
                        }
                      </h3>

                      <p className="text-[12px] text-white/40 leading-relaxed max-w-xs mx-auto">
                        {isHighScore
                          ? <>With a <span className="text-white/70 font-semibold">{rating.grade} grade</span>, you'd crush missions and 1v1 battles. Sign up and start earning.</>
                          : <>Get rated by <span className="text-white/70 font-semibold">real certified judges</span>, compete in 1v1 edit battles, and earn cash from missions.</>
                        }
                      </p>

                      {/* Three conversion paths */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { icon: Shield, label: 'REAL JUDGES', sub: 'Public Rating', color: 'text-amber-400' },
                          { icon: DollarSign, label: 'MISSIONS', sub: 'Earn Cash', color: 'text-emerald-400' },
                          { icon: Swords, label: '1v1 BATTLES', sub: 'Prove Yourself', color: 'text-red-400' },
                        ].map((path, i) => (
                          <div key={i} className="py-2 bg-white/[0.03] border border-white/[0.06]">
                            <path.icon className={`w-4 h-4 mx-auto mb-1 ${path.color}`} />
                            <span className="text-[10px] font-bold text-white/60 tracking-wider block" style={TEKO}>{path.label}</span>
                            <span className="text-[8px] text-white/20 uppercase tracking-widest" style={TEKO}>{path.sub}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => navigate('/start')}
                        className="group relative w-full h-13 overflow-hidden"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-amber-600 group-hover:from-red-500 group-hover:to-amber-500 transition-all" />
                        <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/15 to-transparent" />
                        <div className="relative flex items-center justify-center gap-2 py-3">
                          <GateIcon className="w-4 h-4 text-white" />
                          <span className="text-[15px] font-bold text-white uppercase tracking-[0.2em]" style={TEKO}>Sign Up — Start Competing</span>
                          <ArrowRight className="w-4 h-4 text-white/70" />
                        </div>
                      </button>

                      <p className="text-[9px] text-white/15">Free account • Takes 30 seconds • Compete. Create. Get paid.</p>
                    </div>
                  </motion.div>
                )}

                {/* ═══ FOR LOGGED-IN USERS — ACTION FUNNELS ═══ */}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="space-y-2.5"
                  >
                    {/* Confidence message */}
                    <div className="relative bg-[#111] border border-white/[0.06] p-4 text-center">
                      <CornerMarks />
                      <div className="h-[2px] bg-gradient-to-r from-emerald-500 via-primary to-emerald-500 -mx-4 -mt-4 mb-3" />
                      <p className="text-[12px] text-white/50 leading-relaxed">
                        {isHighScore 
                          ? <>Your <span className="text-amber-400 font-bold">{rating.grade}</span> grade is competition-ready. Take it to the arena.</>
                          : <>Now you know where you stand. Time to sharpen up and compete.</>
                        }
                      </p>
                    </div>

                    {/* Action cards */}
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          icon: Shield,
                          title: 'GET RATED BY REAL JUDGES',
                          desc: 'Official QOI score on your permanent profile',
                          route: '/arena',
                          gradient: 'from-amber-500/20 to-amber-600/10',
                          border: 'border-amber-500/30',
                          accent: 'text-amber-400',
                          cta: 'Enter Arena',
                        },
                        {
                          icon: DollarSign,
                          title: 'EARN CASH FROM MISSIONS',
                          desc: isHighScore ? `Your ${rating.grade} grade could earn S-tier payouts` : 'Complete editing missions for real money',
                          route: '/hub',
                          gradient: 'from-emerald-500/20 to-emerald-600/10',
                          border: 'border-emerald-500/30',
                          accent: 'text-emerald-400',
                          cta: 'View Missions',
                        },
                        {
                          icon: Swords,
                          title: '1v1 EDIT BATTLE',
                          desc: 'Challenge another editor head-to-head for IDX',
                          route: '/arena',
                          gradient: 'from-red-500/20 to-red-600/10',
                          border: 'border-red-500/30',
                          accent: 'text-red-400',
                          cta: 'Find Opponent',
                        },
                        {
                          icon: Users,
                          title: 'JOIN A UNIT',
                          desc: 'Find your crew and compete together',
                          route: '/units',
                          gradient: 'from-blue-500/20 to-blue-600/10',
                          border: 'border-blue-500/30',
                          accent: 'text-blue-400',
                          cta: 'Browse Units',
                        },
                      ].map((action, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.2 + i * 0.1 }}
                          onClick={() => navigate(action.route)}
                          className={`relative w-full flex items-center gap-3 p-3.5 bg-gradient-to-r ${action.gradient} border ${action.border} hover:brightness-125 transition-all text-left group`}
                          style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
                        >
                          <div className={`w-9 h-9 shrink-0 bg-white/[0.06] border border-white/[0.08] flex items-center justify-center`}>
                            <action.icon className={`w-4 h-4 ${action.accent}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-white/80 tracking-wider" style={TEKO}>{action.title}</p>
                            <p className="text-[10px] text-white/30 truncate">{action.desc}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`text-[10px] font-bold tracking-wider ${action.accent}`} style={TEKO}>{action.cta}</span>
                            <ChevronRight className={`w-3.5 h-3.5 ${action.accent} opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Rate Another */}
                <button
                  onClick={handleReset}
                  className="group relative w-full h-12 overflow-hidden border border-purple-500/20 bg-purple-500/[0.05] hover:bg-purple-500/10 transition-all"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[13px] font-bold text-purple-400 uppercase tracking-[0.18em]" style={TEKO}>Analyze Another Edit</span>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════ HISTORY ═══════ */}
          {history.length > 0 && (
            <div className="space-y-2 mt-6">
              <SectionDivider label="Rating History" />
              {history.map((r) => (
                <a
                  key={r.id}
                  href={r.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center gap-3 p-3 bg-[#111] border border-white/[0.05] hover:border-purple-500/20 transition-all group"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${GRADE_COLORS[r.grade] || 'from-gray-500 to-gray-400 text-white'} flex items-center justify-center shrink-0`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%)' }}>
                    <span className="text-[16px] font-black" style={TEKO}>{r.grade}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/60 truncate">{r.vibe_check}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PlatformIcon platform={r.platform} size={10} />
                      <span className="text-[10px] text-white/30 font-bold" style={TEKO}>{r.total_score}/100</span>
                      <span className="text-[10px] text-white/15">•</span>
                      <span className="text-[10px] text-white/20">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/10 group-hover:text-purple-400 transition-colors shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
