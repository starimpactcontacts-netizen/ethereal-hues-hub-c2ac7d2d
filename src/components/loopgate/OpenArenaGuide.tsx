import { useState, useEffect } from "react";
import { X, Zap, Trophy, Users, Target, ArrowRight, Info } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface OpenArenaGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_VERSION = "open-arena-v1";

export function useOpenArenaGuide() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem(`loopgate-guide-${GUIDE_VERSION}`);
    // Don't auto-show - let parent control via showOpenArenaInfo setting
  }, []);

  const markAsSeen = () => {
    localStorage.setItem(`loopgate-guide-${GUIDE_VERSION}`, "true");
    setShowGuide(false);
  };

  return { showGuide, setShowGuide, markAsSeen };
}

export default function OpenArenaGuide({ isOpen, onClose }: OpenArenaGuideProps) {
  const steps = [
    {
      icon: Zap,
      title: "Multi-Round Competition",
      description: "Open Arena events run up to 3 rounds. Each round has its own rules, rewards, and submission window.",
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
    {
      icon: Target,
      title: "Round Types",
      description: "Rounds can be Open (everyone submits), Elimination (top X advance), or Threshold (minimum QOI to advance).",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Users,
      title: "Advancement",
      description: "After each round, only qualified editors advance. Your status will show as 'Advanced' or 'Eliminated'.",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Trophy,
      title: "Final Round",
      description: "The final round determines the winner. Rankings can be based on final QOI, cumulative QOI, or judge selection.",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Sparkles,
      title: "Bonus Rewards",
      description: "Later rounds often have higher Index rewards and bonus multipliers. Push through to maximize your earnings!",
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-background border-gold/30 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-gold/20 via-surface-1 to-surface-1 p-6 border-b border-gold/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
              <Zap size={20} className="text-gold" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Open Arena</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Multi-Round Competition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-surface-1 border border-border"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${step.bgColor} flex items-center justify-center`}>
                <step.icon size={16} className={step.color} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-1/50">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gold text-black font-bold rounded-lg"
          >
            <span>Got it</span>
            <ArrowRight size={16} />
          </button>
          <p className="text-center text-[10px] text-muted-foreground mt-3">
            You can access this guide from any Open Arena event page
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact inline info button for event pages
export function OpenArenaInfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-gold/80 hover:text-gold transition-colors"
    >
      <Info size={12} />
      <span>What is Open Arena?</span>
    </button>
  );
}
