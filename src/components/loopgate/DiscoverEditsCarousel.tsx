/**
 * DiscoverEditsCarousel — Big showcase carousel for the Index page.
 * Aggregates: competition submissions, featured drop edits, battle submissions, judge rating videos.
 * Shows thumbnails with inline video playback on tap.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Eye, Crown, Gavel, Trophy, Flame, ExternalLink, X,
  ChevronLeft, ChevronRight, Volume2, VolumeX
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { getThumbnail, getThumbnailAsync, LOOPGATE_PLACEHOLDER, type ThumbnailResult } from "@/lib/thumbnail";
import loopgateLogo from "@/assets/loopgate-logo.png";

// ── Types ──

interface EditEntry {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string;
  thumbnail_url: string | null;
  qoi_score: number | null;
  source: "competition" | "drop" | "battle" | "judge_video";
  source_label: string;
  created_at: string;
}

// ── Embed helpers ──

function getEmbedUrl(url: string, platform: string): string | null {
  try {
    if (platform === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
      const match = url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=0&rel=0`;
    }
    if (platform === "tiktok" || url.includes("tiktok.com")) {
      // TikTok embed requires the full URL
      const videoIdMatch = url.match(/\/video\/(\d+)/);
      if (videoIdMatch) return `https://www.tiktok.com/embed/v2/${videoIdMatch[1]}`;
    }
  } catch {}
  return null;
}

// ── Branded fallback ──

function BrandedThumb({ username }: { username: string }) {
  const gradients = [
    "from-purple-900 via-fuchsia-900 to-pink-900",
    "from-indigo-900 via-purple-900 to-violet-900",
    "from-rose-900 via-pink-900 to-fuchsia-900",
    "from-cyan-900 via-teal-900 to-emerald-900",
    "from-amber-900 via-orange-900 to-red-900",
    "from-blue-900 via-indigo-900 to-purple-900",
  ];
  const idx = username.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length;
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradients[idx]} flex flex-col items-center justify-center gap-2`}>
      <img src={loopgateLogo} alt="" className="w-8 h-8 opacity-30" />
      <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">@{username}</span>
    </div>
  );
}

// ── Source icon ──

function SourceIcon({ source }: { source: EditEntry["source"] }) {
  const cls = "w-2.5 h-2.5";
  switch (source) {
    case "competition": return <Trophy className={cls} />;
    case "drop": return <Flame className={cls} />;
    case "battle": return <Crown className={cls} />;
    case "judge_video": return <Gavel className={cls} />;
  }
}

// ── Single card ──

function EditShowcaseCard({
  entry,
  onPlay,
}: {
  entry: EditEntry;
  onPlay: (entry: EditEntry) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [thumb, setThumb] = useState<ThumbnailResult>(() =>
    getThumbnail(entry.submission_url, entry.platform, entry.thumbnail_url)
  );

  // Async resolve for TikTok/Instagram thumbnails
  useEffect(() => {
    if (thumb.status !== "error") return;
    let cancelled = false;
    getThumbnailAsync(entry.submission_url, entry.platform, entry.thumbnail_url).then((r) => {
      if (!cancelled) {
        setThumb(r);
        setImgError(false);
      }
    });
    return () => { cancelled = true; };
  }, [entry.submission_url, entry.platform, entry.thumbnail_url, thumb.status]);

  const showFallback = imgError || thumb.status === "error";

  const platformLabel =
    entry.platform === "tiktok" ? "TikTok" :
    entry.platform === "youtube" ? "YouTube" :
    entry.platform === "instagram" ? "Instagram" :
    entry.platform;

  return (
    <div className="w-[360px] shrink-0 snap-start group">
      {/* Thumbnail */}
      <button
        onClick={() => onPlay(entry)}
        className="relative w-full aspect-[16/9] bg-surface-2 overflow-hidden block"
      >
        {showFallback ? (
          <BrandedThumb username={entry.username} />
        ) : (
          <img
            src={thumb.url}
            alt={`@${entry.username}'s edit`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

        {/* Platform badge */}
        <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold uppercase px-2.5 py-1 flex items-center gap-1">
          {platformLabel}
        </div>

        {/* Source badge */}
        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white/80 text-[9px] font-bold uppercase px-2.5 py-1 flex items-center gap-1">
          <SourceIcon source={entry.source} />
          {entry.source_label}
        </div>

        {/* QOI score */}
        {entry.qoi_score != null && entry.qoi_score > 0 && (
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 flex items-center gap-1.5">
            <span
              className={`text-lg font-bold tabular-nums ${
                entry.qoi_score >= 70 ? "text-gold" : entry.qoi_score >= 40 ? "text-white" : "text-red-400"
              }`}
            >
              {Math.round(entry.qoi_score)}
            </span>
            <span className="text-[8px] text-white/60 uppercase">QOI</span>
          </div>
        )}

        {/* User info overlay at bottom */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
          <Avatar className="w-7 h-7 border border-white/20">
            <AvatarImage src={entry.avatar_url || ""} />
            <AvatarFallback className="text-[9px] bg-black/40 text-white font-bold">
              {entry.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white truncate block drop-shadow-lg">
              @{entry.username}
            </span>
          </div>
          <div className="ml-auto pl-2 flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Play className="w-3 h-3 text-white" fill="white" />
            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Play</span>
          </div>
        </div>
      </button>
    </div>
  );
}

// ── Video player overlay ──

function VideoPlayerOverlay({
  entry,
  onClose,
}: {
  entry: EditEntry;
  onClose: () => void;
}) {
  const embedUrl = getEmbedUrl(entry.submission_url, entry.platform);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Video */}
        {embedUrl ? (
          <div className="relative w-full aspect-[16/9] bg-black overflow-hidden">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${entry.username}'s edit`}
            />
          </div>
        ) : (
          <div className="relative w-full aspect-[16/9] bg-surface-2 flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">Can't embed this video in-app</p>
            <a
              href={entry.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-bold hover:bg-foreground/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Watch on {entry.platform === "tiktok" ? "TikTok" : entry.platform === "youtube" ? "YouTube" : entry.platform}
            </a>
          </div>
        )}

        {/* Info bar */}
        <div className="bg-surface-1 border border-border/40 px-4 py-3 flex items-center justify-between">
          <Link
            to={`/editor/${entry.user_id}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-7 h-7 border border-border">
              <AvatarImage src={entry.avatar_url || ""} />
              <AvatarFallback className="text-[9px] font-bold">{entry.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <span className="text-xs font-bold text-foreground">@{entry.username}</span>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <SourceIcon source={entry.source} />
                <span>{entry.source_label}</span>
              </div>
            </div>
          </Link>
          <a
            href={entry.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border/40 hover:border-foreground/20 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main carousel ──

export default function DiscoverEditsCarousel() {
  const [entries, setEntries] = useState<EditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingEntry, setPlayingEntry] = useState<EditEntry | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllEdits();
  }, []);

  async function fetchAllEdits() {
    try {
      // Fetch from multiple sources in parallel
      const [roundRes, eventRes, sanctionedRes, battleRes, dropRes, judgeRes] = await Promise.all([
        // Round submissions
        supabase
          .from("round_participations")
          .select("id, user_id, submission_url, platform, qoi_score, status, submitted_at, round_number, thumbnail_url")
          .not("submission_url", "is", null)
          .order("submitted_at", { ascending: false, nullsFirst: false })
          .limit(15),
        // Event submissions
        supabase
          .from("event_participations")
          .select("id, user_id, submission_url, platform, qoi_score, status, submitted_at, thumbnail_url")
          .not("submission_url", "is", null)
          .order("submitted_at", { ascending: false, nullsFirst: false })
          .limit(15),
        // Sanctioned tournament submissions
        supabase
          .from("sanctioned_tournament_participants")
          .select("id, user_id, submission_url, submission_platform, qoi_score, submitted_at")
          .not("submission_url", "is", null)
          .order("submitted_at", { ascending: false, nullsFirst: false })
          .limit(10),
        // Battle submissions (both challenger and opponent)
        supabase
          .from("battles")
          .select("id, challenger_id, challenger_username, challenger_avatar_url, challenger_submission_url, challenger_submission_platform, challenger_thumbnail_url, challenger_score, opponent_id, opponent_username, opponent_avatar_url, opponent_submission_url, opponent_submission_platform, opponent_thumbnail_url, opponent_score, created_at")
          .not("challenger_submission_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(10),
        // Featured drop submissions
        supabase
          .from("featured_submissions")
          .select("id, user_id, username, avatar_url, submission_url, platform, qoi_score, status, created_at, thumbnail_url")
          .order("created_at", { ascending: false })
          .limit(15),
        // Judge rating videos
        supabase
          .from("judge_rating_videos")
          .select("id, judge_id, video_url, platform, title, submitted_at, thumbnail_url")
          .order("submitted_at", { ascending: false })
          .limit(10),
      ]);

      // Collect all user IDs we need profiles for
      const userIds = new Set<string>();
      (roundRes.data || []).forEach((r) => userIds.add(r.user_id));
      (eventRes.data || []).forEach((r) => userIds.add(r.user_id));
      (sanctionedRes.data || []).forEach((r) => userIds.add(r.user_id));
      (battleRes.data || []).forEach((b) => {
        userIds.add(b.challenger_id);
        if (b.opponent_id) userIds.add(b.opponent_id);
      });
      (judgeRes.data || []).forEach((j) => userIds.add(j.judge_id));
      // Drop submissions already have username/avatar

      // Fetch profiles
      const profileIds = Array.from(userIds);
      const { data: profiles } = profileIds.length > 0
        ? await supabase.from("profiles").select("id, username, avatar_url").in("id", profileIds)
        : { data: [] };
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      const allEntries: EditEntry[] = [];

      // Round submissions
      (roundRes.data || []).forEach((r) => {
        const p = profileMap.get(r.user_id);
        allEntries.push({
          id: `round-${r.id}`,
          user_id: r.user_id,
          username: p?.username || "editor",
          avatar_url: p?.avatar_url || null,
          submission_url: r.submission_url!,
          platform: r.platform || "tiktok",
          thumbnail_url: r.thumbnail_url || null,
          qoi_score: r.qoi_score,
          source: "competition",
          source_label: `Round ${r.round_number || ""}`,
          created_at: r.submitted_at || new Date().toISOString(),
        });
      });

      // Event submissions
      (eventRes.data || []).forEach((e) => {
        const p = profileMap.get(e.user_id);
        allEntries.push({
          id: `event-${e.id}`,
          user_id: e.user_id,
          username: p?.username || "editor",
          avatar_url: p?.avatar_url || null,
          submission_url: e.submission_url!,
          platform: e.platform || "tiktok",
          thumbnail_url: e.thumbnail_url || null,
          qoi_score: e.qoi_score,
          source: "competition",
          source_label: "Arena",
          created_at: e.submitted_at || new Date().toISOString(),
        });
      });

      // Sanctioned
      (sanctionedRes.data || []).forEach((s) => {
        const p = profileMap.get(s.user_id);
        allEntries.push({
          id: `sanc-${s.id}`,
          user_id: s.user_id,
          username: p?.username || "editor",
          avatar_url: p?.avatar_url || null,
          submission_url: s.submission_url!,
          platform: s.submission_platform || "tiktok",
          thumbnail_url: null,
          qoi_score: s.qoi_score,
          source: "competition",
          source_label: "Tournament",
          created_at: s.submitted_at || new Date().toISOString(),
        });
      });

      // Battles
      (battleRes.data || []).forEach((b) => {
        if (b.challenger_submission_url) {
          allEntries.push({
            id: `battle-c-${b.id}`,
            user_id: b.challenger_id,
            username: b.challenger_username || profileMap.get(b.challenger_id)?.username || "editor",
            avatar_url: b.challenger_avatar_url || profileMap.get(b.challenger_id)?.avatar_url || null,
            submission_url: b.challenger_submission_url,
            platform: b.challenger_submission_platform || "tiktok",
            thumbnail_url: b.challenger_thumbnail_url || null,
            qoi_score: b.challenger_score,
            source: "battle",
            source_label: "1v1",
            created_at: b.created_at,
          });
        }
        if (b.opponent_submission_url && b.opponent_id) {
          allEntries.push({
            id: `battle-o-${b.id}`,
            user_id: b.opponent_id,
            username: b.opponent_username || profileMap.get(b.opponent_id)?.username || "editor",
            avatar_url: b.opponent_avatar_url || profileMap.get(b.opponent_id)?.avatar_url || null,
            submission_url: b.opponent_submission_url,
            platform: b.opponent_submission_platform || "tiktok",
            thumbnail_url: b.opponent_thumbnail_url || null,
            qoi_score: b.opponent_score,
            source: "battle",
            source_label: "1v1",
            created_at: b.created_at,
          });
        }
      });

      // Featured drop submissions
      (dropRes.data || []).forEach((d) => {
        allEntries.push({
          id: `drop-${d.id}`,
          user_id: d.user_id,
          username: d.username || "editor",
          avatar_url: d.avatar_url || null,
          submission_url: d.submission_url,
          platform: d.platform || "tiktok",
          thumbnail_url: d.thumbnail_url || null,
          qoi_score: d.qoi_score,
          source: "drop",
          source_label: "Drop",
          created_at: d.created_at,
        });
      });

      // Judge rating videos
      (judgeRes.data || []).forEach((j) => {
        const p = profileMap.get(j.judge_id);
        allEntries.push({
          id: `judge-${j.id}`,
          user_id: j.judge_id,
          username: p?.username || "judge",
          avatar_url: p?.avatar_url || null,
          submission_url: j.video_url,
          platform: j.platform || "tiktok",
          thumbnail_url: j.thumbnail_url || null,
          qoi_score: null,
          source: "judge_video",
          source_label: j.title || "Rating",
          created_at: j.submitted_at,
        });
      });

      // Composite ranking: recent + thumbnail + score = highest
      const now = Date.now();
      allEntries.sort((a, b) => {
        const rank = (e: EditEntry) => {
          let score = 0;
          // Recency boost: 0-50 pts (last 24h = max, decays over 7 days)
          const ageHrs = (now - new Date(e.created_at).getTime()) / 3.6e6;
          score += Math.max(0, 50 - (ageHrs / 168) * 50);
          // Thumbnail = +30
          if (e.thumbnail_url) score += 30;
          // QOI score boost: up to +40
          if (e.qoi_score && e.qoi_score > 0) {
            score += Math.min(40, (e.qoi_score / 100) * 40);
          }
          return score;
        };
        return rank(b) - rank(a);
      });
      const seen = new Set<string>();
      const unique = allEntries.filter((e) => {
        if (seen.has(e.submission_url)) return false;
        seen.add(e.submission_url);
        return true;
      });

      setEntries(unique.slice(0, 30));
    } catch (err) {
      console.error("[DiscoverEditsCarousel] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const scroll = useCallback((dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 380;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  if (loading) {
    return (
      <div className="pt-5 pb-2">
        <div className="flex items-center gap-2 px-4 mb-3">
          <Eye className="w-5 h-5 text-foreground/50" />
          <h2 className="font-display text-2xl tracking-wide text-foreground">LATEST EDITS</h2>
        </div>
        <div className="flex gap-3 overflow-hidden px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[360px] shrink-0">
              <div className="aspect-[16/9] bg-surface-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) return null;

  return (
    <>
      <div className="pt-5 pb-2">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-foreground/50" />
            <h2 className="font-display text-2xl tracking-wide text-foreground">LATEST EDITS</h2>
            <span className="text-[10px] text-muted-foreground bg-surface-1 px-1.5 py-0.5">{entries.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 pb-2"
        >
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <EditShowcaseCard entry={entry} onPlay={setPlayingEntry} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Video player overlay */}
      <AnimatePresence>
        {playingEntry && (
          <VideoPlayerOverlay entry={playingEntry} onClose={() => setPlayingEntry(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
