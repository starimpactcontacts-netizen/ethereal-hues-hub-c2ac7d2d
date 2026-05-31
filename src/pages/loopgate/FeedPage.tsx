import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Play, Loader2, Search, X, PenSquare, Feather } from "lucide-react";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import LoopFeedCard, { type LoopFeedItem } from "@/components/loopgate/LoopFeedCard";
import FeedVideoPlayer from "@/components/loopgate/FeedVideoPlayer";
import FeedComposeSheet from "@/components/loopgate/FeedComposeSheet";
import FeedPostComposer from "@/components/loopgate/FeedPostComposer";
import FeedPostCard from "@/components/loopgate/FeedPostCard";
import { useFeedPosts, type FeedPostItem } from "@/hooks/useFeedPosts";
import { useLoopReactions } from "@/hooks/useLoopReactions";
import loopgateLogo from "@/assets/loopgate-logo.png";
import FeedSidebar from "@/components/loopgate/FeedSidebar";

const BATCH_SIZE = 20;

type LoopPill = 'feed' | 'find_battle' | 'rate_edit' | 'help' | 'competition' | 'news';

const LOOP_PILLS: { key: LoopPill; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'find_battle', label: 'Find A Battle' },
  { key: 'rate_edit', label: 'Rate My Edit' },
  { key: 'help', label: 'Editing Help' },
  { key: 'competition', label: 'Competition' },
  { key: 'news', label: 'News' },
];

const LOOP_EMPTY: Record<LoopPill, { title: string; subtitle: string }> = {
  feed: { title: 'The Loop is quiet', subtitle: 'Drop a loop or submit an edit to get things moving' },
  find_battle: { title: 'No battle requests yet', subtitle: 'Post here to call out editors for a 1v1' },
  rate_edit: { title: 'No edits to rate', subtitle: 'Share your edit link to get community feedback' },
  help: { title: 'No questions yet', subtitle: 'Ask the community for editing advice and tips' },
  competition: { title: 'No competition posts', subtitle: 'Share your competition clips and highlights' },
  news: { title: 'Nothing here yet', subtitle: 'Share updates and news from the editing world' },
};

