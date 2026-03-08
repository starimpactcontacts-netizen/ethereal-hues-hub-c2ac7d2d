import { motion } from "framer-motion";
import { Users, Clock, Shield, Trophy, Swords, Play, Eye, CheckCircle, Crown, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SanctionedTournament } from "@/hooks/useSanctionedTournaments";

const teko = { fontFamily: "Teko, sans-serif" };

interface SanctionedTournamentCardProps {
  tournament: SanctionedTournament;
  onClick: () => void;
}

const phaseConfig: Record<string, { label: string; color: string; bg: string; glow?: string; dot?: boolean }> = {
  approved: { label: "OPEN", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/40", glow: "shadow-emerald-500/20" },
  ready_up: { label: "READY UP", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/40", glow: "shadow-amber-500/20" },
  live: { label: "LIVE", color: "text-red-400", bg: "bg-red-500/20 border-red-500/40", glow: "shadow-red-500/30", dot: true },
  bracket: { label: "BRACKET", color: "text-sky-400", bg: "bg-sky-500/20 border-sky-500/40", glow: "shadow-sky-500/20" },
  completed: { label: "COMPLETE", color: "text-gold", bg: "bg-gold/20 border-gold/40", glow: "shadow-gold/20" },
};

function formatTimeLeft(endDate: string | null): string {
  if (!endDate) return "TBD";
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getCtaConfig(status: string): { label: string; icon: React.ElementType } {
  switch (status) {
    case "approved": return { label: "JOIN NOW", icon: Zap };
    case "ready_up": return { label: "READY UP", icon: Shield };
    case "live": return { label: "ENTER", icon: Play };
    case "bracket":
    case "completed": return { label: "VIEW", icon: Eye };
    default: return { label: "VIEW", icon: Eye };
  }
}

export default function SanctionedTournamentCard({ tournament, onClick }: SanctionedTournamentCardProps) {
  const phase = phaseConfig[tournament.status] || phaseConfig.approved;
  const cta = getCtaConfig(tournament.status);
  const CtaIcon = cta.icon;
  const isCrewVsCrew = tournament.tournament_mode === "crew_vs_crew";
  const isLive = tournament.status === "live" || tournament.status === "bracket";
  const isComplete = tournament.status === "completed";
  
  const playerPercentage = (tournament.player_count / tournament.max_players) * 100;
  const totalPrize = tournament.index_prize || (
    (tournament.first_place_index || 0) + 
    (tournament.second_place_index || 0) + 
    (tournament.third_place_index || 0)
  );

  const accentColor = isCrewVsCrew ? "red" : "gold";

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-[280px] shrink-0 cursor-pointer group relative"
    >
      {/* Outer glow on hover */}
      <div className={`absolute -inset-px rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        isCrewVsCrew ? "bg-gradient-to-b from-red-500/30 to-transparent" : "bg-gradient-to-b from-gold/30 to-transparent"
      }`} />

      <div className={`relative overflow-hidden border transition-all duration-300 ${
        isCrewVsCrew 
          ? "border-red-500/20 group-hover:border-red-500/50" 
          : "border-gold/20 group-hover:border-gold/50"
      } bg-card`}>
        
        {/* ━━━ POSTER HERO ━━━ */}
        <div className="relative h-36 overflow-hidden">
          {tournament.poster_url ? (
            <img 
              src={tournament.poster_url} 
              alt={tournament.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className={`w-full h-full ${
              isCrewVsCrew 
                ? "bg-gradient-to-br from-red-950 via-red-900/50 to-card" 
                : "bg-gradient-to-br from-amber-950 via-amber-900/30 to-card"
            }`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                {isCrewVsCrew ? (
                  <Swords className="w-20 h-20 text-red-400" />
                ) : (
                  <Shield className="w-20 h-20 text-gold" />
                )}
              </div>
            </div>
          )}
          
          {/* Heavy gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          
          {/* Top badges row */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2.5">
            <div className="flex items-center gap-1.5">
              {isCrewVsCrew ? (
                <Swords className="w-3 h-3 text-red-400 drop-shadow-lg" />
              ) : (
                <Shield className="w-3 h-3 text-gold drop-shadow-lg" />
              )}
              <span className={`text-[10px] font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                isCrewVsCrew ? "text-red-400" : "text-gold"
              }`} style={teko}>
                {isCrewVsCrew ? "Unit vs Unit" : "Sanctioned"}
              </span>
            </div>
            
            <div className={`flex items-center gap-1 px-2 py-0.5 border backdrop-blur-sm ${phase.bg}`}>
              {phase.dot && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
              <span className={`text-[9px] font-black uppercase tracking-wider ${phase.color}`} style={teko}>
                {phase.label}
              </span>
            </div>
          </div>
          
          {/* Prize badge - bottom right of poster */}
          {totalPrize > 0 && (
            <div className="absolute bottom-2 right-2.5 flex items-center gap-1 px-2 py-0.5 bg-card/80 backdrop-blur-sm border border-gold/30">
              <Trophy className="w-3 h-3 text-gold" />
              <span className="text-[11px] font-black text-gold" style={teko}>{totalPrize} IDX</span>
            </div>
          )}

          {/* Live pulse ring */}
          {isLive && (
            <div className="absolute top-2.5 right-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-30" />
            </div>
          )}
        </div>
        
        {/* ━━━ CONTENT ━━━ */}
        <div className="p-3 pt-1">
          {/* Title */}
          <h3 className="text-[15px] font-black uppercase tracking-wide text-foreground leading-tight mb-1 line-clamp-2" style={teko}>
            {tournament.name}
          </h3>
          
          {/* Host unit */}
          {isCrewVsCrew ? (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <Avatar className="w-4 h-4 border border-gold/30">
                  <AvatarImage src={tournament.crew_avatar_url || undefined} />
                  <AvatarFallback className="bg-gold/10 text-gold text-[7px]"><Shield className="w-2 h-2" /></AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground truncate">{tournament.crew_name}</span>
              </div>
              <span className="text-[9px] font-black text-red-400" style={teko}>VS</span>
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <Avatar className="w-4 h-4 border border-red-500/30">
                  <AvatarImage src={tournament.challenged_crew_avatar_url || undefined} />
                  <AvatarFallback className="bg-red-500/10 text-red-400 text-[7px]"><Shield className="w-2 h-2" /></AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground truncate">{tournament.challenged_crew_name || "TBD"}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mb-3">
              {tournament.crew_avatar_url ? (
                <img src={tournament.crew_avatar_url} alt="" className="w-4 h-4 rounded-full object-cover border border-gold/20" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
              )}
              <span className="text-[10px] text-muted-foreground truncate">{tournament.crew_name}</span>
            </div>
          )}
          
          {/* Editor count + progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {tournament.player_count}/{tournament.max_players} editors
              </span>
              {tournament.status === "ready_up" && tournament.ready_up_deadline && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeLeft(tournament.ready_up_deadline)}
                </span>
              )}
              {tournament.status === "live" && tournament.submission_deadline && (
                <span className="text-red-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeLeft(tournament.submission_deadline)}
                </span>
              )}
              {!["ready_up", "live"].includes(tournament.status) && (
                <span className="text-muted-foreground/60">min {tournament.min_players}</span>
              )}
            </div>
            <div className="h-1.5 bg-muted/30 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(playerPercentage, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full ${
                  isCrewVsCrew 
                    ? "bg-gradient-to-r from-red-600 to-red-400" 
                    : "bg-gradient-to-r from-amber-600 to-gold"
                }`}
              />
            </div>
          </div>

          {/* Ready count indicator */}
          {tournament.status === "ready_up" && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 mb-3">
              <CheckCircle className="w-3 h-3" />
              <span className="font-semibold">{tournament.ready_count}/{tournament.min_players} ready</span>
            </div>
          )}

          {/* Challenge pending */}
          {isCrewVsCrew && tournament.challenge_accepted === null && (
            <div className="flex items-center gap-1 text-[10px] text-amber-400 mb-3">
              <Clock className="w-3 h-3" />
              <span>Challenge pending</span>
            </div>
          )}

          {/* Winner badge for completed */}
          {isComplete && tournament.player_count > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-gold mb-3">
              <Crown className="w-3.5 h-3.5" />
              <span className="font-bold">Tournament Complete</span>
            </div>
          )}
          
          {/* CTA */}
          <button className={`w-full py-2.5 text-[13px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
            isCrewVsCrew
              ? "bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white group-hover:shadow-lg group-hover:shadow-red-500/30"
              : "bg-gradient-to-r from-amber-600 via-gold to-amber-600 text-background group-hover:shadow-lg group-hover:shadow-gold/30"
          }`} style={teko}>
            <CtaIcon className="w-4 h-4" />
            {cta.label}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
