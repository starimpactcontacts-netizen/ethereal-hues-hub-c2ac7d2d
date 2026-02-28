import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Trophy, Eye } from "lucide-react";
import { useRecentSubmissions, RecentSubmission } from "@/hooks/useRecentSubmissions";
import { useThumbnail } from "@/hooks/useThumbnail";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Individual cell that resolves its own thumbnail
function GridCell({ submission, size = "normal" }: { submission: RecentSubmission; size?: "large" | "normal" }) {
  const { thumbnail, loading } = useThumbnail(submission.submission_url, submission.platform);
  const hasScore = submission.qoi_score !== null;

  return (
    <Link
      to={`/editor/${submission.user_id}`}
      className={cn(
        "relative block overflow-hidden group bg-black",
        size === "large" ? "row-span-2 col-span-2" : ""
      )}
    >
      {/* Thumbnail */}
      {loading ? (
        <div className="absolute inset-0 bg-surface-1 animate-pulse" />
      ) : thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-1 via-black to-surface-2">
          {/* Initials fallback */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-display text-muted-foreground/20">
              {(submission.display_name || submission.username).charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-4">
          {hasScore && (
            <div className="flex items-center gap-1.5 text-white">
              <Trophy size={16} className="text-gold" />
              <span className="font-display text-sm font-bold">{Math.round(submission.qoi_score!)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Play icon for video */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Play size={16} className="text-white drop-shadow-lg" fill="white" />
      </div>

      {/* Bottom gradient with name - only on large */}
      {size === "large" && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3">
          <div className="flex items-center gap-2">
            {submission.avatar_url ? (
              <img src={submission.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-gold">
                  {(submission.display_name || submission.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xs text-white font-semibold truncate">
              {submission.display_name || submission.username}
            </span>
          </div>
        </div>
      )}

      {/* Score badge - small cells */}
      {size === "normal" && hasScore && (
        <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-sm">
          <span className="text-[9px] font-bold text-gold">{Math.round(submission.qoi_score!)}</span>
        </div>
      )}
    </Link>
  );
}

export default function ExploreGrid({ limit = 12 }: { limit?: number }) {
  const { submissions, loading } = useRecentSubmissions(limit);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5 aspect-square">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-surface-1 animate-pulse" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-muted-foreground">No edits yet</p>
      </div>
    );
  }

  // IG Explore layout: every 6 items, one is large (2x2)
  // Pattern: [large, sm, sm, sm, sm, sm] repeating with offset
  const cells: { submission: RecentSubmission; size: "large" | "normal" }[] = [];
  let idx = 0;
  let groupIdx = 0;

  while (idx < submissions.length) {
    const isEvenGroup = groupIdx % 2 === 0;

    if (idx < submissions.length) {
      // Large cell position alternates: first in even groups, varies in odd
      if (isEvenGroup && idx === cells.length) {
        cells.push({ submission: submissions[idx], size: "large" });
        idx++;
      }

      // Fill remaining small cells
      const smallCount = Math.min(isEvenGroup ? 4 : 5, submissions.length - idx);
      for (let s = 0; s < smallCount; s++) {
        if (idx < submissions.length) {
          cells.push({ submission: submissions[idx], size: "normal" });
          idx++;
        }
      }

      // Add large in odd groups after some smalls
      if (!isEvenGroup && idx < submissions.length) {
        cells.push({ submission: submissions[idx], size: "large" });
        idx++;
      }
    }
    groupIdx++;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-3 gap-0.5 auto-rows-[minmax(0,1fr)]"
      style={{
        gridAutoRows: "calc((100vw - 2rem - 1px) / 3)", // Square cells based on column width
      }}
    >
      {cells.map((cell, i) => (
        <GridCell
          key={cell.submission.id}
          submission={cell.submission}
          size={cell.size}
        />
      ))}
    </motion.div>
  );
}
