import { useState, useEffect } from "react";
import { Play, Trophy, Clock, Swords, Users, ExternalLink, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface EditEntry {
  id: string;
  type: "battle" | "competition";
  submissionUrl: string | null;
  thumbnailUrl: string | null;
  label: string;
  result: "win" | "loss" | "pending" | null;
  rank: number | null;
  createdAt: string;
  linkTo: string;
}

interface BattleEditsGridProps {
  userId: string;
}

export default function BattleEditsGrid({ userId }: BattleEditsGridProps) {
  const [edits, setEdits] = useState<EditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      setLoading(true);
      const [fightsRes, compsRes] = await Promise.all([
        supabase
          .from("quick_fights")
          .select("id, player_1_id, player_2_id, player_1_submission_url, player_2_submission_url, winner_id, status, created_at")
          .or(`player_1_id.eq.${userId},player_2_id.eq.${userId}`)
          .in("status", ["completed", "judging", "submitted", "active"])
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("hosted_competition_submissions")
          .select("id, submission_url, thumbnail_url, winner_place, created_at, competition_id, hosted_competitions(title)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const entries: EditEntry[] = [];

      for (const f of fightsRes.data || []) {
        const isP1 = f.player_1_id === userId;
        const subUrl = isP1 ? f.player_1_submission_url : f.player_2_submission_url;
        if (!subUrl) continue;
        const result =
          f.status === "completed"
            ? f.winner_id === userId
              ? "win"
              : "loss"
            : "pending";
        entries.push({
          id: f.id,
          type: "battle",
          submissionUrl: subUrl,
          thumbnailUrl: null,
          label: "Edit Battle",
          result,
          rank: null,
          createdAt: f.created_at,
          linkTo: `/fight/${f.id}`,
        });
      }

      for (const c of compsRes.data || []) {
        if (!c.submission_url) continue;
        const comp = c.hosted_competitions as any;
        entries.push({
          id: c.id,
          type: "competition",
          submissionUrl: c.submission_url,
          thumbnailUrl: c.thumbnail_url || null,
          label: comp?.title || "Competition",
          result: c.winner_place === 1 ? "win" : c.winner_place ? "loss" : "pending",
          rank: c.winner_place || null,
          createdAt: c.created_at,
          linkTo: `/competition/${c.competition_id}`,
        });
      }

      entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEdits(entries);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[9/16] bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (edits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-4">
        <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center mb-3">
          <Swords className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">No battle edits yet</p>
        <p className="text-[11px] text-muted-foreground mb-3">
          Submit edits in battles and competitions to see them here
        </p>
        <Link
          to="/arena"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold text-black font-bold rounded-md text-xs hover:bg-gold/90 transition-colors"
        >
          Enter Arena <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {edits.map((edit, i) => (
        <motion.div
          key={edit.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.04 }}
          className="relative aspect-[9/16] overflow-hidden bg-muted/20"
        >
          {/* Background */}
          {edit.thumbnailUrl ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${edit.thumbnailUrl})` }} />
          ) : (
            <div className="absolute inset-0 bg-[#111]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          {/* Type badge top-left */}
          <div className="absolute top-2 left-2">
            {edit.type === "battle" ? (
              <Swords className="w-3.5 h-3.5 text-white/60" strokeWidth={2} />
            ) : (
              <Users className="w-3.5 h-3.5 text-white/60" strokeWidth={2} />
            )}
          </div>

          {/* Result badge top-right */}
          <div className="absolute top-2 right-2">
            {edit.result === "win" ? (
              <div className="flex items-center gap-0.5 bg-gold/90 rounded px-1.5 py-0.5">
                <Trophy className="w-2.5 h-2.5 text-black" />
                <span className="text-[9px] font-black text-black">W</span>
              </div>
            ) : edit.result === "loss" ? (
              <span className="text-[9px] font-black text-white/40 bg-white/10 rounded px-1.5 py-0.5">L</span>
            ) : (
              <div className="flex items-center gap-0.5 bg-black/60 rounded px-1.5 py-0.5">
                <Clock className="w-2.5 h-2.5 text-white/50" />
              </div>
            )}
          </div>

          {/* Rank */}
          {edit.rank && (
            <div className="absolute bottom-7 left-2">
              <span className="text-[10px] font-black text-gold">#{edit.rank}</span>
            </div>
          )}

          {/* Label + link */}
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 flex items-center justify-between">
            <p className="text-[9px] text-white/50 truncate flex-1">{edit.label}</p>
            <Link to={edit.linkTo} onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="w-3 h-3 text-white/30 hover:text-white/70 shrink-0" />
            </Link>
          </div>

          {/* Full tap overlay to open submission */}
          <a
            href={edit.submissionUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity"
          >
            <Play className="w-7 h-7 text-white fill-white" />
          </a>
        </motion.div>
      ))}
    </div>
  );
}
