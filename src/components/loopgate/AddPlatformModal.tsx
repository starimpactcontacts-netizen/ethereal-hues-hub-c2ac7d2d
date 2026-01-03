import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface AddPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  existingPlatforms: string[];
  onAdded: () => void;
}

const platformOptions = [
  { value: "tiktok", label: "TikTok", urlPrefix: "https://www.tiktok.com/@" },
  { value: "instagram", label: "Instagram", urlPrefix: "https://www.instagram.com/" },
  { value: "youtube", label: "YouTube", urlPrefix: "https://www.youtube.com/@" },
] as const;

const usernameSchema = z.string()
  .min(1, "Username is required")
  .max(50, "Username too long")
  .regex(/^[a-zA-Z0-9._]+$/, "Only letters, numbers, dots and underscores");

const urlSchema = z.string()
  .min(1, "Profile URL is required")
  .url("Must be a valid URL")
  .refine((url) => {
    return url.includes("tiktok.com") || url.includes("instagram.com") || url.includes("youtube.com");
  }, "Must be a TikTok, Instagram, or YouTube link");

export default function AddPlatformModal({
  isOpen,
  onClose,
  userId,
  existingPlatforms,
  onAdded,
}: AddPlatformModalProps) {
  const [platform, setPlatform] = useState<"tiktok" | "instagram" | "youtube" | "">("");
  const [username, setUsername] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const availablePlatforms = platformOptions.filter(
    (p) => !existingPlatforms.includes(p.value)
  );

  const handleSave = async () => {
    if (!platform) {
      setError("Select a platform");
      return;
    }

    const usernameResult = usernameSchema.safeParse(username.trim());
    if (!usernameResult.success) {
      setError(usernameResult.error.errors[0].message);
      return;
    }

    const urlResult = urlSchema.safeParse(profileUrl.trim());
    if (!urlResult.success) {
      setError(urlResult.error.errors[0].message);
      return;
    }

    // Validate URL matches selected platform
    const platformConfig = platformOptions.find((p) => p.value === platform);
    if (!platformConfig) return;

    const urlLower = profileUrl.toLowerCase();
    if (
      (platform === "tiktok" && !urlLower.includes("tiktok.com")) ||
      (platform === "instagram" && !urlLower.includes("instagram.com")) ||
      (platform === "youtube" && !urlLower.includes("youtube.com"))
    ) {
      setError(`URL must be a ${platformConfig.label} link`);
      return;
    }

    const cleanUsername = username.trim().replace(/^@/, "");

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase
      .from("connected_platforms")
      .insert({
        user_id: userId,
        platform: platform,
        platform_username: cleanUsername,
        platform_url: profileUrl.trim(),
        follower_count: 0,
        is_verified: false,
      });

    if (insertError) {
      setError("Failed to add platform");
      setSaving(false);
      return;
    }

    toast.success(`${platformConfig.label} added`);
    onAdded();
    onClose();
  };

  const handleClose = () => {
    // Delay state reset to prevent flash during close animation
    onClose();
    setTimeout(() => {
      setPlatform("");
      setUsername("");
      setProfileUrl("");
      setError("");
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={handleClose} />

      <div className="relative bg-surface-1 border border-border w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-lg">Add Platform</h2>
          <button onClick={handleClose} className="p-1">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {availablePlatforms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All platforms already connected
            </p>
          ) : (
            <>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-2">
                  Platform
                </label>
                <div className="flex gap-2">
                  {availablePlatforms.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPlatform(p.value)}
                      className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                        platform === p.value
                          ? "border-gold text-gold bg-gold/10"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  className="w-full bg-background border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-2">
                  Profile URL
                </label>
                <input
                  type="url"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder={platform ? platformOptions.find(p => p.value === platform)?.urlPrefix + "username" : "https://..."}
                  className="w-full bg-background border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !platform}
                className="w-full bg-gold text-black font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Platform"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
