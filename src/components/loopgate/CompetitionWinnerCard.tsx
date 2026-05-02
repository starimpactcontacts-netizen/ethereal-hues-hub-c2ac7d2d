import { useRef, useState } from "react";
import { Download, Share2, X, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import loopgateLogo from "@/assets/loopgate-logo.png";
import type { CompetitionSubmission } from "@/hooks/useCompetitions";
import { getThumbnail } from "@/lib/thumbnail";

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
  const totalVotes = winnerVotes + runnerVotes;
  const winPct = totalVotes > 0 ? Math.round((winnerVotes / totalVotes) * 100) : 100;

  // Resolve background poster image (TikTok/IG/YT thumbnail or direct file)
  const isDirectVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(winner.submission_url);
  const isImageFile = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(winner.submission_url);
  const posterUrl = isImageFile
    ? winner.submission_url
    : isDirectVideo
    ? null
    : getThumbnail(winner.submission_url, winner.platform || "", null, (winner as any).thumbnail_url).url;

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

  const AvatarChip = ({ url, name }: { url?: string | null; name?: string | null }) => (
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "9999px",
        overflow: "hidden",
        background: "#0a0a0a",
        border: "1.5px solid rgba(255,255,255,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {url ? (
        <img src={url} alt={name || ""} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <span style={{ fontFamily: "Teko, sans-serif", fontSize: "22px", fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>
          {name?.charAt(0).toUpperCase() || "?"}
        </span>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[420px] w-[calc(100vw-2rem)] p-3 bg-zinc-950 border border-white/10 rounded-2xl overflow-y-auto max-h-[90vh]">
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
            height: "640px",
            margin: "0 auto",
            overflow: "hidden",
            borderRadius: "20px",
            background: "#000000",
            fontFamily: "Teko, system-ui, sans-serif",
            boxShadow: "0 0 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Full-bleed poster image */}
          {posterUrl && (
            <img
              src={posterUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "saturate(1.1) contrast(1.05)",
              }}
            />
          )}
          {/* Cinematic gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.95) 100%)",
            }}
          />
          {/* Subtle vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)",
            }}
          />

          {/* Content */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              height: "100%",
              padding: "22px 22px 24px",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            }}
          >
            {/* Top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <img src={loopgateLogo} alt="LOOPGATE" crossOrigin="anonymous" style={{ height: "20px", width: "auto", display: "block", opacity: 0.9 }} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.95)",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "9999px", background: "#16a34a" }} />
                <span style={{ fontSize: "9px", fontWeight: 800, color: "#000", letterSpacing: "0.22em", fontFamily: "system-ui, sans-serif" }}>
                  WINNER
                </span>
              </div>
            </div>

            {/* Spacer pushes content to bottom */}
            <div style={{ flex: 1 }} />

            {/* Eyebrow */}
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.6)",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Edit Battle · Champion
            </span>

            {/* Username — hero */}
            <h1
              style={{
                fontSize: "56px",
                lineHeight: 0.9,
                letterSpacing: "-0.01em",
                color: "#ffffff",
                margin: "6px 0 0 0",
                fontWeight: 700,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textShadow: "0 2px 24px rgba(0,0,0,0.7)",
              }}
            >
              @{winner.username}
            </h1>

            {/* Competition name */}
            <p
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.65)",
                margin: "8px 0 0 0",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {competitionName}
            </p>

            {/* Stats row */}
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              <div style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.55)", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif", fontWeight: 700 }}>Votes</div>
                <div style={{ fontSize: "30px", color: "#ffffff", fontWeight: 700, lineHeight: 1, marginTop: "2px" }}>{winnerVotes}</div>
              </div>
              <div style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.55)", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif", fontWeight: 700 }}>Win Rate</div>
                <div style={{ fontSize: "30px", color: "#ffffff", fontWeight: 700, lineHeight: 1, marginTop: "2px" }}>{winPct}%</div>
              </div>
              <div style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.55)", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif", fontWeight: 700 }}>Field</div>
                <div style={{ fontSize: "30px", color: "#ffffff", fontWeight: 700, lineHeight: 1, marginTop: "2px" }}>{totalEditors}</div>
              </div>
            </div>

            {/* Footer row: avatar + URL */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
              <AvatarChip url={winner.avatar_url} name={winner.username} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {runnerUp ? (
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif", fontWeight: 600 }}>
                    Defeated @{runnerUp.username} · {runnerVotes} vote{runnerVotes !== 1 ? "s" : ""}
                  </div>
                ) : (
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif", fontWeight: 600 }}>
                    Community Vote · Live Showcase
                  </div>
                )}
                <div style={{ fontSize: "16px", color: "#ffffff", fontWeight: 700, letterSpacing: "0.18em", fontFamily: "Teko, sans-serif", marginTop: "2px" }}>
                  LOOPGATE.IO
                </div>
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