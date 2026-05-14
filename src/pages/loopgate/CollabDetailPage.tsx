import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  Clock,
  Check,
  Upload,
  AlertCircle,
  Flame,
  Loader2,
  Link2,
  ExternalLink,
  X,
  Share2,
  Sparkles,
  MessageCircle,
  Mic,
  Swords,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBunny } from "@/lib/bunnyUpload";
import {
  useCollabSlot,
  joinCollabSlot,
  uploadCollabVideo,
  approveCollab,
} from "@/hooks/useCollabs";
import { useAuth } from "@/hooks/useAuth";
import CollabEmojiRail from "@/components/loopgate/collabs/CollabEmojiRail";
import CollabChatPanel from "@/components/loopgate/collabs/CollabChatPanel";
import CollabVoiceRoom from "@/components/loopgate/collabs/CollabVoiceRoom";

export default function CollabDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vsSlotId = searchParams.get("vs");
  const { user } = useAuth();
  const { slot, reactions, loading, toggleReaction, reload } = useCollabSlot(id);
  const [vsSlot, setVsSlot] = useState<{ id: string; creator_username: string; partner_username: string | null; creator_avatar_url: string | null; partner_avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!vsSlotId) { setVsSlot(null); return; }
    (async () => {
      const { data } = await supabase
        .from("collab_slots")
        .select("id, creator_username, partner_username, creator_avatar_url, partner_avatar_url")
        .eq("id", vsSlotId)
        .maybeSingle();
      if (data) setVsSlot(data as any);
    })();
  }, [vsSlotId]);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [socialUrl, setSocialUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 200 * 1024 * 1024) {
      toast.error("Video must be under 200MB");
      return;
    }
    setUploading(true);
    try {
      const { url: cdnUrl } = await uploadToBunny(file, { folder: `collabs/${slot.id}` });
      setUploadedUrl(cdnUrl);
      toast.success("Video uploaded — submit to lock it in");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!uploadedUrl) return toast.error("Upload your final edit first");
    setBusy(true);
    try {
      await uploadCollabVideo(slot.id, uploadedUrl, socialUrl.trim() || null);
      toast.success("Uploaded — waiting on partner approval");
      setUploadedUrl(null);
      setSocialUrl("");
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

  const statusLabel = slot.status.replace("_", " ").toUpperCase();
  const statusTone =
    slot.status === "live"
      ? "text-emerald-300"
      : slot.status === "pending_approval"
      ? "text-amber-300"
      : slot.status === "open"
      ? "text-sky-300"
      : "text-violet-300";

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ url, title: `${slot.creator_username} × ${slot.partner_username ?? "???"}` });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {}
  };

  // ── Speed-Draw style HUD pill (used on left + right rails) ──────────
  const RailButton = ({
    color,
    icon: Icon,
    label,
    onClick,
    badge,
  }: {
    color: string;
    icon: any;
    label: string;
    onClick?: () => void;
    badge?: string | number;
  }) => (
    <button
      onClick={onClick}
      title={label}
      className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.45),0_8px_20px_rgba(0,0,0,0.5)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.45)] transition-all"
      style={{ background: color }}
    >
      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]" strokeWidth={2.5} />
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center border border-white/20">
          {badge}
        </span>
      )}
    </button>
  );

  const ChipPill = ({ icon: Icon, value, color }: { icon: any; value: string | number; color: string }) => (
    <div
      className="flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full bg-white shadow-[0_3px_0_rgba(0,0,0,0.4),0_6px_14px_rgba(0,0,0,0.4)]"
    >
      <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: color }}>
        <Icon className="w-3.5 h-3.5 text-white" strokeWidth={3} />
      </span>
      <span className="text-[13px] font-black text-black tabular-nums" style={{ fontFamily: "Teko, sans-serif" }}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#0f0820] to-black text-white pb-32 relative overflow-hidden">
      {/* Soft stage glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[140%] h-[420px] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-[280px] h-[280px] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-[260px] h-[260px] rounded-full bg-sky-500/15 blur-3xl" />
      </div>

      {/* ═══ Top floating HUD banner — Speed Draw style ═══ */}
      <div className="relative z-30 px-3 pt-3 flex items-center gap-2">
        <button
          onClick={() => navigate("/collabs")}
          className="w-11 h-11 rounded-2xl bg-black/80 border border-white/10 flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.6)] active:translate-y-[2px]"
        >
          <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>

        {/* The big banner */}
        <div className="flex-1 relative">
          <div className="relative bg-white rounded-2xl px-3 py-2 flex items-center gap-3 shadow-[0_4px_0_rgba(0,0,0,0.5),0_10px_24px_rgba(0,0,0,0.5)]">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/50 leading-none">Theme:</p>
              <p
                className="text-[18px] font-black text-violet-600 leading-tight truncate"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                {slot.song_title}
              </p>
            </div>

            {/* Center pill — status */}
            <div className={`px-3 py-2 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 shadow-[0_3px_0_rgba(0,0,0,0.4)] ${statusTone}`}>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/80 leading-none">Status</p>
              <p className="text-[13px] font-black text-white leading-tight" style={{ fontFamily: "Teko, sans-serif" }}>
                {statusLabel}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/50 leading-none">Length:</p>
              <p className="text-[18px] font-black text-sky-600 leading-tight tabular-nums" style={{ fontFamily: "Teko, sans-serif" }}>
                {String(Math.floor(slot.total_duration_seconds / 60)).padStart(2, "0")}:
                {String(slot.total_duration_seconds % 60).padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Editor pair sub-banner ═══ */}
      <div className="relative z-20 px-3 mt-2">
        <p
          className="text-center text-[20px] font-black uppercase tracking-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]"
          style={{ fontFamily: "Teko, sans-serif" }}
        >
          {slot.creator_username} <span className="text-fuchsia-400">×</span> {slot.partner_username ?? "???"}
        </p>
      </div>

      {/* ═══ Left rail — score chips ═══ */}
      <div className="absolute z-20 left-2 top-32 flex flex-col gap-2">
        <ChipPill icon={Flame} value={slot.reaction_score ?? 0} color="#f59e0b" />
        <ChipPill icon={Sparkles} value={slot.total_reactions ?? 0} color="#ef4444" />
      </div>

      {/* ═══ Right rail — chunky action buttons ═══ */}
      <div className="absolute z-20 right-2 top-32 flex flex-col gap-2.5">
        <RailButton
          color="linear-gradient(180deg,#a855f7,#7c3aed)"
          icon={MessageCircle}
          label="Chat"
          onClick={() => setChatOpen(true)}
        />
        <RailButton
          color="linear-gradient(180deg,#22c55e,#16a34a)"
          icon={Mic}
          label="Voice"
          onClick={() => setVoiceOpen(true)}
        />
        <RailButton
          color="linear-gradient(180deg,#f59e0b,#d97706)"
          icon={Share2}
          label="Share"
          onClick={handleShare}
        />
      </div>

      {/* ═══ Center stage ═══ */}
      <div className="relative z-10 px-16 sm:px-20 md:px-24 pt-4 max-w-3xl mx-auto space-y-3">
        {/* Brief card */}
        <div className="rounded-3xl p-4 border-2 border-white/10 bg-white/[0.04] backdrop-blur-md shadow-[0_6px_0_rgba(0,0,0,0.4)]">
          <p className="text-[11px] text-white/60 flex items-center gap-1 mb-3">
            <Clock className="w-3 h-3" /> {slot.total_duration_seconds}s total — {half}s each
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-2xl bg-violet-500/15 border-2 border-violet-400/30 p-2.5">
              <p className="text-[9px] uppercase tracking-widest text-violet-300 font-bold mb-1">{slot.creator_username} · 0–{half}s</p>
              <p className="text-foreground/80">{slot.creator_segment}</p>
            </div>
            <div className="rounded-2xl bg-fuchsia-500/15 border-2 border-fuchsia-400/30 p-2.5">
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
            className="w-full py-4 rounded-2xl bg-gradient-to-b from-violet-500 to-violet-700 text-white text-[15px] font-black uppercase tracking-widest shadow-[0_5px_0_rgba(0,0,0,0.5),0_12px_24px_rgba(124,58,237,0.5)] active:translate-y-[3px] active:shadow-[0_2px_0_rgba(0,0,0,0.5)] disabled:opacity-50"
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
              One of you assembles both halves and uploads the video file. Optionally drop a TikTok/IG/YT link too. The other approves.
            </p>

            {uploadedUrl ? (
              <div className="relative rounded-xl overflow-hidden bg-black border border-white/10">
                <video src={uploadedUrl} controls playsInline className="w-full max-h-[360px] object-contain bg-black" />
                <button
                  onClick={() => setUploadedUrl(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 border border-white/20 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-6 rounded-xl border-2 border-dashed border-amber-400/40 bg-amber-500/5 text-amber-200 text-[12px] font-bold uppercase tracking-widest active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                ) : (
                  <><Upload className="w-4 h-4" /> Tap to upload video (mp4 / mov, ≤200MB)</>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex items-center gap-1.5 pt-1">
              <Link2 className="w-3.5 h-3.5 text-white/40" />
              <Input
                placeholder="Optional — TikTok / IG / YT link"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                className="bg-white/[0.04] border-white/10 h-9 text-[12px]"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={busy || !uploadedUrl}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-[12px] font-black uppercase tracking-widest active:scale-[0.98] disabled:opacity-40"
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
            {vsSlot && (
              <Link
                to={`/collab/${vsSlot.id}?vs=${slot.id}`}
                className="block rounded-2xl p-3 border-2 border-rose-500/40 bg-gradient-to-r from-rose-500/15 to-red-600/10 active:translate-y-[2px] shadow-[0_4px_0_rgba(0,0,0,0.4)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center shrink-0 shadow-[0_3px_0_rgba(0,0,0,0.4)]">
                    <Swords className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-300 leading-none">Battling vs</p>
                    <p className="text-[14px] font-black text-white truncate leading-tight" style={{ fontFamily: "Teko, sans-serif" }}>
                      {vsSlot.creator_username}{vsSlot.partner_username ? ` × ${vsSlot.partner_username}` : ""}
                    </p>
                  </div>
                  <div className="flex -space-x-2 shrink-0">
                    {vsSlot.creator_avatar_url && (
                      <img src={vsSlot.creator_avatar_url} className="w-7 h-7 rounded-full border-2 border-rose-400/70 object-cover" alt="" />
                    )}
                    {vsSlot.partner_avatar_url && (
                      <img src={vsSlot.partner_avatar_url} className="w-7 h-7 rounded-full border-2 border-rose-400/70 object-cover" alt="" />
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-200 shrink-0">View →</span>
                </div>
              </Link>
            )}
            <div className="rounded-3xl overflow-hidden border-2 border-white/15 bg-black shadow-[0_8px_0_rgba(0,0,0,0.5),0_16px_40px_rgba(168,85,247,0.3)]">
              <video
                src={slot.final_video_url}
                controls
                playsInline
                className="w-full max-h-[70vh] object-contain bg-black"
              />
              {slot.social_url && (
                <div className="px-3 py-2 border-t border-white/5 flex justify-end">
                  <a
                    href={slot.social_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70"
                  >
                    <ExternalLink className="w-3 h-3" /> Watch on Social
                  </a>
                </div>
              )}
            </div>

            <div className="rounded-3xl p-4 border-2 border-white/10 bg-white/[0.04] backdrop-blur-md shadow-[0_6px_0_rgba(0,0,0,0.4)]">
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

          </>
        )}
      </div>

      {/* Spacer so content isn't hidden behind the docked chat */}
      <div className="h-[140px]" aria-hidden />

      {/* Docked chat — always pinned to the bottom so duos can cook together */}
      {(slot.status === "live" ||
        slot.status === "open" ||
        slot.status === "paired" ||
        slot.status === "editing" ||
        slot.status === "pending_approval") && (
        <CollabChatPanel
          slotId={slot.id}
          open={true}
          onClose={() => {}}
          creatorId={slot.creator_id}
          partnerId={slot.partner_id}
          dock
        />
      )}

      {/* Chat + Voice modals */}
      <CollabChatPanel
        slotId={slot.id}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        creatorId={slot.creator_id}
        partnerId={slot.partner_id}
      />
      <CollabVoiceRoom
        slotId={slot.id}
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
      />
    </div>
  );
}