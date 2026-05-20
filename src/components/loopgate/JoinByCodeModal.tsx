import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Key, Loader2, Swords, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JoinByCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Restrict lookup to one type, or default to both. */
  scope?: "battle" | "competition" | "both";
}

/**
 * Looks up a private lobby (quick_fight or competition) by 4-char join code
 * and routes the user into it. The actual `is_private` join validation
 * happens server-side when the user clicks Join / submits.
 */
export default function JoinByCodeModal({ open, onOpenChange, scope = "both" }: JoinByCodeModalProps) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setCode(""); setBusy(false); };

  const handleSubmit = async () => {
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 3) {
      toast.error("Enter the room code");
      return;
    }
    setBusy(true);
    try {
      // 1. Try Edit Battle (quick_fights)
      if (scope === "battle" || scope === "both") {
        const { data: fight } = await supabase
          .from("quick_fights")
          .select("id, status")
          .ilike("join_code", normalized)
          .eq("is_private", true)
          .in("status", ["waiting", "active"])
          .maybeSingle();
        if (fight?.id) {
          onOpenChange(false);
          reset();
          navigate(`/fight/${fight.id}?code=${normalized}`);
          return;
        }
      }

      // 2. Try Competition
      if (scope === "competition" || scope === "both") {
        const { data: comp } = await supabase
          .from("competitions")
          .select("id, slug, status")
          .ilike("join_code", normalized)
          .eq("is_private", true)
          .in("status", ["lobby", "live"])
          .maybeSingle();
        if (comp?.id) {
          onOpenChange(false);
          reset();
          navigate(`/competition/${comp.slug || comp.id}?code=${normalized}`);
          return;
        }
      }

      toast.error("No room found with that code");
    } catch (e: any) {
      toast.error(e?.message || "Failed to look up room");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-sm bg-surface-1 border-border p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="flex items-center gap-2 text-[24px] leading-[0.9] font-black uppercase text-foreground" style={{ fontFamily: "Teko, sans-serif" }}>
            <Key className="w-4 h-4 text-amber-400" />
            Join With Code
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-1 text-[11px] text-muted-foreground leading-snug">
          Got a private room code from a friend? Drop it here to jump into their
          {scope === "battle" ? " edit battle." : scope === "competition" ? " competition." : " edit battle or competition."}
        </div>

        <div className="px-5 pt-4 pb-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="ABCD"
            autoFocus
            disabled={busy}
            className="w-full text-center text-[34px] font-black tracking-[0.45em] uppercase bg-background/80 border border-border rounded-xl py-4 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 disabled:opacity-60"
            style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.4em" }}
          />
        </div>

        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || code.trim().length < 3}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-black uppercase active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, hsl(43, 96%, 55%), hsl(38, 92%, 45%))",
              fontFamily: "Teko, sans-serif",
              letterSpacing: "0.08em",
              fontSize: 16,
            }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : scope === "competition" ? <Trophy className="w-4 h-4" strokeWidth={3} /> : <Swords className="w-4 h-4" strokeWidth={3} />}
            {busy ? "Looking up..." : "Enter Room"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}