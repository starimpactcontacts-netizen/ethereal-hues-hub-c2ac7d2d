import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Globe, Users, Calendar, Trophy, ExternalLink, 
  Loader2, ChevronDown, ChevronUp, Star, UserPlus,
  Clock, Award, Send, ArrowLeft, MessageCircle, Gavel
} from "lucide-react";
import { useHostedCompetition, HostedCompetitionSubmission } from "@/hooks/useHostedCompetitions";
import InviteJudgeModal from "@/components/loopgate/InviteJudgeModal";
import HostedCompChat from "@/components/loopgate/HostedCompChat";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/hooks/useGuestMode";
import { formatDistanceToNow, isPast, format } from "date-fns";
import { validatePlatformUrl, getPlatformUrlPlaceholder, type PlatformType } from "@/lib/urlValidation";
import { toast } from "sonner";

function SubmissionCard({ 
  submission, 
  rank, 
  canScore, 
  onScore 
}: { 
  submission: HostedCompetitionSubmission; 
  rank: number;
  canScore: boolean;
  onScore: (id: string, score: number, notes?: string) => void;
}) {
  const [showScoring, setShowScoring] = useState(false);
  const [score, setScore] = useState(submission.score?.toString() || "");
  const [notes, setNotes] = useState(submission.judge_notes || "");

  const handleSave = () => {
    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error("Score must be 0-100");
      return;
    }
    onScore(submission.id, scoreNum, notes || undefined);
    setShowScoring(false);
  };

  return (
    <div className="bg-surface-1 border border-border rounded-lg overflow-hidden">
      <div className="p-3 flex items-center gap-3">
        {/* Rank */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          rank === 1 ? 'bg-gold/20 text-gold' :
          rank === 2 ? 'bg-zinc-300/20 text-zinc-300' :
          rank === 3 ? 'bg-amber-600/20 text-amber-600' :
          'bg-surface-2 text-muted-foreground'
        }`}>
          {rank}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-surface-2 overflow-hidden">
            {submission.avatar_url ? (
              <img src={submission.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                {submission.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{submission.username}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{submission.platform}</p>
          </div>
        </div>

        {/* Score */}
        {submission.score !== null && (
          <div className="text-right">
            <p className="text-lg font-bold text-cyan-400">{submission.score}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Score</p>
          </div>
        )}

        {/* Link */}
        <a 
          href={submission.submission_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 hover:bg-surface-2 rounded-lg"
        >
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>

        {/* Score Button */}
        {canScore && (
          <button
            onClick={() => setShowScoring(!showScoring)}
            className="p-2 hover:bg-cyan-500/20 rounded-lg"
          >
            {showScoring ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <Star className="w-4 h-4 text-cyan-400" />}
          </button>
        )}
      </div>

      {/* Scoring Panel */}
      {showScoring && canScore && (
        <div className="p-3 border-t border-border bg-surface-2 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Score (0-100)</label>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              min={0}
              max={100}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mt-1 min-h-[60px] resize-none"
              placeholder="Feedback for the editor..."
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-2 bg-cyan-500 text-background font-bold rounded-lg text-sm"
          >
            Save Score
          </button>
        </div>
      )}

      {/* Judge Notes Display */}
      {submission.judge_notes && !showScoring && (
        <div className="px-3 pb-3">
          <p className="text-[11px] text-muted-foreground italic">"{submission.judge_notes}"</p>
        </div>
      )}
    </div>
  );
}

export default function HostedCompDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isGuest } = useGuestMode();
  const { 
    competition, submissions, judges, loading, 
    isHost, isJudge, hasSubmitted,
    submitEntry, scoreSubmission
  } = useHostedCompetition(id);

  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>("tiktok");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInviteJudges, setShowInviteJudges] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="p-4">
        <button
          onClick={() => navigate('/hosted-comps')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-cyan-500/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Competition not found</p>
        </div>
      </div>
    );
  }

  const deadlinePassed = isPast(new Date(competition.submission_deadline));
  const canSubmit = competition.status === 'live' && !deadlinePassed && !hasSubmitted;
  const canScore = isHost || isJudge;

  // Sort submissions by score (scored first, then by score desc)
  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (a.score !== null && b.score === null) return -1;
    if (a.score === null && b.score !== null) return 1;
    if (a.score !== null && b.score !== null) return b.score - a.score;
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validatePlatformUrl(platform, submissionUrl);
    if (!validation.valid) {
      setUrlError(validation.error || "Invalid URL");
      return;
    }
    setUrlError("");

    setIsSubmitting(true);
    const success = await submitEntry(platform, submissionUrl);
    setIsSubmitting(false);

    if (success) {
      setShowSubmitForm(false);
      setSubmissionUrl("");
    }
  };

  return (
    <div className="pb-20">
      
      <div className="pb-20">
        {/* Back Button */}
        <div className="px-4 pt-4">
          <button
            onClick={() => navigate('/hosted-comps')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Hosted Comps
          </button>
        </div>

        {/* Header */}
        <div className="relative mt-4">
          {/* Poster/Banner */}
          <div className="h-32 bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-transparent">
            {competition.poster_url && (
              <img src={competition.poster_url} alt="" className="w-full h-full object-cover opacity-50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>

          {/* Host Info */}
          <div className="px-4 -mt-8 relative">
            <div className="flex items-end gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 border-4 border-background flex items-center justify-center overflow-hidden">
                {competition.host_avatar_url ? (
                  <img src={competition.host_avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Globe className="w-7 h-7 text-background" />
                )}
              </div>
              <div className="pb-1">
                <p className="text-xs text-cyan-400 font-medium">Hosted by</p>
                <p className="text-lg font-display">{competition.host_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title & Status */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-xl">{competition.name}</h1>
            <div className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded ${
              competition.status === 'completed' ? 'bg-zinc-500/20 text-zinc-400' :
              competition.status === 'judging' || deadlinePassed ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {competition.status === 'completed' ? 'Completed' :
               competition.status === 'judging' || deadlinePassed ? 'Judging' : 'Live'}
            </div>
          </div>

          {/* Description */}
          {competition.description && (
            <p className="text-sm text-muted-foreground">{competition.description}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
              <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <p className="text-lg font-bold">{submissions.length}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Entries</p>
            </div>
            <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
              <Calendar className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <p className="text-xs font-medium">{format(new Date(competition.submission_deadline), 'MMM d')}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Deadline</p>
            </div>
            <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
              <Trophy className="w-4 h-4 text-gold mx-auto mb-1" />
              <p className="text-xs font-medium truncate">{competition.prize_description || 'Glory'}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Prize</p>
            </div>
          </div>

          {/* Submit Button */}
          {canSubmit && user && !showSubmitForm && (
            <motion.button
              onClick={() => setShowSubmitForm(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-sky-500 text-background font-bold rounded-lg flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Submit Your Edit
            </motion.button>
          )}

          {/* Already Submitted */}
          {hasSubmitted && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
              <p className="text-sm text-emerald-400 font-medium">✓ You've submitted!</p>
            </div>
          )}

          {/* Submit Form */}
          {showSubmitForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleSubmit}
              className="bg-surface-1 border border-cyan-500/30 rounded-lg p-4 space-y-4"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                Submit Entry
              </h3>

              {/* Platform */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">Platform</label>
                <div className="flex gap-2">
                  {(["tiktok", "instagram", "youtube"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPlatform(p);
                        setUrlError("");
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase ${
                        platform === p
                          ? "bg-cyan-500 text-background"
                          : "bg-surface-2 border border-border text-muted-foreground"
                      }`}
                    >
                      {p === "tiktok" ? "TikTok" : p === "instagram" ? "IG" : "YT"}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">Edit Link</label>
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => {
                    setSubmissionUrl(e.target.value);
                    setUrlError("");
                  }}
                  placeholder={getPlatformUrlPlaceholder(platform)}
                  className={`w-full bg-background border rounded-lg px-4 py-3 text-sm ${
                    urlError ? "border-destructive" : "border-border"
                  }`}
                  required
                />
                {urlError && <p className="text-destructive text-xs mt-1">{urlError}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitForm(false)}
                  className="flex-1 py-3 bg-surface-2 text-foreground font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !submissionUrl}
                  className="flex-1 py-3 bg-cyan-500 text-background font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit
                </button>
              </div>
            </motion.form>
          )}

          {/* Guest Prompt */}
          {isGuest && canSubmit && (
            <button
              onClick={() => navigate('/auth')}
              className="w-full py-4 bg-surface-1 border border-cyan-500/30 text-foreground font-medium rounded-lg"
            >
              Sign in to Submit
            </button>
          )}

          {/* Host Controls */}
          {isHost && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
              <p className="text-xs text-cyan-300 font-medium mb-2">🎯 You're the Host</p>
              <p className="text-[11px] text-muted-foreground">
                Score submissions below. Invite judges to help with the workload.
              </p>
            </div>
          )}

          {/* Judges */}
          {judges.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Judges</h3>
              <div className="flex flex-wrap gap-2">
                {judges.filter(j => j.status === 'accepted').map((judge) => (
                  <div key={judge.id} className="flex items-center gap-2 bg-surface-1 border border-border rounded-full px-3 py-1">
                    <div className="w-5 h-5 rounded-full bg-surface-2 overflow-hidden">
                      {judge.avatar_url && <img src={judge.avatar_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="text-xs">{judge.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Award className="w-3 h-3" />
              Submissions ({submissions.length})
            </h3>

            {sortedSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No submissions yet
              </div>
            ) : (
              <div className="space-y-2">
                {sortedSubmissions.map((sub, idx) => (
                  <SubmissionCard
                    key={sub.id}
                    submission={sub}
                    rank={idx + 1}
                    canScore={canScore}
                    onScore={scoreSubmission}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
