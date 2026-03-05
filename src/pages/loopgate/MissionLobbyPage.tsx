import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Crosshair, DollarSign, Trophy, Send, ExternalLink,
  Loader2, Star, Clock, Eye, Zap, Target, TrendingUp, ChevronRight,
  Music, Shield, Flame
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useEditorEarnings, RATING_COLORS, type SubmissionRating } from '@/hooks/useCommissions';
import { InfinityLoop } from '@/components/loopgate/InfinityLoop';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface MissionData {
  id: string;
  song_name: string;
  title: string;
  artist_name: string;
  artist_avatar: string | null;
  poster_url: string | null;
  mission_custom_payouts: Record<string, number> | null;
  mission_views_milestone: number;
  mission_views_bonus_cents: number;
  instant_payout: boolean;
  inspo_url: string | null;
  inspo_thumbnail_url: string | null;
  theme_description: string | null;
  submission_count: number;
}

interface MissionSubmission {
  id: string;
  user_id: string | null;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string | null;
  status: string | null;
  rating: string | null;
  earned_cents: number;
  feedback: string | null;
  created_at: string | null;
}

const RATINGS: SubmissionRating[] = ['S', 'A', 'B', 'C', 'D', 'F'];
const RANK_LABELS: Record<string, string> = { S: 'ELITE', A: 'PRO', B: 'SOLID', C: 'MID', D: 'WEAK', F: 'FAIL' };

