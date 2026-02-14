import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { ArrowLink, AuthorityGavel, CrownSigil, MedalRing, TrophyPillar, ClassShield, PulseFlame, BoltCircuit, ContendersIcon, AwardCrest } from '@/components/loopgate/LoopgateIcons';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VerifiedBadge from '@/components/loopgate/VerifiedBadge';
import AuthorityBadge from '@/components/loopgate/AuthorityBadge';
import JudgeLevelBadge from '@/components/loopgate/JudgeLevelBadge';
import JudgeDivisionBadge, { getDivisionFromJxp } from '@/components/loopgate/JudgeDivisionBadge';
import ThumbnailImage from '@/components/loopgate/ThumbnailImage';
import { useBatchPinnedEdits } from '@/hooks/usePinnedEdits';
import BottomNav from '@/components/loopgate/BottomNav';
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

function getHeadline(rank: number, username: string, reviews: number): string {
  if (rank === 1) return `${username} Reigns Supreme — The Undisputed #1 Judge on Loopgate`;
  if (rank === 2) return `${username} Holds the Silver Position with ${reviews} Career Reviews`;
  if (rank === 3) return `${username} Rounds Out the Podium in the Global Judge Rankings`;
  return '';
}

// Template biographies for judges without custom bios
function getTemplateBio(name: string, reviews: number): string {
  if (reviews >= 50) return `${name} is one of Loopgate's most prolific authorities, having filed over ${reviews} official verdicts across all divisions.`;
  if (reviews >= 20) return `A rising force in the Bureau, ${name} has established a reputation for precision and consistency across ${reviews} career verdicts.`;
  if (reviews >= 5) return `${name} is an active member of the Bureau's reviewing corps with ${reviews} verdicts on record.`;
  return `${name} is a newly appointed authority in the Bureau, currently building their verdict record.`;
}

