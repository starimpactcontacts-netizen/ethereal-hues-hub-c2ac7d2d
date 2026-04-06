import { useState, useEffect, useRef } from 'react';
import MissionLobbyChat from '@/components/loopgate/MissionLobbyChat';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, ArrowLeft, Clock, Users, CheckCircle2, Send, ExternalLink,
  MessageSquare, Loader2, Star, Zap, ShieldCheck, AlertTriangle,
  HelpCircle, ChevronRight, ChevronLeft, Film, Target, Music, Trophy,
  Flame, Info, X, Crosshair, Play, FileText
} from 'lucide-react';
import { useCommissionDetail, type SubmissionRating, RATING_PAYOUTS, RATING_COLORS } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const teko = { fontFamily: 'Teko, sans-serif' };

/* ── Platform verification helper ── */
function detectPlatform(u: string) {
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('streamable.com')) return 'streamable';
  return 'other';
}

function extractPlatformUsername(url: string, platform: string): string | null {
  try {
    if (platform === 'tiktok') {
      const m = url.match(/@([a-zA-Z0-9_.]+)/);
      return m ? m[1].toLowerCase() : null;
    }
    if (platform === 'instagram') {
      const m = url.match(/instagram\.com\/(?:reel|p|stories)\/[^/]+|instagram\.com\/([a-zA-Z0-9_.]+)/);
      return m && m[1] ? m[1].toLowerCase() : null;
    }
    if (platform === 'youtube') {
      const m = url.match(/@([a-zA-Z0-9_-]+)/);
      return m ? m[1].toLowerCase() : null;
    }
  } catch { /* ignore */ }
  return null;
}

/* ── Tier colors for the payout grid ── */
const TIER_COLORS: Record<string, string> = {
  S: 'border-amber-600/60 bg-amber-900/40',
  A: 'border-emerald-600/60 bg-emerald-900/40',
  B: 'border-blue-600/60 bg-blue-900/40',
  'C-F': 'border-border/40 bg-card/60',
};

/* ── Submit Form ── */
function SubmitForm({ onSubmit, disabled, userId, previousSubmissions }: {
  onSubmit: (url: string, platform: string, message: string) => Promise<void>;
  disabled: boolean;
  userId?: string;
  previousSubmissions: number;
}) {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!url.trim() || !userId) { setVerified(null); return; }
    const platform = detectPlatform(url);
    if (platform === 'other' || platform === 'streamable') { setVerified(null); return; }

    const timer = setTimeout(async () => {
      setChecking(true);
      const urlUsername = extractPlatformUsername(url, platform);
      if (!urlUsername) { setVerified(null); setChecking(false); return; }

      const { data } = await supabase
        .from('connected_platforms')
        .select('platform_username')
        .eq('user_id', userId)
        .eq('platform', platform);

      if (data && data.length > 0) {
        const match = data.some(p => p.platform_username.toLowerCase() === urlUsername);
        setVerified(match);
      } else {
        setVerified(null);
      }
      setChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [url, userId]);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(url.trim(), detectPlatform(url), message.trim());
      toast.success('Edit submitted!');
      setUrl('');
      setMessage('');
      setVerified(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste your edit link (TikTok, YouTube, IG)"
          className="h-10 pr-8 bg-surface-1 border-border/30"
          disabled={disabled}
        />
        {checking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />}
        {!checking && verified === true && <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />}
        {!checking && verified === false && <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400" />}
      </div>
      {verified === true && (
        <p className="text-[10px] text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verified — matches your connected account</p>
      )}
      {verified === false && (
        <p className="text-[10px] text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> This link doesn't match your connected account</p>
      )}
      <Textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Optional note..."
        className="min-h-[50px] resize-none bg-surface-1 border-border/30"
        disabled={disabled}
      />
      <Button
        onClick={handleSubmit}
        disabled={submitting || !url.trim() || disabled}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Submit Edit</>}
      </Button>
    </div>
  );
}

