import { motion } from "framer-motion";
import { Swords, Clock, Eye, Trophy, Flame, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Battle } from "@/hooks/useBattles";

interface BattleCardProps {
  battle: Battle;
  onClick: () => void;
}

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

function formatViews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function BattleCard({ battle, onClick }: BattleCardProps) {
  const isOpen = battle.status === 'pending' && !battle.opponent_id;
  const isLive = battle.status === 'active';
  const isCompleted = battle.status === 'completed';
  const isJudging = battle.status === 'judging';
  const isRapid = (battle as any).is_rapid;
  const totalVotes = battle.challenger_votes + battle.opponent_votes;

  const statusText = isLive ? 'LIVE' : isJudging ? 'JUDGING' : isCompleted ? 'DECIDED' : isOpen ? 'OPEN' : 'PENDING';
  const statusColor = isLive ? 'text-red-400' : isJudging ? 'text-purple-400' : isCompleted ? 'text-gold' : 'text-amber-400';

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-[260px] shrink-0 bg-surface-1 border border-red-500/20 hover:border-red-500/50 transition-all cursor-pointer group overflow-hidden"
    >
      {/* Hero — VS Display */}
      <div className="relative h-[120px] overflow-hidden">
        {/* Red atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/20 via-red-900/10 to-surface-1" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, currentColor 6px, currentColor 7px),
                            repeating-linear-gradient(-45deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)`,
          color: 'rgb(239 68 68)'
        }} />

        {/* Status — seamless text */}
        <div className="absolute top-2.5 left-0 right-0 flex items-center justify-center gap-1.5">
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.6)]" />}
          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] drop-shadow-sm ${statusColor}`} style={{ fontFamily: 'Teko, sans-serif' }}>
            {statusText}
          </span>
        </div>

        {/* VS Display */}
        <div className="absolute inset-0 flex items-center justify-center px-4 pt-3">
          {/* Challenger */}
          <div className="flex-1 flex flex-col items-center">
            <div className="p-[2px] bg-gradient-to-br from-red-500/50 to-red-900/50" style={{ borderRadius: '50%' }}>
              <Avatar className="w-11 h-11 border-[1.5px] border-background" style={{ borderRadius: '50%' }}>
                <AvatarImage src={battle.challenger_avatar_url || ''} />
                <AvatarFallback className="bg-red-500/20 text-red-400 text-sm font-bold">
                  {battle.challenger_username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[10px] text-foreground font-bold mt-1.5 truncate max-w-[80px] uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
              {battle.challenger_username}
            </span>
          </div>

          {/* VS Badge */}
          <div className="relative mx-2 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30" style={{ borderRadius: '50%' }}>
              <Swords className="w-4 h-4 text-white" />
            </div>
            {isLive && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />}
          </div>

          {/* Opponent */}
          <div className="flex-1 flex flex-col items-center">
            {battle.opponent_id ? (
              <>
                <div className="p-[2px] bg-gradient-to-br from-red-500/50 to-red-900/50" style={{ borderRadius: '50%' }}>
                  <Avatar className="w-11 h-11 border-[1.5px] border-background" style={{ borderRadius: '50%' }}>
                    <AvatarImage src={battle.opponent_avatar_url || ''} />
                    <AvatarFallback className="bg-red-500/20 text-red-400 text-sm font-bold">
                      {battle.opponent_username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-[10px] text-foreground font-bold mt-1.5 truncate max-w-[80px] uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
                  {battle.opponent_username}
                </span>
              </>
            ) : (
              <>
                <div className="w-11 h-11 border-[1.5px] border-dashed border-red-500/30 flex items-center justify-center bg-surface-2/50" style={{ borderRadius: '50%' }}>
                  <span className="text-lg text-red-400/30 font-display">?</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
                  Open
                </span>
              </>
            )}
          </div>
        </div>

        {/* View count */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <Eye className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-[9px] text-foreground/50 font-medium tabular-nums">{formatViews(battle.view_count)}</span>
        </div>

        {/* Rapid badge */}
        {isRapid && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider">RAPID</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 pt-2.5 space-y-2">
        {/* Stakes + Duration row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-gold" />
            <span className="text-[11px] font-bold text-gold tabular-nums">+{battle.winner_index_awarded} IDX</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{battle.duration_hours}h</span>
          </div>
        </div>

        {/* Timer if live */}
        {isLive && battle.ends_at && (
          <div className="flex items-center gap-1 text-[11px] text-red-400">
            <Flame className="w-3 h-3" />
            <span className="font-bold">{formatTimeLeft(battle.ends_at)} left</span>
          </div>
        )}

        {/* Vote bar */}
        {(isJudging || isCompleted) && totalVotes > 0 && (
          <div>
            <div className="flex items-center justify-between text-[9px] mb-1 text-muted-foreground">
              <span className="tabular-nums">{battle.challenger_votes}</span>
              <span className="tabular-nums">{battle.opponent_votes}</span>
            </div>
            <div className="h-1 bg-surface-2 overflow-hidden flex">
              <div className="h-full bg-red-500 transition-all" style={{ width: `${(battle.challenger_votes / totalVotes) * 100}%` }} />
              <div className="h-full bg-sky-500 transition-all" style={{ width: `${(battle.opponent_votes / totalVotes) * 100}%` }} />
            </div>
          </div>
        )}

        {/* CTA */}
        <button className="w-full py-2 relative overflow-hidden bg-red-600 hover:bg-red-500 transition-colors text-white font-display text-xs uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 group-hover:shadow-lg group-hover:shadow-red-500/15" style={{ fontFamily: 'Teko, sans-serif' }}>
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.1] to-transparent pointer-events-none" />
          <Swords className="w-3 h-3 relative z-10" />
          <span className="relative z-10">
            {isOpen ? "ACCEPT" : isLive ? "WATCH" : isCompleted ? "RESULTS" : isJudging ? "VIEW" : "VIEW"}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
