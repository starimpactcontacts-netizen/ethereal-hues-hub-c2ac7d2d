import { motion } from "framer-motion";
import { Users, Clock, Shield, Swords, Trophy, Play, Eye } from "lucide-react";

export type TournamentPhase = "ready-up" | "submission" | "bracket" | "completed";

export interface Tournament {
  id: string;
  name: string;
  hostCrew: string;
  hostCrewAvatar?: string;
  isSanctioned: boolean;
  phase: TournamentPhase;
  playerCount: number;
  minPlayers: number;
  maxPlayers: number;
  readyCount?: number;
  phaseEndsAt: Date;
  prizePool?: string;
  theme?: string;
  posterUrl?: string;
}

interface TournamentCardProps {
  tournament: Tournament;
  onClick: () => void;
}

const phaseConfig: Record<TournamentPhase, { label: string; color: string; bgColor: string }> = {
  "ready-up": { label: "READY UP", color: "text-amber-300", bgColor: "bg-background/45 border-amber-400/40 backdrop-blur-sm" },
  "submission": { label: "SUBMITTING", color: "text-emerald-400", bgColor: "bg-background/45 border-emerald-400/40 backdrop-blur-sm" },
  "bracket": { label: "BRACKET LIVE", color: "text-sky-300", bgColor: "bg-background/45 border-sky-400/40 backdrop-blur-sm" },
  "completed": { label: "WINNER", color: "text-gold", bgColor: "bg-background/45 border-gold/40 backdrop-blur-sm" },
};

function formatTimeLeft(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return "Ended";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

function getCtaConfig(phase: TournamentPhase): { label: string; icon: React.ElementType } {
  switch (phase) {
    case "ready-up":
      return { label: "Ready Up", icon: Shield };
    case "submission":
      return { label: "Enter", icon: Play };
    case "bracket":
    case "completed":
      return { label: "View", icon: Eye };
  }
}

export default function TournamentCard({ tournament, onClick }: TournamentCardProps) {
  const phaseStyle = phaseConfig[tournament.phase];
  const cta = getCtaConfig(tournament.phase);
  const CtaIcon = cta.icon;
  
  const playerPercentage = (tournament.playerCount / tournament.maxPlayers) * 100;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-[240px] shrink-0 bg-surface-1 border border-border hover:border-gold/40 transition-all cursor-pointer group overflow-hidden"
    >
      {/* Poster / Header */}
      <div className="relative h-24 bg-gradient-to-br from-surface-2 to-surface-1 overflow-hidden">
        {tournament.posterUrl ? (
          <img 
            src={tournament.posterUrl} 
            alt={tournament.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Swords className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/50 to-transparent" />
        
        {/* Sanctioned badge */}
        {tournament.isSanctioned && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full border border-gold/40 bg-background/45 px-2 py-0.5 backdrop-blur-sm">
            <Shield className="w-3 h-3 text-gold" />
            <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-gold">
              Sanctioned
            </span>
          </div>
        )}
        
        {/* Phase badge */}
        <div className={`absolute top-2 right-2 rounded-full px-2 py-0.5 border ${phaseStyle.bgColor}`}>
          <span className={`text-[8px] font-bold uppercase tracking-[0.08em] ${phaseStyle.color}`}>
            {phaseStyle.label}
          </span>
        </div>
        
        {/* Prize pool */}
        {tournament.prizePool && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-gold/40 bg-background/45 px-2 py-0.5 backdrop-blur-sm">
            <Trophy className="w-3 h-3 text-gold" />
            <span className="text-[10px] font-bold text-gold">{tournament.prizePool}</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-display text-sm text-foreground leading-tight truncate mb-1">
          {tournament.name}
        </h3>
        
        {/* Host Unit */}
        <div className="flex items-center gap-1.5 mb-3">
          {tournament.hostCrewAvatar ? (
            <img 
              src={tournament.hostCrewAvatar} 
              alt={tournament.hostCrew}
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-2.5 h-2.5 text-muted-foreground" />
            </div>
          )}
          <span className="text-[10px] text-muted-foreground truncate">
            {tournament.hostCrew}
          </span>
        </div>
        
        {/* Player count bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[9px] mb-1">
            <span className="text-muted-foreground">
              <Users className="w-3 h-3 inline mr-0.5" />
              {tournament.playerCount}/{tournament.maxPlayers}
            </span>
            <span className="text-muted-foreground">
              min {tournament.minPlayers}
            </span>
          </div>
          <div className="h-1 bg-surface-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-gold/60 to-gold transition-all"
              style={{ width: `${Math.min(playerPercentage, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Phase timer */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3">
          <Clock className="w-3 h-3" />
          <span>{formatTimeLeft(tournament.phaseEndsAt)}</span>
          <span className="text-muted-foreground/50">remaining</span>
        </div>
        
        {/* CTA Button */}
        <button className="w-full py-2 bg-gradient-to-r from-gold via-amber-400 to-gold text-background font-display text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 group-hover:shadow-lg group-hover:shadow-gold/20 transition-shadow">
          <CtaIcon className="w-3.5 h-3.5" />
          {cta.label}
        </button>
      </div>
    </motion.div>
  );
}
