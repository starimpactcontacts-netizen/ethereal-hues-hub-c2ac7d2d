import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Trophy, 
  Users, 
  Swords,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Increment this version to force show the guide to everyone again
const GUIDE_VERSION = "v2.0";
const GUIDE_STORAGE_KEY = "loopgate_guide_seen";

interface BeginnerGuideModalProps {
  trigger?: React.ReactNode;
  autoShow?: boolean;
}

export default function BeginnerGuideModal({ trigger, autoShow = false }: BeginnerGuideModalProps) {
  const [open, setOpen] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (!autoShow) return;

    // Check if user has seen this version of the guide
    const seenVersion = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (seenVersion !== GUIDE_VERSION) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoShow]);

  const handleClose = () => {
    setOpen(false);
    // Mark as seen
    localStorage.setItem(GUIDE_STORAGE_KEY, GUIDE_VERSION);
  };

  const handleStartGQT = () => {
    handleClose();
    navigate("/arena");
  };

  const toggleStep = (step: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(step)) {
        next.delete(step);
      } else {
        next.add(step);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="bg-background border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className="text-2xl font-bold tracking-tight">Welcome to</span>
            <br />
            <span className="text-3xl font-black tracking-[0.2em] text-gold">LOOPGATE</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-1">
          <p className="text-center text-muted-foreground text-sm mb-6 uppercase tracking-widest font-semibold">
            Start Here
          </p>

          <div className="space-y-3">
            {/* Step 1 - Primary CTA */}
            <div className="p-4 rounded-xl bg-gold/10 border-2 border-gold/50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center">
                  <Trophy size={22} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gold font-bold uppercase tracking-wider">Step 1</span>
                  </div>
                  <h3 className="font-bold text-base uppercase tracking-wide">Take the Global QOI Test</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Get your first score and enter the rankings.
                  </p>
                  <button
                    onClick={handleStartGQT}
                    className="mt-4 w-full px-4 py-2.5 bg-gold text-background font-bold text-sm rounded-lg hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
                  >
                    👉 Start GQT
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 - Collapsible */}
            <div 
              className="p-3 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => toggleStep(2)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
                  <Users size={18} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Step 2</span>
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Optional</span>
                  </div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide">Join a Crew</h3>
                </div>
                {expandedSteps.has(2) ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </div>
              {expandedSteps.has(2) && (
                <p className="text-xs text-muted-foreground mt-2 ml-[52px] leading-relaxed">
                  Crews unlock events, XP, and team rankings.
                </p>
              )}
            </div>

            {/* Step 3 - Collapsible */}
            <div 
              className="p-3 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => toggleStep(3)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
                  <Swords size={18} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Step 3</span>
                  </div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide">Enter Events</h3>
                </div>
                {expandedSteps.has(3) ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </div>
              {expandedSteps.has(3) && (
                <p className="text-xs text-muted-foreground mt-2 ml-[52px] leading-relaxed">
                  Compete in live drops to climb the index.
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 text-center">
            <button
              onClick={handleClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}