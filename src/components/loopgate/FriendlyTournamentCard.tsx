import { motion } from "framer-motion";
import { Trophy, Users, Clock, ChevronRight } from "lucide-react";
import type { FriendlyTournament } from "@/hooks/useFriendlyTournament";

interface FriendlyTournamentCardProps {
  tournament: FriendlyTournament;
  onClick: () => void;
}

export default function FriendlyTournamentCard({ 
  tournament, 
  onClick 
}: FriendlyTournamentCardProps) {
  const getStatusColor = () => {
    switch (tournament.status) {
      case 'filling':
        return 'bg-background/40 text-amber-300 border-amber-400/35';
      case 'live':
        return 'bg-background/40 text-emerald-400 border-emerald-400/40';
      case 'bracket':
        return 'bg-background/40 text-sky-300 border-sky-400/40';
      case 'completed':
        return 'bg-background/30 text-muted-foreground border-border';
      default:
        return 'bg-background/30 text-muted-foreground border-border';
    }
  };

  const getStatusLabel = () => {
    switch (tournament.status) {
      case 'filling':
        return 'OPEN';
      case 'live':
        return 'LIVE';
      case 'bracket':
        return 'JUDGING';
      case 'completed':
        return 'DONE';
      default:
        return tournament.status.toUpperCase();
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d`;
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h`;
    return `${minutes}m`;
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full bg-surface-1 border border-border p-4 text-left group hover:border-violet-500/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-violet-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">{tournament.name}</h4>
            <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-[0.08em] border rounded-full ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>

          {tournament.description && (
            <p className="text-[11px] text-muted-foreground mb-2 line-clamp-1">
              {tournament.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {tournament.current_players}/{tournament.max_players}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(tournament.duration_minutes)}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-400 transition-colors shrink-0" />
      </div>
    </motion.button>
  );
}
