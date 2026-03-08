import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Send, Loader2, Heart, Lightbulb, Music, Fingerprint, Zap,
  Trophy, TrendingUp, ArrowDown, Star, Clock, ChevronRight, ExternalLink,
  MessageSquare, RotateCcw, Brain, Scan, Shield, Target, Activity,
  ChevronDown, Award, BarChart3, Eye
} from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import { SiTiktok, SiInstagram, SiYoutube } from '@icons-pack/react-simple-icons';
import { Button } from '@/components/ui/button';
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
    const phases = ['Scanning URL...', 'Analyzing visuals...', 'Evaluating sync...', 'Computing identity...', 'Generating scores...'];
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % phases.length; setScanPhase(i); }, 2800);
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

      <div className="min-h-screen bg-[#080808] pb-32">
        {/* ═══════ HERO ═══════ */}
        <div className="relative overflow-hidden">
          {/* Scan lines texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }} />
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08)_0%,transparent_60%)]" />

          <div className="relative max-w-2xl mx-auto px-4 pt-10 pb-6 text-center">
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

            {/* Stats */}
            <div className="flex items-center justify-center gap-5 mt-4">
              {[
                { label: '5 PILLARS', sub: 'DIAGNOSTIC' },
                { label: 'INSTANT', sub: 'ANALYSIS' },
                { label: '100%', sub: 'FREE' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <span className="text-[13px] font-bold text-white/60 tracking-wider" style={TEKO}>{s.label}</span>
                  <span className="text-[9px] text-white/20 uppercase tracking-widest block" style={TEKO}>{s.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 space-y-4">
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                {/* ═══════ FORM CARD ═══════ */}
                <div className="relative overflow-hidden bg-[#111] border border-white/[0.06]"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}>
                  {/* Top accent */}
                  <div className="h-[2px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500" />

                  <div className="p-5 space-y-4">
                    {/* How it works */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { icon: Send, text: 'DROP LINK' },
                        { icon: Brain, text: 'AI ANALYZES' },
                        { icon: BarChart3, text: 'GET SCORES' },
                      ].map((step, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 py-2.5 bg-white/[0.06] border border-white/[0.08]">
                          <step.icon className="w-3.5 h-3.5 text-white/40" />
                          <span className="text-[10px] font-bold text-white/50 tracking-wider" style={TEKO}>{step.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* URL */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] flex items-center gap-1.5" style={TEKO}>
                        <Target className="w-3 h-3" /> EDIT URL <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://tiktok.com/@you/video/... or youtube/instagram"
                          className="bg-[#0a0a0a] border-white/[0.08] h-12 text-sm text-white/80 rounded-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 placeholder:text-white/15"
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
                      <label className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] flex items-center gap-1.5" style={TEKO}>
                        <Award className="w-3 h-3" /> VIDEO TITLE
                        <span className="text-white/15 text-[9px] normal-case tracking-normal font-normal">optional</span>
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Demon Slayer AMV — Akeboshi"
                        className="bg-[#0a0a0a] border-white/[0.08] h-11 text-sm text-white/80 rounded-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 placeholder:text-white/15"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] flex items-center gap-1.5" style={TEKO}>
                        <MessageSquare className="w-3 h-3" /> NOTES FOR LOOPY
                        <span className="text-white/15 text-[9px] normal-case tracking-normal font-normal">optional</span>
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="anything u want loopy to know — editing software, how long it took, what u tried new..."
                        className="bg-[#0a0a0a] border-white/[0.08] resize-none h-20 text-sm text-white/80 rounded-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 placeholder:text-white/15"
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
                      <div key={p.key} className="flex items-center gap-1 px-2 py-1 bg-white/[0.03] border border-white/[0.05]">
                        <Icon className={`w-3 h-3 ${p.accent}`} />
                        <span className="text-[10px] text-white/30 font-bold tracking-wider" style={TEKO}>{p.label}</span>
                        <span className="text-[9px] text-white/15" style={TEKO}>/{p.max}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : rating && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">

                {/* ═══════ GRADE HERO ═══════ */}
                <div className="relative overflow-hidden bg-[#111] border border-white/[0.06]"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}>
                  <div className="h-[2px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500" />
                  {/* Scan line */}
                  <motion.div
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="relative p-6 text-center">
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
                  <div className="bg-[#111] border border-white/[0.06] p-3.5">
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

                {/* ═══════ PILLAR SCORES ═══════ */}
                <div className="bg-[#111] border border-white/[0.06] p-4 space-y-4"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
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
                  <div className="bg-[#111] border border-white/[0.06] p-4 space-y-2.5">
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
                  <div className="bg-[#111] border border-white/[0.06] p-4 space-y-2.5">
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
                <div className="bg-[#111] border border-white/[0.06] p-4">
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

                {/* ═══════ CONVERSION CTA — REAL JUDGES ═══════ */}
                {!user && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="relative overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-purple-500/[0.04]"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                  >
                    <div className="h-[2px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
                    <motion.div
                      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
                      animate={{ top: ['0%', '100%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="relative p-5 text-center space-y-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20">
                        <Shield className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400" style={TEKO}>Not Satisfied?</span>
                      </div>

                      <h3 className="text-[28px] font-black text-white leading-none tracking-wide" style={TEKO}>
                        GET RATED BY <span className="text-amber-400">REAL JUDGES</span>
                      </h3>

                      <p className="text-[12px] text-white/40 leading-relaxed max-w-xs mx-auto">
                        Official Loopgate judges will publicly rate your edit for <span className="text-white/70 font-semibold">thousands of editors</span> to see. 
                        Your QOI score goes on your permanent profile.
                      </p>

                      <div className="flex items-center justify-center gap-4 text-center">
                        {[
                          { val: 'PUBLIC', sub: 'RATING' },
                          { val: 'OFFICIAL', sub: 'JUDGES' },
                          { val: 'PERMANENT', sub: 'PROFILE' },
                        ].map((s, i) => (
                          <div key={i}>
                            <span className="text-[12px] font-bold text-amber-400/80 tracking-wider" style={TEKO}>{s.val}</span>
                            <span className="text-[8px] text-white/20 uppercase tracking-widest block" style={TEKO}>{s.sub}</span>
                          </div>
                        ))}
                      </div>

                      <a
                        href="/start"
                        className="group relative inline-flex items-center justify-center gap-2 w-full h-12 overflow-hidden"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 group-hover:from-amber-400 group-hover:to-amber-500 transition-all" />
                        <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/15 to-transparent" />
                        <div className="relative flex items-center gap-2">
                          <GateIcon className="w-4 h-4 text-black" />
                          <span className="text-[15px] font-bold text-black uppercase tracking-[0.2em]" style={TEKO}>Sign Up — Get Judged For Real</span>
                        </div>
                      </a>

                      <p className="text-[9px] text-white/15">Free account • Takes 30 seconds</p>
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
              <span className="text-[11px] font-bold text-white/25 uppercase tracking-[0.15em] flex items-center gap-2 px-1" style={TEKO}>
                <Clock className="w-3 h-3" /> RATING HISTORY
              </span>
              {history.map((r) => (
                <a
                  key={r.id}
                  href={r.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-[#111] border border-white/[0.05] hover:border-purple-500/20 transition-all group"
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
