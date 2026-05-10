import { Link } from "react-router-dom";
import { Flame, Crown, Gavel, Clock } from "lucide-react";
import type { CollabBattle } from "@/hooks/useCollabBattles";

function MiniAvatar({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/80 bg-[#1a1a1f] flex items-center justify-center text-[10px] font-black text-white/80">
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

function DuoBlock({
  side,
  score,
  reactions,
  judges,
  leading,
  loser,
  creatorName,
  creatorAvatar,
  partnerName,
  partnerAvatar,
  posterUrl,
}: {
  side: "A" | "B";
  score: number;
  reactions: number;
  judges: number;
  leading: boolean;
  loser: boolean;
  creatorName: string;
  creatorAvatar: string | null;
  partnerName: string | null;
  partnerAvatar: string | null;
  posterUrl: string | null;
}) {
  const accent = side === "A" ? "from-violet-500 to-fuchsia-600" : "from-sky-500 to-cyan-500";
  const accentSolid = side === "A" ? "rgba(168,85,247,0.55)" : "rgba(56,189,248,0.55)";
  return (
    <div className={`relative flex-1 rounded-2xl overflow-hidden ${loser ? "opacity-70" : ""}`}>
      {/* poster bg */}
      <div className="absolute inset-0 bg-black">
        {posterUrl && (
          <img src={posterUrl} alt="" className="w-full h-full object-cover opacity-50" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${accentSolid}, rgba(0,0,0,0.85) 70%)`,
          }}
        />
      </div>

      <div className="relative p-3 flex flex-col h-full min-h-[160px]">
        {/* score */}
        <div className="flex items-start justify-between">
          <div className="flex -space-x-2">
            <MiniAvatar url={creatorAvatar} name={creatorName} />
            {partnerName && <MiniAvatar url={partnerAvatar} name={partnerName} />}
          </div>
          {leading && (
            <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md bg-amber-400 text-black flex items-center gap-0.5">
              <Crown className="w-2.5 h-2.5" /> LEAD
            </span>
          )}
        </div>

        <p className="mt-1 text-[11px] font-bold text-white truncate">
          {creatorName}
          {partnerName && <span className="text-white/60"> × {partnerName}</span>}
        </p>

        <div className="mt-auto">
          <p
            className={`text-[44px] font-black leading-none tabular-nums bg-gradient-to-b ${accent} bg-clip-text text-transparent drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]`}
            style={{ fontFamily: "Teko, sans-serif" }}
          >
            {score}
          </p>
          <div className="flex items-center gap-2 text-[9px] text-white/60 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-0.5"><Flame className="w-2.5 h-2.5 text-orange-400" />{reactions}</span>
            <span className="flex items-center gap-0.5"><Gavel className="w-2.5 h-2.5 text-amber-300" />{judges}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DuoBattleCard({ battle }: { battle: CollabBattle }) {
  const { slot_a, slot_b, score_a, score_b } = battle;
  const aLead = score_a > score_b;
  const bLead = score_b > score_a;
  const tied = score_a === score_b;

  // simple time-left
  const ms = new Date(battle.ends_at).getTime() - Date.now();
  const hours = Math.max(0, Math.floor(ms / 3_600_000));
  const mins = Math.max(0, Math.floor((ms % 3_600_000) / 60_000));
  const timeLeft = ms <= 0 ? "ENDED" : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <Link
      to={`/duo-battle/${battle.id}`}
      className="block rounded-3xl p-[1.5px] active:translate-y-[2px] transition-all shadow-[0_8px_0_rgba(0,0,0,0.5),0_16px_30px_rgba(168,85,247,0.18)]"
      style={{
        background:
          "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(255,255,255,0.15) 50%, rgba(56,189,248,0.95))",
      }}
    >
      <div className="rounded-[22px] bg-[#0a0612] overflow-hidden">
        {/* Top status bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-black/60 backdrop-blur-sm">
          <span className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            LIVE BATTLE
          </span>
          <span className="text-[9px] font-bold text-white/60 flex items-center gap-1 tabular-nums">
            <Clock className="w-2.5 h-2.5" /> {timeLeft}
          </span>
        </div>

        {/* VS layout */}
        <div className="relative flex items-stretch gap-[2px] bg-white/5">
          <DuoBlock
            side="A"
            score={score_a}
            reactions={battle.reactions_a}
            judges={Math.round(battle.judge_score_a)}
            leading={aLead}
            loser={bLead}
            creatorName={slot_a.creator_username}
            creatorAvatar={slot_a.creator_avatar_url}
            partnerName={slot_a.partner_username}
            partnerAvatar={slot_a.partner_avatar_url}
            posterUrl={slot_a.final_video_url ? null : null}
          />

          {/* VS divider */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div
              className="w-12 h-12 rounded-full bg-black border-2 border-white flex items-center justify-center text-white font-black shadow-[0_4px_0_rgba(0,0,0,0.5)]"
              style={{ fontFamily: "Teko, sans-serif", fontSize: "20px" }}
            >
              VS
            </div>
          </div>

          <DuoBlock
            side="B"
            score={score_b}
            reactions={battle.reactions_b}
            judges={Math.round(battle.judge_score_b)}
            leading={bLead}
            loser={aLead}
            creatorName={slot_b.creator_username}
            creatorAvatar={slot_b.creator_avatar_url}
            partnerName={slot_b.partner_username}
            partnerAvatar={slot_b.partner_avatar_url}
            posterUrl={slot_b.final_video_url ? null : null}
          />
        </div>

        {/* Footer */}
        <div className="px-3 py-2 flex items-center justify-between bg-black/80">
          <p className="text-[10px] text-white/60 truncate">
            🎵 <span className="text-white/80 font-bold">{slot_a.song_title}</span>
            <span className="text-white/30"> vs </span>
            <span className="text-white/80 font-bold">{slot_b.song_title}</span>
          </p>
          <span className="text-[9px] font-black tracking-widest uppercase text-emerald-300 shrink-0">
            {tied ? "Tied →" : aLead ? "← A leads" : "B leads →"}
          </span>
        </div>
      </div>
    </Link>
  );
}