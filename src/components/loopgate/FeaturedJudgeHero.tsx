import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import VerifiedBadge from './VerifiedBadge';
import JudgeDivisionBadge from './JudgeDivisionBadge';
import { AuthorityGavel } from './LoopgateIcons';

interface FeaturedJudge {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verification_status: boolean;
  judge_xp: number;
  judge_review_count: number;
  weeklyReviews: number;
}

interface TrendingVideo {
  id: string;
  video_url: string;
  platform: string;
  title: string | null;
  thumbnail_url: string | null;
  current_views: number | null;
  judge_id: string;
  submitted_at: string;
}

// Editorial headlines — wire service style
const HEADLINES = [
  (name: string, reviews: number) => `${name} leads the week with ${reviews} official verdicts filed`,
  (name: string) => `Inside the authority of ${name} — the standard-bearer of QOI`,
  (name: string) => `The Bureau's top operative: ${name} sets the pace`,
  (name: string, reviews: number) => `${reviews} reviews. Zero compromise. ${name} delivers again.`,
  (name: string) => `Why ${name} is the name every editor watches for`,
];

function getHeadline(name: string, reviews: number): string {
  const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % HEADLINES.length;
  return HEADLINES[idx](name, reviews);
}

function formatViews(v: number | null): string {
  if (!v) return '0';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

export default function FeaturedJudgeHero() {
  const [judge, setJudge] = useState<FeaturedJudge | null>(null);
  const [videos, setVideos] = useState<TrendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeaturedJudge();
  }, []);

  async function fetchFeaturedJudge() {
    try {
      const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'judge');

      if (!judgeRoles?.length) { setLoading(false); return; }

      const judgeIds = judgeRoles.map(r => r.user_id);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: weeklyData } = await supabase
        .from('review_requests')
        .select('judge_id')
        .eq('status', 'reviewed')
        .in('judge_id', judgeIds)
        .gte('reviewed_at', oneWeekAgo.toISOString());

      const weeklyMap: Record<string, number> = {};
      (weeklyData || []).forEach(r => {
        if (r.judge_id) weeklyMap[r.judge_id] = (weeklyMap[r.judge_id] || 0) + 1;
      });

      let topId = judgeIds[0];
      let topCount = 0;
      Object.entries(weeklyMap).forEach(([id, count]) => {
        if (count > topCount) { topId = id; topCount = count; }
      });

      if (topCount === 0) {
        const { data: topProfile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, verification_status, judge_xp, judge_review_count')
          .in('id', judgeIds)
          .order('judge_xp', { ascending: false })
          .limit(1)
          .single();

        if (topProfile) setJudge({ ...topProfile, weeklyReviews: 0 });
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, verification_status, judge_xp, judge_review_count')
          .eq('id', topId)
          .single();

        if (profile) setJudge({ ...profile, weeklyReviews: topCount });
      }

      const { data: vids } = await supabase
        .from('judge_rating_videos')
        .select('id, video_url, platform, title, thumbnail_url, current_views, judge_id, submitted_at')
        .eq('judge_id', topId)
        .order('submitted_at', { ascending: false })
        .limit(8);

      setVideos(vids || []);
    } catch (e) {
      console.error('Featured judge fetch error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="h-40 bg-zinc-950 animate-pulse" />
      </div>
    );
  }

  if (!judge) return null;

  const displayName = judge.display_name || judge.username;
  const headline = getHeadline(displayName, judge.weeklyReviews);

  return (
    <div className="border-b border-zinc-800">
      <div className="px-4 pt-4 pb-4">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-red-700" />
          <span className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-mono">Featured Authority</span>
          {judge.weeklyReviews > 0 && (
            <span className="text-[8px] px-2 py-0.5 border border-red-800 text-red-400 font-mono uppercase tracking-wider">
              Active
            </span>
          )}
        </div>

        {/* Editorial layout */}
        <Link to={`/judge/${judge.username}`} className="block group">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-4 mb-4"
          >
            {/* Portrait — newspaper style */}
            <div className="relative shrink-0">
              {judge.avatar_url ? (
                <img
                  src={judge.avatar_url}
                  alt={displayName}
                  className="w-20 h-24 object-cover grayscale-[40%] group-hover:grayscale-0 transition-all"
                />
              ) : (
                <div className="w-20 h-24 bg-zinc-900 flex items-center justify-center border border-zinc-800">
                  <AuthorityGavel size={28} className="text-zinc-600" />
                </div>
              )}
              {/* Red corner accent */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-700" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-700" />
            </div>

            {/* Name + credentials */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <h2 className="font-display text-xl text-white tracking-wide">{displayName.toUpperCase()}</h2>
                {judge.verification_status && <VerifiedBadge />}
              </div>
              <p className="text-[10px] text-zinc-600 mb-2 font-mono">@{judge.username}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <JudgeDivisionBadge jxp={judge.judge_xp || 0} size="sm" />
                <span className="text-[10px] text-zinc-500 font-mono">{(judge.judge_xp || 0).toLocaleString()} JXP</span>
                <span className="text-[10px] text-zinc-600">·</span>
                <span className="text-[10px] text-zinc-500 font-mono">{judge.judge_review_count || 0} verdicts</span>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Headline — editorial */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="font-display text-base leading-snug text-zinc-200 mb-1 tracking-wide">
            {headline.toUpperCase()}
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
              The Bureau · Weekly Authority Report
            </p>
          </div>
        </motion.div>

        {/* Trending videos — film strip */}
        {videos.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-mono">Filed Content</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>
            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {videos.map((vid, i) => (
                <motion.a
                  key={vid.id}
                  href={vid.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="shrink-0 w-[130px] group"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="relative aspect-[9/16] overflow-hidden bg-zinc-950 border border-zinc-800 group-hover:border-red-800/50 transition-colors mb-1.5">
                    {vid.thumbnail_url ? (
                      <img
                        src={vid.thumbnail_url}
                        alt={vid.title || 'Video'}
                        className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xl text-zinc-700">▶</span>
                      </div>
                    )}
                    {vid.current_views != null && vid.current_views > 0 && (
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 text-[8px] text-zinc-300 font-mono">
                        {formatViews(vid.current_views)}
                      </div>
                    )}
                    <div className="absolute top-1 right-1 px-1 py-0.5 bg-red-900/80 text-[7px] text-red-200 uppercase font-mono tracking-wider">
                      {vid.platform}
                    </div>
                  </div>
                  <p className="text-[9px] text-zinc-600 line-clamp-2 leading-tight group-hover:text-zinc-400 transition-colors font-mono">
                    {vid.title || 'Rating Video'}
                  </p>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
