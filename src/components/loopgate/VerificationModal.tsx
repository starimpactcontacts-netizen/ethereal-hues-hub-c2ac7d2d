import React, { useState, useRef, useEffect } from "react";
import { X, Copy, Check, Loader2, ExternalLink, RefreshCw, Upload, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  platform: "tiktok" | "instagram" | "youtube";
  platformUsername: string;
  existingCode?: string | null;
  onVerified: () => void;
}

function generateVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LG-${code}`;
}

const platformLabels: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

const platformUrls: Record<string, (username: string) => string> = {
  tiktok: (u) => `https://www.tiktok.com/@${u}`,
  instagram: (u) => `https://www.instagram.com/${u}`,
  youtube: (u) => `https://www.youtube.com/@${u}`,
};

const platformInstructions: Record<string, string> = {
  tiktok: "Open TikTok → Profile → Edit Profile → Add the code to your bio",
  instagram: "Open Instagram → Profile → Edit Profile → Add the code to your bio",
  youtube: "Open YouTube Studio → Customization → Basic Info → Add the code to your description",
};

export default function VerificationModal({
  isOpen,
  onClose,
  userId,
  platform,
  platformUsername,
  existingCode,
  onVerified,
}: VerificationModalProps) {
  const [step, setStep] = useState<"generate" | "upload">(existingCode ? "upload" : "generate");
  const [code, setCode] = useState(existingCode || "");
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes or existingCode changes
  React.useEffect(() => {
    if (isOpen) {
      setStep(existingCode ? "upload" : "generate");
      setCode(existingCode || "");
      setScreenshot(null);
      setScreenshotPreview(null);
      setCopied(false);
      setVerifying(false);
      setGenerating(false);
    }
  }, [isOpen, existingCode]);

  if (!isOpen) return null;

  const handleGenerateCode = async () => {
    setGenerating(true);
    const newCode = generateVerificationCode();
    
    const { error } = await supabase
      .from("profiles")
      .update({ 
        verification_code: newCode,
        verification_requested_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to generate code");
      setGenerating(false);
      return;
    }

    setCode(newCode);
    setStep("upload");
    setGenerating(false);
  };

  const handleRegenerateCode = async () => {
    await handleGenerateCode();
    toast.success("New code generated!");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setScreenshot(base64);
      setScreenshotPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!screenshot) {
      toast.error("Please upload a screenshot first");
      return;
    }

    setVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-screenshot", {
        body: { 
          userId,
          platform,
          platformUsername,
          verificationCode: code,
          screenshotBase64: screenshot
        },
      });

      if (error) throw error;

      if (data?.verified) {
        toast.success(data.message || "Account verified! 🎉");
        onVerified();
        onClose();
      } else {
        toast.error(data?.message || "Verification failed. Please check your screenshot and try again.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const clearScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const platformLabel = platformLabels[platform] || "Platform";
  const profileUrl = platformUrls[platform]?.(platformUsername) || "#";
  const instructions = platformInstructions[platform] || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-1 border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface-1">
          <h2 className="font-display text-xl">Verify {platformLabel}</h2>
          <button onClick={onClose} className="p-1">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === "generate" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Verify your {platformLabel} account to earn a verified badge. This proves you own <span className="text-foreground font-medium">@{platformUsername}</span>.
              </p>
              
              <div className="bg-background border border-border p-4 space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">How it works</p>
                <ol className="text-sm space-y-2">
                  <li className="flex gap-2">
                    <span className="text-gold font-semibold">1.</span>
                    <span>Generate a unique verification code</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold font-semibold">2.</span>
                    <span>Add the code to your {platformLabel} bio for 60 seconds</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold font-semibold">3.</span>
                    <span>Take a screenshot of your profile page</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold font-semibold">4.</span>
                    <span>Upload the screenshot — we'll verify it instantly</span>
                  </li>
                </ol>
              </div>

              <button
                onClick={handleGenerateCode}
                disabled={generating}
                className="w-full bg-gold text-black font-semibold py-3 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Generate Verification Code"
                )}
              </button>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4">
              {/* Code Display */}
              <div className="bg-background border border-gold p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                  Your Verification Code
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-display text-2xl text-gold tracking-wider">{code}</p>
                  <button
                    onClick={handleCopy}
                    className="p-2 border border-border hover:border-gold transition-colors"
                  >
                    {copied ? (
                      <Check size={18} className="text-green-500" />
                    ) : (
                      <Copy size={18} className="text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-background border border-border p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Step 1: Add code to your bio</p>
                <p className="text-xs text-muted-foreground">
                  {instructions}
                </p>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gold flex items-center gap-1 hover:underline"
                >
                  Open your {platformLabel} profile <ExternalLink size={12} />
                </a>
              </div>

              <div className="bg-background border border-border p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Step 2: Take a screenshot</p>
                <p className="text-xs text-muted-foreground">
                  Screenshot your profile page showing your username and the code in your bio.
                </p>
              </div>

              {/* Upload Area */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Step 3: Upload screenshot</p>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />

                {screenshotPreview ? (
                  <div className="relative">
                    <img 
                      src={screenshotPreview} 
                      alt="Screenshot preview" 
                      className="w-full h-48 object-contain bg-background border border-border"
                    />
                    <button
                      onClick={clearScreenshot}
                      className="absolute top-2 right-2 p-1 bg-black/70 border border-border hover:border-red-500 transition-colors"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border hover:border-gold transition-colors p-8 flex flex-col items-center gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <Upload size={24} className="text-muted-foreground" />
                      <Camera size={24} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </button>
                )}
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerify}
                disabled={verifying || !screenshot}
                className="w-full bg-gold text-black font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing screenshot...
                  </>
                ) : (
                  "Verify Now"
                )}
              </button>

              {/* Regenerate Code Option */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleRegenerateCode}
                  disabled={generating}
                  className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                >
                  {generating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  Generate new code
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                You can remove the code from your bio after verification
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
