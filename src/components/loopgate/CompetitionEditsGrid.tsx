import { useEffect, useRef, useState } from "react";
import { Play, Loader2, Scissors, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CompetitionSubmission } from "@/hooks/useCompetitions";

const teko = { fontFamily: "Teko, sans-serif" };

const CLIP_LEN = 30;

function isVideoUrl(url: string, platform?: string) {
  if (platform === "upload") return true;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

interface Props {
  submissions: CompetitionSubmission[];
  currentUserId?: string | null;
}

export default function CompetitionEditsGrid({ submissions, currentUserId }: Props) {
  const [playing, setPlaying] = useState<CompetitionSubmission | null>(null);
  const [trimming, setTrimming] = useState<CompetitionSubmission | null>(null);

  if (submissions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span
          className="text-[14px] font-extrabold uppercase tracking-[0.1em] text-foreground"
          style={teko}
        >
          Drops ({submissions.length})
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {submissions.map((sub) => (
          <EditTile
            key={sub.id}
            submission={sub}
            isOwner={currentUserId === sub.user_id}
            onPlay={() => setPlaying(sub)}
            onTrim={() => setTrimming(sub)}
          />
        ))}
      </div>

      {/* Fullscreen player */}
      <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent className="max-w-[100vw] w-screen h-[100dvh] p-0 bg-black border-0 rounded-none flex items-center justify-center">
          <DialogTitle className="sr-only">Drop preview</DialogTitle>
          {playing && <FullPlayer submission={playing} onClose={() => setPlaying(null)} />}
        </DialogContent>
      </Dialog>

      {/* Clip trim modal */}
      <Dialog open={!!trimming} onOpenChange={(o) => !o && setTrimming(null)}>
        <DialogContent className="max-w-md bg-[#0b0b0b] border-white/10 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Pick highlight</DialogTitle>
          {trimming && (
            <ClipTrimmer
              submission={trimming}
              onClose={() => setTrimming(null)}
              onSaved={() => setTrimming(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditTile({
  submission,
  isOwner,
  onPlay,
  onTrim,
}: {
  submission: CompetitionSubmission;
  isOwner: boolean;
  onPlay: () => void;
  onTrim: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [thumbReady, setThumbReady] = useState(false);
  const isVid = isVideoUrl(submission.submission_url, submission.platform);
  const start = submission.clip_start || 0;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVid) return;
    v.currentTime = start + 0.1;
  }, [start, isVid]);

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] group">
      <button
        onClick={onPlay}
        className="absolute inset-0 w-full h-full"
        aria-label="Play edit"
      >
        {isVid ? (
          <video
            ref={videoRef}
            src={`${submission.submission_url}#t=${start + 0.1}`}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setThumbReady(true)}
          />
        ) : (
          <img
            src={submission.submission_url}
            alt="Edit"
            className="w-full h-full object-cover"
            loading="lazy"
            onLoad={() => setThumbReady(true)}
          />
        )}

        {!thumbReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-white/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 pointer-events-none" />

        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
          <Avatar className="w-3.5 h-3.5">
            <AvatarImage src={submission.avatar_url || undefined} />
            <AvatarFallback className="text-[7px]">
              {submission.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-[8px] font-bold text-white truncate max-w-[60px]">
            {submission.username}
          </span>
        </div>

        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
          <Play className="w-2.5 h-2.5 text-white fill-white" />
          <span className="text-[8px] font-extrabold text-white tabular-nums" style={teko}>
            {CLIP_LEN}s
          </span>
        </div>
      </button>

      {isOwner && isVid && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTrim();
          }}
          className="absolute top-1.5 right-1.5 z-10 p-1 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 hover:bg-black/90 transition-colors"
          aria-label="Adjust highlight"
        >
          <Scissors className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
}

function FullPlayer({
  submission,
  onClose,
}: {
  submission: CompetitionSubmission;
  onClose: () => void;
}) {
  const isVid = isVideoUrl(submission.submission_url, submission.platform);
  const start = submission.clip_start || 0;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVid) return;
    v.currentTime = start;
    v.play().catch(() => {});
  }, [isVid, start]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80"
      >
        <X className="w-5 h-5 text-white" />
      </button>
      {isVid ? (
        <video
          ref={videoRef}
          src={submission.submission_url}
          className="w-full h-full object-contain"
          controls
          playsInline
          autoPlay
        />
      ) : (
        <img
          src={submission.submission_url}
          alt="Edit"
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}

function ClipTrimmer({
  submission,
  onClose,
  onSaved,
}: {
  submission: CompetitionSubmission;
  onClose: () => void;
  onSaved: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(submission.clip_start || 0);
  const [saving, setSaving] = useState(false);

  const max = Math.max(0, duration - CLIP_LEN);
  const end = Math.min(duration, start + CLIP_LEN);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = start;
  }, [start]);

  const onLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    v.currentTime = start;
  };

  const handlePreview = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = start;
    v.play().catch(() => {});
    const stopAt = setTimeout(() => v.pause(), CLIP_LEN * 1000);
    v.onpause = () => clearTimeout(stopAt);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("competition_submissions")
      .update({ clip_start: Math.round(start * 10) / 10 })
      .eq("id", submission.id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save highlight");
      return;
    }
    toast.success("Highlight saved");
    onSaved();
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span
          className="text-[14px] font-extrabold uppercase tracking-[0.12em] text-white"
          style={teko}
        >
          Pick Your Highlight · 30s
        </span>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-black aspect-video">
        <video
          ref={videoRef}
          src={submission.submission_url}
          className="w-full h-full object-contain"
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={onLoaded}
          onClick={handlePreview}
        />
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/50">
          <span>Start {fmt(start)}</span>
          <span>End {fmt(end)}</span>
          <span>Total {fmt(duration)}</span>
        </div>

        <input
          type="range"
          min={0}
          max={max}
          step={0.5}
          value={Math.min(start, max)}
          onChange={(e) => setStart(parseFloat(e.target.value))}
          className="w-full accent-emerald-500"
          disabled={duration === 0 || max === 0}
        />

        <p className="text-[10px] text-white/40 leading-relaxed">
          Tap the video to preview. The 30 seconds you choose plays as the highlight on your tile.
          {duration > 0 && duration <= CLIP_LEN && " Your edit is shorter than 30s — full video plays."}
        </p>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handlePreview}
            disabled={duration === 0}
            className="flex-1 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-[12px] font-bold uppercase tracking-widest disabled:opacity-40"
            style={teko}
          >
            <Play className="w-3.5 h-3.5 inline mr-1" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-black text-[12px] font-extrabold uppercase tracking-widest disabled:opacity-50"
            style={teko}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 inline animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5 inline mr-1" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}