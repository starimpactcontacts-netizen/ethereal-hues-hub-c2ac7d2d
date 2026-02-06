import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Play, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchThumbnailsBatch } from "@/hooks/useThumbnail";
import { useAuth } from "@/hooks/useAuth";
import LoopFeedCard, { type LoopFeedItem } from "@/components/loopgate/LoopFeedCard";
import FeedVideoPlayer from "@/components/loopgate/FeedVideoPlayer";
import loopgateLogo from "@/assets/loopgate-logo.png";

const BATCH_SIZE = 20;

type FeedTab = 'foryou' | 'connections';

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
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionIds, setConnectionIds] = useState<string[]>([]);

  // Fetch connections for the connections tab
  useEffect(() => {
    if (!user) return;
    const fetchConnections = async () => {
      const { data } = await supabase
        .from('connections')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      const ids = (data || []).map(c =>
        c.sender_id === user.id ? c.receiver_id : c.sender_id
      );
      setConnectionIds(ids);
    };
    fetchConnections();
  }, [user]);

  const fetchFeed = useCallback(async (isLoadMore = false) => {
    if (isLoadMore && (loadingMore || !hasMore)) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      seenUrls.current.clear();
      offsetRef.current = { arena: 0, review: 0 };
    }

    try {
      const arenaOffset = offsetRef.current.arena;
      const reviewOffset = offsetRef.current.review;

      const [roundRes, eventRes, sanctionedRes, reviewRes] = await Promise.all([
        supabase
          .from('round_participations')
          .select('id, submission_url, platform, qoi_score, quality_score, originality_score, impact_score, user_id, event_id, created_at, thumbnail_url, custom_title')
          .not('qoi_score', 'is', null)
          .not('submission_url', 'is', null)
          .order('created_at', { ascending: false })
          .range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase
          .from('event_participations')
          .select('id, submission_url, platform, qoi_score, quality_score, originality_score, impact_score, user_id, event_id, final_rank, thumbnail_url, custom_title, submitted_at')
          .not('qoi_score', 'is', null)
          .not('submission_url', 'is', null)
          .order('qoi_score', { ascending: false })
          .range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase
          .from('sanctioned_tournament_participants')
          .select('id, submission_url, submission_platform, qoi_score, user_id, tournament_id, submitted_at, final_rank, thumbnail_url, custom_title')
          .not('qoi_score', 'is', null)
          .not('submission_url', 'is', null)
          .order('submitted_at', { ascending: false })
          .range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase
          .from('review_requests')
          .select('*')
          .eq('status', 'reviewed')
          .not('total_score', 'is', null)
          .order('reviewed_at', { ascending: false })
          .range(reviewOffset, reviewOffset + BATCH_SIZE - 1)
      ]);

      const roundData = roundRes.data || [];
      const eventData = eventRes.data || [];
      const sanctionedData = sanctionedRes.data || [];
      const reviewData = reviewRes.data || [];

      offsetRef.current.arena += Math.max(roundData.length, eventData.length, sanctionedData.length);
      offsetRef.current.review += reviewData.length;

      const fetchedCount = roundData.length + eventData.length + sanctionedData.length + reviewData.length;
      if (fetchedCount === 0) {
        setHasMore(false);
        if (isLoadMore) { setLoadingMore(false); return; }
      }

      const allUserIds = [
        ...roundData.map(s => s.user_id),
        ...eventData.map(s => s.user_id),
        ...sanctionedData.map(s => s.user_id),
        ...reviewData.map(r => r.user_id),
      ];
      const userIds = [...new Set(allUserIds)];
      const eventIds = [...new Set([...roundData.map(s => s.event_id), ...eventData.map(s => s.event_id)])];
      const tournamentIds = [...new Set(sanctionedData.map(s => s.tournament_id))];

      const [profilesRes, eventsRes, tournamentsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url').in('id', userIds.length > 0 ? userIds : ['']),
        supabase.from('events').select('id, title').in('id', eventIds.length > 0 ? eventIds : ['']),
        supabase.from('sanctioned_tournaments').select('id, name').in('id', tournamentIds.length > 0 ? tournamentIds : [''])
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      const eventMap = new Map(eventsRes.data?.map(e => [e.id, e]) || []);
      const tournamentMap = new Map(tournamentsRes.data?.map(t => [t.id, { title: t.name }]) || []);

      const roundItems: LoopFeedItem[] = roundData.map(s => ({
        id: `arena-${s.id}`, rawId: s.id, type: 'arena' as const,
        submission_url: s.submission_url!, platform: s.platform || 'tiktok',
        user_id: s.user_id, username: profileMap.get(s.user_id)?.username || 'editor',
        avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
        created_at: s.created_at || new Date().toISOString(),
        thumbnail_url: (s as any).thumbnail_url || null, custom_title: (s as any).custom_title || null,
        qoi_score: s.qoi_score, quality_score: s.quality_score || null,
        originality_score: s.originality_score || null, impact_score: s.impact_score || null,
        event_title: eventMap.get(s.event_id)?.title || 'Open Arena', final_rank: null,
      }));

      const eventItems: LoopFeedItem[] = eventData.map(s => ({
        id: `arena-event-${s.id}`, rawId: s.id, type: 'arena' as const,
        submission_url: s.submission_url!, platform: s.platform || 'tiktok',
        user_id: s.user_id, username: profileMap.get(s.user_id)?.username || 'editor',
        avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
        created_at: (s as any).submitted_at || new Date().toISOString(),
        thumbnail_url: s.thumbnail_url || null, custom_title: (s as any).custom_title || null,
        qoi_score: s.qoi_score, quality_score: s.quality_score || null,
        originality_score: s.originality_score || null, impact_score: s.impact_score || null,
        event_title: eventMap.get(s.event_id)?.title || 'Event', final_rank: s.final_rank || null,
      }));

      const sanctionedItems: LoopFeedItem[] = sanctionedData.map(s => ({
        id: `arena-sanctioned-${s.id}`, rawId: s.id, type: 'arena' as const,
        submission_url: s.submission_url!, platform: s.submission_platform || 'tiktok',
        user_id: s.user_id, username: profileMap.get(s.user_id)?.username || 'editor',
        avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
        created_at: s.submitted_at || new Date().toISOString(),
        thumbnail_url: (s as any).thumbnail_url || null, custom_title: (s as any).custom_title || null,
        qoi_score: s.qoi_score,
        event_title: tournamentMap.get(s.tournament_id)?.title || 'Tournament', final_rank: s.final_rank || null,
      }));

      const reviewItems: LoopFeedItem[] = reviewData.map(r => ({
        id: `review-${r.id}`, rawId: r.id, type: 'review' as const,
        submission_url: r.submission_url, platform: r.platform || 'tiktok',
        user_id: r.user_id, username: r.username || 'editor', avatar_url: r.avatar_url,
        created_at: r.reviewed_at || r.requested_at, thumbnail_url: null, custom_title: null,
        total_score: r.total_score || 0, judge_comment: r.judge_comment,
        judge_username: r.judge_username, judge_avatar_url: r.judge_avatar_url,
      }));

      const allItems = [...roundItems, ...eventItems, ...sanctionedItems, ...reviewItems]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const newItems = allItems.filter(item => {
        if (seenUrls.current.has(item.submission_url)) return false;
        seenUrls.current.add(item.submission_url);
        return true;
      });

      if (isLoadMore) {
        setFeedItems(prev => [...prev, ...newItems]);
      } else {
        setFeedItems(newItems);
      }

      // Auto-fetch thumbnails for items missing them
      const needThumbnails = newItems.filter(i => !i.thumbnail_url);
      if (needThumbnails.length > 0) {
        fetchThumbnailsBatch(needThumbnails.map(i => ({ submission_url: i.submission_url, platform: i.platform })))
          .then(thumbs => {
            setFeedItems(prev => prev.map(item => {
              if (!item.thumbnail_url && thumbs[item.submission_url]) {
                return { ...item, thumbnail_url: thumbs[item.submission_url] };
              }
              return item;
            }));
          });
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  useEffect(() => { fetchFeed(false); }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 400 && hasMore && !loadingMore) {
      fetchFeed(true);
    }
  }, [fetchFeed, hasMore, loadingMore]);

  // Filter items based on tab & search
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

  if (loading) {
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
    <div
      className="min-h-screen bg-background pb-16 overflow-y-auto"
      onScroll={handleScroll}
    >
      {/* Header — logo + tabs + search */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto">
          {/* Logo row */}
          <div className="flex items-center justify-center py-2">
            <img src={loopgateLogo} alt="Loopgate" className="h-6 opacity-80" />
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search edits, editors..."
                className="w-full bg-surface-1 border border-border/60 rounded-full pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-transparent">
            <button
              onClick={() => setActiveTab('foryou')}
              className={`flex-1 text-center py-2 text-xs font-semibold transition-colors relative ${
                activeTab === 'foryou' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              For You
              {activeTab === 'foryou' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`flex-1 text-center py-2 text-xs font-semibold transition-colors relative ${
                activeTab === 'connections' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              Connections
              {activeTab === 'connections' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Play className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              {activeTab === 'connections'
                ? "No edits from your connections yet"
                : searchQuery
                  ? "No results found"
                  : "No content yet"}
            </p>
          </div>
        ) : (
          filteredItems.map(item => (
            <LoopFeedCard
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggleExpand={() => setExpandedId(prev => prev === item.id ? null : item.id)}
              onOpenPlayer={() => setPlayerItem(item)}
            />
          ))
        )}

        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          </div>
        )}

        {!hasMore && filteredItems.length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground py-6">You've seen it all 🔥</p>
        )}
      </div>

      {/* Video Player */}
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
