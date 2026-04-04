import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Music, Calendar, Image, FileText, Users, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (compId: string) => void;
}

const LEAGUE_OPTIONS = [
  { value: "open", label: "Open League", desc: "Anyone can join" },
  { value: "pro", label: "Pro League", desc: "Recommended for Pro+" },
  { value: "elite", label: "Elite League", desc: "Top-tier editors only" },
];

const SCORING_OPTIONS = [
  { value: "judged", label: "Judge Scored", desc: "Loopgate judges rate with QOI", icon: "⚖️" },
  { value: "community", label: "Community Vote", desc: "Editors vote on best edit", icon: "🗳️" },
];

export default function CreateCompetitionModal({ isOpen, onClose, onSuccess }: Props) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [songName, setSongName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [league, setLeague] = useState("open");
  const [scoringMode, setScoringMode] = useState("judged");
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [coverUrl, setCoverUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !profile) { navigate("/start"); return; }
    if (!name.trim()) { toast.error("Give your competition a name"); return; }
    if (!songName.trim()) { toast.error("Add a song or theme"); return; }

    setSubmitting(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

      const { data, error } = await supabase
        .from("hosted_competitions")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          host_user_id: user.id,
          host_name: profile.username,
          host_avatar_url: profile.avatar_url,
          song_name: songName.trim(),
          league_suggestion: league,
          scoring_mode: scoringMode,
          max_participants: Math.min(maxParticipants, 100),
          cover_image_url: coverUrl.trim() || null,
          submission_deadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          status: "live",
          slug,
          format: "battle_royale",
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      // Auto-join as host
      await supabase.from("hosted_competition_participants").insert({
        competition_id: data.id,
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
      } as any);

      toast.success("🏆 Competition created!");
      onSuccess?.(data.id);
      onClose();
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create competition");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName(""); setDescription(""); setSongName(""); setDeadline("");
    setLeague("open"); setScoringMode("judged"); setMaxParticipants(100); setCoverUrl("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-background border border-border/40 rounded-t-2xl sm:rounded-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" />
              <h2 className="text-sm font-bold text-foreground">Create Competition</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-surface-1 rounded-full transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Competition Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Friday Night Edits"
                maxLength={60}
                className="w-full bg-surface-1 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/40 transition-colors"
              />
            </div>

            {/* Song / Theme */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Music className="w-3 h-3" /> Song / Theme *
              </label>
              <input
                value={songName}
                onChange={(e) => setSongName(e.target.value)}
                placeholder="e.g. Travis Scott — FE!N"
                maxLength={100}
                className="w-full bg-surface-1 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/40 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Description
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

            {/* Cover Image URL */}
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

            {/* League Suggestion */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
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
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                How winners are decided
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {SCORING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setScoringMode(opt.value)}
                    className={`px-3 py-3 rounded-lg text-left transition-all border ${
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
                {[10, 25, 50, 100].map((n) => (
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

            {/* Reward Preview */}
            <div className="bg-surface-1 border border-border/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Index Reward Pool</span>
                <span className="text-[10px] text-muted-foreground/60">Scales with editors</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="font-display text-2xl text-gold">
                  +{maxParticipants >= 100 ? 500 : maxParticipants >= 75 ? 350 : maxParticipants >= 50 ? 200 : maxParticipants >= 25 ? 100 : maxParticipants >= 10 ? 50 : maxParticipants >= 5 ? 25 : maxParticipants >= 2 ? 10 : 0}
                </span>
                <span className="text-[10px] text-muted-foreground">IDX split among top editors</span>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || !songName.trim()}
              className="w-full py-3 rounded-lg font-display text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-gold/80 to-amber-500/80 text-black font-bold hover:from-gold hover:to-amber-500 active:from-gold/60 active:to-amber-500/60"
              style={{ boxShadow: "0 4px 20px rgba(212,175,55,0.2)" }}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