export default function MissionLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;
  const { availableBalance } = useEditorEarnings();

  const [mission, setMission] = useState<MissionData | null>(null);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [mySubmission, setMySubmission] = useState<MissionSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<MissionSubmission | null>(null);

  const fetchMission = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('featured_drops')
      .select('id, title, song_name, poster_url, mission_custom_payouts, mission_views_milestone, mission_views_bonus_cents, instant_payout, inspo_url, inspo_thumbnail_url, theme_description, submission_count, artist_id, featured_artists(name, avatar_url)')
      .eq('id', id)
      .single();

    if (data) {
      const d = data as any;
      setMission({
        id: d.id,
        song_name: d.song_name,
        title: d.title,
        artist_name: d.featured_artists?.name || 'Unknown',
        artist_avatar: d.featured_artists?.avatar_url || null,
        poster_url: d.poster_url,
        mission_custom_payouts: d.mission_custom_payouts,
        mission_views_milestone: d.mission_views_milestone || 0,
        mission_views_bonus_cents: d.mission_views_bonus_cents || 0,
        instant_payout: d.instant_payout ?? false,
        inspo_url: d.inspo_url || null,
        inspo_thumbnail_url: d.inspo_thumbnail_url || null,
        theme_description: d.theme_description || null,
        submission_count: d.submission_count || 0,
      });
    }
    setLoading(false);
  }, [id]);

  const fetchSubmissions = useCallback(async () => {
    if (!id) return;
    const query = supabase
      .from('featured_submissions')
      .select('id, user_id, username, avatar_url, submission_url, platform, status, rating, earned_cents, feedback, created_at')
      .eq('drop_id', id)
      .order('created_at', { ascending: false });

    if (!isStaff) {
      if (user) query.eq('user_id', user.id);
      else return;
    }

    const { data } = await query.limit(50);
    if (data) {
      setSubmissions(data as any as MissionSubmission[]);
      if (user) {
        setMySubmission((data as any[]).find(s => s.user_id === user.id) || null);
      }
    }
  }, [id, user, isStaff]);

  useEffect(() => { fetchMission(); }, [fetchMission]);
  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const detectPlatform = (u: string) => {
    if (u.includes('tiktok.com') || u.includes('vm.tiktok.com')) return 'tiktok';
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('instagram.com')) return 'instagram';
    return 'other';
  };

  const handleSubmit = async () => {
    if (!url.trim() || !user || !mission) return;
    setSubmitting(true);

    const { data: profile } = await supabase
      .from('profiles').select('username, avatar_url').eq('id', user.id).single();

    const { error } = await supabase
      .from('featured_submissions')
      .insert({
        drop_id: mission.id,
        user_id: user.id,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url,
        submission_url: url.trim(),
        platform: detectPlatform(url),
        status: 'pending',
      } as any);

    if (error) toast.error(error.message);
    else { toast.success('Edit submitted!'); setUrl(''); fetchSubmissions(); }
    setSubmitting(false);
  };

  const payouts = mission?.mission_custom_payouts || {};
  const maxPayout = Math.max(...Object.values(payouts).map(v => Number(v) || 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Mission not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ═══ HERO BANNER ═══ */}
      <div className="relative h-[280px] overflow-hidden">
        {mission.poster_url ? (
          <img src={mission.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-surface-1" />
        )}
        {/* Heavy dark overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
        {/* Scan lines */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 3px)' }} />
        {/* Red accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-foreground/60 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back</span>
          </button>
        </div>

        {/* Status badges */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {mission.instant_payout && (
            <div className="bg-red-600 px-2 py-1 flex items-center gap-1 shadow-lg shadow-red-600/30">
              <Zap className="w-3 h-3 text-white" />
              <span className="text-[8px] font-black text-white uppercase tracking-wider">Instant</span>
            </div>
          )}
          <div className="bg-emerald-600 px-2.5 py-1 flex items-center gap-1 shadow-lg shadow-emerald-600/30">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[8px] font-black text-white uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-1">{mission.artist_name}</p>
          <h1 className="font-display text-3xl text-foreground leading-none tracking-wide">{mission.song_name}</h1>
          <p className="text-[10px] text-muted-foreground mt-1">{mission.title}</p>
        </div>
      </div>

      {/* ═══ EARNINGS POTENTIAL ═══ */}
      <div className="px-4 -mt-2 relative z-10">
        <div className="bg-surface-0 border-2 border-emerald-500/30 overflow-hidden">
          {/* Header bar */}
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Earnings</span>
            </div>
            {maxPayout > 0 && (
              <span className="font-display text-lg text-emerald-400">UP TO ${(maxPayout / 100).toFixed(0)}</span>
            )}
          </div>

          {/* Rating tiers grid */}
          <div className="grid grid-cols-6 divide-x divide-border/30">
            {RATINGS.map(r => {
              const cents = payouts[r] || 0;
              const hasPay = cents > 0;
              return (
                <div key={r} className={`py-3 flex flex-col items-center gap-1 ${hasPay ? 'bg-surface-1' : 'bg-surface-0'}`}>
                  <span className={`text-xs font-black ${
                    r === 'S' ? 'text-amber-400' :
                    r === 'A' ? 'text-emerald-400' :
                    r === 'B' ? 'text-blue-400' :
                    'text-muted-foreground'
                  }`}>{r}</span>
                  <span className={`text-[10px] font-bold ${hasPay ? 'text-emerald-400' : 'text-muted-foreground/40'}`}>
                    {hasPay ? `$${(cents / 100).toFixed(2)}` : 'IDX'}
                  </span>
                  <span className="text-[7px] text-muted-foreground/30 font-bold uppercase">{RANK_LABELS[r]}</span>
                </div>
              );
            })}
          </div>

          {/* Views bonus */}
          {mission.mission_views_milestone > 0 && mission.mission_views_bonus_cents > 0 && (
            <div className="border-t border-emerald-500/20 bg-amber-500/5 px-3 py-2 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">
                {(mission.mission_views_milestone / 1000).toFixed(0)}K VIEWS = +${(mission.mission_views_bonus_cents / 100).toFixed(0)} BONUS
              </span>
              <span className="text-[7px] text-amber-400/40 ml-auto">C+ rank only</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ YOUR BALANCE ═══ */}
      {user && (
        <div className="px-4 mt-3">
          <div className="bg-surface-1 border border-border/50 px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Balance</span>
                <p className="font-display text-lg text-emerald-400 leading-none">${(availableBalance / 100).toFixed(2)}</p>
              </div>
            </div>
            <Link to="/payouts" className="text-[8px] font-black text-emerald-400/50 hover:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              Withdraw <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* ═══ HOW IT WORKS ═══ */}
      <div className="px-4 mt-4">
        <div className="bg-surface-1 border border-border/50 overflow-hidden">
          <div className="bg-red-500/5 border-b border-red-500/10 px-3 py-2">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">⚔️ How It Works</span>
          </div>
          <div className="p-3 space-y-3">
            {[
              { step: '01', icon: Music, label: 'Listen to the track', desc: 'Study the vibe, tempo & mood' },
              { step: '02', icon: Target, label: 'Create your edit', desc: 'Use any NLE — make it slap' },
              { step: '03', icon: Send, label: 'Submit your link', desc: 'TikTok, YouTube, or Instagram' },
              { step: '04', icon: Star, label: 'Get rated & paid', desc: 'S-rank = max payout. No cap.' },
            ].map(({ step, icon: Icon, label, desc }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-red-400">{step}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3 text-foreground/40" />
                    <span className="text-xs font-bold text-foreground">{label}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ THEME & INSPO ═══ */}
      {(mission.theme_description || mission.inspo_thumbnail_url || mission.inspo_url) && (
        <div className="px-4 mt-3">
          <div className="bg-surface-1 border border-border/50 overflow-hidden">
            <div className="bg-purple-500/5 border-b border-purple-500/10 px-3 py-2">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">🎨 Theme & Inspiration</span>
            </div>
            <div className="p-3 space-y-3">
              {mission.theme_description && (
                <p className="text-xs text-foreground/80 leading-relaxed">{mission.theme_description}</p>
              )}
              {mission.inspo_thumbnail_url && (
                <div className="relative overflow-hidden border border-border">
                  <img src={mission.inspo_thumbnail_url} alt="Inspo" className="w-full h-44 object-cover" />
                  {mission.inspo_url && (
                    <a href={mission.inspo_url} target="_blank" rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                      <span className="bg-foreground/10 backdrop-blur-md px-4 py-2 border border-foreground/20 text-xs font-black text-foreground flex items-center gap-2 uppercase tracking-wider">
                        <ExternalLink className="w-3.5 h-3.5" /> Watch Inspo
                      </span>
                    </a>
                  )}
                </div>
              )}
              {mission.inspo_url && !mission.inspo_thumbnail_url && (
                <a href={mission.inspo_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 font-bold">
                  <ExternalLink className="w-3.5 h-3.5" /> Watch Inspo Video
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SUBMISSION PORTAL ═══ */}
      <div className="px-4 mt-4">
        {!user ? (
          <Link to="/login">
            <div className="bg-red-500/10 border-2 border-red-500/30 p-5 text-center">
              <Crosshair className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="font-display text-lg text-foreground">SIGN IN TO COMPETE</p>
              <p className="text-[10px] text-muted-foreground mt-1">Create a free account to start earning</p>
            </div>
          </Link>
        ) : mySubmission ? (
          <div className={`border-2 p-4 ${mySubmission.rating ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-surface-1'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-foreground/40" />
              <span className="text-[10px] font-black text-foreground uppercase tracking-[0.15em]">Your Submission</span>
            </div>
            {mySubmission.rating ? (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-2 border text-lg font-black ${RATING_COLORS[mySubmission.rating as SubmissionRating]}`}>
                    {mySubmission.rating}
                    {mySubmission.earned_cents > 0 && (
                      <span className="text-emerald-400 text-sm">+${(mySubmission.earned_cents / 100).toFixed(0)}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{RANK_LABELS[mySubmission.rating] || ''}</span>
                </div>
                {mySubmission.feedback && (
                  <div className="bg-surface-2 border border-border/50 p-3 mt-2">
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Judge Feedback</span>
                    <p className="text-xs text-foreground/80 mt-1 italic">"{mySubmission.feedback}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-sm font-bold text-amber-400">Awaiting Rating</span>
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-emerald-500/30 bg-surface-0 overflow-hidden">
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3 py-2.5 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Submit Your Edit</span>
            </div>
            <div className="p-4 space-y-3">
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="Paste your TikTok, YouTube, or Instagram link..."
                className="h-11 bg-surface-1 border-border/50 font-mono text-sm"
              />
              <Button
                onClick={handleSubmit}
                disabled={submitting || !url.trim()}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-display text-lg uppercase tracking-wider"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <><Send className="w-4 h-4 mr-2" /> Submit & Earn</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ SUBMISSIONS (Staff) ═══ */}
      {isStaff && submissions.length > 0 && (
        <div className="px-4 mt-4">
          <div className="bg-surface-1 border border-border/50 overflow-hidden">
            <div className="bg-amber-500/5 border-b border-amber-500/10 px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Submissions</span>
              <span className="text-[9px] text-muted-foreground">{submissions.length} total</span>
            </div>
            <div className="divide-y divide-border/30">
              {submissions.map(sub => (
                <div key={sub.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
                      {sub.avatar_url ? <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" /> :
                        <span className="text-[10px] font-bold text-muted-foreground">{sub.username?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-foreground truncate block">@{sub.username}</span>
                      <button onClick={() => window.open(sub.submission_url, '_blank')}
                        className="text-[9px] text-emerald-400 hover:underline flex items-center gap-0.5">
                        <ExternalLink className="w-2.5 h-2.5" /> Watch
                      </button>
                    </div>
                  </div>
                  {sub.rating ? (
                    <div className={`px-2 py-1 border text-xs font-black ${RATING_COLORS[sub.rating as SubmissionRating]}`}>
                      {sub.rating} {sub.earned_cents > 0 && <span className="text-emerald-400 text-[9px]">+${sub.earned_cents / 100}</span>}
                    </div>
                  ) : (
                    <button onClick={() => setRatingTarget(sub)}
                      className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 hover:bg-amber-500/20 transition-colors uppercase tracking-wider">
                      <Star className="w-3 h-3 inline mr-1" />Rate
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ RATING MODAL ═══ */}
      <AnimatePresence>
        {ratingTarget && (
          <RatingModal
            submission={ratingTarget}
            payoutMap={mission.mission_custom_payouts}
            onClose={() => setRatingTarget(null)}
            onRated={fetchSubmissions}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RatingModal({ submission, payoutMap, onClose, onRated }: {
  submission: MissionSubmission;
  payoutMap: Record<string, number> | null;
  onClose: () => void;
  onRated: () => void;
}) {
  const [selectedRating, setSelectedRating] = useState<SubmissionRating | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getPayout = (r: SubmissionRating) => (payoutMap?.[r] ?? 0);

  const handleRate = async () => {
    if (!selectedRating) { toast.error('Pick a rating'); return; }
    if (!feedback.trim()) { toast.error('Feedback is mandatory'); return; }
    setSubmitting(true);

    const earnedCents = getPayout(selectedRating);
    const { error } = await supabase
      .from('featured_submissions')
      .update({
        rating: selectedRating,
        earned_cents: earnedCents,
        status: selectedRating === 'F' ? 'declined' : 'scored',
        feedback: feedback.trim(),
        qoi_score: selectedRating === 'S' ? 90 : selectedRating === 'A' ? 75 : selectedRating === 'B' ? 60 : selectedRating === 'C' ? 45 : selectedRating === 'D' ? 30 : 15,
      } as any)
      .eq('id', submission.id);

    if (error) toast.error(error.message);
    else {
      toast.success(`Rated ${selectedRating}${earnedCents > 0 ? ` — $${(earnedCents / 100).toFixed(0)} awarded` : ''}`);
      onRated();
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-surface-0 border-2 border-amber-500/30 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="font-display text-lg text-foreground">RATE @{submission.username}</span>
          </div>
          <button onClick={() => window.open(submission.submission_url, '_blank')}
            className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Watch
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-6 gap-1.5">
            {RATINGS.map(r => {
              const payout = getPayout(r);
              const isSelected = selectedRating === r;
              return (
                <button key={r} onClick={() => setSelectedRating(r)}
                  className={`flex flex-col items-center py-3 border-2 transition-all ${
                    isSelected ? RATING_COLORS[r] + ' ring-1 ring-offset-1 ring-offset-background' : 'border-border/30 bg-surface-1 hover:border-border/60'
                  }`}>
                  <span className="text-xl font-black">{r}</span>
                  <span className={`text-[8px] font-bold mt-0.5 ${payout > 0 ? 'text-emerald-400' : 'text-muted-foreground/40'}`}>
                    {payout > 0 ? `$${payout / 100}` : 'IDX'}
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <Label className="text-[10px] font-black text-red-400 uppercase tracking-wider">Feedback (Required)</Label>
            <Textarea value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="What did they do well? What needs work?"
              className="min-h-[80px] resize-none mt-1 bg-surface-1" />
          </div>

          <Button onClick={handleRate} disabled={submitting || !selectedRating || !feedback.trim()}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-background font-display text-lg uppercase tracking-wider">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : `Confirm ${selectedRating || '...'}`}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
