import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, Users, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CrewInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crewName: string;
  crewId: string;
}

export default function CrewInviteModal({
  open,
  onOpenChange,
  crewName,
  crewId,
}: CrewInviteModalProps) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  // Generate invite link with crew name and via username
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://loopgate.io';
  const crewSlug = crewName.toLowerCase().replace(/\s+/g, '-');
  const inviteLink = `${baseUrl}/join/${crewSlug}?via=${profile?.username || 'anon'}&crew=${crewId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${crewName} on LOOPGATE`,
          text: `${profile?.username} invited you to join ${crewName}. Start your editing journey.`,
          url: inviteLink,
        });
      } catch {
        // User cancelled or share failed
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className="text-xl font-bold tracking-tight">Invite to</span>
            <br />
            <span className="text-2xl font-black tracking-wide text-gold">{crewName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* XP Rules */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Invite Rewards (XP Only)
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Send Invite</p>
                  <p className="text-xs text-muted-foreground">+20 XP when you share</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Friend Joins</p>
                  <p className="text-xs text-muted-foreground">+50 XP + auto-joins crew</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">First Submission</p>
                  <p className="text-xs text-muted-foreground">+100 XP if they submit within 24h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invite Link */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Invite Link
            </h4>
            <div className="p-3 bg-muted/50 rounded-lg border border-border font-mono text-xs break-all text-muted-foreground">
              {inviteLink}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="border-border"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              onClick={handleShare}
              className="bg-gold text-background hover:bg-gold/90"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground uppercase tracking-wider">
            No Index is awarded for invites
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
