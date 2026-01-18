import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, Star, ExternalLink, Trophy, TrendingUp, Users, Clock, Send, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import AuthorityBadge from '@/components/loopgate/AuthorityBadge';
import LevelBadge from '@/components/loopgate/LevelBadge';
import VerifiedBadge from '@/components/loopgate/VerifiedBadge';
import { detectPlatform } from '@/lib/urlValidation';

interface JudgeProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  xp: number;
  verification_status: boolean | null;
}

interface JudgeStats {
  totalReviews: number;
  avgScore: number;
  thisWeek: number;
}

interface RecentReview {
  id: string;
  username: string;
  avatar_url: string | null;
  total_score: number;
  reviewed_at: string;
  submission_url: string;
}

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'S+', color: 'text-gold' };
  if (score >= 80) return { grade: 'S', color: 'text-gold' };
  if (score >= 70) return { grade: 'A', color: 'text-green-400' };
  if (score >= 60) return { grade: 'B', color: 'text-blue-400' };
  if (score >= 50) return { grade: 'C', color: 'text-orange-400' };
  if (score >= 40) return { grade: 'D', color: 'text-orange-500' };
  return { grade: 'F', color: 'text-red-500' };
}

export default function JudgeProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile: userProfile } = useAuth();
  
  const [judge, setJudge] = useState<JudgeProfile | null>(null);
  const [stats, setStats] = useState<JudgeStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJudge, setIsJudge] = useState(false);
  
  // Submit form state
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (username) {
      fetchJudgeProfile();
    }
  }, [username]);

  async function fetchJudgeProfile() {
    setLoading(true);
    try {
      // Find user by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, level, xp, verification_status')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        setJudge(null);
        setLoading(false);
        return;
      }

      // Check if they have judge role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profileData.id)
        .eq('role', 'judge')
        .single();

      if (!roleData) {
        setIsJudge(false);
        setJudge(profileData);
        setLoading(false);
        return;
      }

      setIsJudge(true);
      setJudge(profileData);

      // Fetch judge stats
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('review_requests')
        .select('id, total_score, reviewed_at, username, avatar_url, submission_url')
        .eq('judge_id', profileData.id)
        .eq('status', 'reviewed')
        .order('reviewed_at', { ascending: false });

      if (!reviewsError && reviewsData) {
        setRecentReviews(reviewsData.slice(0, 10) as RecentReview[]);
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weeklyReviews = reviewsData.filter(r => 
          r.reviewed_at && new Date(r.reviewed_at) >= oneWeekAgo
        );
        
        const avgScore = reviewsData.length > 0
          ? reviewsData.reduce((acc, r) => acc + (r.total_score || 0), 0) / reviewsData.length
          : 0;

        setStats({
          totalReviews: reviewsData.length,
          avgScore: Math.round(avgScore * 10) / 10,
          thisWeek: weeklyReviews.length,
        });
      }
    } catch (error) {
      console.error('Error fetching judge profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleUrlChange = (value: string) => {
    setSubmissionUrl(value);
    const detected = detectPlatform(value);
    if (detected) setPlatform(detected);
  };

  const handleSubmitRequest = async () => {
    if (!user || !userProfile || !submissionUrl.trim() || !platform || !judge) {
      toast.error('Please enter a valid TikTok, Instagram, or YouTube URL');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('review_requests')
        .insert({
          user_id: user.id,
          username: userProfile.username,
          avatar_url: userProfile.avatar_url || null,
          submission_url: submissionUrl.trim(),
          platform,
          status: 'pending',
        });

      if (error) throw error;

      toast.success(`Review requested from @${judge.username}!`);
      setSubmissionUrl('');
      setPlatform(null);
    } catch (error: any) {
      console.error('Error requesting review:', error);
      toast.error(error.message || 'Failed to request review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!judge) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="font-display text-2xl mb-2">Judge Not Found</h1>
        <p className="text-muted-foreground mb-6">@{username} doesn't exist or is not a judge.</p>
        <Link to="/judges">
          <Button variant="outline">View All Judges</Button>
        </Link>
      </div>
    );
  }

  if (!isJudge) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
        <h1 className="font-display text-2xl mb-2">Not a Judge</h1>
        <p className="text-muted-foreground mb-6">@{username} is not currently a Loopgate judge.</p>
        <div className="flex gap-2">
          <Link to={`/editor/${judge.id}`}>
            <Button variant="outline">View Profile</Button>
          </Link>
          <Link to="/judges">
            <Button className="bg-gold text-black hover:bg-gold/90">View All Judges</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-gold/10 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(218,165,32,0.15),transparent_50%)]" />
        
        <div className="relative px-4 pt-8 pb-6 text-center">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative inline-block mb-4"
          >
            <Avatar className="w-24 h-24 border-4 border-gold/50 ring-4 ring-gold/20">
              <AvatarImage src={judge.avatar_url || undefined} alt={judge.username} />
              <AvatarFallback className="bg-gold/20 text-gold text-2xl">
                {judge.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1">
              <Gavel className="w-8 h-8 p-1.5 bg-gold text-black rounded-full" />
            </div>
          </motion.div>

          {/* Name & Badges */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="font-display text-2xl">@{judge.username}</h1>
            {judge.verification_status && <VerifiedBadge size="md" />}
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-3">
            <AuthorityBadge role="judge" size="sm" />
            <LevelBadge level={judge.level} size="sm" />
          </div>

          {judge.bio && (
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
              {judge.bio}
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="px-4 -mt-2 mb-6">
          <div className="grid grid-cols-3 gap-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface-1 border border-border rounded-xl p-3 text-center"
            >
              <Trophy className="w-5 h-5 text-gold mx-auto mb-1" />
              <p className="text-2xl font-display text-gold">{stats.totalReviews}</p>
              <p className="text-xs text-muted-foreground">Total Reviews</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface-1 border border-border rounded-xl p-3 text-center"
            >
              <Star className="w-5 h-5 text-gold mx-auto mb-1" />
              <p className="text-2xl font-display">{stats.avgScore}</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface-1 border border-border rounded-xl p-3 text-center"
            >
              <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-2xl font-display text-green-400">{stats.thisWeek}</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </motion.div>
          </div>
        </div>
      )}

      {/* Submit Your Edit Section */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-gold/10 to-transparent border border-gold/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-5 h-5 text-gold" />
            <h2 className="font-display text-lg">Request Review</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Submit your TikTok edit for @{judge.username} to review. Get your score and appear in their content!
          </p>

          {user ? (
            <div className="space-y-3">
              <Input
                placeholder="Paste your TikTok, Instagram, or YouTube URL..."
                value={submissionUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="bg-surface-0 border-border"
              />
              {platform && (
                <p className="text-xs text-green-400">
                  ✓ {platform.charAt(0).toUpperCase() + platform.slice(1)} link detected
                </p>
              )}
              <Button
                onClick={handleSubmitRequest}
                disabled={!submissionUrl.trim() || !platform || submitting}
                className="w-full bg-gold hover:bg-gold/90 text-black font-semibold"
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button className="w-full bg-gold hover:bg-gold/90 text-black font-semibold">
                Login to Submit
              </Button>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <div className="px-4">
          <h2 className="font-display text-lg mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Reviews
          </h2>
          
          <div className="space-y-2">
            {recentReviews.map((review, i) => {
              const { grade, color } = getGrade(review.total_score || 0);
              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="bg-surface-1 border border-border rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={review.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {review.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">@{review.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.reviewed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-display text-lg ${color}`}>{grade}</p>
                      <p className="text-xs text-muted-foreground">{review.total_score}/100</p>
                    </div>
                    <a
                      href={review.submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:text-gold/80"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
