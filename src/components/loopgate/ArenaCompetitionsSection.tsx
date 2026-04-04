import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Users, Music, Crown, Clock, ChevronRight, Plus, Gavel, Vote, Play } from "lucide-react";
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

function LeagueBadge({ league }: { league: string }) {
  const config: Record<string, { label: string; border: string; text: string; bg: string }> = {
    open: {
      label: "OPEN",
      border: "border-white/20",
      text: "text-white/80",
      bg: "bg-white/[0.06]",
    },
    pro: {
      label: "PRO",
      border: "border-blue-400/30",
      text: "text-blue-300",
      bg: "bg-blue-500/[0.08]",
    },
    elite: {
      label: "ELITE",
      border: "border-amber-400/30",
      text: "text-amber-300",
      bg: "bg-amber-500/[0.08]",
    },
  };
  const c = config[league] || config.open;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded ${c.border} ${c.bg} backdrop-blur-sm`}>
      <div className={`w-1 h-1 rounded-full ${league === 'elite' ? 'bg-amber-400' : league === 'pro' ? 'bg-blue-400' : 'bg-white/50'}`} />
      <span className={`text-[8px] font-bold uppercase tracking-[0.12em] ${c.text}`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {c.label}
      </span>
    </div>
  );
}

function ScoringBadge({ mode }: { mode: string }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/50 backdrop-blur-sm border border-white/[0.06] rounded">
      {mode === "judged" ? <Gavel className="w-2.5 h-2.5 text-white/50" /> : <Vote className="w-2.5 h-2.5 text-white/50" />}
      <span className="text-[8px] font-bold uppercase tracking-wider text-white/50">
        {mode === "judged" ? "Judged" : "Votes"}
      </span>
    </div>
  );
}

function CompetitionCard({ comp, onJoin }: { comp: Competition; onJoin: (id: string) => void }) {
  const navigate = useNavigate();
  const spotsLeft = comp.max_participants - comp.participant_count;
  const fillPct = Math.min(100, (comp.participant_count / comp.max_participants) * 100);
  const isLobby = comp.status === 'lobby' || comp.status === 'pending';
  const isLive = comp.status === 'live';

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/hosted-comp/${comp.slug || comp.id}`)}
      className="shrink-0 w-[280px] bg-surface-1 border border-white/[0.06] overflow-hidden group touch-manipulation rounded-xl cursor-pointer"
      style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
    >
      {/* Cover */}
      <div className="relative h-32 overflow-hidden">
        {comp.cover_image_url ? (
          <img src={comp.cover_image_url} alt={comp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/[0.03] via-surface-2 to-black flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white/[0.06]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-black/40 to-transparent" />

        {/* Status indicator */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <LeagueBadge league={comp.league_suggestion} />
        </div>

        <div className="absolute top-2.5 right-2.5">
          <ScoringBadge mode={comp.scoring_mode} />
        </div>

        {/* Lobby/Live pill */}
        {(isLobby || isLive) && (
          <div className="absolute bottom-2.5 right-2.5">
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
              isLobby 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLobby ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
              {isLobby ? 'In Lobby' : 'Live'}
            </div>
          </div>
        )}

        {/* Host */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <Avatar className="w-5 h-5 border border-white/20">
            <AvatarImage src={comp.host_avatar_url || ""} />
            <AvatarFallback className="text-[7px] bg-black/60 text-white font-bold">
              {comp.host_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[9px] font-bold text-white/80 drop-shadow-lg">@{comp.host_name}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2.5">
        <h3 className="text-[14px] font-bold text-foreground truncate leading-tight tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          {comp.name}
        </h3>

        {comp.song_name && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Music className="w-3 h-3 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{comp.song_name}</span>
          </div>
        )}

        {/* Slots bar */}
        <div>
          <div className="flex items-center justify-between text-[9px] mb-1.5">
            <span className="text-muted-foreground font-bold flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />
              {comp.participant_count}/{comp.max_participants}
            </span>
            <span className={`font-bold tabular-nums ${spotsLeft <= 5 ? "text-red-400" : "text-white/50"}`}>
              {spotsLeft > 0 ? `${spotsLeft} spots left` : "FULL"}
            </span>
          </div>
          <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-white/20 to-white/40 rounded-full"
            />
          </div>
        </div>

        {/* Rewards */}
        <div className="flex items-center justify-between">
          {comp.index_reward_pool > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-gold">
              <Trophy className="w-3 h-3" />
              +{comp.index_reward_pool} IDX
            </span>
          )}
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
            <Clock className="w-2.5 h-2.5" />
            {formatDistanceToNow(new Date(comp.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onJoin(comp.id); }}
          disabled={spotsLeft <= 0}
          className="w-full py-2.5 rounded-xl font-display text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed bg-white text-black font-bold hover:bg-white/90 active:bg-white/80"
          style={{ boxShadow: "0 2px 12px rgba(255,255,255,0.08)" }}
        >
          {spotsLeft <= 0 ? "Full" : isLobby ? (
            <>
              <Play className="w-3 h-3" /> Join Lobby
            </>
          ) : (
            <>
              Join Competition <ChevronRight className="w-3 h-3" />
            </>
          )}
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
      .in("status", ["live", "pending", "lobby"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) setComps(data as any as Competition[]);
    setLoading(false);
  };

  const handleJoin = async (compId: string) => {
    if (!user || !profile) { navigate("/start"); return; }

    const { data: existing } = await supabase
      .from("hosted_competition_participants")
      .select("id")
      .eq("competition_id", compId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      navigate(`/hosted-comp/${compId}`);
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

    toast.success("🏆 You're in!");
    navigate(`/hosted-comp/${compId}`);
    fetchComps();
  };

  const liveCount = comps.filter(c => c.status === "live").length;
  const lobbyCount = comps.filter(c => c.status === "lobby" || c.status === "pending").length;

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
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {liveCount} Live
            </span>
          )}
          {lobbyCount > 0 && liveCount === 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {lobbyCount} Open
            </span>
          )}
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:brightness-110"
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
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2].map(i => (
            <div key={i} className="w-[280px] h-[300px] shrink-0 bg-surface-1 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : comps.length > 0 ? (
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {comps.map((comp) => (
            <CompetitionCard key={comp.id} comp={comp} onJoin={handleJoin} />
          ))}
        </div>
      ) : (
        <div className="px-4">
          <div className="bg-surface-1 border border-white/[0.06] border-dashed p-8 text-center rounded-xl">
            <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 rounded-xl">
              <Trophy className="w-6 h-6 text-white/[0.15]" />
            </div>
            <p className="text-[13px] text-muted-foreground font-medium mb-1">No competitions yet</p>
            <p className="text-[11px] text-muted-foreground/50 mb-4">Be the first to launch one</p>
            <button
              onClick={onCreateClick}
              className="px-5 py-2.5 rounded-xl text-[12px] font-bold bg-white text-black hover:bg-white/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5 inline" /> Create Competition
            </button>
          </div>
        </div>
      )}
    </motion.section>
  );
}
