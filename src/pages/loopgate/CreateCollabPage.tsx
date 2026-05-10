import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Music, Clock, User, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createCollabSlot } from "@/hooks/useCollabs";
import { useAuth } from "@/hooks/useAuth";

const DURATIONS = [10, 15, 20, 30, 45, 60];

export default function CreateCollabPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [duration, setDuration] = useState(20);
  const [creatorSegment, setCreatorSegment] = useState("");
  const [partnerSegment, setPartnerSegment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    navigate("/start");
    return null;
  }

  const half = Math.round(duration / 2);

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
      });
      toast.success("Collab slot live in the lobby");
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
          Create Collab
        </h1>
      </div>

      <div className="px-4 pt-4 space-y-5 max-w-xl mx-auto">
        {/* Song */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-violet-300 font-bold flex items-center gap-1">
            <Music className="w-3 h-3" /> The Song
          </label>
          <Input
            placeholder="Song title"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            className="bg-white/[0.04] border-white/10"
          />
          <Input
            placeholder="Artist (optional)"
            value={songArtist}
            onChange={(e) => setSongArtist(e.target.value)}
            className="bg-white/[0.04] border-white/10"
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-violet-300 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> Total Length — {duration}s ({half}s each)
          </label>
          <div className="grid grid-cols-6 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`py-2 rounded-lg text-[12px] font-bold ${
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
          className="w-full py-3.5 rounded-2xl bg-violet-500 text-white text-[13px] font-black uppercase tracking-widest active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post to Lobby"}
        </button>
        <p className="text-[10px] text-center text-white/40">
          Anyone can join your slot. Once paired, you both align on the brief and one of you uploads the final stitched edit.
        </p>
      </div>
    </div>
  );
}