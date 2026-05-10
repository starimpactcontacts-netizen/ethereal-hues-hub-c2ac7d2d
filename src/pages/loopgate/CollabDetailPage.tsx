import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Music, Clock, Check, Upload, AlertCircle, Flame, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useCollabSlot,
  joinCollabSlot,
  uploadCollabVideo,
  approveCollab,
} from "@/hooks/useCollabs";
import { useAuth } from "@/hooks/useAuth";
import CollabEmojiRail from "@/components/loopgate/collabs/CollabEmojiRail";

export default function CollabDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { slot, reactions, loading, toggleReaction, reload } = useCollabSlot(id);
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading || !slot) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-white/40 text-sm">Loading collab…</p>
      </div>
    );
  }

  const isCreator = user?.id === slot.creator_id;
  const isPartner = user?.id === slot.partner_id;
  const isParticipant = isCreator || isPartner;
  const half = Math.round(slot.total_duration_seconds / 2);

  const handleJoin = async () => {
    if (!user) return navigate("/start");
    setBusy(true);
    try {
      await joinCollabSlot(slot.id);
      toast.success("You joined the collab — let's edit!");
      reload();
    } catch (e: any) {
      toast.error(e.message || "Couldn't join");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async () => {
    if (!videoUrl.trim()) return toast.error("Paste your final edit URL");
    setBusy(true);
    try {
      await uploadCollabVideo(slot.id, videoUrl.trim());
      toast.success("Uploaded — waiting on partner approval");
      setVideoUrl("");
      reload();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      await approveCollab(slot.id, isPartner);
      toast.success("Approved! 🎬");
      reload();
    } catch (e: any) {
      toast.error(e.message || "Approval failed");
    } finally {
      setBusy(false);
    }
  };

  const youApproved = isCreator ? slot.creator_approved : isPartner ? slot.partner_approved : false;

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/collabs")} className="-ml-2 p-2 rounded-full active:bg-white/10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1
            className="text-xl font-black tracking-tight uppercase leading-none truncate"
            style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
          >
            {slot.creator_username} × {slot.partner_username ?? "???"}
          </h1>
          <p className="text-[11px] text-violet-300 uppercase tracking-widest">{slot.status.replace("_", " ")}</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        {/* Brief card */}
        <div className="rounded-2xl p-4 border border-white/5 bg-white/[0.03]">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-violet-300" />
            <p className="text-[14px] font-bold">{slot.song_title}{slot.song_artist ? ` — ${slot.song_artist}` : ""}</p>
          </div>
          <p className="text-[11px] text-white/50 flex items-center gap-1 mb-3">
            <Clock className="w-3 h-3" /> {slot.total_duration_seconds}s total — {half}s each
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-violet-500/10 border border-violet-400/20 p-2.5">
              <p className="text-[9px] uppercase tracking-widest text-violet-300 font-bold mb-1">{slot.creator_username} · 0–{half}s</p>
              <p className="text-foreground/80">{slot.creator_segment}</p>
            </div>
            <div className="rounded-lg bg-violet-500/10 border border-violet-400/20 p-2.5">
              <p className="text-[9px] uppercase tracking-widest text-violet-300 font-bold mb-1">{slot.partner_username ?? "Partner"} · {half}–{slot.total_duration_seconds}s</p>
              <p className="text-foreground/80">{slot.partner_segment}</p>
            </div>
          </div>
        </div>

        {/* JOIN CTA */}
        {slot.status === "open" && !isCreator && (
          <button
            onClick={handleJoin}
            disabled={busy}
            className="w-full py-3.5 rounded-2xl bg-violet-500 text-white text-[13px] font-black uppercase tracking-widest active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Joining…" : "Join This Collab"}
          </button>
        )}

        {/* Editing state — show upload form to participants */}
        {isParticipant && (slot.status === "paired" || slot.status === "editing") && (
          <div className="rounded-2xl p-4 border border-amber-400/30 bg-amber-500/5 space-y-2">
            <p className="text-[12px] font-bold text-amber-300 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Upload the final stitched edit
            </p>
            <p className="text-[10px] text-white/50">
              One of you assembles both halves and pastes the URL (TikTok, Instagram, YouTube, etc.). The other approves.
            </p>
            <Input
              placeholder="https://..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="bg-white/[0.04] border-white/10"
            />
            <button
              onClick={handleUpload}
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-[12px] font-black uppercase tracking-widest active:scale-[0.98] disabled:opacity-50"
            >
              Submit Final Edit
            </button>
          </div>
        )}

        {/* Pending approval */}
        {slot.status === "pending_approval" && (
          <div className="rounded-2xl p-4 border border-amber-400/30 bg-amber-500/5 space-y-3">
            <p className="text-[12px] font-bold text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Awaiting Co-Approval
            </p>
            {slot.final_video_url && (
              <a
                href={slot.final_video_url}
                target="_blank"
                rel="noreferrer"
                className="block text-[11px] text-violet-300 underline truncate"
              >
                {slot.final_video_url}
              </a>
            )}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className={`rounded-lg p-2 border ${slot.creator_approved ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-white/50"}`}>
                {slot.creator_approved ? "✓" : "○"} {slot.creator_username}
              </div>
              <div className={`rounded-lg p-2 border ${slot.partner_approved ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-white/50"}`}>
                {slot.partner_approved ? "✓" : "○"} {slot.partner_username}
              </div>
            </div>
            {isParticipant && !youApproved && (
              <button
                onClick={handleApprove}
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-black text-[12px] font-black uppercase tracking-widest active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Approve & Go Live
              </button>
            )}
          </div>
        )}

        {/* LIVE — video + reactions */}
        {slot.status === "live" && slot.final_video_url && (
          <>
            <div className="rounded-2xl overflow-hidden border border-white/5 bg-black aspect-video flex items-center justify-center">
              <a
                href={slot.final_video_url}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] text-violet-300 underline px-4 py-8 text-center"
              >
                Open final edit ↗<br />
                <span className="text-white/40 text-[10px]">{slot.final_video_url}</span>
              </a>
            </div>

            <div className="rounded-2xl p-4 border border-white/5 bg-white/[0.03]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> Fire This Collab
                </p>
                {slot.reaction_score > 0 && (
                  <span className="text-[10px] text-white/50">
                    {slot.reaction_score} score · {slot.total_reactions} reactions
                  </span>
                )}
              </div>
              <CollabEmojiRail
                reactions={reactions}
                onTap={toggleReaction}
                disabled={!user}
              />
              {!user && (
                <p className="text-[10px] text-white/40 mt-2 text-center">
                  <button onClick={() => navigate("/start")} className="text-violet-300 underline">Sign in</button> to react
                </p>
              )}
            </div>

            <div className="rounded-2xl p-3.5 border border-violet-400/20 bg-violet-500/5">
              <p className="text-[11px] text-violet-200 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                <span>
                  Top 3 collabs at midnight UTC win <span className="font-black">7× XP + 7× Index</span> for both editors.
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}