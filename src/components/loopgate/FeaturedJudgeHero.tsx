import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import VerifiedBadge from './VerifiedBadge';
import JudgeDivisionBadge from './JudgeDivisionBadge';
import { AuthorityGavel, CrownSigil, ArrowLink } from './LoopgateIcons';

interface FeaturedJudge {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verification_status: boolean;
  judge_xp: number;
  judge_review_count: number;
  judge_bio: string | null;
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

// Template biographies for judges without custom bios
function getTemplateBio(name: string, reviews: number, jxp: number): string {
  if (reviews >= 50) return `${name} is one of Loopgate's most prolific authorities, having filed over ${reviews} official verdicts across all divisions. Known for detailed, uncompromising assessments that have shaped the competitive editing landscape.`;
  if (reviews >= 20) return `A rising force in the Bureau, ${name} has established a reputation for precision and consistency across ${reviews} career verdicts. Their evaluations are trusted by editors seeking honest, high-standard feedback.`;
  if (reviews >= 5) return `${name} is an active member of the Bureau's reviewing corps with ${reviews} verdicts on record. Committed to upholding the QOI standard and providing actionable insight to the editing community.`;
  return `${name} is a newly appointed authority in the Bureau. Currently building their verdict record and establishing their reviewing identity within the Loopgate ecosystem.`;
}

// Forbes-style editorial headlines
const HEADLINES = [
  (name: string, reviews: number) => `${name} Leads The Week With ${reviews} Official Verdicts Filed`,
  (name: string) => `Inside The Authority Of ${name} — The Bureau's Standard-Bearer`,
  (name: string) => `The Bureau's Top Operative: How ${name} Sets The Pace`,
  (name: string, reviews: number) => `${reviews} Reviews. Zero Compromise. ${name} Delivers Again.`,
  (name: string) => `Why ${name} Is The Name Every Editor Watches For`,
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
  const [featuredSquad, setFeaturedSquad] = useState<FeaturedJudge[]>([]);
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

      const [{ data: weeklyData }, { data: profiles }] = await Promise.all([
        supabase
          .from('review_requests')
          .select('judge_id')
          .eq('status', 'reviewed')
          .in('judge_id', judgeIds)
          .gte('reviewed_at', oneWeekAgo.toISOString()),
        supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, verification_status, judge_xp, judge_review_count, judge_bio')
          .in('id', judgeIds)
          .eq('is_banned', false)
          .eq('is_hidden', false),
      ]);

      if (!profiles?.length) { setLoading(false); return; }

      const weeklyMap: Record<string, number> = {};
      (weeklyData || []).forEach(r => {
        if (r.judge_id) weeklyMap[r.judge_id] = (weeklyMap[r.judge_id] || 0) + 1;
      });

      // Build all judge entries
      const allJudges: FeaturedJudge[] = profiles.map(p => ({
        ...p,
        judge_xp: p.judge_xp || 0,
        judge_review_count: p.judge_review_count || 0,
        judge_bio: p.judge_bio || null,
        weeklyReviews: weeklyMap[p.id] || 0,
      }));

      // Sort by weekly activity then JXP
      allJudges.sort((a, b) => b.weeklyReviews - a.weeklyReviews || b.judge_xp - a.judge_xp);

      const topJudge = allJudges[0];
      setJudge(topJudge);

      // Featured squad = top 4 (excluding #1) sorted by JXP
      const squad = allJudges
        .filter(j => j.id !== topJudge.id)
        .sort((a, b) => b.judge_xp - a.judge_xp)
        .slice(0, 4);
      setFeaturedSquad(squad);

      // Fetch videos for cover judge
      const { data: vids } = await supabase
        .from('judge_rating_videos')
        .select('id, video_url, platform, title, thumbnail_url, current_views, judge_id, submitted_at')
        .eq('judge_id', topJudge.id)
        .order('submitted_at', { ascending: false })
        .limit(6);

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
        <div className="h-48 bg-zinc-950 animate-pulse" />
      </div>
    );
  }

  if (!judge) return null;

  const displayName = judge.display_name || judge.username;
  const headline = getHeadline(displayName, judge.weeklyReviews);
  const bio = judge.judge_bio || getTemplateBio(displayName, judge.judge_review_count || 0, judge.judge_xp || 0);
  const todayDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="border-b border-zinc-800">
      {/* ═══════════ COVER STORY — FORBES STYLE ═══════════ */}
      <div className="px-4 pt-4 pb-5">
        {/* Dateline */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-red-700" />
          <span className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-mono">Cover Story</span>
          <span className="text-[9px] text-zinc-700 font-mono">·</span>
          <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">{todayDate}</span>
        </div>

        {/* Forbes-style editorial headline FIRST */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-2xl leading-tight text-white mb-4 tracking-wide"
        >
          {headline.toUpperCase()}
        </motion.h2>

        {/* Cover layout: large portrait + credentials */}
        <Link to={`/judge/${judge.username}`} className="block group">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex gap-4 mb-4"
          >
            {/* Large portrait — magazine cover */}
            <div className="relative shrink-0">
              {judge.avatar_url ? (
                <img
                  src={judge.avatar_url}
                  alt={displayName}
                  className="w-28 h-36 object-cover grayscale-[30%] group-hover:grayscale-0 transition-all"
                />
              ) : (
                <div className="w-28 h-36 bg-zinc-900 flex items-center justify-center border border-zinc-800">
                  <AuthorityGavel size={36} className="text-zinc-600" />
                </div>
              )}
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-700" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-700" />
            </div>

            {/* Identity + stats */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="font-display text-xl text-white tracking-wide">{displayName.toUpperCase()}</h3>
                {judge.verification_status && <VerifiedBadge />}
              </div>
              <p className="text-[10px] text-zinc-600 mb-3 font-mono">@{judge.username}</p>

              <JudgeDivisionBadge jxp={judge.judge_xp || 0} size="sm" />

              {/* Wire-service stat row */}
              <div className="mt-3 grid grid-cols-3 gap-px bg-zinc-800">
                <div className="bg-black py-2 px-1.5 text-center">
                  <div className="text-base font-display text-white">{judge.judge_review_count || 0}</div>
                  <div className="text-[7px] text-zinc-600 uppercase tracking-wider font-mono">Verdicts</div>
                </div>
                <div className="bg-black py-2 px-1.5 text-center">
                  <div className="text-base font-display text-white">{(judge.judge_xp || 0).toLocaleString()}</div>
                  <div className="text-[7px] text-zinc-600 uppercase tracking-wider font-mono">JXP</div>
                </div>
                <div className="bg-black py-2 px-1.5 text-center">
                  <div className="text-base font-display text-red-400">{judge.weeklyReviews}</div>
                  <div className="text-[7px] text-zinc-600 uppercase tracking-wider font-mono">This Week</div>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Editorial biography */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-4"
        >
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {bio}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">
              The Bureau · Weekly Authority Report
            </p>
          </div>
        </motion.div>

        {/* Filed Content — video strip */}
        {videos.length > 0 && (
          <div className="mt-3">
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
                  className="shrink-0 w-[120px] group"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="relative aspect-[9/16] overflow-hidden bg-zinc-950 border border-zinc-800 group-hover:border-red-800/50 transition-colors mb-1">
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

      {/* ═══════════ FEATURED SQUAD — 2x2 GRID ═══════════ */}
      {featuredSquad.length > 0 && (
        <div className="border-t border-zinc-800">
          <div className="px-4 pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-mono">Featured Officials</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {featuredSquad.map((j, i) => {
                const name = j.display_name || j.username;
                const squadBio = j.judge_bio || getTemplateBio(name, j.judge_review_count || 0, j.judge_xp || 0);

                return (
                  <motion.div
                    key={j.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <Link
                      to={`/judge/${j.username}`}
                      className="block border border-zinc-800 hover:border-zinc-600 transition-colors bg-zinc-950 overflow-hidden group"
                    >
                      {/* Portrait */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                        {j.avatar_url ? (
                          <img
                            src={j.avatar_url}
                            alt={name}
                            className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <AuthorityGavel size={28} className="text-zinc-700" />
                          </div>
                        )}
                        {/* Rank overlay */}
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/80 text-[8px] text-zinc-300 font-mono">
                          #{i + 2}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="font-display text-xs text-white truncate">{name.toUpperCase()}</span>
                          {j.verification_status && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] text-zinc-600 font-mono">@{j.username}</span>
                          <JudgeDivisionBadge jxp={j.judge_xp || 0} size="sm" />
                        </div>
                        <p className="text-[9px] text-zinc-500 line-clamp-3 leading-relaxed">
                          {squadBio}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[8px] text-zinc-600 font-mono">{j.judge_review_count || 0} verdicts</span>
                          <span className="text-[8px] text-zinc-700">·</span>
                          <span className="text-[8px] text-zinc-600 font-mono">{(j.judge_xp || 0).toLocaleString()} JXP</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
