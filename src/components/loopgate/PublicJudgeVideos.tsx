import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, ExternalLink, Eye, Play } from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import { supabase } from '@/integrations/supabase/client';
import { SiTiktok, SiInstagram, SiYoutube } from '@icons-pack/react-simple-icons';
import { useVideoStats } from '@/hooks/useVideoStats';

interface RatingVideo {
  id: string;
  video_url: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  title: string | null;
  current_views: number;
  viral_bonus_awarded: boolean;
  bonus_xp_awarded: number | null;
  submitted_at: string;
  thumbnail_url: string | null;
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

// Individual video card with thumbnail and real stats
function VideoCard({ video, index }: { video: RatingVideo; index: number }) {
  const { views, thumbnailUrl: fetchedThumb, loading: statsLoading } = useVideoStats(video.video_url, video.platform);
  const thumbnailUrl = video.thumbnail_url || fetchedThumb;
  const PlatformIcon = platformIcons[video.platform];
  const platformColor = platformColors[video.platform];

  // Use fetched views or fallback to stored current_views
  const displayViews = views ?? video.current_views ?? 0;

  const formatViews = (viewCount: number) => {
    if (viewCount >= 1000000) return `${(viewCount / 1000000).toFixed(1)}M`;
    if (viewCount >= 1000) return `${(viewCount / 1000).toFixed(1)}K`;
    return viewCount.toString();
  };

  return (
    <motion.a
      href={video.video_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface-1 border border-border rounded-lg overflow-hidden block hover:border-gold/30 transition-colors"
    >
      {/* Thumbnail Section */}
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
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>

        {/* Platform badge */}
        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <PlatformIcon className={`w-3.5 h-3.5 ${platformColor}`} />
        </div>

        {/* Viral badge */}
        {video.viral_bonus_awarded && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gold/90 flex items-center gap-1">
            <Sparkles size={10} className="text-black" />
            <span className="text-[10px] font-bold text-black">VIRAL</span>
          </div>
        )}

        {/* Views overlay - shows real fetched views */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm flex items-center gap-1">
          <Eye size={10} className="text-white" />
          <span className="text-[10px] font-medium text-white">
            {statsLoading ? '...' : formatViews(displayViews)}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3">
        <p className="text-sm font-medium truncate">
          {video.title || 'Rating Video'}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {new Date(video.submitted_at).toLocaleDateString()}
        </p>
      </div>
    </motion.a>
  );
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
    <div className="px-4 py-4 grid grid-cols-2 gap-3">
      {videos.map((video, index) => (
        <VideoCard key={video.id} video={video} index={index} />
      ))}
    </div>
  );
}