export default function JudgeLeaderboardPage() {
  const [judges, setJudges] = useState<JudgeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'reviews' | 'weekly' | 'jxp' | 'division'>('reviews');
  const navigate = useNavigate();

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

  // Batch fetch pinned edits for all judges
  const judgeIds = useMemo(() => sortedJudges.slice(0, 50).map(j => j.id), [sortedJudges]);
  const { editsByUser: judgePinnedEdits } = useBatchPinnedEdits(judgeIds);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ═══════════ CINEMATIC HERO HEADER ═══════════ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/15 via-gold/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(212,175,55,0.25),transparent_60%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gold/12 blur-[120px] rounded-full" />
        
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-gold/20" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-gold/20" />

        <div className="relative z-10 px-4 pt-10 pb-8 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full mb-5"
          >
            <ClassShield className="text-gold" size={12} />
            <span className="text-[10px] text-gold uppercase tracking-[0.4em] font-bold">Global Authority</span>
          </motion.div>

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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-black/40 backdrop-blur-md border border-gold/20 rounded-xl p-3.5 text-center">
            <ContendersIcon className="text-gold mx-auto mb-1.5" size={16} />
            <p className="text-2xl font-display text-gold">{judges.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Active Judges</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-black/40 backdrop-blur-md border border-border rounded-xl p-3.5 text-center">
            <TrophyPillar className="text-gold mx-auto mb-1.5" size={16} />
            <p className="text-2xl font-display">{totalReviews}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Reviews</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-black/40 backdrop-blur-md border border-border rounded-xl p-3.5 text-center">
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
            {top4Featured.map((judge, i) => {
              const name = judge.display_name || judge.username;
              const bio = judge.judge_bio || getTemplateBio(name, judge.totalReviews);
              return (
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
                            {name}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">@{judge.username}</p>
                          {judge.verification_status && <VerifiedBadge size="sm" />}
                        </div>
                      </div>
                      <JudgeDivisionBadge jxp={judge.judge_xp} size="sm" />
                      <p className="text-[10px] text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                        {bio}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════ TOP 3 PODIUM ═══════════ */}
      {top3.length >= 3 && (
        <div className="px-4 mb-6">
          <div className="flex items-end justify-center gap-2 mb-2">
            {/* #2 */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex-1 max-w-[110px]">
              <Link to={`/judge/${top3[1].username}`} className="block">
                <div className="text-center">
                  <div className="relative mx-auto w-16 h-16 mb-2">
                    <Avatar className="w-16 h-16 ring-2 ring-slate-400/50">
                      <AvatarImage src={top3[1].avatar_url || undefined} />
                      <AvatarFallback className="bg-slate-500/20 text-slate-300 font-bold text-lg">{top3[1].username[0]?.toUpperCase()}</AvatarFallback>
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
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex-1 max-w-[130px]">
              <Link to={`/judge/${top3[0].username}`} className="block">
                <div className="text-center">
                  <div className="relative mx-auto w-20 h-20 mb-2">
                    <Avatar className="w-20 h-20 ring-2 ring-gold/60 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                      <AvatarImage src={top3[0].avatar_url || undefined} />
                      <AvatarFallback className="bg-gold/20 text-gold font-bold text-xl">{top3[0].username[0]?.toUpperCase()}</AvatarFallback>
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
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex-1 max-w-[110px]">
              <Link to={`/judge/${top3[2].username}`} className="block">
                <div className="text-center">
                  <div className="relative mx-auto w-16 h-16 mb-2">
                    <Avatar className="w-16 h-16 ring-2 ring-amber-600/50">
                      <AvatarImage src={top3[2].avatar_url || undefined} />
                      <AvatarFallback className="bg-amber-700/20 text-amber-500 font-bold text-lg">{top3[2].username[0]?.toUpperCase()}</AvatarFallback>
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
            <TabsTrigger value="reviews" className="text-[10px] font-bold tracking-wider data-[state=active]:bg-white data-[state=active]:text-background">
              <TrophyPillar size={12} className="mr-1" />
              REVIEWS
            </TabsTrigger>
            <TabsTrigger value="division" className="text-[10px] font-bold tracking-wider data-[state=active]:bg-white data-[state=active]:text-background">
              <ClassShield size={12} className="mr-1" />
              DIVISION
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-[10px] font-bold tracking-wider data-[state=active]:bg-white data-[state=active]:text-background">
              <PulseFlame size={12} className="mr-1" />
              WEEKLY
            </TabsTrigger>
            <TabsTrigger value="jxp" className="text-[10px] font-bold tracking-wider data-[state=active]:bg-white data-[state=active]:text-background">
              <BoltCircuit size={12} className="mr-1" />
              JXP
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ═══════════ FULL LEADERBOARD — PRESTIGE FEED ═══════════ */}
      <div>
        {loading ? (
          <div className="px-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-surface-1 animate-pulse" />
            ))}
          </div>
        ) : sortedJudges.length === 0 ? (
          <div className="text-center py-16">
            <AuthorityGavel className="text-muted-foreground mx-auto mb-4" size={56} />
            <p className="font-display text-lg mb-1">NO JUDGES YET</p>
            <p className="text-sm text-muted-foreground">The authority awaits its first members</p>
          </div>
        ) : (
          <div className="py-2">
            {sortedJudges.map((judge, index) => {
              const rank = index + 1;
              const isTop = rank === 1;
              const isTopThree = rank <= 3;
              const displayName = judge.display_name || judge.username;
              const bio = judge.judge_bio || getTemplateBio(displayName, judge.totalReviews);
              const edits = judgePinnedEdits[judge.id] || [];

              return (
                <motion.div
                  key={judge.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className={`relative border-b border-border/30 ${isTop ? 'bg-surface-1/30' : ''}`}
                >
                  {isTop && (
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                  )}

                  <div className="px-4 py-4">
                    {/* Row 1: Avatar + Identity + Division Badge */}
                    <div className="flex items-start gap-3.5 mb-3">
                      <Link to={`/judge/${judge.username}`} className="flex-shrink-0">
                        <Avatar className={`w-14 h-14 border-2 ${isTop ? 'border-red-700/60' : isTopThree ? 'border-foreground/30' : 'border-border/60'}`}>
                          <AvatarImage src={judge.avatar_url || undefined} />
                          <AvatarFallback className="bg-surface-1 text-base font-bold">
                            {judge.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/judge/${judge.username}`}
                            className="font-semibold text-[15px] text-foreground hover:underline truncate"
                          >
                            {displayName}
                          </Link>
                          {judge.verification_status && <VerifiedBadge size="sm" />}
                          <AuthorityBadge role="judge" size="sm" />
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5">@{judge.username}</p>
                      </div>

                      {/* Rank + Division — right aligned */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                          {isTopThree && getRankIcon(rank)}
                          <span className={`font-display text-lg ${isTop ? 'text-gold' : 'text-foreground'}`}>#{rank}</span>
                        </div>
                        <JudgeDivisionBadge jxp={judge.judge_xp} size="sm" />
                      </div>
                    </div>

                    {/* Row 2: Stats strip */}
                    <div className="flex items-center gap-4 mb-3 text-[11px]">
                      <span className="text-muted-foreground">
                        Verdicts <span className="font-bold text-foreground">{judge.totalReviews}</span>
                      </span>
                      <span className="text-border">•</span>
                      <span className="text-muted-foreground">
                        JXP <span className={`font-bold ${isTop ? 'text-red-400' : 'text-foreground'}`}>{(judge.judge_xp || 0).toLocaleString()}</span>
                      </span>
                      <span className="text-border">•</span>
                      <span className="text-muted-foreground">
                        Weekly <span className="font-bold text-foreground">{judge.weeklyReviews}</span>
                      </span>
                      {judge.avgScore > 0 && (
                        <>
                          <span className="text-border">•</span>
                          <span className="text-muted-foreground">
                            Avg <span className="font-bold text-foreground">{judge.avgScore}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Row 3: Bio */}
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed mb-3 line-clamp-2">
                      {bio}
                    </p>

                    {/* Row 3.5: Pinned Edits */}
                    {edits.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                        {edits.map((edit) => (
                          <a
                            key={edit.id}
                            href={edit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative flex-shrink-0 w-24 h-14 rounded-md overflow-hidden bg-surface-0 border border-border/30 hover:border-red-800/40 transition-colors group"
                          >
                            {edit.thumbnail_url ? (
                              <ThumbnailImage src={edit.thumbnail_url} alt={edit.title || "Edit"} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {edit.title && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-0.5">
                                <p className="text-[8px] text-white truncate">{edit.title}</p>
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Row 4: Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/judge/${judge.username}`)}
                        className="flex-1 py-2 text-[11px] font-bold uppercase tracking-wider border border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-colors rounded-md"
                      >
                        View Dossier
                      </button>
                      <button
                        onClick={() => navigate(`/judge/${judge.username}`)}
                        className="flex-1 py-2 text-[11px] font-bold uppercase tracking-wider bg-red-700 text-white hover:bg-red-600 transition-colors rounded-md"
                      >
                        Get Rated
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
