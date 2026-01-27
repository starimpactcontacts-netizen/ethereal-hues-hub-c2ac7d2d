import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Swords, Clock, Eye, Trophy, ArrowLeft, Flame, 
  CheckCircle, XCircle, ExternalLink, ThumbsUp, 
  Send, Share2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useBattle, recordBattleView, acceptBattle, submitToBattle, voteOnBattle, getMyVote } from "@/hooks/useBattles";
import { toast } from "sonner";
import CountdownTimer from "@/components/loopgate/CountdownTimer";

function formatViews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function BattleDetailPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { battle, loading } = useBattle(battleId);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  // Record view on mount
  useEffect(() => {
    if (battleId) {
      recordBattleView(battleId, user?.id || null);
    }
  }, [battleId, user?.id]);

  // Fetch my vote
  useEffect(() => {
    if (battleId && user?.id && battle?.status === 'judging') {
      getMyVote(battleId, user.id).then(setMyVote);
    }
  }, [battleId, user?.id, battle?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading battle...</div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Swords className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">Battle not found</p>
        <Button variant="outline" onClick={() => navigate('/arena')}>
          Back to Arena
        </Button>
      </div>
    );
  }

  const isChallenger = user?.id === battle.challenger_id;
  const isOpponent = user?.id === battle.opponent_id;
  const isParticipant = isChallenger || isOpponent;
  const canAccept = battle.status === 'pending' && !battle.opponent_id && user?.id && !isChallenger;
  const canSubmit = battle.status === 'active' && isParticipant && (
    (isChallenger && !battle.challenger_submitted_at) ||
    (isOpponent && !battle.opponent_submitted_at)
  );
  const canVote = battle.status === 'judging' && user?.id && !isParticipant;
  const totalVotes = battle.challenger_votes + battle.opponent_votes;

  const handleAccept = async () => {
    if (!profile) return;
    setAccepting(true);
    const success = await acceptBattle(battle.id, profile.id, profile.username, profile.avatar_url);
    setAccepting(false);
    if (success) {
      toast.success("Battle accepted! Time to edit!");
    } else {
      toast.error("Failed to accept battle");
    }
  };

  const handleSubmit = async () => {
    if (!submissionUrl.trim()) {
      toast.error("Enter a submission URL");
      return;
    }
    
    // Simple platform detection
    let platform = 'other';
    if (submissionUrl.includes('tiktok.com')) platform = 'tiktok';
    else if (submissionUrl.includes('instagram.com')) platform = 'instagram';
    else if (submissionUrl.includes('youtube.com') || submissionUrl.includes('youtu.be')) platform = 'youtube';

    setSubmitting(true);
    const success = await submitToBattle(battle.id, user!.id, isChallenger, submissionUrl, platform);
    setSubmitting(false);
    
    if (success) {
      toast.success("Submission recorded!");
      setSubmissionUrl("");
    } else {
      toast.error("Failed to submit");
    }
  };

  const handleVote = async (votedForId: string) => {
    if (!user?.id || voting) return;
    setVoting(true);
    const success = await voteOnBattle(battle.id, user.id, votedForId);
    setVoting(false);
    if (success) {
      setMyVote(votedForId);
      toast.success("Vote recorded!");
    } else {
      toast.error("Failed to vote");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Battle link copied!");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/arena')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Arena</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Eye className="w-3 h-3" />
              {formatViews(battle.view_count)}
            </span>
            <button onClick={handleShare} className="p-2 hover:bg-surface-1 rounded">
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* UFC Style VS Banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 via-background to-background" />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(45deg, transparent 48%, currentColor 48%, currentColor 52%, transparent 52%)`,
            backgroundSize: '20px 20px',
            color: 'rgb(239 68 68)'
          }}
        />
        
        <div className="relative px-4 py-8">
          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <div className={`px-4 py-1.5 border ${
              battle.status === 'active' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
              battle.status === 'judging' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' :
              battle.status === 'completed' ? 'bg-gold/20 border-gold/50 text-gold' :
              'bg-surface-1 border-border text-muted-foreground'
            }`}>
              <span className="text-xs font-bold uppercase tracking-wider">
                {battle.status === 'active' && <><Flame className="w-3 h-3 inline mr-1 animate-pulse" />LIVE</>}
                {battle.status === 'pending' && 'OPEN CHALLENGE'}
                {battle.status === 'judging' && 'JUDGING'}
                {battle.status === 'completed' && <>DECIDED</>}
              </span>
            </div>
          </div>

          {/* VS Display */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Challenger */}
            <div className="flex-1 flex flex-col items-center text-center">
              <Avatar className={`w-20 h-20 border-4 shadow-lg ${
                battle.winner_id === battle.challenger_id 
                  ? 'border-gold shadow-gold/40' 
                  : 'border-red-500/50 shadow-red-500/20'
              }`}>
                <AvatarImage src={battle.challenger_avatar_url || ''} />
                <AvatarFallback className="bg-red-500/20 text-red-400 text-2xl font-bold">
                  {battle.challenger_username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-display text-foreground mt-2">{battle.challenger_username}</span>
              {battle.challenger_score !== null && (
                <span className="text-lg font-bold text-gold">{battle.challenger_score}</span>
              )}
              {battle.winner_id === battle.challenger_id && (
                <span className="text-[10px] text-gold font-bold uppercase flex items-center gap-1 mt-1">
                  <Trophy className="w-3 h-3" /> Winner
                </span>
              )}
              {battle.challenger_submitted_at && (
                <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 mt-1">
                  <CheckCircle className="w-3 h-3" /> Submitted
                </span>
              )}
            </div>

            {/* VS */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl shadow-red-500/40">
                <Swords className="w-8 h-8 text-white" />
              </div>
              {battle.status === 'active' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 animate-ping" />
              )}
            </div>

            {/* Opponent */}
            <div className="flex-1 flex flex-col items-center text-center">
              {battle.opponent_id ? (
                <>
                  <Avatar className={`w-20 h-20 border-4 shadow-lg ${
                    battle.winner_id === battle.opponent_id 
                      ? 'border-gold shadow-gold/40' 
                      : 'border-red-500/50 shadow-red-500/20'
                  }`}>
                    <AvatarImage src={battle.opponent_avatar_url || ''} />
                    <AvatarFallback className="bg-red-500/20 text-red-400 text-2xl font-bold">
                      {battle.opponent_username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-display text-foreground mt-2">{battle.opponent_username}</span>
                  {battle.opponent_score !== null && (
                    <span className="text-lg font-bold text-gold">{battle.opponent_score}</span>
                  )}
                  {battle.winner_id === battle.opponent_id && (
                    <span className="text-[10px] text-gold font-bold uppercase flex items-center gap-1 mt-1">
                      <Trophy className="w-3 h-3" /> Winner
                    </span>
                  )}
                  {battle.opponent_submitted_at && (
                    <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 mt-1">
                      <CheckCircle className="w-3 h-3" /> Submitted
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full border-4 border-dashed border-red-500/30 flex items-center justify-center bg-surface-1">
                    <span className="text-3xl text-red-400/50">?</span>
                  </div>
                  <span className="text-sm text-muted-foreground mt-2">Awaiting Challenger</span>
                </>
              )}
            </div>
          </div>

          {/* Timer */}
          {battle.status === 'active' && battle.ends_at && (
            <div className="flex justify-center">
              <div className="bg-surface-1 border border-red-500/30 px-6 py-3">
                <CountdownTimer endDate={battle.ends_at} label="Ends" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {/* Stakes Card */}
        <div className="bg-surface-1 border border-border p-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            Battle Stakes
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-xl font-display text-gold">+{battle.winner_index_awarded}</span>
              <span className="text-[9px] text-muted-foreground block uppercase">Winner</span>
            </div>
            <div>
              <span className="text-xl font-display text-red-400">-{battle.loser_index_penalty}</span>
              <span className="text-[9px] text-muted-foreground block uppercase">Loser</span>
            </div>
            <div>
              <span className="text-xl font-display text-foreground">{battle.duration_hours}h</span>
              <span className="text-[9px] text-muted-foreground block uppercase">Duration</span>
            </div>
          </div>
        </div>

        {/* Accept Challenge (for open battles) */}
        {canAccept && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full h-14 bg-gradient-to-r from-red-500 via-red-400 to-red-500 hover:shadow-lg hover:shadow-red-500/30 text-white font-display text-lg uppercase tracking-wider"
            >
              {accepting ? "Accepting..." : (
                <>
                  <Swords className="w-5 h-5 mr-2" />
                  Accept Challenge
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Submission Form (for active battles) */}
        {canSubmit && (
          <div className="bg-surface-1 border border-gold/30 p-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-gold" />
              Submit Your Edit
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="Paste TikTok, IG, or YouTube URL..."
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                className="flex-1 bg-background border-border"
              />
              <Button
                onClick={handleSubmit}
                disabled={submitting || !submissionUrl.trim()}
                className="bg-gold hover:bg-gold/90 text-background"
              >
                {submitting ? "..." : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Submissions Display */}
        {(battle.challenger_submission_url || battle.opponent_submission_url) && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Submissions</h3>
            
            {battle.challenger_submission_url && (
              <a 
                href={battle.challenger_submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-surface-1 border border-border hover:border-red-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 border border-red-500/30">
                    <AvatarImage src={battle.challenger_avatar_url || ''} />
                    <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                      {battle.challenger_username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm text-foreground">{battle.challenger_username}</span>
                    <span className="text-[10px] text-muted-foreground block uppercase">{battle.challenger_submission_platform}</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            )}
            
            {battle.opponent_submission_url && (
              <a 
                href={battle.opponent_submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-surface-1 border border-border hover:border-red-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 border border-red-500/30">
                    <AvatarImage src={battle.opponent_avatar_url || ''} />
                    <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                      {battle.opponent_username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm text-foreground">{battle.opponent_username}</span>
                    <span className="text-[10px] text-muted-foreground block uppercase">{battle.opponent_submission_platform}</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            )}
          </div>
        )}

        {/* Community Voting (for judging phase) */}
        {battle.status === 'judging' && (
          <div className="bg-surface-1 border border-purple-500/30 p-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-purple-400" />
              Community Vote
            </h3>
            
            {/* Vote Bar */}
            {totalVotes > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-foreground font-medium">{battle.challenger_username}</span>
                  <span className="text-foreground font-medium">{battle.opponent_username}</span>
                </div>
                <div className="h-3 bg-surface-2 overflow-hidden flex rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all"
                    style={{ width: `${(battle.challenger_votes / totalVotes) * 100}%` }}
                  />
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all"
                    style={{ width: `${(battle.opponent_votes / totalVotes) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                  <span>{battle.challenger_votes} votes</span>
                  <span>{battle.opponent_votes} votes</span>
                </div>
              </div>
            )}

            {/* Vote Buttons */}
            {canVote && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleVote(battle.challenger_id)}
                  disabled={voting}
                  variant={myVote === battle.challenger_id ? "default" : "outline"}
                  className={myVote === battle.challenger_id ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  {battle.challenger_username}
                </Button>
                <Button
                  onClick={() => handleVote(battle.opponent_id!)}
                  disabled={voting || !battle.opponent_id}
                  variant={myVote === battle.opponent_id ? "default" : "outline"}
                  className={myVote === battle.opponent_id ? "bg-sky-500 hover:bg-sky-600" : ""}
                >
                  {battle.opponent_username}
                </Button>
              </div>
            )}

            {isParticipant && (
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Participants cannot vote
              </p>
            )}
          </div>
        )}

        {/* Winner Announcement */}
        {battle.status === 'completed' && battle.winner_id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gold/20 via-surface-1 to-gold/10 border border-gold/50 p-6 text-center"
          >
            <Trophy className="w-10 h-10 text-gold mx-auto mb-3" />
            <h3 className="text-lg font-display text-gold mb-1">WINNER</h3>
            <span className="text-2xl font-display text-foreground">
              {battle.winner_id === battle.challenger_id ? battle.challenger_username : battle.opponent_username}
            </span>
            <p className="text-[10px] text-muted-foreground mt-2">
              +{battle.winner_index_awarded} Index awarded
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
