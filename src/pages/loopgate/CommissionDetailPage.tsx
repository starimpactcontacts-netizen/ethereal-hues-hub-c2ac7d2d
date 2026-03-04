import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ArrowLeft, Clock, Users, CheckCircle2, XCircle, Send, ExternalLink, MessageSquare, Loader2, Star, Zap } from 'lucide-react';
import { useCommissionDetail, type SubmissionRating, RATING_PAYOUTS, RATING_COLORS } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

function SubmitForm({ onSubmit, disabled }: { onSubmit: (url: string, platform: string, message: string) => Promise<void>; disabled: boolean }) {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const detectPlatform = (u: string) => {
    if (u.includes('tiktok.com')) return 'tiktok';
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('instagram.com')) return 'instagram';
    if (u.includes('streamable.com')) return 'streamable';
    return 'other';
  };

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(url.trim(), detectPlatform(url), message.trim());
      toast.success('Edit submitted!');
      setUrl('');
      setMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-surface-1 border border-emerald-500/20 p-4 space-y-3">
      <h3 className="font-display text-sm text-emerald-400 flex items-center gap-2">
        <Send className="w-4 h-4" /> Submit Your Edit
      </h3>
      <Input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Paste your edit link (TikTok, YouTube, etc.)"
        className="h-10"
        disabled={disabled}
      />
      <Textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Optional message to the commissioner..."
        className="min-h-[60px] resize-none bg-background"
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

