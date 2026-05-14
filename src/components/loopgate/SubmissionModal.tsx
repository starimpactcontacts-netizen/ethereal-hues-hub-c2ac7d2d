import { useState } from "react";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { validatePlatformUrl, getPlatformUrlPlaceholder, type PlatformType } from "@/lib/urlValidation";
import { supabase } from "@/integrations/supabase/client";
import { enrichSubmission } from "@/lib/enrichSubmission";
import { useAuth } from "@/hooks/useAuth";
import { useInviteSubmissionBonus } from "@/hooks/useInvites";
import { toast } from "sonner";
import { useGuestMode } from "@/hooks/useGuestMode";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  roundNumber?: number; // For Open Arena events
  isShowcase?: boolean; // Admin-only: flag this submission as an Edit Showcase inspo entry
}

export default function SubmissionModal({ isOpen, onClose, eventId, eventTitle, roundNumber, isShowcase }: SubmissionModalProps) {
  const { user, profile } = useAuth();
  const { isGuest } = useGuestMode();
  const { checkSubmissionBonus } = useInviteSubmissionBonus();
  const platform: PlatformType = "tiktok";
  const [platformLink, setPlatformLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [urlError, setUrlError] = useState("");

  if (!isOpen) return null;

  // Block guest users
  if (isGuest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-arena-bg/85 backdrop-blur-sm">
        <div className="w-full max-w-md bg-arena-panel rounded-lg p-6 text-center shadow-[0_24px_70px_hsl(var(--arena-bg)/0.55)]">
          <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground text-sm mb-4">
            You're browsing as a guest. Sign in to submit your edit.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-foreground text-background font-bold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast.error("You must be logged in to submit");
      return;
    }
    
    // Validate URL before submission
    const validation = validatePlatformUrl(platform, platformLink);
    if (!validation.valid) {
      setUrlError(validation.error || 'Invalid URL');
      return;
    }
    setUrlError("");
    
    setIsSubmitting(true);
    
    try {
      // For Open Arena events, submit to round_participations table
      if (roundNumber) {
        const { data: inserted, error } = await supabase.from('round_participations').insert({
          event_id: eventId,
          user_id: user.id,
          round_number: roundNumber,
          platform: platform,
          submission_url: platformLink,
          status: 'active',
          submitted_at: new Date().toISOString(),
          is_showcase: !!isShowcase,
        }).select('id').single();
        if (error) throw error;
        // Fire-and-forget: enrich with oEmbed metadata (thumbnail, title, author)
        if (inserted?.id) {
          enrichSubmission({ url: platformLink, platform, table: 'round_participations', row_id: inserted.id });
        }
      } else {
        // Standard event submission
        const { data: inserted, error } = await supabase.from('event_participations').insert({
          event_id: eventId,
          user_id: user.id,
          platform: platform,
          submission_url: platformLink,
          status: 'pending',
          is_showcase: !!isShowcase,
        }).select('id').single();
        if (error) throw error;
        // Fire-and-forget: enrich with oEmbed metadata
        if (inserted?.id) {
          enrichSubmission({ url: platformLink, platform, table: 'event_participations', row_id: inserted.id });
        }
      }
      
      // Check if user was invited and this is their first submission within 24h
      await checkSubmissionBonus();
      
      setSubmitted(true);
      toast.success("Submission received!");
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasSeenThumbnailTip = localStorage.getItem('loopgate_thumbnail_tip_seen') === '1';

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-arena-bg/85 backdrop-blur-sm">
        <div className="w-full max-w-md bg-arena-panel rounded-lg p-6 text-center shadow-[0_24px_70px_hsl(var(--arena-bg)/0.55)]">
          <div className="w-16 h-16 rounded-lg bg-arena-emerald/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Submission Received</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Your edit has been indexed and is pending review by judges.
          </p>
          <div className="bg-arena-strong rounded-lg p-4 mb-6">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Status</p>
            <p className="text-gold font-bold">PENDING REVIEW</p>
          </div>

          {/* One-time thumbnail tip */}
          {!hasSeenThumbnailTip && (
            <div className="bg-arena-strong rounded-lg p-3 mb-4 text-left">
              <p className="text-xs text-gold font-semibold mb-1">💡 Pro tip</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Add a custom thumbnail to your submission from your profile — it helps your edit stand out in the feed.
              </p>
            </div>
          )}

          <button
            onClick={() => {
              if (!hasSeenThumbnailTip) {
                localStorage.setItem('loopgate_thumbnail_tip_seen', '1');
              }
              onClose();
            }}
            className="w-full py-3 bg-foreground text-background font-bold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-arena-bg/85 backdrop-blur-sm">
        <div className="w-full max-w-md bg-arena-panel rounded-lg overflow-hidden shadow-[0_24px_70px_hsl(var(--arena-bg)/0.55)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-arena-line/40">
          <div>
            <h2 className="font-bold text-arena-ink">Submit TikTok Edit</h2>
            <p className="text-xs text-arena-muted">{eventTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-arena-strong rounded-lg text-arena-ink">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Submitting as (read-only) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-arena-muted mb-2">
              Submitting as
            </label>
            <div className="w-full bg-arena-strong rounded-lg px-4 py-3 text-sm text-arena-ink shadow-[0_0_0_1px_hsl(var(--arena-line)/0.25)]">
              {profile?.username || 'Unknown'}
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-arena-muted mb-2">
              Platform
            </label>
            <div className="rounded-lg bg-arena-strong px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-arena-ink shadow-[0_0_0_1px_hsl(var(--arena-line)/0.25)]">
              TikTok Only
            </div>
          </div>

          {/* Platform Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-arena-muted mb-2">
              Edit Link
            </label>
            <div className="relative">
              <input
                type="url"
                value={platformLink}
                onChange={(e) => {
                  setPlatformLink(e.target.value);
                  setUrlError("");
                }}
                placeholder={getPlatformUrlPlaceholder(platform)}
                className={`w-full bg-arena-strong rounded-lg px-4 py-3 pr-10 text-sm text-arena-ink placeholder:text-arena-muted/60 focus:outline-none shadow-[0_0_0_1px_hsl(var(--arena-line)/0.25)] focus:shadow-[0_0_0_1px_hsl(var(--arena-amber))] ${
                  urlError ? "border-destructive" : "border-border"
                }`}
                required
              />
              <ExternalLink size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-arena-muted" />
            </div>
            {urlError && (
              <p className="text-destructive text-xs mt-1">{urlError}</p>
            )}
            <p className="text-[10px] text-arena-muted mt-2">
              Paste the direct link to your published TikTok edit.
            </p>
          </div>

          {/* Event ID (hidden) */}
          <input type="hidden" value={eventId} />

          {/* Rules reminder */}
          <div className="bg-arena-strong rounded-lg p-3">
            <p className="text-[10px] text-arena-muted">
              By submitting, you confirm your edit follows all event rules and is original work. TikTok links only.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !platformLink}
            className="w-full py-4 bg-arena-emerald text-primary font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_12px_30px_hsl(var(--arena-emerald)/0.28)]"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Edit"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
