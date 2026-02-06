import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, ExternalLink, Eye, Plus, Trash2, Sparkles, Play, ImagePlus } from 'lucide-react';
import { useJudgeRatingVideos } from '@/hooks/useJudgeRatingVideos';
import SubmitRatingVideoModal from './SubmitRatingVideoModal';
import { SiTiktok, SiInstagram, SiYoutube } from '@icons-pack/react-simple-icons';
import { useVideoStats } from '@/hooks/useVideoStats';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const platformIcons = {
  tiktok: SiTiktok,
  instagram: SiInstagram,
  youtube: SiYoutube,
};

const platformColors = {
  tiktok: 'text-white',
  instagram: 'text-pink-400',
  youtube: 'text-red-500',
};

// Individual video card with real stats
function VideoCard({ 
  video, 
  index, 
  onDelete,
  deleting,
  onThumbnailUpdated,
}: { 
  video: any; 
  index: number;
  onDelete: () => void;
  deleting: boolean;
  onThumbnailUpdated: () => void;
}) {
  const { views, thumbnailUrl: fetchedThumb, loading: statsLoading } = useVideoStats(video.video_url, video.platform);
  const thumbnailUrl = video.thumbnail_url || fetchedThumb;
  const [showThumbInput, setShowThumbInput] = useState(false);
  const [thumbUrl, setThumbUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveThumb = async () => {
    if (!thumbUrl.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('judge_rating_videos')
      .update({ thumbnail_url: thumbUrl.trim() })
      .eq('id', video.id);
    setSaving(false);
    if (error) { toast.error('Failed to save thumbnail'); return; }
    toast.success('Thumbnail updated');
    setShowThumbInput(false);
    setThumbUrl('');
    onThumbnailUpdated();
  };
  const PlatformIcon = platformIcons[video.platform as keyof typeof platformIcons];
  const platformColor = platformColors[video.platform as keyof typeof platformColors];

  // Use fetched views or fallback to stored current_views
  const displayViews = views ?? video.current_views ?? 0;

  const formatViews = (viewCount: number) => {
    if (viewCount >= 1000000) return `${(viewCount / 1000000).toFixed(1)}M`;
    if (viewCount >= 1000) return `${(viewCount / 1000).toFixed(1)}K`;
    return viewCount.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface-1 border border-border rounded-lg overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-2">
        {statsLoading && !thumbnailUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={video.title || 'Rating Video'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Platform badge */}
        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <PlatformIcon className={`w-3.5 h-3.5 ${platformColor}`} />
        </div>

        {/* Viral badge */}
        {video.viral_bonus_awarded && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gold/90 flex items-center gap-1">
            <Sparkles size={10} className="text-black" />
            <span className="text-[10px] font-bold text-black">+{video.bonus_xp_awarded} JXP</span>
          </div>
        )}

        {/* Views overlay */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm flex items-center gap-1">
          <Eye size={10} className="text-white" />
          <span className="text-[10px] font-medium text-white">
            {statsLoading ? '...' : formatViews(displayViews)}
          </span>
        </div>

        {/* Play overlay on hover */}
        <a
          href={video.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </a>
      </div>

      {/* Thumbnail URL input overlay */}
      {showThumbInput && (
        <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 gap-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Paste thumbnail URL</p>
          <input
            type="url"
            value={thumbUrl}
            onChange={e => setThumbUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-surface-2 border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
            autoFocus
          />
          <div className="flex gap-2 w-full">
            <button onClick={() => setShowThumbInput(false)} className="flex-1 text-[10px] py-1 rounded bg-surface-2 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleSaveThumb} disabled={saving || !thumbUrl.trim()} className="flex-1 text-[10px] py-1 rounded bg-gold/20 text-gold hover:bg-gold/30 transition-colors disabled:opacity-50">
              {saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {video.title || 'Rating Video'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(video.submitted_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setShowThumbInput(true)}
              className="p-1.5 hover:bg-gold/10 rounded-lg transition-colors text-muted-foreground hover:text-gold"
              title="Set thumbnail"
            >
              <ImagePlus size={14} />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-400 disabled:opacity-50"
            >
              {deleting ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MyRatingVideos() {
  const { videos, loading, deleteVideo, refresh } = useJudgeRatingVideos();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (videoId: string) => {
    setDeletingId(videoId);
    await deleteVideo(videoId);
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add Video Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowSubmitModal(true)}
        className="w-full py-2.5 bg-gold/10 border border-gold/30 rounded-lg text-sm font-medium text-gold hover:bg-gold/20 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Submit Rating Video
      </motion.button>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-3">
            <Video className="w-5 h-5 text-gold" />
          </div>
          <p className="font-display text-sm mb-1">NO RATING VIDEOS</p>
          <p className="text-xs text-muted-foreground">
            Post your judging content for viral XP bonuses
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {videos.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              index={index}
              onDelete={() => handleDelete(video.id)}
              deleting={deletingId === video.id}
              onThumbnailUpdated={refresh}
            />
          ))}
        </div>
      )}

      {/* Submit Modal */}
      <SubmitRatingVideoModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      />
    </div>
  );
}
