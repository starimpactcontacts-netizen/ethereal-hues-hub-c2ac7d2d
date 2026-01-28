import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, ExternalLink, Eye, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SiTiktok, SiInstagram, SiYoutube } from '@icons-pack/react-simple-icons';

interface RatingVideo {
  id: string;
  video_url: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  title: string | null;
  current_views: number;
  viral_bonus_awarded: boolean;
  bonus_xp_awarded: number | null;
  submitted_at: string;
}

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

interface PublicJudgeVideosProps {
  userId: string;
}

export default function PublicJudgeVideos({ userId }: PublicJudgeVideosProps) {
  const [videos, setVideos] = useState<RatingVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from('judge_rating_videos')
        .select('*')
        .eq('judge_id', userId)
        .order('submitted_at', { ascending: false });

      if (data) {
        setVideos(data as RatingVideo[]);
      }
      setLoading(false);
    };

    fetchVideos();
  }, [userId]);

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

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 mx-auto rounded-full bg-surface-1 flex items-center justify-center mb-3">
          <Video className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="font-display text-sm mb-1">NO RATING VIDEOS</p>
        <p className="text-xs text-muted-foreground">
          This judge hasn't posted any rating videos yet
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-2">
      {videos.map((video, index) => {
        const PlatformIcon = platformIcons[video.platform];
        const platformColor = platformColors[video.platform];

        return (
          <motion.a
            key={video.id}
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-surface-1 border border-border rounded-lg p-3 block hover:border-gold/30 transition-colors"
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
                    {formatViews(video.current_views || 0)}
                  </div>
                  {video.viral_bonus_awarded && (
                    <div className="flex items-center gap-1 text-xs text-gold">
                      <Sparkles size={12} />
                      Viral
                    </div>
                  )}
                </div>
              </div>

              {/* External Link */}
              <div className="shrink-0">
                <ExternalLink size={14} className="text-muted-foreground" />
              </div>
            </div>

            {/* Date */}
            <p className="text-[10px] text-muted-foreground mt-2">
              {new Date(video.submitted_at).toLocaleDateString()}
            </p>
          </motion.a>
        );
      })}
    </div>
  );
}
