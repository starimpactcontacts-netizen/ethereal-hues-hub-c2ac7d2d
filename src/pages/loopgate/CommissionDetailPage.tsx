import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ArrowLeft, Clock, Users, CheckCircle2, XCircle, Send, ExternalLink, MessageSquare, Loader2 } from 'lucide-react';
import { useCommissionDetail } from '@/hooks/useCommissions';
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

function ReviewModal({ submission, onReview, onClose }: {
  submission: any;
  onReview: (id: string, status: 'accepted' | 'declined', feedback: string) => Promise<void>;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReview = async (status: 'accepted' | 'declined') => {
    if (!feedback.trim()) {
      toast.error('Feedback is required');
      return;
    }
    setSubmitting(true);
    try {
      await onReview(submission.id, status, feedback.trim());
      toast.success(status === 'accepted' ? 'Submission accepted!' : 'Submission declined');
      onClose();
    } catch {
      toast.error('Review failed');
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
        <h3 className="font-display text-lg text-foreground">Review Submission</h3>
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
          <a href={submission.submission_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> View Edit
          </a>
          {submission.message && (
            <p className="text-xs text-muted-foreground mt-2 italic">"{submission.message}"</p>
          )}
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Feedback <span className="text-red-400">*</span>
          </label>
          <Textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Provide feedback on the submission..."
            className="min-h-[80px] resize-none"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleReview('declined')}
            disabled={submitting}
            variant="outline"
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <XCircle className="w-4 h-4 mr-1.5" /> Decline
          </Button>
          <Button
            onClick={() => handleReview('accepted')}
            disabled={submitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Accept
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CommissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { commission, submissions, loading, submitEdit, reviewSubmission } = useCommissionDetail(id);
  const { user, profile } = useAuth();
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

  const payout = (commission.payout_cents / 100).toFixed(0);
  const slotsLeft = commission.max_slots - commission.accepted_count;
  const isOpen = commission.status === 'open' && slotsLeft > 0 && (!commission.deadline || new Date(commission.deadline) > new Date());
  const mySubmission = submissions.find(s => s.user_id === user?.id);
  const canSubmit = isOpen && !mySubmission && !!user;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-950/40 to-background border-b border-emerald-500/10 px-4 pt-4 pb-5">
        <Link to="/hub" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
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
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
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
              {mySubmission.status === 'accepted' ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-sm font-bold text-emerald-400">Accepted!</span></>
              ) : mySubmission.status === 'declined' ? (
                <><XCircle className="w-4 h-4 text-red-400" /><span className="text-sm font-bold text-red-400">Declined</span></>
              ) : (
                <><Clock className="w-4 h-4 text-amber-400" /><span className="text-sm font-bold text-amber-400">Pending Review</span></>
              )}
            </div>
            <a href={mySubmission.submission_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Your submission
            </a>
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
                          <a href={sub.submission_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1">
                            <ExternalLink className="w-2.5 h-2.5" /> View
                          </a>
                          {sub.platform && <span className="text-[9px] text-muted-foreground capitalize">{sub.platform}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub.status === 'pending' ? (
                        <Button
                          size="sm"
                          onClick={() => setReviewingSubmission(sub)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                        >
                          Review
                        </Button>
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

        {/* Non-staff: show accepted submissions */}
        {!isStaff && submissions.filter(s => s.status === 'accepted').length > 0 && (
          <div>
            <h3 className="font-display text-sm text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Accepted Edits
            </h3>
            <div className="space-y-2">
              {submissions.filter(s => s.status === 'accepted').map(sub => (
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
                    <a href={sub.submission_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-2.5 h-2.5" /> Watch Edit
                    </a>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingSubmission && (
          <ReviewModal
            submission={reviewingSubmission}
            onReview={reviewSubmission}
            onClose={() => setReviewingSubmission(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
