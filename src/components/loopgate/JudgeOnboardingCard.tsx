import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Share2, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ONBOARDING_STORAGE_KEY = "loopgate_judge_onboard_count";
const MAX_SHOWS = 3;

interface JudgeOnboardingCardProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export function useJudgeOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const count = parseInt(localStorage.getItem(ONBOARDING_STORAGE_KEY) || "0", 10);
    if (count < MAX_SHOWS) {
      const timer = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    const count = parseInt(localStorage.getItem(ONBOARDING_STORAGE_KEY) || "0", 10);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, String(count + 1));
  };

  const dismissForever = () => {
    setShow(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, String(MAX_SHOWS));
  };

  return { show, dismiss, dismissForever };
}

export default function JudgeOnboardingCard({ isOpen, onDismiss }: JudgeOnboardingCardProps) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const judgeLink = `https://loopgate.io/judge/${profile?.username || "you"}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(judgeLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-4 pb-4"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-black border border-zinc-800 overflow-hidden"
          >
            {/* Red accent */}
            <div className="h-1 bg-red-700" />

            <div className="p-5">
              {/* Close */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-mono mb-1">Getting Started</p>
                  <h3 className="font-display text-lg text-white tracking-wide">How Judging Works</h3>
                </div>
                <button onClick={onDismiss} className="p-1 hover:bg-white/5 transition-colors">
                  <X size={16} className="text-zinc-500" />
                </button>
              </div>

              {/* Steps */}
              <div className="space-y-4 mb-5">
                <div className="flex gap-3">
                  <div className="w-6 h-6 shrink-0 bg-red-950 border border-red-800 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-red-400">1</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium mb-0.5">Share your judge link</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Post it on your socials, TikTok bio, or YouTube description. Editors submit directly to your inbox.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 shrink-0 bg-red-950 border border-red-800 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-red-400">2</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium mb-0.5">Editors sign up & submit</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      They create a Loopgate account and send their edit for your review. Clean, simple.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 shrink-0 bg-red-950 border border-red-800 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-red-400">3</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium mb-0.5">Rate & generate cards</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Score with any method you prefer. Share the result card — it promotes both you and Loopgate.
                    </p>
                  </div>
                </div>
              </div>

              {/* Share Link */}
              <div className="bg-zinc-950 border border-zinc-800 p-3 mb-4">
                <p className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-mono mb-2 flex items-center gap-1.5">
                  <Link2 size={10} />
                  Your Judge Link
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[12px] text-red-400 font-mono truncate">{judgeLink}</code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-colors"
                  >
                    {copied ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <Copy size={14} className="text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onDismiss}
                  className="flex-1 py-3 bg-white text-black font-display text-sm uppercase tracking-[0.15em] hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 size={14} />
                  Got It
                </button>
              </div>

              <p className="text-center text-[10px] text-zinc-600 mt-3">
                This guide shows {MAX_SHOWS} times for new judges
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
