import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Plus, Share2, User, ThumbsUp, Info, X, Sparkles, Gavel, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCompetitionsList, type Competition } from "@/hooks/useCompetitions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArenaRail, ArenaRailSkeleton } from "@/components/loopgate/ArenaCarouselSystem";

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
  // Roblox-style upvote % — derive a stable pseudo value from fill ratio (real votes can replace later)
  const fillRatio = comp.current_players / Math.max(1, comp.max_players);
  const approval = Math.min(99, Math.max(60, Math.round(70 + fillRatio * 25)));

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
            <img src={comp.cover_image_url} alt={comp.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/[0.04] to-black flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white/[0.08]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          <button
            onClick={handleShare}
            className="absolute top-2 right-2 z-20 p-1.5 bg-black/50 backdrop-blur-md rounded-full active:scale-90"
          >
            <Share2 className="w-3 h-3 text-white/70" />
          </button>

          {/* Title overlaid bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="text-[12px] font-bold text-white leading-tight line-clamp-2" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              {comp.name}
            </h3>
          </div>
        </div>

        {/* Roblox-style footer: stats + join */}
        <div className="px-2.5 py-2 flex items-center justify-between gap-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-2.5 text-[10px] font-bold text-zinc-300 min-w-0">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <User className="w-3 h-3 text-zinc-400" strokeWidth={2.5} />
              {formatCount(comp.current_players)}
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap text-emerald-400">
              <ThumbsUp className="w-3 h-3" strokeWidth={2.5} />
              {approval}%
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onJoin(comp.id); }}
            disabled={spotsLeft <= 0}
            className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Teko', sans-serif" }}
          >
            {spotsLeft <= 0 ? "FULL" : "JOIN"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ArenaCompetitionsSection({ onCreateClick, hideHeader = false }: { onCreateClick: () => void; hideHeader?: boolean }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { competitions: comps, loading } = useCompetitionsList();

  const handleJoin = async (compId: string) => {
    if (!user || !profile) { navigate("/start"); return; }

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
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-gold border border-gold/20 hover:bg-gold/10 rounded transition-colors"
          >
            <Plus className="w-3 h-3" /> Create
          </button>
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
    </motion.section>
  );
}
