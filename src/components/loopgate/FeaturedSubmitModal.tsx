import { useState } from "react";
import { X, Music, Send, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { enrichSubmission } from "@/lib/enrichSubmission";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { FeaturedDrop } from "@/hooks/useFeaturedDrops";

interface Props {
  drop: FeaturedDrop;
  onClose: () => void;
}

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'other', label: 'Other' },
];

export default function FeaturedSubmitModal({ drop, onClose }: Props) {
  const { user, profile } = useAuth();
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !profile || !url.trim()) return;

    setSubmitting(true);
    try {
      const { data: inserted, error } = await supabase.from('featured_submissions').insert({
        drop_id: drop.id,
        user_id: user.id,
        username: profile.username || 'unknown',
        avatar_url: profile.avatar_url,
        submission_url: url.trim(),
        platform,
      }).select('id').single();

      if (error) {
        toast.error(error.message);
      } else {
        // Fire-and-forget: enrich with oEmbed metadata
        if (inserted?.id) {
          enrichSubmission({ url: url.trim(), platform, table: 'featured_submissions', row_id: inserted.id });
        }
        toast.success('Edit submitted! 🔥 Wait for your score.');
        onClose();
      }
    } catch (e) {
      toast.error('Failed to submit');
    }
    setSubmitting(false);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm bg-background border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Music className="w-5 h-5 text-purple-400" />
            Submit to "{drop.title}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Song info */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <p className="text-xs text-purple-300 flex items-center gap-2">
              <Music className="w-3.5 h-3.5" />
              <span className="font-bold">{drop.song_name}</span>
            </p>
            {drop.song_url && (
              <a href={drop.song_url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-purple-400 flex items-center gap-1 mt-1 hover:underline">
                <ExternalLink className="w-3 h-3" /> Listen / Download
              </a>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">
              Use this song to create your edit. Submit the link below after posting.
            </p>
          </div>

          {/* Platform */}
          <div>
            <Label className="text-xs">Platform</Label>
            <div className="flex gap-2 mt-1.5">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    platform === p.id
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-surface-1 border-border text-muted-foreground hover:border-purple-500/30'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* URL */}
          <div>
            <Label className="text-xs">Edit Link *</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tiktok.com/@you/video/..."
              className="mt-1.5 bg-surface-1 border-border"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Post your edit using the featured song, then paste the link here.
            </p>
          </div>

          {/* Rewards info */}
          <div className="bg-surface-1 border border-border rounded-lg p-3 text-[10px] text-muted-foreground space-y-1">
            <p>✅ Get scored by an official judge (QOI rating)</p>
            <p>🏆 Top scorer gets artist shoutout + {drop.mystery_reward_label}</p>
            <p>⚡ Earn up to +{drop.xp_reward} XP & +{drop.index_reward} INDEX</p>
            <p>💀 Low score? You'll get honest feedback (public leaderboard)</p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !url.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Edit
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
