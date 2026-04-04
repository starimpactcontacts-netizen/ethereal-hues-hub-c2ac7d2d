import { useState } from "react";
import { 
  Gavel, Star, Trophy, MessageCircle, CheckCircle, 
  ExternalLink, Loader2, Crown, ChevronDown, ChevronUp, Play, Users
} from "lucide-react";
import { HostedCompetitionSubmission, HostedCompetitionJudge } from "@/hooks/useHostedCompetitions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HostedCompHostDashboardProps {
  competitionId: string;
  submissions: HostedCompetitionSubmission[];
  judges: HostedCompetitionJudge[];
  onInviteJudges: () => void;
  onRefresh: () => void;
  competitionStatus?: string;
  participantCount?: number;
}

function ScoringRow({ 
  submission, 
  onScore,
  onMarkWinner
}: { 
  submission: HostedCompetitionSubmission;
  onScore: (id: string, score: number, notes?: string) => Promise<boolean>;
  onMarkWinner: (id: string, place: number | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [score, setScore] = useState(submission.score?.toString() || "");
  const [creativityScore, setCreativityScore] = useState(submission.creativity_score?.toString() || "");
  const [qualityScore, setQualityScore] = useState(submission.quality_score?.toString() || "");
  const [impactScore, setImpactScore] = useState(submission.impact_score?.toString() || "");
  const [notes, setNotes] = useState(submission.judge_notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Calculate total score from components if provided
    let finalScore = parseInt(score);
    if (!score && (creativityScore || qualityScore || impactScore)) {
      const c = parseInt(creativityScore) || 0;
      const q = parseInt(qualityScore) || 0;
      const i = parseInt(impactScore) || 0;
      finalScore = Math.round((c + q + i) / 3);
    }

    if (isNaN(finalScore) || finalScore < 0 || finalScore > 100) {
      toast.error("Score must be 0-100");
      return;
    }

    setIsSaving(true);
    const success = await onScore(submission.id, finalScore, notes || undefined);
    setIsSaving(false);

    if (success) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="bg-surface-1 border border-border rounded-lg overflow-hidden">
      <div className="p-3 flex items-center gap-3">
        {/* Status */}
        <div className={`w-2 h-2 rounded-full ${
          submission.score !== null ? 'bg-emerald-500' : 'bg-amber-500'
        }`} />

        {/* User */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-surface-2 overflow-hidden">
            {submission.avatar_url ? (
              <img src={submission.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs">
                {submission.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{submission.username}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{submission.platform}</p>
          </div>
        </div>

        {/* Winner Badge */}
        {submission.is_winner && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-gold/20 rounded-full">
            <Crown className="w-3 h-3 text-gold" />
            <span className="text-[10px] text-gold font-bold">#{submission.winner_place}</span>
          </div>
        )}

        {/* Score */}
        {submission.score !== null && (
          <div className="text-right">
            <p className="text-lg font-bold text-cyan-400">{submission.score}</p>
          </div>
        )}

        {/* Watch */}
        <a 
          href={submission.submission_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 hover:bg-surface-2 rounded-lg"
        >
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>

        {/* Expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-surface-2 rounded-lg"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-cyan-400" />
          ) : (
            <Star className="w-4 h-4 text-cyan-400" />
          )}
        </button>
      </div>

      {/* Scoring Panel */}
      {isExpanded && (
        <div className="p-4 border-t border-border bg-surface-2 space-y-4">
          {/* Quick Score */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">
              Overall Score (0-100)
            </label>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              min={0}
              max={100}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              placeholder="Enter overall score..."
            />
          </div>

          {/* Detailed Scoring (optional) */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Detailed Scoring (optional)
            </summary>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <label className="text-[9px] uppercase text-muted-foreground">Creativity</label>
                <input
                  type="number"
                  value={creativityScore}
                  onChange={(e) => setCreativityScore(e.target.value)}
                  min={0}
                  max={100}
                  className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase text-muted-foreground">Quality</label>
                <input
                  type="number"
                  value={qualityScore}
                  onChange={(e) => setQualityScore(e.target.value)}
                  min={0}
                  max={100}
                  className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase text-muted-foreground">Impact</label>
                <input
                  type="number"
                  value={impactScore}
                  onChange={(e) => setImpactScore(e.target.value)}
                  min={0}
                  max={100}
                  className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          </details>

          {/* Notes */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">
              Judge Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none"
              placeholder="Feedback for the editor..."
            />
          </div>

          {/* Winner Selection */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-muted-foreground">Mark as Winner:</span>
            {[1, 2, 3].map((place) => (
              <button
                key={place}
                onClick={() => onMarkWinner(submission.id, submission.winner_place === place ? null : place)}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  submission.winner_place === place
                    ? 'bg-gold text-background'
                    : 'bg-surface-1 text-muted-foreground hover:bg-gold/20'
                }`}
              >
                #{place}
              </button>
            ))}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2.5 bg-cyan-500 text-background font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Score
          </button>
        </div>
      )}
    </div>
  );
}

export default function HostedCompHostDashboard({ 
  competitionId,
  submissions, 
  judges,
  onInviteJudges,
  onRefresh,
  competitionStatus,
  participantCount = 0
}: HostedCompHostDashboardProps) {
  const [isStarting, setIsStarting] = useState(false);
  const scoredCount = submissions.filter(s => s.score !== null).length;
  const pendingCount = submissions.length - scoredCount;
  const isLobby = competitionStatus === 'lobby';
  const canStart = isLobby && participantCount >= 2;

  const handleStartCompetition = async () => {
    if (!canStart) return;
    setIsStarting(true);
    try {
      const { error } = await supabase
        .from('hosted_competitions')
        .update({
          status: 'live',
          submission_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', competitionId);
      if (error) throw error;
      toast.success("🚀 Competition is LIVE! Editors can now submit.");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to start");
    } finally {
      setIsStarting(false);
    }
  };

  const handleScore = async (submissionId: string, score: number, notes?: string): Promise<boolean> => {
    const { error } = await supabase
      .from('hosted_competition_submissions')
      .update({
        score,
        judge_notes: notes,
        scored_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) {
      toast.error(error.message);
      return false;
    }

    toast.success("Score saved!");
    onRefresh();
    return true;
  };

  const handleMarkWinner = async (submissionId: string, place: number | null) => {
    // If setting a winner, first clear any existing winner at that place
    if (place) {
      await supabase
        .from('hosted_competition_submissions')
        .update({ is_winner: false, winner_place: null })
        .eq('competition_id', competitionId)
        .eq('winner_place', place);
    }

    // Update the submission
    const { error } = await supabase
      .from('hosted_competition_submissions')
      .update({
        is_winner: place !== null,
        winner_place: place
      })
      .eq('id', submissionId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(place ? `Marked as #${place} winner!` : "Removed from winners");
      onRefresh();
    }
  };

  return (
    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-cyan-300">Host Dashboard</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400">{scoredCount} scored</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-amber-400">{pendingCount} pending</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onInviteJudges}
            className="py-2.5 bg-surface-1 border border-border rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-surface-2 transition-colors"
          >
            <Gavel className="w-4 h-4 text-cyan-400" />
            Invite Judges
          </button>
          <button
            onClick={() => {
              // TODO: Implement message all
              toast.info("Messaging feature coming soon!");
            }}
            className="py-2.5 bg-surface-1 border border-border rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-surface-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-cyan-400" />
            Message All
          </button>
        </div>

        {/* Judges */}
        {judges.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] uppercase text-muted-foreground">Judges:</span>
            <div className="flex -space-x-2">
              {judges.filter(j => j.status === 'accepted').map((j) => (
                <div key={j.id} className="w-6 h-6 rounded-full bg-surface-2 border-2 border-background overflow-hidden">
                  {j.avatar_url ? (
                    <img src={j.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px]">
                      {j.username.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submissions List */}
      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {submissions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No submissions yet
          </p>
        ) : (
          submissions.map((sub) => (
            <ScoringRow
              key={sub.id}
              submission={sub}
              onScore={handleScore}
              onMarkWinner={handleMarkWinner}
            />
          ))
        )}
      </div>

      {/* Publish Winners Button */}
      {submissions.some(s => s.is_winner) && (
        <div className="p-4 border-t border-cyan-500/20">
          <button
            onClick={() => {
              toast.success("Winners published! The leaderboard now displays the results.");
            }}
            className="w-full py-3 bg-gold text-background font-bold rounded-lg flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            Publish Final Results
          </button>
        </div>
      )}
    </div>
  );
}
