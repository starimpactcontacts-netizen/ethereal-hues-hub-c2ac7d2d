import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRight, DollarSign, Brain, Trophy, Zap } from "lucide-react";
import loopgateBrand from "@/assets/loopgate-brand.png";

const GUIDE_VERSION = "v5.1";
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="bg-[#0a0a0a] border-none max-w-[340px] max-h-[85vh] overflow-y-auto p-0 gap-0">
        <DialogHeader>
          <DialogTitle className="text-center pt-7 pb-5">
            <img src={loopgateBrand} alt="LOOPGATE" className="h-6 mx-auto opacity-80" />
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-5 space-y-2">

          {/* ──── 01 · RATE MY EDIT ──── */}
          <button
            onClick={() => { handleClose(); navigate("/loopy"); }}
            className="group relative w-full text-left overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
          >
            {/* BG */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-[#111] to-[#111] group-hover:from-purple-600/30 transition-all duration-300" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-fuchsia-500" />
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/25 font-bold tracking-[0.2em]" style={{ fontFamily: 'Teko, sans-serif' }}>01</span>
                <span className="text-[9px] font-black tracking-wider text-purple-400 bg-purple-500/15 px-2 py-0.5" style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}>
                  FREE
                </span>
              </div>
              <div className="flex items-center gap-2.5 mb-1">
                <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                <h3 className="text-[17px] font-black text-white tracking-wide leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                  GET YOUR EDIT RATED
                </h3>
              </div>
              <p className="text-[10px] text-white/30 pl-[26px] mb-3">AI diagnostic · No sign-up</p>
              <div className="flex items-center justify-center gap-2 py-2 bg-white/[0.04] border border-white/[0.06] group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
              >
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-[0.15em] group-hover:text-purple-300 transition-colors" style={{ fontFamily: 'Teko, sans-serif' }}>
                  Rate My Edit
                </span>
                <ArrowRight className="w-3 h-3 text-white/40 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </button>

          {/* ──── 02 · GET PAID ──── */}
          <button
            onClick={() => { handleClose(); navigate("/hub"); }}
            className="group relative w-full text-left overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/15 via-[#111] to-[#111] group-hover:from-emerald-600/25 transition-all duration-300" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-green-400" />
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/25 font-bold tracking-[0.2em]" style={{ fontFamily: 'Teko, sans-serif' }}>02</span>
                <span className="text-[9px] font-black tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-0.5" style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}>
                  EARN $$$
                </span>
              </div>
              <div className="flex items-center gap-2.5 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                <h3 className="text-[17px] font-black text-white tracking-wide leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                  DO A MISSION — GET PAID
                </h3>
              </div>
              <p className="text-[10px] text-white/30 pl-[26px] mb-3">Edit for artists · Real cash</p>
              <div className="flex items-center justify-center gap-2 py-2 bg-white/[0.04] border border-white/[0.06] group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
              >
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-[0.15em] group-hover:text-emerald-300 transition-colors" style={{ fontFamily: 'Teko, sans-serif' }}>
                  Browse Missions
                </span>
                <ArrowRight className="w-3 h-3 text-white/40 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </button>

          {/* ──── 03 · COMPETE ──── */}
          <button
            onClick={() => { handleClose(); navigate("/events"); }}
            className="group relative w-full text-left overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/15 via-[#111] to-[#111] group-hover:from-amber-600/25 transition-all duration-300" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/25 font-bold tracking-[0.2em]" style={{ fontFamily: 'Teko, sans-serif' }}>03</span>
                <span className="text-[9px] font-black tracking-wider text-amber-400 bg-amber-500/15 px-2 py-0.5" style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}>
                  +100 IDX
                </span>
              </div>
              <div className="flex items-center gap-2.5 mb-1">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <h3 className="text-[17px] font-black text-white tracking-wide leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                  COMPETE FOR INDEX
                </h3>
              </div>
              <p className="text-[10px] text-white/30 pl-[26px] mb-3">Events · Rankings · Prizes</p>
              <div className="flex items-center justify-center gap-2 py-2 bg-white/[0.04] border border-white/[0.06] group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
              >
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-[0.15em] group-hover:text-amber-300 transition-colors" style={{ fontFamily: 'Teko, sans-serif' }}>
                  View Events
                </span>
                <ArrowRight className="w-3 h-3 text-white/40 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </button>

          <div className="pt-2 text-center">
            <button onClick={handleClose} className="text-[10px] text-white/20 hover:text-white/40 transition-colors uppercase tracking-wider">
              Skip
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
