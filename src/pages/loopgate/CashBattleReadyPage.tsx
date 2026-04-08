import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, DollarSign, Download, Loader2, Swords, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useCashBattles, useMyCashBattleApplication, useMyCashBattles } from "@/hooks/useCashBattles";
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

  const featuredBattle = useMemo(
    () =>
      publicBattles.find((battle) => battle.status === "live" && battle.scenepack_url) ??
      publicBattles.find((battle) => battle.scenepack_url) ??
      publicBattles.find((battle) => battle.status === "live") ??
      publicBattles[0] ??
      null,
    [publicBattles],
  );

  const liveNowCount = publicBattles.filter((battle) => battle.status === "live").length;
  const lobbyCount = publicBattles.filter((battle) => battle.status === "upcoming").length;

  useEffect(() => {
    if (!user || !profile) {
      navigate("/start", { replace: true });
    }
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

    void joinPool().then((joined) => {
      if (!joined) autoJoinRef.current = false;
      setAutoJoining(false);
    });
  }, [user, profile, applicationLoading, myBattlesLoading, application, myBattles.length, joinPool]);

  useEffect(() => {
    if (!user || myBattles.length > 0) return;

    const interval = window.setInterval(() => {
      void refetchApplication();
      void refetchMyBattles();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [user, myBattles.length, refetchApplication, refetchMyBattles]);

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-surface-1 border border-border flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-2xl bg-surface-1 border border-border flex items-center justify-center">
              <DollarSign className="w-4.5 h-4.5 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.2em] text-destructive font-bold">Live now</p>
              <h1 className="text-[26px] leading-none text-white">Cash Battle</h1>
            </div>
          </div>

          <div className="rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">1v1</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-10 space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-border bg-card p-5 overflow-hidden relative"
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-destructive/10 to-transparent pointer-events-none" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="inline-flex items-center gap-1 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-destructive">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  Live now
                </span>
                <span className="inline-flex items-center rounded-full border border-border bg-surface-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Editors waiting
                </span>
              </div>

              <h2 className="text-white text-[38px] leading-none">Waiting for opponent</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-[240px]">
                You’re already in. Match instantly when another editor locks the other slot.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-1 px-3 py-2 text-right shrink-0 min-w-[92px]">
              <p className="text-2xl leading-none text-white font-display">{liveNowCount}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Live now</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.18em]">Timer</span>
              </div>
              <p className="text-[34px] text-white leading-none font-display">60M</p>
              <p className="text-xs text-muted-foreground mt-1">Starts the second your match goes live</p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Swords className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.18em]">Lobby</span>
              </div>
              <p className="text-[34px] text-white leading-none font-display">{Math.max(lobbyCount, 1)}</p>
              <p className="text-xs text-muted-foreground mt-1">Match-ready battles opening right now</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[28px] border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-bold">Battle UI</p>
              <p className="text-lg text-white font-display">Opponent slot is open</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-destructive font-bold">Match instantly</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface-1 p-4 flex flex-col items-center text-center">
              <Avatar className="w-16 h-16 ring-2 ring-white/10">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="bg-accent text-foreground text-lg font-black">
                  {profile.username?.charAt(0)?.toUpperCase() || "Y"}
                </AvatarFallback>
              </Avatar>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-3">You</p>
              <p className="text-lg text-white font-display truncate max-w-full">{profile.username}</p>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-1">
                <Zap className="w-3 h-3 text-destructive" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-destructive">Locked in</span>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-background/60 p-4 flex flex-col items-center justify-center text-center min-h-[192px]">
              <div className="w-16 h-16 rounded-full border border-border bg-surface-1 flex items-center justify-center">
                {autoJoining ? (
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                ) : (
                  <Swords className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-3">Opponent slot</p>
              <p className="text-lg text-white font-display">Open now</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-[140px]">
                Another editor can lock this side at any second.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[28px] border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-bold">Scenepack</p>
              <p className="text-lg text-white font-display">Sponsor assets load with the match</p>
            </div>

            {featuredBattle?.scenepack_url ? (
              <a
                href={featuredBattle.scenepack_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400"
              >
                <Download className="w-3 h-3" />
                Scenepack
              </a>
            ) : null}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Sponsor-funded fights drop the scenepack straight into the battle screen so you can start editing without extra setup.
          </p>
        </motion.section>

        <div className="rounded-[24px] border border-destructive/25 bg-destructive/10 p-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-destructive font-bold">Status</p>
          <p className="text-white font-display text-[28px] leading-none mt-2">
            {autoJoining && !application ? "Joining battle" : "Waiting for opponent"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Stay here — we’ll throw you straight into the live 1v1 screen when a match lands.
          </p>
        </div>
      </div>
    </div>
  );
}