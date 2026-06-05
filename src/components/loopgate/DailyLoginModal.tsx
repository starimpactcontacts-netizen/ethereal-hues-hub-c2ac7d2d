import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import RingsCoin from "@/components/loopgate/RingsCoin";
import { toast } from "sonner";

// Use the project theme: Teko (font-display) for headings/numbers, default sans for body.
const UI: React.CSSProperties = {};

const DAYS = [1, 2, 3, 4, 5, 6, 7];
function rewardFor(day: number) {
  if (day === 4) return { kind: "rings" as const, amount: 50 };
  if (day === 7) return { kind: "rings" as const, amount: 200 };
  return { kind: "xp" as const, amount: 50 + (day - 1) * 100 };
}

const STORAGE_KEY = "loopgate.dailyClaim.lastDate";

export default function DailyLoginModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [todayDay, setTodayDay] = useState(1); // 1..7 cycle position to claim
  const [claimedToday, setClaimedToday] = useState(false);
  const [lastReward, setLastReward] = useState<{ kind: "xp" | "rings"; amount: number } | null>(null);

  // Load streak state for current user
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("daily_streak, last_daily_claim_at")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || error || !data) return;

      const today = new Date().toISOString().slice(0, 10);
      const last = (data as any).last_daily_claim_at as string | null;
      const curStreak = ((data as any).daily_streak as number) || 0;

      const alreadyClaimedToday = last === today;
      // Compute the day slot we'd claim next (or that we just claimed)
      let nextDay: number;
      if (alreadyClaimedToday) {
        nextDay = ((curStreak - 1) % 7) + 1;
      } else {
        // continuing or resetting
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const nextStreak = last === yesterday ? curStreak + 1 : 1;
        nextDay = ((nextStreak - 1) % 7) + 1;
      }

      setStreak(curStreak);
      setTodayDay(nextDay);
      setClaimedToday(alreadyClaimedToday);

      // Auto-open once per device per day if not yet claimed
      const lastShown = localStorage.getItem(STORAGE_KEY + ":" + user.id);
      if (!alreadyClaimedToday && lastShown !== today) {
        setOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleClaim = async () => {
    if (loading || claimedToday) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("claim_daily_reward");
    setLoading(false);
    if (error) {
      toast.error("Couldn't claim reward — try again");
      return;
    }
    const res = data as any;
    if (res?.already_claimed) {
      setClaimedToday(true);
      return;
    }
    setClaimedToday(true);
    setStreak(res.streak);
    setTodayDay(res.day);
    setLastReward({ kind: res.reward_kind, amount: res.reward_amount });
    toast.success(
      res.reward_kind === "xp"
        ? `+${res.reward_amount} XP claimed`
        : `+${res.reward_amount} Rings claimed`
    );
  };

  const handleClose = () => {
    if (user?.id) {
      localStorage.setItem(STORAGE_KEY + ":" + user.id, new Date().toISOString().slice(0, 10));
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden relative"
            style={{
              background: "#111114",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center text-white hover:bg-black/80"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div
              className="px-5 pt-5 pb-4"
              style={{
                background:
                  "linear-gradient(180deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0) 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#10b981",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Daily Login
              </div>
              <div className="flex items-end justify-between mt-1">
                <div className="font-display" style={{ fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                  {claimedToday ? "See you tomorrow" : "Claim your reward"}
                </div>
                <div
                  className="font-display"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#6ee7b7",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {streak} day streak
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="px-5 pt-4">
              <div className="h-1.5 w-full overflow-hidden" style={{ background: "#222222" }}>
                <div
                  className="h-full transition-all"
                  style={{ width: `${(todayDay / 7) * 100}%`, background: "#10b981" }}
                />
              </div>
            </div>

            {/* Grid */}
            <div className="p-5 grid grid-cols-4 gap-2">
              {DAYS.map((d) => {
                const r = rewardFor(d);
                const isXp = r.kind === "xp";
                const isClaimed = d < todayDay || (d === todayDay && claimedToday);
                const isToday = d === todayDay && !claimedToday;
                return (
                  <div
                    key={d}
                    className="relative p-2 flex flex-col items-center"
                    style={{
                      background: "#0a0a0a",
                      border: isToday
                        ? "1px solid #10b981"
                        : "1px solid rgba(255,255,255,0.06)",
                      aspectRatio: "3/4",
                      opacity: !isClaimed && !isToday ? 0.55 : 1,
                    }}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span
                        className="font-display"
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: isToday ? "#fff" : "#949ba4",
                        }}
                      >
                        Day {d}
                      </span>
                      {isClaimed && <Check className="w-3 h-3 text-green-400" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 flex items-center justify-center my-1">
                      <div
                        className="w-10 h-10 flex items-center justify-center"
                        style={{
                          background: isXp
                            ? "radial-gradient(circle, #10b981, #064e3b)"
                            : "radial-gradient(circle, #FFD060, #4a3b00)",
                        }}
                      >
                        {isXp ? (
                          <span
                            className="font-display"
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color: "#fff",
                              letterSpacing: 0.5,
                              lineHeight: 1,
                            }}
                          >
                            XP
                          </span>
                        ) : (
                          <RingsCoin size={20} />
                        )}
                      </div>
                    </div>
                    <span
                      className="font-display tabular-nums"
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: isXp ? "#6ee7b7" : "#FFD060",
                      }}
                    >
                      +{r.amount}
                    </span>
                    <span
                      className="font-display"
                      style={{
                        fontSize: 11,
                        color: "#dbdee1",
                        marginTop: 2,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {isXp ? "XP" : "Rings"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer / claim button */}
            <div className="px-5 pb-5">
              <button
                onClick={claimedToday ? handleClose : handleClaim}
                disabled={loading}
                className="font-display w-full flex items-center justify-center gap-2 py-3 uppercase transition-colors disabled:opacity-60"
                style={{
                  background: claimedToday ? "#1f1f23" : "#10b981",
                  color: claimedToday ? "#dbdee1" : "#0a0a0a",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : claimedToday ? (
                  <>
                    <Check className="w-4 h-4" />
                    {lastReward
                      ? `+${lastReward.amount} ${lastReward.kind === "xp" ? "XP" : "Rings"} claimed`
                      : "Already claimed today"}
                  </>
                ) : (
                  <>Claim Day {todayDay}</>
                )}
              </button>
              <p
                style={{
                  fontSize: 11,
                  color: "#71717a",
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                Come back tomorrow to keep your streak alive
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}