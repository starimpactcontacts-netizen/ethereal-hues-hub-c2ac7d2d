import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import loopgateLogo from "@/assets/loopgate-logo.png";

const teko = { fontFamily: "Teko, sans-serif" };

interface Props {
  fightId: string;
  redUserId: string;
  blueUserId: string;
  redUsername: string;
  blueUsername: string;
  redAvatarUrl?: string | null;
  blueAvatarUrl?: string | null;
  /** Optional — highlights the active side (e.g. the side currently playing). */
  activeSide?: "red" | "blue" | null;
}

/**
 * Friday Night Funkin'-style vote health bar.
 * Two avatars on each side, animated red/blue split bar in the middle, live vote counts.
 */
export default function FNFVoteScoreboard({
  fightId,
  redUserId,
  blueUserId,
  redUsername,
  blueUsername,
  redAvatarUrl,
  blueAvatarUrl,
  activeSide = null,
}: Props) {
  const [redVotes, setRedVotes] = useState(0);
  const [blueVotes, setBlueVotes] = useState(0);
  const barWrapRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const redGlowRef = useRef<HTMLDivElement>(null);
  const blueGlowRef = useRef<HTMLDivElement>(null);

  // Audio-reactive bounce — taps the currently playing unmuted <video>
  // via Web Audio AnalyserNode. Falls back to a soft idle pulse.
  useEffect(() => {
    let raf = 0;
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArr: Uint8Array | null = null;
    let hookedEl: HTMLMediaElement | null = null;
    const attached = new WeakSet<HTMLMediaElement>();

    const tryHook = () => {
      if (analyser && hookedEl && !hookedEl.paused && !hookedEl.muted) return;
      const vids = Array.from(document.querySelectorAll("video")) as HTMLVideoElement[];
      const playing = vids.find((v) => !v.paused && !v.muted && v.readyState >= 2);
      if (!playing || attached.has(playing)) {
        hookedEl = playing || hookedEl;
        return;
      }
      try {
        if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = ctx.createMediaElementSource(playing);
        const a = ctx.createAnalyser();
        a.fftSize = 64;
        src.connect(a);
        a.connect(ctx.destination);
        analyser = a;
        dataArr = new Uint8Array(new ArrayBuffer(a.frequencyBinCount));
        attached.add(playing);
        hookedEl = playing;
      } catch {
        // CORS / already-connected — fallback pulse continues
      }
    };

    let lastT = 0;
    const loop = (t: number) => {
      if (t - lastT > 90) tryHook();
      let amp = 0;
      if (analyser && dataArr) {
        analyser.getByteFrequencyData(dataArr as any);
        let sum = 0;
        const n = Math.min(8, dataArr.length);
        for (let i = 0; i < n; i++) sum += dataArr[i];
        amp = sum / (n * 255);
      } else {
        amp = 0.12 + 0.08 * Math.abs(Math.sin(t / 380));
      }
      const scale = 1 + Math.min(0.4, amp * 0.6);
      if (chipRef.current) {
        chipRef.current.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      }
      if (redGlowRef.current) redGlowRef.current.style.opacity = String(0.2 + amp * 0.75);
      if (blueGlowRef.current) blueGlowRef.current.style.opacity = String(0.2 + amp * 0.75);
      if (barWrapRef.current) {
        barWrapRef.current.style.boxShadow = `0 0 ${6 + amp * 18}px rgba(255,255,255,${0.08 + amp * 0.18})`;
      }
      lastT = t;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      try { ctx?.close(); } catch {}
    };
  }, []);

  useEffect(() => {
    if (!fightId) return;
    const fetchVotes = async () => {
      const { data } = await supabase
        .from("quick_fight_votes")
        .select("voted_for")
        .eq("fight_id", fightId);
      if (!data) return;
      let r = 0,
        b = 0;
      for (const v of data) {
        if (v.voted_for === redUserId) r++;
        else if (v.voted_for === blueUserId) b++;
      }
      setRedVotes(r);
      setBlueVotes(b);
    };
    fetchVotes();
    const ch = supabase
      .channel(`fnf_votes_${fightId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quick_fight_votes", filter: `fight_id=eq.${fightId}` },
        fetchVotes,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fightId, redUserId, blueUserId]);

  const total = redVotes + blueVotes;
  const redBarPct = total === 0 ? 50 : (redVotes / total) * 100;
  const blueBarPct = 100 - redBarPct;
  const leading: "red" | "blue" | null =
    total === 0 ? null : redVotes === blueVotes ? null : redVotes > blueVotes ? "red" : "blue";

  const SideAvatar = ({
    side,
    username,
    avatarUrl,
  }: {
    side: "red" | "blue";
    username: string;
    avatarUrl?: string | null;
  }) => {
    const isRed = side === "red";
    const ring = isRed ? "ring-red-500" : "ring-blue-500";
    const glow = isRed ? "0 0 14px rgba(239,68,68,0.7)" : "0 0 14px rgba(59,130,246,0.7)";
    const isActive = activeSide === side;
    return (
      <div
        className={`shrink-0 w-8 h-8 rounded-full overflow-hidden bg-black ring-2 ${ring} ${isActive ? "animate-pulse" : ""}`}
        style={{ boxShadow: glow }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center text-white text-base font-black ${isRed ? "bg-red-500/30" : "bg-blue-500/30"}`}
            style={teko}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    );
  };

  // Mortal-Kombat style parallelogram health bar (slanted ends)
  const MK_CLIP = "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)";

  return (
    <div className="relative bg-black z-20 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div
            ref={redGlowRef}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: "0 0 22px rgba(239,68,68,0.7)", opacity: 0.3, transition: "opacity 80ms linear" }}
          />
          <SideAvatar side="red" username={redUsername} avatarUrl={redAvatarUrl} />
        </div>

        {/* Health bar */}
        <div className="relative flex-1 h-4">
          <div
            ref={barWrapRef}
            className="absolute inset-0 overflow-hidden border border-white/10 bg-black/80 flex"
            style={{ transition: "box-shadow 80ms linear", clipPath: MK_CLIP }}
          >
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${redBarPct}%`,
                background: "linear-gradient(90deg, #b91c1c 0%, #ef4444 60%, #f87171 100%)",
                boxShadow: "inset 0 0 8px rgba(239,68,68,0.7), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            />
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${blueBarPct}%`,
                background: "linear-gradient(90deg, #60a5fa 0%, #3b82f6 40%, #1d4ed8 100%)",
                boxShadow: "inset 0 0 8px rgba(59,130,246,0.7), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            />
          </div>

          {/* Vote counts */}
          <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none">
            <span
              className="text-[10px] font-black text-white tabular-nums leading-none"
              style={{ ...teko, textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
            >
              {redVotes}
            </span>
            <span
              className="text-[10px] font-black text-white tabular-nums leading-none"
              style={{ ...teko, textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
            >
              {blueVotes}
            </span>
          </div>

          {/* Loopgate chip — sits at the boundary between red & blue (shows who's winning) */}
          <div
            className="absolute top-1/2 transition-[left] duration-700 ease-out"
            style={{ left: `${redBarPct}%` }}
          >
            <div
              ref={chipRef}
              className="w-7 h-7 rounded-full bg-black flex items-center justify-center overflow-hidden will-change-transform"
              style={{
                transform: "translate(-50%, -50%)",
                border: "1.5px solid rgba(255,255,255,0.35)",
                boxShadow:
                  "0 0 10px rgba(0,0,0,0.95), 0 0 14px rgba(239,68,68,0.5), 0 0 14px rgba(59,130,246,0.5)",
              }}
            >
              <img
                src={loopgateLogo}
                alt="Loopgate"
                className="w-5 h-5 object-contain"
                draggable={false}
              />
            </div>
          </div>
        </div>

        <div className="relative">
          <div
            ref={blueGlowRef}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: "0 0 22px rgba(59,130,246,0.7)", opacity: 0.3, transition: "opacity 80ms linear" }}
          />
          <SideAvatar side="blue" username={blueUsername} avatarUrl={blueAvatarUrl} />
        </div>
      </div>

      {/* Sub-row */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400 truncate max-w-[45%]" style={teko}>
          @{redUsername}
        </span>
        {total > 0 && (
          <span className="text-[8px] uppercase tracking-[0.25em] text-zinc-500 tabular-nums" style={teko}>
            {`${total} ${total === 1 ? "VOTE" : "VOTES"}${leading ? ` · ${leading.toUpperCase()} LEADS` : ""}`}
          </span>
        )}
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 truncate max-w-[45%] text-right" style={teko}>
          @{blueUsername}
        </span>
      </div>
    </div>
  );
}