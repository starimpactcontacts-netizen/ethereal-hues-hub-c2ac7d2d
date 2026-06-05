import { motion } from "framer-motion";
import { Swords, Clock, Trophy, Lock } from "lucide-react";
import BattleVoteBarCompact from "@/components/loopgate/BattleVoteBarCompact";
import { getThumbnail } from "@/lib/thumbnail";
import type { Battle } from "@/hooks/useBattles";
import SmartUsername from "@/components/loopgate/SmartUsername";

interface BattleCardProps {
  battle: Battle;
  onClick: () => void;
}

function formatTimeLeft(endDate: string | null): string {
  if (!endDate) return "—";
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function BattleCard({ battle, onClick }: BattleCardProps) {
  const isOpen = battle.status === 'pending' && !battle.opponent_id;
  const isLive = battle.status === 'active';
  const isCompleted = battle.status === 'completed';
  const isJudging = battle.status === 'judging';
  const isPrivate = (battle as any).is_private;
  const hasTimeEnded = battle.ends_at ? new Date(battle.ends_at).getTime() < Date.now() : false;
  const isDone = isCompleted || battle.status === 'cancelled' || (isLive && hasTimeEnded);

  const statusText = isDone && !isCompleted
    ? 'ENDED'
    : isLive ? 'LIVE'
    : isJudging ? 'JUDGING'
    : isCompleted ? 'DECIDED'
    : isOpen ? 'OPEN'
    : 'PENDING';

  // Thumbnails from submission URLs
  const challengerThumb = battle.challenger_submission_url
    ? getThumbnail(battle.challenger_submission_url, battle.challenger_submission_platform || 'youtube').url
    : null;
  const opponentThumb = battle.opponent_submission_url
    ? getThumbnail(battle.opponent_submission_url, battle.opponent_submission_platform || 'youtube').url
    : null;

  const hasChallThumb = challengerThumb && !challengerThumb.includes('placeholder');
  const hasOppThumb = opponentThumb && !opponentThumb.includes('placeholder');

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full h-full overflow-hidden cursor-pointer flex flex-col ${isDone ? 'opacity-55 grayscale-[40%]' : ''}`}
      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* ── SPLIT THUMBNAIL ── */}
      <div className="relative flex-1 overflow-hidden" style={{ minHeight: 0 }}>

        {/* LEFT — Challenger (blue side) */}
        <div className="absolute left-0 top-0 bottom-0 w-1/2 overflow-hidden">
          {hasChallThumb ? (
            <img
              src={challengerThumb!}
              alt=""
              className="w-full h-full object-cover scale-[1.12]"
              loading="lazy"
              style={{ transformOrigin: 'center' }}
            />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(160deg, rgba(59,130,246,0.12), rgba(0,0,0,0))' }} />
          )}
          {/* Blue tint */}
          <div className="absolute inset-0" style={{ background: 'rgba(30,64,175,0.28)' }} />
          {/* Right edge fade into VS divider */}
          <div className="absolute inset-y-0 right-0 w-10" style={{ background: 'linear-gradient(to right, transparent, #111)' }} />
        </div>

        {/* RIGHT — Opponent (red side) */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden">
          {hasOppThumb ? (
            <img
              src={opponentThumb!}
              alt=""
              className="w-full h-full object-cover scale-[1.12]"
              loading="lazy"
              style={{ transformOrigin: 'center' }}
            />
          ) : (
            <div className="w-full h-full" style={{
              background: isOpen
                ? 'rgba(0,0,0,0)'
                : 'linear-gradient(160deg, rgba(239,68,68,0.10), rgba(0,0,0,0))'
            }} />
          )}
          {/* Red tint */}
          {!isOpen && <div className="absolute inset-0" style={{ background: 'rgba(153,27,27,0.28)' }} />}
          {/* Left edge fade */}
          <div className="absolute inset-y-0 left-0 w-10" style={{ background: 'linear-gradient(to left, transparent, #111)' }} />
          {/* Open slot placeholder */}
          {isOpen && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ border: '1.5px dashed rgba(255,255,255,0.12)' }}
              >
                <span className="text-[15px] font-black text-white/15" style={{ fontFamily: 'Teko, sans-serif' }}>?</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom fade to card base */}
        <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #111)' }} />

        {/* Center VS badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center z-10"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Swords className="w-3 h-3 text-white/50" strokeWidth={1.5} />
          </div>
        </div>

        {/* Status — top-left */}
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
          {isLive && <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />}
          <span
            className="text-[8px] font-black uppercase tracking-[0.14em]"
            style={{
              fontFamily: 'Teko, sans-serif',
              color: isLive ? '#f87171'
                : isJudging ? '#c084fc'
                : isDone ? 'rgba(255,255,255,0.2)'
                : isOpen ? '#fbbf24'
                : 'rgba(255,255,255,0.35)',
            }}
          >
            {statusText}
          </span>
          {isPrivate && <Lock className="w-2 h-2 text-amber-400/70" strokeWidth={2.5} />}
        </div>

        {/* Timer — top-right */}
        <div className="absolute top-2 right-2 flex items-center gap-0.5 z-10">
          <Clock className="w-2 h-2 text-white/20" />
          <span className="text-[8px] font-black text-white/25 tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>
            {formatTimeLeft(battle.ends_at)}
          </span>
        </div>
      </div>

      {/* ── INFO STRIP ── */}
      <div className="px-2.5 pt-2 pb-2.5 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Usernames */}
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[10px] font-black uppercase truncate max-w-[62px] leading-none"
            style={{ fontFamily: 'Teko, sans-serif', color: 'rgba(147,197,253,0.8)' }}
          >
            <SmartUsername userId={battle.challenger_id} username={battle.challenger_username} />
          </span>
          <span
            className="text-[10px] font-black uppercase truncate max-w-[62px] leading-none text-right"
            style={{
              fontFamily: 'Teko, sans-serif',
              color: battle.opponent_id ? 'rgba(252,165,165,0.75)' : 'rgba(255,255,255,0.18)',
            }}
          >
            {battle.opponent_id ? <SmartUsername userId={battle.opponent_id} username={battle.opponent_username || '???'} /> : 'OPEN'}
          </span>
        </div>

        {/* Vote bar */}
        <BattleVoteBarCompact
          blueVotes={battle.challenger_votes || 0}
          redVotes={battle.opponent_votes || 0}
          blueLabel={battle.challenger_username}
          redLabel={battle.opponent_username || undefined}
        />

        {/* Index award */}
        <div className="flex items-center gap-0.5 mt-1.5">
          <Trophy className="w-2 h-2 text-amber-400/60" />
          <span className="text-[8px] font-black text-amber-400/60 tabular-nums">+{battle.winner_index_awarded}</span>
        </div>
      </div>
    </motion.div>
  );
}
