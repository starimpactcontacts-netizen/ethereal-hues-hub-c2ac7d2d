import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Swords, ArrowRight } from "lucide-react";
import loopgateBrand from "@/assets/loopgate-brand.png";

const GUIDE_VERSION = "v6.0";
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
      <DialogContent className="bg-[#0c0c0c] border border-white/10 w-[92vw] max-w-[360px] p-0 gap-0 rounded-2xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="text-center pt-6 pb-2">
            <img src={loopgateBrand} alt="LOOPGATE" className="h-5 mx-auto opacity-70" />
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 pt-2 space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-[28px] font-black text-white leading-none tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
              READY TO BATTLE?
            </h2>
            <p className="text-[12px] text-white/40">Jump into a live edit battle now.</p>
          </div>

          {/* Primary CTA — Enter Battle */}
          <button
            onClick={() => go("/cash-battle")}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition-all"
          >
            <Swords className="w-5 h-5 text-black" />
            <span className="text-[18px] font-black text-black uppercase tracking-[0.18em]" style={{ fontFamily: 'Teko, sans-serif' }}>
              Enter Battle
            </span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>

          {/* Secondary — Browse Arena */}
          <button
            onClick={() => go("/arena")}
            className="w-full py-3 text-[12px] text-white/50 hover:text-white/80 transition-colors uppercase tracking-[0.2em] font-bold"
            style={{ fontFamily: 'Teko, sans-serif' }}
          >
            Browse Arena
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
