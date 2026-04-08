import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, DollarSign, Clock, Send, Trophy, ExternalLink, Zap, ChevronDown, CheckCircle, Loader2, Camera, Image as ImageIcon, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import CashBattleChat from "@/components/loopgate/CashBattleChat";
import weirdCityPoster from "@/assets/weird-city-poster.jpeg";

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

export default function CashBattlePage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [battle, setBattle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sponsorCover, setSponsorCover] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoAcceptRef = useRef(false);

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
    
    // Fetch sponsor campaign poster / cover image
    if (data?.sponsor_campaign_id) {
      const [{ data: campaign }, { data: missions }] = await Promise.all([
        supabase
          .from("artist_campaigns")
          .select("cover_image_url, logo_url, name")
          .eq("id", data.sponsor_campaign_id)
          .maybeSingle(),
        supabase
          .from("commissions")
          .select("cover_url")
          .eq("campaign_id", data.sponsor_campaign_id)
          .not("cover_url", "is", null)
          .limit(1),
      ]);

      const weirdCityFallback = (data.sponsor_name || campaign?.name || "").toLowerCase().includes("weirdcity") ? weirdCityPoster : null;
      setSponsorCover(campaign?.cover_image_url || missions?.[0]?.cover_url || weirdCityFallback);
    }
  }

  const countdown = useCountdown(battle?.ends_at);
  const isChallenger = user?.id === battle?.challenger_id;
  const isOpponent = user?.id === battle?.opponent_id;
  const isFighter = isChallenger || isOpponent;
  const myAccepted = isChallenger ? battle?.challenger_accepted : isOpponent ? battle?.opponent_accepted : false;
  const mySubmissionUrl = isChallenger ? battle?.challenger_submission_url : battle?.opponent_submission_url;

  async function acceptBattleSlot() {
    if (!battleId || !user || !battle) return;

    const joiningAsChallenger = user.id === battle.challenger_id;
    const joiningAsOpponent = user.id === battle.opponent_id;
    if (!joiningAsChallenger && !joiningAsOpponent) return;

    const updateField = joiningAsChallenger ? "challenger_accepted" : "opponent_accepted";
    const acceptedAtField = joiningAsChallenger ? "challenger_accepted_at" : "opponent_accepted_at";
    const otherAccepted = joiningAsChallenger ? battle.opponent_accepted : battle.challenger_accepted;

    setAccepting(true);

    const { error } = await supabase
      .from("cash_battles")
      .update({
        [updateField]: true,
        [acceptedAtField]: new Date().toISOString(),
      } as any)
      .eq("id", battleId);

    if (error) {
      setAccepting(false);
      autoAcceptRef.current = false;
      toast.error("Couldn’t join the battle right now");
      return;
    }

    if (otherAccepted) {
      const now = new Date();
      const endsAt = new Date(now.getTime() + battle.duration_hours * 60 * 60 * 1000);
      await supabase
        .from("cash_battles")
        .update({
          status: "live",
          starts_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
        } as any)
        .eq("id", battleId);
    }

    await fetchBattle();
    setAccepting(false);
  }

  useEffect(() => {
    if (!battle || !battleId || !user || battle.status !== "upcoming") return;
    if (!isFighter || myAccepted || autoAcceptRef.current) return;

    autoAcceptRef.current = true;
    void acceptBattleSlot();
  }, [battle, battleId, user, isFighter, myAccepted]);

  function handleThumbnailSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadThumbnail(): Promise<string | null> {
    if (!thumbnailFile || !battleId || !user) return null;
    const ext = thumbnailFile.name.split('.').pop();
    const path = `cash-battles/${battleId}/${user.id}.${ext}`;
    const { error } = await supabase.storage.from("battle-thumbnails").upload(path, thumbnailFile, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("battle-thumbnails").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit() {
    if (!url.trim() || !battleId || !user) return;
    setSubmitting(true);
    const prefix = isChallenger ? "challenger" : "opponent";
    
    let thumbUrl: string | null = null;
    if (thumbnailFile) {
      thumbUrl = await uploadThumbnail();
    }

    const updatePayload: any = {
      [`${prefix}_submission_url`]: url.trim(),
      [`${prefix}_submission_platform`]: "tiktok",
      [`${prefix}_submitted_at`]: new Date().toISOString(),
    };
    if (thumbUrl) {
      updatePayload[`${prefix}_thumbnail_url`] = thumbUrl;
    }

    const { error } = await supabase.from("cash_battles").update(updatePayload).eq("id", battleId);
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
  const challengerThumb = battle.challenger_thumbnail_url;
  const opponentThumb = battle.opponent_thumbnail_url;

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

      {/* F1-Style Sponsor Hero Banner */}
      {battle.sponsor_name && (
        <div className="mx-4 mt-3 rounded-2xl overflow-hidden relative" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Background cover image */}
          <div className="relative h-28">
            {sponsorCover ? (
              <img src={sponsorCover} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)" }} />
            )}
            {/* Cinematic gradient overlays */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,10,12,0.3) 0%, rgba(10,10,12,0.85) 100%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.15) 0%, transparent 50%, rgba(239,68,68,0.15) 100%)" }} />
            
            {/* Content overlay */}
            <div className="absolute inset-0 flex items-end p-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {battle.sponsor_logo_url && (
                  <img src={battle.sponsor_logo_url} alt="" className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/50 mb-0.5" style={{ fontFamily: "Teko, sans-serif" }}>
                    Sponsored By
                  </p>
                  <p className="text-[16px] font-black text-white uppercase leading-tight truncate" style={{ fontFamily: "Teko, sans-serif" }}>
                    {battle.sponsor_name}
                  </p>
                </div>
              </div>
              {battle.scenepack_url && (
                <a href={battle.scenepack_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-emerald-400 uppercase shrink-0"
                  style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", backdropFilter: "blur(8px)" }}>
                  <Download className="w-3 h-3" /> Scenepack
                </a>
              )}
            </div>
          </div>
          
          {/* Tagline strip */}
          <div className="px-3 py-2" style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="text-[10px] text-zinc-500 text-center">
              Use the <strong className="text-white">official scenepack</strong> to create your edit — best edit wins <strong className="text-white">{formatPrize(battle.prize_cents)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Scenepack Quick Button — always visible if available */}
      {battle.scenepack_url && !battle.sponsor_name && (
        <div className="mx-4 mt-3">
          <a
            href={battle.scenepack_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-black uppercase tracking-wider text-emerald-400 transition-all active:scale-[0.98]"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <Download className="w-4 h-4" />
            Download Scenepack
          </a>
        </div>
      )}

      {/* Countdown Timer */}
      {isLive && (
        <div className="mx-4 mt-3 rounded-2xl py-3 text-center" style={{
          background: countdown.expired ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${countdown.expired ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-0.5" style={{ fontFamily: "Teko, sans-serif" }}>
            {countdown.expired ? "Submissions Closed" : "Time Remaining"}
          </p>
          <p className={`text-3xl font-black ${countdown.expired ? "text-red-400" : "text-white"}`} style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.1em" }}>
            {countdown.text}
          </p>
        </div>
      )}

      {isFighter && battle.status === "upcoming" && (
        <div className="mx-4 mt-3 rounded-2xl p-4 bg-card border border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/25 px-2 py-1 mb-2">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-destructive">Live now</span>
              </div>
              <p className="text-xl font-black text-white uppercase" style={{ fontFamily: "Teko, sans-serif" }}>
                {accepting ? "Joining battle..." : "Waiting for opponent"}
              </p>
              <p className="text-[12px] text-zinc-400 mt-1">
                You’re locked in. The timer starts the second the other editor joins.
              </p>
            </div>
            {battle.scenepack_url && (
              <a
                href={battle.scenepack_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider"
              >
                <Download className="w-3 h-3" />
                Scenepack
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.18em]">Timer</span>
              </div>
              <p className="text-2xl font-black text-white leading-none" style={{ fontFamily: "Teko, sans-serif" }}>
                {battle.duration_hours}H
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Starts on lock-in</p>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-background/60 p-3">
              <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.18em]">Opponent slot</span>
              </div>
              <p className="text-lg font-black text-white leading-none" style={{ fontFamily: "Teko, sans-serif" }}>
                OPEN
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Match goes live instantly</p>
            </div>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="mx-4 mt-3 rounded-2xl py-3 text-center" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
          <Trophy className="w-7 h-7 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-black text-emerald-400 uppercase" style={{ fontFamily: "Teko, sans-serif" }}>
            {battle.winner_id === battle.challenger_id ? battle.challenger_username : battle.opponent_username} wins {formatPrize(battle.prize_cents)}!
          </p>
        </div>
      )}

      {/* VS Display */}
      <div className="flex items-center justify-center gap-4 py-5 px-4">
        <FighterCorner
          username={battle.challenger_username}
          avatarUrl={battle.challenger_avatar_url}
          color="blue"
          submitted={!!battle.challenger_submission_url}
          isWinner={isCompleted && battle.winner_id === battle.challenger_id}
        />
        <div className="shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }}>
            <span className="text-lg font-black text-white/60" style={{ fontFamily: "Teko, sans-serif" }}>VS</span>
          </div>
        </div>
        <FighterCorner
          username={battle.opponent_username || "TBA"}
          avatarUrl={battle.opponent_avatar_url}
          color="red"
          submitted={!!battle.opponent_submission_url}
          isWinner={isCompleted && battle.winner_id === battle.opponent_id}
        />
      </div>

      {/* Edit Showcase — side by side blocks */}
      <div className="mx-4 mb-4 grid grid-cols-2 gap-2">
        <EditBlock
          username={battle.challenger_username}
          color="blue"
          thumbnailUrl={challengerThumb}
          submissionUrl={battle.challenger_submission_url}
          submitted={!!battle.challenger_submission_url}
          isCompleted={isCompleted}
        />
        <EditBlock
          username={battle.opponent_username || "TBA"}
          color="red"
          thumbnailUrl={opponentThumb}
          submissionUrl={battle.opponent_submission_url}
          submitted={!!battle.opponent_submission_url}
          isCompleted={isCompleted}
        />
      </div>

      {/* Collapsible Rules */}
      <div className="mx-4 mb-4">
        <button
          onClick={() => setRulesOpen(!rulesOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-black text-white uppercase tracking-wider" style={{ fontFamily: "Teko, sans-serif" }}>Rules</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${rulesOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {rulesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3 space-y-2 text-[12px] text-zinc-400 leading-relaxed" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 0 12px 12px" }}>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 font-bold">1.</span>
                  <span>Create an edit using the <strong className="text-white">sponsor's scenepack/content</strong> — edits without it are disqualified.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 font-bold">2.</span>
                  <span>Post your edit on <strong className="text-white">TikTok</strong> and paste the link below.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 font-bold">3.</span>
                  <span>Submit before the timer runs out. Late submissions = auto-forfeit.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 font-bold">4.</span>
                  <span>A judge will review both edits and pick the winner. <strong className="text-white">{formatPrize(battle.prize_cents)}</strong> goes to the best edit.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit Section — TikTok only, with optional thumbnail */}
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

          {/* TikTok label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase" style={{ background: "rgba(255,255,255,0.9)", color: "#000", border: "1px solid rgba(255,255,255,0.9)" }}>
              TikTok
            </span>
            <span className="text-[10px] text-zinc-500">Post your edit on TikTok</span>
          </div>

          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tiktok.com/@handle/video/..."
            className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/20 rounded-xl mb-3"
          />

          {/* Optional thumbnail */}
          <div className="mb-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2" style={{ fontFamily: "Teko, sans-serif" }}>
              Thumbnail <span className="text-zinc-600">(optional)</span>
            </p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailSelect} />
            {thumbnailPreview ? (
              <div className="relative w-full h-28 rounded-xl overflow-hidden border border-white/10">
                <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white text-xs"
                >×</button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-xl flex flex-col items-center gap-1.5 transition-all"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}
              >
                <Camera className="w-5 h-5 text-zinc-500" />
                <span className="text-[10px] text-zinc-500">Add a cover image for your edit</span>
              </button>
            )}
          </div>

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

      {/* Chat */}
      {battleId && (
        <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <CashBattleChat
            battleId={battleId}
            challengerId={battle.challenger_id}
            opponentId={battle.opponent_id}
          />
        </div>
      )}

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
        <Avatar className={`w-14 h-14 ring-2 ${ring}`}>
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
      <span className={`text-[13px] font-black truncate max-w-[80px] uppercase ${textColor}`} style={{ fontFamily: "Teko, sans-serif" }}>
        {username}
      </span>
    </div>
  );
}

function EditBlock({ username, color, thumbnailUrl, submissionUrl, submitted, isCompleted }: {
  username: string; color: "blue" | "red"; thumbnailUrl: string | null; submissionUrl: string | null; submitted: boolean; isCompleted: boolean;
}) {
  const borderColor = color === "blue" ? "rgba(59,130,246,0.3)" : "rgba(239,68,68,0.3)";
  const accentColor = color === "blue" ? "#3b82f6" : "#ef4444";
  const labelColor = color === "blue" ? "text-blue-400" : "text-red-400";

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${borderColor}` }}>
      {/* Thumbnail area */}
      <div className="aspect-[9/12] relative flex items-center justify-center" style={{ background: `linear-gradient(180deg, ${accentColor}08 0%, transparent 100%)` }}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={`${username}'s edit`} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center px-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${accentColor}15` }}>
              {submitted ? <CheckCircle className="w-5 h-5" style={{ color: accentColor }} /> : <Zap className="w-5 h-5 text-zinc-600" />}
            </div>
            <span className="text-[10px] text-zinc-600">
              {submitted ? "Edit submitted" : "Awaiting submission"}
            </span>
          </div>
        )}
        {/* Overlay label */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
          <p className={`text-[11px] font-black uppercase truncate ${labelColor}`} style={{ fontFamily: "Teko, sans-serif" }}>
            {username}
          </p>
        </div>
      </div>
      {/* Watch button */}
      {submissionUrl && isCompleted && (
        <a href={submissionUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all"
          style={{ background: `${accentColor}15`, color: accentColor }}>
          <ExternalLink className="w-3 h-3" /> Watch
        </a>
      )}
    </div>
  );
}
