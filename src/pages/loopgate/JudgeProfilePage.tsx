import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Share2, ExternalLink, AlertCircle, Play } from 'lucide-react';
import { AuthorityGavel, ScopeTarget } from '@/components/loopgate/LoopgateIcons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import VerifiedBadge from '@/components/loopgate/VerifiedBadge';
import JudgeClassBadge from '@/components/loopgate/JudgeClassBadge';
import JudgeLevelBadge from '@/components/loopgate/JudgeLevelBadge';
import JudgeDivisionBadge from '@/components/loopgate/JudgeDivisionBadge';
import PublicJudgeVideos from '@/components/loopgate/PublicJudgeVideos';
import BottomNav from '@/components/loopgate/BottomNav';
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
  judge_bio: string | null;
  judge_specialty: string | null;
  judge_badge: string | null;
  review_style: string | null;
  judge_xp: number;
}

interface JudgeStats {
  totalReviews: number;
  avgScore: number;
  thisWeek: number;
  totalXPAwarded: number;
}

interface RecentReview {
  id: string;
  username: string;
  avatar_url: string | null;
  total_score: number;
  reviewed_at: string;
  submission_url: string;
  judge_comment: string | null;
}

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'S+', color: 'text-red-400' };
  if (score >= 80) return { grade: 'S', color: 'text-red-400' };
  if (score >= 70) return { grade: 'A', color: 'text-white' };
  if (score >= 60) return { grade: 'B', color: 'text-zinc-300' };
  if (score >= 50) return { grade: 'C', color: 'text-zinc-400' };
  if (score >= 40) return { grade: 'D', color: 'text-zinc-500' };
  return { grade: 'F', color: 'text-zinc-600' };
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

