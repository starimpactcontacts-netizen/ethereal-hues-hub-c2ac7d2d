import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, ExternalLink, Eye, Plus, Trash2, Sparkles } from 'lucide-react';
import { useJudgeRatingVideos } from '@/hooks/useJudgeRatingVideos';
import SubmitRatingVideoModal from './SubmitRatingVideoModal';
import { SiTiktok, SiInstagram, SiYoutube } from '@icons-pack/react-simple-icons';

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

export default function MyRatingVideos() {
  const { videos, loading, deleteVideo } = useJudgeRatingVideos();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (videoId: string) => {
    setDeletingId(videoId);
    await deleteVideo(videoId);
    setDeletingId(null);
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
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

      {/* Videos List */}
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
        <div className="space-y-2">
          {videos.map((video, index) => {
            const PlatformIcon = platformIcons[video.platform];
            const platformColor = platformColors[video.platform];
            
            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface-1 border border-border rounded-lg p-3"
              >
                <div className="flex items-start gap-3">
                  {/* Platform Icon */}
                  <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
                    <PlatformIcon className={`w-4 h-4 ${platformColor}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {video.title || 'Rating Video'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye size={12} />
                        {formatViews(video.current_views)}
                      </div>
                      {video.viral_bonus_awarded && (
                        <div className="flex items-center gap-1 text-xs text-gold">
                          <Sparkles size={12} />
                          +{video.bonus_xp_awarded} JXP
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
                    >
                      <ExternalLink size={14} className="text-muted-foreground" />
                    </a>
                    <button
                      onClick={() => handleDelete(video.id)}
                      disabled={deletingId === video.id}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-400 disabled:opacity-50"
                    >
                      {deletingId === video.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submitted Date */}
                <p className="text-[10px] text-muted-foreground mt-2">
                  Submitted {new Date(video.submitted_at).toLocaleDateString()}
                </p>
              </motion.div>
            );
          })}
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
