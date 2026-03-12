import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Send, AlertTriangle, ChevronRight, Gavel, Star, TrendingUp } from 'lucide-react';
import { AuthorityGavel, ScopeTarget, NexusStar, ArrowLink } from '@/components/loopgate/LoopgateIcons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Input } from '@/components/ui/input';
import VerifiedBadge from '@/components/loopgate/VerifiedBadge';
import FeaturedJudgeHero from '@/components/loopgate/FeaturedJudgeHero';
import BottomNav from '@/components/loopgate/BottomNav';
import RequestJudgeReviewModal from '@/components/loopgate/RequestJudgeReviewModal';
import JudgeReviewsFeed from '@/components/loopgate/JudgeReviewsFeed';
import JudgeLeaderboardCard from '@/components/loopgate/JudgeLeaderboardCard';
import JudgeLevelBadge from '@/components/loopgate/JudgeLevelBadge';
import JudgeSpotlight from '@/components/loopgate/JudgeSpotlight';
import JudgeDivisionBadge, { getDivisionFromJxp } from '@/components/loopgate/JudgeDivisionBadge';
import JudgeDivisionsSection from '@/components/loopgate/JudgeDivisionsSection';

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
  roleType: 'judge' | 'trial_judge';
}

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

/* ═══════════════════════════════════════════════════
   ROSTER ENTRY — clean, high-legibility row
   ═══════════════════════════════════════════════════ */
function JudgeRosterEntry({ judge, onSelect, index }: { judge: JudgeProfile; onSelect: (j: JudgeProfile) => void; index: number }) {
  const navigate = useNavigate();
  const isTrial = judge.roleType === 'trial_judge';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015 }}
      onClick={() => isTrial ? onSelect(judge) : navigate(`/judge/${judge.username}`)}
      className="group cursor-pointer"
    >
      <div className="flex items-center gap-3 py-3.5 px-4 transition-colors hover:bg-zinc-900/60 active:bg-zinc-900">
        {/* Rank */}
        <span className="text-[13px] text-zinc-600 font-medium tabular-nums w-6 text-right shrink-0">
          {index + 1}
        </span>

        {/* Avatar */}
        <div className="relative shrink-0">
          {judge.avatar_url ? (
            <img
              src={judge.avatar_url}
              alt={judge.username}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-800 group-hover:ring-zinc-600 transition-all"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ring-1 ${
              isTrial ? 'bg-zinc-900 text-zinc-500 ring-zinc-800' : 'bg-red-950 text-red-400 ring-red-900'
            }`}>
              {judge.username[0]?.toUpperCase()}
            </div>
          )}
          {!isTrial && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center ring-2 ring-black">
              <Gavel size={7} className="text-white" />
            </div>
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-semibold text-white truncate" style={{ letterSpacing: '-0.01em' }}>
              {judge.display_name || judge.username}
            </span>
            {judge.verification_status && <VerifiedBadge size="sm" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[13px] text-zinc-500">@{judge.username}</span>
            {isTrial && (
              <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider rounded-sm">
                Trial
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        {!isTrial && (
          <div className="text-right shrink-0">
            <div className="text-[15px] font-semibold text-white tabular-nums">{judge.totalReviews}</div>
            <div className="text-[11px] text-zinc-500 font-medium">reviews</div>
          </div>
        )}

        <ChevronRight size={16} className="text-zinc-700 shrink-0 group-hover:text-zinc-400 transition-colors" />
      </div>
      <div className="h-px bg-zinc-900 mx-4" />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   JUDGE PREVIEW MODAL
   ═══════════════════════════════════════════════ */
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
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl overflow-hidden"
      >
        {/* Handle bar on mobile */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-4 mb-5">
            {judge.avatar_url ? (
              <img src={judge.avatar_url} alt={judge.username} className="w-14 h-14 rounded-full object-cover ring-2 ring-zinc-800" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-red-950 flex items-center justify-center">
                <AuthorityGavel size={22} className="text-red-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-lg font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>
                  {judge.display_name || judge.username}
                </h3>
                {judge.verification_status && <VerifiedBadge />}
              </div>
              <p className="text-[13px] text-zinc-500">@{judge.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <JudgeLevelBadge level={judge.judge_level} size="sm" />
                <span className="text-[12px] text-zinc-500 tabular-nums">{judge.judge_xp} JXP</span>
              </div>
            </div>
          </div>

          {judge.bio && (
            <p className="text-[14px] text-zinc-400 mb-5 leading-relaxed">{judge.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-zinc-900 rounded-xl p-3 text-center">
              <div className="text-xl font-semibold text-white tabular-nums">{judge.totalReviews}</div>
              <div className="text-[11px] text-zinc-500 font-medium mt-0.5">Reviews</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-3 text-center">
              <div className="text-xl font-semibold text-white tabular-nums">{judge.avgScore.toFixed(0)}</div>
              <div className="text-[11px] text-zinc-500 font-medium mt-0.5">Avg Score</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-3 text-center">
              <div className="text-xl font-semibold text-red-400 tabular-nums">{judge.thisWeek}</div>
              <div className="text-[11px] text-zinc-500 font-medium mt-0.5">This Week</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/judge/${judge.username}`)}
              className="flex-1 py-3 bg-zinc-900 text-[13px] font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors rounded-xl flex items-center justify-center gap-2"
            >
              View Profile
            </button>
            <button
              onClick={() => onSubmit(judge.id)}
              className="flex-1 py-3 bg-white text-black text-[13px] font-semibold hover:bg-zinc-200 transition-colors rounded-xl flex items-center justify-center gap-2"
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

function TrialJudgeBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 flex items-center justify-center shrink-0 bg-amber-950 rounded-lg">
          <AlertTriangle size={16} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[14px] text-white mb-0.5" style={{ letterSpacing: '-0.01em' }}>Complete Your Trial</h3>
          <p className="text-[13px] text-zinc-400 leading-relaxed mb-3">
            Finish your trial reviews to unlock full Judge status.
          </p>
          <div className="flex gap-2">
            <Link
              to="/judges/apply"
              className="px-4 py-2 bg-white text-black text-[12px] font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Complete Trial
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-2 text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function JudgeHubPage() {
  const { user, profile } = useAuth();
  const { isJudge, isTrialJudge, isDev } = useUserRoles(user?.id);
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
      const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['judge', 'trial_judge']);

      if (!judgeRoles?.length) { setLoading(false); return; }

      const roleMap = new Map<string, 'judge' | 'trial_judge'>();
      judgeRoles.forEach(r => {
        const existing = roleMap.get(r.user_id);
        if (!existing || r.role === 'judge') {
          roleMap.set(r.user_id, r.role as 'judge' | 'trial_judge');
        }
      });

      const judgeIds = Array.from(roleMap.keys());

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, level, xp, verification_status, judge_badge, judge_xp, judge_review_count')
        .in('id', judgeIds);

      if (!profiles) { setLoading(false); return; }

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: reviews } = await supabase
        .from('review_requests')
        .select('judge_id, total_score, reviewed_at')
        .eq('status', 'reviewed')
        .in('judge_id', judgeIds);

      const judgesWithStats: JudgeProfile[] = profiles.map(p => {
        const judgeReviews = (reviews || []).filter(r => r.judge_id === p.id);
        const weeklyReviews = judgeReviews.filter(r =>
          r.reviewed_at && new Date(r.reviewed_at) >= oneWeekAgo
        );
        const avgScore = judgeReviews.length > 0
          ? judgeReviews.reduce((acc, r) => acc + (r.total_score || 0), 0) / judgeReviews.length
          : 0;
        const judgeXp = (p as any).judge_xp || 0;

        return {
          ...p,
          judge_xp: judgeXp,
          judge_level: calculateJudgeLevel(judgeXp),
          totalReviews: judgeReviews.length,
          avgScore,
          thisWeek: weeklyReviews.length,
          roleType: roleMap.get(p.id) || 'trial_judge',
        };
      });

      judgesWithStats.sort((a, b) => {
        if (a.roleType !== b.roleType) return a.roleType === 'judge' ? -1 : 1;
        return b.judge_xp - a.judge_xp;
      });

      setJudges(judgesWithStats);
    } catch (error) {
      console.error('Error fetching judges:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredJudges = judges.filter(j => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return j.username.toLowerCase().includes(query) ||
      (j.display_name?.toLowerCase().includes(query));
  });

  const officialJudges = filteredJudges.filter(j => j.roleType === 'judge');
  const trialJudges = filteredJudges.filter(j => j.roleType === 'trial_judge');

  const handleJudgeSelect = (judge: JudgeProfile) => setSelectedJudge(judge);
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
    <div className="min-h-screen bg-black pb-24">
      {/* ═══════════ HEADER ═══════════ */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 hover:bg-zinc-800 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-zinc-400" />
            </button>
            <h1 className="text-[17px] font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>
              The Bureau
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {(isJudge || isDev) && (
              <Link
                to="/judge-panel"
                className="px-3 py-1.5 bg-white text-black text-[12px] font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
              >
                <Gavel size={12} />
                Panel
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <div className="px-4 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/60 rounded-full mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] text-red-400 font-medium tracking-wide uppercase">QOI Authority</span>
          </div>

          <h2 className="text-[34px] font-bold text-white leading-[1.1] mb-2" style={{ letterSpacing: '-0.03em' }}>
            Judge Division
          </h2>
          <p className="text-[15px] text-zinc-400 max-w-xs mx-auto leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
            Official judges who rate, rank, and shape the standard of editing excellence.
          </p>
        </motion.div>
      </div>

      {/* ═══════════ QUICK ACTIONS ═══════════ */}
      <div className="px-4 pb-5">
        <div className="flex gap-2">
          {(isJudge || isDev) && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/judge-panel')}
              className="flex-1 py-3.5 bg-white text-black text-[14px] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors"
              style={{ letterSpacing: '-0.01em' }}
            >
              <Gavel size={16} />
              Start Judging
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleQuickSubmit}
            className={`${(isJudge || isDev) ? '' : 'flex-1'} py-3.5 px-5 bg-red-600 text-white text-[14px] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 transition-colors`}
            style={{ letterSpacing: '-0.01em' }}
          >
            <Send size={14} />
            Get Rated
          </motion.button>
        </div>
      </div>

      {/* Trial Judge Banner */}
      {isTrialJudge && <TrialJudgeBanner />}

      {/* Daily Spotlight */}
      <JudgeSpotlight />

      {/* Featured Judge */}
      <FeaturedJudgeHero />

      {/* Rankings */}
      <div className="px-4 pb-4">
        <JudgeLeaderboardCard limit={5} />
      </div>

      {/* Live Wire */}
      <div className="border-t border-zinc-800">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[13px] text-zinc-300 font-semibold" style={{ letterSpacing: '-0.01em' }}>Recent Verdicts</span>
        </div>
        <JudgeReviewsFeed />
      </div>

      {/* Divisions */}
      <JudgeDivisionsSection />

      {/* ═══════════ ROSTER ═══════════ */}
      <div className="border-t border-zinc-800 pt-5">
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[20px] font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              Official Roster
            </h2>
            <span className="text-[13px] text-zinc-500 font-medium tabular-nums">
              {filteredJudges.length} judges
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <Input
              placeholder="Search judges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-zinc-900 border-zinc-800 rounded-xl text-[14px] placeholder:text-zinc-600 focus:border-zinc-600 focus:ring-0"
            />
          </div>
        </div>

        {/* Roster entries */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredJudges.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 mx-auto bg-zinc-900 rounded-2xl flex items-center justify-center mb-3">
                <Gavel className="text-zinc-600" size={22} />
              </div>
              <p className="text-[15px] font-semibold text-zinc-300 mb-1" style={{ letterSpacing: '-0.01em' }}>
                No judges found
              </p>
              <p className="text-[13px] text-zinc-500">
                {searchQuery ? 'Try a different search' : 'The Bureau is assembling'}
              </p>
            </div>
          ) : (
            <>
              {officialJudges.length > 0 && officialJudges.map((judge, index) => (
                <JudgeRosterEntry key={judge.id} judge={judge} onSelect={handleJudgeSelect} index={index} />
              ))}
              {trialJudges.length > 0 && (
                <>
                  <div className="px-4 py-3 flex items-center gap-2">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">Trial Judges</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                  {trialJudges.map((judge, index) => (
                    <JudgeRosterEntry key={judge.id} judge={judge} onSelect={handleJudgeSelect} index={officialJudges.length + index} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Join the Bureau CTA */}
      {!isJudge && !isTrialJudge && (
        <div className="px-4 py-6">
          <div className="bg-zinc-900 rounded-2xl p-5 text-center">
            <div className="w-12 h-12 mx-auto bg-zinc-800 rounded-2xl flex items-center justify-center mb-3">
              <Gavel size={20} className="text-zinc-400" />
            </div>
            <h3 className="text-[17px] font-semibold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
              Join the Bureau
            </h3>
            <p className="text-[13px] text-zinc-400 mb-4 max-w-[260px] mx-auto leading-relaxed">
              Apply to become an official QOI authority. Rate, rank, and shape the standard.
            </p>
            <Link
              to="/judges/apply"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-[14px] font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Apply Now
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

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
        onClose={() => { setShowSubmitModal(false); setTargetJudgeId(null); }}
        preselectedJudgeId={targetJudgeId}
      />

      <BottomNav />
    </div>
  );
}
