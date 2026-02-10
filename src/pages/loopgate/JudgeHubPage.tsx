import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import { AuthorityGavel, ScopeTarget, ContendersIcon, NexusStar, ArrowLink } from '@/components/loopgate/LoopgateIcons';
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
import JudgeClassBadge from '@/components/loopgate/JudgeClassBadge';
import JudgeSpotlight from '@/components/loopgate/JudgeSpotlight';
import JudgeDivisionBadge from '@/components/loopgate/JudgeDivisionBadge';
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
   ROSTER ENTRY — institutional table row, not a card
   ═══════════════════════════════════════════════════ */
function JudgeRosterEntry({ judge, onSelect, index }: { judge: JudgeProfile; onSelect: (j: JudgeProfile) => void; index: number }) {
  const navigate = useNavigate();
  const isTrial = judge.roleType === 'trial_judge';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="group"
    >
      <div className={`flex items-center gap-3 py-3 px-3 transition-colors hover:bg-white/[0.03] ${
        !isTrial ? 'border-l-2 border-l-red-600' : 'border-l-2 border-l-zinc-700'
      }`}>
        {/* Rank # */}
        <span className="text-[10px] text-zinc-600 font-mono w-5 text-right shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Avatar */}
        <div className="relative shrink-0">
          {judge.avatar_url ? (
            <img
              src={judge.avatar_url}
              alt={judge.username}
              className="w-9 h-9 rounded-sm object-cover grayscale-[30%] group-hover:grayscale-0 transition-all"
            />
          ) : (
            <div className={`w-9 h-9 rounded-sm flex items-center justify-center text-xs font-bold ${
              isTrial ? 'bg-zinc-900 text-zinc-500' : 'bg-red-950 text-red-400'
            }`}>
              {judge.username[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + handle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[13px] text-white truncate">
              {(judge.display_name || judge.username).toUpperCase()}
            </span>
            {judge.verification_status && <VerifiedBadge size="sm" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">@{judge.username}</span>
            {!isTrial && <JudgeDivisionBadge jxp={judge.judge_xp} size="sm" />}
            {isTrial && (
              <span className="text-[8px] px-1.5 py-0.5 bg-zinc-900 text-zinc-500 font-mono uppercase tracking-wider">
                TRIAL
              </span>
            )}
          </div>
        </div>

        {/* Stats column */}
        {!isTrial && (
          <div className="text-right shrink-0 mr-2">
            <div className="text-sm font-display text-white">{judge.totalReviews}</div>
            <div className="text-[8px] text-zinc-600 uppercase tracking-wider font-mono">Reviews</div>
          </div>
        )}

        {/* Action */}
        {!isTrial ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/judge/${judge.username}`);
            }}
            className="shrink-0 px-3 py-1.5 border border-red-700 text-red-400 text-[10px] font-bold uppercase tracking-wider hover:bg-red-950 transition-colors"
          >
            View
          </button>
        ) : (
          <button
            onClick={() => onSelect(judge)}
            className="shrink-0 p-1.5 hover:bg-white/5 transition-colors"
          >
            <ArrowLink size={14} className="text-zinc-500" />
          </button>
        )}
      </div>
      <div className="h-px bg-zinc-900 ml-8" />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   JUDGE PREVIEW MODAL — institutional dossier
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
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-black border border-zinc-800 overflow-hidden pb-6"
      >
        {/* Red accent bar */}
        <div className="h-1 bg-red-700" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            {judge.avatar_url ? (
              <img
                src={judge.avatar_url}
                alt={judge.username}
                className="w-16 h-16 rounded-sm object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-sm bg-red-950 flex items-center justify-center">
                <AuthorityGavel size={24} className="text-red-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-lg text-white">{(judge.display_name || judge.username).toUpperCase()}</h3>
                {judge.verification_status && <VerifiedBadge />}
              </div>
              <p className="text-xs text-zinc-500 mb-2">@{judge.username}</p>
              <div className="flex items-center gap-2">
                <JudgeLevelBadge level={judge.judge_level} size="sm" />
                <span className="text-[10px] text-zinc-500">{judge.judge_xp} JXP</span>
              </div>
            </div>
          </div>

          {judge.bio && (
            <p className="text-sm text-zinc-400 mb-5 border-l-2 border-red-800 pl-3 italic">{judge.bio}</p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-px bg-zinc-800 mb-5">
            <div className="bg-black p-3 text-center">
              <div className="text-xl font-display text-white">{judge.totalReviews}</div>
              <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Reviews</div>
            </div>
            <div className="bg-black p-3 text-center">
              <div className="text-xl font-display text-white">{judge.avgScore.toFixed(0)}</div>
              <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Avg Score</div>
            </div>
            <div className="bg-black p-3 text-center">
              <div className="text-xl font-display text-red-400">{judge.thisWeek}</div>
              <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">This Week</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/judge/${judge.username}`)}
              className="flex-1 py-2.5 border border-zinc-700 text-sm font-display uppercase tracking-wider text-zinc-300 hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLink size={14} />
              Dossier
            </button>
            <button
              onClick={() => onSubmit(judge.id)}
              className="flex-1 py-2.5 bg-red-700 text-white text-sm font-display uppercase tracking-wider hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
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
      className="mx-4 mb-3 border border-zinc-800 bg-zinc-950 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5 border border-zinc-700">
          <AlertTriangle size={14} className="text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xs uppercase tracking-wider mb-1">Complete Your Trial</h3>
          <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">
            Finish your trial reviews to unlock full Judge status and be listed in the Bureau.
          </p>
          <div className="flex gap-2">
            <Link
              to="/judges/apply"
              className="px-4 py-2 bg-red-700 text-white text-[10px] font-display uppercase tracking-wider hover:bg-red-600 transition-colors"
            >
              Complete Trial →
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-2 border border-zinc-800 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
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
   MAIN PAGE — THE AUTHORITY BUREAU
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

  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* ═══════════ MASTHEAD — THE BUREAU ═══════════ */}
      <div className="relative">
        {/* Thin red accent line at very top */}
        <div className="h-[2px] bg-red-700" />

        <div className="px-4 pt-4 pb-5">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={18} className="text-zinc-400" />
            </button>

            <div className="flex items-center gap-3">
              {(isJudge || isDev) && (
                <Link
                  to="/judge-panel"
                  className="px-3 py-1.5 border border-zinc-700 text-[10px] font-display uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors flex items-center gap-1.5"
                >
                  <ScopeTarget size={10} />
                  Panel
                </Link>
              )}
            </div>
          </div>

          {/* Masthead */}
          <div className="text-center mb-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-3"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-[9px] text-zinc-600 uppercase tracking-[0.4em] font-mono">Est. 2025</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-[40px] leading-none tracking-wider text-white mb-1"
            >
              THE BUREAU
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.35em] font-mono mb-3">
                QOI Authority · Judge Division
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-[9px] text-zinc-600 font-mono">{todayDate.toUpperCase()}</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Double rule */}
        <div className="h-px bg-zinc-800" />
        <div className="h-[2px] mt-px bg-zinc-800" />
      </div>

      {/* Trial Judge Banner */}
      {isTrialJudge && <div className="pt-4"><TrialJudgeBanner /></div>}

      {/* Daily Spotlight */}
      <JudgeSpotlight />

      {/* Featured Judge — Editorial Feature */}
      <FeaturedJudgeHero />

      {/* Judge Actions — Start Judging + Submit for Review */}
      <div className="px-4 py-4 space-y-2">
        {(isJudge || isDev) && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/judge-panel')}
            className="w-full py-4 bg-white hover:bg-zinc-100 text-black font-display text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 transition-colors"
          >
            <AuthorityGavel size={16} />
            Start Judging
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleQuickSubmit}
          className="w-full py-3.5 bg-red-700 hover:bg-red-600 text-white font-display text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-colors"
        >
          <Send size={14} />
          Request Official Review
        </motion.button>
      </div>

      {/* Rankings Bureau */}
      <div className="px-4 pb-4">
        <JudgeLeaderboardCard limit={5} />
      </div>

      {/* Wire Feed — Recent Reviews */}
      <div className="border-t border-zinc-800">
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-mono">Live Wire · Recent Verdicts</span>
          </div>
        </div>
        <JudgeReviewsFeed />
      </div>

      {/* Judge Divisions */}
      <JudgeDivisionsSection />

      {/* Become a Judge — Recruitment */}
      {!isJudge && !isTrialJudge && (
        <div className="px-4 py-4 border-t border-zinc-800">
          <div className="border border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center shrink-0 border border-zinc-700">
                <NexusStar className="text-zinc-400" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-xs uppercase tracking-wider text-white mb-0.5">Join the Bureau</h3>
                <p className="text-[10px] text-zinc-500">
                  Apply to become an official QOI authority. Rate, rank, and shape the standard.
                </p>
              </div>
              <Link
                to="/judges/apply"
                className="shrink-0 px-4 py-2 bg-white text-black text-[10px] font-display uppercase tracking-wider hover:bg-zinc-200 transition-colors"
              >
                Apply
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Judge Roster */}
      <div className="border-t border-zinc-800">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-red-700" />
              <h2 className="font-display text-sm tracking-[0.15em] text-white">OFFICIAL ROSTER</h2>
            </div>
            <span className="text-[10px] text-zinc-600 font-mono">
              {filteredJudges.length} REGISTERED
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <Input
              placeholder="Search the roster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-black border-zinc-800 text-sm placeholder:text-zinc-700 focus:border-red-800"
            />
          </div>
        </div>

        {/* Roster entries */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredJudges.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 mx-auto border border-zinc-800 flex items-center justify-center mb-3">
                <AuthorityGavel className="text-zinc-600" size={20} />
              </div>
              <p className="font-display text-xs tracking-wider text-zinc-400 mb-1">NO RECORDS FOUND</p>
              <p className="text-[10px] text-zinc-600">
                {searchQuery ? 'Adjust your query' : 'The Bureau is assembling'}
              </p>
            </div>
          ) : (
            filteredJudges.map((judge, index) => (
              <JudgeRosterEntry
                key={judge.id}
                judge={judge}
                onSelect={handleJudgeSelect}
                index={index}
              />
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
