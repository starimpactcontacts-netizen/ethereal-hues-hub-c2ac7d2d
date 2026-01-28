import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Trophy, Flame, Star, Users, 
  ChevronRight, Sparkles, Target,
  ArrowLeft, Send, ExternalLink, Gavel
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Input } from '@/components/ui/input';
import LevelBadge from '@/components/loopgate/LevelBadge';
import VerifiedBadge from '@/components/loopgate/VerifiedBadge';
import BottomNav from '@/components/loopgate/BottomNav';
import RequestJudgeReviewModal from '@/components/loopgate/RequestJudgeReviewModal';
import JudgeBadge, { JUDGE_BADGES } from '@/components/loopgate/JudgeBadge';
import JudgeReviewsFeed from '@/components/loopgate/JudgeReviewsFeed';
import JudgeLeaderboardCard from '@/components/loopgate/JudgeLeaderboardCard';
import JudgeLevelBadge from '@/components/loopgate/JudgeLevelBadge';

interface JudgeProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  xp: number;
  verification_status: boolean;
  judge_badge: string | null;
  judge_xp: number;
  judge_level: number;
  totalReviews: number;
  avgScore: number;
  thisWeek: number;
}

// Judge level calculation
function calculateJudgeLevel(xp: number): number {
  if (xp >= 5000) return 10;
  if (xp >= 3500) return 9;
  if (xp >= 2500) return 8;
  if (xp >= 1800) return 7;
  if (xp >= 1200) return 6;
  if (xp >= 800) return 5;
  if (xp >= 500) return 4;
  if (xp >= 250) return 3;
  if (xp >= 100) return 2;
  return 1;
}

