import { useState, useEffect, useRef } from "react";
import { X, Music, Send, ExternalLink, UserPlus } from "lucide-react";
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

// Key for storing pending submission in localStorage
const PENDING_FEATURED_KEY = 'loopgate_pending_featured_submit';

interface PendingSubmission {
  dropId: string;
  roundId?: string | null;
  url: string;
  platform: string;
  timestamp: number;
}

export default function FeaturedSubmitModal({ drop, roundId, onClose }: Props) {
  const { user, profile } = useAuth();
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [submitting, setSubmitting] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const hasAutoSubmitted = useRef(false);

  // Check for pending submission after auth
  useEffect(() => {
    if (user && profile && !hasAutoSubmitted.current) {
      const raw = localStorage.getItem(PENDING_FEATURED_KEY);
      if (raw) {
        try {
          const pending: PendingSubmission = JSON.parse(raw);
          // Only auto-submit if it's for this drop and within 30 minutes
          if (pending.dropId === drop.id && Date.now() - pending.timestamp < 30 * 60 * 1000) {
            hasAutoSubmitted.current = true;
            localStorage.removeItem(PENDING_FEATURED_KEY);
            setUrl(pending.url);
            setPlatform(pending.platform);
            // Auto-submit after a tick
            setTimeout(() => doSubmit(pending.url, pending.platform), 300);
          }
        } catch {
          localStorage.removeItem(PENDING_FEATURED_KEY);
        }
      }
    }
  }, [user, profile]);

  const doSubmit = async (submitUrl: string, submitPlatform: string) => {
    if (!user || !profile || !submitUrl.trim()) return;

    setSubmitting(true);
    try {
      const insertData: Record<string, any> = {
        drop_id: drop.id,
        user_id: user.id,
        username: profile.username || 'unknown',
        avatar_url: profile.avatar_url,
        submission_url: submitUrl.trim(),
        platform: submitPlatform,
      };

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
          enrichSubmission({ url: submitUrl.trim(), platform: submitPlatform, table: 'featured_submissions', row_id: inserted.id });
        }
        toast.success('Edit submitted! 🔥');
        onClose();
      }
    } catch (e) {
      toast.error('Failed to submit');
    }
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!url.trim()) return;

    // If not signed in, save pending and prompt auth
    if (!user || !profile) {
      const pending: PendingSubmission = {
        dropId: drop.id,
        roundId,
        url: url.trim(),
        platform,
        timestamp: Date.now(),
      };
      localStorage.setItem(PENDING_FEATURED_KEY, JSON.stringify(pending));
      setShowAuthPrompt(true);
      return;
    }

    await doSubmit(url, platform);
  };

  const handleGoToSignup = () => {
    // Navigate to /start with return URL
    const returnUrl = window.location.pathname;
    window.location.href = `/start?return=${encodeURIComponent(returnUrl)}`;
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
          {/* Auth prompt overlay */}
          {showAuthPrompt ? (
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/30 p-4 text-center">
                <UserPlus className="w-8 h-8 text-destructive mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground mb-1">
                  Your edit link is saved!
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Create a free account to complete your submission. Takes 30 seconds — your edit will auto-submit once you're in.
                </p>
              </div>

              <div className="bg-surface-1 border border-border p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Your edit</p>
                <p className="text-xs text-foreground truncate font-mono">{url}</p>
              </div>

              <button
                onClick={handleGoToSignup}
                className="w-full py-3 bg-gradient-to-r from-destructive to-destructive/80 text-white font-bold flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create Account & Submit
              </button>

              <button
                onClick={() => setShowAuthPrompt(false)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to form
              </button>
            </div>
          ) : (
            <>
              {/* Not signed in banner */}
              {!user && (
                <div className="bg-accent/10 border border-accent/30 p-2.5 flex items-start gap-2">
                  <UserPlus className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    No account needed to start — just paste your link. You'll create an account after to lock in your submission.
                  </p>
                </div>
              )}

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
                    {user ? 'Submit Edit' : 'Submit & Sign Up'}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
