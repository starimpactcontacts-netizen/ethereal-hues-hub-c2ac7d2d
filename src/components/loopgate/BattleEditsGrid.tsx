import { useState, useEffect, useRef } from "react";
import { Trophy, Clock, Swords, Users, ArrowRight, EyeOff, X, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
  isOwner?: boolean;
}

// ── thumbnail helpers ────────────────────────────────────────────────────────

function extractYoutubeThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname === "youtu.be") {
      id = u.pathname.slice(1).split("?")[0];
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v");
      if (!id) {
        const m = u.pathname.match(/\/shorts\/([^/?]+)/);
        if (m) id = m[1];
      }
    }
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

async function fetchTikTokThumbnail(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail_url || null;
  } catch {
    return null;
  }
}

async function resolveThumbnail(submissionUrl: string | null, stored: string | null): Promise<string | null> {
  if (stored) return stored;
  if (!submissionUrl) return null;
  const yt = extractYoutubeThumbnail(submissionUrl);
  if (yt) return yt;
  if (submissionUrl.includes("tiktok.com")) return fetchTikTokThumbnail(submissionUrl);
  return null;
}

// ── In-app video player modal ────────────────────────────────────────────────

function VideoModal({ edit, onClose }: { edit: EditEntry; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isCDN = edit.submissionUrl?.includes("b-cdn.net") || edit.submissionUrl?.includes("bunny");
  const isYT = edit.submissionUrl?.includes("youtube.com") || edit.submissionUrl?.includes("youtu.be");
  const isTikTok = edit.submissionUrl?.includes("tiktok.com");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        <div>
          <p className="text-[11px] text-white/40 uppercase tracking-wider">{edit.label}</p>
          <p className="text-[10px] text-white/25 mt-0.5">
            {edit.result === "win" ? "🏆 Win" : edit.result === "loss" ? "Loss" : "Pending"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {isCDN ? (
          <video
            ref={videoRef}
            src={edit.submissionUrl!}
            autoPlay
            controls
            playsInline
            className="max-h-full max-w-full object-contain"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          />
        ) : isYT || isTikTok ? (
          /* For YouTube/TikTok, open externally — referrer isn't the issue there */
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <Play className="w-12 h-12 text-white/20" />
            <p className="text-sm text-white/50">This edit is hosted on {isYT ? "YouTube" : "TikTok"}</p>
            <a
              href={edit.submissionUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-white text-black font-bold text-sm rounded-xl"
            >
              Open to watch
            </a>
          </div>
        ) : (
          /* Fallback: try video tag anyway */
          <video
            ref={videoRef}
            src={edit.submissionUrl!}
            autoPlay
            controls
            playsInline
            className="max-h-full max-w-full object-contain"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          />
        )}
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export default function BattleEditsGrid({ userId, isOwner = false }: BattleEditsGridProps) {
  const [edits, setEdits] = useState<EditEntry[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [playing, setPlaying] = useState<EditEntry | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);

      const [fightsRes, compsRes, hiddenRes] = await Promise.all([
        supabase
          .from("quick_fights")
          .select("id, player_1_id, player_2_id, player_1_submission_url, player_2_submission_url, player_1_thumbnail_url, player_2_thumbnail_url, winner_id, status, created_at")
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
        supabase
          .from("hidden_edits")
          .select("source_id")
          .eq("user_id", userId),
      ]);

      const hidden = new Set((hiddenRes.data || []).map((h) => h.source_id));
      const entries: EditEntry[] = [];

      for (const f of fightsRes.data || []) {
        if (hidden.has(f.id)) continue;
        const isP1 = f.player_1_id === userId;
        const subUrl = isP1 ? f.player_1_submission_url : f.player_2_submission_url;
        if (!subUrl) continue;
        const storedThumb = (isP1 ? f.player_1_thumbnail_url : f.player_2_thumbnail_url) || null;
        const result =
          f.status === "completed"
            ? f.winner_id === userId ? "win" : "loss"
            : "pending";
        entries.push({
          id: f.id,
          type: "battle",
          submissionUrl: subUrl,
          thumbnailUrl: storedThumb,
          label: "Edit Battle",
          result,
          rank: null,
          createdAt: f.created_at,
          linkTo: `/fight/${f.id}`,
        });
      }

      for (const c of compsRes.data || []) {
        if (hidden.has(c.id)) continue;
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

      // Resolve thumbnails asynchronously — fade in as they arrive
      entries.forEach(async (entry) => {
        const thumb = await resolveThumbnail(entry.submissionUrl, entry.thumbnailUrl);
        if (thumb) setThumbnails((prev) => ({ ...prev, [entry.id]: thumb }));
      });
    };
    load();
  }, [userId]);

  useEffect(() => {
    if (!menuFor) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [menuFor]);

  const hideEdit = async (edit: EditEntry) => {
    setMenuFor(null);
    setEdits((prev) => prev.filter((e) => e.id !== edit.id));

    const { error } = await supabase.from("hidden_edits").insert({
      user_id: userId,
      source: edit.type,
      source_id: edit.id,
    });

    if (error) {
      setEdits((prev) =>
        [...prev, edit].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
      toast.error("Couldn't hide edit");
    } else {
      toast.success("Hidden from your profile", {
        action: {
          label: "Undo",
          onClick: async () => {
            await supabase.from("hidden_edits").delete().eq("user_id", userId).eq("source_id", edit.id);
            setEdits((prev) =>
              [...prev, edit].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            );
          },
        },
      });
    }
  };

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
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {edits.map((edit, i) => {
          const thumb = thumbnails[edit.id] ?? edit.thumbnailUrl;
          return (
            <motion.div
              key={edit.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => { if (!menuFor) setPlaying(edit); }}
              className="relative aspect-[9/16] overflow-hidden bg-[#111] cursor-pointer"
            >
              <AnimatePresence>
                {thumb && (
                  <motion.img
                    key={thumb}
                    src={thumb}
                    alt={edit.label}
                    loading="lazy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              {/* Type icon */}
              <div className="absolute top-2 left-2">
                {edit.type === "battle"
                  ? <Swords className="w-3.5 h-3.5 text-white/60" strokeWidth={2} />
                  : <Users className="w-3.5 h-3.5 text-white/60" strokeWidth={2} />}
              </div>

              {/* Result badge */}
              <div className={`absolute top-2 ${isOwner ? "right-7" : "right-2"}`}>
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

              {/* Owner ⋯ */}
              {isOwner && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === edit.id ? null : edit.id); }}
                  className="absolute top-1.5 right-1.5 z-20 w-5 h-5 flex items-center justify-center rounded text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors"
                >
                  <span className="text-[11px] leading-none font-bold tracking-tighter">···</span>
                </button>
              )}

              <AnimatePresence>
                {menuFor === edit.id && (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-7 right-1.5 z-30 bg-[#1a1a1c] border border-white/[0.1] rounded-lg shadow-xl overflow-hidden min-w-[130px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => hideEdit(edit)}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-[11px] font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <EyeOff className="w-3 h-3 shrink-0" />
                      Hide from profile
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {edit.rank && (
                <div className="absolute bottom-7 left-2">
                  <span className="text-[10px] font-black text-gold">#{edit.rank}</span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5">
                <p className="text-[9px] text-white/50 truncate">{edit.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {playing && <VideoModal edit={playing} onClose={() => setPlaying(null)} />}
      </AnimatePresence>
    </>
  );
}
