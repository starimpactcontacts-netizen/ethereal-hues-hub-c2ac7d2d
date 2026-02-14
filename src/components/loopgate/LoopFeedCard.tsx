import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Trophy, MessageCircle, Share2, ExternalLink, Sparkles, Swords, Video, Heart, Bookmark, BarChart3 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useUnifiedThumbnail } from "@/lib/thumbnail";
import { supabase } from "@/integrations/supabase/client";
import ThumbnailImage from "./ThumbnailImage";
import FeedInlineComments from "./FeedInlineComments";
import VerifiedBadge from "./VerifiedBadge";

export interface LoopFeedItem {
  id: string;
  rawId: string;
  type: 'arena' | 'review' | 'battle' | 'judge_video' | 'quick_fight';
  submission_url: string;
  platform: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  thumbnail_url: string | null;
  custom_title: string | null;
  qoi_score?: number | null;
  quality_score?: number | null;
  originality_score?: number | null;
  impact_score?: number | null;
  event_title?: string;
  final_rank?: number | null;
  total_score?: number;
  judge_comment?: string | null;
  judge_username?: string | null;
  judge_avatar_url?: string | null;
  battle_id?: string;
  opponent_username?: string | null;
  challenger_username?: string | null;
  challenger_avatar_url?: string | null;
  opponent_avatar_url?: string | null;
  challenger_score?: number | null;
  opponent_score?: number | null;
  winner_id?: string | null;
  battle_status?: string;
  video_title?: string | null;
  current_views?: number | null;
  is_verified?: boolean;
  fight_id?: string;
  fight_status?: string;
  player_1_username?: string;
  player_1_avatar_url?: string | null;
  player_2_username?: string | null;
  player_2_avatar_url?: string | null;
  winner_score?: number | null;
  loser_score?: number | null;
  duration_minutes?: number;
  ends_at?: string | null;
  unit_name?: string | null;
  unit_emblem?: string | null;
}

const platformLabels: Record<string, string> = {
  tiktok: "TT",
  instagram: "IG",
  youtube: "YT",
};

const isGifUrl = (text: string) =>
  text.includes('tenor.com') || text.includes('giphy.com') || /\.(gif|gifv)(\?|$)/i.test(text);

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'S+', color: 'text-gold' };
  if (score >= 80) return { grade: 'S', color: 'text-gold' };
  if (score >= 70) return { grade: 'A', color: 'text-green-400' };
  if (score >= 60) return { grade: 'B', color: 'text-blue-400' };
  if (score >= 50) return { grade: 'C', color: 'text-orange-400' };
  return { grade: 'D', color: 'text-red-400' };
}

function getTypeBadge(type: string, status?: string) {
  if (type === 'arena') return { label: 'ARENA', icon: <Trophy className="w-2.5 h-2.5" />, cls: 'text-gold' };
  if (type === 'quick_fight') return { label: 'QUICK 1v1', icon: <Swords className="w-2.5 h-2.5" />, cls: 'text-red-400' };
  if (type === 'battle') return { label: '1v1', icon: <Swords className="w-2.5 h-2.5" />, cls: 'text-red-400' };
  if (type === 'judge_video') return { label: 'JUDGE', icon: <Video className="w-2.5 h-2.5" />, cls: 'text-purple-400' };
  return { label: 'REVIEW', icon: <Sparkles className="w-2.5 h-2.5" />, cls: 'text-purple-400' };
}

interface LoopFeedCardProps {
  item: LoopFeedItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenPlayer: () => void;
}

