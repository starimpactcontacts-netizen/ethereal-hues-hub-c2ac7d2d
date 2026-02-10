import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLink, AuthorityGavel, CrownSigil, MedalRing, TrophyPillar, ClassShield, PulseFlame, BoltCircuit, ContendersIcon, AwardCrest } from '@/components/loopgate/LoopgateIcons';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VerifiedBadge from '@/components/loopgate/VerifiedBadge';
import JudgeLevelBadge from '@/components/loopgate/JudgeLevelBadge';
import JudgeDivisionBadge, { getDivisionFromJxp } from '@/components/loopgate/JudgeDivisionBadge';
import { cn } from '@/lib/utils';

interface JudgeLeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  judge_xp: number;
  judge_review_count: number;
  judge_bio: string | null;
  verification_status: boolean | null;
  totalReviews: number;
  avgScore: number;
  weeklyReviews: number;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <CrownSigil className="text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]" size={24} />;
  if (rank === 2) return <MedalRing className="text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.4)]" size={20} />;
  if (rank === 3) return <AwardCrest className="text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.4)]" size={20} />;
  return <span className="font-display text-lg text-muted-foreground">{rank}</span>;
}

function getRankBg(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-500/25 via-amber-400/15 to-yellow-500/5 border-l-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.15)]';
  if (rank === 2) return 'bg-gradient-to-r from-slate-400/15 via-gray-300/8 to-transparent border-l-4 border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.1)]';
  if (rank === 3) return 'bg-gradient-to-r from-amber-700/15 via-orange-600/8 to-transparent border-l-4 border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.1)]';
  if (rank <= 10) return 'bg-gradient-to-r from-gold/8 via-gold/4 to-transparent border-l-2 border-gold/40';
  return 'bg-surface-1/70 border-l-2 border-border/60';
}

// Forbes-style headline based on rank
function getHeadline(rank: number, username: string, reviews: number): string {
  if (rank === 1) return `${username} Reigns Supreme — The Undisputed #1 Judge on Loopgate`;
  if (rank === 2) return `${username} Holds the Silver Position with ${reviews} Career Reviews`;
  if (rank === 3) return `${username} Rounds Out the Podium in the Global Judge Rankings`;
  return '';
}

