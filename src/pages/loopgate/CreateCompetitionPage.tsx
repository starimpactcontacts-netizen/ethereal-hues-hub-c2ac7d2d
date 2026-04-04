import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trophy, ArrowLeft, Zap, Settings2, ImagePlus, Calendar,
  Users, DollarSign, Loader2, Crown, Medal, Award, Hash, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRef } from "react";
import { toast } from "sonner";

const LEAGUE_OPTIONS = [
  { value: "open", label: "Open", desc: "Anyone can join" },
  { value: "pro", label: "Pro", desc: "Pro+ editors" },
  { value: "elite", label: "Elite", desc: "Top-tier only" },
];

const SCORING_OPTIONS = [
  { value: "judged", label: "Judge Scored", desc: "QOI rated", icon: "⚖️" },
  { value: "community", label: "Community Vote", desc: "Editors vote", icon: "🗳️" },
];

const MAX_OPTIONS = [10, 25, 50, 100];

const REWARD_PRESETS = [
  { label: "Winner Takes All", distribution: [{ rank: 1, pct: 100 }] },
  { label: "Top 3", distribution: [{ rank: 1, pct: 60 }, { rank: 2, pct: 25 }, { rank: 3, pct: 15 }] },
  { label: "Top 5", distribution: [{ rank: 1, pct: 40 }, { rank: 2, pct: 25 }, { rank: 3, pct: 15 }, { rank: 4, pct: 10 }, { rank: 5, pct: 10 }] },
  { label: "Top 10", distribution: Array.from({ length: 10 }, (_, i) => ({ rank: i + 1, pct: i === 0 ? 25 : i < 3 ? 15 : i < 5 ? 10 : 5 })) },
];

function getIndexPool(max: number) {
  if (max >= 100) return 500;
  if (max >= 75) return 350;
  if (max >= 50) return 200;
  if (max >= 25) return 100;
  if (max >= 10) return 50;
  if (max >= 5) return 25;
  return 10;
}

