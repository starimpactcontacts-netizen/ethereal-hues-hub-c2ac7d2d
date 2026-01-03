import { useState } from "react";
import { X, Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  tiktokUsername: string;
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

export default function VerificationModal({
  isOpen,
  onClose,
  userId,
  tiktokUsername,
  existingCode,
  onVerified,
}: VerificationModalProps) {
  const [step, setStep] = useState<"generate" | "verify">(existingCode ? "verify" : "generate");
  const [code, setCode] = useState(existingCode || "");
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [generating, setGenerating] = useState(false);

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
    setStep("verify");
    setGenerating(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-tiktok", {
        body: { 
          userId,
          tiktokUsername,
          verificationCode: code
        },
      });

      if (error) throw error;

      if (data?.verified) {
        toast.success("Account verified!");
        onVerified();
        onClose();
      } else {
        toast.error(data?.message || "Verification failed. Make sure the code is in your TikTok bio.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-1 border border-border w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-xl">Verify Account</h2>
          <button onClick={onClose} className="p-1">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === "generate" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Verify your TikTok account to earn a verified badge. This proves you own <span className="text-foreground font-medium">@{tiktokUsername}</span>.
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
                    <span>Add the code to your TikTok bio</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold font-semibold">3.</span>
                    <span>Click verify — we'll check your bio</span>
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

          {step === "verify" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add this code to your TikTok bio, then click verify.
              </p>

              {/* Code Display */}
              <div className="bg-background border border-gold p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                  Your Verification Code
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-display text-3xl text-gold tracking-wider">{code}</p>
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
                <p className="text-xs text-muted-foreground">
                  Open TikTok → Profile → Edit Profile → Add <span className="text-gold font-mono">{code}</span> to your bio
                </p>
                <a
                  href={`https://www.tiktok.com/@${tiktokUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gold flex items-center gap-1"
                >
                  Open your TikTok profile <ExternalLink size={12} />
                </a>
              </div>

              <button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full bg-gold text-black font-semibold py-3 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking bio...
                  </>
                ) : (
                  "I've Added It — Verify Now"
                )}
              </button>

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
