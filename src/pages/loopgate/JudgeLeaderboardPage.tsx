import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { ArrowLink, AuthorityGavel, ClassShield, TrophyPillar, PulseFlame, BoltCircuit } from '@/components/loopgate/LoopgateIcons';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VerifiedBadge from '@/components/loopgate/VerifiedBadge';
import JudgeDivisionBadge, { getDivisionFromJxp } from '@/components/loopgate/JudgeDivisionBadge';
import BottomNav from '@/components/loopgate/BottomNav';
import { cn } from '@/lib/utils';

interface JudgeEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  judge_xp: number;
  judge_review_count: number;
  verification_status: boolean | null;
  totalReviews: number;
  weeklyReviews: number;
}

export default function JudgeLeaderboardPage() {
  const navigate = useNavigate();
  const [judges, setJudges] = useState<JudgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'reviews' | 'weekly' | 'jxp' | 'division'>('jxp');

  useEffect(() => {
    fetchJudges();
  }, []);

  async function fetchJudges() {
    setLoading(true);
    try {
      const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'judge');

      if (!judgeRoles?.length) { setLoading(false); return; }

      const judgeIds = judgeRoles.map(r => r.user_id);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [{ data: profiles }, { data: reviews }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, verification_status, judge_xp, judge_review_count')
          .in('id', judgeIds)
          .eq('is_banned', false)
          .eq('is_hidden', false),
        supabase
          .from('review_requests')
          .select('judge_id, reviewed_at')
          .eq('status', 'reviewed')
          .in('judge_id', judgeIds),
      ]);

      if (!profiles) { setLoading(false); return; }

      const entries: JudgeEntry[] = profiles.map(p => {
        const judgeReviews = reviews?.filter(r => r.judge_id === p.id) || [];
        const weeklyReviews = judgeReviews.filter(r =>
          r.reviewed_at && new Date(r.reviewed_at) >= oneWeekAgo
        );
        return {
          ...p,
          judge_xp: p.judge_xp || 0,
          judge_review_count: p.judge_review_count || 0,
          totalReviews: judgeReviews.length,
          weeklyReviews: weeklyReviews.length,
        };
      });

      setJudges(entries);
    } catch (error) {
      console.error('Error fetching judge index:', error);
    } finally {
      setLoading(false);
    }
  }

  const sortedJudges = [...judges].sort((a, b) => {
    if (sortBy === 'reviews') return b.totalReviews - a.totalReviews;
    if (sortBy === 'weekly') return b.weeklyReviews - a.weeklyReviews;
    if (sortBy === 'jxp') return b.judge_xp - a.judge_xp;
    if (sortBy === 'division') {
      const divA = getDivisionFromJxp(a.judge_xp);
      const divB = getDivisionFromJxp(b.judge_xp);
      return divB.minJxp - divA.minJxp || b.judge_xp - a.judge_xp;
    }
    return b.judge_xp - a.judge_xp;
  });

  const totalWeekly = judges.reduce((acc, j) => acc + j.weeklyReviews, 0);

  function getStatValue(judge: JudgeEntry): string {
    if (sortBy === 'reviews') return String(judge.totalReviews);
    if (sortBy === 'weekly') return String(judge.weeklyReviews);
    if (sortBy === 'jxp') return (judge.judge_xp || 0).toLocaleString();
    if (sortBy === 'division') return getDivisionFromJxp(judge.judge_xp).label.replace(' DIVISION', '');
    return String(judge.judge_xp);
  }

  function getStatLabel(): string {
    if (sortBy === 'reviews') return 'Reviews';
    if (sortBy === 'weekly') return 'This Week';
    if (sortBy === 'jxp') return 'JXP';
    if (sortBy === 'division') return 'Division';
    return 'JXP';
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* ═══════════ HEADER — clean, institutional ═══════════ */}
      <div className="h-[2px] bg-red-700" />
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/5 transition-colors">
            <ArrowLeft size={18} className="text-zinc-400" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[10px] text-zinc-500 font-mono">{totalWeekly} this week</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 bg-red-700" />
          <h1 className="font-display text-2xl tracking-wider text-white">JUDGE INDEX</h1>
        </div>
        <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.2em] ml-3">
          The Bureau · Global Authority Rankings · {judges.length} Officials
        </p>
      </div>

      {/* ═══════════ SORT TABS ═══════════ */}
      <div className="px-4 pb-3">
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <TabsList className="w-full grid grid-cols-4 bg-zinc-950 border border-zinc-800 h-9">
            <TabsTrigger value="jxp" className="text-[9px] font-display uppercase tracking-wider data-[state=active]:bg-red-700 data-[state=active]:text-white">
              JXP
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-[9px] font-display uppercase tracking-wider data-[state=active]:bg-red-700 data-[state=active]:text-white">
              Reviews
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-[9px] font-display uppercase tracking-wider data-[state=active]:bg-red-700 data-[state=active]:text-white">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="division" className="text-[9px] font-display uppercase tracking-wider data-[state=active]:bg-red-700 data-[state=active]:text-white">
              Division
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* ═══════════ RANKING TABLE ═══════════ */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedJudges.length === 0 ? (
          <div className="text-center py-16 px-4">
            <AuthorityGavel className="text-zinc-700 mx-auto mb-3" size={32} />
            <p className="font-display text-sm tracking-wider text-zinc-400">NO OFFICIALS RANKED</p>
          </div>
        ) : (
          sortedJudges.map((judge, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;

            return (
              <motion.div
                key={judge.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
              >
                <Link
                  to={`/judge/${judge.username}`}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]',
                    isTop3 ? 'border-l-2 border-l-red-600' : 'border-l-2 border-l-zinc-800'
                  )}
                >
                  {/* Rank */}
                  <span className={cn(
                    'text-sm font-display w-7 text-right shrink-0',
                    isTop3 ? 'text-white' : 'text-zinc-600'
                  )}>
                    {String(rank).padStart(2, '0')}
                  </span>

                  {/* Avatar */}
                  {judge.avatar_url ? (
                    <img
                      src={judge.avatar_url}
                      alt={judge.username}
                      className="w-10 h-10 rounded-sm object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-sm bg-zinc-900 flex items-center justify-center shrink-0 text-xs font-bold text-zinc-500">
                      {judge.username[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Name + division */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'font-display text-[13px] truncate',
                        isTop3 ? 'text-white' : 'text-zinc-300'
                      )}>
                        {(judge.display_name || judge.username).toUpperCase()}
                      </span>
                      {judge.verification_status && <VerifiedBadge size="sm" />}
                    </div>
                    <JudgeDivisionBadge jxp={judge.judge_xp} size="sm" />
                  </div>

                  {/* Stat */}
                  <div className="text-right shrink-0">
                    <div className={cn(
                      'text-lg font-display',
                      isTop3 ? 'text-white' : 'text-zinc-300'
                    )}>
                      {getStatValue(judge)}
                    </div>
                    <div className="text-[8px] text-zinc-600 uppercase tracking-wider font-mono">
                      {getStatLabel()}
                    </div>
                  </div>

                  <ArrowLink size={14} className="text-zinc-700 shrink-0" />
                </Link>
                <div className="h-px bg-zinc-900 ml-14" />
              </motion.div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
