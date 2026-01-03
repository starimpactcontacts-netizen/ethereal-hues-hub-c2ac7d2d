import { useState } from "react";
import { X, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: {
    id: string;
    platform: string;
    platform_username: string;
    platform_url: string;
    follower_count: number;
  };
  onUpdated: () => void;
}

const platformLabels: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

function getPlatformUrl(platform: string, username: string): string {
  const cleanUsername = username.replace(/^@/, "");
  switch (platform) {
    case "tiktok":
      return `https://www.tiktok.com/@${cleanUsername}`;
    case "instagram":
      return `https://www.instagram.com/${cleanUsername}`;
    case "youtube":
      return `https://www.youtube.com/@${cleanUsername}`;
    default:
      return "";
  }
}

export default function EditPlatformModal({
  isOpen,
  onClose,
  platform,
  onUpdated,
}: EditPlatformModalProps) {
  const [username, setUsername] = useState(platform.platform_username);
  const [followerCount, setFollowerCount] = useState(String(platform.follower_count || ""));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    setSaving(true);

    try {
      const cleanUsername = username.replace(/^@/, "");
      const platformUrl = getPlatformUrl(platform.platform, cleanUsername);
      const followers = parseInt(followerCount, 10) || 0;

      const { error } = await supabase
        .from("connected_platforms")
        .update({
          platform_username: cleanUsername,
          platform_url: platformUrl,
          follower_count: followers,
        })
        .eq("id", platform.id);

      if (error) throw error;

      toast.success("Platform updated");
      onUpdated();
      onClose();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Failed to update platform");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove ${platformLabels[platform.platform]} from your profile?`)) {
      return;
    }

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("connected_platforms")
        .delete()
        .eq("id", platform.id);

      if (error) throw error;

      toast.success("Platform removed");
      onUpdated();
      onClose();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to remove platform");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="relative bg-surface-1 border border-border w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-xl">Edit {platformLabels[platform.platform]}</h2>
          <button onClick={onClose} className="p-1">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`@yourusername`}
              className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-2">
              Follower Count (optional)
            </label>
            <input
              type="number"
              value={followerCount}
              onChange={(e) => setFollowerCount(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Enter your current follower count
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="px-4 py-2 border border-red-500 text-red-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 size={14} />}
              Remove
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="flex-1 bg-gold text-black font-semibold py-2 text-sm flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
