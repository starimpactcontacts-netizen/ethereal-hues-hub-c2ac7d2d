import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, DollarSign, Download, Loader2, Mail, Swords, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useCashBattles, useMyCashBattleApplication, useMyCashBattles } from "@/hooks/useCashBattles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CashBattleReadyPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { battles: publicBattles } = useCashBattles();
  const { application, loading: applicationLoading, joinPool, refetch: refetchApplication } = useMyCashBattleApplication();
  const { battles: myBattles, loading: myBattlesLoading, refetch: refetchMyBattles } = useMyCashBattles();
  const [autoJoining, setAutoJoining] = useState(false);
  const autoJoinRef = useRef(false);
  const routedBattleRef = useRef(false);
  const attemptedTargetAppRef = useRef<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const targetAppId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("match") : null;

  const featuredBattle = useMemo(
    () =>
      publicBattles.find((b) => b.status === "live" && b.scenepack_url) ??
      publicBattles.find((b) => b.scenepack_url) ??
      publicBattles.find((b) => b.status === "live") ??
      publicBattles[0] ?? null,
    [publicBattles],
  );

  useEffect(() => {
    if (!user || !profile) navigate("/start", { replace: true });
  }, [user, profile, navigate]);

  useEffect(() => {
    if (!myBattles.length || routedBattleRef.current) return;
    routedBattleRef.current = true;
    toast.success("Opponent found — battle ready");
    navigate(`/cash-battle/${myBattles[0].id}`, { replace: true });
  }, [myBattles, navigate]);

  useEffect(() => {
    if (!user || !profile || applicationLoading || myBattlesLoading || autoJoinRef.current) return;
    if (application || myBattles.length > 0) return;
    autoJoinRef.current = true;
    setAutoJoining(true);
    attemptedTargetAppRef.current = targetAppId;
    void joinPool(targetAppId || undefined).then((joined) => {
      if (!joined) autoJoinRef.current = false;
      if (joined && joined.state === "live" && joined.battleId) {
        routedBattleRef.current = true;
        navigate(`/cash-battle/${joined.battleId}`, { replace: true });
        return;
      }
      setAutoJoining(false);
    });
  }, [user, profile, applicationLoading, myBattlesLoading, application, myBattles.length, joinPool, navigate, targetAppId]);

  useEffect(() => {
    if (!user || myBattles.length > 0) return;
    const interval = window.setInterval(() => {
      void refetchApplication();
      void refetchMyBattles();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [user, myBattles.length, refetchApplication, refetchMyBattles]);

  useEffect(() => {
    if (!application || !targetAppId || attemptedTargetAppRef.current !== targetAppId) return;
    if (application.id === targetAppId) return;
    if (application.status === "pending" && autoJoinRef.current) {
      autoJoinRef.current = false;
      setAutoJoining(false);
    }
  }, [application, targetAppId]);

  const handleEmailReminder = async () => {
    if (!email || !user) return;
    try {
      await supabase.from('profiles').update({ notification_email: email } as any).eq('id', user.id);
      setEmailSaved(true);
      toast.success("We'll notify you when your match starts");
    } catch {
      toast.error("Failed to save");
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header — clean, no "live now" */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface-1 border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-2xl bg-surface-1 border border-border flex items-center justify-center">
              <DollarSign className="w-4.5 h-4.5 text-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[26px] leading-none font-display">Cash Battle</h1>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-bold">1v1 · Winner takes all</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-10 space-y-3">
        {/* VS Card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-border bg-card overflow-hidden relative"
        >
          {/* VS Layout */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0 px-4 py-6">
            {/* You — blue corner */}
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-[56px] h-[56px] ring-2 ring-blue-500/30">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="bg-accent text-foreground text-lg font-black">
                  {profile.username?.charAt(0)?.toUpperCase() || "Y"}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-display mt-2 truncate max-w-[100px]">{profile.username}</p>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5">
                <Zap className="w-2.5 h-2.5 text-blue-400" />
                <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-blue-400">Ready</span>
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center px-3">
              <div className="w-10 h-10 rounded-full border border-border bg-surface-1 flex items-center justify-center">
                <span className="text-xs font-black text-muted-foreground">VS</span>
              </div>
            </div>

            {/* Opponent — red corner */}
            <div className="flex flex-col items-center text-center">
              <div className="w-[56px] h-[56px] rounded-full border-2 border-dashed border-border bg-surface-1 flex items-center justify-center">
                {autoJoining ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                ) : (
                  <Swords className="w-5 h-5 text-muted-foreground/50" />
                )}
              </div>
              <p className="text-sm font-display mt-2 text-muted-foreground">???</p>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5">
                <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-destructive">Open</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-px bg-border/50">
            <div className="bg-card px-4 py-3 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-lg leading-none font-display">24h</p>
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5">Timer</p>
              </div>
            </div>
            <div className="bg-card px-4 py-3 flex items-center gap-2.5">
              {featuredBattle?.scenepack_url ? (
                <a href={featuredBattle.scenepack_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 w-full">
                  <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-lg leading-none font-display text-emerald-400">Pack</p>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5">Scenepack</p>
                  </div>
                </a>
              ) : (
                <>
                  <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-lg leading-none font-display">Pack</p>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5">Scenepack</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.section>

        {/* Email reminder */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-[20px] border border-border bg-card p-4"
        >
          {emailSaved ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-muted-foreground">We'll email you when your opponent locks in.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-bold">Get notified</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 min-w-0 rounded-xl bg-background border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-destructive/30"
                />
                <button
                  onClick={handleEmailReminder}
                  disabled={!email}
                  className="rounded-xl bg-destructive/90 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white disabled:opacity-40 shrink-0"
                >
                  Notify me
                </button>
              </div>
            </>
          )}
        </motion.section>

        {/* Status pulse */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[20px] border border-destructive/20 bg-destructive/8 p-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-destructive font-bold">
              {autoJoining && !application ? "Joining" : "Searching"}
            </p>
          </div>
          <p className="font-display text-xl leading-none">
            {autoJoining && !application ? "Joining battle..." : "Waiting for opponent"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5">Auto-match when someone joins</p>
        </motion.div>
      </div>
    </div>
  );
}