const RATINGS: SubmissionRating[] = ['S', 'A', 'B', 'C', 'D', 'F'];

/* ── Rating Modal ── */
function RatingModal({ submission, onRate, onClose, getPayoutForRating }: {
  submission: any;
  onRate: (id: string, rating: SubmissionRating, feedback: string) => Promise<void>;
  onClose: () => void;
  getPayoutForRating: (r: SubmissionRating) => number;
}) {
  const [feedback, setFeedback] = useState('');
  const [selectedRating, setSelectedRating] = useState<SubmissionRating | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async () => {
    if (!selectedRating) { toast.error('Pick a rating'); return; }
    setSubmitting(true);
    try {
      await onRate(submission.id, selectedRating, feedback.trim());
      const payout = getPayoutForRating(selectedRating);
      if (payout > 0) {
        toast.success(`Rated ${selectedRating} — $${(payout / 100).toFixed(0)} instant payout to @${submission.username}`);
      } else {
        toast.success(`Rated ${selectedRating} — Index points only`);
      }
      onClose();
    } catch { toast.error('Rating failed'); }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface-0 border border-border w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>

        <h3 style={teko} className="text-xl text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" /> RATE @{submission.username}
        </h3>

        <div className="bg-surface-1 border border-border/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-surface-2 flex items-center justify-center overflow-hidden">
              {submission.avatar_url ? <img src={submission.avatar_url} alt="" className="w-full h-full object-cover" /> :
                <span className="text-xs font-bold">{submission.username?.charAt(0).toUpperCase()}</span>}
            </div>
            <span className="text-sm font-semibold text-foreground">@{submission.username}</span>
          </div>
          <button onClick={() => window.open(submission.submission_url, '_blank', 'noopener,noreferrer')}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Watch Edit
          </button>
          {submission.message && <p className="text-xs text-muted-foreground mt-2 italic">"{submission.message}"</p>}
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Rating</label>
          <div className="grid grid-cols-6 gap-1.5">
            {RATINGS.map(r => {
              const payout = getPayoutForRating(r);
              const isSelected = selectedRating === r;
              return (
                <motion.button key={r} whileTap={{ scale: 0.92 }} onClick={() => setSelectedRating(r)}
                  className={`flex flex-col items-center py-3 border-2 transition-all ${
                    isSelected ? RATING_COLORS[r] + ' ring-2 ring-offset-1 ring-offset-background' : 'border-border/30 bg-surface-1 hover:border-border/60'
                  }`}>
                  <span className={`text-xl font-black ${isSelected ? '' : 'text-foreground'}`}>{r}</span>
                  {payout > 0 ? <span className="text-[9px] font-bold text-emerald-400 mt-0.5">${payout / 100}</span> :
                    <span className="text-[9px] text-muted-foreground mt-0.5">IDX</span>}
                </motion.button>
              );
            })}
          </div>
          {selectedRating && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-center">
              {getPayoutForRating(selectedRating) > 0 ? (
                <p className="text-sm text-emerald-400 font-bold">
                  <DollarSign className="w-3.5 h-3.5 inline" />
                  {(getPayoutForRating(selectedRating) / 100).toFixed(0)} instant payout
                </p>
              ) : <p className="text-sm text-muted-foreground">Index points only</p>}
            </motion.div>
          )}
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Feedback (optional)</label>
          <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Quick note on the edit..." className="min-h-[60px] resize-none" />
        </div>

        <Button onClick={handleRate} disabled={submitting || !selectedRating}
          className="w-full bg-amber-500 hover:bg-amber-400 text-background font-bold text-base py-5">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> :
            <><Star className="w-4 h-4 mr-2" /> Confirm {selectedRating || '...'}</>}
        </Button>
      </motion.div>
    </motion.div>
  );
}

