import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, Shield, Star, Lock, Trophy, ChevronRight, Swords, Flame, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRealRankings } from '@/hooks/useRealData';

const leagues = [
  {
    id: 'elite',
    name: 'ELITE',
    subtitle: 'INVITATION ONLY',
    icon: Crown,
    description: 'The apex tier. Reserved for editors who dominated Pro. Invitation only.',
    benefits: ['Exclusive prize pools', 'Priority judge reviews', 'Elite frame & badge', 'Direct sponsor access'],
    requirement: 'INVITE ONLY',
    accent: 'text-amber-300',
    chip: 'bg-amber-300/10 border-amber-300/40',
    glow: 'shadow-amber-300/10',
  },
  {
    id: 'pro',
    name: 'PRO',
    subtitle: 'PROVEN COMPETITORS',
    icon: Star,
    description: 'For editors who proved themselves. Higher stakes. Bigger payouts.',
    benefits: ['Pro-only Arena events', 'Higher Index multiplier', 'Pro League badge', 'Sponsored competitions'],
    requirement: '2+ ARENA WINS',
    accent: 'text-emerald-300',
    chip: 'bg-emerald-300/10 border-emerald-300/40',
    glow: 'shadow-emerald-300/10',
  },
  {
    id: 'open',
    name: 'OPEN',
    subtitle: 'ALL EDITORS',
    icon: Shield,
    description: 'The starting line. Compete, win, climb to Pro.',
    benefits: ['All Open events', 'Standard Index scoring', 'Community competitions', 'Path to Pro'],
    requirement: 'NO REQUIREMENTS',
    accent: 'text-sky-300',
    chip: 'bg-sky-300/10 border-sky-300/40',
    glow: '',
  },
] as const;

export default function LeaguePage() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { rankings, loading: rankLoading } = useRealRankings();

  const loading = authLoading || rankLoading;
  const currentLeague = (profile?.league || 'open') as 'open' | 'pro' | 'elite';

  // Live computed from real data — battles + tournaments + comps + events
  const me = rankings.find(r => r.id === profile?.id);
  const totalWins = me?.total_wins ?? 0;
  const totalEvents = me?.total_events ?? 0;
  const indexScore = me?.global_index_score ?? profile?.global_index_score ?? 0;
  const winRate = me?.win_rate ?? 0;

  const leagueRankings = rankings
    .filter(r => (r.league || 'open') === currentLeague)
    .map((r, i) => ({ ...r, leagueRank: i + 1 }));

  const myLeague = leagues.find(l => l.id === currentLeague) || leagues[2];

  return (
    <div className="min-h-screen bg-[#000000] pb-32 text-foreground">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Competitive Tier</span>
          </div>
          <h1 className="font-display text-4xl text-foreground leading-none">LEAGUE</h1>
        </motion.div>
      </div>

      {/* Current League Hero */}
      {!loading && profile && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 mb-6"
        >
          <div className={`relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl ${myLeague.glow}`}>
            {/* glow swatch */}
            <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-30 ${
              currentLeague === 'elite' ? 'bg-amber-300' : currentLeague === 'pro' ? 'bg-emerald-300' : 'bg-sky-300'
            }`} />

            <div className="relative p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">You compete in</p>
                  <h2 className={`font-display text-5xl ${myLeague.accent} leading-none`}>{myLeague.name}</h2>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground/80 mt-1.5">{myLeague.subtitle}</p>
                </div>
                <myLeague.icon className={`w-10 h-10 ${myLeague.accent}`} strokeWidth={1.5} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                <Stat icon={Trophy} label="Wins" value={totalWins} accent="text-amber-300" />
                <Stat icon={Swords} label="Battles" value={totalEvents} accent="text-foreground" />
                <Stat icon={Target} label="Win %" value={`${Math.round(winRate)}`} suffix="%" accent="text-emerald-300" />
                <Stat icon={Flame} label="Index" value={indexScore} accent="text-sky-300" />
              </div>

              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-3 text-center">
                Live · Synced from battles, tournaments & competitions
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* All Leagues */}
      <div className="px-4 mb-6">
        <h3 className="font-display text-xs text-muted-foreground uppercase tracking-[0.25em] mb-3">All Tiers</h3>
        <div className="space-y-2.5">
          {leagues.map((league, index) => {
            const isCurrent = currentLeague === league.id;
            const isLocked = league.id === 'elite' || (league.id === 'pro' && currentLeague === 'open');

            return (
              <motion.div
                key={league.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className={`
                  relative overflow-hidden rounded-xl bg-[#0a0a0a] border
                  ${isCurrent ? 'border-white/30' : 'border-white/10'}
                `}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${league.chip} border`}>
                        <league.icon className={`w-4 h-4 ${league.accent}`} strokeWidth={1.75} />
                      </div>
                      <div>
                        <h2 className={`font-display text-2xl ${league.accent} leading-none`}>{league.name}</h2>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 mt-0.5">{league.subtitle}</p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="text-[9px] uppercase tracking-wider font-bold bg-white/10 text-white px-2 py-1 rounded">
                        Current
                      </span>
                    ) : isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground/90 leading-relaxed mb-3">{league.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className={`text-[9px] uppercase tracking-[0.15em] font-bold ${league.accent}`}>
                      {league.requirement}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground/50">
                      {league.benefits.length} perks
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* League Leaderboard */}
      <section className="px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xs text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-2">
              <Trophy className={`w-3.5 h-3.5 ${myLeague.accent}`} />
              {myLeague.name} TOP 10
            </h3>
            <button onClick={() => navigate('/rankings')} className="text-[9px] text-muted-foreground hover:text-foreground uppercase tracking-wider flex items-center gap-1 transition-colors">
              All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-1.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-[#0a0a0a] border border-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : leagueRankings.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-white/10 p-8 text-center rounded-lg">
              <Shield className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No editors in {myLeague.name} yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {leagueRankings.slice(0, 10).map((editor, idx) => {
                const isMe = editor.id === profile?.id;
                return (
                  <button
                    key={editor.id}
                    onClick={() => navigate(`/editor/${editor.id}`)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                      isMe
                        ? 'bg-white/5 border-white/30'
                        : 'bg-[#0a0a0a] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <span className={`font-display text-2xl w-8 text-center leading-none ${
                      idx === 0 ? 'text-amber-300' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-orange-400' : 'text-muted-foreground/60'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-[#171717] border border-white/10 overflow-hidden flex-shrink-0">
                      {editor.avatar_url ? (
                        <img src={editor.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base truncate leading-tight">{editor.username}{isMe && <span className="text-[9px] text-muted-foreground/70 ml-1.5 uppercase tracking-wider">You</span>}</p>
                      <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        {editor.total_wins ?? 0}W · {editor.total_events ?? 0} battles
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg leading-none text-sky-300">{editor.global_index_score ?? 0}</p>
                      <p className="text-[8px] uppercase tracking-wider text-muted-foreground/60 mt-0.5">Index</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number | string;
  suffix?: string;
  accent: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2.5 text-center">
      <Icon className={`w-3 h-3 mx-auto mb-1 ${accent}`} strokeWidth={2} />
      <p className="font-display text-xl leading-none">
        {value}{suffix && <span className="text-xs text-muted-foreground ml-0.5">{suffix}</span>}
      </p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70 mt-1">{label}</p>
    </div>
  );
}
