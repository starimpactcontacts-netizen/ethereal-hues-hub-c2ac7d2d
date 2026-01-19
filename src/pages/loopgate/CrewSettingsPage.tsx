import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Shield, Crown, Users, Star, Zap, Award, Trash2, Camera, UserCog, ImagePlus, Palette, X } from "lucide-react";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import PageTransition from "@/components/loopgate/PageTransition";
import CrewAvatarUploadModal from "@/components/loopgate/CrewAvatarUploadModal";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
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

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const emblems = [
  { id: "shield", icon: Shield, label: "Shield" },
  { id: "crown", icon: Crown, label: "Crown" },
  { id: "users", icon: Users, label: "Team" },
  { id: "star", icon: Star, label: "Star" },
  { id: "zap", icon: Zap, label: "Lightning" },
  { id: "award", icon: Award, label: "Award" },
];

const leagues = [
  { id: "open", label: "Open", description: "Anyone can join" },
  { id: "pro", label: "Pro", description: "Pro League and above" },
  { id: "elite", label: "Elite", description: "Elite League only" },
];

const joinTypes = [
  { id: "open", label: "Open", description: "Anyone can join instantly" },
  { id: "invite_only", label: "Invite Only", description: "Requires approval" },
];

export default function CrewSettingsPage() {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [crewAvatarUrl, setCrewAvatarUrl] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [transferringTo, setTransferringTo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emblem: "shield",
    min_league: "open" as "open" | "pro" | "elite",
    join_type: "open",
    banner_url: null as string | null,
    banner_color: "#d4af37",
    discord_url: "",
  });
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    if (crewId && user) {
      fetchCrew();
    }
  }, [crewId, user]);

  const fetchCrew = async () => {
    if (!crewId) return;

    const { data: crew, error } = await supabase
      .from("crews")
      .select("*")
      .eq("id", crewId)
      .single();

    if (error || !crew) {
      console.error("Error fetching crew:", error);
      navigate("/crews");
      return;
    }

    // Verify user is the owner
    if (crew.owner_id !== user?.id) {
      navigate(`/crews/${crewId}`);
      return;
    }

    setFormData({
      name: crew.name,
      description: crew.description || "",
      emblem: crew.emblem,
      min_league: crew.min_league as "open" | "pro" | "elite",
      join_type: crew.join_type,
      banner_url: crew.banner_url || null,
      banner_color: crew.banner_color || "#d4af37",
      discord_url: crew.discord_url || "",
    });
    setCrewAvatarUrl(crew.avatar_url || null);

    // Fetch ALL members for ownership transfer (including those we'll filter later for UI)
    const { data: membersData, error: membersError } = await supabase
      .from("crew_members")
      .select("id, user_id, role")
      .eq("crew_id", crewId);

    if (membersError) {
      console.error("Error fetching crew members:", membersError);
    }

    if (membersData && membersData.length > 0) {
      const memberIds = membersData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", memberIds);

      // For transfer ownership, show all members EXCEPT the current owner
      const membersWithProfiles = membersData
        .filter(m => m.user_id !== user?.id) // Exclude current owner for transfer list
        .map(member => ({
          ...member,
          profile: profiles?.find(p => p.id === member.user_id) || null,
        }));
      setMembers(membersWithProfiles);
    } else {
      setMembers([]);
    }

    setLoading(false);
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!crewId || !user) return;

    setTransferringTo(newOwnerId);

    try {
      // IMPORTANT: Update crew_members roles FIRST (while current user is still owner)
      // Make new owner the owner role in crew_members
      const { error: newOwnerRoleError } = await supabase
        .from("crew_members")
        .update({ role: "owner" })
        .eq("crew_id", crewId)
        .eq("user_id", newOwnerId);

      if (newOwnerRoleError) throw newOwnerRoleError;

      // Demote current owner to regular member
      const { error: oldOwnerRoleError } = await supabase
        .from("crew_members")
        .update({ role: "member" })
        .eq("crew_id", crewId)
        .eq("user_id", user.id);

      if (oldOwnerRoleError) throw oldOwnerRoleError;

      // LAST: Update crew owner_id (after role updates are complete)
      const { error: crewError } = await supabase
        .from("crews")
        .update({ owner_id: newOwnerId })
        .eq("id", crewId);

      if (crewError) throw crewError;

      toast.success("Ownership transferred successfully");
      navigate(`/crews/${crewId}`);
    } catch (error) {
      console.error("Error transferring ownership:", error);
      toast.error("Failed to transfer ownership");
    } finally {
      setTransferringTo(null);
    }
  };

  const handleSave = async () => {
    if (!crewId || !formData.name.trim()) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("crews")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          emblem: formData.emblem,
          min_league: formData.min_league,
          join_type: formData.join_type,
          banner_url: formData.banner_url,
          banner_color: formData.banner_color,
          discord_url: formData.discord_url.trim() || null,
        })
        .eq("id", crewId);

      if (error) {
        console.error("Error updating crew:", error);
        if (error.code === "23505") {
          toast.error("A crew with this name already exists.");
        } else {
          toast.error("Failed to save changes: " + error.message);
        }
        setSaving(false);
        return;
      }

      toast.success("Crew settings saved!");
      navigate(`/crews/${crewId}`);
    } catch (err) {
      console.error("Unexpected error saving crew:", err);
      toast.error("An unexpected error occurred.");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!crewId) return;

    setDeleting(true);

    // Delete all members first (this will cascade via foreign key, but let's be explicit)
    await supabase.from("crew_members").delete().eq("crew_id", crewId);
    await supabase.from("crew_messages").delete().eq("crew_id", crewId);
    await supabase.from("crew_join_requests").delete().eq("crew_id", crewId);

    // Delete the crew
    const { error } = await supabase.from("crews").delete().eq("id", crewId);

    if (error) {
      console.error("Error deleting crew:", error);
      setDeleting(false);
      return;
    }

    navigate("/crews");
  };

  const handleBannerUpload = async () => {
    if (!crewId) return;
    setUploadingBanner(true);
    
    try {
      let file: File;
      
      if (Capacitor.isNativePlatform()) {
        const photo = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Photos,
        });
        
        const response = await fetch(`data:image/${photo.format};base64,${photo.base64String}`);
        const blob = await response.blob();
        file = new File([blob], `banner.${photo.format}`, { type: `image/${photo.format}` });
      } else {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        
        file = await new Promise<File>((resolve, reject) => {
          input.onchange = (e) => {
            const f = (e.target as HTMLInputElement).files?.[0];
            if (f) resolve(f);
            else reject(new Error("No file selected"));
          };
          input.click();
        });
      }
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${crewId}/banner.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("crew-avatars")
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from("crew-avatars")
        .getPublicUrl(fileName);
      
      const bannerUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setFormData({ ...formData, banner_url: bannerUrl });
      toast.success("Banner uploaded!");
    } catch (error: any) {
      if (error.message !== "No file selected") {
        console.error("Error uploading banner:", error);
        toast.error("Failed to upload banner");
      }
    } finally {
      setUploadingBanner(false);
    }
  };

  const removeBanner = () => {
    setFormData({ ...formData, banner_url: null });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-4 flex items-center gap-4">
            <button onClick={() => navigate(`/crews/${crewId}`)} className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Crew Settings</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Crew Avatar */}
          <div className="space-y-2">
            <Label>Crew Avatar</Label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAvatarModal(true)}
                className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border hover:border-gold transition-colors group"
              >
                {crewAvatarUrl ? (
                  <img
                    src={crewAvatarUrl}
                    alt="Crew avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </button>
              <p className="text-xs text-muted-foreground">Click to upload a crew avatar</p>
            </div>
          </div>

          {/* Crew Banner */}
          <div className="space-y-3">
            <Label>Crew Banner</Label>
            <div 
              className="h-20 rounded-lg overflow-hidden relative group"
              style={{
                background: formData.banner_url 
                  ? `url(${formData.banner_url}) center/cover` 
                  : `linear-gradient(135deg, ${formData.banner_color}40, ${formData.banner_color}20)`
              }}
            >
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={handleBannerUpload}
                  disabled={uploadingBanner}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ImagePlus className="w-5 h-5 text-white" />
                </button>
                {formData.banner_url && (
                  <button 
                    onClick={removeBanner}
                    className="p-2 rounded-full bg-red-500/50 hover:bg-red-500/70 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
              {uploadingBanner && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.banner_url ? "Click to change or remove banner image" : "Click to upload a banner image, or choose a color below"}
            </p>
            
            {/* Banner Color Picker */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Banner Color (used if no image)</Label>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {["#d4af37", "#3b82f6", "#8b5cf6", "#ef4444", "#22c55e", "#f97316", "#06b6d4", "#ec4899"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, banner_color: color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.banner_color === color ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input 
                  type="color" 
                  value={formData.banner_color}
                  onChange={(e) => setFormData({ ...formData, banner_color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Crew Name */}
          <div className="space-y-2">
            <Label>Crew Name</Label>
            <Input
              placeholder="Enter crew name..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={24}
              className="bg-muted/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Tell others about your crew..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={200}
              className="bg-muted/50 resize-none"
              rows={3}
            />
          </div>

          {/* Discord Server */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <SiDiscord className="w-4 h-4 text-[#5865F2]" />
              Discord Server
            </Label>
            <Input
              placeholder="https://discord.gg/your-invite"
              value={formData.discord_url}
              onChange={(e) => setFormData({ ...formData, discord_url: e.target.value })}
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              Add your Discord invite link so members can join your server
            </p>
          </div>

          {/* Emblem */}
          <div className="space-y-3">
            <Label>Emblem</Label>
            <div className="grid grid-cols-6 gap-2">
              {emblems.map((emblem) => (
                <button
                  key={emblem.id}
                  onClick={() => setFormData({ ...formData, emblem: emblem.id })}
                  className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                    formData.emblem === emblem.id
                      ? "bg-gold/20 border-2 border-gold text-gold"
                      : "bg-muted/50 border border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <emblem.icon className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>

          {/* Minimum League */}
          <div className="space-y-3">
            <Label>Minimum League Requirement</Label>
            <div className="space-y-2">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() =>
                    setFormData({ ...formData, min_league: league.id as "open" | "pro" | "elite" })
                  }
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    formData.min_league === league.id
                      ? "bg-gold/10 border border-gold"
                      : "bg-muted/50 border border-border hover:bg-muted"
                  }`}
                >
                  <p className="font-semibold text-sm">{league.label}</p>
                  <p className="text-xs text-muted-foreground">{league.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Join Type */}
          <div className="space-y-3">
            <Label>Join Type</Label>
            <div className="space-y-2">
              {joinTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData({ ...formData, join_type: type.id })}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    formData.join_type === type.id
                      ? "bg-gold/10 border border-gold"
                      : "bg-muted/50 border border-border hover:bg-muted"
                  }`}
                >
                  <p className="font-semibold text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            className="w-full bg-gold text-black hover:bg-gold/90"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-border space-y-4">
            <h3 className="text-sm font-semibold text-red-500">Danger Zone</h3>
            
            {/* Transfer Ownership */}
            {members.length > 0 && (
              <div className="space-y-3">
                <Label className="text-muted-foreground">Transfer Ownership</Label>
                <p className="text-xs text-muted-foreground">
                  Transfer this crew to another member. You will become a regular member.
                </p>
                <div className="space-y-2">
                  {members.map((member) => (
                    <AlertDialog key={member.id}>
                      <AlertDialogTrigger asChild>
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-gold/50 transition-all text-left">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gold/10 text-gold text-xs">
                              {member.profile?.username?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {member.profile?.display_name || member.profile?.username || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">@{member.profile?.username}</p>
                          </div>
                          <UserCog className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Transfer Ownership?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to transfer ownership to <strong>@{member.profile?.username}</strong>? 
                            You will become a regular member and lose all owner privileges.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleTransferOwnership(member.user_id)}
                            disabled={transferringTo === member.user_id}
                            className="bg-gold text-black hover:bg-gold/90"
                          >
                            {transferringTo === member.user_id ? "Transferring..." : "Transfer"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ))}
                </div>
              </div>
            )}

            {/* Delete Crew */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={deleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete Crew"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Crew?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the crew, all messages, and remove all members.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Crew Avatar Upload Modal */}
      {showAvatarModal && crewId && (
        <CrewAvatarUploadModal
          crewId={crewId}
          currentAvatarUrl={crewAvatarUrl}
          onClose={() => setShowAvatarModal(false)}
          onSuccess={() => {
            fetchCrew();
          }}
        />
      )}
    </PageTransition>
  );
}
