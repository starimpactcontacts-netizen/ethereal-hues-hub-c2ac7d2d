import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ExternalLink } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useThumbnail } from '@/hooks/useThumbnail';
import { FeedItem } from '@/hooks/useMixedFeed';
import { formatDistanceToNow } from 'date-fns';

interface EditDropCardProps {
  item: FeedItem;
  priority?: boolean;
}

export default function EditDropCard({ item, priority = false }: EditDropCardProps) {
  const navigate = useNavigate();
  const { thumbnail, loading: thumbLoading } = useThumbnail(item.submission_url || '', item.platform || 'tiktok');
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleOpen = () => {
    if (item.submission_url) {
      window.open(item.submission_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleProfile = () => {
    if (item.user_id) {
      navigate(`/editor/${item.user_id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-black ${priority ? 'aspect-[9/16] max-h-[70vh]' : 'aspect-[9/14]'}`}
    >
      {/* Thumbnail Background */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={handleOpen}
      >
        {thumbLoading ? (
          <div className="absolute inset-0 bg-surface-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : thumbnail && !imageLoaded ? (
          <>
            <img 
              src={thumbnail} 
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => setImageLoaded(true)}
            />
            <div className="absolute inset-0 bg-surface-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          </>
        ) : thumbnail ? (
          <img 
            src={thumbnail} 
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-1 via-surface-0 to-background" />
        )}
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center cursor-pointer"
          >
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          </motion.div>
        </div>
      </div>

      {/* Top bar - Arena name */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
            {item.event_title || 'Arena'}
          </span>
        </div>
        
        <button 
          onClick={handleOpen}
          className="p-2 bg-black/50 backdrop-blur-sm rounded-full border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-white/80" />
        </button>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        {/* User info row */}
        <button 
          onClick={handleProfile}
          className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="w-10 h-10 border-2 border-white/30">
            <AvatarImage src={item.avatar_url || undefined} />
            <AvatarFallback className="bg-gold text-background font-bold">
              {item.username?.[0]?.toUpperCase() || 'E'}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <span className="text-white font-bold text-sm block">@{item.username}</span>
            <span className="text-white/50 text-xs">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </div>
        </button>

        {/* Index score pill */}
        <div className="flex items-center gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10 flex items-center gap-2">
            <span className="text-[10px] text-white/60 uppercase tracking-wider">Index</span>
            <span className="text-sm font-display text-gold">{item.index_score?.toFixed(1) || '0.0'}</span>
          </div>
          
          {item.qoi_score && (
            <div className="bg-gold/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gold/30 flex items-center gap-2">
              <span className="text-[10px] text-gold uppercase tracking-wider">QOI</span>
              <span className="text-sm font-display text-gold font-bold">{item.qoi_score.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
