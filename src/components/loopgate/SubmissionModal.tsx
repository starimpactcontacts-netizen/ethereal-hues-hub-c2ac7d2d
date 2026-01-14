import { useState } from "react";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { validatePlatformUrl, getPlatformUrlPlaceholder, type PlatformType } from "@/lib/urlValidation";
import { supabase } from "@/integrations/supabase/client";
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
}

export default function SubmissionModal({ isOpen, onClose, eventId, eventTitle, roundNumber }: SubmissionModalProps) {
  const { user, profile } = useAuth();
  const { isGuest } = useGuestMode();
  const { checkSubmissionBonus } = useInviteSubmissionBonus();
  const [platform, setPlatform] = useState<PlatformType>("tiktok");
  const [platformLink, setPlatformLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [urlError, setUrlError] = useState("");

  if (!isOpen) return null;

  // Block guest users
  if (isGuest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 text-center">
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
        const { error } = await supabase.from('round_participations').insert({
          event_id: eventId,
          user_id: user.id,
          round_number: roundNumber,
          platform: platform,
          submission_url: platformLink,
          status: 'active',
        });
        if (error) throw error;
      } else {
        // Standard event submission
        const { error } = await supabase.from('event_participations').insert({
          event_id: eventId,
          user_id: user.id,
          platform: platform,
          submission_url: platformLink,
          status: 'pending',
        });
        if (error) throw error;
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

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Submission Received</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Your edit has been indexed and is pending review by judges.
          </p>
          <div className="bg-surface-1 rounded-lg p-4 mb-6">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Status</p>
            <p className="text-gold font-bold">PENDING REVIEW</p>
          </div>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-bold">Submit Edit</h2>
            <p className="text-xs text-muted-foreground">{eventTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-1 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Submitting as (read-only) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Submitting as
            </label>
            <div className="w-full bg-surface-1 border border-border rounded-lg px-4 py-3 text-sm text-foreground">
              {profile?.username || 'Unknown'}
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Platform
            </label>
            <div className="flex gap-2">
              {(["tiktok", "instagram", "youtube"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPlatform(p);
                    setUrlError("");
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    platform === p
                      ? "bg-gold text-black"
                      : "bg-surface-1 border border-border text-muted-foreground"
                  }`}
                >
                  {p === "tiktok" ? "TikTok" : p === "instagram" ? "IG" : "YT"}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
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
                className={`w-full bg-surface-1 border rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:border-gold ${
                  urlError ? "border-destructive" : "border-border"
                }`}
                required
              />
              <ExternalLink size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            {urlError && (
              <p className="text-destructive text-xs mt-1">{urlError}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">
              Direct link to your published edit
            </p>
          </div>

          {/* Event ID (hidden) */}
          <input type="hidden" value={eventId} />

          {/* Rules reminder */}
          <div className="bg-surface-1 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground">
              By submitting, you confirm your edit follows all event rules and is original work.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !platformLink}
            className="w-full py-4 bg-gold text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
