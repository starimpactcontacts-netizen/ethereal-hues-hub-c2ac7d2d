import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Globe, Lock, Loader2, X } from "lucide-react";

interface CustomLobbyTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (isPrivate: boolean, durationMinutes: number) => Promise<void> | void;
}

const DURATION_OPTIONS = [
  { label: "15M", minutes: 15 },
  { label: "30M", minutes: 30 },
  { label: "1H",  minutes: 60 },
  { label: "3H",  minutes: 180 },
  { label: "24H", minutes: 1440 },
];

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/25">{label}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

export default function CustomLobbyTypeModal({ open, onOpenChange, onSelect }: CustomLobbyTypeModalProps) {
  const [busy, setBusy] = useState<"public" | "private" | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  const handle = async (isPrivate: boolean) => {
    setBusy(isPrivate ? "private" : "public");
    try {
      await onSelect(isPrivate, durationMinutes);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v); }}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden border-0 rounded-none shadow-2xl"
        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/[0.07]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-0.5">Edit Battle</p>
            <h2
              className="text-[38px] leading-none font-black uppercase text-white"
              style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}
            >
              Create Lobby
            </h2>
          </div>
          <button
            onClick={() => !busy && onOpenChange(false)}
            className="mt-1 p-1.5 text-white/30 hover:text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-5 space-y-5">
          {/* Submission Window */}
          <div>
            <SectionLabel label="Submission Window" />
            <div className="grid grid-cols-5 gap-1.5">
              {DURATION_OPTIONS.map((opt) => {
                const active = durationMinutes === opt.minutes;
                return (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => setDurationMinutes(opt.minutes)}
                    disabled={!!busy}
                    className="py-2.5 text-[13px] font-black uppercase transition-all active:scale-95 disabled:opacity-40"
                    style={{
                      fontFamily: 'Teko, sans-serif',
                      letterSpacing: '0.06em',
                      background: active ? 'white' : 'transparent',
                      color: active ? '#000' : 'rgba(255,255,255,0.35)',
                      border: active ? '1px solid white' : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lobby Type */}
          <div>
            <SectionLabel label="Lobby Type" />
            <div className="grid grid-cols-2 gap-2">

              {/* PUBLIC */}
              <button
                onClick={() => handle(false)}
                disabled={!!busy}
                className="relative h-[110px] overflow-hidden text-left group disabled:opacity-50"
                style={{ background: '#0e0e0e' }}
              >
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                {/* Light leak */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                {/* Border */}
                <div className="absolute inset-0 border border-white/[0.12] group-active:border-white/25 transition-colors pointer-events-none" />
                {/* Corner notches */}
                <div className="absolute top-0 right-0 pointer-events-none">
                  <div className="w-4 h-px bg-white/25" />
                  <div className="w-px h-4 bg-white/25 ml-auto" />
                </div>
                <div className="absolute bottom-0 left-0 pointer-events-none">
                  <div className="w-4 h-px bg-white/25" />
                  <div className="w-px h-4 bg-white/25" />
                </div>
                {/* Watermark */}
                <div className="absolute -top-1 -right-1 opacity-[0.07] pointer-events-none">
                  <Globe className="w-16 h-16 text-white" strokeWidth={1} />
                </div>
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {busy === "public"
                    ? <Loader2 className="w-4 h-4 text-white/50 animate-spin mb-1" />
                    : null
                  }
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/28 mb-0.5">Open</p>
                  <p className="text-[18px] font-black text-white leading-none" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>PUBLIC</p>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
              </button>

              {/* PRIVATE */}
              <button
                onClick={() => handle(true)}
                disabled={!!busy}
                className="relative h-[110px] overflow-hidden text-left group disabled:opacity-50"
                style={{ background: '#0e0e0e' }}
              >
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 border border-white/[0.12] group-active:border-white/25 transition-colors pointer-events-none" />
                <div className="absolute top-0 right-0 pointer-events-none">
                  <div className="w-4 h-px bg-white/25" />
                  <div className="w-px h-4 bg-white/25 ml-auto" />
                </div>
                <div className="absolute bottom-0 left-0 pointer-events-none">
                  <div className="w-4 h-px bg-white/25" />
                  <div className="w-px h-4 bg-white/25" />
                </div>
                <div className="absolute -top-1 -right-1 opacity-[0.07] pointer-events-none">
                  <Lock className="w-16 h-16 text-white" strokeWidth={1} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {busy === "private"
                    ? <Loader2 className="w-4 h-4 text-white/50 animate-spin mb-1" />
                    : null
                  }
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/28 mb-0.5">Code-only</p>
                  <p className="text-[18px] font-black text-white leading-none" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>PRIVATE</p>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
              </button>

            </div>
            <p className="text-[10px] text-white/20 mt-2.5 leading-relaxed">
              Public drops into the Arena rail. Private gives you a code to share directly.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
