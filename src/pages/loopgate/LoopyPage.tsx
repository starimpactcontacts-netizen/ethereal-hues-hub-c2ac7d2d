import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Sparkles, Send, Loader2, Heart, Lightbulb, Music, Fingerprint, Zap,
  Trophy, TrendingUp, ArrowDown, Star, Clock, ChevronRight, ExternalLink,
  MessageSquare, RotateCcw
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
  { key: 'emotion', label: 'Emotion', max: 15, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400' },
  { key: 'creativity', label: 'Creativity', max: 25, icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400' },
  { key: 'sync', label: 'Sync', max: 25, icon: Music, color: 'text-purple-400', bg: 'bg-purple-400' },
  { key: 'identity', label: 'Identity', max: 10, icon: Fingerprint, color: 'text-blue-400', bg: 'bg-blue-400' },
  { key: 'execution', label: 'Execution', max: 25, icon: Zap, color: 'text-green-400', bg: 'bg-green-400' },
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

  // Load history
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

      // Save to DB
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
        <title>Loopy AI Rating | Loopgate</title>
        <meta name="description" content="Get your video edits rated instantly by Loopy, Loopgate's AI judge." />
      </Helmet>

      <div className="min-h-screen bg-background pb-32">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
          <div className="relative max-w-2xl mx-auto px-4 pt-8 pb-6 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="w-20 h-20 rounded-full border-2 border-primary shadow-lg shadow-primary/30 overflow-hidden mx-auto mb-4"
            >
              <img src={loopyAvatar} alt="Loopy" className="w-full h-full object-cover" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1"
            >
              Loopy AI Rating
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground"
            >
              drop ur edit link and loopy rates it instantly on 5 QOI pillars 🐱
            </motion.p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 space-y-6">
          {/* Submission Form */}
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Info banner */}
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground">How it works</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Paste your edit URL → Loopy analyzes it → Get instant scores on Emotion, Creativity, Sync, Identity & Execution with specific tips to level up.
                      </p>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium">
                      Edit URL *
                    </label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://tiktok.com/@you/video/... or youtube/instagram link"
                      className="bg-background border-border h-12 text-sm"
                    />
                    {url && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <PlatformIcon platform={detectPlatform(url)} size={12} />
                        <span className="text-[10px] text-muted-foreground capitalize">{detectPlatform(url)} detected</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium">
                      Video Title <span className="text-muted-foreground/50">(optional)</span>
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Demon Slayer AMV — Akeboshi"
                      className="bg-background border-border"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium">
                      Notes for Loopy <span className="text-muted-foreground/50">(optional)</span>
                    </label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="anything u want loopy to know — editing software, how long it took, what u tried new..."
                      className="bg-background border-border resize-none h-20 text-sm"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!url.trim() || loading}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-display text-sm uppercase tracking-wider"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>loopy is watching ur edit...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Rate My Edit</span>
                      </div>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : rating && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Grade Hero */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative bg-card border border-border rounded-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                  <div className="relative p-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                      className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br ${GRADE_COLORS[rating.grade] || 'from-gray-500 to-gray-400 text-white'} shadow-2xl mb-4`}
                    >
                      <span className="text-4xl font-display font-black">{rating.grade}</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <p className="text-3xl font-display font-bold text-foreground">{rating.total}<span className="text-lg text-muted-foreground">/100</span></p>
                      <p className="text-sm text-primary mt-2 font-medium italic">"{rating.vibe_check}"</p>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Pillar Scores */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-primary" />
                    QOI Pillar Breakdown
                  </h3>

                  {PILLARS.map((pillar, i) => {
                    const Icon = pillar.icon;
                    const score = rating[pillar.key as keyof LoopyRating] as number;
                    const pct = (score / pillar.max) * 100;

                    return (
                      <motion.div
                        key={pillar.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon size={14} className={pillar.color} />
                            <span className="text-xs font-medium text-foreground">{pillar.label}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{score}<span className="text-muted-foreground text-[10px]">/{pillar.max}</span></span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: animateScores ? `${pct}%` : 0 }}
                            transition={{ duration: 0.8, delay: 0.1 * i, ease: 'easeOut' }}
                            className={`h-full rounded-full ${pillar.bg}`}
                            style={{ opacity: 0.85 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-card border border-border rounded-2xl p-4 space-y-3"
                  >
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {rating.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <span className="text-emerald-400 mt-0.5 shrink-0">✦</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-card border border-border rounded-2xl p-4 space-y-3"
                  >
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Level Up Tips
                    </h3>
                    <ul className="space-y-2">
                      {rating.improvements.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                {/* Detailed Feedback */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-card border border-border rounded-2xl p-4 sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <img src={loopyAvatar} alt="Loopy" className="w-10 h-10 rounded-full border border-primary shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-foreground">Loopy</span>
                        <Sparkles className="w-3 h-3 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{rating.detailed_feedback}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Rate Another */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full h-12 border-primary/30 text-primary hover:bg-primary/10 font-display uppercase tracking-wider"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Rate Another Edit
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 px-1">
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
                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${GRADE_COLORS[r.grade] || 'from-gray-500 to-gray-400 text-white'} flex items-center justify-center shrink-0`}>
                      <span className="text-sm font-display font-black">{r.grade}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{r.vibe_check}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <PlatformIcon platform={r.platform} size={10} />
                        <span className="text-[10px] text-muted-foreground">{r.total_score}/100</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
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
