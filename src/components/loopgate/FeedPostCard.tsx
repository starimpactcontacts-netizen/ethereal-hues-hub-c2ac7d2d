import { useNavigate } from "react-router-dom";
import { MessageCircle, Trash2, Trophy, ArrowUp, Link2, MoreHorizontal, Swords, X, Play, SmilePlus, Sparkles, Volume2, VolumeX, HelpCircle, Newspaper } from "lucide-react";
import FeedInlineComments from "./FeedInlineComments";
import GateIcon from '@/components/loopgate/GateIcon';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { FeedPostItem } from "@/hooks/useFeedPosts";
import VerifiedBadge from "./VerifiedBadge";
import { useAuth } from "@/hooks/useAuth";
import RichMessageContent from "./RichMessageContent";
import LoopReactions, { ReactionPickerModal } from "./LoopReactions";
import { useState, memo } from "react";
import { createPortal } from "react-dom";
import { ReactionGroup } from "@/hooks/useLoopReactions";
import { createBattle } from "@/hooks/useBattles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAutoplayVideo } from "@/hooks/useAutoplayVideo";
import FeedRateModal from "./FeedRateModal";
import { getRankFromLevel } from "@/data/gqtConfig";

interface FeedPostCardProps {
  post: FeedPostItem;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onDelete: (postId: string) => void;
  reactions?: ReactionGroup[];
  onToggleReaction?: (postId: string, emoji: string) => void;
}

