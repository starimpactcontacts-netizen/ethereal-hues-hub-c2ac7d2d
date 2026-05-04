import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Swords, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ScenepackButtons from "./ScenepackButtons";

type Pool = {
  id: string;
  title: string;
  series: string | null;
  preview_video_url: string | null;
  thumbnail_url: string | null;
  scenepack_youtube_url: string | null;
  scenepack_gdrive_url: string | null;
};

interface Props {
  battleId: string;
  isCash?: boolean;
  isParticipant: boolean;
  optionAId: string | null;
  optionBId: string | null;
  voteDeadline: string | null;
  myVote: string | null;
  opponentVote: string | null;
  lockedId: string | null;
  lockedYoutube?: string | null;
  lockedGdrive?: string | null;
  onChanged?: () => void;
}

export default function ScenepackVote({
  battleId, isCash = false, isParticipant,
  optionAId, optionBId, voteDeadline,
  myVote, opponentVote, lockedId, lockedYoutube, lockedGdrive, onChanged,
}: Props) {
  const [pool, setPool] = useState<Record<string, Pool>>({});
  const [voting, setVoting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const polledRef = useRef(false);

  useEffect(() => {
    const ids = [optionAId, optionBId, lockedId].filter(Boolean) as string[];
    if (!ids.length) return;
    supabase.from("scenepack_pool").select("*").in("id", ids).then(({ data }) => {
      if (!data) return;
      const map: Record<string, Pool> = {};
      data.forEach((d: any) => { map[d.id] = d; });
      setPool(map);
    });
  }, [optionAId, optionBId, lockedId]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  const msLeft = voteDeadline ? Math.max(0, new Date(voteDeadline).getTime() - now) : 0;
  const secLeft = Math.ceil(msLeft / 1000);
  const expired = voteDeadline && msLeft <= 0;

  // Poke server to resolve when expired
  useEffect(() => {
    if (!expired || lockedId || polledRef.current) return;
    polledRef.current = true;
    (async () => {
      try {
        await supabase.rpc("resolve_scenepack_if_expired" as any, { p_battle_id: battleId, p_is_cash: isCash } as any);
        onChanged?.();
      } catch {}
      polledRef.current = false;
    })();
  }, [expired, lockedId, battleId, isCash, onChanged]);

  const cast = async (id: string) => {
    if (!isParticipant || voting || myVote || lockedId) return;
    setVoting(true);
    try {
      const { error } = await supabase.rpc("cast_scenepack_vote" as any, { p_battle_id: battleId, p_scenepack_id: id, p_is_cash: isCash } as any);
      if (error) throw error;
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Vote failed");
    } finally {
      setVoting(false);
    }
  };

  if (!optionAId || !optionBId) return null;

  const a = pool[optionAId];
  const b = pool[optionBId];
  const locked = lockedId ? pool[lockedId] : null;

  // LOCKED state — show winner + download
  if (locked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-emerald-400 font-bold">Scenepack Locked</p>
            <p className="text-sm font-bold text-foreground" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>
              {locked.title}{locked.series ? ` · ${locked.series}` : ''}
            </p>
          </div>
        </div>
        {locked.preview_video_url && (
          <video src={locked.preview_video_url} muted loop autoPlay playsInline
            className="w-full aspect-video rounded-xl object-cover bg-black mb-2" />
        )}
        <ScenepackButtons
          youtubeUrl={lockedYoutube || locked.scenepack_youtube_url}
          gdriveUrl={lockedGdrive || locked.scenepack_gdrive_url}
          legacyUrl={locked.preview_video_url}
          variant="compact"
        />
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-black/40">
        <div className="flex items-center gap-2">
          <Swords className="w-3.5 h-3.5 text-amber-400" />
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground">Pick Your Scenepack</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className={`w-3 h-3 ${secLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-muted-foreground'}`} />
          <span className={`text-xs font-mono font-bold tabular-nums ${secLeft <= 10 ? 'text-red-400' : 'text-foreground'}`}>
            {String(secLeft).padStart(2, '0')}s
          </span>
        </div>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-px bg-border/50">
        {[a, b].map((sp, i) => {
          if (!sp) return <div key={i} className="bg-card aspect-[3/4] flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;
          const picked = myVote === sp.id;
          const oppPicked = opponentVote === sp.id;
          const disabled = !isParticipant || !!myVote || voting;
          return (
            <motion.button
              key={sp.id}
              onClick={() => cast(sp.id)}
              disabled={disabled}
              whileTap={!disabled ? { scale: 0.97 } : undefined}
              className={`relative bg-card aspect-[3/4] overflow-hidden text-left transition-all ${picked ? 'ring-2 ring-emerald-400 ring-inset' : ''}`}
            >
              {sp.preview_video_url ? (
                <video src={sp.preview_video_url} muted loop autoPlay playsInline
                  className="absolute inset-0 w-full h-full object-cover" />
              ) : sp.thumbnail_url ? (
                <img src={sp.thumbnail_url} className="absolute inset-0 w-full h-full object-cover" alt={sp.title} />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              {/* Letter badge */}
              <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center">
                <span className="text-xs font-black text-white" style={{ fontFamily: 'Teko, sans-serif' }}>{i === 0 ? 'A' : 'B'}</span>
              </div>

              {/* Opponent picked dot */}
              {oppPicked && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-red-500/90 text-white text-[8px] font-bold uppercase tracking-wider">
                  OPP
                </div>
              )}

              {/* Title */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-[9px] uppercase tracking-wider text-white/60 font-bold mb-0.5">{sp.series}</p>
                <p className="text-sm font-bold text-white leading-tight" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>
                  {sp.title}
                </p>
              </div>

              <AnimatePresence>
                {picked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/40">
                      <Check className="w-7 h-7 text-black" strokeWidth={3.5} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-black/40 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          {!isParticipant ? "Editors are voting on the scenepack..." :
           myVote ? "Vote locked. Waiting for opponent or timer..." :
           "Pick the scenepack you want to edit. Coin flip on tie."}
        </p>
      </div>
    </div>
  );
}
