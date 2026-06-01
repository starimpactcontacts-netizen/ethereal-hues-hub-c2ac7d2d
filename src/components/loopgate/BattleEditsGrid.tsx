import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Trophy, Clock, Swords, Users, ArrowRight, EyeOff, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useThumbnail } from "@/hooks/useThumbnail";

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

// ── Thumbnail — uses useThumbnail hook (Bunny CDN → YouTube → edge fn) ────────

function EditThumbnail({ submissionUrl, stored }: { submissionUrl: string | null; stored: string | null }) {
  const { thumbnail } = useThumbnail(stored || submissionUrl || "", "");
  const src = stored || thumbnail;
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

// ── Full-screen video modal (portal, above everything) ────────────────────────

function VideoModal({ edit, onClose }: { edit: EditEntry; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const src = edit.submissionUrl;
  const isBunny = src?.includes("b-cdn.net");
  const isYT = src?.includes("youtube.com") || src?.includes("youtu.be");
  const isTikTok = src?.includes("tiktok.com");

  const modal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center"
        style={{ top: "max(16px, env(safe-area-inset-top))" }}
      >
        <X className="w-4 h-4 text-white/80" />
      </button>

      {isBunny || (!isYT && !isTikTok && src) ? (
        <video
          ref={videoRef}
          src={src!}
          autoPlay
          controls
          playsInline
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-4 px-8 text-center">
          <p className="text-sm text-white/50">Hosted on {isYT ? "YouTube" : "TikTok"}</p>
          <a
            href={src!}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-white text-black font-bold text-sm rounded-xl"
          >
            Open to watch
          </a>
        </div>
      )}
    </motion.div>
  );

  return createPortal(modal, document.body);
}

// ────────────────────────────────────────────────────────────────────────────

export default function BattleEditsGrid({ userId, isOwner = false }: BattleEditsGridProps) {
  const [edits, setEdits] = useState<EditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [playing, setPlaying] = useState<EditEntry | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);

      const [fightsRes, compsRes, profileRes] = await Promise.all([
        supabase
          .from("quick_fights")
          .select("id, player_1_id, player_2_id, player_1_submission_url, player_2_submission_url, player_1_thumbnail_url, player_2_thumbnail_url, winner_id, status, created_at")
          .or(`player_1_id.eq.${userId},player_2_id.eq.${userId}`)
          .in("status", ["completed", "judging", "submitted", "active"])
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("hosted_competition_submissions")
          .select("id, submission_url, winner_place, submitted_at, competition_id, hosted_competitions(name)")
          .eq("user_id", userId)
          .order("submitted_at", { ascending: false })
          .limit(50),
        (supabase as any)
          .from("profiles")
          .select("data")
          .eq("id", userId)
          .single(),
      ]);

      const hidden = new Set<string>(((profileRes as any).data?.data as any)?.hidden_edits || []);
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
          thumbnailUrl: null,
          label: comp?.name || "Competition",
          result: c.winner_place === 1 ? "win" : c.winner_place ? "loss" : "pending",
          rank: c.winner_place || null,
          createdAt: c.submitted_at,
          linkTo: `/competition/${c.competition_id}`,
        });
      }

      entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEdits(entries);
      setLoading(false);
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

  const updateHiddenList = async (newList: string[]) => {
    const { data: profileRow } = await (supabase as any).from("profiles").select("data").eq("id", userId).single();
    return (supabase as any).from("profiles").update({
      data: { ...(profileRow?.data as any || {}), hidden_edits: newList },
    }).eq("id", userId);
  };

  const hideEdit = async (edit: EditEntry) => {
    setMenuFor(null);
    setEdits((prev) => prev.filter((e) => e.id !== edit.id));
    const { data: profileRow } = await (supabase as any).from("profiles").select("data").eq("id", userId).single();
    const current: string[] = (profileRow?.data as any)?.hidden_edits || [];
    const { error } = await updateHiddenList([...new Set([...current, edit.id])]);
    if (error) {
      setEdits((prev) =>
        [...prev, edit].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
      toast.error("Couldn't hide edit");
    } else {
      toast.success("Removed from profile", {
        action: {
          label: "Undo",
          onClick: async () => {
            const { data: profileRow2 } = await (supabase as any).from("profiles").select("data").eq("id", userId).single();
            const current2: string[] = (profileRow2?.data as any)?.hidden_edits || [];
            await updateHiddenList(current2.filter((id) => id !== edit.id));
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
        {edits.map((edit, i) => (
          <motion.div
            key={edit.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => { if (!menuFor) setPlaying(edit); }}
            className="relative aspect-[9/16] overflow-hidden bg-[#111] cursor-pointer"
          >
            <EditThumbnail submissionUrl={edit.submissionUrl} stored={edit.thumbnailUrl} />
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
        ))}
      </div>

      <AnimatePresence>
        {playing && <VideoModal edit={playing} onClose={() => setPlaying(null)} />}
      </AnimatePresence>
    </>
  );
}