function JudgeCard({ judge, onSelect }: { judge: JudgeProfile; onSelect: (judge: JudgeProfile) => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(judge)}
      className="w-full bg-card border border-border hover:border-gold/40 rounded-xl p-3 text-left transition-all group"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {judge.avatar_url ? (
            <img 
              src={judge.avatar_url} 
              alt={judge.username}
              className="w-11 h-11 rounded-full object-cover border border-gold/30 group-hover:border-gold/60 transition-colors"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30">
              <Gavel size={16} className="text-gold" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-medium text-sm truncate">
              {judge.display_name || judge.username}
            </span>
            {judge.verification_status && <VerifiedBadge size="sm" />}
            <JudgeLevelBadge level={judge.judge_level} size="xs" showIcon={false} />
          </div>
          <p className="text-[11px] text-muted-foreground">@{judge.username}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[11px] shrink-0">
          <div className="text-center">
            <div className="font-bold text-gold">{judge.judge_xp}</div>
            <div className="text-muted-foreground text-[9px] uppercase">JXP</div>
          </div>
          <div className="text-center">
            <div className="font-bold">{judge.totalReviews}</div>
            <div className="text-muted-foreground text-[9px] uppercase">Reviews</div>
          </div>
        </div>

        <ChevronRight size={16} className="text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
      </div>
    </motion.button>
  );
}

function JudgePreviewModal({ 
  judge, 
  onClose, 
  onSubmit 
}: { 
  judge: JudgeProfile; 
  onClose: () => void;
  onSubmit: (judgeId: string) => void;
}) {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden pb-6"
      >
        {/* Header with avatar */}
        <div className="relative h-20 bg-gradient-to-b from-gold/20 to-transparent">
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            {judge.avatar_url ? (
              <img 
                src={judge.avatar_url} 
                alt={judge.username}
                className="w-16 h-16 rounded-full object-cover border-4 border-card"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center border-4 border-card">
                <Gavel size={24} className="text-gold" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="pt-10 px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="font-display text-lg">{judge.display_name || judge.username}</h3>
            {judge.verification_status && <VerifiedBadge />}
          </div>
          <p className="text-sm text-muted-foreground mb-2">@{judge.username}</p>
          
          {/* Level + JXP */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <JudgeLevelBadge level={judge.judge_level} size="sm" />
            <span className="text-xs text-muted-foreground">{judge.judge_xp} JXP</span>
          </div>

          {/* Bio */}
          {judge.bio && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{judge.bio}</p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-surface-1 border border-border rounded-lg p-2.5">
              <div className="text-xl font-display text-gold">{judge.totalReviews}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Reviews</div>
            </div>
            <div className="bg-surface-1 border border-border rounded-lg p-2.5">
              <div className="text-xl font-display">{judge.avgScore.toFixed(0)}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Avg Score</div>
            </div>
            <div className="bg-surface-1 border border-border rounded-lg p-2.5">
              <div className="text-xl font-display text-orange-400">{judge.thisWeek}</div>
              <div className="text-[10px] text-muted-foreground uppercase">This Week</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/judge/${judge.username}`)}
              className="flex-1 py-2.5 bg-surface-1 border border-border rounded-lg text-sm font-medium hover:bg-surface-2 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink size={14} />
              Profile
            </button>
            <button
              onClick={() => onSubmit(judge.id)}
              className="flex-1 py-2.5 bg-gold text-black rounded-lg text-sm font-bold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
            >
              <Send size={14} />
              Submit
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function JudgeHubPage() {
  const { user, profile } = useAuth();
  const { isJudge, isDev } = useUserRoles(user?.id);
  const navigate = useNavigate();
  
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedJudge, setSelectedJudge] = useState<JudgeProfile | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [targetJudgeId, setTargetJudgeId] = useState<string | null>(null);

  useEffect(() => {
    fetchJudges();
  }, []);

  async function fetchJudges() {
    setLoading(true);
    try {
      // Get all users with judge role
      const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'judge');

      if (!judgeRoles?.length) {
        setLoading(false);
        return;
      }

      const judgeIds = judgeRoles.map(r => r.user_id);

      // Get judge profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, level, xp, verification_status, judge_badge, judge_xp, judge_review_count')
        .in('id', judgeIds);

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Get review stats for each judge
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: reviews } = await supabase
        .from('review_requests')
        .select('judge_id, total_score, reviewed_at')
        .eq('status', 'reviewed')
        .in('judge_id', judgeIds);

      // Build judge profiles with stats
      const judgesWithStats: JudgeProfile[] = profiles.map(profile => {
        const judgeReviews = (reviews || []).filter(r => r.judge_id === profile.id);
        const weeklyReviews = judgeReviews.filter(r => 
          r.reviewed_at && new Date(r.reviewed_at) >= oneWeekAgo
        );
        const avgScore = judgeReviews.length > 0
          ? judgeReviews.reduce((acc, r) => acc + (r.total_score || 0), 0) / judgeReviews.length
          : 0;

        const judgeXp = (profile as any).judge_xp || 0;

        return {
          ...profile,
          judge_xp: judgeXp,
          judge_level: calculateJudgeLevel(judgeXp),
          totalReviews: judgeReviews.length,
          avgScore,
          thisWeek: weeklyReviews.length,
        };
      });

      // Sort by JXP by default
      judgesWithStats.sort((a, b) => b.judge_xp - a.judge_xp);
      setJudges(judgesWithStats);
    } catch (error) {
      console.error('Error fetching judges:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter judges
  const filteredJudges = judges.filter(j => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return j.username.toLowerCase().includes(query) || 
           (j.display_name?.toLowerCase().includes(query));
  });

  const handleJudgeSelect = (judge: JudgeProfile) => {
    setSelectedJudge(judge);
  };

  const handleSubmitToJudge = (judgeId: string) => {
    setTargetJudgeId(judgeId);
    setSelectedJudge(null);
    setShowSubmitModal(true);
  };

  const handleQuickSubmit = () => {
    setTargetJudgeId(null);
    setShowSubmitModal(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-surface-1 rounded-full transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                <Gavel size={16} className="text-gold" />
              </div>
              <h1 className="font-display text-lg tracking-wide">QOI JUDGES</h1>
            </div>
          </div>
          
          {(isJudge || isDev) && (
            <Link
              to="/judge-panel"
              className="px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-lg text-xs font-medium text-gold hover:bg-gold/20 transition-colors flex items-center gap-1.5"
            >
              <Target size={12} />
              Panel
            </Link>
          )}
        </div>
      </div>

      {/* Request Review CTA */}
      <div className="p-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleQuickSubmit}
          className="w-full py-3.5 bg-gradient-to-r from-gold via-gold to-amber-500 text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-gold/20"
        >
          <Send size={16} />
          Request Judge Review
        </motion.button>
      </div>

      {/* Judge Leaderboard */}
      <div className="px-4 pb-4">
        <JudgeLeaderboardCard limit={5} />
      </div>

      {/* Recent Reviews */}
      <div className="border-t border-border pt-4">
        <JudgeReviewsFeed />
      </div>

      {/* Become a Judge CTA */}
      {!isJudge && (
        <div className="px-4 py-4 border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-surface-1 via-surface-1 to-gold/5 border border-gold/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm mb-0.5">Become a QOI Judge</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  Join the elite. Rate and review the community's best work.
                </p>
              </div>
              <Link
                to="/judges/apply"
                className="shrink-0 px-4 py-2 bg-gold hover:bg-gold/90 text-black rounded-lg text-xs font-bold transition-colors"
              >
                Apply
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* All Judges Section */}
      <div className="px-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-muted-foreground" />
            <h2 className="font-display text-sm tracking-wide">ALL JUDGES</h2>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {filteredJudges.length} judge{filteredJudges.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search judges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-surface-1 border-border text-sm"
          />
        </div>

        {/* Judges List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredJudges.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-3">
                <Gavel className="w-6 h-6 text-gold" />
              </div>
              <p className="font-display text-sm mb-1">NO JUDGES FOUND</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery ? 'Try a different search' : 'Judges coming soon'}
              </p>
            </div>
          ) : (
            filteredJudges.map((judge, index) => (
              <motion.div
                key={judge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <JudgeCard judge={judge} onSelect={handleJudgeSelect} />
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Judge Preview Modal */}
      <AnimatePresence>
        {selectedJudge && (
          <JudgePreviewModal
            judge={selectedJudge}
            onClose={() => setSelectedJudge(null)}
            onSubmit={handleSubmitToJudge}
          />
        )}
      </AnimatePresence>

      {/* Submit Review Modal */}
      <RequestJudgeReviewModal
        isOpen={showSubmitModal}
        onClose={() => {
          setShowSubmitModal(false);
          setTargetJudgeId(null);
        }}
        preselectedJudgeId={targetJudgeId}
      />

      <BottomNav />
    </div>
  );
}
