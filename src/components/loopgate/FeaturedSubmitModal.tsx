import { useState, useEffect, useRef } from "react";
import { X, Music, Send, ExternalLink, UserPlus, CheckCircle } from "lucide-react";
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
  queueMode?: boolean;
  onClose: () => void;
}

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'other', label: 'Other' },
];

// Key for storing claim tokens for guest submissions
const GUEST_CLAIMS_KEY = 'loopgate_guest_claims';

function generateClaimToken(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function saveClaimToken(token: string, table: string, submissionId: string) {
  try {
    const raw = localStorage.getItem(GUEST_CLAIMS_KEY);
    const claims = raw ? JSON.parse(raw) : [];
    claims.push({ token, table, submissionId, timestamp: Date.now() });
    localStorage.setItem(GUEST_CLAIMS_KEY, JSON.stringify(claims));
  } catch {}
}

export default function FeaturedSubmitModal({ drop, roundId, queueMode, onClose }: Props) {
  const { user, profile } = useAuth();
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const doSubmit = async () => {
    if (!url.trim()) return;

    setSubmitting(true);
    const isGuest = !user || !profile;
    const claimToken = isGuest ? generateClaimToken() : null;

    try {
      if (queueMode) {
        const insertData: Record<string, any> = {
          drop_id: drop.id,
          user_id: isGuest ? null : user!.id,
          username: isGuest ? 'guest' : (profile!.username || 'unknown'),
          avatar_url: isGuest ? null : profile!.avatar_url,
          submission_url: url.trim(),
          platform,
        };
        if (claimToken) insertData.claim_token = claimToken;

        const { data: inserted, error } = await supabase
          .from('featured_drop_queue')
          .insert(insertData as any)
          .select('id')
          .single();

        if (error) {
          if (error.message.includes('Queue is full')) {
            toast.error('Queue is full (100/100)!');
          } else if (error.message.includes('duplicate')) {
            toast.error('You already have an entry in the queue');
          } else {
            toast.error(error.message);
          }
        } else {
          if (claimToken && inserted?.id) saveClaimToken(claimToken, 'featured_drop_queue', inserted.id);
          if (isGuest) {
            setSubmitted(true);
          } else {
            toast.success('Queued for next round! 🔥');
            onClose();
          }
        }
      } else {
        const insertData: Record<string, any> = {
          drop_id: drop.id,
          user_id: isGuest ? null : user!.id,
          username: isGuest ? 'guest' : (profile!.username || 'unknown'),
          avatar_url: isGuest ? null : profile!.avatar_url,
          submission_url: url.trim(),
          platform,
        };
        if (roundId) insertData.round_id = roundId;
        if (claimToken) insertData.claim_token = claimToken;

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
          if (claimToken && inserted?.id) saveClaimToken(claimToken, 'featured_submissions', inserted.id);
          if (isGuest) {
            setSubmitted(true);
          } else {
            toast.success('Edit submitted! 🔥');
            onClose();
          }
        }
      }
    } catch (e) {
      toast.error('Failed to submit');
    }
    setSubmitting(false);
  };

  const handleGoToSignup = () => {
    const returnUrl = window.location.pathname;
    window.location.href = `/start?return=${encodeURIComponent(returnUrl)}`;
  };

  // Post-submit guest view
  if (submitted) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-sm bg-background border-destructive/30">
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-lg font-bold text-foreground">You're in! 🔥</p>
              <p className="text-sm text-muted-foreground">
                Your edit has been submitted{queueMode ? ' to the queue' : ''}. It's live and counting.
              </p>
            </div>

            <div className="bg-surface-1 border border-border p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Your edit</p>
              <p className="text-xs text-foreground truncate font-mono">{url}</p>
            </div>

            <div className="bg-gold/10 border border-gold/30 p-4 space-y-2">
              <p className="text-sm font-bold text-foreground text-center">
                Want this edit on your profile?
              </p>
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Create a free account and this submission gets automatically linked to your profile. 
                Track your rankings, earn Index points, and compete.
              </p>
            </div>

            <button
              onClick={handleGoToSignup}
              className="w-full py-3 bg-gradient-to-r from-destructive to-destructive/80 text-white font-bold flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create Account — Claim Your Edit
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm bg-background border-destructive/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Music className="w-5 h-5 text-destructive" />
            {queueMode ? `Queue for "${drop.title}"` : `Submit to "${drop.title}"`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Not signed in banner */}
          {!user && (
            <div className="bg-accent/10 border border-accent/30 p-2.5 flex items-start gap-2">
              <UserPlus className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                No account needed — just paste your link and submit. You can create an account after to claim your edit.
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
            onClick={doSubmit}
            disabled={submitting || !url.trim()}
            className={`w-full py-3 font-bold disabled:opacity-50 flex items-center justify-center gap-2 ${
              queueMode
                ? 'bg-gradient-to-r from-gold/90 to-gold/70 text-background'
                : 'bg-gradient-to-r from-destructive to-destructive/80 text-white'
            }`}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                {queueMode ? 'Join Queue' : 'Submit Edit'}
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
