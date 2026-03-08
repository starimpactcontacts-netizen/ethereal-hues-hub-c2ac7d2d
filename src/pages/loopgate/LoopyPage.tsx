import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Sparkles, Send, Loader2, Heart, Lightbulb, Music, Fingerprint, Zap,
  Trophy, TrendingUp, ArrowDown, Star, Clock, ChevronRight, ExternalLink,
  MessageSquare, RotateCcw, Brain, Scan, Shield, Target, Activity,
  ChevronDown, Award, BarChart3, Eye
} from 'lucide-react';
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

const PILLARS = [
  { key: 'emotion', label: 'Emotion', max: 15, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500', glow: 'shadow-pink-500/30', ringColor: '#ec4899' },
  { key: 'creativity', label: 'Creativity', max: 25, icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500', glow: 'shadow-amber-500/30', ringColor: '#f59e0b' },
  { key: 'sync', label: 'Sync', max: 25, icon: Music, color: 'text-purple-400', bg: 'bg-purple-500', glow: 'shadow-purple-500/30', ringColor: '#a855f7' },
  { key: 'identity', label: 'Identity', max: 10, icon: Fingerprint, color: 'text-cyan-400', bg: 'bg-cyan-500', glow: 'shadow-cyan-500/30', ringColor: '#06b6d4' },
  { key: 'execution', label: 'Execution', max: 25, icon: Zap, color: 'text-green-400', bg: 'bg-green-500', glow: 'shadow-green-500/30', ringColor: '#22c55e' },
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

const VERDICT_TAG = (score: number, max: number) => {
  const pct = (score / max) * 100;
  if (pct >= 90) return { label: 'ELITE', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
  if (pct >= 70) return { label: 'STRONG', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' };
  if (pct >= 50) return { label: 'AVERAGE', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' };
  if (pct >= 30) return { label: 'WEAK', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' };
  return { label: 'CRITICAL', color: 'text-red-400 bg-red-400/10 border-red-400/30' };
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

/* ─── Animated Particles ─── */
function HeroParticles() {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 5,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Scan Line Effect ─── */
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/* ─── Circular Score Ring ─── */
function ScoreRing({ score, max, color, size = 48 }: { score: number; max: number; color: string; size?: number }) {
  const pct = (score / max) * 100;
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={3} />
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

/* ─── JSON-LD Schema ─── */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Loopy AI Rating — AI Video Edit Analyzer",
  "alternateName": "Loopy Rate My Edit",
  "url": "https://loopgate.io/loopy",
  "description": "Free AI-powered video editing quality analyzer. Get instant diagnostic scores across 5 pillars — Emotion, Creativity, Sync, Identity & Execution. Used by thousands of AMV, edit, and content creators.",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "creator": { "@type": "Organization", "name": "Loopgate", "url": "https://loopgate.io" },
  "featureList": [
    "AI video edit analysis",
    "5-pillar QOI scoring system",
    "Instant edit feedback",
    "Personalized improvement tips",
    "Rating history tracking"
  ],
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
    if (!user) return;
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

  // Scan phases during loading
  useEffect(() => {
    if (!loading) { setScanPhase(0); return; }
    const phases = ['Scanning URL...', 'Analyzing visuals...', 'Evaluating sync...', 'Computing identity...', 'Generating scores...'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % phases.length;
      setScanPhase(i);
    }, 2800);
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
    setUrl('');
    setTitle('');
    setNotes('');
    setRating(null);
    setShowResult(false);
    setAnimateScores(false);
  };

  return (
    <>
      <Helmet>
        <title>AI Video Edit Rating Tool — Free Instant QOI Scores | Loopy by Loopgate</title>
        <meta name="description" content="Rate your video edits with AI instantly. Loopy analyzes your AMV, edit, or content across 5 diagnostic pillars — Emotion, Creativity, Sync, Identity & Execution — and gives you a full QOI score with tips to level up. Free to use." />
        <meta name="keywords" content="AI video edit rating, rate my edit, AMV rating AI, video editing score, QOI score, edit quality analyzer, AI edit feedback, loopy AI, video edit analyzer, free AI rating tool" />
        <link rel="canonical" href="https://loopgate.io/loopy" />
        <meta property="og:title" content="Loopy AI Rating — Free Video Edit Analyzer" />
        <meta property="og:description" content="Drop your edit link and get instant AI diagnostic scores across 5 pillars. The most advanced AI video edit rating system." />
        <meta property="og:url" content="https://loopgate.io/loopy" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Loopy AI Rating — Free Video Edit Analyzer" />
        <meta name="twitter:description" content="AI-powered edit analysis across 5 QOI pillars. Get instant scores & tips." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background pb-32">
        {/* ═══════ HERO ═══════ */}
        <div className="relative overflow-hidden">
          {/* Layered gradient background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--gold)/0.06)_0%,transparent_70%)]" />
            <HeroParticles />
          </div>

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative max-w-3xl mx-auto px-4 pt-10 pb-8 text-center">
            {/* Loopy avatar with glow ring */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="relative w-24 h-24 mx-auto mb-5"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-amber-500/40 blur-xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full border-2 border-primary/60 shadow-[0_0_30px_hsl(var(--gold)/0.3)] overflow-hidden">
                <img src={loopyAvatar} alt="Loopy AI — Video Edit Rating Assistant" className="w-full h-full object-cover" />
              </div>
              <motion.div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center border-2 border-background"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <Brain className="w-3.5 h-3.5 text-white" />
              </motion.div>
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">AI-Powered Analysis</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-3 leading-none tracking-tight"
            >
              LOOPY AI RATING
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed"
            >
              The most advanced AI video edit analyzer. Drop your link and get
              <span className="text-foreground font-semibold"> instant diagnostic scores </span>
              across 5 QOI pillars.
            </motion.p>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-6 mt-5"
            >
              {[
                { icon: Scan, label: '5 Pillars', value: 'Diagnostic' },
                { icon: Activity, label: 'Instant', value: 'Analysis' },
                { icon: Shield, label: '100%', value: 'Free' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <stat.icon className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-[10px] uppercase tracking-wider">
                    <span className="text-foreground font-semibold">{stat.label}</span> {stat.value}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 space-y-6">
          {/* ═══════ FORM / RESULT ═══════ */}
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Main card with glassmorphic style */}
                <div className="relative rounded-2xl overflow-hidden">
                  {/* Outer glow border */}
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 via-border to-border" />

                  <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl">
                    {/* Card header */}
                    <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-4 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                          <Scan className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-foreground">Submit Your Edit</h2>
                          <p className="text-[10px] text-muted-foreground">paste a link → Loopy runs the full diagnostic</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-7 space-y-5">
                      {/* How it works — compact */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { icon: Send, text: 'Drop link' },
                          { icon: Brain, text: 'AI analyzes' },
                          { icon: BarChart3, text: 'Get scores' },
                        ].map((step, i) => (
                          <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/30 border border-border/50">
                            <step.icon className="w-4 h-4 text-primary/70" />
                            <span className="text-[10px] text-muted-foreground font-medium">{step.text}</span>
                          </div>
                        ))}
                      </div>

                      {/* URL Input */}
                      <div className="space-y-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                          <Target className="w-3 h-3" />
                          Edit URL
                          <span className="text-destructive">*</span>
                        </label>
                        <div className="relative group">
                          <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://tiktok.com/@you/video/... or youtube/instagram"
                            className="bg-background/80 border-border/60 h-13 text-sm pl-4 pr-4 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                          {url && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20"
                            >
                              <PlatformIcon platform={detectPlatform(url)} size={11} />
                              <span className="text-[9px] text-primary uppercase font-bold tracking-wider">{detectPlatform(url)}</span>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <div className="space-y-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                          <Award className="w-3 h-3" />
                          Video Title
                          <span className="text-muted-foreground/40 normal-case tracking-normal font-normal ml-1">optional</span>
                        </label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g., Demon Slayer AMV — Akeboshi"
                          className="bg-background/80 border-border/60 rounded-xl h-11 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3" />
                          Notes for Loopy
                          <span className="text-muted-foreground/40 normal-case tracking-normal font-normal ml-1">optional</span>
                        </label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="anything u want loopy to know — editing software, how long it took, what u tried new..."
                          className="bg-background/80 border-border/60 resize-none h-20 text-sm rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>

                      {/* Submit */}
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={handleSubmit}
                          disabled={!url.trim() || loading}
                          className="relative w-full h-14 rounded-xl font-display text-sm uppercase tracking-widest overflow-hidden bg-gradient-to-r from-foreground to-foreground/90 text-background hover:from-primary hover:to-primary/90 hover:text-primary-foreground transition-all duration-300 shadow-[0_4px_20px_hsl(var(--foreground)/0.15)]"
                        >
                          {loading ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs">{scanMessages[scanPhase]}</span>
                              </div>
                              {/* Progress bar */}
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-background/20">
                                <motion.div
                                  className="h-full bg-primary"
                                  initial={{ width: '0%' }}
                                  animate={{ width: '95%' }}
                                  transition={{ duration: 15, ease: 'linear' }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <Sparkles className="w-4 h-4" />
                              <span>Analyze My Edit</span>
                            </div>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Pillar preview chips */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap items-center justify-center gap-2 mt-5"
                >
                  {PILLARS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <div key={p.key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/60 border border-border/40 backdrop-blur-sm">
                        <Icon className={`w-3 h-3 ${p.color}`} size={12} />
                        <span className="text-[10px] text-muted-foreground font-medium">{p.label}</span>
                        <span className="text-[9px] text-muted-foreground/50">/{p.max}</span>
                      </div>
                    );
                  })}
                </motion.div>
              </motion.div>
            ) : rating && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* ═══════ GRADE HERO ═══════ */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl"
                >
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/30 via-border to-border" />
                  <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl">
                    <ScanLine />
                    <div className="relative p-6 sm:p-8 text-center">
                      {/* Grade badge */}
                      <motion.div
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                        className="relative inline-block mb-4"
                      >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-40 blur-2xl from-amber-400 to-primary" />
                        <div className={`relative w-28 h-28 rounded-2xl bg-gradient-to-br ${GRADE_COLORS[rating.grade] || 'from-gray-500 to-gray-400 text-white'} flex items-center justify-center shadow-2xl border border-white/10`}>
                          <span className="text-5xl font-display font-black">{rating.grade}</span>
                        </div>
                      </motion.div>

                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-4xl font-display font-black text-foreground">{rating.total}</span>
                          <span className="text-lg text-muted-foreground font-display">/100</span>
                        </div>
                        <p className="text-sm text-primary mt-2 font-semibold italic max-w-sm mx-auto">"{rating.vibe_check}"</p>
                      </motion.div>

                      {/* Diagnostic label */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                      >
                        <Eye className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">QOI Diagnostic Complete</span>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* ═══════ VIDEO CONTEXT CARD ═══════ */}
                {rating._meta && (rating._meta.thumbnailUrl || rating._meta.authorName || rating._meta.videoTitle) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="relative rounded-2xl overflow-hidden"
                  >
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-border/60 to-border/30" />
                    <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl p-4 sm:p-5">
                      <div className="flex gap-4">
                        {rating._meta.thumbnailUrl && (
                          <div className="w-24 h-16 sm:w-32 sm:h-20 rounded-lg overflow-hidden shrink-0 border border-border/50">
                            <img src={rating._meta.thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {rating._meta.videoTitle && (
                            <p className="text-xs font-bold text-foreground truncate">{rating._meta.videoTitle}</p>
                          )}
                          {rating._meta.authorName && (
                            <p className="text-[11px] text-muted-foreground">by <span className="text-foreground font-medium">{rating._meta.authorName}</span></p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            {rating._meta.viewCount && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Eye className="w-3 h-3" /> {rating._meta.viewCount}
                              </span>
                            )}
                            {rating._meta.duration && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {rating._meta.duration}
                              </span>
                            )}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${rating._meta.hadThumbnail ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' : 'text-amber-400 bg-amber-400/10 border-amber-400/30'} font-bold uppercase tracking-wider`}>
                              {rating._meta.hadThumbnail ? '🖼️ Visual Analysis' : '📝 Metadata Only'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ═══════ PILLAR SCORES ═══════ */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative rounded-2xl overflow-hidden"
                >
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-border/80 to-border/40" />
                  <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl p-5 sm:p-7 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        Pillar Breakdown
                      </h3>
                      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">scored by loopy ai</span>
                    </div>

                    {PILLARS.map((pillar, i) => {
                      const Icon = pillar.icon;
                      const score = rating[pillar.key as keyof LoopyRating] as number;
                      const pct = (score / pillar.max) * 100;
                      const verdict = VERDICT_TAG(score, pillar.max);

                      return (
                        <motion.div
                          key={pillar.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <ScoreRing score={score} max={pillar.max} color={pillar.ringColor} size={36} />
                                <Icon size={14} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${pillar.color}`} />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-foreground block">{pillar.label}</span>
                                <span className="text-[10px] text-muted-foreground">{Math.round(pct)}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${verdict.color}`}>
                                {verdict.label}
                              </span>
                              <span className="text-sm font-black text-foreground tabular-nums">
                                {score}<span className="text-muted-foreground text-[10px] font-normal">/{pillar.max}</span>
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: animateScores ? `${pct}%` : 0 }}
                              transition={{ duration: 1, delay: 0.1 * i, ease: 'easeOut' }}
                              className={`h-full rounded-full ${pillar.bg} shadow-lg ${pillar.glow}`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* ═══════ STRENGTHS & IMPROVEMENTS ═══════ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="relative rounded-2xl overflow-hidden"
                  >
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/20 to-border/40" />
                    <div className="relative bg-card/95 rounded-2xl p-5 space-y-3">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5" />
                        Strengths
                      </h3>
                      <ul className="space-y-2.5">
                        {rating.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground/90 leading-relaxed">
                            <span className="text-emerald-400 mt-0.5 shrink-0">✦</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="relative rounded-2xl overflow-hidden"
                  >
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-amber-500/20 to-border/40" />
                    <div className="relative bg-card/95 rounded-2xl p-5 space-y-3">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Level Up Tips
                      </h3>
                      <ul className="space-y-2.5">
                        {rating.improvements.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground/90 leading-relaxed">
                            <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                </div>

                {/* ═══════ DETAILED FEEDBACK ═══════ */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="relative rounded-2xl overflow-hidden"
                >
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/15 to-border/40" />
                  <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl p-5 sm:p-7">
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <img src={loopyAvatar} alt="Loopy" className="w-11 h-11 rounded-full border border-primary/40 shadow-[0_0_15px_hsl(var(--gold)/0.2)]" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-card flex items-center justify-center">
                          <Sparkles className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xs font-black text-foreground">Loopy</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase tracking-wider">AI Judge</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{rating.detailed_feedback}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Rate Another */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full h-13 border-primary/30 text-primary hover:bg-primary/10 font-display uppercase tracking-widest rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Analyze Another Edit
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════ HISTORY ═══════ */}
          {history.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mt-8">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                <Clock className="w-3.5 h-3.5" />
                Your Rating History
              </h2>
              <div className="space-y-2">
                {history.map((r) => (
                  <a
                    key={r.id}
                    href={r.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3.5 bg-card/80 border border-border/50 rounded-xl hover:border-primary/30 transition-all group backdrop-blur-sm"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${GRADE_COLORS[r.grade] || 'from-gray-500 to-gray-400 text-white'} flex items-center justify-center shrink-0 shadow-lg`}>
                      <span className="text-sm font-display font-black">{r.grade}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-medium truncate">{r.vibe_check}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <PlatformIcon platform={r.platform} size={10} />
                        <span className="text-[10px] text-muted-foreground font-bold">{r.total_score}/100</span>
                        <span className="text-[10px] text-muted-foreground/40">•</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
