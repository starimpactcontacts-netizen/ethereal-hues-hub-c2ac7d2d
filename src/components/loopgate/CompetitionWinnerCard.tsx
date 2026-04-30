import { useRef, useState } from "react";
import { Download, Share2, X, Crown, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import loopgateLogo from "@/assets/loopgate-logo.png";
import type { CompetitionSubmission } from "@/hooks/useCompetitions";

interface CompetitionWinnerCardProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  competitionName: string;
  winner: CompetitionSubmission;
  runnerUp?: CompetitionSubmission | null;
  totalEditors: number;
}

export default function CompetitionWinnerCard({
  isOpen,
  onClose,
  competitionId,
  competitionName,
  winner,
  runnerUp,
  totalEditors,
}: CompetitionWinnerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const battleUrl = `${window.location.origin}/competition/${competitionId}`;
  const winnerVotes = winner.vote_count ?? 0;
  const runnerVotes = runnerUp?.vote_count ?? 0;

  const captureBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
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
      a.download = `loopgate-winner-${winner.username}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Winner card downloaded!");
    } catch {
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
      const file = new File([blob], "loopgate-winner.png", { type: "image/png" });
      const text = `@${winner.username} just won "${competitionName}" on Loopgate 🏆\n${battleUrl}`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Loopgate Winner", text });
      } else if (navigator.share) {
        await navigator.share({ title: "Loopgate Winner", text, url: battleUrl });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Link copied!");
      }
    } catch {
      // user cancelled
    } finally {
      setBusy(false);
    }
  };

  const Avatar = ({ url, name, gold }: { url?: string | null; name?: string | null; gold?: boolean }) => {
    const ringBg = gold
      ? "linear-gradient(135deg, #fcd34d 0%, #facc15 50%, #d97706 100%)"
      : "linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #374151 100%)";
    const size = gold ? 110 : 70;
    return (
      <div style={{ padding: "3px", borderRadius: "9999px", background: ringBg, display: "inline-block" }}>
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
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
            <img src={url} alt={name || ""} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <span style={{ fontFamily: "Teko, sans-serif", fontSize: gold ? "44px" : "28px", fontWeight: 900, color: "rgba(255,255,255,0.6)" }}>
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
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-50 p-1.5 rounded-full bg-black/70 ring-1 ring-white/10 text-white/70 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* === EXPORTABLE CARD === */}
        <div
          ref={cardRef}
          style={{
            position: "relative",
            width: "360px",
            height: "360px",
            margin: "0 auto",
            overflow: "hidden",
            borderRadius: "16px",
            background: "linear-gradient(180deg, #422006 0%, #000000 55%, #1c1917 100%)",
            fontFamily: "Teko, system-ui, sans-serif",
          }}
        >
          {/* Gold glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 50% 25%, rgba(252,211,77,0.45), transparent 55%), radial-gradient(circle at 50% 100%, rgba(180,83,9,0.35), transparent 60%)",
            }}
          />
          {/* Diagonal lines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.06,
              backgroundImage: "repeating-linear-gradient(45deg, #ffffff 0 1px, transparent 1px 14px)",
            }}
          />

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
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <img src={loopgateLogo} alt="LOOPGATE" crossOrigin="anonymous" style={{ height: "22px", width: "auto", display: "block", opacity: 0.95 }} />
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#fcd34d",
                  textTransform: "uppercase",
                  letterSpacing: "0.3em",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: "rgba(245,158,11,0.18)",
                  border: "1px solid rgba(245,158,11,0.4)",
                }}
              >
                🏆 Winner
              </span>
            </div>

            {/* Headline */}
            <div style={{ textAlign: "center", marginTop: "10px" }}>
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
                <span
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.35em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.75)",
                    fontWeight: 700,
                  }}
                >
                  Edit Battle Result
                </span>
              </div>
              <h2
                style={{
                  fontSize: "24px",
                  color: "#ffffff",
                  marginTop: "6px",
                  lineHeight: 1,
                  letterSpacing: "0.05em",
                  fontWeight: 700,
                  margin: "6px 0 0 0",
                  maxWidth: "320px",
                  marginLeft: "auto",
                  marginRight: "auto",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {competitionName.toUpperCase()}
              </h2>
            </div>

            {/* Winner */}
            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Avatar url={winner.avatar_url} name={winner.username} gold />
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "8px" }}>
                <Crown style={{ width: "14px", height: "14px", color: "#fcd34d" }} />
                <span
                  style={{
                    fontSize: "22px",
                    color: "#ffffff",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: 700,
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {winner.username}
                </span>
              </div>
              <span
                style={{
                  fontSize: "26px",
                  color: "#fcd34d",
                  fontWeight: 900,
                  lineHeight: 1,
                  marginTop: "4px",
                  fontFamily: "Teko, sans-serif",
                }}
              >
                {winnerVotes} VOTE{winnerVotes !== 1 ? "S" : ""}
              </span>
              {runnerUp && (
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    marginTop: "6px",
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  beat @{runnerUp.username} ({runnerVotes})
                </span>
              )}
            </div>

            {/* CTA strip */}
            <div style={{ marginTop: "auto" }}>
              <p
                style={{
                  textAlign: "center",
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.55)",
                  margin: "0 0 8px 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 600,
                }}
              >
                {totalEditors} editors · community vote
              </p>
              <div
                style={{
                  borderRadius: "10px",
                  background: "rgba(252,211,77,0.08)",
                  border: "1px solid rgba(252,211,77,0.25)",
                  padding: "8px 12px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3em",
                    color: "rgba(252,211,77,0.7)",
                    margin: 0,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  Run it back
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
            className="flex-1 bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:opacity-90 font-bold uppercase tracking-wider text-[11px] h-10"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            Share
          </Button>
        </div>
        <p className="text-center text-[10px] text-white/40 mt-2 flex items-center justify-center gap-1">
          <Trophy className="w-3 h-3" /> Post the W on TikTok / IG
        </p>
      </DialogContent>
    </Dialog>
  );
}