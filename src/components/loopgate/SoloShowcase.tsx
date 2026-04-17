import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  UserRound, Zap, Music, ChevronRight, ThumbsUp, MessageCircle, Play
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRecentSoloSubmissions, type RecentSolo } from "@/hooks/useRecentSoloSubmissions";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ArenaRail, ArenaRailCard, ArenaRailSkeleton } from "@/components/loopgate/ArenaCarouselSystem";

// ─── Solo Submission Card — Cinematic Poster Style ─────────────
function SoloCard({ solo }: { solo: RecentSolo }) {
  const statusConfig: Record<string, { label: string; color: string; bg: string; pulse?: boolean }> = {
    editing: { label: "EDITING", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/40", pulse: true },
    submitted: { label: "SUBMITTED", color: "text-sky-400", bg: "bg-sky-500/20 border-sky-500/40" },
    judging: { label: "JUDGING", color: "text-purple-400", bg: "bg-purple-500/20 border-purple-500/40", pulse: true },
    scored: { label: "SCORED", color: "text-white/80", bg: "bg-white/[0.08] border-white/[0.12]" },
  };
  const s = statusConfig[solo.status] || statusConfig.editing;
  const timeAgo = formatDistanceToNow(new Date(solo.created_at), { addSuffix: false });

  return (
    <Link to={`/solo/${solo.id}`} className="block h-full group">
      <div className="relative h-full overflow-hidden rounded-2xl flex flex-col" style={{
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        {/* Background */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          {solo.thumbnail_url ? (
            <img src={solo.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover scale-[1.02] group-hover:scale-[1.06] transition-transform duration-700" />
          ) : (
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(160deg, #1a1520 0%, #0d0d12 40%, #141018 100%)',
            }} />
          )}

          {/* Fade overlay */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.6) 85%, rgba(0,0,0,0.85) 100%)',
          }} />
          
          {/* Border glow */}
          <div className="absolute inset-0 rounded-lg border border-white/[0.08] group-hover:border-gold/30 transition-colors duration-300" />

          {/* Status badge — top left */}
          <div className="absolute top-2 left-2 z-10">
            <div className={`flex items-center gap-1 px-2 py-0.5 border rounded-full backdrop-blur-md ${s.bg}`}>
              {s.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
              <span className={`text-[8px] font-black uppercase tracking-wider ${s.color}`}>{s.label}</span>
            </div>
          </div>

          {/* Index badge — top right */}
          {solo.index_awarded > 0 && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 bg-black/50 border border-white/[0.1] px-1.5 py-0.5 rounded-full backdrop-blur-md">
              <Zap className="w-2.5 h-2.5 text-gold" />
              <span className="text-[8px] font-black text-gold">+{solo.index_awarded}</span>
            </div>
          )}

          {/* QOI Score — bottom right */}
          {solo.qoi_score != null && (
            <div className="absolute bottom-2 right-2 z-10">
              <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/[0.08]">
                <span className="text-lg font-black text-gold leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>{Math.round(solo.qoi_score)}</span>
                <span className="text-[7px] text-gold/50 ml-0.5 font-bold">QOI</span>
              </div>
            </div>
          )}

          {/* Bottom content overlay */}
           <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Avatar className="w-4 h-4 border border-white/10">
                <AvatarImage src={solo.avatar_url || ''} />
                <AvatarFallback className="bg-white/10 text-[6px] font-bold text-white">
                  {solo.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-bold text-white truncate">@{solo.username}</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-white/50 truncate">
              <Music className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{solo.song_name}</span>
            </div>
            <span className="text-[8px] text-white/25 block mt-0.5">{timeAgo}</span>
          </div>
        </div>

        {/* Big VIEW button — outside the image area */}
        <div className="px-3 py-2 bg-black border-t border-white/[0.04] mt-auto">
          <div className="w-full text-center py-1.5 rounded-lg bg-gold text-black text-[11px] font-black uppercase tracking-wider" style={{ fontFamily: 'Teko, sans-serif' }}>
            VIEW
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Showcase ─────────────────────────────────────────────
export default function SoloShowcase({ onStartSolo }: { onStartSolo: () => void }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { submissions, loading, stats } = useRecentSoloSubmissions(20);

  return (
    <motion.section 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="relative"
    >
      {/* Section header with inline quick-start */}
      <div className="flex items-center justify-between px-4 mb-2.5">
        <div className="flex items-center gap-2">
          <UserRound className="w-4 h-4 text-gold" />
          <span className="text-[14px] font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Solo</span>
          {stats.editing > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {stats.editing} editing
            </span>
          )}
          {stats.total > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground/50">{stats.total} edits</span>
          )}
        </div>

        {/* Quick Start Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => profile ? onStartSolo() : navigate('/start')}
          className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full overflow-hidden touch-manipulation"
          style={{
            background: 'linear-gradient(135deg, hsl(43, 96%, 50%), hsl(38, 92%, 45%))',
            boxShadow: '0 2px 12px rgba(234,179,8,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[50%] bg-gradient-to-b from-white/[0.2] to-transparent pointer-events-none rounded-t-full" />
          <Play className="w-3 h-3 text-black relative z-10" fill="black" />
          <span className="text-[11px] font-black text-black uppercase tracking-wide relative z-10">Start</span>
        </motion.button>
      </div>

      {/* Submissions carousel — compact poster cards */}
      {loading ? (
        <ArenaRailSkeleton count={3} />
      ) : submissions.length > 0 ? (
        <ArenaRail>
          {submissions.map(solo => (
            <ArenaRailCard key={solo.id}>
              <SoloCard solo={solo} />
            </ArenaRailCard>
          ))}
        </ArenaRail>
      ) : (
        <div className="px-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => profile ? onStartSolo() : navigate('/start')}
            className="w-full relative overflow-hidden rounded-lg p-6 text-center group touch-manipulation"
            style={{
              background: 'linear-gradient(135deg, rgba(234,179,8,0.06), rgba(0,0,0,0.4), rgba(168,85,247,0.04))',
              boxShadow: '0 2px 16px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(234,179,8,0.1)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <UserRound className="w-8 h-8 text-gold/20 mx-auto mb-2" />
            <p className="text-[13px] font-bold text-foreground/70 mb-1">No solo edits yet</p>
            <p className="text-[11px] text-muted-foreground/40 mb-3">Pick a song, choose a theme, get scored by a judge</p>
            <div className="inline-flex items-center gap-1.5 text-gold text-[12px] font-bold">
              <Play className="w-3.5 h-3.5" /> Start Solo Edit
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.button>
        </div>
      )}
    </motion.section>
  );
}
