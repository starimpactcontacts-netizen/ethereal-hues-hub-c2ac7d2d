import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, Trophy, Star, TrendingUp, Users, Crown, Medal, Award, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AuthorityBadge from '@/components/loopgate/AuthorityBadge';
import LevelBadge from '@/components/loopgate/LevelBadge';
import VerifiedBadge from '@/components/loopgate/VerifiedBadge';

interface JudgeLeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  verification_status: boolean | null;
  totalReviews: number;
  avgScore: number;
  weeklyReviews: number;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-gold" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
  return <span className="text-sm font-display text-muted-foreground w-5 text-center">{rank}</span>;
}

function getRankBg(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-r from-gold/20 via-gold/10 to-transparent border-gold/50';
  if (rank === 2) return 'bg-gradient-to-r from-gray-400/10 via-gray-400/5 to-transparent border-gray-400/30';
  if (rank === 3) return 'bg-gradient-to-r from-amber-700/10 via-amber-700/5 to-transparent border-amber-700/30';
  return 'bg-surface-1 border-border';
}

export default function JudgeLeaderboardPage() {
  const [judges, setJudges] = useState<JudgeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'reviews' | 'weekly' | 'xp'>('reviews');

  useEffect(() => {
    fetchJudges();
  }, []);

  async function fetchJudges() {
    setLoading(true);
    try {
      // Get all users with judge role
      const { data: judgeRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'judge');

      if (rolesError || !judgeRoles?.length) {
        setLoading(false);
        return;
      }

      const judgeIds = judgeRoles.map(r => r.user_id);

      // Get judge profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, level, xp, verification_status')
        .in('id', judgeIds);

      if (profilesError || !profiles) {
        setLoading(false);
        return;
      }

      // Get review stats for each judge
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: reviews, error: reviewsError } = await supabase
        .from('review_requests')
        .select('judge_id, total_score, reviewed_at')
        .eq('status', 'reviewed')
        .in('judge_id', judgeIds);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      }

      // Build leaderboard entries
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
    return b.xp - a.xp;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-gold/10 via-background to-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(218,165,32,0.2),transparent_60%)]" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
        
        <div className="relative px-4 pt-12 pb-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/20 border border-gold/30 mb-4"
          >
            <Gavel className="w-8 h-8 text-gold" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl mb-2"
          >
            QOI JUDGES
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm max-w-xs mx-auto"
          >
            The elite reviewers who rate your edits and help you improve
          </motion.p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-4 -mt-2 mb-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-1 border border-border rounded-xl p-3 text-center">
            <Users className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-xl font-display text-gold">{judges.length}</p>
            <p className="text-xs text-muted-foreground">Active Judges</p>
          </div>
          <div className="bg-surface-1 border border-border rounded-xl p-3 text-center">
            <Trophy className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-xl font-display">{judges.reduce((acc, j) => acc + j.totalReviews, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Reviews</p>
          </div>
          <div className="bg-surface-1 border border-border rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-xl font-display text-green-400">{judges.reduce((acc, j) => acc + j.weeklyReviews, 0)}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
        </div>
      </div>

      {/* Sort Tabs */}
      <div className="px-4 mb-4">
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <TabsList className="w-full grid grid-cols-3 bg-surface-1">
            <TabsTrigger value="reviews" className="text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              Most Reviews
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              This Week
            </TabsTrigger>
            <TabsTrigger value="xp" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              Judge XP
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Leaderboard */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-surface-1 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sortedJudges.length === 0 ? (
          <div className="text-center py-12">
            <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No judges yet</p>
          </div>
        ) : (
          sortedJudges.map((judge, index) => {
            const rank = index + 1;
            return (
              <motion.div
                key={judge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/judge/${judge.username}`}
                  className={`block border rounded-xl p-3 transition-all hover:scale-[1.01] ${getRankBg(rank)}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 flex justify-center">
                      {getRankIcon(rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className={`w-10 h-10 ${rank <= 3 ? 'ring-2 ring-gold/30' : ''}`}>
                      <AvatarImage src={judge.avatar_url || undefined} alt={judge.username} />
                      <AvatarFallback className="bg-gold/20 text-gold text-sm">
                        {judge.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium truncate">@{judge.username}</p>
                        {judge.verification_status && <VerifiedBadge size="sm" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <AuthorityBadge role="judge" size="sm" />
                        <LevelBadge level={judge.level} size="sm" />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <p className="font-display text-lg text-gold">
                        {sortBy === 'reviews' && judge.totalReviews}
                        {sortBy === 'weekly' && judge.weeklyReviews}
                        {sortBy === 'xp' && judge.xp.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sortBy === 'reviews' && 'reviews'}
                        {sortBy === 'weekly' && 'this week'}
                        {sortBy === 'xp' && 'XP'}
                      </p>
                    </div>

                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