export default function JudgeLeaderboardPage() {
  const [judges, setJudges] = useState<JudgeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'reviews' | 'weekly' | 'jxp' | 'division'>('reviews');

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

      if (!judgeRoles?.length) {
        setLoading(false);
        return;
      }

      const judgeIds = judgeRoles.map(r => r.user_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, level, xp, verification_status, judge_xp, judge_review_count, judge_bio')
        .in('id', judgeIds);

      if (!profiles) {
        setLoading(false);
        return;
      }

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: reviews } = await supabase
        .from('review_requests')
        .select('judge_id, total_score, reviewed_at')
        .eq('status', 'reviewed')
        .in('judge_id', judgeIds);

      const entries: JudgeLeaderboardEntry[] = profiles.map(profile => {
        const judgeReviews = reviews?.filter(r => r.judge_id === profile.id) || [];
        const weeklyReviews = judgeReviews.filter(r =>
          r.reviewed_at && new Date(r.reviewed_at) >= oneWeekAgo
        );
        const avgScore = judgeReviews.length > 0
          ? judgeReviews.reduce((acc, r) => acc + (r.total_score || 0), 0) / judgeReviews.length
          : 0;

        return {
          ...profile,
          judge_xp: profile.judge_xp || 0,
          judge_review_count: profile.judge_review_count || 0,
          judge_bio: profile.judge_bio || null,
          totalReviews: judgeReviews.length,
          avgScore: Math.round(avgScore * 10) / 10,
          weeklyReviews: weeklyReviews.length,
        };
      });

      setJudges(entries);
    } catch (error) {
      console.error('Error fetching judges:', error);
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
    return b.totalReviews - a.totalReviews;
  });

  const top3 = sortedJudges.slice(0, 3);
  const top4Featured = sortedJudges.slice(0, 4);
  const rest = sortedJudges.slice(3);
  const totalReviews = judges.reduce((acc, j) => acc + j.totalReviews, 0);
  const totalWeekly = judges.reduce((acc, j) => acc + j.weeklyReviews, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ═══════════ CINEMATIC HERO HEADER ═══════════ */}
      <div className="relative overflow-hidden">
        {/* Multi-layer depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold/15 via-gold/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(212,175,55,0.25),transparent_60%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gold/12 blur-[120px] rounded-full" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        
        {/* Decorative borders */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-gold/20" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-gold/20" />

        <div className="relative z-10 px-4 pt-10 pb-8 text-center">
          {/* Badge */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full mb-5"
          >
            <ClassShield className="text-gold" size={12} />
            <span className="text-[10px] text-gold uppercase tracking-[0.4em] font-bold">Global Authority</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl tracking-wider text-white mb-3 drop-shadow-[0_0_40px_rgba(212,175,55,0.2)]"
          >
            JUDGE INDEX
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[11px] text-muted-foreground uppercase tracking-[0.3em] max-w-sm mx-auto mb-6"
          >
            The definitive ranking of Loopgate's elite reviewers
          </motion.p>

          {/* Forbes-style headline for #1 */}
          {top3[0] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-md mx-auto mb-6 px-5 py-3 bg-black/40 backdrop-blur-md border border-gold/20 rounded-lg"
            >
              <p className="text-[11px] text-gold/80 italic leading-relaxed">
                "{getHeadline(1, top3[0].display_name || top3[0].username, top3[0].totalReviews)}"
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ═══════════ STATS BAR ═══════════ */}
      <div className="px-4 -mt-2 mb-6">
        <div className="grid grid-cols-3 gap-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-black/40 backdrop-blur-md border border-gold/20 rounded-xl p-3.5 text-center"
          >
            <ContendersIcon className="text-gold mx-auto mb-1.5" size={16} />
            <p className="text-2xl font-display text-gold">{judges.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Active Judges</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/40 backdrop-blur-md border border-border rounded-xl p-3.5 text-center"
          >
            <TrophyPillar className="text-gold mx-auto mb-1.5" size={16} />
            <p className="text-2xl font-display">{totalReviews}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Reviews</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-black/40 backdrop-blur-md border border-border rounded-xl p-3.5 text-center"
          >
            <PulseFlame className="text-orange-400 mx-auto mb-1.5" size={16} />
            <p className="text-2xl font-display text-orange-400">{totalWeekly}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">This Week</p>
          </motion.div>
        </div>
      </div>

      {/* ═══════════ FEATURED OFFICIALS — Forbes 30u30 style ═══════════ */}
      {top4Featured.length >= 4 && (
        <div className="px-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-red-700/60 to-transparent" />
            <h2 className="font-display text-sm tracking-[0.3em] text-red-500 uppercase">Featured Officials</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-red-700/60 to-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {top4Featured.map((judge, i) => (
              <motion.div
                key={judge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Link
                  to={`/judge/${judge.username}`}
                  className="block bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="w-14 h-14 ring-1 ring-zinc-700 shrink-0">
                        <AvatarImage src={judge.avatar_url || undefined} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">
                          {judge.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm text-white truncate">
                          {judge.display_name || judge.username}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">@{judge.username}</p>
                        {judge.verification_status && <VerifiedBadge size="sm" />}
                      </div>
                    </div>
                    <JudgeDivisionBadge jxp={judge.judge_xp} size="sm" />
                    {judge.judge_bio ? (
                      <p className="text-[10px] text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                        {judge.judge_bio}
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-600 italic mt-2">
                        {judge.totalReviews} career verdicts · {(judge.judge_xp || 0).toLocaleString()} JXP
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ TOP 3 PODIUM ═══════════ */}
      {top3.length >= 3 && (
        <div className="px-4 mb-6">
          <div className="flex items-end justify-center gap-2 mb-2">
            {/* #2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex-1 max-w-[110px]"
            >
              <Link to={`/judge/${top3[1].username}`} className="block">
                <div className="text-center">
                  <div className="relative mx-auto w-16 h-16 mb-2">
                    <Avatar className="w-16 h-16 ring-2 ring-slate-400/50">
                      <AvatarImage src={top3[1].avatar_url || undefined} />
                      <AvatarFallback className="bg-slate-500/20 text-slate-300 font-bold text-lg">
                        {top3[1].username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold text-white border-2 border-background">2</div>
                  </div>
                  <p className="font-display text-xs truncate">{top3[1].display_name || top3[1].username}</p>
                  <JudgeDivisionBadge jxp={top3[1].judge_xp} size="sm" />
                  <p className="text-[10px] text-muted-foreground mt-1">{top3[1].totalReviews} reviews</p>
                </div>
              </Link>
              <div className="h-16 bg-gradient-to-t from-slate-500/20 to-slate-400/5 border border-slate-400/20 rounded-t-lg mt-2 flex items-center justify-center">
                <MedalRing className="text-slate-400/60" size={20} />
              </div>
            </motion.div>

            {/* #1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex-1 max-w-[130px]"
            >
              <Link to={`/judge/${top3[0].username}`} className="block">
                <div className="text-center">
                  <div className="relative mx-auto w-20 h-20 mb-2">
                    <Avatar className="w-20 h-20 ring-2 ring-gold/60 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                      <AvatarImage src={top3[0].avatar_url || undefined} />
                      <AvatarFallback className="bg-gold/20 text-gold font-bold text-xl">
                        {top3[0].username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <CrownSigil className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" size={24} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold flex items-center justify-center text-[10px] font-bold text-background border-2 border-background">1</div>
                  </div>
                  <p className="font-display text-sm truncate">{top3[0].display_name || top3[0].username}</p>
                  {top3[0].verification_status && <VerifiedBadge size="sm" />}
                  <JudgeDivisionBadge jxp={top3[0].judge_xp} size="sm" />
                  <p className="text-[10px] text-gold mt-1">{top3[0].totalReviews} reviews</p>
                </div>
              </Link>
              <div className="h-24 bg-gradient-to-t from-gold/20 to-gold/5 border border-gold/30 rounded-t-lg mt-2 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <CrownSigil className="text-gold/40" size={24} />
              </div>
            </motion.div>

            {/* #3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex-1 max-w-[110px]"
            >
              <Link to={`/judge/${top3[2].username}`} className="block">
                <div className="text-center">
                  <div className="relative mx-auto w-16 h-16 mb-2">
                    <Avatar className="w-16 h-16 ring-2 ring-amber-600/50">
                      <AvatarImage src={top3[2].avatar_url || undefined} />
                      <AvatarFallback className="bg-amber-700/20 text-amber-500 font-bold text-lg">
                        {top3[2].username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 flex items-center justify-center text-[10px] font-bold text-white border-2 border-background">3</div>
                  </div>
                  <p className="font-display text-xs truncate">{top3[2].display_name || top3[2].username}</p>
                  <JudgeDivisionBadge jxp={top3[2].judge_xp} size="sm" />
                  <p className="text-[10px] text-muted-foreground mt-1">{top3[2].totalReviews} reviews</p>
                </div>
              </Link>
              <div className="h-12 bg-gradient-to-t from-amber-700/20 to-amber-600/5 border border-amber-600/20 rounded-t-lg mt-2 flex items-center justify-center">
                <AwardCrest className="text-amber-600/40" size={20} />
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* ═══════════ SORT TABS ═══════════ */}
      <div className="px-4 mb-4">
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <TabsList className="w-full grid grid-cols-4 bg-black/40 backdrop-blur-md border border-white/10 h-10">
            <TabsTrigger value="reviews" className="text-[10px] font-bold tracking-wider data-[state=active]:bg-gold data-[state=active]:text-background">
              <TrophyPillar size={12} className="mr-1" />
              REVIEWS
            </TabsTrigger>
            <TabsTrigger value="division" className="text-[10px] font-bold tracking-wider data-[state=active]:bg-gold data-[state=active]:text-background">
              <ClassShield size={12} className="mr-1" />
              DIVISION
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-[10px] font-bold tracking-wider data-[state=active]:bg-gold data-[state=active]:text-background">
              <PulseFlame size={12} className="mr-1" />
              WEEKLY
            </TabsTrigger>
            <TabsTrigger value="jxp" className="text-[10px] font-bold tracking-wider data-[state=active]:bg-gold data-[state=active]:text-background">
              <BoltCircuit size={12} className="mr-1" />
              JXP
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ═══════════ FULL LEADERBOARD ═══════════ */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-surface-1 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sortedJudges.length === 0 ? (
          <div className="text-center py-16">
            <AuthorityGavel className="text-muted-foreground mx-auto mb-4" size={56} />
            <p className="font-display text-lg mb-1">NO JUDGES YET</p>
            <p className="text-sm text-muted-foreground">The authority awaits its first members</p>
          </div>
        ) : (
          sortedJudges.map((judge, index) => {
            const rank = index + 1;
            const division = getDivisionFromJxp(judge.judge_xp);
            const isTopThree = rank <= 3;
            const isTop10 = rank <= 10;

            return (
              <motion.div
                key={judge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  to={`/judge/${judge.username}`}
                  className={cn(
                    'block rounded-xl p-3.5 transition-all hover:scale-[1.008] active:scale-[0.998] relative overflow-hidden',
                    getRankBg(rank)
                  )}
                >
                  {/* Shimmer for top 3 */}
                  {isTopThree && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute -inset-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 relative z-10">
                    {/* Rank */}
                    <div className="w-8 flex justify-center shrink-0">
                      {getRankIcon(rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className={cn(
                      'w-11 h-11 shrink-0',
                      isTopThree && 'ring-2 ring-gold/40',
                      !isTopThree && isTop10 && 'ring-1 ring-gold/20'
                    )}>
                      <AvatarImage src={judge.avatar_url || undefined} alt={judge.username} />
                      <AvatarFallback className="bg-gold/20 text-gold text-sm font-bold">
                        {judge.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className={cn(
                          'font-medium truncate',
                          isTopThree ? 'text-white' : 'text-foreground'
                        )}>
                          {judge.display_name || `@${judge.username}`}
                        </p>
                        {judge.verification_status && <VerifiedBadge size="sm" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <JudgeDivisionBadge jxp={judge.judge_xp} size="sm" />
                        <JudgeLevelBadge level={Math.min(10, Math.max(1, Math.floor((judge.judge_xp || 0) / 500) + 1))} size="xs" showIcon={false} />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right shrink-0">
                      <p className={cn(
                        'font-display text-lg',
                        isTopThree ? 'text-gold' : 'text-foreground'
                      )}>
                        {sortBy === 'reviews' && judge.totalReviews}
                        {sortBy === 'weekly' && judge.weeklyReviews}
                        {sortBy === 'jxp' && (judge.judge_xp || 0).toLocaleString()}
                        {sortBy === 'division' && division.label.replace(' DIVISION', '')}
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                        {sortBy === 'reviews' && 'reviews'}
                        {sortBy === 'weekly' && 'this week'}
                        {sortBy === 'jxp' && 'JXP'}
                        {sortBy === 'division' && 'division'}
                      </p>
                    </div>

                    <ArrowLink className="text-muted-foreground shrink-0" size={16} />
                  </div>

                  {/* Forbes headline for top 3 */}
                  {isTopThree && getHeadline(rank, judge.display_name || judge.username, judge.totalReviews) && (
                    <p className="text-[9px] text-gold/50 italic mt-2 ml-11 truncate">
                      {getHeadline(rank, judge.display_name || judge.username, judge.totalReviews)}
                    </p>
                  )}
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
