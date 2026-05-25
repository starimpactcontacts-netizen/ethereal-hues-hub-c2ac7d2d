import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Plus, Share2, Users, Info, X, Gavel, Hourglass, Radio, Timer, Vote, Lock, Key, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCompetitionsList, type Competition } from "@/hooks/useCompetitions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArenaRail, ArenaRailSkeleton } from "@/components/loopgate/ArenaCarouselSystem";
import { LobbyDefaultCover } from "@/components/loopgate/LobbyDefaultCover";
import JoinByCodeModal from "@/components/loopgate/JoinByCodeModal";

const CARD_W = 160;
const CARD_H = 220;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${n}`;
}

function CompetitionCard({ comp, onJoin }: { comp: Competition; onJoin: (id: string) => void }) {
  const navigate = useNavigate();
  const spotsLeft = comp.max_players - comp.current_players;
  const isLive = comp.status === "live";
  const isFull = spotsLeft <= 0;
  const statusLabel = isLive
    ? "LIVE NOW"
    : isFull
      ? "LOBBY FULL"
      : comp.current_players <= 1
        ? "WAITING FOR EDITORS"
        : `WAITING · ${spotsLeft} SPOT${spotsLeft === 1 ? "" : "S"} LEFT`;
  const statusColor = isLive ? "text-red-400" : isFull ? "text-gold" : "text-emerald-400";
  const StatusIcon = isLive ? Radio : isFull ? Trophy : Hourglass;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanUrl = `${window.location.origin}/competition/${comp.slug || comp.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: comp.name, url: cleanUrl });
      } else {
        await navigator.clipboard.writeText(cleanUrl);
        toast.success("Link copied!");
      }
    } catch {}
  };

  return (
    <div className="shrink-0 snap-start" style={{ width: CARD_W, height: CARD_H }}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(`/competition/${comp.slug || comp.id}`)}
        className="relative w-full h-full bg-surface-1 border border-white/[0.06] overflow-hidden rounded-2xl cursor-pointer flex flex-col"
      >
        {/* Cover — fills most of the square */}
        <div className="relative flex-1 overflow-hidden">
          {comp.cover_image_url ? (
            <img
              src={comp.cover_image_url}
              alt={comp.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <LobbyDefaultCover name={comp.name} variant="card" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          <button
            onClick={handleShare}
            className="absolute top-2 right-2 z-20 p-1.5 bg-black/50 backdrop-blur-md rounded-full active:scale-90"
          >
            <Share2 className="w-3 h-3 text-white/70" />
          </button>

          {comp.is_private && (
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-fuchsia-500/20 backdrop-blur-md border border-fuchsia-400/40">
              <Lock className="w-2.5 h-2.5 text-fuchsia-200" strokeWidth={2.5} />
              <span className="text-[8px] font-black uppercase tracking-wider text-fuchsia-100">Private</span>
            </div>
          )}

          {/* Title overlaid bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="text-[12px] font-bold text-white leading-tight line-clamp-2" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              {comp.name}
            </h3>
          </div>
        </div>

        {/* Roblox-style footer: stats + join */}
        <div className="px-2.5 py-2 flex items-center justify-between gap-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-300 min-w-0 w-full">
            <span className="flex items-center gap-1 whitespace-nowrap text-zinc-400">
              <Users className="w-3 h-3" strokeWidth={2.5} />
              {comp.current_players}/{comp.max_players}
            </span>
            <span className="text-white/15">·</span>
            <span className={`flex items-center gap-1 whitespace-nowrap ${statusColor} truncate`}>
              <StatusIcon className="w-2.5 h-2.5" strokeWidth={2.5} />
              <span className="truncate tracking-wider">{statusLabel}</span>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ArenaCompetitionsSection({ onCreateClick, hideHeader = false }: { onCreateClick: () => void; hideHeader?: boolean }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { competitions: comps, loading } = useCompetitionsList();
  const [showInfo, setShowInfo] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  const handleJoin = async (compId: string) => {
    if (!user || !profile) { navigate("/start"); return; }

    // Private rooms — go to lobby and let user enter code there
    const target = comps.find(c => c.id === compId);
    if (target?.is_private && target.creator_id !== user.id) {
      navigate(`/competition/${target.slug || compId}`);
      return;
    }

    const { data: existing } = await supabase
      .from("competition_participants")
      .select("id")
      .eq("competition_id", compId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) { navigate(`/competition/${compId}`); return; }

    const { error } = await supabase.from("competition_participants").insert({
      competition_id: compId,
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
    });

    if (error) { toast.error(error.message || "Failed to join"); return; }
    toast.success("🏆 You're in!");
    navigate(`/competition/${compId}`);
  };

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            <span className="text-[15px] font-extrabold text-foreground tracking-tight" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              Competitions
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowInfo(true)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.06] active:scale-90 transition-all"
              aria-label="How Competitions work"
            >
              <Info className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setCodeOpen(true)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.06] active:scale-90 transition-all"
              aria-label="Join with code"
            >
              <Key className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            <button
              onClick={onCreateClick}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.06] active:scale-90 transition-all"
              aria-label="Create competition"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            <button
              onClick={() => navigate('/competitions')}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.06] active:scale-90 transition-all"
              aria-label="View all competitions"
            >
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <ArenaRailSkeleton count={3} />
      ) : (
        <ArenaRail>
          {comps.map(comp => <CompetitionCard key={comp.id} comp={comp} onJoin={handleJoin} />)}

          {/* Create Your Own — square poster */}
          <div className="shrink-0 snap-start" style={{ width: CARD_W, height: CARD_H }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={onCreateClick}
              className="relative w-full h-full bg-surface-1 border border-dashed border-white/[0.1] overflow-hidden rounded-2xl cursor-pointer hover:border-gold/30 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-[12px] font-bold text-foreground" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                Create
              </h3>
              <p className="text-[9px] text-muted-foreground">Set theme, invite editors</p>
            </motion.div>
          </div>
        </ArenaRail>
      )}

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInfo(false)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-[#0f0f11] border border-white/[0.07] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-[1.6rem] font-black text-white uppercase leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Competitions
                  </h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.14em] mt-0.5">Up to 10 editors · one winner</p>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white/50" />
                </button>
              </div>

              {/* Steps */}
              <div className="px-5 py-4 space-y-3">
                {[
                  { n: '01', icon: Users,  title: 'Open or private lobby',   desc: 'Up to 10 editors per room. Public or locked with a 4-character join code.' },
                  { n: '02', icon: Timer,  title: 'Host picks the window',   desc: '15, 30, 45 or 60 minutes. Once started the timer is locked — no extensions.' },
                  { n: '03', icon: Trophy, title: 'Optional theme',          desc: 'Host sets a prompt (song, vibe, brief). Any software — CapCut, Premiere, AE, mobile.' },
                  { n: '04', icon: Vote,   title: 'Community vote decides',  desc: 'Lobby + viewers vote after submissions. Most votes wins the IDX pool.' },
                ].map(({ n, icon: Icon, title, desc }) => (
                  <div key={n} className="flex items-start gap-3">
                    <span className="text-[11px] font-black text-white/20 w-5 shrink-0 mt-0.5 tabular-nums">{n}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className="w-3 h-3 text-white/40 shrink-0" strokeWidth={2.5} />
                        <p className="text-[12px] font-bold text-white/80 leading-none">{title}</p>
                      </div>
                      <p className="text-[11px] text-white/35 leading-snug">{desc}</p>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-white/25 leading-snug pt-1">
                  More editors = bigger IDX reward pool.
                </p>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => { setShowInfo(false); onCreateClick(); }}
                  className="w-full py-3 rounded-xl bg-gold text-black font-black text-sm uppercase tracking-wide hover:bg-gold/90 active:scale-[0.98] transition-all"
                  style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.06em', fontSize: 15 }}
                >
                  + Create Competition
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <JoinByCodeModal open={codeOpen} onOpenChange={setCodeOpen} scope="competition" />
    </motion.section>
  );
}