export default function LoopFeedCard({ item, isExpanded, onToggleExpand, onOpenPlayer }: LoopFeedCardProps) {
  const navigate = useNavigate();
  const [commentCount, setCommentCount] = useState(0);
  const [previewComments, setPreviewComments] = useState<{ username: string; content: string }[]>([]);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      const { count } = await supabase
        .from('feed_comments')
        .select('*', { count: 'exact', head: true })
        .eq('submission_id', item.rawId)
        .eq('submission_type', item.type);
      setCommentCount(count || 0);

      if ((count || 0) > 0) {
        const { data } = await supabase
          .from('feed_comments')
          .select('user_id, content')
          .eq('submission_id', item.rawId)
          .eq('submission_type', item.type)
          .is('parent_id', null)
          .order('created_at', { ascending: false })
          .limit(2);
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(c => c.user_id))];
          const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);
          const pm = new Map(profiles?.map(p => [p.id, p.username]) || []);
          setPreviewComments(data.map(c => ({
            username: pm.get(c.user_id) || 'user',
            content: c.content.length > 60 ? c.content.slice(0, 60) + '…' : c.content,
          })));
        }
      }
    };
    fetchPreview();
  }, [item.rawId, item.type]);

  const thumb = useUnifiedThumbnail(
    item.type === 'battle' ? '' : item.submission_url,
    item.platform,
    null,
    item.thumbnail_url,
  );

  const displayTitle = item.type === 'judge_video' ? (item.video_title || 'Judge Rating Video') : (item.custom_title || item.event_title || 'Untitled Edit');
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
  const badge = getTypeBadge(item.type, item.battle_status || item.fight_status);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.share?.({ url: item.submission_url, title: displayTitle });
  };

  const score = item.type === 'arena' ? item.qoi_score : item.total_score;
  const gradeInfo = score != null ? getGrade(score) : null;

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="border-b border-border/30 hover:bg-muted/5 transition-colors"
    >
      <div className="px-3 pt-2.5 pb-0.5">
        <div className="flex gap-2.5">
          {/* Avatar column */}
          <button onClick={() => navigate(`/editor/${item.user_id}`)} className="shrink-0 mt-0.5">
            <Avatar className="w-9 h-9 border border-border/50">
              <AvatarImage src={item.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold">
                {item.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            {/* Author row */}
            <div className="flex items-center gap-1 mb-0.5">
              <button
                onClick={() => navigate(`/editor/${item.user_id}`)}
                className="font-bold text-foreground text-[12px] hover:underline truncate"
              >
                {item.username}
              </button>
              {item.is_verified && <VerifiedBadge size="sm" />}
              <span className="text-muted-foreground text-[11px] truncate">@{item.username}</span>
              <span className="text-muted-foreground text-[11px]">·</span>
              <span className="text-muted-foreground text-[11px] shrink-0">{timeAgo.replace(' ago', '').replace('about ', '').replace('less than a minute', 'now')}</span>
            </div>

            {/* Post text / title */}
            {item.type === 'quick_fight' ? (
              <div className="mb-2">
                <p className="text-[14px] text-foreground leading-snug mb-1">
                  ⚔️ <span className="font-bold">{item.player_1_username}</span>
                  <span className="text-muted-foreground"> vs </span>
                  <span className="font-bold">{item.player_2_username || '???'}</span>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.cls} bg-current/10`} style={{ backgroundColor: 'transparent' }}>
                    <span className={`${badge.cls} flex items-center gap-1`}>{badge.icon} {badge.label}</span>
                  </span>
                  <span className="text-[11px] text-gold font-semibold">+20 IDX</span>
                  {item.fight_status === 'active' && (
                    <span className="text-[11px] text-red-400 font-bold animate-pulse">🔴 LIVE</span>
                  )}
                  {item.fight_status === 'judging' && (
                    <span className="text-[11px] text-purple-400 font-bold">⚖️ JUDGING</span>
                  )}
                  {item.fight_status === 'completed' && item.winner_score != null && (
                    <span className="text-[11px] text-gold font-bold">🏆 {item.winner_score}-{item.loser_score}</span>
                  )}
                </div>
              </div>
            ) : item.type === 'battle' ? (
              <div className="mb-2">
                <p className="text-[14px] text-foreground leading-snug mb-1">
                  ⚔️ <span className="font-bold">{item.challenger_username}</span>
                  <span className="text-muted-foreground"> vs </span>
                  <span className="font-bold">{item.opponent_username || '???'}</span>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-bold ${badge.cls} flex items-center gap-1`}>{badge.icon} {badge.label}</span>
                  {item.battle_status === 'active' && <span className="text-[11px] text-red-400 font-bold animate-pulse">🔴 LIVE</span>}
                  {item.battle_status === 'judging' && <span className="text-[11px] text-purple-400 font-bold">⚖️ JUDGING</span>}
                  {item.battle_status === 'completed' && item.challenger_score != null && (
                    <span className="text-[11px] text-muted-foreground">
                      {item.challenger_score} - {item.opponent_score}
                      {item.winner_id && <span className="text-gold ml-1">🏆 {item.winner_id === item.user_id ? item.challenger_username : item.opponent_username}</span>}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-2">
                <p className="text-[14px] text-foreground leading-snug">
                  {displayTitle}
                </p>
                {item.type === 'review' && item.judge_comment && (
                  <p className="text-[13px] text-muted-foreground leading-snug mt-1 line-clamp-2 italic">
                    "{item.judge_comment}"
                    {item.judge_username && (
                      <span className="text-foreground font-medium not-italic ml-1">— @{item.judge_username}</span>
                    )}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[11px] font-bold ${badge.cls} flex items-center gap-1`}>{badge.icon} {badge.label}</span>
                  {item.type === 'judge_video' && item.current_views != null && item.current_views > 0 && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                      <BarChart3 className="w-3 h-3" /> {item.current_views.toLocaleString()}
                    </span>
                  )}
                  {gradeInfo && score != null && (
                    <span className={`text-[11px] font-bold flex items-center gap-0.5 ${gradeInfo.color}`}>
                      <Star className="w-3 h-3" fill="currentColor" /> {Math.round(score)} QOI
                    </span>
                  )}
                  {item.final_rank && (
                    <span className="text-[11px] text-gold font-bold flex items-center gap-0.5">
                      <Trophy className="w-3 h-3" /> #{item.final_rank}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Media — Thumbnail or VS card */}
            {item.type === 'quick_fight' ? (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/fight/${item.fight_id}`); }}
                className="relative w-full rounded-2xl overflow-hidden mb-2 block border border-border/30"
              >
                <div className="w-full aspect-[16/9] bg-gradient-to-r from-red-950/40 via-surface-2 to-blue-950/40 flex items-center justify-center gap-6 relative">
                  <div className="flex flex-col items-center z-10">
                    <Avatar className="w-14 h-14 border-2 border-red-500/50 shadow-lg shadow-red-500/15">
                      <AvatarImage src={item.player_1_avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-foreground text-base font-bold">
                        {(item.player_1_username || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-bold text-foreground mt-1.5 truncate max-w-[80px]">@{item.player_1_username}</span>
                  </div>
                  <div className="flex flex-col items-center z-10">
                    <span className="text-xl font-black text-foreground/60 font-display">VS</span>
                    {item.fight_status === 'active' && <span className="text-[9px] font-bold text-red-400 uppercase animate-pulse mt-0.5">LIVE</span>}
                  </div>
                  <div className="flex flex-col items-center z-10">
                    <Avatar className="w-14 h-14 border-2 border-blue-500/50 shadow-lg shadow-blue-500/15">
                      <AvatarImage src={item.player_2_avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-foreground text-base font-bold">
                        {(item.player_2_username || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-bold text-foreground mt-1.5 truncate max-w-[80px]">@{item.player_2_username || '???'}</span>
                  </div>
                  {item.fight_status === 'completed' && item.winner_id && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gold/20 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Winner
                    </div>
                  )}
                </div>
              </button>
            ) : item.type === 'battle' ? (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/battle/${item.battle_id}`); }}
                className="relative w-full rounded-2xl overflow-hidden mb-2 block border border-border/30"
              >
                <div className="w-full aspect-[16/9] bg-gradient-to-r from-red-950/40 via-surface-2 to-blue-950/40 flex items-center justify-center gap-6 relative">
                  <div className="flex flex-col items-center z-10">
                    <Avatar className="w-14 h-14 border-2 border-red-500/50 shadow-lg shadow-red-500/15">
                      <AvatarImage src={item.challenger_avatar_url || item.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-foreground text-base font-bold">
                        {(item.challenger_username || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-bold text-foreground mt-1.5 truncate max-w-[80px]">@{item.challenger_username}</span>
                  </div>
                  <div className="flex flex-col items-center z-10">
                    <span className="text-xl font-black text-foreground/60 font-display">VS</span>
                    {item.battle_status === 'active' && <span className="text-[9px] font-bold text-red-400 uppercase animate-pulse mt-0.5">LIVE</span>}
                    {item.battle_status === 'judging' && <span className="text-[9px] font-bold text-purple-400 uppercase mt-0.5">JUDGING</span>}
                  </div>
                  <div className="flex flex-col items-center z-10">
                    <Avatar className="w-14 h-14 border-2 border-blue-500/50 shadow-lg shadow-blue-500/15">
                      <AvatarImage src={item.opponent_avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-foreground text-base font-bold">
                        {(item.opponent_username || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-bold text-foreground mt-1.5 truncate max-w-[80px]">@{item.opponent_username || '???'}</span>
                  </div>
                  {item.battle_status === 'completed' && item.winner_id && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gold/20 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> {item.winner_id === item.user_id ? item.challenger_username : item.opponent_username} wins
                    </div>
                  )}
                </div>
              </button>
            ) : (
              <div className="rounded-2xl overflow-hidden mb-2 border border-border/30">
                <ThumbnailImage
                  src={thumb.url}
                  alt={displayTitle}
                  status={thumb.status}
                  sourceUrl={thumb.sourceUrl}
                  onClick={onOpenPlayer}
                >
                  {/* Platform tag */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {platformLabels[item.platform] || item.platform}
                  </div>
                </ThumbnailImage>
              </div>
            )}

            {/* Score breakdown row */}
            {item.type === 'arena' && item.quality_score != null && (
              <div className="flex gap-3 mb-1">
                {[
                  { label: 'Quality', val: item.quality_score },
                  { label: 'Originality', val: item.originality_score },
                  { label: 'Impact', val: item.impact_score },
                ].map(({ label, val }) => (
                  <span key={label} className="text-[11px] text-muted-foreground">
                    {label} <span className="text-foreground font-semibold">{val}</span>
                  </span>
                ))}
              </div>
            )}

            {/* ─── Engagement Bar (X-style) ─── */}
            <div className="flex items-center justify-between max-w-[320px] -ml-1.5 mt-0 mb-0.5">
              {/* Comments */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors group"
              >
                <MessageCircle className="w-[18px] h-[18px] group-hover:text-primary" />
                {commentCount > 0 && <span className="text-[12px] font-medium">{commentCount}</span>}
              </button>

              {/* Like */}
              <button
                onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-colors group ${
                  liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'
                }`}
              >
                <Heart className={`w-[18px] h-[18px] ${liked ? 'fill-current' : ''}`} />
              </button>

              {/* Bookmark */}
              <button
                onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-colors group ${
                  bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                }`}
              >
                <Bookmark className={`w-[18px] h-[18px] ${bookmarked ? 'fill-current' : ''}`} />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1 px-2 py-1.5 rounded-full text-muted-foreground hover:text-green-400 hover:bg-green-400/10 transition-colors group"
              >
                <Share2 className="w-[18px] h-[18px]" />
              </button>

              {/* External link */}
              <a
                href={item.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center px-2 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
              >
                <ExternalLink className="w-[18px] h-[18px]" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Thread preview when collapsed */}
      {!isExpanded && previewComments.length > 0 && (
        <button
          onClick={onToggleExpand}
          className="px-3 pb-2 pt-0 w-full text-left pl-[56px]"
        >
          {previewComments.map((pc, i) => (
            <p key={i} className="text-[13px] text-muted-foreground leading-snug truncate">
              <span className="font-semibold text-foreground/70">@{pc.username}</span>{' '}
              {isGifUrl(pc.content) ? 'sent a GIF' : pc.content}
            </p>
          ))}
          {commentCount > 2 && (
            <p className="text-[12px] text-primary mt-0.5 font-medium">View all {commentCount} comments</p>
          )}
        </button>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/20 bg-muted/5"
          >
            <FeedInlineComments
              submissionId={item.rawId}
              submissionType={item.type}
              onCommentCountChange={setCommentCount}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
