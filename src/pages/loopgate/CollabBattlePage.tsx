import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft, Flame, Crown, Gavel, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCollabBattle } from "@/hooks/useCollabBattles";
import { useAuth } from "@/hooks/useAuth";
import type { CollabSlot } from "@/hooks/useCollabs";

function DuoHeader({ slot }: { slot: CollabSlot }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/80 bg-black">
          {slot.creator_avatar_url ? (
            <img src={slot.creator_avatar_url} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] font-black">
              {slot.creator_username.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        {slot.partner_username && (
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/80 bg-black">
            {slot.partner_avatar_url ? (
              <img src={slot.partner_avatar_url} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-black">
                {slot.partner_username.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-[12px] font-bold truncate">
        {slot.creator_username}
        {slot.partner_username && <span className="text-white/60"> × {slot.partner_username}</span>}
      </p>
    </div>
  );
}

function DuoSide({
  slot,
  score,
  reactions,
  judgeAvg,
  leading,
  accent,
  onCheer,
  onJudge,
  myPick,
  myScore,
}: {
  slot: CollabSlot;
  score: number;
  reactions: number;
  judgeAvg: number;
  leading: boolean;
  accent: "violet" | "sky";
  onCheer: () => void;
  onJudge: (qoi: number) => void;
  myPick: boolean;
  myScore: number | null;
}) {
  const accentBg = accent === "violet" ? "from-violet-500 to-fuchsia-600" : "from-sky-500 to-cyan-500";
  const accentBtn = accent === "violet" ? "bg-violet-500" : "bg-sky-500";
  const ringColor = accent === "violet" ? "ring-violet-400/60" : "ring-sky-400/60";

  return (
    <div
      className={`flex-1 rounded-3xl overflow-hidden bg-black border-2 ${
        leading ? `${ringColor.replace("ring-", "border-")} ring-4 ${ringColor}` : "border-white/10"
      }`}
    >
      <div className="relative bg-black aspect-[9/12] max-h-[260px]">
        {slot.final_video_url ? (
          <video
            src={slot.final_video_url}
            controls
            playsInline
            className="w-full h-full object-cover bg-black"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-[11px]">
            No upload
          </div>
        )}
        {leading && (
          <span className="absolute top-2 left-2 text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md bg-amber-400 text-black flex items-center gap-0.5">
            <Crown className="w-2.5 h-2.5" /> LEADING
          </span>
        )}
      </div>

      <div className="p-3 space-y-2.5">
        <DuoHeader slot={slot} />

        <div className="flex items-end justify-between">
          <p
            className={`text-[40px] font-black leading-none tabular-nums bg-gradient-to-b ${accentBg} bg-clip-text text-transparent`}
            style={{ fontFamily: "Teko, sans-serif" }}
          >
            {score}
          </p>
          <div className="text-right text-[9px] font-bold text-white/60 uppercase tracking-wider space-y-0.5">
            <p className="flex items-center justify-end gap-0.5"><Flame className="w-2.5 h-2.5 text-orange-400" />{reactions} fire</p>
            <p className="flex items-center justify-end gap-0.5"><Gavel className="w-2.5 h-2.5 text-amber-300" />{judgeAvg.toFixed(0)} QOI</p>
          </div>
        </div>

        <button
          onClick={onCheer}
          className={`w-full py-2 rounded-xl ${accentBtn} text-white text-[11px] font-black tracking-widest uppercase active:translate-y-[2px] shadow-[0_3px_0_rgba(0,0,0,0.4)] flex items-center justify-center gap-1.5`}
        >
          <Flame className="w-3.5 h-3.5" /> Cheer
        </button>

        <div className="rounded-xl border border-white/10 p-2">
          <p className="text-[9px] uppercase tracking-widest font-bold text-amber-300 flex items-center gap-1 mb-1.5">
            <Gavel className="w-2.5 h-2.5" /> Judge {myPick && "· you picked this"}
          </p>
          <div className="grid grid-cols-5 gap-1">
            {[40, 55, 70, 85, 95].map((v) => (
              <button
                key={v}
                onClick={() => onJudge(v)}
                className={`py-1 rounded-md text-[10px] font-black tabular-nums ${
                  myPick && myScore === v
                    ? "bg-amber-400 text-black"
                    : "bg-white/[0.05] text-white/60 border border-white/10 active:scale-95"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CollabBattlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { battle, myVote, loading, castJudgeVote, reload } = useCollabBattle(id);
  const [busy, setBusy] = useState(false);

  if (loading || !battle) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-white/40 text-sm">Loading battle…</p>
      </div>
    );
  }

  const aLead = battle.score_a > battle.score_b;
  const bLead = battle.score_b > battle.score_a;

  const cheer = async (slotId: string) => {
    if (!user) return navigate("/start");
    if (busy) return;
    setBusy(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: existing } = await supabase
        .from("collab_reactions")
        .select("id")
        .eq("slot_id", slotId)
        .eq("user_id", user.id)
        .eq("emoji", "fire")
        .maybeSingle();
      if (existing) {
        toast("Already cheered this duo", { description: "One cheer per battle side" });
      } else {
        await supabase.from("collab_reactions").insert({
          slot_id: slotId,
          user_id: user.id,
          emoji: "fire",
        });
        toast.success("🔥 Cheer counted");
      }
      reload();
    } catch (e: any) {
      toast.error(e.message || "Couldn't cheer");
    } finally {
      setBusy(false);
    }
  };

  const judge = async (slotId: string, qoi: number) => {
    if (!user) return navigate("/start");
    try {
      await castJudgeVote(slotId, qoi);
      toast.success("Judge vote locked");
    } catch (e: any) {
      toast.error(e.message || "Vote failed");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ url, title: "Duo Edit Battle" });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Battle link copied");
      }
    } catch {}
  };

  const ms = new Date(battle.ends_at).getTime() - Date.now();
  const hours = Math.max(0, Math.floor(ms / 3_600_000));
  const mins = Math.max(0, Math.floor((ms % 3_600_000) / 60_000));
  const timeLeft = ms <= 0 ? "ENDED" : hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;

  return (
    <div className="min-h-screen text-white pb-32 relative overflow-hidden bg-gradient-to-b from-[#1a0b2e] via-[#0a0612] to-black">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.35), transparent 60%), radial-gradient(ellipse at 100% 0%, rgba(56,189,248,0.25), transparent 60%)",
        }}
      />

      {/* Header */}
      <div className="relative z-30 px-3 pt-3 flex items-center gap-2">
        <button
          onClick={() => navigate("/collabs")}
          className="w-11 h-11 rounded-2xl bg-black/80 border border-white/10 flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.6)] active:translate-y-[2px]"
        >
          <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
        <div className="flex-1 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-[0_3px_0_rgba(0,0,0,0.5)]">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          <p className="text-[10px] font-black tracking-widest uppercase text-rose-300 leading-none">Live Duo Battle</p>
          <span className="ml-auto text-[10px] font-bold text-white/60 tabular-nums">{timeLeft}</span>
        </div>
        <button
          onClick={handleShare}
          className="w-11 h-11 rounded-2xl bg-black/80 border border-white/10 flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.6)] active:translate-y-[2px]"
        >
          <Share2 className="w-4 h-4 text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* VS row */}
      <div className="relative z-10 px-3 pt-4 flex items-stretch gap-2">
        <DuoSide
          slot={battle.slot_a}
          score={battle.score_a}
          reactions={battle.reactions_a}
          judgeAvg={battle.judge_score_a}
          leading={aLead}
          accent="violet"
          onCheer={() => cheer(battle.slot_a_id)}
          onJudge={(v) => judge(battle.slot_a_id, v)}
          myPick={myVote?.pick_slot_id === battle.slot_a_id}
          myScore={myVote?.pick_slot_id === battle.slot_a_id ? myVote.qoi_score : null}
        />
        <div className="flex flex-col items-center justify-center">
          <div
            className="w-12 h-12 rounded-full bg-black border-2 border-white flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.5)]"
            style={{ fontFamily: "Teko, sans-serif", fontSize: "20px" }}
          >
            VS
          </div>
        </div>
        <DuoSide
          slot={battle.slot_b}
          score={battle.score_b}
          reactions={battle.reactions_b}
          judgeAvg={battle.judge_score_b}
          leading={bLead}
          accent="sky"
          onCheer={() => cheer(battle.slot_b_id)}
          onJudge={(v) => judge(battle.slot_b_id, v)}
          myPick={myVote?.pick_slot_id === battle.slot_b_id}
          myScore={myVote?.pick_slot_id === battle.slot_b_id ? myVote.qoi_score : null}
        />
      </div>

      {/* Hybrid scoring explainer */}
      <div className="relative z-10 px-3 pt-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-3 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/70 leading-snug">
            <span className="text-white font-bold">Hybrid scoring:</span> 70% public cheers · 30% judge QOI.
            Winner duo splits <span className="text-violet-300 font-bold">XP + Index</span> when the timer hits zero.
          </p>
        </div>
      </div>

      {/* Open the original duo pages */}
      <div className="relative z-10 px-3 pt-3 grid grid-cols-2 gap-2">
        <Link
          to={`/collab/${battle.slot_a_id}`}
          className="text-center py-2 rounded-xl bg-violet-500/15 border border-violet-400/25 text-[10px] font-black uppercase tracking-widest text-violet-200"
        >
          Duo A details
        </Link>
        <Link
          to={`/collab/${battle.slot_b_id}`}
          className="text-center py-2 rounded-xl bg-sky-500/15 border border-sky-400/25 text-[10px] font-black uppercase tracking-widest text-sky-200"
        >
          Duo B details
        </Link>
      </div>
    </div>
  );
}