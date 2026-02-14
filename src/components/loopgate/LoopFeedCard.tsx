import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Trophy, MessageCircle, Share2, ExternalLink, Sparkles, ChevronDown, ChevronUp, Swords, Video } from "lucide-react";
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
  // Battle-specific
  battle_id?: string;
  opponent_username?: string | null;
  challenger_username?: string | null;
  challenger_avatar_url?: string | null;
  opponent_avatar_url?: string | null;
  challenger_score?: number | null;
  opponent_score?: number | null;
  winner_id?: string | null;
  battle_status?: string;
  // Judge video specific
  video_title?: string | null;
  current_views?: number | null;
  is_verified?: boolean;
  // Quick fight specific
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
  // Unit info
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

  // Fetch comment count + preview on mount
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.share?.({ url: item.submission_url, title: displayTitle });
  };

  const score = item.type === 'arena' ? item.qoi_score : item.total_score;
  const gradeInfo = score != null ? getGrade(score) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="border-b border-border/40 hover:bg-surface-1/20 transition-colors"
    >
      <div className="px-3 pt-2 pb-1">
        <div className="flex gap-2">
          {/* Avatar */}
          <button onClick={() => navigate(`/editor/${item.user_id}`)} className="shrink-0 mt-0.5">
            <Avatar className="w-7 h-7 border border-border/60">
              <AvatarImage src={item.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-foreground text-[9px] font-bold">
                {item.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Author line */}
            <div className="flex items-center gap-1 mb-px">
              <button
                onClick={() => navigate(`/editor/${item.user_id}`)}
                className="font-semibold text-foreground text-[12px] hover:underline truncate"
              >
                @{item.username}
              </button>
              {item.is_verified && <VerifiedBadge size="sm" />}
              <span className="text-muted-foreground text-[10px] shrink-0">· {timeAgo}</span>
              <div className="flex-1" />
              {item.type === 'arena' ? (
                <span className="bg-gold/15 text-gold text-[8px] font-bold px-1 py-px rounded flex items-center gap-0.5 shrink-0">
                  <Trophy className="w-2 h-2" />
                  ARENA
                </span>
              ) : item.type === 'quick_fight' ? (
                <span className="bg-red-500/15 text-red-400 text-[8px] font-bold px-1 py-px rounded flex items-center gap-0.5 shrink-0">
                  <Swords className="w-2 h-2" />
                  QUICK 1v1
                </span>
              ) : item.type === 'battle' ? (
                <span className="bg-red-500/15 text-red-400 text-[8px] font-bold px-1 py-px rounded flex items-center gap-0.5 shrink-0">
                  <span className="font-display">⚔</span>
                  1v1
                </span>
              ) : item.type === 'judge_video' ? (
                <span className="bg-purple-500/15 text-purple-400 text-[8px] font-bold px-1 py-px rounded flex items-center gap-0.5 shrink-0">
                  <Video className="w-2 h-2" />
                  JUDGE
                </span>
              ) : (
                <span className="bg-purple-500/15 text-purple-400 text-[8px] font-bold px-1 py-px rounded flex items-center gap-0.5 shrink-0">
                  <Sparkles className="w-2 h-2" />
                  REVIEW
                </span>
              )}
            </div>

            {/* Title */}
            {item.type === 'quick_fight' ? (
              <div className="mb-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] text-foreground/90 leading-tight line-clamp-1">
                    ⚔ <span className="font-semibold">{item.player_1_username}</span>
                    <span className="text-muted-foreground mx-1">vs</span>
                    <span className="font-semibold">{item.player_2_username || '???'}</span>
                  </p>
                </div>
                {item.unit_name && (
                  <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span>{item.unit_emblem || '🛡'}</span> {item.unit_name}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-gold font-bold">+20 IDX</span>
                  <span className="text-[9px] text-muted-foreground">•</span>
                  <span className="text-[9px] text-muted-foreground">{item.duration_minutes || 180}min</span>
                  {item.fight_status === 'active' && (
                    <span className="text-[9px] text-red-400 font-bold uppercase animate-pulse">🔴 LIVE</span>
                  )}
                  {item.fight_status === 'judging' && (
                    <span className="text-[9px] text-purple-400 font-bold uppercase">⚖️ JUDGING</span>
                  )}
                  {item.fight_status === 'completed' && item.winner_score != null && (
                    <span className="text-[9px] text-gold font-bold">
                      🏆 {item.winner_score}-{item.loser_score}
                    </span>
                  )}
                </div>
              </div>
            ) : item.type === 'battle' ? (
              <div className="mb-1">
                <p className="text-[12px] text-foreground/90 leading-tight line-clamp-1">
                  ⚔ <span className="font-semibold">{item.challenger_username}</span>
                  <span className="text-muted-foreground mx-1">vs</span>
                  <span className="font-semibold">{item.opponent_username || '???'}</span>
                </p>
                {item.battle_status === 'completed' && item.challenger_score != null && item.opponent_score != null && (
                  <p className="text-[10px] text-muted-foreground">
                    Score: <span className="text-foreground font-bold">{item.challenger_score}</span> - <span className="text-foreground font-bold">{item.opponent_score}</span>
                    {item.winner_id && (
                      <span className="text-gold ml-1">
                        🏆 {item.winner_id === item.user_id ? item.challenger_username : item.opponent_username}
                      </span>
                    )}
                  </p>
                )}
                {item.battle_status === 'active' && (
                  <p className="text-[10px] text-red-400 font-bold uppercase">🔴 Live Now</p>
                )}
                {item.battle_status === 'judging' && (
                  <p className="text-[10px] text-purple-400 font-bold uppercase">⏳ Judging</p>
                )}
              </div>
            ) : (
              <div className="mb-1">
                <p className="text-[12px] text-foreground/90 leading-tight line-clamp-1">
                  {displayTitle}
                </p>
                {item.type === 'judge_video' && item.current_views != null && item.current_views > 0 && (
                  <p className="text-[10px] text-muted-foreground">{item.current_views.toLocaleString()} views</p>
                )}
              </div>
            )}

            {/* Thumbnail / VS Clash */}
            {item.type === 'quick_fight' ? (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/fight/${item.fight_id}`); }}
                className="relative w-full rounded-md overflow-hidden mb-1 block"
              >
                <div className="w-full aspect-[16/9] bg-gradient-to-r from-red-950/60 via-surface-2 to-blue-950/60 flex items-center justify-center gap-3 relative">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-foreground rotate-12" />
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-foreground -rotate-12" />
                  </div>
                  {/* P1 */}
                  <div className="flex flex-col items-center z-10">
                    <Avatar className="w-12 h-12 border-2 border-red-500/60 shadow-lg shadow-red-500/20">
                      <AvatarImage src={item.player_1_avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-foreground text-sm font-bold">
                        {(item.player_1_username || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-bold text-foreground mt-1 truncate max-w-[72px]">
                      @{item.player_1_username}
                    </span>
                    <span className="text-[8px] text-red-400 font-bold">RED</span>
                  </div>
                  {/* VS + Prize */}
                  <div className="flex flex-col items-center z-10">
                    <span className="text-lg font-black text-foreground/80 tracking-tighter font-display">VS</span>
                    <span className="text-[9px] font-bold text-gold">+20 IDX</span>
                    {item.fight_status === 'active' && (
                      <span className="text-[8px] font-bold text-red-400 uppercase animate-pulse">LIVE</span>
                    )}
                    {item.fight_status === 'completed' && item.winner_score != null && (
                      <span className="text-[9px] font-bold text-muted-foreground">
                        {item.winner_score} - {item.loser_score}
                      </span>
                    )}
                  </div>
                  {/* P2 */}
                  <div className="flex flex-col items-center z-10">
                    <Avatar className="w-12 h-12 border-2 border-blue-500/60 shadow-lg shadow-blue-500/20">
                      <AvatarImage src={item.player_2_avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-foreground text-sm font-bold">
                        {(item.player_2_username || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-bold text-foreground mt-1 truncate max-w-[72px]">
                      @{item.player_2_username || '???'}
                    </span>
                    <span className="text-[8px] text-blue-400 font-bold">BLUE</span>
                  </div>
                  {/* Winner crown */}
                  {item.fight_status === 'completed' && item.winner_id && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-gold/20 text-gold text-[8px] font-bold px-1.5 py-px rounded-full flex items-center gap-0.5">
                      <Trophy className="w-2.5 h-2.5" />
                      Winner
                    </div>
                  )}
                </div>
              </button>
            ) : item.type === 'battle' ? (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/battle/${item.battle_id}`); }}
                className="relative w-full rounded-md overflow-hidden mb-1 block"
              >
                <div className="w-full aspect-[16/9] bg-gradient-to-r from-red-950/60 via-surface-2 to-blue-950/60 flex items-center justify-center gap-3 relative">
                  {/* Diagonal slash lines */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-foreground rotate-12" />
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-foreground -rotate-12" />
                  </div>

                  {/* Challenger */}
                  <div className="flex flex-col items-center z-10">
                    <Avatar className="w-12 h-12 border-2 border-red-500/60 shadow-lg shadow-red-500/20">
                      <AvatarImage src={item.challenger_avatar_url || item.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-foreground text-sm font-bold">
                        {(item.challenger_username || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-bold text-foreground mt-1 truncate max-w-[72px]">
                      @{item.challenger_username}
                    </span>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center z-10">
                    <span className="text-lg font-black text-foreground/80 tracking-tighter font-display">VS</span>
                    {item.battle_status === 'active' && (
                      <span className="text-[8px] font-bold text-red-400 uppercase animate-pulse">LIVE</span>
                    )}
                    {item.battle_status === 'judging' && (
                      <span className="text-[8px] font-bold text-purple-400 uppercase">JUDGING</span>
                    )}
                    {item.battle_status === 'completed' && item.challenger_score != null && (
                      <span className="text-[9px] font-bold text-muted-foreground">
                        {item.challenger_score} - {item.opponent_score}
                      </span>
                    )}
                  </div>

                  {/* Opponent */}
                  <div className="flex flex-col items-center z-10">
                    <Avatar className="w-12 h-12 border-2 border-blue-500/60 shadow-lg shadow-blue-500/20">
                      <AvatarImage src={item.opponent_avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-foreground text-sm font-bold">
                        {(item.opponent_username || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-bold text-foreground mt-1 truncate max-w-[72px]">
                      @{item.opponent_username || '???'}
                    </span>
                  </div>

                  {/* Winner crown */}
                  {item.battle_status === 'completed' && item.winner_id && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-gold/20 text-gold text-[8px] font-bold px-1.5 py-px rounded-full flex items-center gap-0.5">
                      <Trophy className="w-2.5 h-2.5" />
                      {item.winner_id === item.user_id ? item.challenger_username : item.opponent_username} wins
                    </div>
                  )}
                </div>
              </button>
            ) : (
              <ThumbnailImage
                src={thumb.url}
                alt={displayTitle}
                status={thumb.status}
                sourceUrl={thumb.sourceUrl}
                onClick={onOpenPlayer}
              >
                {/* Score */}
                {gradeInfo && score != null && (
                  <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm rounded px-1 py-px flex items-center gap-0.5">
                    {item.type === 'arena' ? (
                      <>
                        <Star className="w-2.5 h-2.5 text-gold" fill="currentColor" />
                        <span className="text-white font-bold text-[10px]">{Math.round(score)}</span>
                      </>
                    ) : (
                      <span className={`font-display text-xs font-bold ${gradeInfo.color}`}>
                        {gradeInfo.grade}
                      </span>
                    )}
                  </div>
                )}

                {/* Rank */}
                {item.final_rank && (
                  <div className="absolute bottom-1 left-1 bg-gold text-black rounded px-1 py-px flex items-center gap-0.5">
                    <Trophy className="w-2 h-2" />
                    <span className="font-bold text-[9px]">#{item.final_rank}</span>
                  </div>
                )}

                {/* Platform */}
                <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold px-1 py-px rounded">
                  {platformLabels[item.platform] || item.platform}
                </div>
              </ThumbnailImage>
            )}

            {/* Score breakdown */}
            {item.type === 'arena' && item.quality_score != null && (
              <div className="flex gap-2 mb-0.5">
                {[
                  { label: 'Q', val: item.quality_score },
                  { label: 'O', val: item.originality_score },
                  { label: 'I', val: item.impact_score },
                ].map(({ label, val }) => (
                  <span key={label} className="text-[9px] text-muted-foreground">
                    {label} <span className="text-foreground font-medium">{val}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Judge quote */}
            {item.type === 'review' && item.judge_comment && (
              <p className="text-[11px] text-muted-foreground leading-snug mb-1 line-clamp-1 italic">
                "{item.judge_comment}"
                {item.judge_username && (
                  <span className="text-foreground font-medium not-italic ml-1">— @{item.judge_username}</span>
                )}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center -ml-1.5 gap-px">
              {item.type === 'quick_fight' && item.fight_id && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/fight/${item.fight_id}`); }}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-red-400 hover:bg-red-500/10 transition-colors text-[10px] font-semibold"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>{item.fight_status === 'active' ? 'Watch' : item.fight_status === 'judging' ? 'Judge' : 'View'}</span>
                </button>
              )}
              {item.type === 'battle' && item.battle_id && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/battle/${item.battle_id}`); }}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-red-400 hover:bg-red-500/10 transition-colors text-[10px] font-semibold"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Watch</span>
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-[10px]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {commentCount > 0 && <span className="font-medium">{commentCount}</span>}
                {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center px-1.5 py-0.5 rounded-full text-muted-foreground hover:text-green-400 hover:bg-green-400/10 transition-colors text-[10px]"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <a
                href={item.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center px-1.5 py-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors text-[10px]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Thread preview when collapsed */}
      {!isExpanded && previewComments.length > 0 && (
        <button
          onClick={onToggleExpand}
          className="px-4 pb-2 pt-0.5 w-full text-left"
        >
          {previewComments.map((pc, i) => (
            <p key={i} className="text-[11px] text-muted-foreground leading-snug truncate">
              <span className="font-semibold text-foreground/70">@{pc.username}</span>{' '}
              {isGifUrl(pc.content) ? 'sent a GIF' : pc.content}
            </p>
          ))}
          {commentCount > 2 && (
            <p className="text-[10px] text-primary mt-0.5">View all {commentCount} comments</p>
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
            className="overflow-hidden border-t border-border/30 bg-surface-0/50"
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