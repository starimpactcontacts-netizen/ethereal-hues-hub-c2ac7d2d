import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Users, Music, Clock, ChevronRight, Plus, Gavel, Vote, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCompetitionsList, type Competition } from "@/hooks/useCompetitions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

function LeagueBadge({ league }: { league: string }) {
  const labels: Record<string, string> = { open: "OPEN LEAGUE", pro: "PRO LEAGUE", elite: "ELITE LEAGUE" };
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/[0.15] rounded-lg">
      <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/90" style={{ fontFamily: "'Teko', sans-serif" }}>
        {labels[league] || labels.open}
      </span>
    </div>
  );
}

function CompetitionCard({ comp, onJoin }: { comp: Competition; onJoin: (id: string) => void }) {
  const navigate = useNavigate();
  const spotsLeft = comp.max_players - comp.current_players;
  const fillPct = Math.min(100, (comp.current_players / comp.max_players) * 100);
  const isLobby = comp.status === "lobby";
  const isLive = comp.status === "live";

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/competition/${comp.slug || comp.id}`)}
      className="shrink-0 w-[280px] bg-surface-1 border border-white/[0.06] overflow-hidden group touch-manipulation rounded-xl cursor-pointer"
      style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
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

        <div className="absolute top-2.5 left-2.5"><LeagueBadge league={comp.league} /></div>

        {/* Status */}
        <div className="absolute bottom-2.5 right-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/[0.12]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-amber-300" style={{ fontFamily: "'Teko', sans-serif" }}>
              {isLobby ? "Awaiting Start" : "In Progress"}
            </span>
          </div>
        </div>

        {/* Creator */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <Avatar className="w-5 h-5 border border-white/20">
            <AvatarImage src={comp.creator_avatar_url || ""} />
            <AvatarFallback className="text-[7px] bg-black/60 text-white font-bold">
              {comp.creator_username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[9px] font-bold text-white/80 drop-shadow-lg">@{comp.creator_username}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2.5">
        <h3 className="text-[14px] font-bold text-foreground truncate leading-tight tracking-tight" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
          {comp.name}
        </h3>

        {comp.theme && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Music className="w-3 h-3 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{comp.theme}</span>
          </div>
        )}

        {/* Slots bar */}
        <div>
          <div className="flex items-center justify-between text-[9px] mb-1.5">
            <span className="text-muted-foreground font-bold flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />
              {comp.current_players}/{comp.max_players}
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

        {/* Rewards + time */}
        <div className="flex items-center justify-between">
          {comp.index_reward_pool > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-gold">
              <Trophy className="w-3 h-3" /> +{comp.index_reward_pool} IDX
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
          className="w-full py-3 rounded-xl uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed bg-emerald-500 text-white font-extrabold hover:bg-emerald-400 active:bg-emerald-600 text-[13px]"
          style={{ fontFamily: "'Teko', sans-serif", boxShadow: "0 4px 20px rgba(16,185,129,0.35)", letterSpacing: "0.15em" }}
        >
          {spotsLeft <= 0 ? "FULL" : (
            <><Play className="w-3.5 h-3.5" /> JOIN LOBBY</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default function ArenaCompetitionsSection({ onCreateClick }: { onCreateClick: () => void }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { competitions: comps, loading } = useCompetitionsList();

  const handleJoin = async (compId: string) => {
    if (!user || !profile) { navigate("/start"); return; }

    const { data: existing } = await supabase
      .from("competition_participants")
      .select("id")
      .eq("competition_id", compId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) { navigate(`/competition/${compId}`); return; }

    const { error } = await supabase.from("competition_participants").insert({
      competition_id: compId,
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
    });

    if (error) { toast.error(error.message || "Failed to join"); return; }
    toast.success("🏆 You're in!");
    navigate(`/competition/${compId}`);
  };

  const liveCount = comps.filter(c => c.status === "live").length;
  const lobbyCount = comps.filter(c => c.status === "lobby").length;

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-gold" />
          <span className="text-[15px] font-extrabold text-foreground tracking-tight" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            Competitions
          </span>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {liveCount} Live
            </span>
          )}
          {lobbyCount > 0 && liveCount === 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> {lobbyCount} Open
            </span>
          )}
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", color: "#000", boxShadow: "0 2px 10px rgba(212,175,55,0.25)" }}
        >
          <Plus className="w-3 h-3" /> Create
        </button>
      </div>

      {loading ? (
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2].map(i => (
            <div key={i} className="w-[280px] h-[300px] shrink-0 bg-surface-1 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : comps.length > 0 ? (
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {comps.map(comp => <CompetitionCard key={comp.id} comp={comp} onJoin={handleJoin} />)}
        </div>
      ) : (
        <div className="px-4">
          <div className="bg-surface-1 border border-white/[0.06] border-dashed p-8 text-center rounded-xl">
            <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 rounded-xl">
              <Trophy className="w-6 h-6 text-white/[0.15]" />
            </div>
            <p className="text-[13px] text-muted-foreground font-medium mb-1">No competitions yet</p>
            <p className="text-[11px] text-muted-foreground/50 mb-4">Be the first to launch one</p>
            <button onClick={onCreateClick} className="px-5 py-2.5 rounded-xl text-[12px] font-bold bg-white text-black hover:bg-white/90 transition-colors">
              <Plus className="w-3.5 h-3.5 mr-1.5 inline" /> Create Competition
            </button>
          </div>
        </div>
      )}
    </motion.section>
  );
}
