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
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-[#000000] pb-24">
      {/* ─── Hero ─── */}
      <div className="px-4 pt-6 pb-2">
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl text-foreground tracking-tight">CLASS SYSTEM</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Your class reflects your <span className="text-foreground">overall standing</span> — the higher of your GQT score or your level progression.
          </p>
        </motion.div>
      </div>

      {/* ─── Your Status Card ─── */}
      <div className="px-4 mt-3">
        {loading ? (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 animate-pulse h-40" />
        ) : profile ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl bg-[#0a0a0a] border ${userMeta.borderColor} p-5`}
          >
            {userMeta.glow && (
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent" />
            )}
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">Your Class</p>
                  <p className={`font-display text-5xl leading-none ${userMeta.textColor}`}>{userMeta.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.25em] mt-1">{userMeta.subtitle}</p>
                </div>
                <div className={`relative w-20 h-20 rounded-2xl bg-black border ${userMeta.borderColor} flex items-center justify-center shrink-0`}>
                  <ClassBadge rank={effectiveRank} size={62} />
                </div>
              </div>

              {/* Stat strip */}
              <div className="grid grid-cols-4 gap-2 py-4 border-y border-white/5">
                <Stat label="Level" value={`${userLevel}`} />
                <Stat label="Best GQT" value={userScore ? userScore.toFixed(0) : '—'} />
                <Stat label="Index Floor" value={`+${indexFloor}`} />
                <Stat label="Global" value={userRank ? `#${userRank}` : '—'} />
              </div>

              {/* Progress */}
              {next ? (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Next: {next} Class</span>
                    <span className="text-[10px] text-foreground font-semibold">{progressPct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className={`h-full bg-gradient-to-r from-amber-400 to-gold`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{progressLabel}</p>
                </div>
              ) : (
                <p className="mt-4 text-center text-gold font-display text-base">S++ — Maximum tier reached</p>
              )}

              {/* GQT CTA */}
              {!userScore && (
                <Button onClick={() => navigate('/gqt')} className="w-full mt-4 bg-foreground text-background hover:bg-foreground/90 rounded-xl">
                  Take the Global QOI Test
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 text-center">
            <p className="text-sm text-muted-foreground">Sign in to see your class</p>
          </div>
        )}
      </div>

      {/* ─── How it works ─── */}
      <div className="px-4 mt-6">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
          <TrendingUp className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Two ways to rank up: <span className="text-foreground">level up</span> by competing, judging, and posting — or <span className="text-foreground">score high on the GQT</span>. Whichever rank is higher becomes your class.
          </p>
        </div>
      </div>

      {/* ─── All Classes — badge showcase grid ─── */}
      <div className="px-4 mt-6">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.25em] mb-3 px-1">All Classes</p>
        <div className="grid grid-cols-2 gap-2.5">
          {CLASSES.map((c, i) => {
            const cIdx = getRankIndex(c.rank);
            const isCurrent = c.rank === effectiveRank;
            const isLocked = cIdx > userIdx;
            const isUnlocked = cIdx <= userIdx;

            return (
              <motion.div
                key={c.rank}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`relative overflow-hidden rounded-2xl border ${isCurrent ? c.borderColor + ' ring-1 ring-gold/40' : 'border-white/[0.06]'} ${isLocked ? 'opacity-45' : ''} p-3.5 flex flex-col items-center text-center gap-2.5`}
                style={{ background: isCurrent ? 'linear-gradient(180deg, #16161a 0%, #0a0a0a 100%)' : '#0c0c0e' }}
              >
                {/* Status chip — top-right corner */}
                <div className="absolute top-2.5 right-2.5">
                  {isCurrent ? (
                    <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-gold/20 text-gold px-1.5 py-0.5 rounded">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} /> You
                    </span>
                  ) : isLocked ? (
                    <Lock className="w-3 h-3 text-muted-foreground/60" />
                  ) : (
                    <span className="text-[8px] uppercase tracking-wider text-emerald-400/70 font-semibold">Unlocked</span>
                  )}
                </div>

                <div className="mt-1 p-2 rounded-2xl bg-black/40 border border-white/[0.05]">
                  <ClassBadge rank={c.rank} size={52} />
                </div>

                <div>
                  <p className={`font-display text-lg leading-none ${c.textColor}`}>{c.name}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mt-1">{c.subtitle}</p>
                </div>

                <div className="flex items-center justify-center gap-1 flex-wrap pt-1.5 mt-auto border-t border-white/5 w-full">
                  <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 border ${c.borderColor} ${c.textColor} bg-black rounded`}>{c.scoreBadge}</span>
                  {c.rank !== 'F' && (
                    <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-gold/10 text-gold border border-gold/20 rounded">+{getIndexFloorFromRank(c.rank)} IDX</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        <p className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-widest pt-5">
          Class updates automatically
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-lg text-foreground leading-none">{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
