import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Pencil, Plus, Save, Clock, Check, X, Trash2, AlertTriangle, ChevronRight, Send, Crown, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCrewMembership } from "@/hooks/useCrewMembership";
import { motion } from "framer-motion";
import VerificationModal from "@/components/loopgate/VerificationModal";
import EditPlatformModal from "@/components/loopgate/EditPlatformModal";
import AddPlatformModal from "@/components/loopgate/AddPlatformModal";
import ArchetypeBadge from "@/components/loopgate/ArchetypeBadge";
import ArchetypeSelector from "@/components/loopgate/ArchetypeSelector";
import SoftwareSelector from "@/components/loopgate/SoftwareSelector";
import { SoftwareBadges } from "@/components/loopgate/SoftwareBadge";
import InviteFriendsModal from "@/components/loopgate/InviteFriendsModal";
 import ProfileBackgroundSettings from "@/components/loopgate/ProfileBackgroundSettings";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const platformLabels: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

interface EditingPlatform {
  id: string;
  platform: string;
  platform_username: string;
  platform_url: string;
  follower_count: number;
}

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { profile, platforms, refreshProfile, signOut, loading: authLoading } = useAuth();
  const { primaryCrew } = useCrewMembership(profile?.id);
  
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<EditingPlatform | null>(null);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [bio, setBio] = useState("");
  const [discord, setDiscord] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [daysUntilUsernameChange, setDaysUntilUsernameChange] = useState<number>(0);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [contactEdited, setContactEdited] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [showArchetypeSelector, setShowArchetypeSelector] = useState(false);
  const [showSoftwareSelector, setShowSoftwareSelector] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (profile) {
      setBio((profile as any).bio || "");
      setDiscord((profile as any).discord || "");
      setPortfolioUrl((profile as any).portfolio_url || "");
      setDisplayName((profile as any).display_name || "");
      setUsername(profile.username || "");
      setContactEdited(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.id) {
      supabase.rpc('days_until_username_change', { user_uuid: profile.id })
        .then(({ data }) => {
          setDaysUntilUsernameChange(data || 0);
        });
    }
  }, [profile?.id]);

  const verifiablePlatform = platforms.find(p => p.platform === 'tiktok') 
    || platforms.find(p => p.platform === 'instagram')
    || platforms.find(p => p.platform === 'youtube');
  const canVerify = verifiablePlatform && !profile?.verification_status;

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const handleSaveContact = async () => {
    if (!profile?.id) return;
    setIsSavingContact(true);
    try {
      await supabase
        .from("profiles")
        .update({ 
          bio: bio.trim() || null,
          discord: discord.trim() || null,
          portfolio_url: portfolioUrl.trim() || null,
          display_name: displayName.trim() || null,
        })
        .eq("id", profile.id);
      setContactEdited(false);
      refreshProfile();
      toast.success("Profile saved");
    } catch (error) {
      console.error("Failed to save contact:", error);
      toast.error("Failed to save");
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!profile?.id || !username.trim()) return;
    
    const newUsername = username.trim().toLowerCase();
    if (newUsername === profile.username) {
      setIsEditingUsername(false);
      return;
    }

    const { data: isAvailable } = await supabase.rpc('is_username_available', { 
      check_username: newUsername 
    });

    if (!isAvailable) {
      toast.error('Username is already taken');
      return;
    }

    setIsSavingUsername(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          username: newUsername,
          username_changed_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      
      if (error) throw error;
      
      toast.success('Username updated');
      setIsEditingUsername(false);
      setDaysUntilUsernameChange(14);
      refreshProfile();
    } catch (error) {
      console.error("Failed to save username:", error);
      toast.error('Failed to update username');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.id) return;
    
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.rpc('delete_user_account' as any);
      if (error) throw error;
      
      await signOut();
      navigate('/start');
      toast.success('Account deleted');
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-20">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 hover:bg-surface-1 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl">Settings</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-6"
      >
        {/* ─── Identity ─── */}
        <section className="space-y-3">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Identity</h3>
          
          {/* Archetype */}
          <button
            onClick={() => setShowArchetypeSelector(true)}
            className="w-full bg-surface-1 border border-border rounded-xl p-4 flex items-center justify-between hover:border-gold/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              {(profile as any).archetype ? (
                <ArchetypeBadge archetype={(profile as any).archetype} size="sm" animate={false} />
              ) : (
                <span className="text-sm text-muted-foreground">+ Set Archetype</span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Software */}
          <button
            onClick={() => setShowSoftwareSelector(true)}
            className="w-full bg-surface-1 border border-border rounded-xl p-4 flex items-center justify-between hover:border-gold/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              {(profile as any).software && (profile as any).software.length > 0 ? (
                <SoftwareBadges software={(profile as any).software} size="sm" animate={false} />
              ) : (
                <span className="text-sm text-muted-foreground">+ Add Software</span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </section>

        {/* ─── Crew ─── */}
        <section className="space-y-3">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Crew</h3>
          {primaryCrew?.crew ? (
            <Link to={`/crews/${primaryCrew.crew_id}`}>
              <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 flex items-center justify-between hover:border-gold/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gold/10 flex items-center justify-center">
                    {primaryCrew.crew.avatar_url ? (
                      <img src={primaryCrew.crew.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-5 h-5 text-gold" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-gold" />
                      <span className="text-sm font-medium text-gold">{primaryCrew.crew.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Primary Crew</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gold/50" />
              </div>
            </Link>
          ) : (
            <Link to="/crews">
              <div className="border border-dashed border-border rounded-xl p-4 text-center hover:border-gold/30 transition-colors">
                <p className="text-sm text-muted-foreground">+ Join or Create a Crew</p>
              </div>
            </Link>
          )}
        </section>

         {/* ─── Profile Background ─── */}
         <section className="space-y-3">
           <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Profile Background</h3>
           <div className="bg-surface-1 border border-border rounded-xl p-4">
             <ProfileBackgroundSettings
               userId={profile.id}
               currentColor={(profile as any).profile_bg_color || 'gold'}
               currentImageUrl={(profile as any).profile_bg_image_url || null}
               userLevel={profile.level || 1}
               onUpdate={refreshProfile}
             />
           </div>
         </section>
 
        {/* ─── Verification ─── */}
        <section className="space-y-3">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Verification</h3>
          <div className={`rounded-xl p-4 flex items-center justify-between ${
            profile.verification_status 
              ? 'bg-gold/10 border border-gold/30' 
              : 'bg-surface-1 border border-border'
          }`}>
            <div className="flex items-center gap-3">
              <ShieldCheck className={`w-5 h-5 ${profile.verification_status ? 'text-gold' : 'text-muted-foreground'}`} />
              <div>
                <span className="text-sm font-medium">{profile.verification_status ? 'Verified Editor' : 'Unverified'}</span>
                <p className="text-xs text-muted-foreground">{profile.verification_status ? 'Your profile is verified' : 'Link a platform to verify'}</p>
              </div>
            </div>
            {canVerify && (
              <button
                onClick={() => setShowVerificationModal(true)}
                className="px-4 py-2 bg-gold text-black text-xs font-semibold rounded-lg"
              >
                Verify
              </button>
            )}
          </div>
        </section>

        {/* ─── Account ─── */}
        <section className="space-y-3">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Account</h3>
          <div className="bg-surface-1 border border-border rounded-xl p-4 space-y-4">
            {/* Username */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Username</label>
              <div className="flex items-center gap-2">
                {isEditingUsername ? (
                  <>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="flex-1 bg-background border border-gold rounded-lg px-3 py-2.5 text-sm outline-none"
                      maxLength={20}
                      autoFocus
                    />
                    <button onClick={handleSaveUsername} disabled={isSavingUsername} className="p-2.5 text-gold hover:bg-gold/10 rounded-lg">
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setUsername(profile.username || '');
                        setIsEditingUsername(false);
                      }}
                      className="p-2.5 text-muted-foreground hover:text-foreground rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">@{profile.username}</span>
                    {daysUntilUsernameChange === 0 ? (
                      <button onClick={() => setIsEditingUsername(true)} className="p-2 text-muted-foreground hover:text-gold transition-colors">
                        <Pencil size={16} />
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 bg-muted/20 rounded">
                        <Clock size={12} />
                        {daysUntilUsernameChange}d
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  if (e.target.value.length <= 50) {
                    setDisplayName(e.target.value);
                    setContactEdited(true);
                  }
                }}
                placeholder="Your public name"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold transition-colors"
              />
            </div>

            {/* Bio */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Bio</label>
                <span className="text-[10px] text-muted-foreground">{bio.length}/200</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setBio(e.target.value);
                    setContactEdited(true);
                  }
                }}
                placeholder="Short bio..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm resize-none outline-none focus:border-gold transition-colors"
                rows={3}
              />
            </div>

            {/* Discord */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Discord</label>
              <input
                type="text"
                value={discord}
                onChange={(e) => {
                  setDiscord(e.target.value);
                  setContactEdited(true);
                }}
                placeholder="username#1234"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold transition-colors"
              />
            </div>

            {/* Portfolio URL */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Portfolio URL</label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => {
                  setPortfolioUrl(e.target.value);
                  setContactEdited(true);
                }}
                placeholder="https://yourportfolio.com"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold transition-colors"
              />
            </div>

            {contactEdited && (
              <button
                onClick={handleSaveContact}
                disabled={isSavingContact}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gold text-black text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                <Save size={16} />
                {isSavingContact ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </section>

        {/* ─── Platforms ─── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Platforms</h3>
            {platforms.length < 3 && (
              <button onClick={() => setShowAddPlatform(true)} className="text-xs text-gold flex items-center gap-1 font-medium">
                <Plus size={14} />
                Add
              </button>
            )}
          </div>
          {platforms.length > 0 ? (
            <div className="space-y-2">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setEditingPlatform({
                    id: platform.id,
                    platform: platform.platform,
                    platform_username: platform.platform_username,
                    platform_url: platform.platform_url,
                    follower_count: platform.follower_count,
                  })}
                  className="w-full bg-surface-1 border border-border rounded-xl p-4 flex items-center justify-between hover:border-gold/30 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium">{platformLabels[platform.platform]}</p>
                    <p className="text-xs text-muted-foreground">@{platform.platform_username}</p>
                  </div>
                  <Pencil size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setShowAddPlatform(true)}
              className="w-full border border-dashed border-border rounded-xl p-5 text-center text-sm text-muted-foreground hover:border-gold/30 transition-colors"
            >
              + Add your first platform
            </button>
          )}
        </section>

        {/* ─── Quick Actions ─── */}
        <section className="space-y-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="w-full bg-gold/10 border border-gold/30 rounded-xl p-4 flex items-center justify-between hover:border-gold/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Send className="w-5 h-5 text-gold" />
              <span className="text-sm text-gold font-medium">Invite Friends</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gold/50" />
          </button>

          <button
            onClick={() => signOut()}
            className="w-full bg-surface-1 border border-border rounded-xl p-4 flex items-center justify-between hover:border-destructive/30 transition-colors"
          >
            <span className="text-sm text-muted-foreground">Sign Out</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </section>

        {/* ─── Danger Zone ─── */}
        <section className="pt-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-destructive mb-1">Delete Account</h3>
                <p className="text-xs text-muted-foreground mb-4">This action cannot be undone. All your data will be permanently deleted.</p>
                <AlertDialog onOpenChange={(open) => {
                  if (!open) {
                    setDeleteStep(1);
                    setDeleteConfirmText("");
                  }
                }}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-surface-0 border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {deleteStep === 1 && "Are you sure?"}
                        {deleteStep === 2 && "This is permanent"}
                        {deleteStep === 3 && "Final confirmation"}
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-4">
                          {deleteStep === 1 && (
                            <p className="text-muted-foreground">
                              All your data will be permanently deleted. This cannot be undone.
                            </p>
                          )}
                          {deleteStep === 2 && (
                            <div>
                              <p className="text-foreground font-medium mb-2">Type DELETE to confirm:</p>
                              <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                                placeholder="DELETE"
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none"
                              />
                            </div>
                          )}
                          {deleteStep === 3 && (
                            <p className="text-destructive font-medium">
                              This is your last chance. Click confirm to permanently delete your account.
                            </p>
                          )}
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      {deleteStep === 1 && (
                        <Button variant="destructive" onClick={() => setDeleteStep(2)}>
                          Continue
                        </Button>
                      )}
                      {deleteStep === 2 && (
                        <Button 
                          variant="destructive" 
                          onClick={() => setDeleteStep(3)}
                          disabled={deleteConfirmText !== 'DELETE'}
                        >
                          Continue
                        </Button>
                      )}
                      {deleteStep === 3 && (
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount}
                        >
                          {isDeletingAccount ? "Deleting..." : "Delete Forever"}
                        </Button>
                      )}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </section>
      </motion.div>

      {/* ═══ MODALS ═══ */}
      {showVerificationModal && verifiablePlatform && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          userId={profile.id}
          platform={verifiablePlatform.platform as "tiktok" | "instagram" | "youtube"}
          platformUsername={verifiablePlatform.platform_username}
          existingCode={(profile as any).verification_code}
          onVerified={() => {
            setShowVerificationModal(false);
            refreshProfile();
          }}
        />
      )}

      {editingPlatform && (
        <EditPlatformModal
          isOpen={!!editingPlatform}
          onClose={() => setEditingPlatform(null)}
          platform={editingPlatform}
          onUpdated={() => {
            setEditingPlatform(null);
            refreshProfile();
          }}
        />
      )}

      {showAddPlatform && (
        <AddPlatformModal
          isOpen={showAddPlatform}
          onClose={() => setShowAddPlatform(false)}
          userId={profile.id}
          existingPlatforms={platforms.map(p => p.platform)}
          onAdded={() => {
            setShowAddPlatform(false);
            refreshProfile();
          }}
        />
      )}

      {showArchetypeSelector && (
        <ArchetypeSelector
          isOpen={showArchetypeSelector}
          onClose={() => setShowArchetypeSelector(false)}
          value={(profile as any).archetype}
          onChange={async (archetype) => {
            if (!profile?.id) return;
            await supabase.from("profiles").update({ archetype }).eq("id", profile.id);
            setShowArchetypeSelector(false);
            refreshProfile();
            toast.success("Archetype updated");
          }}
        />
      )}

      {showSoftwareSelector && (
        <SoftwareSelector
          isOpen={showSoftwareSelector}
          onClose={() => setShowSoftwareSelector(false)}
          value={(profile as any).software || []}
          onChange={async (software) => {
            if (!profile?.id) return;
            await supabase.from("profiles").update({ software }).eq("id", profile.id);
            setShowSoftwareSelector(false);
            refreshProfile();
            toast.success("Software updated");
          }}
        />
      )}

      <InviteFriendsModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
      />
    </div>
  );
}