export default function FeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<LoopFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const seenUrls = useRef(new Set<string>());
  const offsetRef = useRef({ arena: 0, review: 0 });

  const [playerItem, setPlayerItem] = useState<LoopFeedItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loopPill, setLoopPill] = useState<LoopPill>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [trendingEditors, setTrendingEditors] = useState<Array<{ id: string; username: string; avatar_url: string | null; is_verified: boolean }>>([]);
  const [trendingUnits, setTrendingUnits] = useState<Array<{ id: string; name: string; avatar_url: string | null; emblem: string }>>([]);
  const [userProfile, setUserProfile] = useState<{ username: string; avatar_url: string | null; league?: string; level?: number } | null>(null);

  const { posts: feedPosts, likedPostIds, bookmarkedPostIds, createPost, toggleLike, toggleBookmark, deletePost, loading: postsLoading } = useFeedPosts();

  const postIds = useMemo(() => feedPosts.map(p => p.id), [feedPosts]);
  const { reactions, toggleReaction } = useLoopReactions(postIds);

  // Fetch user profile
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username, avatar_url, league, level').eq('id', user.id).single().then(({ data }) => {
      if (data) setUserProfile(data);
    });
  }, [user]);

  // Fetch trending
  useEffect(() => {
    const fetchTrending = async () => {
      const [editorsRes, unitsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, avatar_url, verification_status, connection_count, global_index_score, level')
          .not('avatar_url', 'is', null)
          .limit(50),
        supabase
          .from('crews')
          .select('id, name, avatar_url, emblem')
          .order('member_count', { ascending: false })
          .limit(8)
      ]);

      const scored = (editorsRes.data || []).map(p => {
        let score = 0;
        if (!!p.verification_status) score += 10;
        const conn = p.connection_count || 0;
        if (conn >= 20) score += 6; else if (conn >= 5) score += 4; else if (conn >= 1) score += 2;
        const idx = p.global_index_score || 0;
        if (idx >= 80) score += 6; else if (idx >= 50) score += 4; else if (idx > 0) score += 2;
        const lvl = p.level || 1;
        if (lvl >= 5) score += 3; else if (lvl >= 2) score += 1;
        return { id: p.id, username: p.username, avatar_url: p.avatar_url, is_verified: !!p.verification_status, _score: score };
      });
      scored.sort((a, b) => b._score - a._score);
      setTrendingEditors(scored.slice(0, 12).map(({ _score, ...rest }) => rest));
      setTrendingUnits(unitsRes.data || []);
    };
    fetchTrending();
  }, []);

  // Fetch activity feed
  const fetchFeed = useCallback(async (isLoadMore = false) => {
    if (isLoadMore && (loadingMore || !hasMore)) return;
    if (isLoadMore) setLoadingMore(true);
    else { setLoading(true); seenUrls.current.clear(); offsetRef.current = { arena: 0, review: 0 }; }

    try {
      const arenaOffset = offsetRef.current.arena;
      const reviewOffset = offsetRef.current.review;

      const [roundRes, eventRes, sanctionedRes, reviewRes, battlesRes, judgeVideosRes] = await Promise.all([
        supabase.from('round_participations').select('id, submission_url, platform, qoi_score, quality_score, originality_score, impact_score, user_id, event_id, created_at, thumbnail_url, custom_title').not('qoi_score', 'is', null).not('submission_url', 'is', null).order('created_at', { ascending: false }).range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase.from('event_participations').select('id, submission_url, platform, qoi_score, quality_score, originality_score, impact_score, user_id, event_id, final_rank, thumbnail_url, custom_title, submitted_at').not('qoi_score', 'is', null).not('submission_url', 'is', null).order('qoi_score', { ascending: false }).range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase.from('sanctioned_tournament_participants').select('id, submission_url, submission_platform, qoi_score, user_id, tournament_id, submitted_at, final_rank, thumbnail_url, custom_title').not('qoi_score', 'is', null).not('submission_url', 'is', null).order('submitted_at', { ascending: false }).range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase.from('review_requests').select('*').eq('status', 'reviewed').not('total_score', 'is', null).order('reviewed_at', { ascending: false }).range(reviewOffset, reviewOffset + BATCH_SIZE - 1),
        supabase.from('battles').select('*').in('status', ['pending', 'active', 'judging', 'completed']).is('hidden_at' as any, null).order('updated_at', { ascending: false }).range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase.from('judge_rating_videos').select('id, video_url, platform, title, thumbnail_url, current_views, judge_id, submitted_at').order('submitted_at', { ascending: false }).range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
      ]);

      const roundData = roundRes.data || []; const eventData = eventRes.data || []; const sanctionedData = sanctionedRes.data || [];
      const reviewData = reviewRes.data || []; const battlesData = battlesRes.data || [];
      const judgeVideosData = judgeVideosRes.data || [];

      offsetRef.current.arena += Math.max(roundData.length, eventData.length, sanctionedData.length, battlesData.length, judgeVideosData.length);
      offsetRef.current.review += reviewData.length;

      const fetchedCount = roundData.length + eventData.length + sanctionedData.length + reviewData.length + battlesData.length + judgeVideosData.length;
      if (fetchedCount === 0) { setHasMore(false); if (isLoadMore) { setLoadingMore(false); return; } }

      const allUserIds = [...roundData.map(s => s.user_id), ...eventData.map(s => s.user_id), ...sanctionedData.map(s => s.user_id), ...reviewData.map(r => r.user_id), ...judgeVideosData.map(j => j.judge_id)];
      const userIds = [...new Set(allUserIds)];
      const eventIds = [...new Set([...roundData.map(s => s.event_id), ...eventData.map(s => s.event_id)])];
      const tournamentIds = [...new Set(sanctionedData.map(s => s.tournament_id))];

      const [profilesRes, eventsRes, tournamentsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url').in('id', userIds.length > 0 ? userIds : ['']),
        supabase.from('events').select('id, title').in('id', eventIds.length > 0 ? eventIds : ['']),
        supabase.from('sanctioned_tournaments').select('id, name').in('id', tournamentIds.length > 0 ? tournamentIds : ['']),
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      const eventMap = new Map(eventsRes.data?.map(e => [e.id, e]) || []);
      const tournamentMap = new Map(tournamentsRes.data?.map(t => [t.id, { title: t.name }]) || []);

      const getThumb = (dbThumb: string | null) => dbThumb || null;

      const roundItems: LoopFeedItem[] = roundData.map(s => ({ id: `arena-${s.id}`, rawId: s.id, type: 'arena' as const, submission_url: s.submission_url!, platform: s.platform || 'tiktok', user_id: s.user_id, username: profileMap.get(s.user_id)?.username || 'editor', avatar_url: profileMap.get(s.user_id)?.avatar_url || null, created_at: s.created_at || new Date().toISOString(), thumbnail_url: getThumb((s as any).thumbnail_url), custom_title: (s as any).custom_title || null, qoi_score: s.qoi_score, quality_score: s.quality_score || null, originality_score: s.originality_score || null, impact_score: s.impact_score || null, event_title: eventMap.get(s.event_id)?.title || 'Open Arena', final_rank: null }));
      const eventItems: LoopFeedItem[] = eventData.map(s => ({ id: `arena-event-${s.id}`, rawId: s.id, type: 'arena' as const, submission_url: s.submission_url!, platform: s.platform || 'tiktok', user_id: s.user_id, username: profileMap.get(s.user_id)?.username || 'editor', avatar_url: profileMap.get(s.user_id)?.avatar_url || null, created_at: (s as any).submitted_at || new Date().toISOString(), thumbnail_url: getThumb(s.thumbnail_url), custom_title: (s as any).custom_title || null, qoi_score: s.qoi_score, quality_score: s.quality_score || null, originality_score: s.originality_score || null, impact_score: s.impact_score || null, event_title: eventMap.get(s.event_id)?.title || 'Event', final_rank: s.final_rank || null }));
      const sanctionedItems: LoopFeedItem[] = sanctionedData.map(s => ({ id: `arena-sanctioned-${s.id}`, rawId: s.id, type: 'arena' as const, submission_url: s.submission_url!, platform: s.submission_platform || 'tiktok', user_id: s.user_id, username: profileMap.get(s.user_id)?.username || 'editor', avatar_url: profileMap.get(s.user_id)?.avatar_url || null, created_at: s.submitted_at || new Date().toISOString(), thumbnail_url: getThumb((s as any).thumbnail_url), custom_title: (s as any).custom_title || null, qoi_score: s.qoi_score, event_title: tournamentMap.get(s.tournament_id)?.title || 'Tournament', final_rank: s.final_rank || null }));
      const reviewItems: LoopFeedItem[] = reviewData.map(r => ({ id: `review-${r.id}`, rawId: r.id, type: 'review' as const, submission_url: r.submission_url, platform: r.platform || 'tiktok', user_id: r.user_id, username: r.username || 'editor', avatar_url: r.avatar_url, created_at: r.reviewed_at || r.requested_at, thumbnail_url: null, custom_title: null, total_score: r.total_score || 0, judge_comment: r.judge_comment, judge_username: r.judge_username, judge_avatar_url: r.judge_avatar_url }));
      const battleItems: LoopFeedItem[] = battlesData.map(b => ({ id: `battle-${b.id}`, rawId: b.id, type: 'battle' as const, submission_url: b.challenger_submission_url || b.opponent_submission_url || '', platform: b.challenger_submission_platform || b.opponent_submission_platform || 'tiktok', user_id: b.challenger_id, username: b.challenger_username, avatar_url: b.challenger_avatar_url, created_at: b.updated_at || b.created_at, thumbnail_url: null, custom_title: null, battle_id: b.id, challenger_username: b.challenger_username, challenger_avatar_url: b.challenger_avatar_url, opponent_username: b.opponent_username, opponent_avatar_url: b.opponent_avatar_url, challenger_score: b.challenger_score, opponent_score: b.opponent_score, winner_id: b.winner_id, battle_status: b.status }));
      const judgeVideoItems: LoopFeedItem[] = judgeVideosData.map(j => ({ id: `judge-video-${j.id}`, rawId: j.id, type: 'judge_video' as const, submission_url: j.video_url, platform: j.platform || 'tiktok', user_id: j.judge_id, username: profileMap.get(j.judge_id)?.username || 'judge', avatar_url: profileMap.get(j.judge_id)?.avatar_url || null, created_at: j.submitted_at || new Date().toISOString(), thumbnail_url: j.thumbnail_url || null, custom_title: null, video_title: j.title || 'Judge Rating Video', current_views: j.current_views, is_verified: true }));

      const getBoost = (item: LoopFeedItem) => {
        if (item.id.startsWith('battle-') && (item.battle_status === 'active' || item.battle_status === 'pending')) return 3;
        if (item.id.startsWith('battle-') && item.battle_status === 'judging') return 2.5;
        if (item.id.startsWith('arena-event-')) return 2;
        if (item.id.startsWith('judge-video-')) return 1.8;
        if (item.id.startsWith('arena-sanctioned-')) return 1;
        return 0;
      };

      const allItems = [...roundItems, ...eventItems, ...sanctionedItems, ...reviewItems, ...battleItems, ...judgeVideoItems]
        .sort((a, b) => { const d = getBoost(b) - getBoost(a); return d !== 0 ? d : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); });

      const newItems = allItems.filter(item => { if (seenUrls.current.has(item.submission_url)) return false; seenUrls.current.add(item.submission_url); return true; });

      if (isLoadMore) setFeedItems(prev => [...prev, ...newItems]);
      else setFeedItems(newItems);
    } catch (error) { console.error('Error fetching feed:', error); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [loadingMore, hasMore]);

  useEffect(() => { fetchFeed(false); }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 400 && hasMore && !loadingMore) fetchFeed(true);
  }, [fetchFeed, hasMore, loadingMore]);

  const filteredItems = feedItems.filter(item => {
    // Hide own activity from discovery feed
    if (user && item.user_id === user.id) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (item.custom_title || item.event_title || '').toLowerCase();
      const uname = item.username.toLowerCase();
      if (!title.includes(q) && !uname.includes(q)) return false;
    }
    return true;
  });

  // Filtered + sorted posts for non-feed loop pills
  const loopPosts = loopPill !== 'feed'
    ? (() => {
        const filtered = feedPosts.filter(p => p.post_type === loopPill);
        if (loopPill === 'rate_edit') return [...filtered].sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        return [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      })()
    : [];

  // Interleave posts + activity for Feed loop
  const interleavedFeed = loopPill === 'feed' ? (() => {
    const combined: Array<{ kind: 'activity'; item: LoopFeedItem } | { kind: 'post'; item: FeedPostItem }> = [];
    let ai = 0, pi = 0;
    const activityItems = filteredItems;
    const postItems = feedPosts;
    while (ai < activityItems.length || pi < postItems.length) {
      const aTime = ai < activityItems.length ? new Date(activityItems[ai].created_at).getTime() : -Infinity;
      const pTime = pi < postItems.length ? new Date(postItems[pi].created_at).getTime() : -Infinity;
      if (pTime >= aTime && pi < postItems.length) { combined.push({ kind: 'post', item: postItems[pi] }); pi++; }
      else if (ai < activityItems.length) { combined.push({ kind: 'activity', item: activityItems[ai] }); ai++; }
      else break;
    }
    return combined;
  })() : null;

  if (loading && postsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-14">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-muted-foreground text-xs">Loading the Loop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background pb-16 overflow-y-auto overscroll-y-contain" onScroll={handleScroll}>
      <div className="mx-auto flex w-full lg:max-w-[920px]">
        {/* Feed Column */}
        <div className="w-full lg:max-w-[600px] lg:border-r lg:border-border/10">
          {/* ─── Sticky Header ─── */}
          <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/20">
            <div className="mx-auto max-w-xl lg:max-w-none">
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 h-11">
                <img src={loopgateLogo} alt="Loopgate" className="h-4 opacity-70" />
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors lg:hidden"
                >
                  {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                </button>
              </div>

              {/* Search */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="overflow-hidden px-4"
                  >
                    <div className="relative pb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search editors, events..."
                        autoFocus
                        className="w-full bg-muted/30 border border-border/20 rounded-full pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loop Pills — horizontal scrollable */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3 pt-1.5">
                {LOOP_PILLS.map(pill => (
                  <button
                    key={pill.key}
                    onClick={() => setLoopPill(pill.key)}
                    className={`shrink-0 px-3.5 py-1.5 text-[10px] font-black tracking-[0.12em] uppercase transition-all rounded-full border ${
                      loopPill === pill.key
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-transparent text-muted-foreground border-border/30 hover:text-foreground hover:border-border/60'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Trending Strip (Feed only) ─── */}
          {loopPill === 'feed' && (trendingEditors.length > 0 || trendingUnits.length > 0) && (
            <div className="mx-auto max-w-xl lg:max-w-none border-b border-border/15">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-3">
                {trendingUnits.map(unit => (
                  <motion.button
                    key={`u-${unit.id}`}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => navigate(`/units/${unit.id}`)}
                    className="flex flex-col items-center gap-1 shrink-0"
                  >
                    <div className="w-[50px] h-[50px] rounded-full p-[2px] bg-gradient-to-br from-primary/50 to-gold/30">
                      <div className="w-full h-full rounded-full bg-background p-[2px]">
                        <Avatar className="w-full h-full rounded-full">
                          <AvatarImage src={unit.avatar_url || undefined} className="object-cover" />
                          <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold">{unit.emblem}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <span className="text-[9px] text-muted-foreground/70 truncate max-w-[50px] leading-none">{unit.name}</span>
                  </motion.button>
                ))}
                {trendingEditors.map(editor => (
                  <motion.button
                    key={`e-${editor.id}`}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => navigate(`/editor/${editor.id}`)}
                    className="flex flex-col items-center gap-1 shrink-0"
                  >
                    <div className="relative">
                      <div className="w-[50px] h-[50px] rounded-full p-[2px] bg-gradient-to-br from-red-500/40 to-primary/30">
                        <div className="w-full h-full rounded-full bg-background p-[2px]">
                          <Avatar className="w-full h-full rounded-full">
                            <AvatarImage src={editor.avatar_url || undefined} className="object-cover" />
                            <AvatarFallback className="bg-muted text-foreground text-[9px] font-bold">{editor.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      {editor.is_verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 z-10"><VerifiedBadge size="sm" /></div>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground/70 truncate max-w-[50px] leading-none">@{editor.username}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Feed Content ─── */}
          <div className="mx-auto max-w-xl lg:max-w-none pb-24 lg:pb-0">
            {/* Inline composer */}
            {user && (
              <FeedPostComposer userProfile={userProfile} onPost={createPost} onMobileTap={() => setShowCompose(true)} />
            )}

            {loopPill === 'feed' && interleavedFeed ? (
              interleavedFeed.length === 0 ? (
                <EmptyState icon={<Play className="w-6 h-6 text-muted-foreground/30" />} title={LOOP_EMPTY.feed.title} subtitle={LOOP_EMPTY.feed.subtitle} />
              ) : (
                interleavedFeed.map((entry) => (
                  entry.kind === 'post' ? (
                    <FeedPostCard key={`post-${entry.item.id}`} post={entry.item as FeedPostItem} isLiked={likedPostIds.has(entry.item.id)} isBookmarked={bookmarkedPostIds.has(entry.item.id)} onLike={toggleLike} onBookmark={toggleBookmark} onDelete={deletePost} reactions={reactions[entry.item.id] || []} onToggleReaction={toggleReaction} />
                  ) : (
                    <LoopFeedCard key={(entry.item as LoopFeedItem).id} item={entry.item as LoopFeedItem} isExpanded={expandedId === (entry.item as LoopFeedItem).id} onToggleExpand={() => setExpandedId(prev => prev === (entry.item as LoopFeedItem).id ? null : (entry.item as LoopFeedItem).id)} onOpenPlayer={() => setPlayerItem(entry.item as LoopFeedItem)} />
                  )
                ))
              )
            ) : loopPill !== 'feed' ? (
              loopPosts.length === 0 ? (
                <EmptyState
                  icon={<PenSquare className="w-6 h-6 text-muted-foreground/30" />}
                  title={LOOP_EMPTY[loopPill].title}
                  subtitle={LOOP_EMPTY[loopPill].subtitle}
                />
              ) : (
                loopPosts.map(post => (
                  <FeedPostCard key={post.id} post={post} isLiked={likedPostIds.has(post.id)} isBookmarked={bookmarkedPostIds.has(post.id)} onLike={toggleLike} onBookmark={toggleBookmark} onDelete={deletePost} reactions={reactions[post.id] || []} onToggleReaction={toggleReaction} />
                ))
              )
            ) : null}

            {loadingMore && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              </div>
            )}

            {!hasMore && filteredItems.length > 0 && loopPill === 'feed' && (
              <p className="text-center text-xs text-muted-foreground/50 py-8">You've reached the end 🔥</p>
            )}
          </div>
        </div>{/* end feed column */}

        {/* ─── Desktop Sidebar ─── */}
        <div className="hidden lg:block">
          <FeedSidebar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            trendingEditors={trendingEditors}
            trendingUnits={trendingUnits}
          />
        </div>
      </div>{/* end flex container */}

      {/* ─── Compose FAB (mobile only) ─── */}
      {user && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCompose(true)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center active:shadow-md transition-shadow lg:hidden"
        >
          <Feather className="w-5 h-5" />
        </motion.button>
      )}

      {/* ─── Compose Sheet ─── */}
      <FeedComposeSheet
        open={showCompose}
        onClose={() => setShowCompose(false)}
        userProfile={userProfile}
        onPost={createPost}
        loopPill={loopPill}
      />

      {/* ─── Video Player ─── */}
      {playerItem && (
        <FeedVideoPlayer
          isOpen={true}
          onClose={() => setPlayerItem(null)}
          submissionUrl={playerItem.submission_url}
          platform={playerItem.platform}
          submissionId={playerItem.rawId}
          submissionType={playerItem.type}
          username={playerItem.username}
        />
      )}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground/50 mb-1">{title}</p>
      <p className="text-xs text-muted-foreground/60 text-center max-w-[240px]">{subtitle}</p>
    </div>
  );
}
