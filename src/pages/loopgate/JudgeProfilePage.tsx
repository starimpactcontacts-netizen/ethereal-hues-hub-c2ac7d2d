import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Share2, ExternalLink, AlertCircle } from 'lucide-react';
import { AuthorityGavel, ScopeTarget, ArrowLink } from '@/components/loopgate/LoopgateIcons';
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!judge) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-zinc-600 mb-4" />
        <h1 className="font-display text-2xl mb-2 text-white">Not Found</h1>
        <p className="text-zinc-500 mb-6">@{username} doesn't exist or is not a judge.</p>
        <Link to="/judges" className="px-4 py-2 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-900 transition-colors">
          View Bureau
        </Link>
      </div>
    );
  }

  if (!isJudge) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-zinc-600 mb-4" />
        <h1 className="font-display text-2xl mb-2 text-white">Not a Judge</h1>
        <p className="text-zinc-500 mb-6">@{username} is not currently in the Bureau.</p>
        <div className="flex gap-2">
          <Link to={`/editor/${judge.id}`} className="px-4 py-2 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-900 transition-colors">
            View Profile
          </Link>
          <Link to="/judges" className="px-4 py-2 bg-red-700 text-white text-sm hover:bg-red-600 transition-colors">
            View Bureau
          </Link>
        </div>
      </div>
    );
  }

  const judgeLevel = calculateJudgeLevel((judge as any).judge_xp || 0);

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* ═══ RED TOP ACCENT ═══ */}
      <div className="h-[2px] bg-red-700" />

      {/* ═══ HEADER BAR ═══ */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/5 transition-colors">
          <ArrowLeft size={18} className="text-zinc-400" />
        </button>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-mono">QOI Authority</span>
        </div>
        <button onClick={handleShare} className="p-1.5 hover:bg-white/5 transition-colors">
          <Share2 size={16} className="text-zinc-400" />
        </button>
      </div>

      {/* ═══ DOSSIER HEADER — compact, institutional ═══ */}
      <div className="px-4 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {judge.avatar_url ? (
              <img
                src={judge.avatar_url}
                alt={judge.username}
                className="w-20 h-20 rounded-sm object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-sm bg-red-950 flex items-center justify-center">
                <AuthorityGavel size={28} className="text-red-400" />
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-xl text-white tracking-wide">
                {(judge.display_name || judge.username).toUpperCase()}
              </h1>
              {judge.verification_status && <VerifiedBadge size="sm" />}
            </div>
            <p className="text-[11px] text-zinc-500 mb-2">@{judge.username}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <JudgeDivisionBadge jxp={(judge as any).judge_xp || 0} size="sm" />
              <JudgeLevelBadge level={judgeLevel} size="sm" />
              {stats && <JudgeClassBadge reviewCount={stats.totalReviews} size="sm" />}
            </div>
          </div>
        </div>

        {/* Bio line */}
        {judge.judge_bio && (
          <p className="text-[12px] text-zinc-400 mt-3 border-l-2 border-red-800 pl-3 italic leading-relaxed">
            {judge.judge_bio}
          </p>
        )}

        {/* Specialty */}
        {judge.judge_specialty && (
          <div className="mt-3 flex items-center gap-2">
            <ScopeTarget size={12} className="text-zinc-600" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Focus:</span>
            <span className="text-[11px] text-zinc-300">{judge.judge_specialty}</span>
          </div>
        )}
      </div>

      {/* ═══ STATS — wire-service row ═══ */}
      {stats && (
        <>
          <div className="h-px bg-zinc-800" />
          <div className="grid grid-cols-3 gap-px bg-zinc-800">
            <div className="bg-black p-3 text-center">
              <div className="text-2xl font-display text-white">{stats.totalReviews}</div>
              <div className="text-[8px] text-zinc-600 uppercase tracking-wider font-mono">Verdicts</div>
            </div>
            <div className="bg-black p-3 text-center">
              <div className="text-2xl font-display text-white">{stats.avgScore}</div>
              <div className="text-[8px] text-zinc-600 uppercase tracking-wider font-mono">Avg Score</div>
            </div>
            <div className="bg-black p-3 text-center">
              <div className="text-2xl font-display text-red-400">{stats.thisWeek}</div>
              <div className="text-[8px] text-zinc-600 uppercase tracking-wider font-mono">This Week</div>
            </div>
          </div>
          <div className="h-px bg-zinc-800" />
        </>
      )}

      {/* ═══ SUBMIT CTA — RIGHT AT TOP, institutional ═══ */}
      <div className="px-4 py-4">
        <div className="border border-red-800/50 bg-red-950/20">
          <div className="h-0.5 bg-red-700" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Send size={14} className="text-red-400" />
              <h2 className="font-display text-sm uppercase tracking-[0.15em] text-white">Submit for Official Review</h2>
            </div>

            {user ? (
              <div className="space-y-3">
                <Input
                  placeholder="Paste TikTok, Instagram, or YouTube URL..."
                  value={submissionUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="h-10 bg-black border-zinc-800 text-sm placeholder:text-zinc-700 focus:border-red-800"
                />
                {platform && (
                  <p className="text-[10px] text-green-500 font-mono">
                    ✓ {platform.toUpperCase()} DETECTED
                  </p>
                )}
                <button
                  onClick={handleSubmitRequest}
                  disabled={!submissionUrl.trim() || !platform || submitting}
                  className="w-full py-3 bg-red-700 hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-display uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  {submitting ? 'Filing...' : 'File Review Request'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
                  Submit your edit and @{judge.username} will score, grade, and give feedback. You earn +15 XP.
                </p>
                <Link to={`/login?returnTo=/judge/${username}`}>
                  <button className="w-full py-3 bg-red-700 hover:bg-red-600 text-white text-sm font-display uppercase tracking-[0.15em] transition-colors">
                    Login & Submit Your Edit
                  </button>
                </Link>
                <Link to={`/start?returnTo=/judge/${username}`}>
                  <button className="w-full py-2.5 border border-zinc-700 text-zinc-400 text-[11px] font-display uppercase tracking-wider hover:bg-zinc-900 transition-colors">
                    New Here? Create Free Account
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TAB BAR — Videos / Verdicts ═══ */}
      <div className="border-t border-zinc-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-3 text-center text-[11px] font-display uppercase tracking-[0.2em] transition-colors border-b-2 ${
              activeTab === 'videos'
                ? 'text-white border-b-red-600'
                : 'text-zinc-600 border-b-transparent hover:text-zinc-400'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab('verdicts')}
            className={`flex-1 py-3 text-center text-[11px] font-display uppercase tracking-[0.2em] transition-colors border-b-2 ${
              activeTab === 'verdicts'
                ? 'text-white border-b-red-600'
                : 'text-zinc-600 border-b-transparent hover:text-zinc-400'
            }`}
          >
            Verdicts ({stats?.totalReviews || 0})
          </button>
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      {activeTab === 'videos' ? (
        <PublicJudgeVideos userId={judge.id} />
      ) : (
        <div>
          {recentReviews.length > 0 ? (
            <div>
              {/* Column header */}
              <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-900">
                <span className="text-[8px] text-zinc-700 uppercase tracking-wider font-mono w-8">Grade</span>
                <span className="text-[8px] text-zinc-700 uppercase tracking-wider font-mono flex-1">Editor</span>
                <span className="text-[8px] text-zinc-700 uppercase tracking-wider font-mono w-12 text-right">Score</span>
                <span className="text-[8px] text-zinc-700 uppercase tracking-wider font-mono w-16 text-right">Date</span>
              </div>

              {recentReviews.map((review, i) => {
                const { grade, color } = getGrade(review.total_score || 0);
                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="group"
                  >
                    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                      {/* Grade */}
                      <div className={`w-8 text-center font-display text-sm ${color}`}>
                        {grade}
                      </div>

                      {/* Editor */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {review.avatar_url ? (
                          <img src={review.avatar_url} alt="" className="w-6 h-6 rounded-sm object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-sm bg-zinc-900 flex items-center justify-center text-[9px] text-zinc-500 font-bold">
                            {review.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-[12px] text-zinc-300 truncate">@{review.username}</span>
                      </div>

                      {/* Score */}
                      <span className="text-[12px] text-zinc-400 font-mono w-12 text-right">
                        {review.total_score}
                      </span>

                      {/* Date */}
                      <span className="text-[10px] text-zinc-600 font-mono w-16 text-right">
                        {new Date(review.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>

                      {/* Link */}
                      <a
                        href={review.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-1 hover:bg-white/5 transition-colors"
                      >
                        <ExternalLink size={12} className="text-zinc-600" />
                      </a>
                    </div>

                    {/* Comment preview */}
                    {review.judge_comment && (
                      <div className="px-4 pb-2 pl-16">
                        <p className="text-[10px] text-zinc-600 italic line-clamp-1">"{review.judge_comment}"</p>
                      </div>
                    )}

                    <div className="h-px bg-zinc-900 ml-12" />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 mx-auto border border-zinc-800 flex items-center justify-center mb-3">
                <AuthorityGavel className="text-zinc-600" size={20} />
              </div>
              <p className="font-display text-xs tracking-wider text-zinc-400 mb-1">NO VERDICTS FILED</p>
              <p className="text-[10px] text-zinc-600">
                Be the first to get reviewed by @{judge.username}
              </p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
