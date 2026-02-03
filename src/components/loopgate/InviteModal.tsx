import { useState } from "react";
import { Send, Copy, Share2, Users, Zap, Check, Gift, UserPlus } from "lucide-react";
import { useInvites } from "@/hooks/useInvites";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Crew {
  id: string;
  name: string;
}

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteModal({ open, onOpenChange }: InviteModalProps) {
  const { profile, user } = useAuth();
  const { invites, stats, creating, shareInvite, refresh } = useInvites();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [userCrews, setUserCrews] = useState<Crew[]>([]);
  const [loadingCrews, setLoadingCrews] = useState(false);
  
  // Fetch user's crews when tab changes to crew
  const handleTabChange = async (value: string) => {
    if (value === 'crew' && userCrews.length === 0 && user) {
      setLoadingCrews(true);
      try {
        const { data } = await supabase
          .from('crew_members')
          .select('crew_id, crews(id, name)')
          .eq('user_id', user.id)
          .in('role', ['owner', 'officer']);
        
        if (data) {
          const crews = data
            .filter(d => d.crews)
            .map(d => ({ id: (d.crews as any).id, name: (d.crews as any).name }));
          setUserCrews(crews);
          if (crews.length > 0) setSelectedCrew(crews[0]);
        }
      } catch (error) {
        console.error('Error fetching crews:', error);
      } finally {
        setLoadingCrews(false);
      }
    }
  };
  
  const handleCreateInvite = async (forCrew = false) => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      const trimmedCode = customCode.trim();
      const params: { p_user_id: string; p_custom_code?: string } = { p_user_id: user.id };
      
      if (trimmedCode.length >= 4) {
        params.p_custom_code = trimmedCode;
      }
      
      const { data, error } = await supabase.rpc('create_invite', params);
      
      if (error) {
        if (error.message.includes('already taken')) {
          toast.error('Code already taken', { description: 'Try a different custom code' });
        } else {
          throw error;
        }
        return;
      }
      
      const result = data?.[0];
      if (result?.invite_code) {
        toast.success('+20 XP', { description: 'Invite created!' });
        refresh();
        setCustomCode("");
        
        // Share with appropriate link
        if (forCrew && selectedCrew) {
          const crewSlug = selectedCrew.name.toLowerCase().replace(/\s+/g, '-');
          const shareUrl = `${window.location.origin}/join/${crewSlug}?via=${profile?.username}&crew=${selectedCrew.id}&invite=${result.invite_code}`;
          if (navigator.share) {
            try {
              await navigator.share({
                title: `Join ${selectedCrew.name} on LOOPGATE`,
                text: `Use code ${result.invite_code} to join ${selectedCrew.name}!`,
                url: shareUrl,
              });
            } catch {
              await navigator.clipboard.writeText(shareUrl);
              toast.success('Crew invite link copied!');
            }
          } else {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Crew invite link copied!');
          }
        } else {
          shareInvite(result.invite_code);
        }
      }
    } catch (error) {
      console.error('Error creating invite:', error);
      toast.error('Failed to create invite');
    } finally {
      setIsCreating(false);
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
      <DialogContent className="bg-background border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Send className="w-5 h-5 text-gold" />
            Invite Friends
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="personal" onValueChange={handleTabChange}>
          <TabsList className="w-full bg-surface-1">
            <TabsTrigger value="personal" className="flex-1 data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
              <UserPlus className="w-4 h-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="crew" className="flex-1 data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
              <Users className="w-4 h-4 mr-2" />
              Unit Invite
            </TabsTrigger>
          </TabsList>
          
          {/* Personal Invite Tab */}
          <TabsContent value="personal" className="space-y-4 mt-4">
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
            
            {/* Custom Code Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Custom Code (Optional)
              </label>
              <Input
                placeholder="e.g. YOURNAME, UNIT2025"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16))}
                className="bg-surface-1 border-border font-mono uppercase"
              />
              <p className="text-[10px] text-muted-foreground">
                Min 4 characters. Leave empty for random code.
              </p>
            </div>
            
            {/* Create New Invite Button */}
            <Button
              onClick={() => handleCreateInvite(false)}
              disabled={isCreating || creating}
              className="w-full bg-gold text-black hover:bg-gold/90 font-semibold"
            >
              {isCreating ? (
                <>Creating...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {customCode.length >= 4 ? `Create Code "${customCode}"` : 'Create & Share Invite'}
                </>
              )}
            </Button>
            
            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Codes
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
                      <span className={`px-2 py-0.5 ${
                        invite.status === 'submitted' 
                          ? 'bg-gold/10 text-gold' 
                          : 'bg-green-500/10 text-green-500'
                      }`}>
                        {invite.status === 'submitted' ? '+170 XP' : '+70 XP'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Unit Invite Tab */}
          <TabsContent value="crew" className="space-y-4 mt-4">
            {loadingCrews ? (
              <div className="text-center py-8 text-muted-foreground">Loading units...</div>
            ) : userCrews.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">
                  You need to be an owner or officer of a unit to send unit invites.
                </p>
              </div>
            ) : (
              <>
                {/* Unit Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Select Unit
                  </label>
                  <div className="grid gap-2">
                    {userCrews.map(crew => (
                      <button
                        key={crew.id}
                        onClick={() => setSelectedCrew(crew)}
                        className={`p-3 text-left border transition-colors ${
                          selectedCrew?.id === crew.id
                            ? 'border-gold bg-gold/10'
                            : 'border-border bg-surface-1 hover:border-gold/50'
                        }`}
                      >
                        <span className="font-display">{crew.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* XP Info */}
                <div className="bg-gold/5 border border-gold/20 p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Crew Invite Rewards
                  </h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Send invite</span>
                      <span className="text-gold font-semibold">+20 XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Friend joins + auto-joins crew</span>
                      <span className="text-gold font-semibold">+50 XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Friend submits within 24h</span>
                      <span className="text-gold font-semibold">+100 XP</span>
                    </div>
                  </div>
                </div>
                
                {/* Custom Code Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Custom Code (Optional)
                  </label>
                  <Input
                    placeholder="e.g. JOINMYCREW"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16))}
                    className="bg-surface-1 border-border font-mono uppercase"
                  />
                </div>
                
                {/* Create Crew Invite Button */}
                <Button
                  onClick={() => handleCreateInvite(true)}
                  disabled={isCreating || !selectedCrew}
                  className="w-full bg-gold text-black hover:bg-gold/90 font-semibold"
                >
                  {isCreating ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Invite to {selectedCrew?.name || 'Unit'}
                    </>
                  )}
                </Button>
                
                <p className="text-center text-[10px] text-muted-foreground uppercase tracking-wider">
                  No Index is awarded for invites
                </p>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
