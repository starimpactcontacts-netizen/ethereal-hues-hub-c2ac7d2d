import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ExternalLink, ThumbsUp, ThumbsDown, Camera, Music,
  Trophy, Zap, Clock, MessageCircle, Upload, Play, Share2
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

  // Build embed URL for inline preview
  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&\s]+)/);
      return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : null;
    }
    return null;
  };

  const embedUrl = solo.submission_url ? getEmbedUrl(solo.submission_url, solo.submission_platform || '') : null;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: solo.theme, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {}
  };

  const totalVotes = upvotes + downvotes;
  const upPct = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header — clean, breathable */}
      <div className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-3 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/80 hover:bg-white/5 active:scale-95 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70 leading-none mb-1">Solo Edit</p>
            <h1
              className="text-base font-black text-foreground truncate leading-tight"
              style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif', letterSpacing: '0.01em' }}
            >
              {solo.theme}
            </h1>
          </div>
          <div className={`shrink-0 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-[0.15em] ${s.color} ${s.bg}`}>
            {s.label}
          </div>
        </div>
      </div>

      {/* Video / Thumbnail Hero — full bleed */}
      <div className="relative">
        {embedUrl ? (
          <div className="w-full aspect-video bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Solo edit"
            />
          </div>
        ) : solo.submission_url ? (
          <button
            onClick={() => setShowPlayer(true)}
            className="relative w-full aspect-video bg-black overflow-hidden group block"
          >
            {solo.thumbnail_url ? (
              <img src={solo.thumbnail_url} alt="" className="w-full h-full object-cover group-active:scale-[1.03] transition-transform duration-500" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a1a1d] via-[#0e0e10] to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="w-16 h-16 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              >
                <Play className="w-7 h-7 text-black ml-1" fill="currentColor" />
              </motion.div>
            </div>
            {solo.qoi_score != null && (
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-gold/30 flex items-baseline gap-1">
                <span className="text-base font-black text-gold leading-none">{Math.round(solo.qoi_score)}</span>
                <span className="text-[9px] text-gold/70 uppercase tracking-wider font-bold">QOI</span>
              </div>
            )}
          </button>
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-[#1a1a1d] via-[#0e0e10] to-black flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1.5" />
              <span className="text-muted-foreground/40 text-xs uppercase tracking-widest">No submission yet</span>
            </div>
          </div>
        )}
      </div>

      {/* Editor row — premium card */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/editor/${solo.user_id}`)} className="shrink-0">
            <Avatar className="w-11 h-11 ring-2 ring-white/10">
              <AvatarImage src={solo.avatar_url || ''} />
              <AvatarFallback className="bg-surface-2 text-sm font-bold">
                {solo.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => navigate(`/editor/${solo.user_id}`)}
              className="text-sm font-bold text-foreground hover:text-gold transition-colors block truncate"
            >
              @{solo.username}
            </button>
            <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo}</p>
          </div>
          {solo.status === 'scored' && (
            (solo as any).is_disqualified ? (
              <div className="bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-full">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">DQ</span>
              </div>
            ) : solo.index_awarded > 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400">+{solo.index_awarded}</span>
              </div>
            ) : null
          )}
        </div>

        {/* Song chip */}
        {solo.song_name && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] max-w-full">
            <Music className="w-3.5 h-3.5 text-gold shrink-0" />
            <span className="text-xs font-medium text-foreground truncate">{solo.song_name}</span>
            {solo.artist_name && <span className="text-xs text-muted-foreground truncate">· {solo.artist_name}</span>}
          </div>
        )}
      </div>

      {/* Action bar — vote + share + open */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => vote('up')}
            className={`relative h-12 rounded-2xl border flex items-center justify-center gap-2 font-bold transition-all ${
              myVote === 'up'
                ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
                : 'border-white/[0.08] bg-white/[0.03] text-foreground/80 hover:bg-white/[0.06]'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${myVote === 'up' ? 'fill-emerald-300' : ''}`} />
            <span className="text-sm font-black">{upvotes}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => vote('down')}
            className={`relative h-12 rounded-2xl border flex items-center justify-center gap-2 font-bold transition-all ${
              myVote === 'down'
                ? 'border-red-500/60 bg-red-500/10 text-red-300'
                : 'border-white/[0.08] bg-white/[0.03] text-foreground/80 hover:bg-white/[0.06]'
            }`}
          >
            <ThumbsDown className={`w-4 h-4 ${myVote === 'down' ? 'fill-red-300' : ''}`} />
            <span className="text-sm font-black">{downvotes}</span>
          </motion.button>
        </div>

        {/* Sentiment bar */}
        {totalVotes > 0 && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-red-500/20 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${upPct}%` }} />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{upPct}% liked</span>
          </div>
        )}

        {/* Secondary actions */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {solo.submission_url && (
            <a
              href={solo.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open on {solo.submission_platform || 'platform'}
            </a>
          )}
          <button
            onClick={handleShare}
            className={`h-10 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition ${!solo.submission_url ? 'col-span-2' : ''}`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Thumbnail upload (owner only) */}
      {isOwner && !solo.thumbnail_url && (
        <div className="px-4 pt-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-11 rounded-xl border border-dashed border-gold/30 bg-gold/5 flex items-center justify-center gap-2 text-sm font-semibold text-gold hover:bg-gold/10 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <><Clock className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              <><Camera className="w-4 h-4" /> Add Thumbnail</>
            )}
          </motion.button>
        </div>
      )}

      <div className="h-4" />
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Score breakdown (if scored) */}
      {solo.status === 'scored' && solo.qoi_score != null && (
        <div className="px-4 py-5">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-gold" />
            <span className="text-sm font-bold text-foreground">Score Breakdown</span>
            <span className="ml-auto text-xl font-black text-gold tabular-nums">{Math.round(solo.qoi_score)}<span className="text-xs text-gold/50 font-bold">/100</span></span>
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

          {/* DQ Banner */}
          {(solo as any).is_disqualified && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30">
              <span className="text-[10px] text-red-400 uppercase tracking-wider font-bold">⛔ Disqualified</span>
              {(solo as any).disqualify_reason && (
                <p className="text-xs text-red-300 mt-1">{(solo as any).disqualify_reason}</p>
              )}
              <p className="text-[10px] text-red-400/60 mt-1">Your edit was rated but did not earn Index this time.</p>
            </div>
          )}

          {/* Accepted Badge */}
          {solo.status === 'scored' && !(solo as any).is_disqualified && (
            <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">✓ Accepted</span>
              <span className="text-[10px] text-emerald-400/60 ml-auto">+{solo.index_awarded} Index earned</span>
            </div>
          )}

          {solo.judge_notes && (
            <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/[0.04]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Judge Notes</span>
              <p className="text-xs text-foreground mt-1 leading-relaxed">{solo.judge_notes}</p>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="pt-5">
        <div className="px-4 pb-2 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-foreground/70" />
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