function RatingBadge({ rating, earnedCents }: { rating: string; earnedCents: number }) {
  const colors = RATING_COLORS[rating as SubmissionRating] || 'text-muted-foreground bg-muted/30 border-border/30';
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 border text-xs font-black ${colors}`}>
      <span className="text-base">{rating}</span>
      {earnedCents > 0 && <span className="text-emerald-400 font-bold text-[10px]">+${earnedCents / 100}</span>}
    </div>
  );
}

/* ── Submission Card ── */
function SubmissionCard({ sub, canRate, onRate }: { sub: any; canRate: boolean; onRate: (sub: any) => void }) {
  return (
    <div className={`bg-surface-0 border p-3 ${
      sub.status === 'accepted' ? 'border-emerald-500/30' :
      sub.status === 'declined' ? 'border-red-500/30 opacity-60' : 'border-border/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-surface-2 flex items-center justify-center overflow-hidden">
            {sub.avatar_url ? <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" /> :
              <span className="text-xs font-bold">{sub.username?.charAt(0).toUpperCase()}</span>}
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">@{sub.username}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => window.open(sub.submission_url, '_blank', 'noopener,noreferrer')}
                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1">
                <ExternalLink className="w-2.5 h-2.5" /> View
              </button>
              {sub.platform && <span className="text-[9px] text-muted-foreground capitalize">{sub.platform}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sub.status === 'pending' && canRate ? (
            <Button size="sm" onClick={() => onRate(sub)} className="bg-amber-500 hover:bg-amber-400 text-background text-xs h-8 font-bold">
              <Star className="w-3.5 h-3.5 mr-1" /> Rate
            </Button>
          ) : sub.rating ? (
            <RatingBadge rating={sub.rating} earnedCents={sub.earned_cents} />
          ) : sub.status !== 'pending' ? (
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
              sub.status === 'accepted' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
            }`}>{sub.status}</span>
          ) : (
            <span className="text-[9px] text-muted-foreground">Pending</span>
          )}
        </div>
      </div>
      {sub.message && <p className="text-xs text-muted-foreground mt-2 italic">"{sub.message}"</p>}
      {sub.feedback && (
        <div className="mt-2 pt-2 border-t border-border/20">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Feedback:</p>
          <p className="text-xs text-foreground/80">"{sub.feedback}"</p>
        </div>
      )}
      {sub.earned_cents > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
          <DollarSign className="w-3 h-3" /> ${(sub.earned_cents / 100).toFixed(0)} paid instantly
        </div>
      )}
    </div>
  );
}

/* ── Edit Showcase Card ── */
function ShowcaseCard({ sub }: { sub: any }) {
  const ratingColor = sub.rating === 'S' ? 'text-amber-400 border-amber-500/50 bg-amber-500/10' :
    sub.rating === 'A' ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' :
    sub.rating === 'B' ? 'text-blue-400 border-blue-500/50 bg-blue-500/10' :
    'text-foreground/60 border-border bg-surface-1';

  return (
    <div className="shrink-0 w-[180px] bg-surface-0 border border-border/40 overflow-hidden hover:border-border/60 transition-colors snap-start">
      <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border/20">
        <div className={`w-6 h-6 border flex items-center justify-center shrink-0 ${ratingColor}`}>
          <span className="text-xs font-black">{sub.rating}</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold text-foreground truncate block">@{sub.username}</span>
          {sub.earned_cents > 0 && (
            <span className="text-[8px] font-black text-emerald-400">+${(sub.earned_cents / 100).toFixed(0)}</span>
          )}
        </div>
      </div>
      {sub.feedback && (
        <div className="px-2.5 py-1.5 border-b border-border/10">
          <p className="text-[8px] text-muted-foreground italic leading-relaxed line-clamp-2">"{sub.feedback}"</p>
        </div>
      )}
      <div className="px-2.5 py-1.5">
        <button onClick={() => window.open(sub.submission_url, '_blank')}
          className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Watch
        </button>
      </div>
    </div>
  );
}

export default function CommissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { commission, submissions, loading, submitEdit, rateSubmission } = useCommissionDetail(id);
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;
  const isPoster = !!user && commission?.created_by === user.id;
  const canRate = isStaff || isPoster;
  const [reviewingSubmission, setReviewingSubmission] = useState<any>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [editingBrief, setEditingBrief] = useState(false);
  const [briefText, setBriefText] = useState('');
  const showcaseRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;
  }

  if (!commission) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Mission not found</p>
        <Link to="/index" className="text-emerald-400 text-sm hover:underline">← Back to Arena</Link>
      </div>
    );
  }

  const payoutMap = commission.custom_payouts as Record<string, number> | null;
  const getPayoutForRating = (r: SubmissionRating) => payoutMap ? (payoutMap[r] ?? RATING_PAYOUTS[r]) : RATING_PAYOUTS[r];
  const maxPayout = (commission.payout_cents / 100).toFixed(1);
  const slotsLeft = commission.max_slots - commission.accepted_count;
  const isOpen = commission.status === 'open' && slotsLeft > 0 && (!commission.deadline || new Date(commission.deadline) > new Date());

  const mySubmissions = submissions.filter(s => s.user_id === user?.id);
  const canSubmit = isOpen && !!user && !isPoster;
  const totalPaidOut = submissions.reduce((acc, s) => acc + (s.earned_cents || 0), 0);

  const coverUrl = (commission as any).cover_url || commission.thumbnail_url;
  const deadlineLabel = commission.deadline ? formatDistanceToNow(new Date(commission.deadline), { addSuffix: true }) : null;

  const tierS = getPayoutForRating('S');
  const tierA = getPayoutForRating('A');
  const tierB = getPayoutForRating('B');

  // Leaderboard: all rated submissions sorted by rating tier
  const ratedSubmissions = submissions.filter(s => s.rating);
  const RANK_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4, F: 5 };
  const leaderboard = [...ratedSubmissions].sort((a, b) => (RANK_ORDER[a.rating || 'F'] || 5) - (RANK_ORDER[b.rating || 'F'] || 5));

  // Progress
  const progressPercent = commission.max_slots > 0 ? Math.min(100, (commission.accepted_count / commission.max_slots) * 100) : 0;

  const scrollShowcase = (dir: 'left' | 'right') => {
    if (!showcaseRef.current) return;
    showcaseRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ═══ HERO ═══ */}
      <div className="relative w-full" style={{ minHeight: '300px' }}>
        {coverUrl ? (
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        <button onClick={() => navigate('/index')}
          className="absolute top-4 left-4 z-20 w-9 h-9 bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>

        <div className="relative z-10 flex flex-col justify-end h-full px-4 pb-4 pt-16" style={{ minHeight: 'inherit' }}>
          <div className="flex items-start justify-between mb-auto pt-2">
            <div className="flex items-center gap-0">
              <div className="w-1 h-7 bg-emerald-500" />
              <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 flex items-center gap-2">
                {isOpen && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                  {isOpen ? 'Live' : commission.status === 'filled' ? 'Filled' : 'Closed'}
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-destructive">MISSION</span>
              </div>
            </div>
          </div>

          <div className="mb-auto" />
          <div className="bg-black/60 backdrop-blur-sm inline-flex items-center self-start px-2.5 py-1 mb-3">
            <span style={teko} className="text-4xl font-black text-emerald-400">${maxPayout}</span>
          </div>

          <div className="mb-3">
            {commission.artist_name && (
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/60 mb-0.5">
                {commission.artist_name}
              </p>
            )}
            <h1 style={teko} className="text-3xl font-black uppercase text-white leading-none">
              {commission.song_name || commission.title}
            </h1>
          </div>

          {/* Payout tier grid */}
          <div className="flex gap-1.5 mb-2">
            {[
              { rank: 'S', color: TIER_COLORS.S, textColor: 'text-amber-400', pay: tierS, qoi: '90+' },
              { rank: 'A', color: TIER_COLORS.A, textColor: 'text-emerald-400', pay: tierA, qoi: '75+' },
              { rank: 'B', color: TIER_COLORS.B, textColor: 'text-blue-400', pay: tierB, qoi: '60+' },
              { rank: 'C-F', color: TIER_COLORS['C-F'], textColor: 'text-muted-foreground', pay: 0, qoi: '<60' },
            ].map(t => (
              <div key={t.rank} className={`flex-1 border py-2 px-2 text-center ${t.color}`}>
                <p className={`font-black text-base ${t.textColor}`}>{t.rank}</p>
                <p className="text-white font-bold text-sm">{t.pay > 0 ? `$${(t.pay / 100).toFixed(1)}` : 'IDX'}</p>
                <p className="text-[8px] text-white/50 uppercase tracking-wider">QOI {t.qoi}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="px-4 pb-20 space-y-4 mt-3">

        {/* ── PROGRESS BAR ── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-black text-foreground uppercase tracking-wider">Slots</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
              {commission.accepted_count}/{commission.max_slots} accepted
            </span>
          </div>
          <div className="relative h-2.5 bg-surface-1 border border-border/30 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400"
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-muted-foreground">{slotsLeft > 0 ? `${slotsLeft} slots remaining` : 'All slots filled'}</span>
            {submissions.length > 0 && (
              <span className="text-[9px] text-muted-foreground">{submissions.length} edit{submissions.length !== 1 ? 's' : ''} submitted</span>
            )}
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="flex gap-2">
          {canSubmit ? (
            <button
              onClick={() => document.getElementById('mission-submit-area')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-sm transition-colors"
            >
              <Send className="w-4 h-4" /> Submit Edit
            </button>
          ) : !user ? (
            <Link to="/login" className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-black uppercase tracking-wider text-sm">
              <Send className="w-4 h-4" /> Sign In to Submit
            </Link>
          ) : null}
          <Link
            to={`/studio?mission=${id}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-1 border border-border/40 hover:border-border/60 text-foreground font-black uppercase tracking-wider text-sm transition-colors"
          >
            <Film className="w-4 h-4 text-emerald-400" /> Go Edit
          </Link>
        </div>

        {/* ── MISSION BRIEF ── */}
        <div>
          <button
            onClick={() => setShowBrief(!showBrief)}
            className="w-full flex items-center justify-between py-3 px-3 bg-gradient-to-r from-amber-950/40 to-surface-1 border border-gold/30 hover:border-gold/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" />
              <span className="text-[11px] font-black text-gold uppercase tracking-wider">Mission Brief</span>
            </div>
            <motion.div animate={{ rotate: showBrief ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-4 h-4 text-gold/60 rotate-90" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showBrief && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="bg-surface-0 border border-t-0 border-gold/20 p-4">
                  {editingBrief ? (
                    <div className="space-y-2">
                      <Textarea
                        value={briefText}
                        onChange={e => setBriefText(e.target.value)}
                        placeholder="Write the mission brief — creative direction, requirements, what you want editors to do..."
                        className="min-h-[120px] resize-none bg-surface-1 border-gold/20 text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-gold hover:bg-gold/80 text-background text-xs font-bold flex-1"
                          onClick={async () => {
                            const { error } = await supabase
                              .from('commissions')
                              .update({ description: briefText } as any)
                              .eq('id', id);
                            if (error) { toast.error('Failed to save brief'); return; }
                            toast.success('Brief saved!');
                            setEditingBrief(false);
                            window.location.reload();
                          }}
                        >
                          Save Brief
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditingBrief(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {commission.description ? (
                        <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{commission.description}</p>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <FileText className="w-5 h-5 text-muted-foreground/20" />
                          <p className="text-[10px] text-muted-foreground/50 text-center italic">Looks like this mission still doesn't know what its objective is.</p>
                          <p className="text-[8px] text-muted-foreground/30">Brief will be added soon</p>
                        </div>
                      )}
                      {canRate && (
                        <button
                          onClick={() => { setBriefText(commission.description || ''); setEditingBrief(true); }}
                          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-gold/70 hover:text-gold border border-dashed border-gold/20 hover:border-gold/40 transition-colors"
                        >
                          <Pencil className="w-3 h-3" /> {commission.description ? 'Edit Brief' : 'Add Brief'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div>
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full flex items-center justify-between py-2.5 px-3 bg-surface-1 border border-border/30 hover:border-border/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-gold" />
              <span className="text-[11px] font-black text-foreground uppercase tracking-wider">How Missions Work</span>
            </div>
            <motion.div animate={{ rotate: showHowItWorks ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showHowItWorks && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="bg-surface-0 border border-t-0 border-border/30 p-3 space-y-2.5">
                  {[
                    { step: '01', icon: Target, label: 'Follow the brief', desc: 'Read the mission brief and understand the creative direction' },
                    { step: '02', icon: Film, label: 'Create your edit', desc: 'Use any editing software (CapCut, Adobe, Premiere, etc.)' },
                    { step: '03', icon: Send, label: 'Post on socials', desc: 'Upload to TikTok, YouTube, or Instagram and paste the link' },
                    { step: '04', icon: Star, label: 'Get rated & paid', desc: 'Your edit gets a QOI score and tier rating (S/A/B/C-F)' },
                    { step: '05', icon: DollarSign, label: 'Earn instantly', desc: 'S/A/B rated edits get instant USD payouts. C-F earn Index points' },
                  ].map(({ step, icon: Icon, label, desc }) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[8px] font-black text-emerald-400">{step}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3 h-3 text-foreground/40" />
                          <span className="text-xs font-bold text-foreground/80">{label}</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── DIVIDER ── */}
        <div className="h-px bg-border/30" />

        {/* ── LEADERBOARD ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-gold" />
              <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Leaderboard</span>
            </div>
            {leaderboard.length > 0 && (
              <span className="text-[9px] text-muted-foreground">{leaderboard.length} rated</span>
            )}
          </div>
          {leaderboard.length === 0 ? (
            <div className="border border-dashed border-border/30 py-6 flex flex-col items-center gap-1.5">
              <Trophy className="w-5 h-5 text-muted-foreground/20" />
              <p className="text-[10px] text-muted-foreground/40 font-bold">No rated edits yet</p>
              <p className="text-[8px] text-muted-foreground/30">Submit your edit to be the first on the board</p>
            </div>
          ) : (
            <div className="space-y-1">
              {leaderboard.slice(0, 10).map((sub, i) => {
                const rColor = sub.rating === 'S' ? 'text-amber-400' : sub.rating === 'A' ? 'text-emerald-400' : sub.rating === 'B' ? 'text-blue-400' : 'text-muted-foreground';
                const isTop3 = i < 3;
                return (
                  <div key={sub.id} className={`flex items-center gap-2.5 py-2 px-2 ${isTop3 ? 'bg-surface-1 border border-border/30' : ''}`}>
                    <span className={`text-[11px] font-black w-5 text-center tabular-nums ${
                      i === 0 ? 'text-gold' : i === 1 ? 'text-foreground/60' : i === 2 ? 'text-amber-700' : 'text-muted-foreground/40'
                    }`}>#{i + 1}</span>
                    <div className="w-6 h-6 bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
                      {sub.avatar_url ? <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" /> :
                        <span className="text-[9px] font-bold text-muted-foreground">{sub.username?.[0]?.toUpperCase()}</span>}
                    </div>
                    <span className="text-xs font-bold text-foreground truncate flex-1">@{sub.username}</span>
                    <div className={`px-1.5 py-0.5 border text-[10px] font-black ${RATING_COLORS[sub.rating as SubmissionRating] || 'border-border text-muted-foreground'}`}>
                      {sub.rating}
                    </div>
                    {sub.earned_cents > 0 && (
                      <span className="text-[9px] font-bold text-emerald-400">${(sub.earned_cents / 100).toFixed(0)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── DIVIDER ── */}
        <div className="h-px bg-border/30" />

        {/* ── EDIT SHOWCASE CAROUSEL ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-gold" />
              <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Edit Showcase</span>
            </div>
            {ratedSubmissions.length > 0 && (
              <span className="text-[9px] text-muted-foreground">{ratedSubmissions.length} rated</span>
            )}
          </div>

          {ratedSubmissions.length === 0 ? (
            <div className="border border-dashed border-border/30 py-8 flex flex-col items-center gap-2">
              <Play className="w-5 h-5 text-muted-foreground/20" />
              <p className="text-[10px] text-muted-foreground/40 font-bold">No edits to showcase yet</p>
              <p className="text-[8px] text-muted-foreground/30">Rated edits will appear here as a carousel</p>
            </div>
          ) : (
            <div className="relative group/carousel">
              {ratedSubmissions.length > 2 && (
                <>
                  <button onClick={() => scrollShowcase('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>
                  <button onClick={() => scrollShowcase('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-foreground" />
                  </button>
                </>
              )}
              <div ref={showcaseRef} className="flex gap-2.5 overflow-x-auto scrollbar-hide scroll-smooth pb-2 snap-x snap-mandatory">
                {ratedSubmissions.map(sub => (
                  <ShowcaseCard key={sub.id} sub={sub} />
                ))}
              </div>
            </div>
          )}
        </div>
        {/* ── MY SUBMISSIONS ── */}
        {mySubmissions.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Your Submissions ({mySubmissions.length})
            </h3>
            <div className="space-y-2 mb-3">
              {mySubmissions.map(sub => (
                <div key={sub.id} className={`border p-3 flex items-center gap-3 ${
                  sub.rating ? 'bg-emerald-950/20 border-emerald-500/20' :
                  sub.status === 'declined' ? 'bg-red-950/20 border-red-500/30' :
                  'bg-surface-0 border-border/30'
                }`}>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => window.open(sub.submission_url, '_blank', 'noopener,noreferrer')}
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {sub.platform || 'View'}
                    </button>
                    {sub.earned_cents > 0 && (
                      <p className="text-[10px] text-emerald-400 font-bold mt-0.5">+${(sub.earned_cents / 100).toFixed(0)} earned</p>
                    )}
                    {sub.feedback && <p className="text-[10px] text-muted-foreground mt-1 italic">"{sub.feedback}"</p>}
                  </div>
                  {sub.rating ? (
                    <RatingBadge rating={sub.rating} earnedCents={sub.earned_cents} />
                  ) : (
                    <span className="text-[9px] text-amber-400 font-bold">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBMIT FORM ── */}
        {canSubmit && (
          <div id="mission-submit-area">
            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5" />
              {mySubmissions.length > 0 ? 'Submit Another Edit' : 'Submit Your Edit'}
            </h3>
            <SubmitForm
              onSubmit={async (url, platform, message) => {
                await submitEdit({ submission_url: url, platform, message: message || undefined });
              }}
              disabled={false}
              userId={user?.id}
              previousSubmissions={mySubmissions.length}
            />
          </div>
        )}

        {!user && isOpen && (
          <div className="bg-surface-1 border border-border/20 p-4 text-center">
            <p className="text-sm text-muted-foreground">Sign in to submit your edit</p>
          </div>
        )}

        {/* ── ALL SUBMISSIONS (Staff/Poster) ── */}
        {canRate && submissions.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              All Submissions ({submissions.length})
              <span className="text-[9px] text-muted-foreground ml-auto font-mono">
                {submissions.filter(s => s.status === 'pending').length} pending
              </span>
            </h3>
            <div className="space-y-2">
              {submissions.map(sub => (
                <SubmissionCard key={sub.id} sub={sub} canRate={canRate} onRate={setReviewingSubmission} />
              ))}
            </div>
          </div>
        )}

        {/* ── MISSION CHAT ── */}
        <MissionLobbyChat missionId={id!} />
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {reviewingSubmission && (
          <RatingModal
            submission={reviewingSubmission}
            onRate={rateSubmission}
            onClose={() => setReviewingSubmission(null)}
            getPayoutForRating={getPayoutForRating}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
