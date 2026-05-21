import { useEffect, useRef, useState } from "react";
import { Download, Share2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  posterUrl: string;
  songTitle?: string;
  themeLabel?: string;
  endDate?: string | null;
  shareUrl: string;
  cashPrize?: string;
  ringsPrize?: string;
}

function useCountdown(endDate?: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!endDate) return null;
  const diff = Math.max(0, new Date(endDate).getTime() - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    expired: diff <= 0,
  };
}

export default function EventSharePoster({
  isOpen,
  onClose,
  title,
  posterUrl,
  songTitle,
  themeLabel,
  endDate,
  shareUrl,
  cashPrize = "$150",
  ringsPrize = "1M",
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const t = useCountdown(endDate);

  const captureBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try { await (document as any).fonts?.ready; } catch {}
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
      a.download = `loopgate-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Poster downloaded");
    } catch {
      toast.error("Failed to generate poster");
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const blob = await captureBlob();
      if (!blob) throw new Error("capture failed");
      const file = new File([blob], "loopgate-competition.png", { type: "image/png" });
      const text = `${cashPrize} CASH + ${ringsPrize} RINGS — ${title}\n${shareUrl}`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
      } else if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${text}`);
        toast.success("Link copied");
      }
    } catch {
      /* user cancelled */
    } finally {
      setBusy(false);
    }
  };

  const display = { fontFamily: "Teko, Inter, system-ui, sans-serif" } as const;
  const body = { fontFamily: "Inter, system-ui, sans-serif" } as const;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[420px] w-[calc(100vw-2rem)] p-3 bg-zinc-950 border border-white/10 rounded-2xl overflow-y-auto max-h-[92vh]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-50 p-1.5 rounded-full bg-black/70 ring-1 ring-white/10 text-white/70 hover:text-white"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* === 1:1 EXPORTABLE POSTER === */}
        <div
          ref={cardRef}
          style={{
            position: "relative",
            width: "380px",
            height: "380px",
            margin: "0 auto",
            overflow: "hidden",
            background: "#000",
            ...display,
          }}
        >
          <img
            src={posterUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.1) contrast(1.06)" }}
          />
          {/* cinematic gradient */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 28%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.96) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)" }} />
          {/* amber rim flare */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(245,166,35,0.22)", filter: "blur(60px)" }} />

          {/* TOP ROW: LIVE + loopgate */}
          <div style={{ position: "absolute", top: 14, left: 14, right: 14, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 5 }}>
            <span style={{ ...display, fontSize: 11, fontWeight: 900, letterSpacing: "0.32em", color: "#fff", background: "#e11d2a", padding: "4px 8px", borderRadius: 3, boxShadow: "0 0 14px rgba(225,29,42,0.55)" }}>
              ● LIVE
            </span>
            <span style={{ ...display, fontSize: 17, fontWeight: 900, letterSpacing: "0.18em", color: "#fff" }}>
              LOOPGATE.IO <span style={{ color: "#f5a623" }}>/</span>
            </span>
          </div>

          {/* TITLE BLOCK */}
          <div style={{ position: "absolute", left: 14, right: 14, bottom: 18, zIndex: 5, display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <p style={{ ...display, fontSize: 9, fontWeight: 900, letterSpacing: "0.42em", color: "rgba(255,255,255,0.55)", margin: 0 }}>EDIT COMPETITION</p>
              <h1
                style={{
                  ...display,
                  fontSize: 26,
                  fontWeight: 900,
                  lineHeight: 0.88,
                  color: "#fff",
                  textTransform: "uppercase",
                  margin: "4px 0 0",
                  transform: "skewX(-6deg)",
                  textShadow: "0 4px 18px rgba(0,0,0,0.7)",
                }}
              >
                {title}
              </h1>
            </div>

            {/* PRIZE SLABS */}
            <div style={{ display: "flex", height: 52, marginTop: 2 }}>
              <div
                style={{
                  flex: 1,
                  background: "#fff",
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  clipPath: "polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)",
                  paddingRight: 8,
                }}
              >
                <span style={{ ...display, fontSize: 16, fontWeight: 900, color: "#10b981", lineHeight: 1 }}>$</span>
                <span style={{ ...display, fontSize: 36, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}>{cashPrize.replace("$", "")}</span>
                <span style={{ ...display, fontSize: 8, fontWeight: 900, letterSpacing: "0.18em", color: "rgba(0,0,0,0.55)", marginLeft: 6, alignSelf: "center" }}>CASH</span>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "#f5a623",
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: -8,
                  clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%)",
                  paddingLeft: 12,
                }}
              >
                <span style={{ ...display, fontSize: 36, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}>{ringsPrize}</span>
                <span style={{ ...display, fontSize: 8, fontWeight: 900, letterSpacing: "0.18em", color: "rgba(0,0,0,0.65)", marginLeft: 6, alignSelf: "center" }}>RINGS<br/>TOP 50</span>
              </div>
            </div>

            {/* SONG + COUNTDOWN */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {(songTitle || themeLabel) && (
                  <p style={{ ...body, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {songTitle ? `♪ ${songTitle}` : ""}{songTitle && themeLabel ? " · " : ""}{themeLabel || ""}
                  </p>
                )}
                {t && !t.expired && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                    <span style={{ ...display, fontSize: 9, fontWeight: 900, letterSpacing: "0.32em", color: "rgba(255,255,255,0.55)" }}>ENDS IN</span>
                    <span style={{ ...display, fontSize: 22, fontWeight: 900, color: "#f5a623", lineHeight: 1 }}>
                      {t.d}<span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginLeft: 2, marginRight: 6 }}>D</span>
                      {String(t.h).padStart(2, "0")}<span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginLeft: 2, marginRight: 6 }}>H</span>
                      {String(t.m).padStart(2, "0")}<span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginLeft: 2 }}>M</span>
                    </span>
                  </div>
                )}
                {t?.expired && (
                  <p style={{ ...display, fontSize: 14, fontWeight: 900, letterSpacing: "0.2em", color: "#e11d2a", margin: "4px 0 0" }}>ENDED</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDownload}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-white/[0.06] ring-1 ring-white/10 text-white text-[12px] font-black uppercase tracking-[0.18em] active:scale-[0.99] transition disabled:opacity-50"
            style={display}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Save
          </button>
          <button
            onClick={handleShare}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-emerald-500 text-black text-[12px] font-black uppercase tracking-[0.18em] active:scale-[0.99] transition disabled:opacity-50"
            style={display}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/40" style={display}>
          1:1 · Instagram · X · Discord
        </p>
      </DialogContent>
    </Dialog>
  );
}