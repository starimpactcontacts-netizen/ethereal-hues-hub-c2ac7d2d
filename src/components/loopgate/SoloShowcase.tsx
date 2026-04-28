import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  UserRound, Zap, Music, ChevronRight, ThumbsUp, MessageCircle, Play, Info, X, Sparkles, Trophy, Gavel
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
      </div>
    </Link>
  );
}

// ─── Main Showcase ─────────────────────────────────────────────
export default function SoloShowcase({ onStartSolo }: { onStartSolo: () => void }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { submissions, loading, stats } = useRecentSoloSubmissions(20);
  const [showInfo, setShowInfo] = useState(false);

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
          <button
            onClick={() => setShowInfo(true)}
            className="flex items-center justify-center w-5 h-5 rounded-full bg-gold/10 border border-gold/30 hover:bg-gold/20 active:scale-90 transition-all touch-manipulation"
            aria-label="How Solo Mode works"
          >
            <Info className="w-3 h-3 text-gold" strokeWidth={2.5} />
          </button>
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

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInfo(false)}
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl overflow-hidden border border-gold/20"
              style={{
                background: 'linear-gradient(165deg, #1a1410 0%, #0a0a0d 60%, #100a14 100%)',
                boxShadow: '0 30px 80px -20px rgba(234,179,8,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* Header */}
              <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06]">
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
                    <UserRound className="w-5 h-5 text-black" strokeWidth={2.8} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[22px] font-black text-white leading-none uppercase" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.01em' }}>
                      Solo Mode
                    </h2>
                    <p className="text-[11px] font-bold text-gold/80 uppercase tracking-[0.15em] mt-0.5">Edit. Get scored. Climb.</p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="px-5 py-4 space-y-3">
                {[
                  { icon: Music, color: '#3b82f6', title: 'Pick a song', desc: 'Choose any drop or skip — we hand you a random theme to flip.' },
                  { icon: Sparkles, color: '#a855f7', title: 'Drop your edit', desc: 'Submit your TikTok / IG / YT link. Anyone can run Solo — no opponent needed.' },
                  { icon: Gavel, color: '#10b981', title: 'Get scored by a judge', desc: 'Real judges rate Quality, Originality & Impact → your QOI score.' },
                  { icon: Trophy, color: '#fbbf24', title: 'Earn IDX & climb', desc: 'Higher QOI = more Index + XP. Build your rep without battling anyone.' },
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
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => { setShowInfo(false); profile ? onStartSolo() : navigate('/start'); }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-black uppercase active:scale-[0.98] transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, hsl(43, 96%, 55%), hsl(38, 92%, 45%))',
                    boxShadow: '0 12px 28px -10px rgba(234,179,8,0.55), inset 0 1px 0 rgba(255,255,255,0.3)',
                    fontFamily: 'Teko, sans-serif',
                    letterSpacing: '0.05em',
                    fontSize: 16,
                  }}
                >
                  <Play className="w-4 h-4" fill="black" /> Start Solo Edit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
