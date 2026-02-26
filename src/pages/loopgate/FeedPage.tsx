import { useState, useEffect, useCallback, useRef } from "react";
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
import EditoriumPickCard, { type EditoriumArticle } from "@/components/loopgate/EditoriumPickCard";
import { useFeedPosts, type FeedPostItem } from "@/hooks/useFeedPosts";
import { useIsMobile } from "@/hooks/use-mobile";
import loopgateLogo from "@/assets/loopgate-logo.png";

const BATCH_SIZE = 20;

type FeedTab = 'foryou' | 'posts' | 'connections';

export default function FeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [feedItems, setFeedItems] = useState<LoopFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const seenUrls = useRef(new Set<string>());
  const offsetRef = useRef({ arena: 0, review: 0 });

  const [playerItem, setPlayerItem] = useState<LoopFeedItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [connectionIds, setConnectionIds] = useState<string[]>([]);
  const [trendingEditors, setTrendingEditors] = useState<Array<{ id: string; username: string; avatar_url: string | null; is_verified: boolean }>>([]);
  const [trendingUnits, setTrendingUnits] = useState<Array<{ id: string; name: string; avatar_url: string | null; emblem: string }>>([]);
  const [userProfile, setUserProfile] = useState<{ username: string; avatar_url: string | null; league?: string; level?: number } | null>(null);
  const [editoriumPicks, setEditoriumPicks] = useState<EditoriumArticle[]>([]);

  const { posts: feedPosts, likedPostIds, bookmarkedPostIds, createPost, toggleLike, toggleBookmark, deletePost, loading: postsLoading } = useFeedPosts();

  // Fetch user profile
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username, avatar_url, league, level').eq('id', user.id).single().then(({ data }) => {
      if (data) setUserProfile(data);
    });
  }, [user]);

  // Fetch connections
  useEffect(() => {
    if (!user) return;
    const fetchConnections = async () => {
      const { data } = await supabase
        .from('connections')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      const ids = (data || []).map(c => c.sender_id === user.id ? c.receiver_id : c.sender_id);
      setConnectionIds(ids);
    };
    fetchConnections();
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

  // Fetch Editorium weekly picks
  useEffect(() => {
    const fetchPicks = async () => {
      const { data } = await supabase
        .from('editorium_articles')
        .select('id, title, subtitle, excerpt, cover_image_url, category, author_name, view_count, read_time_minutes, slug, published_at, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);
      setEditoriumPicks((data as EditoriumArticle[]) || []);
    };
    fetchPicks();
  }, []);

  // Fetch activity feed
  const fetchFeed = useCallback(async (isLoadMore = false) => {
    if (isLoadMore && (loadingMore || !hasMore)) return;
    if (isLoadMore) setLoadingMore(true);
    else { setLoading(true); seenUrls.current.clear(); offsetRef.current = { arena: 0, review: 0 }; }

    try {
      const arenaOffset = offsetRef.current.arena;
      const reviewOffset = offsetRef.current.review;

      const [roundRes, eventRes, sanctionedRes, reviewRes, battlesRes, judgeVideosRes, quickFightsRes] = await Promise.all([
        supabase.from('round_participations').select('id, submission_url, platform, qoi_score, quality_score, originality_score, impact_score, user_id, event_id, created_at, thumbnail_url, custom_title').not('qoi_score', 'is', null).not('submission_url', 'is', null).order('created_at', { ascending: false }).range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase.from('event_participations').select('id, submission_url, platform, qoi_score, quality_score, originality_score, impact_score, user_id, event_id, final_rank, thumbnail_url, custom_title, submitted_at').not('qoi_score', 'is', null).not('submission_url', 'is', null).order('qoi_score', { ascending: false }).range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase.from('sanctioned_tournament_participants').select('id, submission_url, submission_platform, qoi_score, user_id, tournament_id, submitted_at, final_rank, thumbnail_url, custom_title').not('qoi_score', 'is', null).not('submission_url', 'is', null).order('submitted_at', { ascending: false }).range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase.from('review_requests').select('*').eq('status', 'reviewed').not('total_score', 'is', null).order('reviewed_at', { ascending: false }).range(reviewOffset, reviewOffset + BATCH_SIZE - 1),
        supabase.from('battles').select('*').in('status', ['pending', 'active', 'judging', 'completed']).order('updated_at', { ascending: false }).range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase.from('judge_rating_videos').select('id, video_url, platform, title, thumbnail_url, current_views, judge_id, submitted_at').order('submitted_at', { ascending: false }).range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase.from('quick_fights').select('*').in('status', ['active', 'judging', 'completed', 'waiting']).order('created_at', { ascending: false }).range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
      ]);

      const roundData = roundRes.data || []; const eventData = eventRes.data || []; const sanctionedData = sanctionedRes.data || [];
      const reviewData = reviewRes.data || []; const battlesData = battlesRes.data || [];
      const judgeVideosData = judgeVideosRes.data || []; const quickFightsData = quickFightsRes.data || [];

      offsetRef.current.arena += Math.max(roundData.length, eventData.length, sanctionedData.length, battlesData.length, judgeVideosData.length, quickFightsData.length);
      offsetRef.current.review += reviewData.length;

      const fetchedCount = roundData.length + eventData.length + sanctionedData.length + reviewData.length + battlesData.length + judgeVideosData.length + quickFightsData.length;
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
      const quickFightItems: LoopFeedItem[] = quickFightsData.map((f: any) => ({ id: `qf-${f.id}`, rawId: f.id, type: 'quick_fight' as const, submission_url: f.player_1_submission_url || f.player_2_submission_url || '', platform: 'tiktok', user_id: f.player_1_id, username: f.player_1_username, avatar_url: f.player_1_avatar_url, created_at: f.created_at, thumbnail_url: null, custom_title: null, fight_id: f.id, fight_status: f.status, player_1_username: f.player_1_username, player_1_avatar_url: f.player_1_avatar_url, player_2_username: f.player_2_username, player_2_avatar_url: f.player_2_avatar_url, winner_id: f.winner_id, winner_score: f.winner_score, loser_score: f.loser_score, duration_minutes: f.duration_minutes, ends_at: f.ends_at }));

      const getBoost = (item: LoopFeedItem) => {
        if (item.id.startsWith('qf-') && (item.fight_status === 'active' || item.fight_status === 'waiting')) return 3.5;
        if (item.id.startsWith('qf-') && item.fight_status === 'judging') return 3;
        if (item.id.startsWith('battle-') && (item.battle_status === 'active' || item.battle_status === 'pending')) return 3;
        if (item.id.startsWith('battle-') && item.battle_status === 'judging') return 2.5;
        if (item.id.startsWith('arena-event-')) return 2;
        if (item.id.startsWith('judge-video-')) return 1.8;
        if (item.id.startsWith('arena-sanctioned-')) return 1;
        return 0;
      };

      const allItems = [...roundItems, ...eventItems, ...sanctionedItems, ...reviewItems, ...battleItems, ...judgeVideoItems, ...quickFightItems]
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
    if (activeTab === 'connections' && !connectionIds.includes(item.user_id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (item.custom_title || item.event_title || '').toLowerCase();
      const uname = item.username.toLowerCase();
      if (!title.includes(q) && !uname.includes(q)) return false;
    }
    return true;
  });

  // Interleave posts + activity + editorium picks for "For You"
  const interleavedFeed = activeTab === 'foryou' ? (() => {
    const combined: Array<{ kind: 'activity'; item: LoopFeedItem } | { kind: 'post'; item: FeedPostItem } | { kind: 'editorium'; item: EditoriumArticle }> = [];
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
    // Inject editorium picks at strategic positions (after every ~4 items)
    const withPicks = [...combined];
    editoriumPicks.forEach((article, idx) => {
      const insertAt = Math.min(3 + idx * 5, withPicks.length);
      withPicks.splice(insertAt, 0, { kind: 'editorium', item: article });
    });
    return withPicks;
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

  const TABS: { key: FeedTab; label: string }[] = [
    { key: 'foryou', label: 'For You' },
    { key: 'posts', label: 'Posts' },
    { key: 'connections', label: 'Following' },
  ];

  return (
    <div className="min-h-screen bg-background pb-16 overflow-y-auto" onScroll={handleScroll}>

      {/* ─── Sticky Header ─── */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/20">
        <div className="max-w-xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 h-11">
            <img src={loopgateLogo} alt="Loopgate" className="h-4 opacity-70" />
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
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

          {/* Tabs — X-style with underline indicator */}
          <div className="flex">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 text-center py-3 text-[13px] font-bold transition-colors relative ${
                  activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/60 hover:bg-muted/5'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="loopTab"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Trending Strip ─── */}
      {activeTab !== 'posts' && (trendingEditors.length > 0 || trendingUnits.length > 0) && (
        <div className="max-w-xl mx-auto border-b border-border/15">
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
      <div className="max-w-xl mx-auto">
        {/* Desktop inline composer */}
        {!isMobile && user && (
          <FeedPostComposer userProfile={userProfile} onPost={createPost} />
        )}

        {activeTab === 'posts' ? (
          feedPosts.length === 0 ? (
            <EmptyState icon={<PenSquare className="w-6 h-6 text-muted-foreground/30" />} title="No posts yet" subtitle="Be the first — share a flex, an edit, or just say what's on your mind." />
          ) : (
            feedPosts.map(post => (
              <FeedPostCard key={post.id} post={post} isLiked={likedPostIds.has(post.id)} isBookmarked={bookmarkedPostIds.has(post.id)} onLike={toggleLike} onBookmark={toggleBookmark} onDelete={deletePost} />
            ))
          )
        ) : activeTab === 'foryou' && interleavedFeed ? (
          interleavedFeed.length === 0 ? (
            <EmptyState icon={<Play className="w-6 h-6 text-muted-foreground/30" />} title="The Loop is quiet" subtitle="Post something or submit an edit to get things moving" />
          ) : (
            interleavedFeed.map((entry, idx) => (
              entry.kind === 'post' ? (
                <FeedPostCard key={`post-${entry.item.id}`} post={entry.item as FeedPostItem} isLiked={likedPostIds.has(entry.item.id)} isBookmarked={bookmarkedPostIds.has(entry.item.id)} onLike={toggleLike} onBookmark={toggleBookmark} onDelete={deletePost} />
              ) : entry.kind === 'editorium' ? (
                <EditoriumPickCard key={`ed-${entry.item.id}`} article={entry.item as EditoriumArticle} />
              ) : (
                <LoopFeedCard key={(entry.item as LoopFeedItem).id} item={entry.item as LoopFeedItem} isExpanded={expandedId === (entry.item as LoopFeedItem).id} onToggleExpand={() => setExpandedId(prev => prev === (entry.item as LoopFeedItem).id ? null : (entry.item as LoopFeedItem).id)} onOpenPlayer={() => setPlayerItem(entry.item as LoopFeedItem)} />
              )
            ))
          )
        ) : (
          filteredItems.length === 0 ? (
            <EmptyState
              icon={<Play className="w-6 h-6 text-muted-foreground/30" />}
              title={searchQuery ? "No results" : "Nothing from connections yet"}
              subtitle={searchQuery ? "Try a different search" : "Connect with editors to see their edits here"}
            />
          ) : (
            filteredItems.map(item => (
              <LoopFeedCard key={item.id} item={item} isExpanded={expandedId === item.id} onToggleExpand={() => setExpandedId(prev => prev === item.id ? null : item.id)} onOpenPlayer={() => setPlayerItem(item)} />
            ))
          )
        )}

        {loadingMore && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          </div>
        )}

        {!hasMore && filteredItems.length > 0 && activeTab !== 'posts' && (
          <p className="text-center text-xs text-muted-foreground/50 py-8">You've reached the end 🔥</p>
        )}
      </div>

      {/* ─── Compose FAB (mobile only, X-style floating button) ─── */}
      {user && isMobile && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCompose(true)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center active:shadow-md transition-shadow"
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
