import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";
import { ScopeTarget, MedalRing, TrophyPillar } from "@/components/loopgate/LoopgateIcons";
import loopgateBrand from "@/assets/loopgate-brand.png";

const GUIDE_VERSION = "v5.2";
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

  const go = (path: string) => { handleClose(); navigate(path); };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="bg-[#0c0c0c] border-none w-[92vw] max-w-[380px] p-0 gap-0 rounded-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-center pt-6 pb-4">
            <img src={loopgateBrand} alt="LOOPGATE" className="h-5 mx-auto opacity-70" />
          </DialogTitle>
        </DialogHeader>

        <div className="px-3.5 pb-4 space-y-1.5">

          {/* ── 01 · RATE MY EDIT ── */}
          <button onClick={() => go("/loopy")} className="group relative w-full text-left">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-fuchsia-500" />
            <div className="bg-[#141414] group-hover:bg-[#1a1a1a] transition-colors p-3.5 pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-white/20 font-bold tracking-[0.25em]" style={{ fontFamily: 'Teko, sans-serif' }}>01</span>
                <span className="text-[9px] font-black tracking-widest text-purple-400 bg-purple-500/15 px-2.5 py-0.5"
                  style={{ clipPath: 'polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)' }}>FREE</span>
              </div>
              <div className="flex items-center gap-2 mb-0.5">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="text-[19px] font-black text-white tracking-wide leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                  GET YOUR EDIT RATED
                </span>
              </div>
              <p className="text-[10px] text-white/25 pl-7 mb-2.5">Smart diagnostic · No sign-up needed</p>
              <div className="flex items-center justify-center gap-2 py-2.5 border border-purple-500/25 bg-purple-500/[0.06] group-hover:bg-purple-500/15 group-hover:border-purple-500/40 transition-all"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%)' }}>
                <span className="text-[13px] font-bold text-purple-300/80 uppercase tracking-[0.18em] group-hover:text-purple-200 transition-colors" style={{ fontFamily: 'Teko, sans-serif' }}>
                  Rate My Edit
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400/60 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* ── 02 · GET PAID ── */}
          <button onClick={() => go("/hub")} className="group relative w-full text-left">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-green-400" />
            <div className="bg-[#141414] group-hover:bg-[#1a1a1a] transition-colors p-3.5 pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-white/20 font-bold tracking-[0.25em]" style={{ fontFamily: 'Teko, sans-serif' }}>02</span>
                <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5"
                  style={{ clipPath: 'polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)' }}>EARN $$$</span>
              </div>
              <div className="flex items-center gap-2 mb-0.5">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span className="text-[19px] font-black text-white tracking-wide leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                  DO A MISSION — GET PAID
                </span>
              </div>
              <p className="text-[10px] text-white/25 pl-7 mb-2.5">Edit for artists · Real cash instantly</p>
              <div className="flex items-center justify-center gap-2 py-2.5 border border-emerald-500/25 bg-emerald-500/[0.06] group-hover:bg-emerald-500/15 group-hover:border-emerald-500/40 transition-all"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%)' }}>
                <span className="text-[13px] font-bold text-emerald-300/80 uppercase tracking-[0.18em] group-hover:text-emerald-200 transition-colors" style={{ fontFamily: 'Teko, sans-serif' }}>
                  Browse Missions
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400/60 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* ── 03 · COMPETE ── */}
          <button onClick={() => go("/events")} className="group relative w-full text-left">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="bg-[#141414] group-hover:bg-[#1a1a1a] transition-colors p-3.5 pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-white/20 font-bold tracking-[0.25em]" style={{ fontFamily: 'Teko, sans-serif' }}>03</span>
                <span className="text-[9px] font-black tracking-widest text-amber-400 bg-amber-500/15 px-2.5 py-0.5"
                  style={{ clipPath: 'polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)' }}>+100 IDX</span>
              </div>
              <div className="flex items-center gap-2 mb-0.5">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-[19px] font-black text-white tracking-wide leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                  COMPETE FOR INDEX
                </span>
              </div>
              <p className="text-[10px] text-white/25 pl-7 mb-2.5">Events · Rankings · Prizes</p>
              <div className="flex items-center justify-center gap-2 py-2.5 border border-amber-500/25 bg-amber-500/[0.06] group-hover:bg-amber-500/15 group-hover:border-amber-500/40 transition-all"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%)' }}>
                <span className="text-[13px] font-bold text-amber-300/80 uppercase tracking-[0.18em] group-hover:text-amber-200 transition-colors" style={{ fontFamily: 'Teko, sans-serif' }}>
                  View Events
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400/60 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* Skip — big tap target */}
          <button onClick={handleClose} className="w-full py-3 mt-1 text-[11px] text-white/15 hover:text-white/30 transition-colors uppercase tracking-[0.2em] font-bold active:scale-95"
            style={{ fontFamily: 'Teko, sans-serif' }}>
            Skip
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
