import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Plus, Users, Hourglass, Radio, Share2 } from "lucide-react";
import { useCompetitionsList, type Competition } from "@/hooks/useCompetitions";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LobbyDefaultCover } from "@/components/loopgate/LobbyDefaultCover";

const teko = { fontFamily: "Teko, sans-serif" };

function CompCard({ comp }: { comp: Competition }) {
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
        : `${spotsLeft} SPOT${spotsLeft === 1 ? "" : "S"} LEFT`;
  const statusColor = isLive ? "text-red-400" : isFull ? "text-gold" : "text-emerald-400";
  const StatusIcon = isLive ? Radio : isFull ? Trophy : Hourglass;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/competition/${comp.slug || comp.id}`;
    try {
      if (navigator.share) await navigator.share({ title: comp.name, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied!"); }
    } catch {}
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/competition/${comp.slug || comp.id}`)}
      className="relative bg-surface-1 border border-white/[0.06] overflow-hidden rounded-2xl cursor-pointer flex flex-col aspect-[3/4]"
    >
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
        {comp.index_reward_pool > 0 && (
          <div className="absolute top-2 left-2 z-20 px-1.5 py-0.5 bg-gold/90 rounded text-[9px] font-extrabold text-black flex items-center gap-1">
            <Trophy className="w-2.5 h-2.5" /> {comp.index_reward_pool} IDX
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <h3 className="text-[13px] font-bold text-white leading-tight line-clamp-2" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            {comp.name}
          </h3>
        </div>
      </div>
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
  );
}

export default function CompetitionsListPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { competitions, loading } = useCompetitionsList();

  const lobbyComps = competitions.filter(c => c.status === "lobby");
  const liveComps = competitions.filter(c => c.status === "live");

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 px-4 pt-[env(safe-area-inset-top)] border-b border-white/[0.06] bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/[0.04] active:scale-95 transition">
            <ArrowLeft className="w-[18px] h-[18px] text-foreground/70" />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            <h1 className="text-[22px] font-black text-foreground uppercase leading-none tracking-tight" style={teko}>
              Competitions
            </h1>
          </div>
          <button
            onClick={() => navigate(profile ? "/competition/create" : "/start")}
            className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 text-gold hover:bg-gold/15 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px] font-extrabold tracking-[0.2em]" style={teko}>CREATE</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-[13px] text-muted-foreground mb-4">No competitions running right now</p>
            <button
              onClick={() => navigate(profile ? "/competition/create" : "/start")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-[12px] font-extrabold tracking-wider"
              style={teko}
            >
              <Plus className="w-4 h-4" /> START THE FIRST ONE
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {liveComps.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-60 animate-ping" />
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-red-500" />
                  </span>
                  <h2 className="text-[14px] font-extrabold uppercase tracking-[0.2em] text-red-400" style={teko}>
                    Live Now · {liveComps.length}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {liveComps.map(c => <CompCard key={c.id} comp={c} />)}
                </div>
              </section>
            )}

            {lobbyComps.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Hourglass className="w-3.5 h-3.5 text-emerald-400" />
                  <h2 className="text-[14px] font-extrabold uppercase tracking-[0.2em] text-emerald-400" style={teko}>
                    Open Lobbies · {lobbyComps.length}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {lobbyComps.map(c => <CompCard key={c.id} comp={c} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}