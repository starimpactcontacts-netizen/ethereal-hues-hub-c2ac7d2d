import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swords, Zap, Flag, ChevronRight, Gavel } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type LiveBattleReminderItem = {
  kind: "battle" | "quick";
  id: string;
  title: string;
  status: string;
  endsAt: string | null;
  hasSubmitted: boolean;
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
  const Icon = item.isJudge ? Gavel : item.kind === "quick" ? Zap : Swords;
  const accent = item.isJudge ? "purple" : "red";

  return (
    <div
      className={`relative rounded-2xl border ${
        accent === "purple" ? "border-purple-500/30" : urgent ? "border-red-500/60" : "border-red-500/25"
      } overflow-hidden`}
      style={{ background: "linear-gradient(160deg, hsl(0 0% 11%) 0%, hsl(0 0% 6%) 100%)" }}
    >
      <button
        onClick={() => navigate(item.href)}
        className="w-full flex items-center gap-3 p-3 text-left active:scale-[0.99] transition-transform"
      >
        <div className={`relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
          accent === "purple" ? "bg-purple-500/15" : "bg-red-500/15"
        }`}>
          <Icon className={`w-4 h-4 ${accent === "purple" ? "text-purple-300" : "text-red-300"}`} />
          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse ${
            accent === "purple" ? "bg-purple-400" : "bg-red-500"
          } shadow-[0_0_8px_rgba(239,68,68,0.7)]`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
              accent === "purple" ? "text-purple-300" : "text-red-300"
            }`}>
              {item.isJudge ? "JUDGING" : item.status === "judging" ? "AWAITING JUDGE" : "LIVE BATTLE"}
            </span>
            {item.hasSubmitted && !item.isJudge && (
              <span className="text-[8px] font-bold text-emerald-300 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 uppercase">Submitted</span>
            )}
          </div>
          <p className="text-[13px] font-bold text-foreground truncate mt-0.5">{item.title}</p>
          {!item.isJudge && (
            <p className={`text-[10px] mt-0.5 font-bold uppercase tracking-wider ${
              expired ? "text-red-400" : urgent ? "text-red-300 animate-pulse" : "text-muted-foreground"
            }`}>
              {expired ? "Time expired" : `${label} left to submit`}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {!item.isJudge && !compact && (
        <div className="flex border-t border-white/[0.05]">
          <Link
            to={item.href}
            className="flex-1 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:bg-white/[0.04] transition-colors"
          >
            {item.hasSubmitted ? "View" : "Submit Edit"}
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); forfeit(item); }}
            className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-300 hover:bg-red-500/10 border-l border-white/[0.05] transition-colors flex items-center gap-1.5"
          >
            <Flag className="w-3 h-3" />
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