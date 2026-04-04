import { useState, useCallback } from "react";
import { Play, Star, ExternalLink, Trophy, Clock, CheckCircle, RefreshCw, ArrowRight, ImagePlus, Upload, Link as LinkIcon, Pencil, Check, X, EyeOff, Eye } from "lucide-react";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Extract thumbnail from platform URL
function getThumbnailUrl(url: string, platform: string): string | null {
  try {
    if (platform === 'youtube') {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
      if (match) {
        return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

// Platform gradient colors
const platformColors: Record<string, string> = {
  tiktok: "from-pink-500 to-cyan-400",
  instagram: "from-purple-500 via-pink-500 to-orange-400",
  youtube: "from-red-600 to-red-400",
};

const PULL_THRESHOLD = 80;

// Map source type to the correct DB table
function getTableForSource(source: string) {
  switch (source) {
    case 'round': return 'round_participations';
    case 'sanctioned': return 'sanctioned_tournament_participants';
    default: return 'event_participations';
  }
}

interface SubmissionGridProps {
  userId?: string;
}

export default function SubmissionGrid({ userId }: SubmissionGridProps) {
  const { submissions, loading, refetch, toggleHidden, toggleQoiHidden } = useUserSubmissions(userId);
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, PULL_THRESHOLD], [0, 1]);
  const scale = useTransform(y, [0, PULL_THRESHOLD], [0.5, 1]);
  const rotate = useTransform(y, [0, PULL_THRESHOLD], [0, 180]);

  const handlePanEnd = useCallback(async (event: any, info: PanInfo) => {
    if (info.offset.y > PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    y.set(0);
  }, [isRefreshing, refetch, y]);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (info.offset.y > 0 && !isRefreshing) {
      const distance = Math.min(info.offset.y, PULL_THRESHOLD * 1.5);
      setPullDistance(distance);
      y.set(distance);
    }
  }, [isRefreshing, y]);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[9/16] bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-4">
        <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center mb-2">
          <Play className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-xs font-medium text-foreground mb-0.5">No submissions yet</p>
        <p className="text-[10px] text-muted-foreground mb-2">
          Submit your first edit to see it here
        </p>
        <Link 
          to="/arena"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold text-black font-semibold rounded-md text-xs hover:bg-gold/90 transition-colors"
        >
          Enter Arena
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Pull to Refresh Indicator */}
      <motion.div 
        style={{ opacity, scale }}
        className="flex items-center justify-center py-3"
      >
        <motion.div style={{ rotate }}>
          <RefreshCw className={`w-5 h-5 text-gold ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.div>
        <span className="ml-2 text-xs text-muted-foreground">
          {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </motion.div>

      {/* TikTok-style Grid with pull gesture */}
      <motion.div 
        className="grid grid-cols-3 gap-0.5"
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        style={{ touchAction: 'pan-x' }}
      >
        {submissions.map((submission, index) => {
          // Custom thumbnail > auto-fetched thumbnail
          const thumbnail = submission.thumbnail_url || getThumbnailUrl(submission.submission_url, submission.platform);
          const gradient = platformColors[submission.platform] || "from-gray-600 to-gray-400";
          const isOwnProfile = !userId || userId === user?.id;
          const isScored = submission.status === 'scored' && submission.qoi_score && (isOwnProfile || !submission.qoi_hidden);
          
            return (
            <motion.button
              key={submission.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: submission.is_hidden ? 0.4 : 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedSubmission(submission.id)}
              className="relative aspect-[9/16] overflow-hidden group"
            >
              {/* Background */}
              {thumbnail ? (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${thumbnail})` }}
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
              )}
              
              {/* Custom thumb indicator */}
              {submission.thumbnail_url && (
                <div className="absolute top-2 left-8 w-4 h-4 rounded-full bg-gold/80 flex items-center justify-center">
                  <ImagePlus className="w-2.5 h-2.5 text-black" />
                </div>
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
              
              {/* Platform icon */}
              <div className="absolute top-2 left-2">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                  <Play className="w-3 h-3 text-white fill-white" />
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="absolute top-2 right-2">
                {isScored ? (
                  <div className="bg-gold/90 rounded px-1.5 py-0.5 flex items-center gap-1 shadow-lg">
                    <Star className="w-3 h-3 text-black fill-black" />
                    <span className="text-[11px] font-bold text-black">{submission.qoi_score?.toFixed(1)}</span>
                  </div>
                ) : (
                  <div className="bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span className="text-[10px] text-muted-foreground">Pending</span>
                  </div>
                )}
              </div>
              
              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                {submission.final_rank && (
                  <div className="flex items-center gap-1 mb-1">
                    <Trophy className="w-3 h-3 text-gold" />
                    <span className="text-xs font-bold text-gold">#{submission.final_rank}</span>
                  </div>
                )}
                <p className="text-[10px] text-white/80 truncate">
                  {submission.event?.title || 'Event'}
                </p>
              </div>
              
              {/* Hover / tap hint overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                {!thumbnail ? (
                  <div className="flex flex-col items-center gap-1">
                    <ImagePlus className="w-5 h-5 text-gold" />
                    <span className="text-[8px] text-white/80 font-medium">Add Thumb</span>
                  </div>
                ) : (
                  <ExternalLink className="w-6 h-6 text-white" />
                )}
              </div>
              
              {/* No-thumbnail persistent hint */}
              {!thumbnail && !submission.thumbnail_url && (
                <div className="absolute bottom-8 right-1">
                  <div className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center border border-border/30">
                    <ImagePlus className="w-2.5 h-2.5 text-muted-foreground" />
                  </div>
                </div>
              )}
              
              {/* Hidden indicator */}
              {submission.is_hidden && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <EyeOff className="w-5 h-5 text-white/60" />
                </div>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <SubmissionDetailModal
            submission={submissions.find(s => s.id === selectedSubmission)!}
            isOwner={!userId || userId === user?.id}
            onClose={() => setSelectedSubmission(null)}
            onThumbnailUpdated={refetch}
            onToggleHidden={toggleHidden}
            onToggleQoiHidden={toggleQoiHidden}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Detail Modal with Thumbnail Override ──
function SubmissionDetailModal({
  submission,
  isOwner,
  onClose,
  onThumbnailUpdated,
  onToggleHidden,
  onToggleQoiHidden,
}: {
  submission: any;
  isOwner: boolean;
  onClose: () => void;
  onThumbnailUpdated: () => void;
  onToggleHidden: (submission: any) => void;
  onToggleQoiHidden: (submission: any) => void;
}) {
  const { user } = useAuth();
  const [showThumbInput, setShowThumbInput] = useState(false);
  const [thumbMode, setThumbMode] = useState<'file' | 'url'>('file');
  const [thumbUrl, setThumbUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(submission?.custom_title || '');

  if (!submission) return null;

  const gradient = platformColors[submission.platform] || "from-gray-600 to-gray-400";
  const thumbnail = submission.thumbnail_url || getThumbnailUrl(submission.submission_url, submission.platform);
  const tableName = getTableForSource(submission.source);

  const saveThumbnailUrl = async (url: string) => {
    setSaving(true);
    const { error } = await supabase
      .from(tableName)
      .update({ thumbnail_url: url } as any)
      .eq('id', submission.id);
    setSaving(false);
    if (error) { toast.error('Failed to save thumbnail'); return; }
    toast.success('Thumbnail updated!');
    setShowThumbInput(false);
    setThumbUrl('');
    onThumbnailUpdated();
  };

  const saveTitle = async () => {
    if (!submission) return;
    setSaving(true);
    const { error } = await supabase
      .from(tableName)
      .update({ custom_title: titleValue.trim() || null } as any)
      .eq('id', submission.id);
    setSaving(false);
    if (error) { toast.error('Failed to save title'); return; }
    toast.success('Title updated!');
    setEditingTitle(false);
    onThumbnailUpdated();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }

    setSaving(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${submission.id}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('video-thumbnails')
      .upload(path, file, { upsert: true });

    if (uploadErr) { setSaving(false); toast.error('Upload failed'); return; }

    const { data: urlData } = supabase.storage.from('video-thumbnails').getPublicUrl(path);
    await saveThumbnailUrl(urlData.publicUrl);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-surface-1 border border-border overflow-hidden relative"
      >
        {/* Header with thumbnail/gradient */}
        <div className="relative h-48">
          {thumbnail ? (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${thumbnail})` }}
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-black/50" />
          
          {/* Play button overlay */}
          <a
            href={submission.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </a>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            ×
          </button>

          {/* Thumbnail edit button — owner only */}
          {isOwner && (
            <button
              onClick={() => setShowThumbInput(!showThumbInput)}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-gold/30 hover:text-gold transition-colors"
              title="Set custom thumbnail"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Thumbnail override panel */}
        <AnimatePresence>
          {showThumbInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border"
            >
              <div className="p-3 space-y-2 bg-surface-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Custom Thumbnail</p>
                {/* Mode tabs */}
                <div className="flex gap-1 bg-background rounded p-0.5">
                  <button
                    onClick={() => setThumbMode('file')}
                    className={`flex-1 text-[10px] py-1 rounded flex items-center justify-center gap-1 transition-colors ${thumbMode === 'file' ? 'bg-gold/20 text-gold' : 'text-muted-foreground'}`}
                  >
                    <Upload size={10} /> Upload
                  </button>
                  <button
                    onClick={() => setThumbMode('url')}
                    className={`flex-1 text-[10px] py-1 rounded flex items-center justify-center gap-1 transition-colors ${thumbMode === 'url' ? 'bg-gold/20 text-gold' : 'text-muted-foreground'}`}
                  >
                    <LinkIcon size={10} /> URL
                  </button>
                </div>

                {thumbMode === 'file' ? (
                  <label className="w-full cursor-pointer">
                    <div className="w-full py-3 border border-dashed border-border rounded flex flex-col items-center gap-1 hover:border-gold/40 transition-colors">
                      <Upload size={16} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{saving ? 'Uploading...' : 'Tap to choose image'}</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={saving} />
                  </label>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={thumbUrl}
                      onChange={e => setThumbUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
                    />
                    <button
                      onClick={() => saveThumbnailUrl(thumbUrl.trim())}
                      disabled={saving || !thumbUrl.trim()}
                      className="px-3 py-1.5 rounded bg-gold/20 text-gold text-[10px] hover:bg-gold/30 transition-colors disabled:opacity-50"
                    >
                      {saving ? '...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Custom title / edit name — owner only */}
          {isOwner && (
            <div className="flex items-center gap-2">
              {editingTitle ? (
                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={titleValue}
                    onChange={e => setTitleValue(e.target.value)}
                    placeholder={submission.event?.title || 'Name your edit...'}
                    className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                  />
                  <button onClick={saveTitle} disabled={saving} className="p-1.5 rounded bg-gold/20 text-gold hover:bg-gold/30">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingTitle(false)} className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    {submission.custom_title || submission.event?.title || 'Untitled Edit'}
                  </span>
                  <button onClick={() => { setTitleValue(submission.custom_title || ''); setEditingTitle(true); }} className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
          {!isOwner && (
            <div>
              <span className="font-semibold text-sm">
                {submission.custom_title || submission.event?.title || 'Unknown Event'}
              </span>
            </div>
          )}

          {/* Event link */}
          <div>
            <Link 
              to={`/event/${submission.event_id}`}
              className="text-xs text-muted-foreground hover:text-gold transition-colors"
            >
              {submission.event?.title || 'Unknown Event'} →
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 uppercase tracking-wider rounded bg-gradient-to-r ${gradient} text-white`}>
                {submission.platform}
              </span>
              {submission.status === 'scored' ? (
                <span className="flex items-center gap-1 text-[10px] text-green-500">
                  <CheckCircle size={10} />
                  Scored
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-yellow-500">
                  <Clock size={10} />
                  Pending
                </span>
              )}
            </div>
          </div>
          
          {/* QOI Scores — always visible */}
          {submission.qoi_score ? (
            <div className="grid grid-cols-4 gap-0 text-center border border-border/30 overflow-hidden">
              <div className="p-3 bg-background/50 border-r border-border/20">
                <p className="text-lg font-bold tabular-nums">{submission.quality_score ?? '—'}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Quality</p>
              </div>
              <div className="p-3 bg-background/50 border-r border-border/20">
                <p className="text-lg font-bold tabular-nums">{submission.originality_score ?? '—'}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Original</p>
              </div>
              <div className="p-3 bg-background/50 border-r border-border/20">
                <p className="text-lg font-bold tabular-nums">{submission.impact_score ?? '—'}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Impact</p>
              </div>
              <div className="p-3 bg-gold/10">
                <p className="text-lg font-bold text-gold tabular-nums">{submission.qoi_score.toFixed(1)}</p>
                <p className="text-[9px] text-gold uppercase tracking-wider font-semibold">QOI</p>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center bg-background/30 border border-border/20">
              <p className="text-xs text-muted-foreground">Awaiting QOI score</p>
            </div>
          )}
          
          {/* Final Rank */}
          {submission.final_rank && (
            <div className="text-center p-4 bg-gold/5 border border-gold/30">
              <p className="text-3xl font-display text-gold">#{submission.final_rank}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1">Final Rank</p>
            </div>
          )}
          
          {/* QOI Visibility toggle — let users decide if QOI shows publicly */}
          {isOwner && submission.qoi_score && (
            <button
              onClick={() => { onToggleQoiHidden(submission); }}
              className={`flex items-center justify-center gap-2 w-full py-2.5 text-xs transition-colors border-t border-border/20 ${
                submission.qoi_hidden 
                  ? 'text-gold hover:text-gold/80' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {submission.qoi_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {submission.qoi_hidden ? 'Show QOI on profile' : 'Hide QOI from profile'}
            </button>
          )}
          
          {/* View button */}
          <a
            href={submission.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 text-center text-xs font-semibold uppercase tracking-[0.15em] text-foreground hover:text-gold transition-colors border-t border-border/20"
          >
            View Submission →
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}