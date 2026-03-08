import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRight, DollarSign, Brain, Trophy, Flame } from "lucide-react";
import loopgateBrand from "@/assets/loopgate-brand.png";

const GUIDE_VERSION = "v5.0";
const GUIDE_STORAGE_KEY = "loopgate_guide_seen";

interface BeginnerGuideModalProps {
  trigger?: React.ReactNode;
  autoShow?: boolean;
}

export default function BeginnerGuideModal({ trigger, autoShow = false }: BeginnerGuideModalProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!autoShow) return;
    const seenVersion = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (seenVersion !== GUIDE_VERSION) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [autoShow]);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(GUIDE_STORAGE_KEY, GUIDE_VERSION);
  };

  const actions = [
    {
      step: "01",
      title: "GET YOUR EDIT RATED",
      subtitle: "Instant AI diagnostic. No sign-up needed.",
      cta: "Rate My Edit — Free",
      icon: Brain,
      gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
      tag: "FREE",
      tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      onClick: () => { handleClose(); navigate("/loopy"); },
    },
    {
      step: "02",
      title: "DO A MISSION — GET PAID",
      subtitle: "Edit for real artists. Earn real cash instantly.",
      cta: "Browse Missions",
      icon: DollarSign,
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      tag: "EARN $$$",
      tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      onClick: () => { handleClose(); navigate("/hub"); },
    },
    {
      step: "03",
      title: "COMPETE FOR INDEX",
      subtitle: "Enter events. Climb rankings. Win prizes.",
      cta: "View Events",
      icon: Trophy,
      gradient: "from-amber-500 via-orange-500 to-red-500",
      tag: "+100 IDX",
      tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      onClick: () => { handleClose(); navigate("/events"); },
    },
  ];

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

        <div className="p-5 space-y-3">
          <div className="text-center mb-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-[9px] text-zinc-400 uppercase tracking-[0.15em] font-bold">
                Start earning now
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {actions.map((action, i) => (
              <div 
                key={i}
                className="rounded-lg bg-zinc-900/80 border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">{action.step}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${action.tagColor}`}>
                      {action.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-base text-white mb-0.5 tracking-wide">{action.title}</h3>
                  <p className="text-[11px] text-zinc-500 mb-3">{action.subtitle}</p>
                  
                  <div className="relative group">
                    <div className={`absolute -inset-[1px] bg-gradient-to-r ${action.gradient} rounded-[6px] opacity-70 group-hover:opacity-100 transition-opacity`} />
                    <button
                      onClick={action.onClick}
                      className="relative w-full px-4 py-2.5 bg-black text-white font-semibold text-xs rounded-[5px] flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                    >
                      <action.icon className="w-3.5 h-3.5" />
                      {action.cta}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-1 text-center">
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
