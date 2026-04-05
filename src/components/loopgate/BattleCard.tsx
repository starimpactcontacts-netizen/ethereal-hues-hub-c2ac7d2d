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

export default function BattleCard({ battle, onClick }: BattleCardProps) {
  const isOpen = battle.status === 'pending' && !battle.opponent_id;
  const isLive = battle.status === 'active';
  const isCompleted = battle.status === 'completed';
  const isJudging = battle.status === 'judging';
  const isRapid = (battle as any).is_rapid;
  const totalVotes = battle.challenger_votes + battle.opponent_votes;
  
  // Check if time has ended even if status hasn't updated yet
  const hasTimeEnded = battle.ends_at ? new Date(battle.ends_at).getTime() < Date.now() : false;
  const isDone = isCompleted || battle.status === 'cancelled' || (isLive && hasTimeEnded);

  const statusText = isDone && !isCompleted ? 'ENDED' : isLive ? 'LIVE' : isJudging ? 'JUDGING' : isCompleted ? 'DECIDED' : isOpen ? 'OPEN' : 'PENDING';

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`w-[260px] sm:w-[280px] shrink-0 overflow-hidden cursor-pointer group rounded-xl relative ${isDone ? 'opacity-50 grayscale-[60%]' : ''}`}
      style={{
        background: isDone
          ? 'linear-gradient(160deg, rgba(25,25,28,1) 0%, rgba(15,15,17,1) 100%)'
          : 'linear-gradient(160deg, rgba(30,30,40,1) 0%, rgba(10,10,15,1) 100%)',
        boxShadow: isLive
          ? '0 0 24px rgba(239,68,68,0.15), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{
        background: isLive
          ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)'
          : isOpen
          ? 'linear-gradient(90deg, transparent, rgba(234,179,8,0.4), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
      }} />

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5">
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
            isLive ? 'text-red-400' : isJudging ? 'text-purple-400' : isDone ? 'text-zinc-500' : isOpen ? 'text-amber-400' : 'text-zinc-500'
          }`} style={{ fontFamily: 'Teko, sans-serif' }}>
            {statusText}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isRapid && !isDone && (
            <div className="flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[8px] font-bold text-amber-400 uppercase">Rapid</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[9px] text-zinc-500">
            <Clock className="w-2.5 h-2.5" />
            <span>{battle.duration_hours}h</span>
          </div>
        </div>
      </div>

      {/* VS Display */}
      <div className="relative px-3 py-4">
        {!isDone && (
          <div className="absolute inset-0 opacity-[0.04]" style={{
            background: 'linear-gradient(90deg, rgba(59,130,246,0.8) 0%, transparent 40%, transparent 60%, rgba(239,68,68,0.8) 100%)',
          }} />
        )}

        <div className="relative flex items-center justify-between">
          {/* Challenger */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <div className="relative">
              {!isDone && (
                <div className="absolute -inset-1 rounded-full opacity-40" style={{
                  background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
                }} />
              )}
              <Avatar className={`w-12 h-12 border-2 relative z-10 ${isDone ? 'border-zinc-700/40' : 'border-blue-500/40'}`}>
                <AvatarImage src={battle.challenger_avatar_url || ''} />
                <AvatarFallback className={`text-sm font-bold ${isDone ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-500/15 text-blue-400'}`}>
                  {battle.challenger_username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className={`text-[11px] font-bold truncate max-w-[80px] uppercase tracking-wide ${isDone ? 'text-zinc-500' : 'text-foreground'}`} style={{ fontFamily: 'Teko, sans-serif' }}>
              {battle.challenger_username}
            </span>
          </div>

          {/* VS */}
          <div className="relative mx-1 shrink-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center relative z-10" style={{
              background: isDone
                ? 'rgba(255,255,255,0.03)'
                : 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(239,68,68,0.25))',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Swords className={`w-3.5 h-3.5 ${isDone ? 'text-zinc-600' : 'text-white/70'}`} />
            </div>
          </div>

          {/* Opponent */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            {battle.opponent_id ? (
              <>
                <div className="relative">
                  {!isDone && (
                    <div className="absolute -inset-1 rounded-full opacity-40" style={{
                      background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)',
                    }} />
                  )}
                  <Avatar className={`w-12 h-12 border-2 relative z-10 ${isDone ? 'border-zinc-700/40' : 'border-red-500/40'}`}>
                    <AvatarImage src={battle.opponent_avatar_url || ''} />
                    <AvatarFallback className={`text-sm font-bold ${isDone ? 'bg-zinc-800 text-zinc-500' : 'bg-red-500/15 text-red-400'}`}>
                      {battle.opponent_username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className={`text-[11px] font-bold truncate max-w-[80px] uppercase tracking-wide ${isDone ? 'text-zinc-500' : 'text-foreground'}`} style={{ fontFamily: 'Teko, sans-serif' }}>
                  {battle.opponent_username}
                </span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center bg-white/[0.02]">
                  <span className="text-lg text-white/20 font-bold">?</span>
                </div>
                <span className="text-[11px] text-zinc-600 uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
                  Open
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Trophy className={`w-3 h-3 ${isDone ? 'text-zinc-600' : 'text-gold'}`} />
            <span className={`text-[11px] font-bold tabular-nums ${isDone ? 'text-zinc-600' : 'text-gold'}`}>+{battle.winner_index_awarded} IDX</span>
          </div>

          {isLive && battle.ends_at && (
            <div className="flex items-center gap-1 text-[10px] text-red-400">
              <Flame className="w-3 h-3" />
              <span className="font-bold">{formatTimeLeft(battle.ends_at)}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Eye className="w-2.5 h-2.5 text-zinc-600" />
            <span className="text-[9px] text-zinc-600 tabular-nums">{battle.view_count}</span>
          </div>
        </div>
      </div>

      {/* Vote bar */}
      {(isJudging || isCompleted) && totalVotes > 0 && (
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between text-[8px] mb-0.5 text-zinc-500 tabular-nums">
            <span>{battle.challenger_votes}</span>
            <span>{battle.opponent_votes}</span>
          </div>
          <div className="h-[3px] bg-white/[0.04] rounded-full overflow-hidden flex">
            <div className="h-full bg-zinc-500/50 rounded-full transition-all" style={{ width: `${(battle.challenger_votes / totalVotes) * 100}%` }} />
            <div className="h-full bg-zinc-600/50 rounded-full transition-all" style={{ width: `${(battle.opponent_votes / totalVotes) * 100}%` }} />
          </div>
        </div>
      )}

      {/* CTA */}
      {!isDone && (
        <div className="px-3 pb-3 pt-1">
          <div className="relative overflow-hidden rounded-lg transition-all" style={{
            background: isOpen
              ? 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.08))'
              : isLive
              ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
            border: isOpen
              ? '1px solid rgba(234,179,8,0.2)'
              : isLive
              ? '1px solid rgba(239,68,68,0.2)'
              : '1px solid rgba(255,255,255,0.06)',
          }}>
            <div className="py-2 flex items-center justify-center gap-1.5">
              <Swords className={`w-3 h-3 ${isOpen ? 'text-amber-400' : isLive ? 'text-red-400' : 'text-zinc-400'}`} />
              <span className={`text-[11px] font-bold uppercase tracking-[0.12em] ${
                isOpen ? 'text-amber-400' : isLive ? 'text-red-400' : 'text-zinc-400'
              }`} style={{ fontFamily: 'Teko, sans-serif' }}>
                {isOpen ? "ACCEPT CHALLENGE" : isLive ? "WATCH LIVE" : isJudging ? "VIEW" : "VIEW"}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