export default function JudgeProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile: userProfile } = useAuth();
  const navigate = useNavigate();

  const [judge, setJudge] = useState<JudgeProfile | null>(null);
  const [stats, setStats] = useState<JudgeStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJudge, setIsJudge] = useState(false);

  const [submissionUrl, setSubmissionUrl] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'verdicts' | 'videos'>('videos');

  useEffect(() => {
    if (username) fetchJudgeProfile();
  }, [username]);

  async function fetchJudgeProfile() {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, level, xp, verification_status, judge_bio, judge_specialty, judge_badge, review_style, judge_xp')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        setJudge(null);
        setLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profileData.id)
        .eq('role', 'judge')
        .single();

      if (!roleData) {
        setIsJudge(false);
        setJudge(profileData as any);
        setLoading(false);
        return;
      }

      setIsJudge(true);
      setJudge(profileData as any);

      const { data: reviewsData } = await supabase
        .from('review_requests')
        .select('id, total_score, reviewed_at, username, avatar_url, submission_url, judge_comment')
        .eq('judge_id', profileData.id)
        .eq('status', 'reviewed')
        .order('reviewed_at', { ascending: false });

      if (reviewsData) {
        setRecentReviews(reviewsData.slice(0, 15) as RecentReview[]);

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
          totalXPAwarded: reviewsData.length * 40,
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
    const lower = value.toLowerCase();
    if (lower.includes('tiktok.com') || lower.includes('vm.tiktok') || lower.includes('vt.tiktok')) {
      setPlatform('tiktok');
    } else if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
      setPlatform('instagram');
    } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      setPlatform('youtube');
    } else {
      const detected = detectPlatform(value);
      if (detected) setPlatform(detected);
    }
  };

  const handleSubmitRequest = async () => {
    if (!user || !userProfile || !judge) {
      toast.error('You must be logged in to submit');
      return;
    }
    
    const trimmedUrl = submissionUrl.trim();
    if (!trimmedUrl) {
      toast.error('Please paste your edit link');
      return;
    }

    let detectedPlatform = platform;
    if (!detectedPlatform) {
      const lower = trimmedUrl.toLowerCase();
      if (lower.includes('tiktok') || lower.includes('vm.tiktok') || lower.includes('vt.tiktok')) detectedPlatform = 'tiktok';
      else if (lower.includes('instagram') || lower.includes('instagr.am')) detectedPlatform = 'instagram';
      else if (lower.includes('youtube') || lower.includes('youtu.be')) detectedPlatform = 'youtube';
    }

    if (!detectedPlatform) {
      toast.error('Could not detect platform — use a TikTok, Instagram, or YouTube link');
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
          submission_url: trimmedUrl,
          platform: detectedPlatform,
          status: 'pending',
          judge_id: judge.id,
        });
      if (error) throw error;
      
      await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_amount: 10,
        p_action: 'review_request',
        p_description: `Requested review from @${judge.username}`,
      });
      
      toast.success(`Submitted! @${judge.username} will rate your edit.`);
      setSubmissionUrl('');
      setPlatform(null);
    } catch (error: any) {
      console.error('Error requesting review:', error);
      toast.error(error.message || 'Failed to submit — try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareText = `Get your edit rated by @${judge?.username} on Loopgate — ${stats?.totalReviews || 0} verdicts filed.\n\nloopgate.io/judge/${judge?.username}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${judge?.username} — QOI Judge`, text: shareText, url: window.location.href });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(shareText + `\n${window.location.href}`);
      toast.success('Copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!judge) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-foreground text-lg font-medium">@{username} not found</p>
        <Link to="/judges" className="text-sm text-red-400 hover:text-red-300 transition-colors">
          Browse Judges →
        </Link>
      </div>
    );
  }

  if (!isJudge) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-foreground text-lg font-medium">@{username} isn't a judge</p>
        <div className="flex gap-3">
          <Link to={`/editor/${judge.id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View Profile
          </Link>
          <Link to="/judges" className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Browse Judges →
          </Link>
        </div>
      </div>
    );
  }

  const judgeLevel = calculateJudgeLevel((judge as any).judge_xp || 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border/30">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </button>
        <span className="text-[10px] text-muted-foreground/50 tracking-[0.25em] uppercase">Judge</span>
        <button onClick={handleShare} className="p-1.5 -mr-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Share2 size={16} />
        </button>
      </div>

      {/* Profile header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-4">
          {judge.avatar_url ? (
            <img src={judge.avatar_url} alt={judge.username} className="w-16 h-16 object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 bg-red-950/60 flex items-center justify-center flex-shrink-0">
              <AuthorityGavel size={24} className="text-red-400/70" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground leading-tight">
                {judge.display_name || judge.username}
              </h1>
              {judge.verification_status && <VerifiedBadge size="sm" />}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">@{judge.username}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <JudgeDivisionBadge jxp={(judge as any).judge_xp || 0} size="sm" />
              <JudgeLevelBadge level={judgeLevel} size="sm" />
              {stats && <JudgeClassBadge reviewCount={stats.totalReviews} size="sm" />}
            </div>
          </div>
        </div>

        {judge.judge_bio && (
          <p className="text-[13px] text-muted-foreground mt-3 leading-relaxed">
            {judge.judge_bio}
          </p>
        )}

        {judge.judge_specialty && (
          <p className="text-xs text-muted-foreground/60 mt-2">
            Focus · {judge.judge_specialty}
          </p>
        )}
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 border-y border-border/30">
          <div className="py-4 text-center">
            <p className="text-xl font-semibold text-foreground tabular-nums">{stats.totalReviews}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Verdicts</p>
          </div>
          <div className="py-4 text-center border-x border-border/30">
            <p className="text-xl font-semibold text-foreground tabular-nums">{stats.avgScore}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Avg Score</p>
          </div>
          <div className="py-4 text-center">
            <p className="text-xl font-semibold text-red-400 tabular-nums">{stats.thisWeek}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">This Week</p>
          </div>
        </div>
      )}

      {/* Submit CTA — clean, single-purpose */}
      <div className="px-5 py-5">
        {user ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Drop your edit link — <span className="text-foreground">@{judge.username}</span> will score it and give feedback.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Paste TikTok, IG, or YouTube link"
                value={submissionUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="h-11 bg-background border-border/40 text-sm placeholder:text-muted-foreground/40 focus:border-red-800/60 flex-1"
              />
              <button
                onClick={handleSubmitRequest}
                disabled={!submissionUrl.trim() || submitting}
                className="h-11 px-5 bg-red-600 hover:bg-red-500 disabled:bg-muted disabled:text-muted-foreground text-white text-sm font-medium transition-colors flex items-center gap-2 shrink-0"
              >
                <Send size={14} />
                {submitting ? '...' : 'Submit'}
              </button>
            </div>
            {platform && (
              <p className="text-[11px] text-green-500/80">✓ {platform.charAt(0).toUpperCase() + platform.slice(1)} detected</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Get your edit rated by <span className="text-foreground">@{judge.username}</span> with a full score, grade, and feedback.
            </p>
            <Link to={`/login?returnTo=/judge/${username}`} className="block">
              <button className="w-full h-12 bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Play size={14} />
                Get Your Edit Rated
              </button>
            </Link>
            <Link to={`/start?returnTo=/judge/${username}`} className="block">
              <button className="w-full h-10 border border-border/40 text-muted-foreground text-xs hover:text-foreground hover:border-border transition-colors">
                New here? Create free account
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-y border-border/30">
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 h-11 text-xs font-medium tracking-wide transition-colors border-b-2 ${
            activeTab === 'videos'
              ? 'text-foreground border-red-500'
              : 'text-muted-foreground/50 border-transparent hover:text-muted-foreground'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => setActiveTab('verdicts')}
          className={`flex-1 h-11 text-xs font-medium tracking-wide transition-colors border-b-2 ${
            activeTab === 'verdicts'
              ? 'text-foreground border-red-500'
              : 'text-muted-foreground/50 border-transparent hover:text-muted-foreground'
          }`}
        >
          Verdicts{stats ? ` (${stats.totalReviews})` : ''}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'videos' ? (
        <PublicJudgeVideos userId={judge.id} />
      ) : (
        <div>
          {recentReviews.length > 0 ? (
            <div className="divide-y divide-border/20">
              {recentReviews.map((review, i) => {
                const { grade, color } = getGrade(review.total_score || 0);
                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    {/* Grade pill */}
                    <span className={`w-8 text-center text-sm font-semibold ${color}`}>{grade}</span>

                    {/* Avatar */}
                    {review.avatar_url ? (
                      <img src={review.avatar_url} alt="" className="w-7 h-7 object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium shrink-0">
                        {review.username[0]?.toUpperCase()}
                      </div>
                    )}

                    {/* Name + comment */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">@{review.username}</p>
                      {review.judge_comment && (
                        <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">"{review.judge_comment}"</p>
                      )}
                    </div>

                    {/* Score */}
                    <span className="text-sm text-muted-foreground tabular-nums shrink-0">{review.total_score}</span>

                    {/* Link out */}
                    <a href={review.submission_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                      <ExternalLink size={13} />
                    </a>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <AuthorityGavel className="text-muted-foreground/20" size={28} />
              <p className="text-sm text-muted-foreground/50 mt-3">No verdicts yet</p>
              <p className="text-xs text-muted-foreground/30 mt-1">Be the first to get rated</p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