function getLeagueBadge(league?: string) {
  if (league === 'elite') return { label: 'ELITE', cls: 'text-gold bg-gold/10 border-gold/30' };
  if (league === 'pro') return { label: 'PRO', cls: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
  return null;
}

function getPostTypeIndicator(type: string) {
  switch (type) {
    case 'flex': return { icon: <GateIcon className="w-3 h-3 text-gold" />, label: 'FLEX' };
    case 'edit_share': return { icon: <Link2 className="w-3 h-3 text-primary" />, label: 'EDIT' };
    case 'milestone': return { icon: <Trophy className="w-3 h-3 text-gold" />, label: 'MILESTONE' };
    case 'find_battle': return { icon: <Swords className="w-3 h-3 text-red-400" />, label: 'FIND A BATTLE' };
    case 'rate_edit': return { icon: <Sparkles className="w-3 h-3 text-purple-400" />, label: 'RATE MY EDIT' };
    case 'help': return { icon: <HelpCircle className="w-3 h-3 text-blue-400" />, label: 'EDITING HELP' };
    case 'competition': return { icon: <Trophy className="w-3 h-3 text-amber-400" />, label: 'COMPETITION' };
    case 'news': return { icon: <Newspaper className="w-3 h-3 text-emerald-400" />, label: 'NEWS' };
    default: return null;
  }
}

const FeedPostCard = memo(function FeedPostCard({ post, isLiked, isBookmarked, onLike, onBookmark, onDelete, reactions, onToggleReaction }: FeedPostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showChallengeConfirm, setShowChallengeConfirm] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [muted, setMuted] = useState(true);
  const isOwn = user?.id === post.user_id;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    .replace(' ago', '')
    .replace('about ', '')
    .replace('less than a minute', 'now');

  const leagueBadge = getLeagueBadge(post.league);
  const typeIndicator = getPostTypeIndicator(post.post_type);
  const userRank = getRankFromLevel(post.level);

  const urlMatch = post.media_url || post.content.match(/https?:\/\/[^\s]+/)?.[0];
  const hasUploadedMedia = !!post.uploaded_media_url;
  const isUploadedVideo = hasUploadedMedia && (
    post.uploaded_media_type === 'video' ||
    (post.uploaded_media_type?.startsWith('video') ?? false) ||
    /\.(mp4|mov|webm|m4v)(\?|$)/i.test(post.uploaded_media_url || '')
  );
  const videoRef = useAutoplayVideo(isUploadedVideo, post.uploaded_media_url ?? undefined);

  // Extract YouTube video ID for thumbnail
  const ytMatch = post.media_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?\s]+)/);
  const ytThumbnail = ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : null;

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`border-b border-border/30 hover:bg-muted/5 transition-colors ${
        post.is_system ? 'bg-gold/[0.02]' : ''
      }`}
    >
      <div className="px-3 pt-2.5 pb-1.5">
        {/* System post indicator */}
        {post.is_system && (
          <div className="flex items-center gap-1.5 mb-1.5 ml-11">
            <ArrowUp className="w-3 h-3 text-gold" />
            <span className="text-[11px] font-semibold text-gold">Platform Update</span>
          </div>
        )}

        <div className="flex gap-2.5">
          {/* Avatar */}
          <button onClick={() => navigate(`/editor/${post.user_id}`)} className="shrink-0 mt-0.5">
            <Avatar className="w-9 h-9 border border-border/50">
              <AvatarImage src={post.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold">
                {(post.username || 'U')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Author row */}
            <div className="flex items-center gap-1 mb-0.5">
              <button
                onClick={() => navigate(`/editor/${post.user_id}`)}
                className="font-bold text-foreground text-[12px] hover:underline truncate"
              >
                {post.username}
              </button>
              {post.is_verified && <VerifiedBadge size="sm" />}
              {leagueBadge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${leagueBadge.cls}`}>
                  {leagueBadge.label}
                </span>
              )}
              <span className="text-[9px] font-black tracking-[0.1em] px-1.5 py-0.5 rounded border border-foreground/15 bg-foreground/[0.04] text-foreground/80">
                RANK {userRank}
              </span>
              <span className="text-muted-foreground text-[11px]">·</span>
              <span className="text-muted-foreground text-[11px] shrink-0">{timeAgo}</span>

              {/* Menu */}
              {isOwn && (
                <div className="ml-auto relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded hover:bg-muted/30">
                    <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-6 bg-card border border-border rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                      <button
                        onClick={() => { onDelete(post.id); setShowMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-[12px] text-red-400 hover:bg-muted/30 flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Type badge */}
            {typeIndicator && (
              <div className="flex items-center gap-1 mb-1">
                {typeIndicator.icon}
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{typeIndicator.label}</span>
              </div>
            )}

            {/* Post content */}
            <div className="text-[14px] text-foreground leading-snug whitespace-pre-wrap break-words">
              <RichMessageContent content={post.content} showLinkPreviews={false} />
            </div>

            {/* Uploaded media */}
            {hasUploadedMedia && (
              <div className="mt-2 rounded-xl overflow-hidden border border-border/20 max-w-full">
                {isUploadedVideo ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      poster={post.uploaded_media_url ? `${post.uploaded_media_url}#t=0.1` : undefined}
                      className="w-full max-h-[360px] object-cover bg-black"
                      controls
                      muted={muted}
                      playsInline
                      loop
                      preload="none"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const v = videoRef.current;
                        const next = !muted;
                        setMuted(next);
                        if (v) {
                          v.muted = next;
                          if (!next) v.play().catch(() => {});
                        }
                      }}
                      className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white shadow-lg shadow-black/40 active:scale-95 transition-all hover:bg-black/80"
                      aria-label={muted ? 'Unmute' : 'Mute'}
                    >
                      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <img
                    src={post.uploaded_media_url!}
                    alt="Loop media"
                    className="w-full max-h-[360px] object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            )}

            {/* Media link preview — YouTube thumbnail or fallback */}
            {post.media_url && !hasUploadedMedia && (
              <a
                href={post.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block rounded-xl overflow-hidden border border-border/20"
              >
                {ytThumbnail ? (
                  <div className="relative">
                    <img
                      src={ytThumbnail}
                      alt="Video thumbnail"
                      className="w-full aspect-video object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/20 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-[12px] text-primary truncate">{post.media_url}</span>
                    </div>
                  </div>
                )}
              </a>
            )}

            {/* Emoji Reactions — Discord-style, no counters */}
            {onToggleReaction && (
              <LoopReactions
                reactions={reactions || []}
                onToggle={(emoji) => onToggleReaction(post.id, emoji)}
                hideCounts
              />
            )}

            {/* Loop-specific primary actions */}
            {post.post_type === 'find_battle' && !isOwn && user && (
              <div className="mt-2.5">
                <button
                  onClick={() => setShowChallengeConfirm(true)}
                  className="flex items-center gap-1.5 h-8 px-4 text-[11px] font-black uppercase tracking-wider text-white active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(90deg, #dc2626, #2563eb)', boxShadow: '0 2px 12px rgba(220,38,38,0.35)' }}
                >
                  <Swords className="w-3.5 h-3.5" /> Accept Battle
                </button>
              </div>
            )}

            {post.post_type === 'rate_edit' && (
              <div className="mt-2.5">
                <button
                  onClick={() => setShowRateModal(true)}
                  className="flex items-center gap-1.5 h-8 px-4 text-[11px] font-black uppercase tracking-wider text-purple-200 border border-purple-500/40 active:scale-95 transition-all"
                  style={{ background: 'rgba(168,85,247,0.15)' }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Rate This Edit
                </button>
              </div>
            )}

            {/* Action cluster — iPhone 17 glassy pill */}
            <div className="mt-2.5 inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl px-1 py-1 shadow-sm shadow-black/20">
              {/* Comment */}
              <button
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-1 h-7 px-2.5 rounded-full transition-all active:scale-95 ${showComments ? 'text-primary bg-primary/15' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                aria-label="Comments"
              >
                <MessageCircle className="w-[14px] h-[14px]" />
                {commentCount > 0 && <span className="text-[11px] font-semibold">{commentCount}</span>}
              </button>

              {/* React (opens modal) */}
              {onToggleReaction && (
                <button
                  onClick={() => setShowReactionPicker(true)}
                  className="flex items-center justify-center h-7 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all active:scale-95"
                  aria-label="React"
                >
                  <SmilePlus className="w-[14px] h-[14px]" />
                </button>
              )}

              {/* Rate Edit — opens Loopy with media prefilled */}
              {(post.media_url || post.uploaded_media_url) && (
                <button
                  onClick={() => setShowRateModal(true)}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-full text-muted-foreground hover:text-purple-300 hover:bg-purple-500/10 transition-all active:scale-95"
                  aria-label="Rate this edit"
                  title="Rate this edit"
                >
                  <Sparkles className="w-[13px] h-[13px]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Rate</span>
                </button>
              )}

              {/* Challenge */}
              {!isOwn && !post.is_system && user && (
                <button
                  onClick={() => setShowChallengeConfirm(true)}
                  className="flex items-center justify-center h-7 w-8 rounded-full hover:bg-gradient-to-r hover:from-red-500/15 hover:to-blue-500/15 transition-all active:scale-95"
                  title="Challenge this editor to a 1v1"
                  aria-label="1v1 challenge"
                >
                  <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id={`swords-grad-${post.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <line x1="14.5" y1="17.5" x2="3" y2="6" stroke={`url(#swords-grad-${post.id})`} />
                    <line x1="13" y1="19" x2="7" y2="13" stroke={`url(#swords-grad-${post.id})`} />
                    <line x1="16" y1="14" x2="18" y2="12" stroke={`url(#swords-grad-${post.id})`} />
                    <line x1="9.5" y1="6.5" x2="21" y2="18" stroke={`url(#swords-grad-${post.id})`} />
                    <line x1="11" y1="5" x2="17" y2="11" stroke={`url(#swords-grad-${post.id})`} />
                    <line x1="8" y1="10" x2="6" y2="12" stroke={`url(#swords-grad-${post.id})`} />
                  </svg>
                </button>
              )}
            </div>

            {/* Reaction picker modal (centered, mobile + desktop friendly) */}
            {onToggleReaction && (
              <ReactionPickerModal
                open={showReactionPicker}
                onClose={() => setShowReactionPicker(false)}
                onSelect={(emoji) => onToggleReaction(post.id, emoji)}
              />
            )}

            {/* 1-10 Rate modal — posts as a comment */}
            <FeedRateModal
              isOpen={showRateModal}
              onClose={() => setShowRateModal(false)}
              postId={post.id}
              username={post.username}
              onRated={() => setCommentCount((c) => c + 1)}
            />

              {/* 1v1 Challenge Confirmation Modal */}
              {createPortal(
                <AnimatePresence>
                  {showChallengeConfirm && (
                    <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
                      onClick={() => setShowChallengeConfirm(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto pointer-events-none"
                      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                    >
                      <div className="w-full max-w-sm bg-background border border-border/50 rounded-xl overflow-hidden shadow-2xl shadow-black/50 pointer-events-auto my-auto">
                        {/* Header — red-to-blue gradient */}
                        <div className="relative bg-gradient-to-r from-red-950/60 to-blue-950/60 p-4 border-b border-border/30">
                          <button onClick={() => setShowChallengeConfirm(false)} className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <div className="flex items-center gap-2 mb-1">
                            <Swords className="w-5 h-5 text-red-400" />
                            <h3 className="font-display text-lg text-foreground uppercase tracking-wide">1v1 Edit Battle</h3>
                          </div>
                          <p className="text-[11px] text-muted-foreground">You're about to challenge another editor</p>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* VS display */}
                          <div className="flex items-center justify-center gap-4 py-2">
                            <div className="text-center">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">You</p>
                              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                                <span className="font-display text-sm text-red-400">⚔️</span>
                              </div>
                            </div>
                            <span className="font-display text-xl text-muted-foreground/40">VS</span>
                            <div className="text-center">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Opponent</p>
                              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto overflow-hidden">
                                {post.avatar_url ? (
                                  <img src={post.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-display text-sm text-blue-400">{post.username?.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-foreground font-semibold mt-1 truncate max-w-[80px]">@{post.username}</p>
                            </div>
                          </div>

                          {/* Rules */}
                          <div className="bg-muted/30 rounded-lg px-3 py-2.5 space-y-1.5">
                            <p className="text-[10px] text-muted-foreground">⏱ 48 hours to submit your edit</p>
                            <p className="text-[10px] text-muted-foreground">🎬 Both editors submit, judges decide</p>
                            <p className="text-[10px] text-muted-foreground">📊 Winner gains Index, loser takes a hit</p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => setShowChallengeConfirm(false)}
                              className="flex-1 h-10 rounded-lg border border-border/50 text-xs text-muted-foreground font-semibold hover:bg-muted/20 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={challengeLoading}
                              onClick={async () => {
                                setChallengeLoading(true);
                                const { data: myProfile } = await supabase
                                  .from('profiles')
                                  .select('username, avatar_url, league')
                                  .eq('id', user.id)
                                  .single();
                                if (!myProfile) { toast.error('Profile not found'); setChallengeLoading(false); return; }

                                const result = await createBattle(
                                  user.id,
                                  myProfile.username,
                                  myProfile.avatar_url,
                                  myProfile.league || 'open',
                                  48,
                                  'direct',
                                  post.user_id,
                                  post.username,
                                  post.avatar_url,
                                );
                                if (result.success && result.battleId) {
                                  await supabase.from('feed_posts').insert({
                                    user_id: user.id,
                                    content: `⚔️ @${myProfile.username} challenged @${post.username} to a 1v1 Edit Battle!`,
                                    post_type: 'milestone',
                                    is_system: true,
                                    data: { battle_id: result.battleId, challenger: myProfile.username, opponent: post.username },
                                  });
                                  toast.success('Battle challenge sent!');
                                  setShowChallengeConfirm(false);
                                  navigate(`/battle/${result.battleId}`);
                                } else {
                                  toast.error(result.error || 'Failed to create battle');
                                }
                                setChallengeLoading(false);
                              }}
                              className="flex-1 h-10 rounded-lg bg-gradient-to-r from-red-600 to-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:from-red-500 hover:to-blue-500 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              {challengeLoading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <><Swords className="w-3.5 h-3.5" /> Challenge</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    </>
                  )}
                </AnimatePresence>,
                document.body
              )}

          </div>
        </div>
      </div>
      {/* Inline comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/20 bg-muted/5"
          >
            <FeedInlineComments
              submissionId={post.id}
              submissionType={'feed_post' as any}
              onCommentCountChange={(count) => setCommentCount(count)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
});

export default FeedPostCard;
