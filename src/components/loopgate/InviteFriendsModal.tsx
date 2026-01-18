import { useState } from "react";
import { Send, Copy, Share2, Users, Zap, Check, Gift } from "lucide-react";
import { useInvites } from "@/hooks/useInvites";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InviteFriendsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteFriendsModal({ open, onOpenChange }: InviteFriendsModalProps) {
  const { invites, stats, creating, createInvite, shareInvite } = useInvites();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const handleCreateInvite = async () => {
    const code = await createInvite();
    if (code) {
      shareInvite(code);
    }
  };
  
  const handleCopyCode = async (code: string) => {
    const shareUrl = `${window.location.origin}/start?invite=${code}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedCode(code);
    toast.success('Invite link copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  const pendingInvites = invites.filter(i => i.status === 'pending');
  const usedInvites = invites.filter(i => i.status !== 'pending');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Send className="w-5 h-5 text-gold" />
            Invite Friends
          </DialogTitle>
        </DialogHeader>
        
        {/* XP Rewards Info */}
        <div className="bg-gold/5 border border-gold/20 p-4 space-y-2">
          <h4 className="text-sm font-semibold text-gold flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Earn XP for Inviting
          </h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Send an invite</span>
              <span className="text-gold font-semibold">+20 XP</span>
            </div>
            <div className="flex justify-between">
              <span>Friend joins</span>
              <span className="text-gold font-semibold">+50 XP</span>
            </div>
            <div className="flex justify-between">
              <span>Friend submits within 24h</span>
              <span className="text-gold font-semibold">+100 XP</span>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-1 border border-border p-3 text-center">
            <p className="font-display text-xl text-foreground">{stats.total_sent}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Sent</p>
          </div>
          <div className="bg-surface-1 border border-border p-3 text-center">
            <p className="font-display text-xl text-foreground">{stats.total_joined}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Joined</p>
          </div>
          <div className="bg-surface-1 border border-border p-3 text-center">
            <p className="font-display text-xl text-gold">{stats.xp_earned}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">XP Earned</p>
          </div>
        </div>
        
        {/* Create New Invite Button */}
        <Button
          onClick={handleCreateInvite}
          disabled={creating}
          className="w-full bg-gold text-black hover:bg-gold/90 font-semibold"
        >
          {creating ? (
            <>Creating...</>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Create & Share Invite
            </>
          )}
        </Button>
        
        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Invites
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {pendingInvites.map(invite => (
                <div 
                  key={invite.id}
                  className="flex items-center justify-between bg-surface-1 border border-border p-3"
                >
                  <code className="text-sm font-mono text-foreground">
                    {invite.invite_code}
                  </code>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => shareInvite(invite.invite_code)}
                      className="h-8 px-2"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(invite.invite_code)}
                      className="h-8 px-2"
                    >
                      {copiedCode === invite.invite_code ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Used Invites */}
        {usedInvites.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Successful Invites
            </h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {usedInvites.map(invite => (
                <div 
                  key={invite.id}
                  className="flex items-center justify-between bg-green-500/5 border border-green-500/20 p-2 text-xs"
                >
                  <code className="font-mono text-muted-foreground">
                    {invite.invite_code}
                  </code>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 ${
                      invite.status === 'submitted' 
                        ? 'bg-gold/10 text-gold' 
                        : 'bg-green-500/10 text-green-500'
                    }`}>
                      {invite.status === 'submitted' ? '+170 XP' : '+70 XP'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
