import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe, Lock, Info, Loader2, Clock } from "lucide-react";

interface CustomLobbyTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (isPrivate: boolean, durationMinutes: number) => Promise<void> | void;
}

const DURATION_OPTIONS: { label: string; minutes: number }[] = [
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "3h", minutes: 180 },
  { label: "24h", minutes: 1440 },
];

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
      <DialogContent className="max-w-sm bg-surface-1 border-border p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-[26px] leading-[0.9] font-black uppercase text-foreground" style={{ fontFamily: "Teko, sans-serif" }}>
            Create Custom Lobby
          </DialogTitle>
        </DialogHeader>

        <div className="mx-5 mb-3 flex items-start gap-2 rounded-xl border border-border/60 bg-background/60 p-3">
          <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] leading-[1.45] text-muted-foreground">
            Custom lobbies let you host an edit battle on your own terms — premade scenepack or free-choice edits. Pick public to drop into the carousel for anyone to accept, or private to lock it behind a code only your friends can use.
          </p>
        </div>

        <div className="mx-5 mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground" style={{ fontFamily: "Teko, sans-serif" }}>
              Submission window
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {DURATION_OPTIONS.map((opt) => {
              const active = durationMinutes === opt.minutes;
              return (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => setDurationMinutes(opt.minutes)}
                  disabled={!!busy}
                  className={`py-2 rounded-lg text-[12px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 ${
                    active
                      ? "bg-foreground text-background border border-foreground"
                      : "bg-background/60 text-muted-foreground border border-border hover:text-foreground"
                  } disabled:opacity-60`}
                  style={{ fontFamily: "Teko, sans-serif" }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 pb-5 space-y-2.5">
          <button
            onClick={() => handle(false)}
            disabled={!!busy}
            className="w-full rounded-xl border border-border bg-background/70 hover:bg-background p-4 flex items-center gap-3 active:scale-[0.98] transition-all text-left disabled:opacity-60"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 grid place-items-center shrink-0">
              {busy === "public" ? <Loader2 className="w-4 h-4 text-emerald-300 animate-spin" /> : <Globe className="w-4 h-4 text-emerald-300" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-black uppercase tracking-[0.14em] text-foreground" style={{ fontFamily: "Teko, sans-serif" }}>
                Custom Lobby
              </div>
              <div className="text-[10.5px] text-muted-foreground mt-0.5">Open to everyone — shows in the Arena rail</div>
            </div>
          </button>

          <button
            onClick={() => handle(true)}
            disabled={!!busy}
            className="w-full rounded-xl border border-border bg-background/70 hover:bg-background p-4 flex items-center gap-3 active:scale-[0.98] transition-all text-left disabled:opacity-60"
          >
            <div className="w-10 h-10 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/30 grid place-items-center shrink-0">
              {busy === "private" ? <Loader2 className="w-4 h-4 text-fuchsia-300 animate-spin" /> : <Lock className="w-4 h-4 text-fuchsia-300" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-black uppercase tracking-[0.14em] text-foreground" style={{ fontFamily: "Teko, sans-serif" }}>
                Private Custom Lobby
              </div>
              <div className="text-[10.5px] text-muted-foreground mt-0.5">Code-only — share it manually with the editor you wanna fight</div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}