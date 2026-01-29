import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Globe, Calendar, Trophy, ExternalLink, 
  Loader2, ChevronDown, ChevronUp,
  Clock, Send, ArrowLeft, ScrollText, Share2, Shield, Copy, Check, UserPlus
} from "lucide-react";
import { useHostedCompetition } from "@/hooks/useHostedCompetitions";
import InviteJudgeModal from "@/components/loopgate/InviteJudgeModal";
import HostedCompChat from "@/components/loopgate/HostedCompChat";
import HostedCompJoinButton from "@/components/loopgate/HostedCompJoinButton";
import HostedCompActivitySignals from "@/components/loopgate/HostedCompActivitySignals";
import HostedCompLeaderboard from "@/components/loopgate/HostedCompLeaderboard";
import HostedCompHostDashboard from "@/components/loopgate/HostedCompHostDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/hooks/useGuestMode";
import { isPast, format } from "date-fns";
import { validatePlatformUrl, getPlatformUrlPlaceholder, type PlatformType } from "@/lib/urlValidation";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CrewData {
  id: string;
  name: string;
  avatar_url: string | null;
  emblem: string;
}

export default function HostedCompDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isGuest } = useGuestMode();
  const { 
    competition, submissions, judges, participants, loading, 
    isHost, isJudge, hasSubmitted, hasJoined,
    submitEntry, refetch
  } = useHostedCompetition(id);

  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>("tiktok");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInviteJudges, setShowInviteJudges] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [hostCrew, setHostCrew] = useState<CrewData | null>(null);
  const [copied, setCopied] = useState(false);

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
  const isJudging = competition.status === 'judging' || (competition.status === 'live' && deadlinePassed);
  const isCompleted = competition.status === 'completed';

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

  // Fetch host crew data
  useEffect(() => {
    if (competition?.host_crew_id) {
      supabase
        .from('crews')
        .select('id, name, avatar_url, emblem')
        .eq('id', competition.host_crew_id)
        .single()
        .then(({ data }) => {
          if (data) setHostCrew(data);
        });
    }
  }, [competition?.host_crew_id]);

  const handleShare = async () => {
    const url = `${window.location.origin}/hosted-comp/${competition?.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: competition?.name,
          text: `Join "${competition?.name}" on Loopgate!`,
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // User cancelled share
    }
  };

  return (
    <div className="pb-20">
      {/* Back Button + Share */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/hosted-comps')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hosted Comps
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface-1 border border-border rounded-lg text-sm hover:bg-surface-2 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Header */}
      <div className="relative mt-4">
        {/* Poster/Banner */}
        <div className="h-40 bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-transparent relative overflow-hidden">
          {competition.poster_url && (
            <img src={competition.poster_url} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
              isCompleted ? 'bg-zinc-500/80 text-white' :
              isJudging ? 'bg-amber-500/80 text-background animate-pulse' :
              'bg-emerald-500/80 text-background'
            }`}>
              {isCompleted ? 'Completed' : isJudging ? '⚡ Judging' : '🔴 Live'}
            </div>
          </div>
        </div>

        {/* Host Info - with Crew if available */}
        <div className="px-4 -mt-10 relative">
          <div className="flex items-end gap-3">
            {hostCrew ? (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 border-4 border-background flex items-center justify-center overflow-hidden shadow-lg shadow-cyan-500/20">
                {hostCrew.avatar_url ? (
                  <img src={hostCrew.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-8 h-8 text-background" />
                )}
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 border-4 border-background flex items-center justify-center overflow-hidden shadow-lg shadow-cyan-500/20">
                {competition.host_avatar_url ? (
                  <img src={competition.host_avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Globe className="w-8 h-8 text-background" />
                )}
              </div>
            )}
            <div className="pb-2">
              <p className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider">
                {hostCrew ? 'Hosted by Crew' : 'Hosted by'}
              </p>
              <p className="text-xl font-display">{hostCrew ? hostCrew.name : competition.host_name}</p>
              {hostCrew && (
                <p className="text-[10px] text-muted-foreground">by {competition.host_name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-5">
        {/* Title */}
        <h1 className="font-display text-2xl tracking-wide">{competition.name}</h1>

        {/* Description */}
        {competition.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{competition.description}</p>
        )}

        {/* Prize & Deadline Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-gold/10 to-amber-500/5 border border-gold/30 rounded-lg p-4 text-center">
            <Trophy className="w-5 h-5 text-gold mx-auto mb-2" />
            <p className="text-sm font-bold text-gold">{competition.prize_description || 'Glory'}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Prize</p>
          </div>
          <div className="bg-surface-1 border border-border rounded-lg p-4 text-center">
            <Calendar className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
            <p className="text-sm font-bold">{format(new Date(competition.submission_deadline), 'MMM d, h:mm a')}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Deadline</p>
          </div>
        </div>

        {/* Rules (Collapsible) */}
        {competition.rules && (
          <div className="bg-surface-1 border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowRules(!showRules)}
              className="w-full p-3 flex items-center justify-between hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold">Competition Rules</span>
              </div>
              {showRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showRules && (
              <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-wrap">
                {competition.rules}
              </div>
            )}
          </div>
        )}

        {/* PROMINENT JOIN CTA - Shows first for non-participants */}
        {competition.status === 'live' && !deadlinePassed && !hasJoined && !hasSubmitted && (
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-2 border-emerald-500/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  Join This Competition
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {participants.length} {participants.length === 1 ? 'editor' : 'editors'} preparing entries
                </p>
              </div>
            </div>
            
            {user ? (
              <HostedCompJoinButton
                competitionId={competition.id}
                status={competition.status}
                deadlinePassed={deadlinePassed}
                onJoin={refetch}
              />
            ) : (
              <motion.button
                onClick={() => navigate('/start')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-background font-bold rounded-lg flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Sign Up to Join
              </motion.button>
            )}
          </div>
        )}

        {/* Already Joined - show submit button */}
        {hasJoined && !hasSubmitted && competition.status === 'live' && !deadlinePassed && (
          <div className="space-y-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">You've joined!</span>
            </div>
            
            {!showSubmitForm && (
              <motion.button
                onClick={() => setShowSubmitForm(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-sky-500 text-background font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Send className="w-5 h-5" />
                Submit Your Edit
              </motion.button>
            )}
          </div>
        )}

        {/* Already Submitted */}
        {hasSubmitted && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
            <p className="text-sm text-emerald-400 font-medium">✓ Your entry has been submitted!</p>
            <p className="text-[11px] text-muted-foreground mt-1">Good luck! Results will be announced after judging.</p>
          </div>
        )}

        {/* Activity Signals - moved after CTA */}
        <HostedCompActivitySignals
          competitionId={competition.id}
          viewCount={competition.view_count || 0}
          participantCount={participants.length}
          submissionCount={submissions.length}
          deadline={competition.submission_deadline}
          isTrending={competition.is_trending}
          communityUrl={competition.community_url}
        />

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
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase ${
                      platform === p
                        ? "bg-cyan-500 text-background"
                        : "bg-surface-2 border border-border text-muted-foreground hover:bg-surface-1"
                    }`}
                  >
                    {p === "tiktok" ? "TikTok" : p === "instagram" ? "IG Reels" : "YouTube"}
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

        {/* Guest prompt removed - now handled in the prominent CTA above */}

        {/* Host Dashboard */}
        {isHost && (
          <HostedCompHostDashboard
            competitionId={competition.id}
            submissions={submissions}
            judges={judges}
            onInviteJudges={() => setShowInviteJudges(true)}
            onRefresh={refetch}
          />
        )}

        {/* Competition Chat */}
        <HostedCompChat 
          competitionId={competition.id} 
          competitionName={competition.name} 
        />

        {/* Leaderboard */}
        <HostedCompLeaderboard
          submissions={submissions}
          isJudging={isJudging}
          isCompleted={isCompleted}
        />
      </div>

      {/* Invite Judges Modal */}
      <InviteJudgeModal
        open={showInviteJudges}
        onOpenChange={setShowInviteJudges}
        competitionId={competition.id}
        competitionName={competition.name}
        hostUserId={competition.host_user_id}
        existingJudgeIds={judges.map(j => j.user_id)}
        onInvited={refetch}
      />
    </div>
  );
}
