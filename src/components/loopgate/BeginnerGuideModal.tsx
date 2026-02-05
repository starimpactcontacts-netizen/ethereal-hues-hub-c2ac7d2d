import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import loopgateBrand from "@/assets/loopgate-brand.png";

// Increment this version to force show the guide to everyone again
const GUIDE_VERSION = "v4.0";
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
      <DialogContent className="bg-black border-zinc-800 max-w-sm max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader>
          <DialogTitle className="text-center pt-8 pb-4 border-b border-zinc-800/50">
            <img 
              src={loopgateBrand} 
              alt="LOOPGATE" 
              className="h-7 mx-auto"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <p className="text-center text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-medium">
            Get Started
          </p>

          <div className="space-y-2">
            {/* Step 1 - Primary CTA */}
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">01</span>
              </div>
              <h3 className="font-display text-lg text-white mb-1">Take the GQT</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Get your first score. Enter the rankings.
              </p>
                  <button
                    onClick={handleStartGQT}
                className="w-full px-4 py-3 bg-white text-black font-semibold text-sm rounded-[4px] hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                  >
                    Start GQT
                <ArrowRight size={14} />
                  </button>
                </div>

            {/* Step 2 - Collapsible */}
            <div 
              className="p-3 rounded-lg border border-zinc-800/50 cursor-pointer hover:border-zinc-700 transition-colors"
              onClick={() => toggleStep(2)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">02</span>
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Optional</span>
                  </div>
                  <h3 className="font-medium text-sm text-zinc-400">Join a Unit</h3>
                </div>
                {expandedSteps.has(2) ? (
                  <ChevronUp size={14} className="text-zinc-600" />
                ) : (
                  <ChevronDown size={14} className="text-zinc-600" />
                )}
              </div>
              {expandedSteps.has(2) && (
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Team up. Unlock crew events.
                </p>
              )}
            </div>

            {/* Step 3 - Collapsible */}
            <div 
              className="p-3 rounded-lg border border-zinc-800/50 cursor-pointer hover:border-zinc-700 transition-colors"
              onClick={() => toggleStep(3)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">03</span>
                  </div>
                  <h3 className="font-medium text-sm text-zinc-400">Enter Events</h3>
                </div>
                {expandedSteps.has(3) ? (
                  <ChevronUp size={14} className="text-zinc-600" />
                ) : (
                  <ChevronDown size={14} className="text-zinc-600" />
                )}
              </div>
              {expandedSteps.has(3) && (
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Compete. Climb the index.
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={handleClose}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}