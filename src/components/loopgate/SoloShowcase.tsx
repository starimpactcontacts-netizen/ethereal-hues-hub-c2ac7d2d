import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  UserRound, Trophy, Zap, Music, Eye, Clock, 
  ChevronRight, Flame, Play, User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRecentSoloSubmissions, type RecentSolo } from "@/hooks/useRecentSoloSubmissions";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

// ─── Solo Submission Card ──────────────────────────────────────
function SoloCard({ solo }: { solo: RecentSolo }) {
  const statusConfig: Record<string, { label: string; color: string; pulse?: boolean }> = {
    editing: { label: "EDITING", color: "text-amber-400", pulse: true },
    submitted: { label: "SUBMITTED", color: "text-sky-400" },
    judging: { label: "JUDGING", color: "text-purple-400", pulse: true },
    scored: { label: "SCORED", color: "text-emerald-400" },
  };
  const s = statusConfig[solo.status] || statusConfig.editing;
  const timeAgo = formatDistanceToNow(new Date(solo.created_at), { addSuffix: false });

  return (
    <div className="shrink-0 w-[220px] bg-surface-1 border border-border hover:border-gold/40 transition-all overflow-hidden group">
      {/* Thumbnail / Theme visual */}
      <div className="relative h-28 bg-gradient-to-br from-gold/10 via-surface-2 to-purple-500/10 overflow-hidden">
        {solo.thumbnail_url ? (
          <img src={solo.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
            <UserRound className="w-5 h-5 text-gold/40" />
            <span className="text-[10px] font-bold text-gold/50 uppercase tracking-widest">
              {solo.theme}
            </span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2 py-0.5">
          {s.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
          <span className={`text-[9px] font-bold uppercase tracking-wider ${s.color}`}>{s.label}</span>
        </div>

        {/* QOI Score */}
        {solo.qoi_score != null && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2.5 py-1">
            <span className="text-sm font-black text-gold">{Math.round(solo.qoi_score)}</span>
            <span className="text-[8px] text-gold/60 ml-0.5 uppercase">QOI</span>
          </div>
        )}

        {/* Index awarded */}
        {solo.index_awarded > 0 && (
          <div className="absolute top-2 right-2 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-400">+{solo.index_awarded} IDX</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <Avatar className="w-5 h-5 border border-border">
            <AvatarImage src={solo.avatar_url || ''} />
            <AvatarFallback className="bg-surface-2 text-[8px] font-bold text-foreground">
              {solo.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] font-bold text-foreground truncate">@{solo.username}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Music className="w-3 h-3 shrink-0" />
          <span className="truncate">{solo.song_name}</span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] text-muted-foreground/60 italic">"{solo.theme}"</span>
          <span className="text-[9px] text-muted-foreground/40">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Live Activity Ticker ──────────────────────────────────────
function SoloActivityTicker({ submissions }: { submissions: RecentSolo[] }) {
  const recent = submissions.slice(0, 5);
  if (recent.length === 0) return null;

  const getAction = (s: RecentSolo) => {
    switch (s.status) {
      case 'editing': return 'is editing';
      case 'submitted': return 'submitted an edit';
      case 'judging': return 'is being judged';
      case 'scored': return `scored ${Math.round(s.qoi_score || 0)} QOI`;
      default: return 'started solo mode';
    }
  };

  return (
    <div className="px-4 mb-3 space-y-1">
      {recent.slice(0, 3).map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-2 py-1"
        >
          <Avatar className="w-4 h-4 border border-border">
            <AvatarImage src={s.avatar_url || ''} />
            <AvatarFallback className="bg-surface-2 text-[6px] font-bold">{s.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-muted-foreground">
            <span className="font-bold text-foreground">@{s.username}</span>
            {' '}{getAction(s)}{' '}
            <span className="text-gold/70">"{s.theme}"</span>
          </span>
          {s.status === 'editing' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
        </motion.div>
      ))}
    </div>
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
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-1">
        <div className="flex items-center gap-2">
          <UserRound className="w-4 h-4 text-gold" />
          <span className="text-[15px] font-extrabold text-foreground" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            Solo Mode
          </span>
          {stats.editing > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {stats.editing} Editing Now
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Trophy className="w-3 h-3 text-gold" />
          <span className="font-bold text-gold">100+ IDX</span>
        </div>
      </div>

      {/* Tagline */}
      <p className="text-[12px] text-muted-foreground px-4 mb-3">
        Pick a song · Get a theme · Edit · Get judged · Earn massive Index
      </p>

      {/* Stats row */}
      {stats.total > 0 && (
        <div className="flex items-center gap-4 px-4 mb-3">
          {[
            { val: stats.total, label: 'Total Edits', icon: <Flame className="w-3 h-3" />, color: 'text-gold' },
            { val: stats.submitted, label: 'Awaiting Judge', icon: <Clock className="w-3 h-3" />, color: 'text-sky-400' },
            { val: stats.scored, label: 'Scored', icon: <User className="w-3 h-3" />, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={s.color}>{s.icon}</span>
              <span className={`text-[12px] font-bold ${s.color}`}>{s.val}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Live activity ticker */}
      <SoloActivityTicker submissions={submissions} />

      {/* Big CTA — Fortnite x Roblox x Discord */}
      <div className="px-4 mb-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => profile ? onStartSolo() : navigate('/start')}
          className="w-full relative overflow-hidden touch-manipulation group"
        >
          {/* Outer glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-red-500 via-gold to-red-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative bg-gradient-to-b from-[hsl(0,0%,12%)] to-[hsl(0,0%,8%)] py-5 flex items-center justify-center gap-3">
            {/* Top gloss */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
            {/* Bottom edge */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/60 pointer-events-none" />
            
            {/* Icon */}
            <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-gold flex items-center justify-center shadow-lg shadow-red-500/30">
              <UserRound className="w-4.5 h-4.5 text-white" />
            </div>
            
            <div className="relative z-10 flex flex-col items-start">
              <span className="text-[18px] font-black text-foreground tracking-tight uppercase" style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}>
                Start Solo Edit
              </span>
              <span className="text-[10px] text-gold font-bold -mt-1 tracking-wider uppercase">Earn up to 100+ IDX</span>
            </div>
            
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all relative z-10 ml-auto mr-2" />
          </div>
        </motion.button>
      </div>

      {/* Submissions carousel */}
      {loading ? (
        <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2">
          <Skeleton className="h-48 w-[220px] shrink-0" />
          <Skeleton className="h-48 w-[220px] shrink-0" />
          <Skeleton className="h-48 w-[220px] shrink-0" />
        </div>
      ) : submissions.length > 0 ? (
        <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
          {submissions.map(solo => (
            <SoloCard key={solo.id} solo={solo} />
          ))}
          {submissions.length < 4 && Array.from({ length: Math.max(0, 3 - submissions.length) }).map((_, i) => (
            <div key={`ghost-solo-${i}`} className="shrink-0 w-[220px] h-[180px] border border-dashed border-gold/15 bg-surface-0/40 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 bg-surface-2/60 flex items-center justify-center">
                <UserRound className="w-4 h-4 text-gold/20" />
              </div>
              <span className="text-[11px] text-muted-foreground/40 font-medium">Your edit here</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4">
          <div className="bg-surface-1 border border-gold/15 border-dashed p-8 text-center">
            <div className="w-14 h-14 bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
              <UserRound className="w-6 h-6 text-gold/30" />
            </div>
            <p className="text-[13px] text-muted-foreground font-medium mb-1">No solo edits yet</p>
            <p className="text-[12px] text-muted-foreground/60 mb-4">Be the first to start a solo edit session</p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => profile ? onStartSolo() : navigate('/start')}
              className="inline-flex items-center gap-1.5 bg-gold hover:bg-gold/90 text-background text-[12px] font-bold px-5 py-2.5 transition-colors"
            >
              <UserRound className="w-3.5 h-3.5" /> Start Solo Mode
            </motion.button>
          </div>
        </div>
      )}
    </motion.section>
  );
}
