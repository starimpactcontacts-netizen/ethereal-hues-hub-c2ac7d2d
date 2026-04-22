import { useRef, useState } from "react";
import { Download, Share2, X, Swords, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import loopgateLogo from "@/assets/loopgate-logo.png";

interface BattleShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  battle: {
    id: string;
    challenger_username: string;
    challenger_avatar_url?: string | null;
    opponent_username?: string | null;
    opponent_avatar_url?: string | null;
    status: string;
    duration_hours?: number | null;
    winner_id?: string | null;
    challenger_id: string;
    opponent_id?: string | null;
    challenger_score?: number | null;
    opponent_score?: number | null;
    is_rapid?: boolean | null;
  };
}

export default function BattleShareCard({ isOpen, onClose, battle }: BattleShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const isLive = battle.status === "active";
  const isCompleted = battle.status === "completed";
  const isPending = battle.status === "pending";

  const challengerWon = battle.winner_id === battle.challenger_id;
  const opponentWon = battle.winner_id === battle.opponent_id;

  const headline = isCompleted
    ? "BATTLE RESULT"
    : isLive
    ? "LIVE BATTLE"
    : isPending && !battle.opponent_id
    ? "OPEN CHALLENGE"
    : "1V1 EDIT BATTLE";

  const subline = isCompleted
    ? `${challengerWon ? battle.challenger_username : battle.opponent_username} took the W`
    : isLive
    ? `${battle.duration_hours ?? 48}H to drop the edit`
    : isPending && !battle.opponent_id
    ? `Who's accepting?`
    : `${battle.challenger_username} vs ${battle.opponent_username || "???"}`;

  const battleUrl = `${window.location.origin}/battle/${battle.id}`;

  const captureBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#000",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const blob = await captureBlob();
      if (!blob) throw new Error("capture failed");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loopgate-battle-${battle.challenger_username}-vs-${battle.opponent_username || "open"}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Card downloaded!");
    } catch (e) {
      toast.error("Failed to generate card");
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const blob = await captureBlob();
      if (!blob) throw new Error("capture failed");
      const file = new File([blob], "loopgate-battle.png", { type: "image/png" });
      const text = `${battle.challenger_username} vs ${battle.opponent_username || "???"} on Loopgate ⚔️\n${battleUrl}`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Loopgate Battle", text });
      } else if (navigator.share) {
        await navigator.share({ title: "Loopgate Battle", text, url: battleUrl });
      } else {
        await navigator.clipboard.writeText(`${text}`);
        toast.success("Link copied!");
      }
    } catch {
      // user cancelled
    } finally {
      setBusy(false);
    }
  };

  const Avatar = ({ url, name, side }: { url?: string | null; name?: string | null; side: "red" | "blue" | "gold" }) => {
    const ringColor =
      side === "gold"
        ? "from-amber-300 via-yellow-400 to-amber-600"
        : side === "red"
        ? "from-red-500 via-rose-500 to-red-700"
        : "from-blue-500 via-sky-500 to-blue-700";
    return (
      <div className={`relative p-[3px] rounded-full bg-gradient-to-br ${ringColor} shadow-2xl`}>
        <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-zinc-900 border-2 border-black">
          {url ? (
            <img src={url} alt={name || ""} crossOrigin="anonymous" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white/60" style={{ fontFamily: "Teko, sans-serif" }}>
              {name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[400px] w-[calc(100vw-2rem)] p-3 bg-zinc-950 border border-white/10 rounded-2xl overflow-y-auto max-h-[90vh]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-50 p-1.5 rounded-full bg-black/70 ring-1 ring-white/10 text-white/70 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* === EXPORTABLE CARD (1:1 SQUARE) === */}
        <div
          ref={cardRef}
          className="relative overflow-hidden bg-black mx-auto rounded-xl"
          style={{ width: "340px", height: "340px" }}
        >
          {/* layered atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/70 via-black to-blue-950/70" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(239,68,68,0.4), transparent 45%),
                              radial-gradient(circle at 80% 80%, rgba(59,130,246,0.4), transparent 45%)`
          }} />
          {/* diagonal lines */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: "repeating-linear-gradient(45deg, white 0 1px, transparent 1px 14px)"
          }} />
          {/* Center glow */}
          {isCompleted && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-amber-500/10 blur-3xl" />
          )}

          <div className="relative z-10 h-full flex flex-col p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <img src={loopgateLogo} alt="LOOPGATE" className="h-4 opacity-80" crossOrigin="anonymous" />
              {battle.is_rapid && (
                <span className="text-[8px] font-bold text-amber-300 uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-amber-500/15 ring-1 ring-amber-500/30">
                  ⚡ Rapid
                </span>
              )}
            </div>

            {/* Headline */}
            <div className="text-center mt-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 ring-1 ring-white/10">
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                <span className="text-[9px] tracking-[0.35em] uppercase text-white/70 font-bold" style={{ fontFamily: "Teko, sans-serif" }}>
                  {headline}
                </span>
              </div>
              <h2 className="font-display text-2xl text-white mt-1.5 leading-none" style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.06em" }}>
                1V1 EDIT BATTLE
              </h2>
            </div>

            {/* VS row */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex flex-col items-center flex-1">
                <Avatar
                  url={battle.challenger_avatar_url}
                  name={battle.challenger_username}
                  side={challengerWon ? "gold" : "red"}
                />
                <span className="font-display text-sm text-white mt-2 uppercase tracking-wide truncate max-w-[100px]" style={{ fontFamily: "Teko, sans-serif" }}>
                  {battle.challenger_username}
                </span>
                {battle.challenger_score != null && (
                  <span className="text-xl font-black text-amber-300 tabular-nums leading-none" style={{ fontFamily: "Teko, sans-serif" }}>
                    {battle.challenger_score}
                  </span>
                )}
              </div>

              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-red-700 flex items-center justify-center shadow-[0_0_24px_rgba(239,68,68,0.5)]">
                  <Swords className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex flex-col items-center flex-1">
                {battle.opponent_id ? (
                  <Avatar
                    url={battle.opponent_avatar_url}
                    name={battle.opponent_username}
                    side={opponentWon ? "gold" : "blue"}
                  />
                ) : (
                  <div className="w-[78px] h-[78px] rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-2xl text-white/30" style={{ fontFamily: "Teko, sans-serif" }}>
                    ?
                  </div>
                )}
                <span className="font-display text-sm text-white mt-2 uppercase tracking-wide truncate max-w-[100px]" style={{ fontFamily: "Teko, sans-serif" }}>
                  {battle.opponent_username || "OPEN"}
                </span>
                {battle.opponent_score != null && (
                  <span className="text-xl font-black text-amber-300 tabular-nums leading-none" style={{ fontFamily: "Teko, sans-serif" }}>
                    {battle.opponent_score}
                  </span>
                )}
              </div>
            </div>

            {/* CTA strip */}
            <div className="mt-auto">
              <p className="text-center text-[10px] text-white/60 mb-2 px-2 truncate">{subline}</p>
              <div className="rounded-lg bg-white/5 ring-1 ring-white/10 backdrop-blur-md px-3 py-1.5 text-center">
                <p className="text-[8px] uppercase tracking-[0.3em] text-white/50">Watch & Vote</p>
                <p className="text-xs font-bold text-white" style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.08em" }}>
                  LOOPGATE.IO
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button
            onClick={handleDownload}
            disabled={busy}
            className="flex-1 bg-white text-black hover:bg-white/90 font-bold uppercase tracking-wider text-[11px] h-10"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
            Download
          </Button>
          <Button
            onClick={handleShare}
            disabled={busy}
            className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white hover:opacity-90 font-bold uppercase tracking-wider text-[11px] h-10"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            Share
          </Button>
        </div>
        <p className="text-center text-[10px] text-white/40 mt-2">
          Post on TikTok / IG to pull viewers in 🔥
        </p>
      </DialogContent>
    </Dialog>
  );
}