import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Users } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import loopgateLogo from "@/assets/loopgate-wordmark.png";

interface CrewInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crewName: string;
  crewId: string;
  crewAvatarUrl?: string | null;
  memberCount?: number;
}

export default function CrewInviteModal({
  open,
  onOpenChange,
  crewName,
  crewId,
  crewAvatarUrl,
  memberCount = 0,
}: CrewInviteModalProps) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://loopgate.io';
  const unitSlug = crewName.toLowerCase().replace(/\s+/g, '-');
  const inviteLink = `${baseUrl}/unit/${unitSlug}?via=${profile?.username || 'anon'}&id=${crewId}`;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-muted/30 border-border max-w-sm p-6 pt-10 overflow-visible">
        {/* Loopgate wordmark with glow - positioned above modal */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2">
          <div className="relative flex items-center justify-center">
            {/* Glow effect - behind logo */}
            <div className="absolute w-40 h-16 blur-[35px] bg-white/50 rounded-full" />
            <img 
              src={loopgateLogo} 
              alt="LOOPGATE" 
              className="h-12 relative z-10"
            />
          </div>
        </div>

        {/* Preview card */}
        <div className="text-center">

          {/* Unit Avatar */}
          <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-muted flex items-center justify-center mb-3">
            {crewAvatarUrl ? (
              <img src={crewAvatarUrl} alt={crewName} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-1">Share invite link for</p>
          <h3 className="text-lg font-bold text-foreground mb-2">{crewName}</h3>
          
          {/* Member count */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {Math.floor(memberCount * 0.3) || 1} Online
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              {memberCount} Members
            </span>
          </div>

          {/* XP Reward indicator */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gold mb-4">
            <Sparkles className="w-3 h-3" />
            <span>They get +15 XP for joining</span>
          </div>

          {/* Link preview */}
          <div className="p-3 bg-background/50 rounded-md mb-4">
            <p className="text-xs text-muted-foreground font-mono break-all leading-relaxed">
              {inviteLink}
            </p>
          </div>

          {/* Copy button - Discord-style blue */}
          <Button
            onClick={handleCopy}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11 rounded-md"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Invite Link
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}