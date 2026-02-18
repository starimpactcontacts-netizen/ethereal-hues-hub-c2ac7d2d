 import { useState, useEffect, useRef } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { X, Heart, Send, Reply, Loader2, MessageCircle, Smile } from 'lucide-react';
 import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { toast } from 'sonner';
 import { formatDistanceToNow } from 'date-fns';
 import GifPicker from './GifPicker';

 const isGifUrl = (text: string) =>
   text.includes('tenor.com') || text.includes('giphy.com') || /\.(gif|gifv)(\?|$)/i.test(text);
 
 interface Comment {
   id: string;
   content: string;
   user_id: string;
   username: string;
   avatar_url: string | null;
   like_count: number;
   reply_count: number;
   created_at: string;
   parent_id: string | null;
   isLiked?: boolean;
   replies?: Comment[];
 }
 
 interface FeedCommentsProps {
   isOpen: boolean;
   onClose: () => void;
   submissionId: string;
   submissionType: 'arena' | 'review' | 'battle' | 'judge_video' | 'quick_fight' | 'featured_submission';
   username: string;
 }
 
 export default function FeedComments({
   isOpen,
   onClose,
   submissionId,
   submissionType,
   username
 }: FeedCommentsProps) {
   const { user, profile } = useAuth();
   const [comments, setComments] = useState<Comment[]>([]);
   const [loading, setLoading] = useState(true);
   const [sending, setSending] = useState(false);
   const [newComment, setNewComment] = useState('');
   const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
   const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
   const [showGifPicker, setShowGifPicker] = useState(false);
   const inputRef = useRef<HTMLTextAreaElement>(null);
   
   // Fetch comments
   useEffect(() => {
     if (!isOpen) return;
     
     const fetchComments = async () => {
       setLoading(true);
       try {
         const { data: commentsData, error } = await supabase
           .from('feed_comments')
           .select('*')
           .eq('submission_id', submissionId)
           .eq('submission_type', submissionType)
           .is('parent_id', null)
           .order('created_at', { ascending: false });
         
         if (error) throw error;
         
         const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
         const { data: profiles } = await supabase
           .from('profiles')
           .select('id, username, avatar_url')
           .in('id', userIds.length > 0 ? userIds : ['']);
         
         const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
         
         let likedCommentIds: string[] = [];
         if (user) {
           const commentIds = commentsData?.map(c => c.id) || [];
           const { data: likes } = await supabase
             .from('feed_comment_likes')
             .select('comment_id')
             .eq('user_id', user.id)
             .in('comment_id', commentIds.length > 0 ? commentIds : ['']);
           likedCommentIds = likes?.map(l => l.comment_id) || [];
         }
         
         const enrichedComments: Comment[] = (commentsData || []).map(c => ({
           ...c,
           username: profileMap.get(c.user_id)?.username || 'Unknown',
           avatar_url: profileMap.get(c.user_id)?.avatar_url || null,
           isLiked: likedCommentIds.includes(c.id)
         }));
         
         setComments(enrichedComments);
       } catch (err) {
         console.error('Error fetching comments:', err);
       } finally {
         setLoading(false);
       }
     };
     
     fetchComments();
   }, [isOpen, submissionId, submissionType, user]);
   
   const loadReplies = async (parentId: string) => {
     if (expandedReplies.has(parentId)) {
       setExpandedReplies(prev => {
         const next = new Set(prev);
         next.delete(parentId);
         return next;
       });
       return;
     }
     
     try {
       const { data: repliesData } = await supabase
         .from('feed_comments')
         .select('*')
         .eq('parent_id', parentId)
         .order('created_at', { ascending: true });
       
       const userIds = [...new Set(repliesData?.map(c => c.user_id) || [])];
       const { data: profiles } = await supabase
         .from('profiles')
         .select('id, username, avatar_url')
         .in('id', userIds.length > 0 ? userIds : ['']);
       
       const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
       
       let likedReplyIds: string[] = [];
       if (user) {
         const replyIds = repliesData?.map(c => c.id) || [];
         const { data: likes } = await supabase
           .from('feed_comment_likes')
           .select('comment_id')
           .eq('user_id', user.id)
           .in('comment_id', replyIds.length > 0 ? replyIds : ['']);
         likedReplyIds = likes?.map(l => l.comment_id) || [];
       }
       
       const enrichedReplies: Comment[] = (repliesData || []).map(c => ({
         ...c,
         username: profileMap.get(c.user_id)?.username || 'Unknown',
         avatar_url: profileMap.get(c.user_id)?.avatar_url || null,
         isLiked: likedReplyIds.includes(c.id)
       }));
       
       setComments(prev => prev.map(c => 
         c.id === parentId ? { ...c, replies: enrichedReplies } : c
       ));
       
       setExpandedReplies(prev => new Set(prev).add(parentId));
     } catch (err) {
       console.error('Error loading replies:', err);
     }
   };
   
   const submitContent = async (content: string) => {
     if (!user || !profile || !content.trim()) return;
     
     setSending(true);
     try {
       const { data, error } = await supabase
         .from('feed_comments')
         .insert({
           submission_id: submissionId,
           submission_type: submissionType,
           user_id: user.id,
           content: content.trim(),
           parent_id: replyingTo?.id || null
         })
         .select()
         .single();
       
       if (error) throw error;
       
       const newCommentObj: Comment = {
         ...data,
         username: profile.username || 'Unknown',
         avatar_url: profile.avatar_url || null,
         isLiked: false
       };
       
       if (replyingTo) {
         setComments(prev => prev.map(c => 
           c.id === replyingTo.id 
             ? { 
                 ...c, 
                 reply_count: c.reply_count + 1,
                 replies: [...(c.replies || []), newCommentObj]
               } 
             : c
         ));
         setReplyingTo(null);
       } else {
         setComments(prev => [newCommentObj, ...prev]);
       }
       
       setNewComment('');
     } catch (err) {
       console.error('Error posting comment:', err);
       toast.error('Failed to post comment');
     } finally {
       setSending(false);
     }
   };

   const handleSubmit = () => submitContent(newComment);

   const handleGifSelect = (gifUrl: string) => {
     setShowGifPicker(false);
     submitContent(gifUrl);
   };
   
   const toggleLike = async (comment: Comment, isReply = false, parentId?: string) => {
     if (!user) {
       toast.error('Sign in to like comments');
       return;
     }
     
     const wasLiked = comment.isLiked;
     
     const updateComment = (c: Comment) => 
       c.id === comment.id 
         ? { ...c, isLiked: !wasLiked, like_count: c.like_count + (wasLiked ? -1 : 1) }
         : c;
     
     if (isReply && parentId) {
       setComments(prev => prev.map(c => 
         c.id === parentId 
           ? { ...c, replies: c.replies?.map(updateComment) }
           : c
       ));
     } else {
       setComments(prev => prev.map(updateComment));
     }
     
     try {
       if (wasLiked) {
         await supabase
           .from('feed_comment_likes')
           .delete()
           .eq('comment_id', comment.id)
           .eq('user_id', user.id);
       } else {
         await supabase
           .from('feed_comment_likes')
           .insert({ comment_id: comment.id, user_id: user.id });
       }
     } catch (err) {
       console.error('Error toggling like:', err);
       if (isReply && parentId) {
         setComments(prev => prev.map(c => 
           c.id === parentId 
             ? { ...c, replies: c.replies?.map(r => r.id === comment.id ? comment : r) }
             : c
         ));
       } else {
         setComments(prev => prev.map(c => c.id === comment.id ? comment : c));
       }
     }
   };
   
   const startReply = (comment: Comment) => {
     setReplyingTo(comment);
     inputRef.current?.focus();
   };
 
   return (
     <AnimatePresence>
       {isOpen && (
         <>
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="absolute inset-0 bg-black/50 z-10"
           />
           
           <motion.div
             initial={{ y: '100%' }}
             animate={{ y: 0 }}
             exit={{ y: '100%' }}
             transition={{ type: 'spring', damping: 25, stiffness: 300 }}
             className="absolute bottom-0 left-0 right-0 z-20 bg-surface-1 rounded-t-3xl max-h-[70vh] flex flex-col"
           >
             <div className="flex justify-center pt-3 pb-2">
               <div className="w-10 h-1 rounded-full bg-border" />
             </div>
             
             <div className="flex items-center justify-between px-4 py-2 border-b border-border">
               <h3 className="font-display text-lg text-foreground">
                 Comments
               </h3>
               <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-full transition-colors">
                 <X className="w-5 h-5 text-muted-foreground" />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {loading ? (
                 <div className="flex items-center justify-center py-8">
                   <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                 </div>
               ) : comments.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                   <MessageCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
                   <p className="text-muted-foreground">No comments yet</p>
                   <p className="text-muted-foreground/60 text-sm">Be the first to comment!</p>
                 </div>
               ) : (
                 comments.map(comment => (
                   <div key={comment.id} className="space-y-3">
                     <CommentItem 
                       comment={comment}
                       onLike={() => toggleLike(comment)}
                       onReply={() => startReply(comment)}
                       onLoadReplies={() => loadReplies(comment.id)}
                       isExpanded={expandedReplies.has(comment.id)}
                     />
                     
                     {expandedReplies.has(comment.id) && comment.replies && (
                       <div className="ml-10 space-y-3 border-l-2 border-border/50 pl-4">
                         {comment.replies.map(reply => (
                           <CommentItem 
                             key={reply.id}
                             comment={reply}
                             onLike={() => toggleLike(reply, true, comment.id)}
                             isReply
                           />
                         ))}
                       </div>
                     )}
                   </div>
                 ))
               )}
             </div>
             
             {/* GIF Picker */}
             {showGifPicker && (
               <div className="px-4 border-t border-border">
                 <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
               </div>
             )}

             {/* Input Area */}
             <div className="border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
               {replyingTo && (
                 <div className="flex items-center justify-between mb-2 px-2 py-1 bg-muted/30 rounded-lg">
                   <span className="text-sm text-muted-foreground">
                     Replying to <span className="text-foreground font-medium">@{replyingTo.username}</span>
                   </span>
                   <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-muted/50 rounded">
                     <X className="w-4 h-4 text-muted-foreground" />
                   </button>
                 </div>
               )}
               
               <div className="flex items-end gap-3">
                 <Avatar className="w-8 h-8 shrink-0">
                   <AvatarImage src={profile?.avatar_url || undefined} />
                   <AvatarFallback className="bg-muted text-foreground text-xs">
                     {profile?.username?.[0]?.toUpperCase() || '?'}
                   </AvatarFallback>
                 </Avatar>
                 
                 <Textarea
                   ref={inputRef}
                   value={newComment}
                   onChange={(e) => setNewComment(e.target.value)}
                   placeholder={user ? "Add a comment..." : "Sign in to comment"}
                   className="flex-1 min-h-[40px] max-h-[100px] resize-none bg-muted/30 border-border"
                   disabled={!user}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleSubmit();
                     }
                   }}
                 />

                 <button
                   onClick={() => setShowGifPicker(!showGifPicker)}
                   disabled={!user}
                   className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                 >
                   <Smile className="w-5 h-5" />
                 </button>
                 
                 <Button
                   size="icon"
                   onClick={handleSubmit}
                   disabled={!user || !newComment.trim() || sending}
                   className="shrink-0"
                 >
                   {sending ? (
                     <Loader2 className="w-4 h-4 animate-spin" />
                   ) : (
                     <Send className="w-4 h-4" />
                   )}
                 </Button>
               </div>
             </div>
           </motion.div>
         </>
       )}
     </AnimatePresence>
   );
 }
 
 function CommentItem({
   comment,
   onLike,
   onReply,
   onLoadReplies,
   isExpanded,
   isReply = false
 }: {
   comment: Comment;
   onLike: () => void;
   onReply?: () => void;
   onLoadReplies?: () => void;
   isExpanded?: boolean;
   isReply?: boolean;
 }) {
   return (
     <div className="flex gap-3">
       <Avatar className={isReply ? "w-7 h-7" : "w-9 h-9"}>
         <AvatarImage src={comment.avatar_url || undefined} />
         <AvatarFallback className="bg-muted text-foreground text-xs">
           {comment.username[0]?.toUpperCase()}
         </AvatarFallback>
       </Avatar>
       
       <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 mb-1">
           <span className={`font-medium text-foreground ${isReply ? 'text-sm' : ''}`}>
             @{comment.username}
           </span>
           <span className="text-xs text-muted-foreground">
             {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
           </span>
         </div>
         
         {isGifUrl(comment.content) ? (
           <img src={comment.content} alt="GIF" className="max-w-[200px] rounded-lg mt-1" loading="lazy" />
         ) : (
           <p className={`text-foreground break-words ${isReply ? 'text-sm' : ''}`}>
             {comment.content}
           </p>
         )}
         
         <div className="flex items-center gap-4 mt-2">
           <button 
             onClick={onLike}
             className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
           >
             <Heart 
               className={`w-4 h-4 ${comment.isLiked ? 'fill-red-500 text-red-500' : ''}`} 
             />
             {comment.like_count > 0 && (
               <span className="text-xs">{comment.like_count}</span>
             )}
           </button>
           
           {onReply && !isReply && (
             <button 
               onClick={onReply}
               className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
             >
               <Reply className="w-4 h-4" />
               <span className="text-xs">Reply</span>
             </button>
           )}
           
           {!isReply && comment.reply_count > 0 && onLoadReplies && (
             <button 
               onClick={onLoadReplies}
               className="text-xs text-primary hover:underline"
             >
               {isExpanded ? 'Hide replies' : `View ${comment.reply_count} ${comment.reply_count === 1 ? 'reply' : 'replies'}`}
             </button>
           )}
         </div>
       </div>
     </div>
   );
 }
