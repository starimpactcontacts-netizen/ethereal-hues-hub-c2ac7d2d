import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, DollarSign, Clock, Send, Trophy, ExternalLink, Zap, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function formatPrize(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function useCountdown(endDate: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!endDate) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!endDate) return { text: "TBD", expired: false };
  const diff = new Date(endDate).getTime() - now;
  if (diff <= 0) return { text: "TIME'S UP", expired: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { text: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`, expired: false };
}

const PLATFORMS = ["tiktok", "youtube", "instagram"];

export default function CashBattlePage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [battle, setBattle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!battleId) return;
    fetchBattle();
    const channel = supabase
      .channel(`cash-battle-${battleId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "cash_battles", filter: `id=eq.${battleId}` }, (payload) => {
        setBattle(payload.new);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [battleId]);

  async function fetchBattle() {
    const { data } = await supabase.from("cash_battles").select("*").eq("id", battleId!).single();
    setBattle(data);
    setLoading(false);
  }

  const countdown = useCountdown(battle?.ends_at);
  const isChallenger = user?.id === battle?.challenger_id;
  const isOpponent = user?.id === battle?.opponent_id;
  const isFighter = isChallenger || isOpponent;
  const mySubmissionUrl = isChallenger ? battle?.challenger_submission_url : battle?.opponent_submission_url;
  const opponentSubmissionUrl = isChallenger ? battle?.opponent_submission_url : battle?.challenger_submission_url;

  async function handleSubmit() {
    if (!url.trim() || !battleId || !user) return;
    setSubmitting(true);
    const prefix = isChallenger ? "challenger" : "opponent";
    const { error } = await supabase.from("cash_battles").update({
      [`${prefix}_submission_url`]: url.trim(),
      [`${prefix}_submission_platform`]: platform,
      [`${prefix}_submitted_at`]: new Date().toISOString(),
    } as any).eq("id", battleId);
    if (error) toast.error("Failed to submit");
    else { toast.success("Edit submitted! 🔥"); await fetchBattle(); }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Battle not found</p>
        <button onClick={() => navigate("/arena")} className="text-sm text-blue-400">Back to Arena</button>
      </div>
    );
  }

  const isLive = battle.status === "live";
  const isCompleted = battle.status === "completed";

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0c" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3" style={{ background: "rgba(10,10,12,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #ef4444)" }}>
            <DollarSign className="w-3 h-3 text-white" />
          </div>
          <span className="text-[14px] font-black text-white uppercase tracking-wider" style={{ fontFamily: "Teko, sans-serif" }}>
            Cash Battle
          </span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-white" style={{ fontFamily: "Teko, sans-serif" }}>
            {formatPrize(battle.prize_cents)}
          </span>
        </div>
      </div>

      {/* Countdown Timer */}
      {isLive && (
        <div className="mx-4 mt-4 rounded-2xl py-4 text-center" style={{
          background: countdown.expired ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${countdown.expired ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1" style={{ fontFamily: "Teko, sans-serif" }}>
            {countdown.expired ? "Submissions Closed" : "Time Remaining"}
          </p>
          <p className={`text-4xl font-black ${countdown.expired ? "text-red-400" : "text-white"}`} style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.1em" }}>
            {countdown.text}
          </p>
        </div>
      )}

      {isCompleted && (
        <div className="mx-4 mt-4 rounded-2xl py-4 text-center" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
          <Trophy className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-black text-emerald-400 uppercase" style={{ fontFamily: "Teko, sans-serif" }}>
            {battle.winner_id === battle.challenger_id ? battle.challenger_username : battle.opponent_username} wins {formatPrize(battle.prize_cents)}!
          </p>
        </div>
      )}

      {/* VS Display */}
      <div className="flex items-center justify-center gap-4 py-6 px-4">
        {/* Blue Corner */}
        <FighterCorner
          username={battle.challenger_username}
          avatarUrl={battle.challenger_avatar_url}
          color="blue"
          submitted={!!battle.challenger_submission_url}
          isWinner={isCompleted && battle.winner_id === battle.challenger_id}
        />

        <div className="shrink-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }}>
            <span className="text-xl font-black text-white/60" style={{ fontFamily: "Teko, sans-serif" }}>VS</span>
          </div>
        </div>

        {/* Red Corner */}
        <FighterCorner
          username={battle.opponent_username || "TBA"}
          avatarUrl={battle.opponent_avatar_url}
          color="red"
          submitted={!!battle.opponent_submission_url}
          isWinner={isCompleted && battle.winner_id === battle.opponent_id}
        />
      </div>

      {/* Sponsor / Rules */}
      <div className="mx-4 mb-4 rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-[12px] font-black text-white uppercase tracking-wider" style={{ fontFamily: "Teko, sans-serif" }}>Rules</span>
        </div>
        <ul className="space-y-2 text-[12px] text-zinc-400 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">1.</span>
            <span>Create an edit using the <strong className="text-white">sponsor's scenepack/content</strong> — edits without it are disqualified.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">2.</span>
            <span>Post your edit on TikTok, YouTube, or Instagram and paste the link below.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">3.</span>
            <span>Submit before the timer runs out. Late submissions = auto-forfeit.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">4.</span>
            <span>A judge will review both edits and pick the winner. <strong className="text-white">{formatPrize(battle.prize_cents)}</strong> goes to the best edit.</span>
          </li>
        </ul>
        {battle.sponsor_name && (
          <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {battle.sponsor_logo_url && <img src={battle.sponsor_logo_url} alt="" className="w-5 h-5 rounded object-cover" />}
            <span className="text-[11px] text-blue-400 font-semibold">Sponsored by {battle.sponsor_name}</span>
          </div>
        )}
        {battle.scenepack_url && (
          <a href={battle.scenepack_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-emerald-400 hover:underline">
            <ExternalLink className="w-3.5 h-3.5" /> Download Scenepack
          </a>
        )}
      </div>

      {/* Submit Section — only for fighters, only if live and not yet submitted */}
      {isFighter && isLive && !mySubmissionUrl && !countdown.expired && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(59,130,246,0.2)" }}
        >
          <p className="text-[12px] font-black text-white uppercase tracking-wider mb-3" style={{ fontFamily: "Teko, sans-serif" }}>
            Submit Your Edit
          </p>

          {/* Platform picker */}
          <div className="flex gap-2 mb-3">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all"
                style={{
                  background: platform === p ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.04)",
                  color: platform === p ? "#000" : "rgba(255,255,255,0.4)",
                  border: `1px solid ${platform === p ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your video link..."
            className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/20 rounded-xl mb-3"
          />

          <button
            onClick={handleSubmit}
            disabled={submitting || !url.trim()}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[14px] uppercase tracking-wider disabled:opacity-40 transition-all"
            style={{ background: "linear-gradient(135deg, #3b82f6, #ef4444)", fontFamily: "Teko, sans-serif" }}
          >
            {submitting ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            <span className="text-white">{submitting ? "Submitting..." : "Submit Edit"}</span>
          </button>
        </motion.div>
      )}

      {/* Already submitted confirmation */}
      {isFighter && mySubmissionUrl && (
        <div className="mx-4 mb-4 rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-emerald-400">Your edit is submitted!</p>
            <a href={mySubmissionUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-zinc-300 truncate block">
              {mySubmissionUrl}
            </a>
          </div>
        </div>
      )}

      {/* Submission status overview */}
      <div className="mx-4 mb-6 space-y-2">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider" style={{ fontFamily: "Teko, sans-serif" }}>Submission Status</p>
        <SubmissionRow
          username={battle.challenger_username}
          color="blue"
          submitted={!!battle.challenger_submission_url}
          url={isCompleted ? battle.challenger_submission_url : undefined}
        />
        <SubmissionRow
          username={battle.opponent_username || "TBA"}
          color="red"
          submitted={!!battle.opponent_submission_url}
          url={isCompleted ? battle.opponent_submission_url : undefined}
        />
      </div>

      <div className="h-24" />
    </div>
  );
}

function FighterCorner({ username, avatarUrl, color, submitted, isWinner }: {
  username: string; avatarUrl: string | null; color: "blue" | "red"; submitted: boolean; isWinner: boolean;
}) {
  const ring = color === "blue" ? "ring-blue-500/50" : "ring-red-500/50";
  const bg = color === "blue" ? "bg-blue-500/15" : "bg-red-500/15";
  const textColor = color === "blue" ? "text-blue-400" : "text-red-400";
  const accentBg = color === "blue" ? "bg-blue-500" : "bg-red-500";

  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <div className="relative">
        <Avatar className={`w-16 h-16 ring-2 ${ring}`}>
          <AvatarImage src={avatarUrl || ""} />
          <AvatarFallback className={`text-lg font-black ${bg} ${textColor}`}>{username?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${accentBg} flex items-center justify-center`}>
          {submitted ? <CheckCircle className="w-3 h-3 text-white" /> : <Zap className="w-3 h-3 text-white" />}
        </div>
        {isWinner && (
          <div className="absolute -top-2 -right-2">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
        )}
      </div>
      <span className={`text-[12px] font-black truncate max-w-[80px] uppercase ${textColor}`} style={{ fontFamily: "Teko, sans-serif" }}>
        {username}
      </span>
    </div>
  );
}

function SubmissionRow({ username, color, submitted, url }: {
  username: string; color: "blue" | "red"; submitted: boolean; url?: string;
}) {
  const dotColor = color === "blue" ? "bg-blue-500" : "bg-red-500";
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-[12px] font-bold text-white uppercase" style={{ fontFamily: "Teko, sans-serif" }}>{username}</span>
      </div>
      {submitted ? (
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-semibold">Submitted</span>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="ml-1">
              <ExternalLink className="w-3 h-3 text-zinc-500 hover:text-zinc-300" />
            </a>
          )}
        </div>
      ) : (
        <span className="text-[10px] text-zinc-600">Waiting...</span>
      )}
    </div>
  );
}