export default function CreateCompetitionPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Mode toggle
  const [mode, setMode] = useState<"quick" | "advanced">("quick");

  // Shared fields
  const [name, setName] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [theme, setTheme] = useState("");

  // Advanced fields
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [league, setLeague] = useState("open");
  const [scoringMode, setScoringMode] = useState("judged");
  const [maxParticipants, setMaxParticipants] = useState(100);

  // Rewards
  const [rewardType, setRewardType] = useState<"index" | "cash" | "both">("index");
  const [cashPrize, setCashPrize] = useState("");
  const [rewardPreset, setRewardPreset] = useState(0); // Winner Takes All default

  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const indexPool = getIndexPool(maxParticipants);
  const currentPreset = REWARD_PRESETS[rewardPreset];

  const handleSubmit = async () => {
    if (!user || !profile) { navigate("/start"); return; }
    if (!name.trim()) { toast.error("Name your competition"); return; }

    setSubmitting(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
      const cashCents = rewardType !== "index" ? Math.round(parseFloat(cashPrize || "0") * 100) : 0;

      const prizeDistribution = currentPreset.distribution.map((d) => ({
        rank: d.rank,
        index: Math.round(indexPool * (d.pct / 100)),
        ...(cashCents > 0 ? { cash_cents: Math.round(cashCents * (d.pct / 100)) } : {}),
      }));

      const { data, error } = await supabase
        .from("hosted_competitions")
        .insert({
          name: name.trim(),
          description: mode === "advanced" ? (description.trim() || null) : null,
          host_user_id: user.id,
          host_name: profile.username,
          host_avatar_url: profile.avatar_url,
          song_name: theme.trim() || null,
          league_suggestion: mode === "advanced" ? league : "open",
          scoring_mode: mode === "advanced" ? scoringMode : "judged",
          max_participants: mode === "advanced" ? Math.min(maxParticipants, 100) : 100,
          cover_image_url: coverUrl.trim() || null,
          submission_deadline: mode === "advanced" && deadline ? new Date(deadline).toISOString() : null,
          status: "live",
          slug,
          format: "battle_royale",
          reward_type: rewardType,
          cash_prize_cents: cashCents,
          prize_distribution: prizeDistribution,
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      await supabase.from("hosted_competition_participants").insert({
        competition_id: data.id,
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
      } as any);

      toast.success("🏆 Competition launched!");
      navigate("/arena");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/arena")} className="p-1.5 hover:bg-surface-1 rounded-full transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <Trophy className="w-4 h-4 text-gold" />
        <h1 className="text-sm font-bold text-foreground">Create Competition</h1>
      </div>

      {/* Mode Toggle */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex bg-surface-1 border border-border/30 rounded-lg p-1 gap-1">
          <button
            onClick={() => setMode("quick")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
              mode === "quick"
                ? "bg-gold/15 text-gold border border-gold/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-3 h-3" /> Quick Launch
          </button>
          <button
            onClick={() => setMode("advanced")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
              mode === "advanced"
                ? "bg-gold/15 text-gold border border-gold/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings2 className="w-3 h-3" /> Advanced
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4 pt-2">
        {/* Name */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Competition Name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Best Squid Game Edit"
            maxLength={60}
            className="w-full bg-surface-1 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        {/* Theme (optional) */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3 h-3" /> Theme / Topic
          </label>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. Squid Game, Travis Scott, Anime..."
            maxLength={100}
            className="w-full bg-surface-1 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/40 transition-colors"
          />
          <span className="text-[9px] text-muted-foreground/50 mt-1 block">Optional — leave blank for open theme</span>
        </div>

        {/* Cover Image */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Image className="w-3 h-3" /> Cover Image URL
          </label>
          <input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-surface-1 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        {/* ═══ REWARD OPTIONS ═══ */}
        <div className="pt-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
            Reward Type
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["index", "cash", "both"] as const).map((rt) => (
              <button
                key={rt}
                onClick={() => setRewardType(rt)}
                className={`py-2 rounded-lg text-center transition-all border ${
                  rewardType === rt
                    ? rt === "cash" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : rt === "both" ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-gold/10 border-gold/30 text-gold"
                    : "bg-surface-1 border-border/30 text-muted-foreground hover:border-border/60"
                }`}
              >
                <span className="text-[11px] font-bold block">
                  {rt === "index" ? "🏅 Index" : rt === "cash" ? "💰 Cash" : "🏅💰 Both"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash Amount */}
        {rewardType !== "index" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3 h-3" /> Cash Prize (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">$</span>
              <input
                type="number"
                value={cashPrize}
                onChange={(e) => setCashPrize(e.target.value)}
                placeholder="50.00"
                min="1"
                step="0.01"
                className="w-full bg-surface-1 border border-border/40 rounded-lg pl-7 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>
          </motion.div>
        )}

        {/* Prize Distribution */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
            Prize Split
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {REWARD_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => setRewardPreset(i)}
                className={`px-3 py-2.5 rounded-lg text-left transition-all border ${
                  rewardPreset === i
                    ? "bg-gold/10 border-gold/30"
                    : "bg-surface-1 border-border/30 hover:border-border/60"
                }`}
              >
                <span className={`text-[11px] font-bold block ${rewardPreset === i ? "text-gold" : "text-foreground"}`}>
                  {preset.label}
                </span>
                <span className="text-[8px] text-muted-foreground">
                  {preset.distribution.length === 1 ? "1st gets everything" : `Top ${preset.distribution.length} rewarded`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Prize Preview */}
        <div className="bg-surface-1 border border-border/30 rounded-lg p-3 space-y-1.5">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Prize Breakdown</span>
          {currentPreset.distribution.slice(0, 5).map((d) => {
            const idxShare = Math.round(indexPool * (d.pct / 100));
            const cashCents = rewardType !== "index" ? Math.round(parseFloat(cashPrize || "0") * 100 * (d.pct / 100)) : 0;
            return (
              <div key={d.rank} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px]">
                  {d.rank === 1 ? <Crown className="w-3 h-3 text-gold" /> : d.rank === 2 ? <Medal className="w-3 h-3 text-slate-300" /> : d.rank === 3 ? <Medal className="w-3 h-3 text-amber-600" /> : <Award className="w-3 h-3 text-muted-foreground" />}
                  <span className="text-muted-foreground font-medium">#{d.rank}</span>
                </span>
                <div className="flex items-center gap-2">
                  {(rewardType === "index" || rewardType === "both") && (
                    <span className="text-[11px] font-bold text-gold">+{idxShare} IDX</span>
                  )}
                  {cashCents > 0 && (
                    <span className="text-[11px] font-bold text-emerald-400">${(cashCents / 100).toFixed(2)}</span>
                  )}
                </div>
              </div>
            );
          })}
          {currentPreset.distribution.length > 5 && (
            <span className="text-[9px] text-muted-foreground/50">+{currentPreset.distribution.length - 5} more places...</span>
          )}
        </div>

        {/* ═══ ADVANCED SETTINGS ═══ */}
        {mode === "advanced" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 pt-2 border-t border-border/20"
          >
            {/* Description */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rules, vibes, anything editors should know..."
                maxLength={500}
                rows={3}
                className="w-full bg-surface-1 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/40 transition-colors resize-none"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Submission Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-surface-1 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-gold/40 transition-colors"
              />
            </div>

            {/* League */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                League Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {LEAGUE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLeague(opt.value)}
                    className={`px-2.5 py-2 rounded-lg text-center transition-all border ${
                      league === opt.value
                        ? "bg-gold/10 border-gold/30 text-gold"
                        : "bg-surface-1 border-border/30 text-muted-foreground hover:border-border/60"
                    }`}
                  >
                    <span className="text-[11px] font-bold block">{opt.label}</span>
                    <span className="text-[8px] opacity-60">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scoring Mode */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                How Winners Are Decided
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {SCORING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setScoringMode(opt.value)}
                    className={`px-3 py-2.5 rounded-lg text-left transition-all border ${
                      scoringMode === opt.value
                        ? "bg-gold/10 border-gold/30"
                        : "bg-surface-1 border-border/30 hover:border-border/60"
                    }`}
                  >
                    <span className="text-base block mb-0.5">{opt.icon}</span>
                    <span className={`text-[11px] font-bold block ${scoringMode === opt.value ? "text-gold" : "text-foreground"}`}>
                      {opt.label}
                    </span>
                    <span className="text-[8px] text-muted-foreground">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Participants */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Max Editors
              </label>
              <div className="flex items-center gap-2">
                {MAX_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setMaxParticipants(n)}
                    className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all border ${
                      maxParticipants === n
                        ? "bg-gold/10 border-gold/30 text-gold"
                        : "bg-surface-1 border-border/30 text-muted-foreground hover:border-border/60"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick mode defaults info */}
        {mode === "quick" && (
          <div className="bg-surface-1/50 border border-border/20 rounded-lg p-3">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Quick Launch Defaults</span>
            <div className="flex flex-wrap gap-2">
              {[
                "Open League", "Judge Scored", "100 Max Editors", "No Deadline"
              ].map((d) => (
                <span key={d} className="text-[9px] text-muted-foreground/60 bg-surface-2 px-2 py-0.5 rounded-full">{d}</span>
              ))}
            </div>
          </div>
        )}

        {/* Launch Button */}
        <div className="pt-2 pb-4">
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="w-full py-3.5 rounded-xl font-display text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #B8860B)",
              color: "#000",
              boxShadow: "0 4px 24px rgba(212,175,55,0.3)",
            }}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                Launch Competition
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
