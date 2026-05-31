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

function getDurationLabel(comp: Competition): string | null {
  const dm = (comp as any).duration_minutes as number | undefined;
  let mins: number | null = null;
  if (dm && dm > 0) {
    mins = dm;
  } else if (comp.started_at && comp.deadline) {
    mins = Math.round((new Date(comp.deadline).getTime() - new Date(comp.started_at).getTime()) / 60000);
  }
  if (!mins || mins <= 0) return null;
  if (mins < 60) return `${mins} MIN`;
  if (mins === 60) return '1 HR';
  const hrs = mins / 60;
  return `${Number.isInteger(hrs) ? hrs : hrs.toFixed(1)} HR`;
}

function CompetitionCard({ comp, onJoin }: { comp: Competition; onJoin: (id: string) => void }) {
  const durationLabel = getDurationLabel(comp);
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
        onClick={() => onJoin(comp.id)}
        className="relative w-full h-full overflow-hidden cursor-pointer flex flex-col"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }} />

        {/* Gold top accent bar */}
        <div className="absolute inset-x-0 top-0 h-[2px] pointer-events-none z-10" style={{
          background: 'linear-gradient(90deg, #f59e0b, rgba(245,158,11,0.3) 60%, transparent)',
        }} />

        {/* Corner notches — top-right */}
        <div className="absolute top-0 right-0 pointer-events-none z-10">
          <div className="w-3 h-px bg-white/20" />
          <div className="w-px h-3 bg-white/20 ml-auto" />
        </div>
        {/* Corner notches — bottom-left */}
        <div className="absolute bottom-0 left-0 pointer-events-none z-10">
          <div className="w-3 h-px bg-white/20" />
          <div className="w-px h-3 bg-white/20" />
        </div>

        {/* Cover — fills most of the card */}
        <div className="relative flex-1 overflow-hidden z-0">
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
          {/* Bottom gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

          {/* Share button */}
          <button
            onClick={handleShare}
            className="absolute top-2.5 right-2.5 z-20 w-6 h-6 flex items-center justify-center bg-black/60 active:scale-90"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Share2 className="w-3 h-3 text-white/60" />
          </button>

          {/* Top-left badges: duration + private */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1">
            {durationLabel && (
              <div className="flex items-center gap-1 px-1.5 py-0.5" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.13)' }}>
                <Timer className="w-2 h-2 text-amber-400/70" strokeWidth={2.5} />
                <span className="text-[8px] font-black uppercase tracking-wider text-white/75 leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>{durationLabel}</span>
              </div>
            )}
            {comp.is_private && (
              <div className="flex items-center gap-1 px-1.5 py-0.5" style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.35)' }}>
                <Lock className="w-2 h-2 text-purple-300" strokeWidth={2.5} />
                <span className="text-[7px] font-black uppercase tracking-wider text-purple-200 leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>Private</span>
              </div>
            )}
          </div>

          {/* Bottom overlay: theme + title */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10">
            {comp.theme && (
              <div className="flex items-center gap-1 mb-1">
                <span
                  className="text-[7px] font-black uppercase tracking-[0.16em] text-amber-400/80 leading-none"
                  style={{ fontFamily: 'Teko, sans-serif' }}
                >
                  THEME
                </span>
                <span className="w-px h-2.5 bg-white/15" />
                <span
                  className="text-[7px] font-black uppercase tracking-[0.1em] text-white/65 leading-none truncate"
                  style={{ fontFamily: 'Teko, sans-serif' }}
                >
                  {comp.theme}
                </span>
              </div>
            )}
            <h3
              className="text-[15px] font-black text-white leading-tight line-clamp-2 uppercase"
              style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}
            >
              {comp.name}
            </h3>
          </div>
        </div>

        {/* Footer: player count + status */}
        <div className="relative z-10 px-2.5 py-2 flex items-center gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Users className="w-2.5 h-2.5 text-white/30 shrink-0" strokeWidth={2.5} />
          <span className="text-[9px] font-black text-white/35 tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>
            {comp.current_players}/{comp.max_players}
          </span>
          <span className="text-white/15">·</span>
          <StatusIcon className="w-2.5 h-2.5 shrink-0" strokeWidth={2.5} style={{ color: isLive ? '#f87171' : isFull ? '#fbbf24' : '#34d399' }} />
          <span
            className={`text-[9px] font-black uppercase truncate leading-none ${statusColor}`}
            style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.08em' }}
          >
            {statusLabel}
          </span>
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

    const target = comps.find(c => c.id === compId);

    // Live — spectate only, no joining
    if (target?.status === 'live') {
      navigate(`/competition/${target.slug || compId}`);
      return;
    }

    // Full lobby — block entry
    if (target && target.current_players >= target.max_players) {
      toast.error("Lobby is full");
      return;
    }

    // Private rooms — go to lobby so user can enter the code
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
              className="relative w-full h-full overflow-hidden cursor-pointer flex flex-col items-center justify-center gap-2"
              style={{ background: '#0e0e0e', border: '1px dashed rgba(245,158,11,0.2)' }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }} />
              <div className="relative w-10 h-10 flex items-center justify-center" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
                <Plus className="w-5 h-5 text-amber-400/70" strokeWidth={2} />
              </div>
              <div className="relative text-center px-3">
                <p className="text-[13px] font-black text-white/60 uppercase leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>Create</p>
                <p className="text-[8px] text-white/25 uppercase tracking-[0.12em] mt-0.5" style={{ fontFamily: 'Teko, sans-serif' }}>Set theme · invite editors</p>
              </div>
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
