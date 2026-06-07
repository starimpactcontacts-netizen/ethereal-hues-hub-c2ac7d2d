import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, TrendingUp, Check } from 'lucide-react';
import { ClassBadge } from '@/components/loopgate/ClassBadge';
import { useAuth } from '@/hooks/useAuth';
import { useRealRankings } from '@/hooks/useRealData';
import {
  getRankFromScore,
  getRankFromLevel,
  getEffectiveRank,
  getRankIndex,
  getIndexFloorFromRank,
  type GQTRank,
} from '@/data/gqtConfig';

type ClassMeta = {
  rank: GQTRank;
  name: string;
  subtitle: string;
  description: string;
  scoreBadge: string;
  levelBadge: string;
  textColor: string;
  borderColor: string;
  glow: boolean;
};

const CLASSES: ClassMeta[] = [
  { rank: 'S++', name: 'S++ CLASS', subtitle: 'LEGENDARY', description: 'The apex. Absolute mastery. Maximum prestige.', scoreBadge: 'GQT 96+', levelBadge: 'LVL 90+', textColor: 'text-gold', borderColor: 'border-gold', glow: true },
  { rank: 'S+',  name: 'S+ CLASS',  subtitle: 'ELITE',     description: 'Elite editors at the peak of competitive editing.', scoreBadge: 'GQT 90+', levelBadge: 'LVL 70+', textColor: 'text-gold', borderColor: 'border-gold/70', glow: true },
  { rank: 'S',   name: 'S CLASS',   subtitle: 'MASTER',    description: 'Pro-tier editors competing with the best.', scoreBadge: 'GQT 80+', levelBadge: 'LVL 40+', textColor: 'text-amber-400', borderColor: 'border-amber-400', glow: true },
  { rank: 'A',   name: 'A CLASS',   subtitle: 'ADVANCED',  description: 'Skilled editors entering the pro conversation.', scoreBadge: 'GQT 70+', levelBadge: 'LVL 20+', textColor: 'text-emerald-400', borderColor: 'border-emerald-400', glow: false },
  { rank: 'B',   name: 'B CLASS',   subtitle: 'SKILLED',   description: 'Above-average editors with solid fundamentals.', scoreBadge: 'GQT 60+', levelBadge: 'LVL 10+', textColor: 'text-blue-400', borderColor: 'border-blue-400/60', glow: false },
  { rank: 'C',   name: 'C CLASS',   subtitle: 'CONTRIBUTOR', description: 'Average editors building their foundation.', scoreBadge: 'GQT 50+', levelBadge: 'LVL 5+', textColor: 'text-slate-300', borderColor: 'border-slate-400/50', glow: false },
  { rank: 'D',   name: 'D CLASS',   subtitle: 'BEGINNER',  description: 'Developing editors learning the craft.', scoreBadge: 'GQT 40+', levelBadge: 'LVL 2+', textColor: 'text-orange-400', borderColor: 'border-orange-500/40', glow: false },
  { rank: 'F',   name: 'F CLASS',   subtitle: 'UNRANKED',  description: 'Default for new editors. Rank up by leveling or taking the GQT.', scoreBadge: 'GQT < 40', levelBadge: 'LVL 1', textColor: 'text-muted-foreground', borderColor: 'border-border', glow: false },
];

const getMeta = (rank: GQTRank) => CLASSES.find(c => c.rank === rank) || CLASSES[CLASSES.length - 1];

// Level thresholds matching getRankFromLevel
const LEVEL_TARGETS: Record<GQTRank, number> = {
  'F': 1, 'D': 2, 'C': 5, 'B': 10, 'A': 20, 'S': 40, 'S+': 70, 'S++': 90,
};
// GQT thresholds matching getRankFromScore
const GQT_TARGETS: Record<GQTRank, number> = {
  'F': 0, 'D': 40, 'C': 50, 'B': 60, 'A': 70, 'S': 80, 'S+': 90, 'S++': 96,
};
const RANK_ORDER: GQTRank[] = ['F','D','C','B','A','S','S+','S++'];

// Accent hex per tier — drives the top glow bar on cards, escalating dull grey to radiant gold
const ACCENT: Record<GQTRank, string> = {
  'F': '#6b7280', 'D': '#fb923c', 'C': '#94a3b8', 'B': '#3b82f6', 'A': '#10b981', 'S': '#f59e0b', 'S+': '#facc15', 'S++': '#fde68a',
};

