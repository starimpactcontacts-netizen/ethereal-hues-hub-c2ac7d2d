import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Plus, Share2, Users, Info, X, Gavel, Hourglass, Radio, Timer, Vote, Lock, Key } from "lucide-react";
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
            <button
              onClick={() => setShowInfo(true)}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-gold/10 border border-gold/30 hover:bg-gold/20 active:scale-90 transition-all touch-manipulation"
              aria-label="How Competitions work"
            >
              <Info className="w-3 h-3 text-gold" strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCodeOpen(true)}
              className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-300 border border-amber-400/30 hover:bg-amber-400/10 rounded transition-colors whitespace-nowrap"
              aria-label="Join competition with code"
            >
              <Key className="w-3 h-3" strokeWidth={2.5} /> Code
            </button>
            <button
              onClick={() => navigate('/competitions')}
              className="flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1 whitespace-nowrap"
              aria-label="View all competitions"
            >
              View All
            </button>
            <button
              onClick={onCreateClick}
              className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-gold border border-gold/20 hover:bg-gold/10 rounded transition-colors"
            >
              <Plus className="w-3 h-3" /> Create
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
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-gold/20 flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto"
              style={{
                background: 'linear-gradient(165deg, #1a1410 0%, #0a0a0d 60%, #100a14 100%)',
                boxShadow: '0 30px 80px -20px rgba(234,179,8,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06] rounded-t-3xl overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-50" style={{
                  background: 'radial-gradient(circle at 30% 0%, rgba(234,179,8,0.25), transparent 60%)',
                }} />
                <button
                  onClick={() => setShowInfo(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
                <div className="relative flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, hsl(43, 96%, 55%), hsl(38, 92%, 45%))',
                    boxShadow: '0 8px 20px -8px rgba(234,179,8,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
                  }}>
                    <Trophy className="w-5 h-5 text-black" strokeWidth={2.8} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[22px] font-black text-white leading-none uppercase" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.01em' }}>
                      Competitions
                    </h2>
                    <p className="text-[11px] font-bold text-gold/80 uppercase tracking-[0.15em] mt-0.5">Up to 10 editors · One winner</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 overscroll-contain">
                {[
                  { icon: Users, color: '#10b981', title: 'Open or private lobby', desc: 'Up to 10 editors per room. Make it public, or lock it private with a 4-character join code.' },
                  { icon: Timer, color: '#fbbf24', title: 'Host picks the window', desc: 'Pick 15, 30, 45 or 60 minutes when you create the room. Once the host starts it, the timer is locked — no extensions.' },
                  { icon: Trophy, color: '#a855f7', title: 'Optional theme', desc: 'Host can set a theme prompt (song, vibe, brief). Any software allowed — CapCut, Premiere, AE, mobile, anything.' },
                  { icon: Vote, color: '#3b82f6', title: 'Community vote decides', desc: 'After submissions close, the lobby + viewers vote on every entry. Most votes takes the win and the IDX pool.' },
                ].map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{
                        background: `${step.color}1a`,
                        border: `1px solid ${step.color}40`,
                      }}>
                        <Icon className="w-4 h-4" style={{ color: step.color }} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-white/40">0{i + 1}</span>
                          <h3 className="text-[13px] font-extrabold text-white leading-tight">{step.title}</h3>
                        </div>
                        <p className="text-[11.5px] text-white/55 leading-snug mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10.5px] text-white/40 leading-snug px-1 pt-1">
                  💡 The more editors who join, the bigger the IDX reward pool grows.
                </p>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-white/[0.06] shrink-0 rounded-b-3xl">
                <button
                  onClick={() => { setShowInfo(false); onCreateClick(); }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-black uppercase active:scale-[0.98] transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, hsl(43, 96%, 55%), hsl(38, 92%, 45%))',
                    boxShadow: '0 12px 28px -10px rgba(234,179,8,0.55), inset 0 1px 0 rgba(255,255,255,0.3)',
                    fontFamily: 'Teko, sans-serif',
                    letterSpacing: '0.05em',
                    fontSize: 16,
                  }}
                >
                  <Plus className="w-4 h-4" strokeWidth={3} /> Create Competition
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
