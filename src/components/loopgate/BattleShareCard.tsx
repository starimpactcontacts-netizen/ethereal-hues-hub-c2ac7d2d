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
    // Wait for fonts so Teko renders in the export
    if ((document as any).fonts?.ready) {
      try { await (document as any).fonts.ready; } catch {}
    }
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#000000",
      scale: 3,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: cardRef.current.offsetWidth,
      height: cardRef.current.offsetHeight,
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
    const ringBg =
      side === "gold"
        ? "linear-gradient(135deg, #fcd34d 0%, #facc15 50%, #d97706 100%)"
        : side === "red"
        ? "linear-gradient(135deg, #ef4444 0%, #f43f5e 50%, #b91c1c 100%)"
        : "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 50%, #1d4ed8 100%)";
    return (
      <div
        style={{
          padding: "3px",
          borderRadius: "9999px",
          background: ringBg,
          display: "inline-block",
        }}
      >
        <div
          style={{
            width: "92px",
            height: "92px",
            borderRadius: "9999px",
            overflow: "hidden",
            background: "#18181b",
            border: "2px solid #000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {url ? (
            <img
              src={url}
              alt={name || ""}
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <span style={{ fontFamily: "Teko, sans-serif", fontSize: "32px", fontWeight: 900, color: "rgba(255,255,255,0.6)" }}>
              {name?.charAt(0).toUpperCase() || "?"}
            </span>
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

        {/* === EXPORTABLE CARD (1:1 SQUARE) — inline styles for html2canvas fidelity === */}
        <div
          ref={cardRef}
          style={{
            position: "relative",
            width: "360px",
            height: "360px",
            margin: "0 auto",
            overflow: "hidden",
            borderRadius: "16px",
            background:
              "linear-gradient(180deg, #4c0519 0%, #000000 50%, #172554 100%)",
            fontFamily: "Teko, system-ui, sans-serif",
          }}
        >
          {/* Soft red/blue glows */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 18% 18%, rgba(239,68,68,0.55), transparent 45%), radial-gradient(circle at 82% 82%, rgba(59,130,246,0.45), transparent 45%)",
            }}
          />
          {/* Diagonal lines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.07,
              backgroundImage:
                "repeating-linear-gradient(45deg, #ffffff 0 1px, transparent 1px 14px)",
            }}
          />

          {/* Inner content */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              height: "100%",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            }}
          >
            {/* Header — bigger logo */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <img
                src={loopgateLogo}
                alt="LOOPGATE"
                crossOrigin="anonymous"
                style={{ height: "22px", width: "auto", display: "block", opacity: 0.95 }}
              />
              {battle.is_rapid && (
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "#fcd34d",
                    textTransform: "uppercase",
                    letterSpacing: "0.3em",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    background: "rgba(245,158,11,0.15)",
                    border: "1px solid rgba(245,158,11,0.3)",
                  }}
                >
                  ⚡ Rapid
                </span>
              )}
            </div>

            {/* Headline pill */}
            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "3px 10px",
                  borderRadius: "9999px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {isLive && (
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "9999px",
                      background: "#ef4444",
                      boxShadow: "0 0 8px rgba(239,68,68,0.8)",
                      display: "inline-block",
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.35em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.75)",
                    fontWeight: 700,
                  }}
                >
                  {headline}
                </span>
              </div>
              <h2
                style={{
                  fontSize: "28px",
                  color: "#ffffff",
                  marginTop: "6px",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                  margin: "6px 0 0 0",
                }}
              >
                1V1 EDIT BATTLE
              </h2>
            </div>

            {/* VS row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Avatar
                  url={battle.challenger_avatar_url}
                  name={battle.challenger_username}
                  side={challengerWon ? "gold" : "red"}
                />
                <span
                  style={{
                    fontSize: "16px",
                    color: "#ffffff",
                    marginTop: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: 700,
                    maxWidth: "108px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {battle.challenger_username}
                </span>
                {battle.challenger_score != null && (
                  <span style={{ fontSize: "22px", color: "#fcd34d", fontWeight: 900, lineHeight: 1 }}>
                    {battle.challenger_score}
                  </span>
                )}
              </div>

              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "9999px",
                  background: "linear-gradient(135deg, #ef4444 0%, #f43f5e 50%, #b91c1c 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 26px rgba(239,68,68,0.55)",
                  flexShrink: 0,
                }}
              >
                <Swords style={{ width: "18px", height: "18px", color: "#fff" }} />
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                {battle.opponent_id ? (
                  <Avatar
                    url={battle.opponent_avatar_url}
                    name={battle.opponent_username}
                    side={opponentWon ? "gold" : "blue"}
                  />
                ) : (
                  <div
                    style={{
                      width: "98px",
                      height: "98px",
                      borderRadius: "9999px",
                      border: "2px dashed rgba(255,255,255,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "26px",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    ?
                  </div>
                )}
                <span
                  style={{
                    fontSize: "16px",
                    color: "#ffffff",
                    marginTop: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: 700,
                    maxWidth: "108px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {battle.opponent_username || "OPEN"}
                </span>
                {battle.opponent_score != null && (
                  <span style={{ fontSize: "22px", color: "#fcd34d", fontWeight: 900, lineHeight: 1 }}>
                    {battle.opponent_score}
                  </span>
                )}
              </div>
            </div>

            {/* CTA strip — pinned bottom */}
            <div style={{ marginTop: "auto" }}>
              <p
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.65)",
                  margin: "0 0 8px 0",
                  padding: "0 8px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {subline}
              </p>
              <div
                style={{
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "8px 12px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3em",
                    color: "rgba(255,255,255,0.55)",
                    margin: 0,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  Watch &amp; Vote
                </p>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "0.08em",
                    margin: "2px 0 0 0",
                  }}
                >
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