const dotGrid = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};
const TEKO = { fontFamily: 'Teko, sans-serif' };

function nextRank(current: GQTRank): GQTRank | null {
  const idx = RANK_ORDER.indexOf(current);
  if (idx < 0 || idx >= RANK_ORDER.length - 1) return null;
  return RANK_ORDER[idx + 1];
}

export default function ClassPage() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { rankings, loading: rankingsLoading } = useRealRankings();
  const loading = authLoading || rankingsLoading;

  const userScore = profile?.best_gatekeeper_qoi || 0;
  const userLevel = profile?.level || 1;
  const effectiveRank = getEffectiveRank(userScore || null, userLevel);
  const userMeta = getMeta(effectiveRank);
  const userIdx = getRankIndex(effectiveRank);
  const next = nextRank(effectiveRank);

  const userRank = profile ? rankings.findIndex(r => r.id === profile.id) + 1 : null;
  const indexFloor = getIndexFloorFromRank(effectiveRank);

  // Progress to next class — track best of GQT path or Level path
  let progressPct = 0;
  let progressLabel = 'Maximum tier reached';
  if (next) {
    const gqtTarget = GQT_TARGETS[next];
    const gqtFloor = GQT_TARGETS[effectiveRank];
    const lvlTarget = LEVEL_TARGETS[next];
    const lvlFloor = LEVEL_TARGETS[effectiveRank];
    const gqtPct = gqtTarget > gqtFloor ? Math.max(0, Math.min(1, (userScore - gqtFloor) / (gqtTarget - gqtFloor))) : 0;
    const lvlPct = lvlTarget > lvlFloor ? Math.max(0, Math.min(1, (userLevel - lvlFloor) / (lvlTarget - lvlFloor))) : 0;
    progressPct = Math.round(Math.max(gqtPct, lvlPct) * 100);
    progressLabel = `Reach ${next} CLASS — Hit LVL ${lvlTarget} or score ${gqtTarget}+ on GQT`;
  }

  return (
    <div className="min-h-screen pb-24 relative" style={{ background: '#0a0a0a' }}>
      <div className="fixed inset-0 pointer-events-none" style={dotGrid} />

      {/* ─── Hero ─── */}
      <div className="relative px-4 pt-6 pb-2">
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold leading-[0.85] italic tracking-tighter uppercase text-white" style={TEKO}>Class System</h1>
          <p className="text-[11px] text-white/35 mt-2 max-w-md">
            Your class reflects your <span className="text-white/70">overall standing</span> — the higher of your GQT score or your level progression.
          </p>
        </motion.div>
      </div>

      {/* ─── Your Status Card ─── */}
      <div className="relative px-4 mt-3">
        {loading ? (
          <div className="rounded-2xl border border-white/[0.07] p-5 animate-pulse h-40" style={{ background: '#111114' }} />
        ) : profile ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.07] p-5"
            style={{ background: 'linear-gradient(180deg, #18181b 0%, #0e0e10 100%)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={dotGrid} />
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${ACCENT[effectiveRank]}, transparent 65%)` }} />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.22em] font-black mb-1" style={TEKO}>Your Class</p>
                  <p className={`text-4xl font-bold italic tracking-tight uppercase leading-none ${userMeta.textColor}`} style={TEKO}>{userMeta.name}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] mt-1.5">{userMeta.subtitle}</p>
                </div>
                <div className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center shrink-0 border border-white/[0.07]" style={{ background: '#0a0a0a' }}>
                  <ClassBadge rank={effectiveRank} size={56} />
                </div>
              </div>

              {/* Stat strip */}
              <div className="grid grid-cols-4 gap-2 py-4 border-y border-white/[0.06]">
                <Stat label="Level" value={`${userLevel}`} />
                <Stat label="Best GQT" value={userScore ? userScore.toFixed(0) : '—'} />
                <Stat label="Index Floor" value={`+${indexFloor}`} />
                <Stat label="Global" value={userRank ? `#${userRank}` : '—'} />
              </div>

              {/* Progress */}
              {next ? (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/35 uppercase tracking-wider font-black" style={TEKO}>Next: {next} Class</span>
                    <span className="text-[11px] text-white/80 font-black tabular-nums" style={TEKO}>{progressPct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #fbbf24, #fde68a)' }}
                    />
                  </div>
                  <p className="text-[10px] text-white/30">{progressLabel}</p>
                </div>
              ) : (
                <p className="mt-4 text-center text-gold text-base font-bold italic uppercase tracking-tight" style={TEKO}>S++ — Maximum tier reached</p>
              )}

              {/* GQT CTA */}
              {!userScore && (
                <button
                  onClick={() => navigate('/gqt')}
                  className="relative w-full mt-4 overflow-hidden rounded-xl border border-white/[0.07] active:scale-[0.985] transition-transform"
                  style={{ background: 'linear-gradient(180deg, #1a1a1e 0%, #0d0d10 100%)' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #fbbf24, transparent 60%)' }} />
                  <div className="relative px-4 py-3 flex items-center justify-center gap-2">
                    <span className="text-[12px] font-black uppercase tracking-[0.16em] text-gold" style={TEKO}>Take the Global QOI Test</span>
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] p-5 text-center" style={{ background: '#111114' }}>
            <p className="text-[12px] text-white/40">Sign in to see your class</p>
          </div>
        )}
      </div>

      {/* ─── How it works ─── */}
      <div className="relative px-4 mt-6">
        <div className="rounded-2xl border border-white/[0.07] p-4 flex items-start gap-3" style={{ background: '#111114' }}>
          <TrendingUp className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/40 leading-relaxed">
            Two ways to rank up: <span className="text-white/70">level up</span> by competing, judging, and posting — or <span className="text-white/70">score high on the GQT</span>. Whichever rank is higher becomes your class.
          </p>
        </div>
      </div>

      {/* ─── All Classes — badge showcase grid ─── */}
      <div className="relative px-4 mt-6">
        <div className="flex items-center gap-1.5 mb-3 px-1">
          <div className="w-4 h-4 rounded-[5px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
            <TrendingUp className="w-2.5 h-2.5 text-black" strokeWidth={2.5} />
          </div>
          <h2 className="text-[15px] font-extrabold tracking-tight text-white/80" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>All Classes</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {CLASSES.map((c, i) => {
            const cIdx = getRankIndex(c.rank);
            const isCurrent = c.rank === effectiveRank;
            const isLocked = cIdx > userIdx;

            return (
              <motion.div
                key={c.rank}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`relative overflow-hidden rounded-2xl border ${isCurrent ? 'border-gold/40' : 'border-white/[0.07]'} ${isLocked ? 'opacity-40' : ''} p-3.5 flex flex-col items-center text-center gap-2.5`}
                style={{ background: isCurrent ? 'linear-gradient(180deg, #1c1c20 0%, #111114 100%)' : '#111114' }}
              >
                <div className="absolute inset-0 pointer-events-none" style={dotGrid} />
                {isCurrent && <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${ACCENT[c.rank]}, transparent 65%)` }} />}

                {/* Status chip — top-right corner */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  {isCurrent ? (
                    <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-black bg-gold/15 text-gold px-1.5 py-0.5 rounded" style={TEKO}>
                      <Check className="w-2.5 h-2.5" strokeWidth={3} /> You
                    </span>
                  ) : isLocked ? (
                    <Lock className="w-3 h-3 text-white/20" />
                  ) : (
                    <span className="text-[8px] uppercase tracking-wider text-emerald-400/70 font-black" style={TEKO}>Unlocked</span>
                  )}
                </div>

                <div className="relative mt-1 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/[0.06]" style={{ background: '#0a0a0a' }}>
                  <ClassBadge rank={c.rank} size={50} />
                </div>

                <div className="relative">
                  <p className={`text-lg font-bold italic tracking-tight uppercase leading-none ${c.textColor}`} style={TEKO}>{c.name}</p>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1">{c.subtitle}</p>
                </div>

                <div className="relative flex items-center justify-center gap-1 flex-wrap pt-1.5 mt-auto border-t border-white/[0.05] w-full">
                  <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 border ${c.borderColor} ${c.textColor} bg-black/40 rounded font-bold`} style={TEKO}>{c.scoreBadge}</span>
                  {c.rank !== 'F' && (
                    <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-gold/10 text-gold border border-gold/20 rounded font-bold" style={TEKO}>+{getIndexFloorFromRank(c.rank)} IDX</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        <p className="text-center text-[10px] text-white/20 uppercase tracking-widest pt-5">
          Class updates automatically
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-black tabular-nums text-white/90 leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>{value}</p>
      <p className="text-[9px] text-white/30 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
