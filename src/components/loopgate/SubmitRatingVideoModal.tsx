import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, Send, ExternalLink } from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from '@icons-pack/react-simple-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useJudgeRatingVideos } from '@/hooks/useJudgeRatingVideos';

interface SubmitRatingVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Platform = 'tiktok' | 'instagram' | 'youtube';

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { id: 'tiktok', label: 'TikTok', icon: <SiTiktok size={16} />, placeholder: 'https://tiktok.com/@username/video/...' },
  { id: 'instagram', label: 'Instagram', icon: <SiInstagram size={16} />, placeholder: 'https://instagram.com/reel/...' },
  { id: 'youtube', label: 'YouTube', icon: <SiYoutube size={16} />, placeholder: 'https://youtube.com/shorts/... or /watch?v=...' },
];

export default function SubmitRatingVideoModal({ isOpen, onClose }: SubmitRatingVideoModalProps) {
  const { submitVideo } = useJudgeRatingVideos();
  const [platform, setPlatform] = useState<Platform>('tiktok');
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!videoUrl.trim()) return;
    
    setLoading(true);
    const success = await submitVideo(platform, videoUrl.trim(), title.trim() || undefined);
    setLoading(false);
    
    if (success) {
      setVideoUrl('');
      setTitle('');
      onClose();
    }
  };

  const selectedPlatform = PLATFORMS.find(p => p.id === platform)!;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video size={18} className="text-gold" />
                <h2 className="font-display text-lg">Submit Rating Video</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-1 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Info */}
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-3">
                <p className="text-xs text-gold">
                  🎥 Submit your rating videos here! When they go viral, you'll earn bonus JXP.
                </p>
              </div>

              {/* Platform Selection */}
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Platform
                </label>
                <div className="flex gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        platform === p.id
                          ? 'bg-gold/20 border-gold text-gold'
                          : 'bg-surface-1 border-border text-muted-foreground hover:border-gold/50'
                      }`}
                    >
                      {p.icon}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Video URL
                </label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={selectedPlatform.placeholder}
                  className="bg-surface-1 border-border"
                />
              </div>

              {/* Title (optional) */}
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Title <span className="text-muted-foreground/50">(optional)</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Rating edits until I get bored"
                  className="bg-surface-1 border-border"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!videoUrl.trim() || loading}
                className="flex-1 bg-gold text-black hover:bg-gold/90"
              >
                {loading ? 'Submitting...' : (
                  <>
                    <Send size={14} className="mr-1" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
