import { useState, useRef } from "react";
import { ExternalLink, Calendar, Camera, Loader2, ShieldCheck, Pencil, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRealRankings, useActiveSession } from "@/hooks/useRealData";
import { supabase } from "@/integrations/supabase/client";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import VerificationModal from "@/components/loopgate/VerificationModal";
import EditPlatformModal from "@/components/loopgate/EditPlatformModal";
import AddPlatformModal from "@/components/loopgate/AddPlatformModal";
import ActivityStatusSelector from "@/components/loopgate/ActivityStatusSelector";
import { toast } from "sonner";

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return String(count);
}

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

export default function ProfilePage() {
  const { user, profile, platforms, refreshProfile } = useAuth();
  const { rankings } = useRealRankings();
  const [uploading, setUploading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<EditingPlatform | null>(null);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Keep session active
  useActiveSession();

  const leagueColors: Record<string, string> = {
    elite: "text-gold border-gold",
    pro: "text-blue-400 border-blue-400",
    open: "text-muted-foreground border-muted-foreground",
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success("Profile picture updated");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  // Get TikTok username for verification
  const tiktokPlatform = platforms.find(p => p.platform === 'tiktok');
  const canVerify = tiktokPlatform && !profile?.verification_status;

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const league = profile.league || 'open';
  const userRanking = rankings.find(r => r.id === profile.id);
  const userRank = userRanking?.rank || (rankings.length > 0 ? rankings.length + 1 : '—');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Hero */}
      <div className="p-4">
        <div className="bg-surface-1 border border-border p-6">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gold group"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="font-display text-2xl text-muted-foreground">
                      {profile.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Alias + League + Verified */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-4xl">{profile.username}</h1>
              {profile.verification_status && <VerifiedBadge size="lg" />}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] border px-2 py-1 ${leagueColors[league]}`}>
              {league}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Global Editor
          </p>

          {/* Global Rank */}
          <div className="my-6 py-6 border-y border-border text-center">
            <p className="font-display text-7xl text-gold">#{userRank}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-2">Global Rank</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{Number(profile.global_index_score || 0).toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Index</p>
            </div>
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{Number(profile.win_rate || 0).toFixed(0)}%</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Win Rate</p>
            </div>
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{profile.total_events || 0}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Events</p>
            </div>
          </div>

          {/* Activity Status */}
          <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</span>
            <ActivityStatusSelector
              userId={profile.id}
              currentStatus={(profile as any).activity_status || "online"}
              onStatusChange={refreshProfile}
            />
          </div>
        </div>
      </div>

      {/* Verification Status Card */}
      <section className="px-4 py-2">
        <div className={`border p-4 ${profile.verification_status ? 'bg-gold/10 border-gold' : 'bg-surface-1 border-border'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className={profile.verification_status ? 'text-gold' : 'text-muted-foreground'} />
              <div>
                <p className="text-sm font-medium">
                  {profile.verification_status ? 'VERIFIED' : 'UNVERIFIED'}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {profile.verification_status ? 'TikTok account verified' : 'Verify to unlock features'}
                </p>
              </div>
            </div>
            {canVerify && (
              <button
                onClick={() => setShowVerificationModal(true)}
                className="px-4 py-2 bg-gold text-black text-xs font-semibold uppercase tracking-wider"
              >
                Verify
              </button>
            )}
            {!tiktokPlatform && !profile.verification_status && (
              <span className="text-[10px] text-muted-foreground">Connect TikTok first</span>
            )}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-muted-foreground flex items-center gap-2">
            <ExternalLink size={14} />
            Platforms
          </h3>
          {platforms.length < 3 && (
            <button
              onClick={() => setShowAddPlatform(true)}
              className="flex items-center gap-1 text-[10px] text-gold uppercase tracking-wider hover:underline"
            >
              <Plus size={12} />
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
                className="w-full bg-surface-1 border border-border p-3 flex items-center justify-between hover:border-gold transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-sm">{platformLabels[platform.platform]}</p>
                    <p className="text-xs text-muted-foreground">{platform.platform_username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {platform.follower_count > 0 && (
                    <p className="font-display text-xl text-gold">{formatFollowers(platform.follower_count)}</p>
                  )}
                  <Pencil size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setShowAddPlatform(true)}
            className="w-full border border-dashed border-border p-4 text-center text-sm text-muted-foreground hover:border-gold hover:text-gold transition-colors"
          >
            + Add your first platform
          </button>
        )}
      </section>

      {/* Active Events */}
      <section className="px-4 py-4">
        <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar size={14} />
          Active Events
        </h3>
        <p className="text-sm text-muted-foreground">No active events</p>
      </section>

      {/* Recent Events */}
      <section className="px-4 py-4">
        <h3 className="font-display text-lg text-muted-foreground mb-3">
          Recent Events
        </h3>
        <p className="text-sm text-muted-foreground">No recent events</p>
      </section>

      {/* Verification Modal */}
      {tiktokPlatform && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          userId={profile.id}
          tiktokUsername={tiktokPlatform.platform_username}
          existingCode={profile.verification_code}
          onVerified={refreshProfile}
        />
      )}

      {/* Edit Platform Modal */}
      {editingPlatform && (
        <EditPlatformModal
          isOpen={!!editingPlatform}
          onClose={() => setEditingPlatform(null)}
          platform={editingPlatform}
          onUpdated={refreshProfile}
        />
      )}

      {/* Add Platform Modal */}
      <AddPlatformModal
        isOpen={showAddPlatform}
        onClose={() => setShowAddPlatform(false)}
        userId={profile.id}
        existingPlatforms={platforms.map(p => p.platform)}
        onAdded={refreshProfile}
      />
    </div>
  );
}
