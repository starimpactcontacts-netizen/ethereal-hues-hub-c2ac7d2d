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
  roundId?: string | null;
  onClose: () => void;
}

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'other', label: 'Other' },
];

export default function FeaturedSubmitModal({ drop, roundId, onClose }: Props) {
  const { user, profile } = useAuth();
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !profile || !url.trim()) return;

    setSubmitting(true);
    try {
      const insertData: Record<string, any> = {
        drop_id: drop.id,
        user_id: user.id,
        username: profile.username || 'unknown',
        avatar_url: profile.avatar_url,
        submission_url: url.trim(),
        platform,
      };

      // Attach round_id if this is a round-based drop
      if (roundId) {
        insertData.round_id = roundId;
      }

      const { data: inserted, error } = await supabase
        .from('featured_submissions')
        .insert(insertData as any)
        .select('id')
        .single();

      if (error) {
        if (error.message.includes('Round is full')) {
          toast.error('Round is full — no more slots!');
        } else if (error.message.includes('not accepting')) {
          toast.error('This round is not accepting submissions');
        } else {
          toast.error(error.message);
        }
      } else {
        if (inserted?.id) {
          enrichSubmission({ url: url.trim(), platform, table: 'featured_submissions', row_id: inserted.id });
        }
        toast.success('Edit submitted! 🔥');
        onClose();
      }
    } catch (e) {
      toast.error('Failed to submit');
    }
    setSubmitting(false);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm bg-background border-destructive/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Music className="w-5 h-5 text-destructive" />
            Submit to "{drop.title}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Song info */}
          <div className="bg-destructive/10 border border-destructive/30 p-3">
            <p className="text-xs text-destructive flex items-center gap-2">
              <Music className="w-3.5 h-3.5" />
              <span className="font-bold">{drop.song_name}</span>
            </p>
            {drop.song_url && (
              <a href={drop.song_url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-destructive/80 flex items-center gap-1 mt-1 hover:underline">
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
                  className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                    platform === p.id
                      ? 'bg-destructive/20 border-destructive/50 text-destructive'
                      : 'bg-surface-1 border-border text-muted-foreground hover:border-destructive/30'
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

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !url.trim()}
            className="w-full py-3 bg-gradient-to-r from-destructive to-destructive/80 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
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
