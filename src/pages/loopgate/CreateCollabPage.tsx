import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Music, Clock, User, Users, Swords, Hourglass, Lock, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createCollabSlot, type CollabSlot } from "@/hooks/useCollabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const DURATIONS = [10, 15, 20, 30, 45, 60];

export default function CreateCollabPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const challengeId = params.get("challenge");
  const [target, setTarget] = useState<CollabSlot | null>(null);
  const [loadingTarget, setLoadingTarget] = useState(!!challengeId);
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [duration, setDuration] = useState(20);
  const [creatorSegment, setCreatorSegment] = useState("");
  const [partnerSegment, setPartnerSegment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!challengeId) return;
    (async () => {
      const { data } = await supabase
        .from("collab_slots")
        .select("*")
        .eq("id", challengeId)
        .maybeSingle();
      if (data) {
        const t = data as CollabSlot;
        setTarget(t);
        setSongTitle(t.song_title);
        setSongArtist(t.song_artist ?? "");
        setDuration(t.total_duration_seconds);
      }
      setLoadingTarget(false);
    })();
  }, [challengeId]);

  if (!user) {
    navigate("/start");
    return null;
  }

  const half = Math.round(duration / 2);
  const locked = !!target;

  const submit = async () => {
    if (!songTitle.trim() || !creatorSegment.trim() || !partnerSegment.trim()) {
      toast.error("Fill song + both halves");
      return;
    }
    setSubmitting(true);
    try {
      const slot = await createCollabSlot({
        song_title: songTitle.trim(),
        song_artist: songArtist.trim() || undefined,
        total_duration_seconds: duration,
        creator_segment: creatorSegment.trim(),
        partner_segment: partnerSegment.trim(),
        challenges_slot_id: target?.id ?? null,
      });
      toast.success(target ? "Challenge posted — waiting on a partner" : "Collab slot live in the lobby");
      navigate(`/collab/${slot.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="-ml-2 p-2 rounded-full active:bg-white/10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1
          className="text-2xl font-black tracking-tight uppercase leading-none"
          style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
        >
          {target ? "Challenge Duo" : "Create Collab"}
        </h1>
      </div>

      <div className="px-4 pt-4 space-y-5 max-w-xl mx-auto">
        {/* Challenge linker — shows who you're going against */}
        {loadingTarget && (
          <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.03] text-[12px] text-white/50">
            Loading defender duo…
          </div>
        )}
        {target && (
          <div className="rounded-2xl p-4 border border-rose-500/30 bg-gradient-to-b from-rose-500/[0.08] to-transparent">
            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-rose-300 mb-2 flex items-center gap-1.5">
              <Swords className="w-3 h-3" /> You will go against
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black tracking-widest text-rose-300/80 uppercase mb-1.5">DEFENDERS</p>
                <div className="flex -space-x-2 mb-1.5">
                  {[
                    { url: target.creator_avatar_url, name: target.creator_username },
                    { url: target.partner_avatar_url, name: target.partner_username ?? "?" },
                  ].map((p, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full overflow-hidden border-2 border-rose-400/70 bg-[#0a0612] flex items-center justify-center text-[10px] font-black text-white/80"
                    >
                      {p.url ? (
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        p.name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
                <p
                  className="text-[14px] font-black leading-none truncate"
                  style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
                >
                  {target.creator_username} <span className="text-rose-300">×</span>{" "}
                  {target.partner_username ?? "?"}
                </p>
              </div>
              <span
                className="text-white/30 text-[24px] font-black"
                style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
              >
                VS
              </span>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[8px] font-black tracking-widest text-emerald-300/80 uppercase mb-1.5">YOUR SIDE</p>
                <div className="flex -space-x-2 flex-row-reverse space-x-reverse mb-1.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-400/70 bg-[#0a0612] flex items-center justify-center text-[10px] font-black text-white/80">
                    {(user.user_metadata as any)?.avatar_url ? (
                      <img src={(user.user_metadata as any).avatar_url} alt="you" className="w-full h-full object-cover" />
                    ) : (
                      "Y"
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-full border-2 border-dashed border-emerald-400/60 bg-emerald-500/[0.08] flex items-center justify-center animate-pulse">
                    <UserPlus className="w-3.5 h-3.5 text-emerald-300" />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-300/80 font-bold">+ partner needed</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-200">
              <Hourglass className="w-3 h-3" />
              <span>Same song, same length — locked. 3H to ship once your partner joins.</span>
            </div>
          </div>
        )}

        {/* Song */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-violet-300 font-bold flex items-center gap-1">
            <Music className="w-3 h-3" /> The Song {locked && <Lock className="w-3 h-3 text-white/40 ml-1" />}
          </label>
          <Input
            placeholder="Song title"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            disabled={locked}
            className="bg-white/[0.04] border-white/10 disabled:opacity-70"
          />
          <Input
            placeholder="Artist (optional)"
            value={songArtist}
            onChange={(e) => setSongArtist(e.target.value)}
            disabled={locked}
            className="bg-white/[0.04] border-white/10 disabled:opacity-70"
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-violet-300 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> Total Length — {duration}s ({half}s each) {locked && <Lock className="w-3 h-3 text-white/40 ml-1" />}
          </label>
          <div className="grid grid-cols-6 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => !locked && setDuration(d)}
                disabled={locked && d !== duration}
                className={`py-2 rounded-lg text-[12px] font-bold disabled:opacity-30 ${
                  duration === d
                    ? "bg-violet-500 text-white"
                    : "bg-white/[0.04] text-white/60 border border-white/5"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Your half */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-violet-300 font-bold flex items-center gap-1">
            <User className="w-3 h-3" /> Your Half (0–{half}s)
          </label>
          <Textarea
            placeholder="e.g. Goku build-up · slow-mo opener · cool blues palette"
            value={creatorSegment}
            onChange={(e) => setCreatorSegment(e.target.value)}
            className="bg-white/[0.04] border-white/10 min-h-[80px]"
          />
        </div>

        {/* Partner half */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-violet-300 font-bold flex items-center gap-1">
            <Users className="w-3 h-3" /> Partner's Half ({half}–{duration}s)
          </label>
          <Textarea
            placeholder="e.g. Vegeta payoff · drop-hit hard cuts · red/orange palette"
            value={partnerSegment}
            onChange={(e) => setPartnerSegment(e.target.value)}
            className="bg-white/[0.04] border-white/10 min-h-[80px]"
          />
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          className={`w-full py-3.5 rounded-2xl text-white text-[13px] font-black uppercase tracking-widest active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${
            target ? "bg-rose-500" : "bg-violet-500"
          }`}
        >
          {target ? <Swords className="w-3.5 h-3.5" /> : null}
          {submitting ? "Posting…" : target ? "Post Challenger Seat" : "Post to Lobby"}
        </button>
        <p className="text-[10px] text-center text-white/40">
          {target
            ? "A partner will join your seat. Once paired, you both ship the stitched edit and battle the defender duo."
            : "Anyone can join your slot. Once paired, you both align on the brief and one of you uploads the final stitched edit."}
        </p>
      </div>
    </div>
  );
}