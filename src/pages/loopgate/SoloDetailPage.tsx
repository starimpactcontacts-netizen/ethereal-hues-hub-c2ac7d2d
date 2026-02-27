import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ExternalLink, ThumbsUp, ThumbsDown, Camera, Music,
  Trophy, Zap, Clock, UserRound, MessageCircle, Upload, Play
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSoloVote } from '@/hooks/useSoloVote';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import FeedInlineComments from '@/components/loopgate/FeedInlineComments';
import FeedVideoPlayer from '@/components/loopgate/FeedVideoPlayer';
import type { SoloSubmission } from '@/hooks/useSoloMode';

export default function SoloDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [solo, setSolo] = useState<SoloSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { myVote, upvotes, downvotes, vote } = useSoloVote(id);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('solo_submissions')
        .select('*')
        .eq('id', id)
        .single();
      setSolo(data as SoloSubmission | null);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !solo) return;
    setUploading(true);
    try {
      const path = `${user.id}/${solo.id}.webp`;
      const { error: uploadError } = await supabase.storage
        .from('solo-thumbnails')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('solo-thumbnails')
        .getPublicUrl(path);

      await supabase
        .from('solo_submissions')
        .update({ thumbnail_url: urlData.publicUrl })
        .eq('id', solo.id);

      setSolo(prev => prev ? { ...prev, thumbnail_url: urlData.publicUrl } : prev);
      toast.success('Thumbnail uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    editing: { label: 'EDITING', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
    submitted: { label: 'SUBMITTED', color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/30' },
    judging: { label: 'JUDGING', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
    scored: { label: 'SCORED', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!solo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-3">Solo edit not found</p>
          <button onClick={() => navigate(-1)} className="text-gold text-sm font-bold">Go back</button>
        </div>
      </div>
    );
  }

  const s = statusConfig[solo.status] || statusConfig.editing;
  const isOwner = user?.id === solo.user_id;
  const timeAgo = formatDistanceToNow(new Date(solo.created_at), { addSuffix: true });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Back button */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-foreground">Solo Edit</span>
        <div className={`ml-auto px-2.5 py-0.5 border text-[10px] font-bold uppercase tracking-wider ${s.color} ${s.bg}`}>
          {s.label}
        </div>
      </div>

      {/* Hero thumbnail / theme visual */}
      <div className="relative aspect-video bg-gradient-to-br from-gold/5 via-surface-1 to-purple-500/10 overflow-hidden">
        {solo.thumbnail_url ? (
          <img src={solo.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <UserRound className="w-10 h-10 text-gold/20 mx-auto mb-2" />
              <span className="text-gold/30 text-xs uppercase tracking-widest">Solo Edit</span>
            </div>
          </div>
        )}

        {/* Theme overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4 pt-12">
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
            "{solo.theme}"
          </h1>
        </div>

        {/* QOI badge */}
        {solo.qoi_score != null && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 border border-gold/30">
            <span className="text-xl font-black text-gold">{Math.round(solo.qoi_score)}</span>
            <span className="text-[9px] text-gold/60 ml-1 uppercase">QOI</span>
          </div>
        )}

        {/* Watch button — opens inline player */}
        {solo.submission_url && (
          <button
            onClick={() => setShowPlayer(true)}
            className="absolute top-3 left-3 bg-gold/90 hover:bg-gold text-background px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> Watch Edit
          </button>
        )}
      </div>

      {/* Editor profile bar */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate(`/editor/${solo.user_id}`)} className="shrink-0">
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage src={solo.avatar_url || ''} />
            <AvatarFallback className="bg-surface-2 text-xs font-bold">
              {solo.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-foreground">@{solo.username}</span>
            <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
            <Music className="w-3 h-3 shrink-0" />
            <span className="truncate">{solo.song_name}</span>
            {solo.artist_name && <span className="text-muted-foreground/50">· {solo.artist_name}</span>}
          </div>
        </div>
        {solo.index_awarded > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-400">+{solo.index_awarded} IDX</span>
          </div>
        )}
      </div>

      {/* Thumbnail upload (owner only) */}
      {isOwner && !solo.thumbnail_url && (
        <div className="px-4 py-3 border-b border-border">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full py-3 border border-dashed border-gold/30 bg-gold/5 flex items-center justify-center gap-2 text-sm font-semibold text-gold hover:bg-gold/10 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <><Clock className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              <><Camera className="w-4 h-4" /> Add Thumbnail</>
            )}
          </motion.button>
        </div>
      )}

      {/* Voting section */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-center gap-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => vote('up')}
            className={`flex items-center gap-2.5 px-5 py-3 border transition-all ${
              myVote === 'up'
                ? 'border-gold bg-gold/10 text-gold shadow-[0_0_15px_-3px] shadow-gold/30'
                : 'border-border bg-surface-1 text-muted-foreground hover:border-gold/40 hover:text-gold'
            }`}
          >
            <ThumbsUp className={`w-5 h-5 ${myVote === 'up' ? 'fill-gold' : ''}`} />
            <span className="text-lg font-black">{upvotes}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => vote('down')}
            className={`flex items-center gap-2.5 px-5 py-3 border transition-all ${
              myVote === 'down'
                ? 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_15px_-3px] shadow-red-500/30'
                : 'border-border bg-surface-1 text-muted-foreground hover:border-red-500/40 hover:text-red-400'
            }`}
          >
            <ThumbsDown className={`w-5 h-5 ${myVote === 'down' ? 'fill-red-400' : ''}`} />
            <span className="text-lg font-black">{downvotes}</span>
          </motion.button>
        </div>
      </div>

      {/* Score breakdown (if scored) */}
      {solo.status === 'scored' && solo.qoi_score != null && (
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-gold" />
            <span className="text-sm font-bold text-foreground">Score Breakdown</span>
            <span className="ml-auto text-lg font-black text-gold">{Math.round(solo.qoi_score)}/100</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Quality', score: solo.quality_score, max: 30, color: 'bg-sky-400' },
              { label: 'Originality', score: solo.originality_score, max: 35, color: 'bg-purple-400' },
              { label: 'Impact', score: solo.impact_score, max: 35, color: 'bg-emerald-400' },
            ].map(pillar => (
              <div key={pillar.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{pillar.label}</span>
                  <span className="text-xs font-bold text-foreground">{pillar.score ?? 0}/{pillar.max}</span>
                </div>
                <div className="h-2 w-full bg-surface-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((pillar.score ?? 0) / pillar.max) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full ${pillar.color}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {solo.judge_notes && (
            <div className="mt-3 p-3 bg-surface-1 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Judge Notes</span>
              <p className="text-xs text-foreground mt-1">{solo.judge_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <div className="border-b border-border">
        <div className="px-4 pt-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">Comments</span>
          {commentCount > 0 && (
            <span className="text-xs text-muted-foreground">({commentCount})</span>
          )}
        </div>
        <FeedInlineComments
          submissionId={id!}
          submissionType={'solo' as any}
          onCommentCountChange={setCommentCount}
        />
      </div>
      {/* Video Player Modal */}
      {solo.submission_url && (
        <FeedVideoPlayer
          isOpen={showPlayer}
          onClose={() => setShowPlayer(false)}
          submissionUrl={solo.submission_url}
          platform={solo.submission_platform || 'youtube'}
          submissionId={solo.id}
          submissionType={'solo' as any}
          username={solo.username || ''}
        />
      )}
    </div>
  );
}
