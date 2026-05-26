import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PageTransition from "@/components/loopgate/PageTransition";
import { toast } from "sonner";

const leagues = [
  { id: "open", label: "Open", description: "Anyone can join" },
  { id: "pro", label: "Pro", description: "Pro League and above" },
  { id: "elite", label: "Elite", description: "Elite League only" },
];

const joinTypes = [
  { id: "open", label: "Open", description: "Anyone can join instantly" },
  { id: "invite_only", label: "Invite Only", description: "Requires approval" },
];

async function uploadImage(file: File, path: string): Promise<string | null> {
  const { error } = await supabase.storage
    .from("crew-avatars")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) return null;
  const { data: { publicUrl } } = supabase.storage.from("crew-avatars").getPublicUrl(path);
  return publicUrl;
}

export default function CreateCrewPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin: hasAdminRole, isDev } = useUserRoles(user?.id);
  const canBypassLimit = hasAdminRole || isDev;
  const [loading, setLoading] = useState(false);
  const [ownedCrewsCount, setOwnedCrewsCount] = useState<number | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discord_url: "",
    min_league: "open" as "open" | "pro" | "elite",
    join_type: "open",
    max_members: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/units');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("crews").select("*", { count: "exact", head: true }).eq("owner_id", user.id)
      .then(({ count, error }) => { if (!error) setOwnedCrewsCount(count || 0); });
  }, [user]);

  const pickFile = (file: File, type: "logo" | "banner") => {
    const url = URL.createObjectURL(file);
    if (type === "logo") { setLogoFile(file); setLogoPreview(url); }
    else { setBannerFile(file); setBannerPreview(url); }
  };

  const handleCreate = async () => {
    if (!user || !formData.name.trim()) return;
    if (!canBypassLimit && ownedCrewsCount !== null && ownedCrewsCount >= 2) return;
    setLoading(true);

    try {
      const { data: existingProfile } = await supabase
        .from("profiles").select("crew_id").eq("id", user.id).single();

      if (existingProfile?.crew_id && !canBypassLimit) {
        toast.error("Leave your current unit before creating a new one.");
        setLoading(false);
        return;
      }

      const { data: existingPrimary } = await supabase
        .from("crew_members").select("id").eq("user_id", user.id).eq("is_primary", true).single();

      const willBePrimary = !existingPrimary;

      const { data: crew, error: crewError } = await supabase
        .from("crews")
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          emblem: "shield",
          min_league: formData.min_league,
          join_type: formData.join_type,
          owner_id: user.id,
          member_count: 1,
          max_members: formData.max_members ? parseInt(formData.max_members) : null,
          discord_url: formData.discord_url.trim() || null,
        })
        .select().single();

      if (crewError) {
        if (crewError.code === "23505") toast.error("A unit with this name already exists.");
        else toast.error("Failed to create unit.");
        setLoading(false);
        return;
      }

      // Upload images after crew is created
      const uploads: Promise<void>[] = [];
      if (logoFile) {
        uploads.push(
          uploadImage(logoFile, `${crew.id}/avatar_${Date.now()}.jpg`).then(url => {
            if (url) supabase.from("crews").update({ avatar_url: url }).eq("id", crew.id);
          })
        );
      }
      if (bannerFile) {
        uploads.push(
          uploadImage(bannerFile, `${crew.id}/banner_${Date.now()}.jpg`).then(url => {
            if (url) supabase.from("crews").update({ banner_url: url }).eq("id", crew.id);
          })
        );
      }
      await Promise.all(uploads);

      const { error: memberError } = await supabase.from("crew_members").insert({
        crew_id: crew.id, user_id: user.id, role: "owner", is_primary: willBePrimary,
      });

      if (memberError) {
        await supabase.from("crews").delete().eq("id", crew.id);
        toast.error("Failed to create unit. Please try again.");
        setLoading(false);
        return;
      }

      if (willBePrimary) {
        await supabase.from("profiles").update({ crew_id: crew.id }).eq("id", user.id);
      }

      navigate(`/units/${crew.id}`);
    } catch {
      toast.error("An unexpected error occurred.");
      setLoading(false);
    }
  };

  const isAtLimit = !canBypassLimit && ownedCrewsCount !== null && ownedCrewsCount >= 2;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-4 flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Create Unit</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {isAtLimit && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">You already own 2 units (maximum). Delete one to create a new unit.</p>
            </div>
          )}

          {/* Banner picker */}
          <div className="space-y-2">
            <Label>Banner</Label>
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              className="relative w-full h-28 rounded-xl overflow-hidden border border-border/40 bg-muted/20 flex items-center justify-center group"
            >
              {bannerPreview ? (
                <img src={bannerPreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-[11px]">Add banner image</span>
                </div>
              )}
              {bannerPreview && (
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && pickFile(e.target.files[0], "banner")} />
          </div>

          {/* Logo picker */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/40 bg-muted/20 flex items-center justify-center group"
            >
              {logoPreview ? (
                <img src={logoPreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <Camera className="w-6 h-6 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              )}
              {logoPreview && (
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && pickFile(e.target.files[0], "logo")} />
          </div>

          {/* Unit Name */}
          <div className="space-y-2">
            <Label>Unit Name</Label>
            <Input
              placeholder="Enter unit name..."
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              maxLength={48}
              className="bg-muted/50"
              disabled={isAtLimit}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Tell others about your unit..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              maxLength={200}
              className="bg-muted/50 resize-none"
              rows={3}
            />
          </div>

          {/* Discord */}
          <div className="space-y-2">
            <Label>Discord Link <span className="text-muted-foreground/50 font-normal">(optional)</span></Label>
            <Input
              placeholder="https://discord.gg/..."
              value={formData.discord_url}
              onChange={e => setFormData({ ...formData, discord_url: e.target.value })}
              className="bg-muted/50"
            />
          </div>

          {/* Minimum League */}
          <div className="space-y-3">
            <Label>Minimum League Requirement</Label>
            <div className="space-y-2">
              {leagues.map(league => (
                <button
                  key={league.id}
                  onClick={() => setFormData({ ...formData, min_league: league.id as "open" | "pro" | "elite" })}
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
              {joinTypes.map(type => (
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

          {/* Max Members */}
          <div className="space-y-2">
            <Label>Max Members <span className="text-muted-foreground/50 font-normal">(optional, blank = unlimited)</span></Label>
            <Input
              type="number"
              placeholder="e.g. 20"
              value={formData.max_members}
              onChange={e => setFormData({ ...formData, max_members: e.target.value })}
              min={1}
              max={1000}
              className="bg-muted/50"
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading || !formData.name.trim() || isAtLimit}
            className="w-full bg-gold text-black hover:bg-gold/90"
          >
            {loading ? "Creating..." : "Create Unit"}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
