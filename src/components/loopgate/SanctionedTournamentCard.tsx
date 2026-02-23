import { motion } from "framer-motion";
import { Users, Clock, Shield, Trophy, Swords, Play, Eye, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SanctionedTournament } from "@/hooks/useSanctionedTournaments";

interface SanctionedTournamentCardProps {
  tournament: SanctionedTournament;
  onClick: () => void;
}

const phaseConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  approved: { label: "OPEN", color: "text-emerald-400", bgColor: "bg-emerald-500/20 border-emerald-500/40" },
  ready_up: { label: "READY UP", color: "text-amber-400", bgColor: "bg-amber-500/20 border-amber-500/40" },
  live: { label: "LIVE", color: "text-red-400", bgColor: "bg-red-500/20 border-red-500/40" },
  bracket: { label: "BRACKET", color: "text-sky-400", bgColor: "bg-sky-500/20 border-sky-500/40" },
  completed: { label: "COMPLETE", color: "text-gold", bgColor: "bg-gold/20 border-gold/40" },
};

function formatTimeLeft(endDate: string | null): string {
  if (!endDate) return "TBD";
  
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return "Ended";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getCtaConfig(status: string): { label: string; icon: React.ElementType } {
  switch (status) {
    case "approved":
      return { label: "Join", icon: Play };
    case "ready_up":
      return { label: "Ready Up", icon: Shield };
    case "live":
      return { label: "Enter", icon: Play };
    case "bracket":
    case "completed":
      return { label: "View", icon: Eye };
    default:
      return { label: "View", icon: Eye };
  }
}

export default function SanctionedTournamentCard({ tournament, onClick }: SanctionedTournamentCardProps) {
  const phase = phaseConfig[tournament.status] || phaseConfig.approved;
  const cta = getCtaConfig(tournament.status);
  const CtaIcon = cta.icon;
  const isCrewVsCrew = tournament.tournament_mode === "crew_vs_crew";
  
  const playerPercentage = (tournament.player_count / tournament.max_players) * 100;
  const totalPrize = tournament.index_prize || (
    (tournament.first_place_index || 0) + 
    (tournament.second_place_index || 0) + 
    (tournament.third_place_index || 0)
  );

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-[240px] shrink-0 bg-surface-1 border transition-all cursor-pointer group overflow-hidden ${
        isCrewVsCrew 
          ? "border-red-500/30 hover:border-red-500/60" 
          : "border-gold/30 hover:border-gold/60"
      }`}
    >
      {/* Poster / Header */}
      <div className="relative h-24 bg-gradient-to-br from-gold/20 via-surface-2 to-surface-1 overflow-hidden">
        {tournament.poster_url ? (
          <img 
            src={tournament.poster_url} 
            alt={tournament.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          />
        ) : isCrewVsCrew ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-500/20 to-surface-1">
            <Swords className="w-10 h-10 text-red-400/40" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-10 h-10 text-gold/40" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/50 to-transparent" />
        
        {/* Mode badge */}
        <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 ${
          isCrewVsCrew ? "bg-red-500/90" : "bg-gold/90"
        }`}>
          {isCrewVsCrew ? (
            <Swords className="w-3 h-3 text-white" />
          ) : (
            <Shield className="w-3 h-3 text-background" />
          )}
          <span className={`text-[8px] font-bold uppercase tracking-wider ${
            isCrewVsCrew ? "text-white" : "text-background"
          }`}>
            {isCrewVsCrew ? "Unit vs Unit" : "Sanctioned"}
          </span>
        </div>
        
        {/* Phase badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 border ${phase.bgColor}`}>
          <span className={`text-[8px] font-bold uppercase tracking-wider ${phase.color}`}>
            {phase.label}
          </span>
        </div>
        
        {/* Prize pool */}
        {totalPrize > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-gold" />
            <span className="text-[10px] font-bold text-gold">{totalPrize} IDX</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-display text-sm text-foreground leading-tight truncate mb-1">
          {tournament.name}
        </h3>
        
        {/* Units Display */}
        {isCrewVsCrew ? (
          <div className="flex items-center gap-2 mb-3">
            {/* Host Unit */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {tournament.crew_avatar_url ? (
                <Avatar className="w-4 h-4 shrink-0">
                  <AvatarImage src={tournament.crew_avatar_url} />
                  <AvatarFallback className="bg-gold/20 text-gold text-[8px]">
                    <Shield className="w-2 h-2" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-4 h-4 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                  <Shield className="w-2 h-2 text-gold" />
                </div>
              )}
              <span className="text-[9px] text-muted-foreground truncate">
                {tournament.crew_name}
              </span>
            </div>
            
            {/* VS */}
            <span className="text-[10px] font-bold text-red-400">VS</span>
            
            {/* Challenged Unit */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {tournament.challenged_crew_avatar_url ? (
                <Avatar className="w-4 h-4 shrink-0">
                  <AvatarImage src={tournament.challenged_crew_avatar_url} />
                  <AvatarFallback className="bg-red-500/20 text-red-400 text-[8px]">
                    <Shield className="w-2 h-2" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-2 h-2 text-red-400" />
                </div>
              )}
              <span className="text-[9px] text-muted-foreground truncate">
                {tournament.challenged_crew_name || "TBD"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mb-3">
            {tournament.crew_avatar_url ? (
              <img 
                src={tournament.crew_avatar_url} 
                alt={tournament.crew_name}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-2.5 h-2.5 text-muted-foreground" />
              </div>
            )}
            <span className="text-[10px] text-muted-foreground truncate">
              {tournament.crew_name}
            </span>
          </div>
        )}
        
        {/* Editor count bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[9px] mb-1">
            <span className="text-muted-foreground">
              <Users className="w-3 h-3 inline mr-0.5" />
              {tournament.player_count}/{tournament.max_players} editors
            </span>
            <span className="text-muted-foreground">
              min {tournament.min_players}
            </span>
          </div>
          <div className="h-1 bg-surface-2 overflow-hidden">
            <div 
              className={`h-full transition-all ${
                isCrewVsCrew 
                  ? "bg-gradient-to-r from-red-500/60 to-red-500" 
                  : "bg-gradient-to-r from-gold/60 to-gold"
              }`}
              style={{ width: `${Math.min(playerPercentage, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Challenge pending indicator */}
        {isCrewVsCrew && tournament.challenge_accepted === null && (
          <div className="flex items-center gap-1 text-[10px] text-amber-400 mb-3">
            <Clock className="w-3 h-3" />
            <span>Awaiting response</span>
          </div>
        )}
        
        {/* Timer */}
        {tournament.status === "ready_up" && tournament.ready_up_deadline && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3">
            <Clock className="w-3 h-3" />
            <span>{formatTimeLeft(tournament.ready_up_deadline)}</span>
            <span className="text-muted-foreground/50">to ready</span>
          </div>
        )}
        {tournament.status === "live" && tournament.submission_deadline && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3">
            <Clock className="w-3 h-3" />
            <span>{formatTimeLeft(tournament.submission_deadline)}</span>
            <span className="text-muted-foreground/50">left</span>
          </div>
        )}
        
        {/* Ready count for ready_up phase */}
        {tournament.status === "ready_up" && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 mb-3">
            <CheckCircle className="w-3 h-3" />
            <span>{tournament.ready_count}/{tournament.min_players} ready</span>
          </div>
        )}
        
        {/* CTA Button */}
        <button className={`w-full py-2 font-display text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 group-hover:shadow-lg transition-shadow ${
          isCrewVsCrew
            ? "bg-gradient-to-r from-red-500 via-red-400 to-red-500 text-white group-hover:shadow-red-500/20"
            : "bg-gradient-to-r from-gold via-amber-400 to-gold text-background group-hover:shadow-gold/20"
        }`}>
          <CtaIcon className="w-3.5 h-3.5" />
          {cta.label}
        </button>
      </div>
    </motion.div>
  );
}