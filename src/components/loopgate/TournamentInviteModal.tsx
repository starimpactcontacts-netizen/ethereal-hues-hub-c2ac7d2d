import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Users, Trophy, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import loopgateLogo from "@/assets/loopgate-wordmark.png";

interface TournamentInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentName: string;
  tournamentId: string;
  tournamentSlug: string;
  crewName: string;
  posterUrl?: string | null;
  playerCount?: number;
  maxPlayers?: number;
  isCrewVsCrew?: boolean;
}

export default function TournamentInviteModal({
  open,
  onOpenChange,
  tournamentName,
  tournamentId,
  tournamentSlug,
  crewName,
  posterUrl,
  playerCount = 0,
  maxPlayers = 100,
  isCrewVsCrew = false,
}: TournamentInviteModalProps) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://loopgate.io';
  // Use clean slug URL instead of UUID
  const inviteLink = `${baseUrl}/sanctioned/${tournamentSlug}${profile?.username ? `?ref=${profile.username}` : ''}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    const shareText = `🏆 Join "${tournamentName}" on Loopgate!\n\nHosted by ${crewName}\n${playerCount}/${maxPlayers} editors joined\n\n`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournamentName,
          text: shareText,
          url: inviteLink,
        });
      } catch {
        // User cancelled or share failed - fallback to copy
        await handleCopy();
      }
    } else {
      await handleCopy();
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

          {/* Tournament Icon */}
          <div className={`w-16 h-16 mx-auto rounded-2xl overflow-hidden flex items-center justify-center mb-3 ${
            isCrewVsCrew 
              ? "bg-gradient-to-br from-red-500 to-red-700" 
              : "bg-gradient-to-br from-gold to-amber-600"
          }`}>
            {posterUrl ? (
              <img src={posterUrl} alt={tournamentName} className="w-full h-full object-cover" />
            ) : (
              <Trophy className={`w-7 h-7 ${isCrewVsCrew ? "text-white" : "text-background"}`} />
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-1">Share tournament invite</p>
          <h3 className="text-lg font-bold text-foreground mb-1">{tournamentName}</h3>
          <p className="text-xs text-muted-foreground mb-3">Hosted by {crewName}</p>
          
          {/* Player count */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              {playerCount}/{maxPlayers} Editors
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
              isCrewVsCrew 
                ? "bg-red-500/20 text-red-400" 
                : "bg-gold/20 text-gold"
            }`}>
              {isCrewVsCrew ? "Crew vs Crew" : "Sanctioned"}
            </span>
          </div>

          {/* XP Reward indicator */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gold mb-4">
            <Sparkles className="w-3 h-3" />
            <span>They can compete for Index rewards</span>
          </div>

          {/* Link preview */}
          <div className="p-3 bg-background/50 rounded-md mb-4">
            <p className="text-xs text-muted-foreground font-mono break-all leading-relaxed">
              {inviteLink}
            </p>
          </div>

          {/* Copy button */}
          <Button
            onClick={handleShare}
            className={`w-full font-medium h-11 rounded-md ${
              isCrewVsCrew 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-gold hover:bg-gold/90 text-background"
            }`}
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
