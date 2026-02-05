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
  ChevronUp,
  Zap
} from "lucide-react";
import loopgateLogo from "@/assets/loopgate-wordmark.png";

// Increment this version to force show the guide to everyone again
const GUIDE_VERSION = "v3.0";
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
    navigate("/gqt");
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
      <DialogContent className="bg-black border-gold/30 max-w-md max-h-[85vh] overflow-y-auto p-0">
        {/* Hero gradient header */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-b from-gold/10 via-gold/5 to-transparent">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/20 via-transparent to-transparent opacity-50" />
          
        <DialogHeader>
            <DialogTitle className="text-center relative z-10">
              <span className="text-xs font-semibold tracking-[0.3em] text-gold/80 uppercase">Welcome to</span>
              <img 
                src={loopgateLogo} 
                alt="LOOPGATE" 
                className="h-10 mx-auto mt-2 brightness-0 invert"
              />
          </DialogTitle>
        </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-1">
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            <p className="text-gold/70 text-[10px] uppercase tracking-[0.25em] font-bold flex items-center gap-1.5">
              <Zap size={10} className="text-gold" />
              Start Here
              <Zap size={10} className="text-gold" />
          </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          </div>

          <div className="space-y-3">
            {/* Step 1 - Primary CTA */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-gold/15 via-gold/10 to-gold/5 border border-gold/40 shadow-[0_0_30px_-10px] shadow-gold/30">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold flex items-center justify-center shadow-lg shadow-gold/20">
                  <Trophy size={22} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gold font-bold uppercase tracking-wider">Step 1</span>
                    <span className="text-[8px] bg-gold/20 text-gold px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Required</span>
                  </div>
                  <h3 className="font-bold text-base uppercase tracking-wide">Take the Global QOI Test</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Get your first score and enter the rankings.
                  </p>
                  <button
                    onClick={handleStartGQT}
                    className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-gold via-gold to-amber-500 text-black font-black text-sm rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg shadow-gold/30"
                  >
                    <Zap size={14} className="fill-current" />
                    Start GQT
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 - Collapsible */}
            <div 
              className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 cursor-pointer hover:bg-zinc-800/80 hover:border-zinc-700 transition-all"
              onClick={() => toggleStep(2)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <Users size={18} className="text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Step 2</span>
                    <span className="text-[8px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-wider">Optional</span>
                  </div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-300">Join a Unit</h3>
                </div>
                {expandedSteps.has(2) ? (
                  <ChevronUp size={16} className="text-zinc-500" />
                ) : (
                  <ChevronDown size={16} className="text-zinc-500" />
                )}
              </div>
              {expandedSteps.has(2) && (
                <p className="text-xs text-zinc-500 mt-2 ml-[52px] leading-relaxed">
                  Units unlock events, XP, and team rankings.
                </p>
              )}
            </div>

            {/* Step 3 - Collapsible */}
            <div 
              className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 cursor-pointer hover:bg-zinc-800/80 hover:border-zinc-700 transition-all"
              onClick={() => toggleStep(3)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <Swords size={18} className="text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Step 3</span>
                  </div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-300">Enter Events</h3>
                </div>
                {expandedSteps.has(3) ? (
                  <ChevronUp size={16} className="text-zinc-500" />
                ) : (
                  <ChevronDown size={16} className="text-zinc-500" />
                )}
              </div>
              {expandedSteps.has(3) && (
                <p className="text-xs text-zinc-500 mt-2 ml-[52px] leading-relaxed">
                  Compete in live drops to climb the index.
                </p>
              )}
            </div>
          </div>

          <div className="pt-5 text-center">
            <button
              onClick={handleClose}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-wider"
            >
              Skip for now
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}