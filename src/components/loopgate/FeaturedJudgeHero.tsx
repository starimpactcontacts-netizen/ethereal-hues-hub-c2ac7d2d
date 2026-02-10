import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import VerifiedBadge from './VerifiedBadge';
import JudgeClassBadge from './JudgeClassBadge';
import { AuthorityGavel } from './LoopgateIcons';
import { cn } from '@/lib/utils';

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

// Dynamic Forbes-style headlines
const HEADLINES = [
  (name: string, reviews: number) => `${name} Dominates the Week — ${reviews} Reviews & Counting`,
  (name: string) => `${name} Is Setting the Standard for Every Judge on Loopgate`,
  (name: string) => `The Authority Has Spoken: ${name} Leads This Week's Judge Rankings`,
  (name: string, reviews: number) => `With ${reviews} Reviews This Week, ${name} Is on Another Level`,
  (name: string) => `${name} — The Name Every Editor Wants on Their Scorecard`,
];

function getHeadline(name: string, reviews: number): string {
  const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % HEADLINES.length; // rotates every 6h
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
      // Get judge user IDs
      const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'judge');

      if (!judgeRoles?.length) { setLoading(false); return; }

      const judgeIds = judgeRoles.map(r => r.user_id);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get weekly reviews per judge
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

      // Find top weekly judge
      let topId = judgeIds[0];
      let topCount = 0;
      Object.entries(weeklyMap).forEach(([id, count]) => {
        if (count > topCount) { topId = id; topCount = count; }
      });

      // Fallback: if no weekly activity, pick by highest judge_xp
      if (topCount === 0) {
        const { data: topProfile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, verification_status, judge_xp, judge_review_count')
          .in('id', judgeIds)
          .order('judge_xp', { ascending: false })
          .limit(1)
          .single();

        if (topProfile) {
          setJudge({ ...topProfile, weeklyReviews: 0 });
        }
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, verification_status, judge_xp, judge_review_count')
          .eq('id', topId)
          .single();

        if (profile) {
          setJudge({ ...profile, weeklyReviews: topCount });
        }
      }

      // Fetch trending videos from top judge
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
        <div className="h-48 bg-surface-1 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!judge) return null;

  const displayName = judge.display_name || judge.username;
  const headline = getHeadline(displayName, judge.weeklyReviews);

  return (
    <div className="relative overflow-hidden border-b border-gold/10">
      {/* Ambient gold glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold/8 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-gold/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 px-4 pt-5 pb-4">
        {/* Tag */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4"
        >
          <div className="px-2.5 py-1 bg-gold/15 border border-gold/25 rounded text-[9px] text-gold font-bold uppercase tracking-[0.25em]">
            Featured Judge
          </div>
          {judge.weeklyReviews > 0 && (
            <div className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-[9px] text-orange-400 font-semibold uppercase tracking-wider">
              🔥 Trending
            </div>
          )}
        </motion.div>

        {/* Big face + info */}
        <Link to={`/judge/${judge.username}`} className="block">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-start gap-4 mb-4"
          >
            {/* Large avatar */}
            <div className="relative shrink-0">
              {judge.avatar_url ? (
                <img
                  src={judge.avatar_url}
                  alt={displayName}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-gold/40 shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center">
                  <AuthorityGavel size={36} className="text-gold" />
                </div>
              )}
              {/* Gold corner accent */}
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-gold/50 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-gold/50 rounded-bl-lg" />
            </div>

            {/* Name + class + stats */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-1.5 mb-1">
                <h2 className="font-display text-xl text-white truncate">{displayName}</h2>
                {judge.verification_status && <VerifiedBadge />}
              </div>
              <p className="text-xs text-muted-foreground mb-2">@{judge.username}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <JudgeClassBadge reviewCount={judge.judge_review_count || 0} size="sm" />
                <span className="text-[10px] text-gold font-bold">{(judge.judge_xp || 0).toLocaleString()} JXP</span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-muted-foreground">{judge.judge_review_count || 0} reviews</span>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Forbes-style headline */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-display text-base leading-snug text-white/90 mb-1"
        >
          {headline}
        </motion.h3>
        <p className="text-[11px] text-muted-foreground mb-4">
          Loopgate Weekly · Judge Authority Report
        </p>

        {/* Trending videos carousel */}
        {videos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1 h-3 bg-gold rounded-full" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Latest on the Loop</span>
            </div>
            <div
              ref={scrollRef}
              className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
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
                  className="shrink-0 w-[140px] group"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-surface-1 border border-border group-hover:border-gold/30 transition-colors mb-1.5">
                    {vid.thumbnail_url ? (
                      <img
                        src={vid.thumbnail_url}
                        alt={vid.title || 'Video'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gold/10 to-surface-1">
                        <span className="text-2xl">🎬</span>
                      </div>
                    )}
                    {/* Views overlay */}
                    {vid.current_views != null && vid.current_views > 0 && (
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[9px] text-white font-semibold">
                        {formatViews(vid.current_views)} views
                      </div>
                    )}
                    {/* Platform badge */}
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[8px] text-white/80 uppercase font-bold tracking-wider">
                      {vid.platform}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight group-hover:text-foreground transition-colors">
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