function RatingModal({ submission, onRate, onClose }: {
  submission: any;
  onRate: (id: string, rating: SubmissionRating, feedback: string) => Promise<void>;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState('');
  const [selectedRating, setSelectedRating] = useState<SubmissionRating | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async () => {
    if (!selectedRating) {
      toast.error('Pick a rating');
      return;
    }
    setSubmitting(true);
    try {
      await onRate(submission.id, selectedRating, feedback.trim());
      const payout = RATING_PAYOUTS[selectedRating];
      if (payout > 0) {
        toast.success(`Rated ${selectedRating} — $${(payout / 100).toFixed(0)} awarded to @${submission.username}`);
      } else {
        toast.success(`Rated ${selectedRating} — Index points only`);
      }
      onClose();
    } catch {
      toast.error('Rating failed');
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl w-full max-w-md p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-lg text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" /> Rate Submission
        </h3>

        {/* Submission info */}
        <div className="bg-surface-1 border border-border/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {submission.avatar_url ? (
                <img src={submission.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold">{submission.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="text-sm font-semibold text-foreground">@{submission.username}</span>
          </div>
          <button
            onClick={() => window.open(submission.submission_url, '_blank', 'noopener,noreferrer')}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" /> Watch Edit
          </button>
          {submission.message && (
            <p className="text-xs text-muted-foreground mt-2 italic">"{submission.message}"</p>
          )}
        </div>

        {/* Rating grid */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
            Rating
          </label>
          <div className="grid grid-cols-6 gap-2">
            {RATINGS.map(r => {
              const payout = RATING_PAYOUTS[r];
              const isSelected = selectedRating === r;
              return (
                <motion.button
                  key={r}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedRating(r)}
                  className={`flex flex-col items-center py-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? RATING_COLORS[r] + ' ring-2 ring-offset-1 ring-offset-background'
                      : 'border-border/30 bg-surface-1 hover:border-border/60'
                  }`}
                >
                  <span className={`text-xl font-black ${isSelected ? '' : 'text-foreground'}`}>{r}</span>
                  {payout > 0 ? (
                    <span className="text-[9px] font-bold text-emerald-400 mt-0.5">${payout / 100}</span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground mt-0.5">IDX</span>
                  )}
                </motion.button>
              );
            })}
          </div>
          {selectedRating && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-center"
            >
              {RATING_PAYOUTS[selectedRating] > 0 ? (
                <p className="text-sm text-emerald-400 font-bold">
                  <DollarSign className="w-3.5 h-3.5 inline" />
                  {(RATING_PAYOUTS[selectedRating] / 100).toFixed(0)} will be added to @{submission.username}'s balance
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Index points only — no cash payout</p>
              )}
            </motion.div>
          )}
        </div>

        {/* Feedback */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Feedback (optional)
          </label>
          <Textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Quick note on the edit..."
            className="min-h-[60px] resize-none"
          />
        </div>

        <Button
          onClick={handleRate}
          disabled={submitting || !selectedRating}
          className="w-full bg-amber-500 hover:bg-amber-400 text-background font-bold text-base py-5"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <>
              <Star className="w-4 h-4 mr-2" />
              Confirm {selectedRating || '...'} Rating
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}

function RatingBadge({ rating, earnedCents }: { rating: string; earnedCents: number }) {
  const colors = RATING_COLORS[rating as SubmissionRating] || 'text-muted-foreground bg-muted/30 border-border/30';
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-black ${colors}`}>
      <span className="text-base">{rating}</span>
      {earnedCents > 0 && (
        <span className="text-emerald-400 font-bold text-[10px]">+${earnedCents / 100}</span>
      )}
    </div>
  );
}

export default function CommissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { commission, submissions, loading, submitEdit, rateSubmission } = useCommissionDetail(id);
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;
  const [reviewingSubmission, setReviewingSubmission] = useState<any>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Commission not found</p>
        <Link to="/hub" className="text-emerald-400 text-sm hover:underline">← Back to Hub</Link>
      </div>
    );
  }

  const payoutMap = commission.custom_payouts as Record<string, number> | null;
  const getPayoutForRating = (r: SubmissionRating) => payoutMap ? (payoutMap[r] ?? RATING_PAYOUTS[r]) : RATING_PAYOUTS[r];
  const payout = (commission.payout_cents / 100).toFixed(0);
  const slotsLeft = commission.max_slots - commission.accepted_count;
  const isOpen = commission.status === 'open' && slotsLeft > 0 && (!commission.deadline || new Date(commission.deadline) > new Date());
  const mySubmission = submissions.find(s => s.user_id === user?.id);
  const canSubmit = isOpen && !mySubmission && !!user;

  const totalPaidOut = submissions.reduce((acc, s) => acc + (s.earned_cents || 0), 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-950/40 to-background border-b border-emerald-500/10 px-4 pt-4 pb-5">
        <Link to="/commissions" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 ${
                isOpen ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-muted/50 text-muted-foreground'
              }`}>
                {isOpen ? 'Open' : commission.status === 'filled' ? 'Filled' : 'Closed'}
              </span>
              {commission.campaign_id && (
                <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Campaign
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl text-foreground leading-tight">{commission.title}</h1>
            {commission.artist_name && (
              <p className="text-sm text-muted-foreground mt-1">
                {commission.artist_name}{commission.song_name ? ` · ${commission.song_name}` : ''}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="font-display text-2xl text-emerald-400">{payout}</span>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{slotsLeft > 0 ? `${slotsLeft}/${commission.max_slots} slots available` : 'All slots filled'}</span>
          </div>
          {commission.deadline && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDistanceToNow(new Date(commission.deadline), { addSuffix: true })}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
          </div>
          {totalPaidOut > 0 && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
              <span>${(totalPaidOut / 100).toFixed(0)} paid out</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Payout tiers info */}
        <div className="bg-surface-1/60 border border-amber-500/10 p-3 rounded-lg">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">
            💰 Payout Tiers {payoutMap ? '(Custom)' : ''}
          </p>
          <div className="flex gap-2 flex-wrap">
            {RATINGS.map(r => {
              const p = getPayoutForRating(r);
              return (
                <div key={r} className={`px-2 py-1 rounded border text-[10px] font-bold ${RATING_COLORS[r]}`}>
                  {r}{p > 0 ? ` = $${p / 100}` : ' = IDX'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Description */}
        {commission.description && (
          <div className="bg-surface-1/60 border border-border/30 p-4 rounded-lg">
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{commission.description}</p>
          </div>
        )}

        {/* Submit Form — for editors */}
        {canSubmit && (
          <SubmitForm
            onSubmit={async (url, platform, message) => {
              await submitEdit({ submission_url: url, platform, message: message || undefined });
            }}
            disabled={false}
          />
        )}

        {/* User's own submission status */}
        {mySubmission && (
          <div className={`border p-4 rounded-lg ${
            mySubmission.status === 'accepted' ? 'bg-emerald-950/20 border-emerald-500/30' :
            mySubmission.status === 'declined' ? 'bg-red-950/20 border-red-500/30' :
            'bg-surface-1 border-border/50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {mySubmission.rating ? (
                <RatingBadge rating={mySubmission.rating} earnedCents={mySubmission.earned_cents} />
              ) : mySubmission.status === 'accepted' ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-sm font-bold text-emerald-400">Accepted!</span></>
              ) : mySubmission.status === 'declined' ? (
                <><XCircle className="w-4 h-4 text-red-400" /><span className="text-sm font-bold text-red-400">Declined</span></>
              ) : (
                <><Clock className="w-4 h-4 text-amber-400" /><span className="text-sm font-bold text-amber-400">Pending Review</span></>
              )}
            </div>
            {mySubmission.earned_cents > 0 && (
              <p className="text-sm text-emerald-400 font-bold mb-2">
                +${(mySubmission.earned_cents / 100).toFixed(0)} added to your balance 🎉
              </p>
            )}
            <button
              onClick={() => window.open(mySubmission.submission_url, '_blank', 'noopener,noreferrer')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> Your submission
            </button>
            {mySubmission.feedback && (
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Feedback</p>
                <p className="text-sm text-foreground/80 italic">"{mySubmission.feedback}"</p>
              </div>
            )}
          </div>
        )}

        {/* Submissions list — admin only */}
        {isStaff && submissions.length > 0 && (
          <div>
            <h3 className="font-display text-sm text-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Submissions ({submissions.length})
            </h3>
            <div className="space-y-2">
              {submissions.map(sub => (
                <div key={sub.id} className={`bg-surface-1 border rounded-lg p-3 ${
                  sub.status === 'accepted' ? 'border-emerald-500/30' :
                  sub.status === 'declined' ? 'border-red-500/30 opacity-60' : 'border-border/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {sub.avatar_url ? (
                          <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{sub.username?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">@{sub.username}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(sub.submission_url, '_blank', 'noopener,noreferrer')}
                            className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> View
                          </button>
                          {sub.platform && <span className="text-[9px] text-muted-foreground capitalize">{sub.platform}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub.status === 'pending' ? (
                        <Button
                          size="sm"
                          onClick={() => setReviewingSubmission(sub)}
                          className="bg-amber-500 hover:bg-amber-400 text-background text-xs h-8 font-bold"
                        >
                          <Star className="w-3.5 h-3.5 mr-1" /> Rate
                        </Button>
                      ) : sub.rating ? (
                        <RatingBadge rating={sub.rating} earnedCents={sub.earned_cents} />
                      ) : (
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                          sub.status === 'accepted' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                        }`}>
                          {sub.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {sub.message && (
                    <p className="text-xs text-muted-foreground mt-2 italic">"{sub.message}"</p>
                  )}
                  {sub.feedback && (
                    <div className="mt-2 pt-2 border-t border-border/20">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Your feedback:</p>
                      <p className="text-xs text-foreground/80">"{sub.feedback}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Non-staff: show rated submissions */}
        {!isStaff && submissions.filter(s => s.status === 'accepted' || s.rating).length > 0 && (
          <div>
            <h3 className="font-display text-sm text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Rated Edits
            </h3>
            <div className="space-y-2">
              {submissions.filter(s => s.status === 'accepted' || s.rating).map(sub => (
                <div key={sub.id} className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {sub.avatar_url ? (
                      <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{sub.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground">@{sub.username}</span>
                    <button
                      onClick={() => window.open(sub.submission_url, '_blank', 'noopener,noreferrer')}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-2.5 h-2.5" /> Watch Edit
                    </button>
                  </div>
                  {sub.rating ? (
                    <RatingBadge rating={sub.rating} earnedCents={sub.earned_cents} />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {reviewingSubmission && (
          <RatingModal
            submission={reviewingSubmission}
            onRate={rateSubmission}
            onClose={() => setReviewingSubmission(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
