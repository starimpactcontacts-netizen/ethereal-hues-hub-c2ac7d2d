import { useState, useEffect } from "react";
import { ExternalLink, Calendar, Camera, ShieldCheck, Pencil, Plus, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealRankings, useActiveSession } from "@/hooks/useRealData";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import VerificationModal from "@/components/loopgate/VerificationModal";
import EditPlatformModal from "@/components/loopgate/EditPlatformModal";
import AddPlatformModal from "@/components/loopgate/AddPlatformModal";
import AvatarUploadModal from "@/components/loopgate/AvatarUploadModal";
import ActivityStatusSelector from "@/components/loopgate/ActivityStatusSelector";

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
  const { profile, platforms, refreshProfile } = useAuth();
  const { rankings } = useRealRankings();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<EditingPlatform | null>(null);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [bio, setBio] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioEdited, setBioEdited] = useState(false);
  
  // Keep session active
  useActiveSession();

  // Initialize bio from profile
  useEffect(() => {
    if (profile?.bio !== undefined) {
      setBio(profile.bio || "");
      setBioEdited(false);
    }
  }, [profile?.bio]);

  const leagueColors: Record<string, string> = {
    elite: "text-gold border-gold",
    pro: "text-blue-400 border-blue-400",
    open: "text-muted-foreground border-muted-foreground",
  };

  // Get platform for verification (prioritize TikTok, then others)
  const verifiablePlatform = platforms.find(p => p.platform === 'tiktok') 
    || platforms.find(p => p.platform === 'instagram')
    || platforms.find(p => p.platform === 'youtube');
  const canVerify = verifiablePlatform && !profile?.verification_status;

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

  const handleSaveBio = async () => {
    if (!profile?.id) return;
    setIsSavingBio(true);
    try {
      await supabase
        .from("profiles")
        .update({ bio: bio.trim() || null })
        .eq("id", profile.id);
      setBioEdited(false);
      refreshProfile();
    } catch (error) {
      console.error("Failed to save bio:", error);
    } finally {
      setIsSavingBio(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Hero */}
      <div className="p-4">
        <div className="bg-surface-1 border border-border p-6">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <button
                onClick={() => setShowAvatarModal(true)}
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
                  <Camera className="w-6 h-6 text-white" />
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
                  {profile.verification_status ? 'Account verified' : 'Verify to unlock features'}
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
            {!verifiablePlatform && !profile.verification_status && (
              <span className="text-[10px] text-muted-foreground">Connect a platform first</span>
            )}
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-muted-foreground flex items-center gap-2">
            <Pencil size={14} />
            Bio
          </h3>
          <span className="text-[10px] text-muted-foreground">{bio.length}/200</span>
        </div>
        <div className="bg-surface-1 border border-border p-3">
          <textarea
            value={bio}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                setBio(e.target.value);
                setBioEdited(true);
              }
            }}
            placeholder="For work: email@example.com | Video Editor | Open to commissions"
            className="w-full bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground/50"
            rows={2}
          />
          {bioEdited && (
            <div className="flex justify-end mt-2 pt-2 border-t border-border">
              <button
                onClick={handleSaveBio}
                disabled={isSavingBio}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-black text-[10px] font-semibold uppercase tracking-wider disabled:opacity-50"
              >
                <Save size={12} />
                {isSavingBio ? "Saving..." : "Save"}
              </button>
            </div>
          )}
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
                <div>
                  <p className="font-semibold text-sm">{platformLabels[platform.platform]}</p>
                  <p className="text-xs text-muted-foreground">@{platform.platform_username}</p>
                </div>
                <Pencil size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
      {verifiablePlatform && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          userId={profile.id}
          platform={verifiablePlatform.platform as "tiktok" | "instagram" | "youtube"}
          platformUsername={verifiablePlatform.platform_username}
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

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        userId={profile.id}
        currentAvatarUrl={profile.avatar_url}
        onUpdated={refreshProfile}
      />
    </div>
  );
}
