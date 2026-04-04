import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Users, Music, Crown, Clock, ChevronRight, Plus, Gavel, Vote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Competition {
  id: string;
  name: string;
  description: string | null;
  host_user_id: string;
  host_name: string;
  host_avatar_url: string | null;
  song_name: string | null;
  league_suggestion: string;
  scoring_mode: string;
  max_participants: number;
  participant_count: number;
  index_reward_pool: number;
  cover_image_url: string | null;
  submission_deadline: string | null;
  status: string;
  slug: string | null;
  created_at: string;
}

const LEAGUE_COLORS: Record<string, string> = {
  open: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pro: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  elite: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

function CompetitionCard({ comp, onJoin }: { comp: Competition; onJoin: (id: string) => void }) {
  const navigate = useNavigate();
  const spotsLeft = comp.max_participants - comp.participant_count;
  const fillPct = Math.min(100, (comp.participant_count / comp.max_participants) * 100);
  const leagueCls = LEAGUE_COLORS[comp.league_suggestion] || LEAGUE_COLORS.open;
  const isDeadlinePassed = comp.submission_deadline && new Date(comp.submission_deadline) < new Date();

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="shrink-0 w-[260px] bg-surface-1 border border-border/40 overflow-hidden group touch-manipulation rounded-lg"
    >
      {/* Cover / header */}
      <div className="relative h-28 overflow-hidden">
        {comp.cover_image_url ? (
          <img src={comp.cover_image_url} alt={comp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/10 via-surface-2 to-purple-900/20 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-gold/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-transparent" />

        {/* League badge */}
        <div className={`absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${leagueCls}`}>
          {comp.league_suggestion} league
        </div>

        {/* Scoring badge */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/70 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
          {comp.scoring_mode === "judged" ? <Gavel className="w-2.5 h-2.5" /> : <Vote className="w-2.5 h-2.5" />}
          {comp.scoring_mode === "judged" ? "Judged" : "Votes"}
        </div>

        {/* Host */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <Avatar className="w-5 h-5 border border-white/20">
            <AvatarImage src={comp.host_avatar_url || ""} />
            <AvatarFallback className="text-[7px] bg-black/40 text-white font-bold">
              {comp.host_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[9px] font-bold text-white drop-shadow-lg">@{comp.host_name}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="text-[13px] font-bold text-foreground truncate leading-tight">{comp.name}</h3>

        {comp.song_name && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Music className="w-3 h-3 shrink-0" />
            <span className="truncate">{comp.song_name}</span>
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-[9px] mb-1">
            <span className="text-muted-foreground font-bold flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />
              {comp.participant_count}/{comp.max_participants} editors
            </span>
            <span className={`font-bold ${spotsLeft <= 5 ? "text-red-400" : "text-emerald-400"}`}>
              {spotsLeft > 0 ? `${spotsLeft} spots` : "FULL"}
            </span>
          </div>
          <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold/60 to-gold rounded-full transition-all duration-500"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* Rewards + Deadline */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] font-bold text-gold">
            <Trophy className="w-3 h-3" />
            +{comp.index_reward_pool} IDX
          </span>
          {comp.submission_deadline && !isDeadlinePassed && (
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              {formatDistanceToNow(new Date(comp.submission_deadline), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onJoin(comp.id); }}
          disabled={spotsLeft <= 0 || !!isDeadlinePassed}
          className="w-full py-2 rounded-lg font-display text-[11px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold hover:from-emerald-400 hover:to-emerald-500 active:from-emerald-600 active:to-emerald-700"
          style={{ boxShadow: "0 2px 12px rgba(16,185,129,0.25)" }}
        >
          {spotsLeft <= 0 ? "Full" : isDeadlinePassed ? "Closed" : "Join Competition"}
          {!isDeadlinePassed && spotsLeft > 0 && <ChevronRight className="w-3 h-3" />}
        </button>
      </div>
    </motion.div>
  );
}

export default function ArenaCompetitionsSection({ onCreateClick }: { onCreateClick: () => void }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [comps, setComps] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComps();
  }, []);

  const fetchComps = async () => {
    const { data, error } = await supabase
      .from("hosted_competitions")
      .select("id, name, description, host_user_id, host_name, host_avatar_url, song_name, league_suggestion, scoring_mode, max_participants, participant_count, index_reward_pool, cover_image_url, submission_deadline, status, slug, created_at")
      .in("status", ["live", "pending"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) setComps(data as any as Competition[]);
    setLoading(false);
  };

  const handleJoin = async (compId: string) => {
    if (!user || !profile) { navigate("/start"); return; }

    // Check if already joined
    const { data: existing } = await supabase
      .from("hosted_competition_participants")
      .select("id")
      .eq("competition_id", compId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      toast("You're already in this competition!");
      return;
    }

    const { error } = await supabase.from("hosted_competition_participants").insert({
      competition_id: compId,
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
    } as any);

    if (error) {
      toast.error(error.message || "Failed to join");
      return;
    }

    toast.success("🏆 You're in! Get editing.");
    fetchComps(); // Refresh counts
  };

  const liveCount = comps.filter(c => c.status === "live").length;

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-gold" />
          <span className="text-[15px] font-extrabold text-foreground tracking-tight" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            Competitions
          </span>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {liveCount} Live
            </span>
          )}
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #B8860B)",
            color: "#000",
            boxShadow: "0 2px 10px rgba(212,175,55,0.25)",
          }}
        >
          <Plus className="w-3 h-3" /> Create
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2].map(i => (
            <div key={i} className="w-[260px] h-[260px] shrink-0 bg-surface-1 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : comps.length > 0 ? (
        <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2">
          {comps.map((comp) => (
            <CompetitionCard key={comp.id} comp={comp} onJoin={handleJoin} />
          ))}
        </div>
      ) : (
        <div className="px-4">
          <div className="bg-surface-1 border border-gold/15 border-dashed p-8 text-center rounded-lg">
            <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3 rounded-lg">
              <Trophy className="w-6 h-6 text-gold/30" />
            </div>
            <p className="text-[13px] text-muted-foreground font-medium mb-1">No competitions yet</p>
            <p className="text-[11px] text-muted-foreground/50 mb-4">Be the first to launch one</p>
            <button
              onClick={onCreateClick}
              className="px-5 py-2 rounded-lg text-[12px] font-bold bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5 inline" /> Create Competition
            </button>
          </div>
        </div>
      )}
    </motion.section>
  );
}
