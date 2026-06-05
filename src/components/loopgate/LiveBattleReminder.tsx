import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flag, ChevronRight, Gavel, Trophy, Vote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SmartUsername from "./SmartUsername";

export type LiveBattleReminderItem = {
  kind: "battle" | "quick" | "competition";
  id: string;
  title: string;
  participants?: Array<{ userId?: string | null; username: string | null }>;
  status: string;
  endsAt: string | null;
  hasSubmitted: boolean;
  hasVoted?: boolean;
  isJudge?: boolean;
  href: string;
};

function useCountdown(endsAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return { label: "—", expired: false, urgent: false };
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return { label: "EXPIRED", expired: true, urgent: true };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff / 60_000) % 60);
  const s = Math.floor((diff / 1_000) % 60);
  const label = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
  return { label, expired: false, urgent: diff < 10 * 60_000 };
}

async function forfeit(item: LiveBattleReminderItem) {
  if (item.kind === "competition") {
    const ok = window.confirm(
      `Forfeit "${item.title}"? You'll leave this competition. This cannot be undone.`
    );
    if (!ok) return;
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) { toast.error("Sign in required."); return; }
    const { error } = await supabase
      .from("competition_participants")
      .delete()
      .eq("competition_id", item.id)
      .eq("user_id", userId);
    if (error) toast.error("Could not forfeit. Try again.");
    else toast.success("Competition forfeited.");
    return;
  }
  const ok = window.confirm(
    `Forfeit "${item.title}"? Your opponent will win automatically. This cannot be undone.`
  );
  if (!ok) return;
  const fn = item.kind === "battle" ? "battle_forfeit" : "quick_fight_forfeit";
  const arg = item.kind === "battle" ? { p_battle_id: item.id } : { p_fight_id: item.id };
  const { data, error } = await supabase.rpc(fn as any, arg as any);
  if (error || !data) toast.error("Could not forfeit. Try again.");
  else toast.success("Battle forfeited.");
}

export function LiveBattleReminderCard({ item, compact = false }: { item: LiveBattleReminderItem; compact?: boolean }) {
  const { label, urgent, expired } = useCountdown(item.endsAt);
  const navigate = useNavigate();
  const isVoting = item.kind === "competition" && item.status === "voting";
  const isPurple = item.isJudge || item.kind === "competition";
  const dotColor  = isPurple ? "bg-purple-400" : urgent ? "bg-red-400 animate-pulse" : "bg-red-500/70";
  const labelColor = isPurple ? "text-purple-300" : "text-red-400";
  const timerColor = expired ? "text-red-400" : urgent ? "text-red-300" : "text-white/30";

  const statusText = item.isJudge
    ? "JUDGING"
    : item.kind === "competition"
    ? (isVoting ? "VOTE NOW" : "LIVE COMPETITION")
    : item.status === "judging"
    ? "AWAITING JUDGE"
    : "LIVE BATTLE";

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: '#0e0e0e',
        border: `1px solid ${isPurple ? 'rgba(168,85,247,0.18)' : 'rgba(239,68,68,0.18)'}`,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
      }}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: isPurple ? 'rgba(168,85,247,0.3)' : 'rgba(239,68,68,0.3)' }} />

      {/* Main row */}
      <button
        onClick={() => navigate(item.href)}
        className="relative w-full flex items-center gap-3 px-3 py-2.5 text-left active:opacity-80 transition-opacity"
      >
        {/* Status dot */}
        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${dotColor}`} />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-black uppercase tracking-[0.2em] ${labelColor}`}
              style={{ fontFamily: 'Teko, sans-serif' }}
            >
              {statusText}
            </span>
            {(item.hasSubmitted || item.hasVoted) && !item.isJudge && (
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">✓ {item.hasVoted ? "Voted" : "Submitted"}</span>
            )}
          </div>
          {item.participants?.length ? (
            <div
              className="flex items-center gap-1 text-[15px] font-black uppercase text-white/85 truncate leading-tight"
              style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.04em' }}
            >
              <SmartUsername userId={item.participants[0]?.userId} username={item.participants[0]?.username || '???'} className="truncate" />
              <span className="text-white/35 shrink-0">vs</span>
              <SmartUsername userId={item.participants[1]?.userId} username={item.participants[1]?.username || '???'} className="truncate" />
            </div>
          ) : (
            <p
              className="text-[15px] font-black uppercase text-white/85 truncate leading-tight"
              style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.04em' }}
            >
              {item.title}
            </p>
          )}
          {!item.isJudge && (
            <p className={`text-[9px] font-black uppercase tracking-[0.14em] ${timerColor}`}
              style={{ fontFamily: 'Teko, sans-serif' }}>
              {expired ? "Time expired" : `${label} left to ${isVoting ? "vote" : "submit"}`}
            </p>
          )}
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-white/20 shrink-0" />
      </button>

      {/* Action row */}
      {!item.isJudge && !compact && (
        <div className="flex" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link
            to={item.href}
            className="flex-1 py-2 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-colors"
            style={{ fontFamily: 'Teko, sans-serif' }}
          >
            {isVoting ? "Vote" : item.hasSubmitted ? "View" : "Submit Edit"}
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); forfeit(item); }}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-500/50 hover:text-red-400 hover:bg-red-500/5 transition-colors flex items-center gap-1.5"
            style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', fontFamily: 'Teko, sans-serif' }}
          >
            <Flag className="w-2.5 h-2.5" />
            Forfeit
          </button>
        </div>
      )}
    </div>
  );
}

export default function LiveBattleReminders({ items, compact = false }: { items: LiveBattleReminderItem[]; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <LiveBattleReminderCard key={`${it.kind}-${it.id}`} item={it} compact={compact} />
      ))}
    </div>
  );
}
