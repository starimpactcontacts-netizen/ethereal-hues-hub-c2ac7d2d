import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, ArrowRight, Crown, Shield, Users, Trophy, 
  Users2, TrendingUp, Coins, ShoppingBag, Gavel, Gift,
  ChevronRight, Plus, Infinity as InfinityIcon, Star, Swords, Loader2,
  Zap, UserRound, ChevronDown, Check, Clock, X, Info, Clapperboard, DollarSign
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useActiveBattles } from '@/hooks/useActiveBattles';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRealEvents, useGlobalStats, useActiveSession, useRealRankings } from '@/hooks/useRealData';
import { useUserActivityStats } from '@/hooks/useUserActivityStats';
import { useTempProfile } from '@/hooks/useTempProfile';
import { useGuestMode } from '@/hooks/useGuestMode';
import { useSanctionedTournaments } from '@/hooks/useSanctionedTournaments';
import { useBattles } from '@/hooks/useBattles';
import { useHostedCompetitions } from '@/hooks/useHostedCompetitions';
import { useLiveActivity, type LiveActivityItem } from '@/hooks/useLiveActivity';
import { useFeaturedDrops } from '@/hooks/useFeaturedDrops';
import FeaturedDropCard from '@/components/loopgate/FeaturedDropCard';
import FeaturedCarousel from '@/components/loopgate/FeaturedCarousel';
import LoopMonster from '@/components/loopgate/LoopMonster';
import QuickFightButton from '@/components/loopgate/QuickFightButton';
import { findQuickFight, useMyQuickFights, leaveQueue } from '@/hooks/useQuickFight';
import { useSoloMode } from '@/hooks/useSoloMode';
import { useAccountPrompt } from '@/hooks/useAccountPrompt';
import GlitchEdge from '@/components/loopgate/GlitchEdge';
import InviteModal from '@/components/loopgate/InviteModal';
import CountdownTimer from '@/components/loopgate/CountdownTimer';
import JudgeReviewsFeed from '@/components/loopgate/JudgeReviewsFeed';
import TrendingLoops from '@/components/loopgate/TrendingLoops';
import EditoriumPicks from '@/components/loopgate/EditoriumPicks';
import JudgeClassBadge from '@/components/loopgate/JudgeClassBadge';
import XPProgressBar from '@/components/loopgate/XPProgressBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import loopRingsPattern from '@/assets/loop-rings-pattern.jpg';
import lvMonogram from '@/assets/lv-monogram.png';
import GatePattern from '@/components/loopgate/GatePattern';
import EditoriumCarousel from '@/components/loopgate/EditoriumCarousel';
import IndexEarnBadge from '@/components/loopgate/IndexEarnBadge';
import FoundingBadge from '@/components/loopgate/FoundingBadge';
import { useEquippedBadges } from '@/hooks/useEquippedBadges';
import CommissionsSection from '@/components/loopgate/CommissionsSection';
import WalletDrawer from '@/components/loopgate/WalletDrawer';

// ── Live Feed for Hub ──────────────────────────────────────────────────
const actionColors: Record<string, string> = {
  submission: 'text-gold',
  review: 'text-purple-400',
  battle: 'text-red-400',
  judge_video: 'text-purple-400',
  connection: 'text-blue-400',
  featured_sub: 'text-brand',
  crew_join: 'text-emerald-400',
  hosted_entry: 'text-orange-400',
  quick_fight: 'text-red-400',
  gqt: 'text-amber-400',
  tournament_join: 'text-cyan-400',
  earning: 'text-emerald-400',
  new_user: 'text-emerald-300',
  profile_update: 'text-sky-400',
};

const typeLabels: Record<string, string> = {
  submission: 'SUB',
  review: 'REVIEW',
  battle: 'BATTLE',
  judge_video: 'VIDEO',
  connection: 'LINK',
  featured_sub: 'DROP',
  crew_join: 'UNIT',
  hosted_entry: 'COMP',
  quick_fight: 'QF',
  gqt: 'GQT',
  tournament_join: 'TOURNEY',
  earning: 'EARN',
  new_user: 'GATE',
  profile_update: 'PROFILE',
};

function HubLiveFeed() {
  const { items, loading } = useLiveActivity(20);
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const displayItems = isOpen ? items : items.slice(0, 3);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 group"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-gold" />
          <span className="text-[9px] text-foreground font-bold uppercase tracking-[0.2em]" style={{ fontFamily: 'Teko, sans-serif', fontSize: '13px' }}>
            Signal Feed
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] text-muted-foreground/60 font-mono">{items.length} signals</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {displayItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, delay: i * 0.02 }}
            className={`flex items-center gap-1.5 py-1 text-[10px] border-b border-border/10 last:border-0 ${item.type === 'earning' ? 'bg-emerald-500/5' : ''}`}
          >
            <span className={`text-[7px] font-mono px-1 py-0.5 rounded-sm ${actionColors[item.type] || 'text-gold'} bg-white/[0.03] shrink-0`}>
              {typeLabels[item.type] || 'SYS'}
            </span>
            <span className="text-foreground font-semibold truncate max-w-[70px]">{item.username}</span>
            <span className={`shrink-0 ${item.type === 'earning' ? 'text-emerald-400 font-bold' : 'text-muted-foreground/70'}`}>{item.action}</span>
            {item.target && (
              <span className={`${actionColors[item.type] || 'text-gold'} truncate flex-1 font-medium`}>{item.target}</span>
            )}
            {item.earned_cents != null && item.earned_cents > 0 && (
              <span className="text-emerald-400 font-black shrink-0">${(item.earned_cents / 100).toFixed(2)}</span>
            )}
            {item.score != null && item.score > 0 && item.type !== 'earning' && (
              <span className="text-gold font-bold shrink-0">{Math.round(item.score)}</span>
            )}
            <span className="text-muted-foreground/40 shrink-0 font-mono text-[8px]">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: false })}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {!isOpen && items.length > 3 && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full text-center text-[8px] text-muted-foreground/50 hover:text-muted-foreground py-1 font-mono uppercase tracking-widest"
        >
          + {items.length - 3} more signals
        </button>
      )}
    </div>
  );
}

const leagueConfig = {
  cartel: { label: 'CARTEL', icon: Crown, gradient: 'from-gold via-amber-400 to-gold', glow: 'shadow-gold/30' },
  elite: { label: 'ELITE', icon: Crown, gradient: 'from-gold to-amber-500', glow: 'shadow-gold/20' },
  pro: { label: 'PRO', icon: Shield, gradient: 'from-blue-400 to-blue-600', glow: 'shadow-blue-500/20' },
  open: { label: 'OPEN', icon: Users, gradient: 'from-zinc-500 to-zinc-600', glow: 'shadow-zinc-500/10' },
};

interface UserCrew {
  id: string;
  name: string;
  emblem: string;
  avatar_url: string | null;
}

export default function HubPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { isJudge } = useUserRoles(user?.id);
  const { profile: tempProfile } = useTempProfile();
  const { isGuest } = useGuestMode();
  const { events } = useRealEvents();
  const { stats } = useGlobalStats();
  const { rankings } = useRealRankings();
  const { tournaments: sanctionedTournaments } = useSanctionedTournaments();
  const { competitions: hostedComps } = useHostedCompetitions();
  const activityStats = useUserActivityStats(user?.id);
  const { activeBattles } = useActiveBattles();
  const { liveDrops } = useFeaturedDrops();
  const { activeSolo } = useSoloMode();
  const navigate = useNavigate();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [judgeReviewCount, setJudgeReviewCount] = useState(0);
  const [userCrew, setUserCrew] = useState<UserCrew | null>(null);
  const [quickAction, setQuickAction] = useState<'solo' | 'quick'>('solo');
  const [qfSearching, setQfSearching] = useState(false);
  const [qfElapsed, setQfElapsed] = useState(0);
  const [qfTipIdx, setQfTipIdx] = useState(0);
  const qfTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { inQueue: qfInQueue, fights: qfFights } = useMyQuickFights();
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const [featuredActiveIdx, setFeaturedActiveIdx] = useState(0);
  const featuredAutoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { hasEquippedOG } = useEquippedBadges(user?.id);
  // Stabilize shuffle — only re-shuffle when the actual drop IDs change
  // Official events (prize_usd > 0) always first, then shuffle the rest
  const shuffledDrops = useMemo(() => {
    const official = liveDrops.filter(d => d.prize_usd > 0);
    const regular = [...liveDrops.filter(d => !d.prize_usd || d.prize_usd === 0)].sort(() => Math.random() - 0.5);
    return [...official, ...regular];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveDrops.map(d => d.id).join(',')]);

  const { open: openAccountPrompt } = useAccountPrompt();
  const qfActiveFight = qfFights.find(f => f.status === 'active' || f.status === 'judging');
  const qfIsSearching = qfSearching || qfInQueue;

  const QF_TIPS = [
    "💡 Queues can take time — check back regularly!",
    "⚡ Want faster matches? Create a 1v1 Edit Battle and invite someone!",
    "🔔 You'll be notified when matched — browse other sections.",
    "👥 More players = faster queues. Share Loopgate!",
  ];

  useEffect(() => {
    if (qfIsSearching) {
      setQfElapsed(0);
      qfTimerRef.current = setInterval(() => setQfElapsed(p => p + 1), 1000);
    } else {
      if (qfTimerRef.current) clearInterval(qfTimerRef.current);
      setQfElapsed(0);
    }
    return () => { if (qfTimerRef.current) clearInterval(qfTimerRef.current); };
  }, [qfIsSearching]);

  useEffect(() => {
    if (!qfIsSearching) return;
    const iv = setInterval(() => setQfTipIdx(p => (p + 1) % QF_TIPS.length), 6000);
    return () => clearInterval(iv);
  }, [qfIsSearching]);

  useEffect(() => {
    if (!qfIsSearching) return;
    const matched = qfFights.find(f => f.status === 'active');
    if (matched) {
      toast.success('⚔️ Match found!');
      navigate(`/fight/${matched.id}`);
      setQfSearching(false);
      supabase.functions.invoke('notify-quick-fight-match', { body: { fight_id: matched.id } }).catch(() => {});
    }
  }, [qfFights, qfIsSearching]);

  const handleQuickFight = async () => {
    if (!user || !profile) { openAccountPrompt('send_message', () => {}); return; }
    if (qfActiveFight) { navigate(`/fight/${qfActiveFight.id}`); return; }
    setQfSearching(true);
    try {
      const fightId = await findQuickFight(user.id, profile.username, profile.avatar_url);
      if (fightId) {
        toast.success('⚔️ Match found!');
        navigate(`/fight/${fightId}`);
        supabase.functions.invoke('notify-quick-fight-match', { body: { fight_id: fightId } }).catch(() => {});
        setQfSearching(false);
      } else {
        toast('🔍 In queue — we\'ll notify you when matched!', { duration: 4000 });
      }
    } catch {
      toast.error('Matchmaking failed');
      setQfSearching(false);
    }
  };

  const handleCancelQueue = async () => {
    if (!user) return;
    await leaveQueue(user.id);
    setQfSearching(false);
    toast('Search cancelled', { duration: 2000 });
  };
  
  useActiveSession();
  
  const displayUsername = profile?.username || tempProfile?.username || (isGuest ? 'Guest' : 'EDITOR');
  const displayAvatar = profile?.avatar_url || tempProfile?.avatarUrl;

  const globalRank = rankings.findIndex(r => r.id === user?.id) + 1 || null;

  useEffect(() => {
    if (profile?.crew_id) {
      supabase
        .from('crews')
        .select('id, name, emblem, avatar_url')
        .eq('id', profile.crew_id)
        .single()
        .then(({ data }) => {
          if (data) setUserCrew(data);
        });
    } else {
      setUserCrew(null);
    }
  }, [profile?.crew_id]);

  // Realtime earnings — auto-refresh profile when earnings_cents changes
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`hub-earnings-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        const newEarnings = (payload.new as any)?.earnings_cents;
        const oldEarnings = (payload.old as any)?.earnings_cents;
        if (newEarnings !== oldEarnings) {
          refreshProfile();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refreshProfile]);
  useEffect(() => {
    if (isJudge && user?.id) {
      supabase
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .eq('judge_id', user.id)
        .eq('status', 'reviewed')
        .then(({ count }) => {
          setJudgeReviewCount(count || 0);
        });
    }
  }, [isJudge, user?.id]);

  const userLeague = (profile?.league?.toLowerCase() || 'open') as keyof typeof leagueConfig;
  const league = leagueConfig[userLeague] || leagueConfig.open;
  const LeagueIcon = league.icon;
  const bestScore = profile?.best_gatekeeper_qoi;
  const classRankConfig = bestScore && bestScore > 0 ? getRankFromScore(bestScore) : null;
  const classLetter = classRankConfig?.rank || ((profile?.level || 1) >= 2 ? 'D' : 'F');

  const liveEvents = events.filter(e => e.status === 'live');
  
  // Sanctioned tournaments that are active (approved, ready_up, live, bracket)
  const activeSanctioned = sanctionedTournaments.filter(t => 
    ['approved', 'ready_up', 'live', 'bracket'].includes(t.status)
  );
  
  // 1v1 Battles that are featured (pending open, active, or judging)
  const { battles } = useBattles(['pending', 'active', 'judging']);
  const featuredBattles = battles.filter(b => 
    b.status === 'pending' || b.status === 'active' || b.status === 'judging'
  ).slice(0, 5); // Limit to 5 most recent
  
  // Premium hosted competitions (live/judging, marked as premium)
  const premiumComps = hostedComps.filter(c => 
    c.is_premium && (c.status === 'live' || c.status === 'judging')
  );
  
  // Total featured count for header
  const totalFeatured = liveDrops.length + premiumComps.length + activeSanctioned.length + featuredBattles.length;

  return (
    <div className="min-h-screen bg-background pb-16 overflow-x-hidden relative">
      {/* Gate lattice — subtle geometric texture */}
      <GatePattern opacity={1.5} tileSize={48} className="z-0" />
      <LoopMonster />
      
      {/* Concentric Rings Pattern - Portal effect */}
      <div className="absolute inset-x-0 -top-20 h-[550px] pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        {/* Loop rings image with subtle expansion */}
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            ease: "easeInOut",
          }}
          className="w-[1300px] h-[1300px] opacity-[0.07]"
        >
          <img 
            src={loopRingsPattern} 
            alt="" 
            className="w-full h-full object-cover"
            style={{
              maskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, white 0%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, white 0%, transparent 75%)',
            }}
          />
        </motion.div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO LAYER - Profile Card with Dimensional Gate Background
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10">
        {/* Subtle top gradient */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-surface-1/50 to-transparent pointer-events-none" />

        <div className="relative px-4 pt-5 pb-1">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
             <div className={`overflow-hidden relative rounded-xl ${hasEquippedOG ? 'bg-[#0c0a04] border border-gold/15' : 'bg-surface-1 border border-border/50'}`}>
               {/* First Circle Skin — luxury prestige aesthetic */}
               {hasEquippedOG && (
                 <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                   {/* Subtle radial gold glow from center-top */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[radial-gradient(ellipse_at_center,_hsl(var(--gold)/0.06)_0%,_transparent_70%)]" />
                   
                   {/* Fine diagonal crosshatch */}
                   <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                     <defs>
                       <pattern id="fc-hatch" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                         <line x1="0" y1="0" x2="0" y2="20" stroke="#C4A44A" strokeWidth="0.5" />
                       </pattern>
                     </defs>
                     <rect width="100%" height="100%" fill="url(#fc-hatch)" />
                   </svg>
                   
                   {/* Edge vignette */}
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#0c0a04_100%)]" />
                   
                   {/* Top accent line */}
                   <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                   <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/8 to-transparent" />
                   
                   {/* Corner accents */}
                   <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-gold/15" />
                   <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-gold/15" />
                   <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-gold/10" />
                   <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-gold/10" />
                 </div>
               )}
               {/* Top Row: Avatar + Identity + Earnings/Index */}
              <div className="relative z-10 p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <button 
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 group text-left min-w-0"
                  >
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${league.gradient} p-[2px] shadow-lg ${league.glow} group-hover:scale-105 transition-transform`}>
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                          {displayAvatar ? (
                            <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-display text-2xl text-foreground">
                              {displayUsername?.charAt(0).toUpperCase() || 'E'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 px-1 py-0.5 rounded-md bg-background border border-border flex items-center justify-center shadow-lg gap-0.5">
                        <img src={lvMonogram} alt="Lv" className="w-3 h-3 object-contain opacity-90" />
                        <span className="font-display text-sm font-bold text-foreground">{profile?.level || 1}</span>
                      </div>
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="font-display text-xl sm:text-2xl text-foreground leading-none truncate max-w-[160px] sm:max-w-[200px]">
                          {displayUsername}
                        </h1>
                        {hasEquippedOG && (
                          <FoundingBadge size="sm" animate={false} />
                        )}
                        {isJudge && (
                          <JudgeClassBadge reviewCount={judgeReviewCount} size="sm" />
                        )}
                      </div>
                      <div className="inline-flex items-center border border-border/60 rounded-sm mt-1.5 divide-x divide-border/40 bg-surface-0/50">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5">
                          <LeagueIcon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[9px] font-bold tracking-wider text-foreground uppercase">
                            {league.label}
                          </span>
                        </div>
                        {globalRank && globalRank <= 500 && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5">
                            <Trophy className="w-3 h-3 text-gold" />
                            <span className="text-[9px] font-bold text-gold">#{globalRank}</span>
                          </div>
                        )}
                        <div className="inline-flex items-center gap-0.5 px-2 py-0.5">
                          <span className={`text-[9px] font-bold ${classRankConfig.color}`}>{classLetter}</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Earnings + Index — top right, refined */}
                  <div className="flex flex-col gap-1.5 shrink-0 min-w-[140px]">
                    {/* Earnings — dual line: available + total */}
                    <button onClick={() => setWalletOpen(true)} className="relative bg-background border border-emerald-500/20 hover:border-emerald-400/40 rounded-lg px-3 py-2 transition-all cursor-pointer w-full text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-display text-lg text-emerald-400 leading-none tabular-nums font-bold">
                            {(Math.max(0, ((profile as any)?.earnings_cents || 0) - ((profile as any)?.pending_withdrawal_cents || 0) - ((profile as any)?.withdrawn_cents || 0)) / 100).toFixed(2)}
                          </span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-emerald-400/30 shrink-0" />
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[8px] text-muted-foreground/50 font-bold uppercase tracking-wider">Available</span>
                        <span className="text-[9px] text-emerald-400/40 tabular-nums font-semibold">
                          ${(((profile as any)?.earnings_cents || 0) / 100).toFixed(2)} earned
                        </span>
                      </div>
                    </button>
                    {/* Index */}
                    <Link to="/shop" className="group">
                      <div className="relative flex items-center gap-2 bg-background border border-border/50 hover:border-gold/40 rounded-lg px-3 py-2 transition-all">
                        <Coins className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span className="font-display text-lg text-foreground leading-none tabular-nums font-bold">
                          {(profile as any)?.spendable_index || 0}
                        </span>
                        <span className="text-[9px] text-gold/60 font-bold tracking-wider">IDX</span>
                        <ShoppingBag className="w-3 h-3 text-gold/30 group-hover:text-gold transition-colors shrink-0 ml-auto" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
              {/* XP Progress Bar */}
              <div className="relative z-10 px-4 pb-2">
                <XPProgressBar 
                  xp={profile?.xp || 0} 
                  level={profile?.level || 1} 
                  size="sm"
                  showNumbers={true}
                />
              </div>

              {/* Stats Row */}
              <div className="relative z-10 border-t border-border/30 px-4 py-2">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="font-display text-xl text-foreground">{activityStats.totalEvents}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-semibold">Events</p>
                  </div>
                  <div>
                    <p className="font-display text-xl text-foreground">{activityStats.totalWins}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-semibold">Wins</p>
                  </div>
                  <div>
                    <p className="font-display text-xl text-foreground">{bestScore?.toFixed(0) || '—'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-semibold">Best QOI</p>
                  </div>
                  <div>
                    <p className="font-display text-xl text-foreground">{activityStats.totalEvents > 0 ? `${activityStats.winRate.toFixed(0)}%` : '—'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-semibold">Win Rate</p>
                  </div>
                </div>
              </div>

              {/* Quick Access — Horizontal scrollable cards */}
              <div className="relative z-10 border-t border-border/30 px-3 py-2.5">
                <div className="grid grid-cols-3 gap-2">
                  {/* Judge-optimized: Start Judging replaces Get Rated */}
                  {isJudge ? (
                    <Link to="/judge-panel" className="group">
                      <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-3 group-hover:border-red-700/50 transition-colors h-full">
                        <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center mb-2">
                          <Gavel className="w-4 h-4 text-red-400" />
                        </div>
                        <p className="text-[9px] text-red-400 uppercase tracking-[0.12em] font-semibold mb-0.5">Panel</p>
                        <p className="font-display text-xs text-foreground leading-tight">Start Judging</p>
                      </div>
                    </Link>
                  ) : (
                    <Link to="/studio" className="group">
                      <div className="relative overflow-hidden bg-gradient-to-br from-surface-1 via-background to-surface-1 border border-border/50 rounded-xl p-3 group-hover:border-foreground/30 transition-all h-full">
                        {/* Inline crosshair pattern */}
                        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <pattern id="studio-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                              <line x1="12" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="0.5" />
                              <line x1="14" y1="12" x2="14" y2="16" stroke="currentColor" strokeWidth="0.5" />
                              <circle cx="0" cy="0" r="0.4" fill="currentColor" />
                              <circle cx="28" cy="0" r="0.4" fill="currentColor" />
                              <circle cx="0" cy="28" r="0.4" fill="currentColor" />
                              <circle cx="28" cy="28" r="0.4" fill="currentColor" />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#studio-grid)" />
                        </svg>
                        {/* Accent glow */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 blur-2xl rounded-full" />
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                        <div className="relative">
                          <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border/50 flex items-center justify-center mb-2">
                            <Clapperboard className="w-4 h-4 text-foreground/70" />
                          </div>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] font-semibold mb-0.5">Studio</p>
                          <p className="font-display text-xs text-foreground leading-tight">Open Editor</p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Unit */}
                  <Link to={userCrew ? `/units/${userCrew.id}` : '/units'} className="group">
                    <div className="bg-surface-1/60 border border-border/40 rounded-xl p-3 group-hover:border-foreground/20 transition-colors h-full">
                      <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center mb-2 overflow-hidden">
                        {userCrew?.avatar_url ? (
                          <img src={userCrew.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users2 className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] font-semibold mb-0.5">
                        {userCrew ? 'Your Unit' : 'Join a Unit'}
                      </p>
                      <p className="font-display text-xs text-foreground leading-tight truncate max-w-full">
                        {userCrew ? userCrew.name : 'Find your group'}
                      </p>
                    </div>
                  </Link>

                  {/* GQT */}
                  <Link to="/gqt" className="group">
                    <div className="bg-surface-1/60 border border-border/40 rounded-xl p-3 group-hover:border-foreground/20 transition-colors h-full">
                      <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center mb-2">
                        <Target className="w-4 h-4 text-foreground" />
                      </div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] font-semibold mb-0.5">GQT</p>
                      <p className="font-display text-xs text-foreground leading-tight">
                        {bestScore ? `Best: ${bestScore.toFixed(0)}` : 'Get your score'}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ⚔️ ACTIVE BATTLE BANNER - First thing users see
      ═══════════════════════════════════════════════════════════════════ */}
      {activeBattles.length > 0 && (
        <div className="px-4 mt-2 space-y-2">
          {activeBattles.map(battle => {
            const isJudgeRole = battle.judge_id === user?.id;
            const isChallenger = battle.challenger_id === user?.id;
            const roleLabel = isJudgeRole ? "YOU'RE JUDGING" : isChallenger ? 'YOUR CHALLENGE' : "YOU'RE DEFENDING";
            const roleEmoji = isJudgeRole ? '⚖️' : isChallenger ? '🗡️' : '🛡️';
            const accentColor = isJudgeRole ? 'purple' : 'red';
            
            return (
              <motion.div
                key={battle.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Link
                  to={`/battle/${battle.id}`}
                  className={`block bg-gradient-to-r ${accentColor === 'purple' ? 'from-purple-500/15 via-surface-1 to-purple-500/15 border-purple-500/40 hover:border-purple-500/60' : 'from-red-500/15 via-surface-1 to-red-500/15 border-red-500/40 hover:border-red-500/60'} border p-3 transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-9 h-9 rounded-full ${accentColor === 'purple' ? 'bg-purple-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                        {isJudgeRole ? <Gavel className="w-4 h-4 text-purple-400" /> : <Swords className="w-4 h-4 text-red-400" />}
                      </div>
                      <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${accentColor === 'purple' ? 'bg-purple-500' : 'bg-red-500'} animate-pulse`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${accentColor === 'purple' ? 'text-purple-400' : 'text-red-400'}`}>
                          {battle.status === 'active' ? `⚔️ LIVE — ${roleEmoji} ${roleLabel}` :
                           battle.status === 'pending' ? `⏳ PENDING — ${roleEmoji} ${roleLabel}` : `⚖️ JUDGING — ${roleEmoji} ${roleLabel}`}
                        </span>
                        {battle.is_rapid && (
                          <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1 py-0.5">⚡ RAPID</span>
                        )}
                      </div>
                      <p className="text-xs text-foreground truncate mt-0.5">
                        {battle.challenger_username} vs {battle.opponent_username || '???'}
                      </p>
                    </div>
                    {battle.status === 'active' && battle.ends_at && (
                      <div className="text-right flex-shrink-0">
                        <CountdownTimer endDate={battle.ends_at} />
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 🎵 ACTIVE SOLO RESUME BANNER */}
      {activeSolo && (
        <div className="px-4 mt-2">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <button
              onClick={() => navigate(`/studio?solo=${activeSolo.id}`)}
              className="w-full bg-gradient-to-r from-gold/15 via-surface-1 to-gold/15 border border-gold/40 hover:border-gold/60 p-3 flex items-center gap-3 transition-all text-left"
            >
              <div className="w-9 h-9 bg-gold/20 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-gold font-bold uppercase tracking-wider block">Active Solo — {activeSolo.status}</span>
                <span className="text-xs text-foreground font-bold truncate block">{activeSolo.theme} · {activeSolo.song_name}</span>
              </div>
              <span className="text-[11px] font-bold text-gold shrink-0">Resume →</span>
            </button>
          </motion.div>
        </div>
      )}

      {/* ⚔️ QUICK ACTION CTA — Dropdown to switch between Solo Edit / Quick Edit Battle */}
      <div className="px-4 mt-3">
        <div className="flex flex-col gap-0">
          {/* Fortnite-style skewed container */}
          <div 
            className="flex gap-0 overflow-hidden"
            style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={quickAction === 'quick' && qfIsSearching}
              onClick={() => {
                if (!profile) { navigate('/start'); return; }
                if (quickAction === 'solo') {
                  navigate('/arena?mode=solo&auto=1');
                } else {
                  if (qfActiveFight) {
                    navigate(`/fight/${qfActiveFight.id}`);
                  } else {
                    handleQuickFight();
                  }
                }
              }}
              className="flex-1 relative overflow-hidden flex items-center justify-center gap-3 px-6 py-5 bg-red-600 hover:bg-red-500 transition-colors touch-manipulation select-none"
            >
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.14] to-transparent pointer-events-none" />
              {quickAction === 'solo' ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center relative z-10 border border-white/20">
                    <UserRound className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[22px] font-bold text-white uppercase tracking-wider relative z-10" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Solo Edit
                  </span>
                  <span className="text-[10px] text-white/50 font-bold relative z-10">100+ IDX</span>
                </>
              ) : qfIsSearching ? (
                <>
                  <Loader2 className="w-5 h-5 text-white animate-spin relative z-10" />
                  <span className="text-[22px] font-bold text-white uppercase tracking-wider relative z-10" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Searching...
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/70 font-mono relative z-10">
                    <Clock className="w-3 h-3" />
                    {Math.floor(qfElapsed / 60)}:{(qfElapsed % 60).toString().padStart(2, '0')}
                  </span>
                </>
              ) : qfActiveFight ? (
                <>
                  <Swords className="w-5 h-5 text-white relative z-10" />
                  <span className="text-[22px] font-bold text-white uppercase tracking-wider relative z-10" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Return to Fight
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-white relative z-10" />
                  <span className="text-[22px] font-bold text-white uppercase tracking-wider relative z-10" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Quick Edit Battle
                  </span>
                  <span className="text-[10px] text-white/50 font-bold relative z-10">+20 IDX</span>
                </>
              )}
            </motion.button>

            {/* Dropdown toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative overflow-hidden flex items-center justify-center px-4 py-5 bg-red-700 hover:bg-red-600 transition-colors touch-manipulation select-none border-l border-red-900/50">
                  <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
                  <ChevronDown className="w-5 h-5 text-white/70 relative z-10" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-surface-1 border-border">
                <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">Quick Action</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setQuickAction('solo')} className="flex items-center gap-2 cursor-pointer">
                  <UserRound className="w-4 h-4 text-gold" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold">Solo Edit</span>
                    <span className="text-[10px] text-gold ml-1.5">100+ IDX</span>
                  </div>
                  {quickAction === 'solo' && <Check className="w-3.5 h-3.5 text-gold" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setQuickAction('quick')} className="flex items-center gap-2 cursor-pointer">
                  <Zap className="w-4 h-4 text-red-400" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold">Quick Edit Battle</span>
                    <span className="text-[10px] text-red-400 ml-1.5">+20 IDX</span>
                  </div>
                  {quickAction === 'quick' && <Check className="w-3.5 h-3.5 text-red-400" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Judge Panel CTA — Fortnite-style for judges */}
          {isJudge && (
            <div 
              className="flex gap-0 overflow-hidden mt-2"
              style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/judge-panel')}
                className="flex-1 relative overflow-hidden flex items-center justify-center gap-3 px-6 py-5 bg-purple-700 hover:bg-purple-600 transition-colors touch-manipulation select-none"
              >
                <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.14] to-transparent pointer-events-none" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center relative z-10 border border-white/20">
                  <Gavel className="w-4 h-4 text-white" />
                </div>
                <span className="text-[22px] font-bold text-white uppercase tracking-wider relative z-10" style={{ fontFamily: 'Teko, sans-serif' }}>
                  Judge Panel
                </span>
                <ChevronRight className="w-5 h-5 text-white/50 relative z-10" />
              </motion.button>
            </div>
          )}

          {/* Queue status bar — when searching for Quick Edit Battle */}
          <AnimatePresence>
            {quickAction === 'quick' && qfIsSearching && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-1.5 mt-1.5"
              >
                <div className="bg-surface-1 border border-border px-3 py-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={qfTipIdx}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="text-[11px] text-muted-foreground leading-snug"
                      >
                        {QF_TIPS[qfTipIdx]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
                <button
                  onClick={handleCancelQueue}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs border border-border bg-surface-1 text-muted-foreground font-bold uppercase tracking-wider hover:text-foreground hover:border-foreground/30 transition-colors touch-manipulation select-none"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Arena banner removed — Arena access consolidated into quick-access grid */}

      {/* ═══════════════════════════════════════════════════════════════════
          📺 FEATURED SECTION - Official events + Sanctioned tournaments
      ═══════════════════════════════════════════════════════════════════ */}
      {totalFeatured > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-2 relative"
        >
          {/* Top decorative border line - white, subtle */}
          <div className="relative h-[1px] pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />
          </div>

          {/* Luxe Background Pattern */}
          <div className="absolute inset-y-0 left-0 right-0 top-[3px] overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20px 20px, hsl(var(--foreground)) 1px, transparent 1px),
                  radial-gradient(circle at 0px 0px, hsl(var(--foreground)) 1px, transparent 1px),
                  linear-gradient(45deg, transparent 48%, hsl(var(--foreground)) 49%, hsl(var(--foreground)) 51%, transparent 52%),
                  linear-gradient(-45deg, transparent 48%, hsl(var(--foreground)) 49%, hsl(var(--foreground)) 51%, transparent 52%)
                `,
                backgroundSize: '40px 40px'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>

          {/* Section Header */}
          <div className="relative flex items-center justify-between px-4 pt-2.5 mb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="w-2 h-2 rounded-full bg-emerald-500 block" />
                <span className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h3 className="font-display text-sm text-foreground">FEATURED</h3>
              <span className="text-[9px] text-muted-foreground">({totalFeatured} active)</span>
            </div>
            <Link to="/arena" className="text-[9px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
              VIEW ALL <ArrowRight size={10} />
            </Link>
          </div>
          
          {/* Horizontal Carousel - Featured drops, Premium comps, Sanctioned, Battles */}
          <FeaturedCarousel
            scrollRef={featuredScrollRef}
            activeIdx={featuredActiveIdx}
            setActiveIdx={setFeaturedActiveIdx}
            autoScrollRef={featuredAutoScrollRef}
            totalFeatured={totalFeatured}
          >
            {/* Featured Artist Drops - Stable shuffle */}
            {shuffledDrops.map(drop => (
              <FeaturedDropCard key={drop.id} drop={drop} />
            ))}

            {/* Premium Hosted Competitions */}
            {premiumComps.map((comp, i) => (
              <Link key={comp.id} to={`/hosted-comp/${comp.slug || comp.id}`} className="shrink-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + (liveEvents.length + i) * 0.05 }}
                  className="w-[240px] bg-surface-1/80 backdrop-blur border border-border/50 hover:border-amber-500/50 transition-colors overflow-hidden group"
                >
                  {/* Competition Poster */}
                  <div className="h-24 overflow-hidden relative bg-gradient-to-br from-amber-900/50 to-surface-1">
                    {(comp.poster_urls?.[0] || comp.poster_url) ? (
                      <img 
                        src={comp.poster_urls?.[0] || comp.poster_url || ''} 
                        alt={comp.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Star className="w-8 h-8 text-amber-400/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-1 to-transparent" />
                    
                    {/* Live badge */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-amber-500/90 px-1.5 py-0.5 rounded-sm">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider">
                        {comp.status === 'judging' ? 'Judging' : 'Live'}
                      </span>
                    </div>
                    
                    {/* Premium badge */}
                    <div className="absolute bottom-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 rounded-sm">
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider">Premium</span>
                    </div>
                    
                    {/* Participant count */}
                    <div className="absolute top-1.5 right-1.5 bg-background/80 border border-border/50 px-1.5 py-0.5 rounded-sm">
                      <span className="text-[8px] font-medium text-foreground">{comp.participant_count || 0} joined</span>
                    </div>
                  </div>
                  
                  {/* Competition Info */}
                  <div className="p-2.5">
                    <p className="font-display text-xs text-foreground truncate">{comp.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[8px] text-amber-400 uppercase tracking-wider">{comp.host_name}</span>
                      <div className="text-[9px] text-muted-foreground">
                        <CountdownTimer endDate={comp.submission_deadline} expiredLabel="Closed" />
                      </div>
                    </div>
                    {/* Activity signal */}
                    {(comp.submission_count || 0) > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] text-emerald-400">{comp.submission_count} entries</span>
                        {(comp.participant_count || 0) >= 10 && (
                          <span className="text-[8px] text-orange-400 ml-auto">🔥 Trending</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
            
            {/* Sanctioned Tournaments */}
            {activeSanctioned.map((tournament, i) => (
              <Link key={tournament.id} to={`/sanctioned/${tournament.id}`} className="shrink-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + (liveEvents.length + premiumComps.length + i) * 0.05 }}
                  className="w-[240px] bg-surface-1/80 backdrop-blur border border-border/50 hover:border-purple-500/50 transition-colors overflow-hidden group"
                >
                  {/* Tournament Poster or Gradient */}
                  <div className="h-24 overflow-hidden relative bg-gradient-to-br from-purple-900/50 to-surface-1">
                    {tournament.poster_url ? (
                      <img 
                        src={tournament.poster_url} 
                        alt={tournament.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Swords className="w-8 h-8 text-purple-400/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-1 to-transparent" />
                    
                    {/* Status badge */}
                    <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-sm ${
                      tournament.status === 'live' || tournament.status === 'bracket' 
                        ? 'bg-purple-500/90' 
                        : 'bg-amber-500/90'
                    }`}>
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider">
                        {tournament.status === 'approved' ? 'Lobby' : 
                         tournament.status === 'ready_up' ? 'Ready Up' :
                         tournament.status === 'bracket' ? 'Bracket' : 'Live'}
                      </span>
                    </div>
                    
                    {/* Sanctioned label */}
                    <div className="absolute bottom-1.5 left-1.5 bg-purple-500/90 px-1.5 py-0.5 rounded-sm">
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider">Sanctioned</span>
                    </div>
                    
                    {/* Player count */}
                    <div className="absolute top-1.5 right-1.5 bg-background/80 border border-border/50 px-1.5 py-0.5 rounded-sm">
                      <span className="text-[8px] font-medium text-foreground">{tournament.player_count}/{tournament.max_players}</span>
                    </div>
                  </div>
                  
                  {/* Tournament Info */}
                  <div className="p-2.5">
                    <p className="font-display text-xs text-foreground truncate">{tournament.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[8px] text-purple-400 uppercase tracking-wider">{tournament.crew_name}</span>
                      <span className="text-[9px] text-muted-foreground">{tournament.format_type?.replace('_', ' ')}</span>
                    </div>
                    {/* Activity signal */}
                    {tournament.player_count > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
                        <span className="text-[8px] text-purple-400">{tournament.player_count} fighters ready</span>
                        {tournament.player_count >= tournament.max_players - 2 && (
                          <span className="text-[8px] text-red-400 ml-auto">Almost full</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
            
            {/* 1v1 Battles */}
            {featuredBattles.map((battle, i) => (
              <Link key={battle.id} to={`/battle/${battle.id}`} className="shrink-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + (liveEvents.length + premiumComps.length + activeSanctioned.length + i) * 0.05 }}
                  className="w-[280px] sm:w-[300px] bg-surface-1/80 backdrop-blur border border-border/50 hover:border-red-500/40 transition-all duration-300 overflow-hidden group hover:shadow-[0_4px_24px_rgba(239,68,68,0.1)]"
                >
                  {/* VS Display Header — Blue vs Red split */}
                  <div className="h-36 overflow-hidden relative">
                    {/* Blue/Red gradient split */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 via-surface-2 to-red-900/60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent" />
                    
                    <div className="absolute inset-0 flex items-center justify-center px-4">
                      {/* Challenger — Blue side */}
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full border-2 border-blue-500/60 bg-blue-500/20 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20">
                          {battle.challenger_avatar_url ? (
                            <img src={battle.challenger_avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-display text-base text-blue-400">
                              {battle.challenger_username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-foreground mt-1.5 truncate max-w-[80px] font-semibold">
                          {battle.challenger_username}
                        </span>
                      </div>
                      
                      {/* VS Badge */}
                      <div className="relative mx-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                          <Swords className="w-4 h-4 text-white" />
                        </div>
                        {battle.status === 'active' && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
                        )}
                      </div>
                      
                      {/* Opponent — Red side */}
                      <div className="flex-1 flex flex-col items-center">
                        {battle.opponent_id ? (
                          <>
                            <div className="w-14 h-14 rounded-full border-2 border-red-500/60 bg-red-500/20 flex items-center justify-center overflow-hidden shadow-lg shadow-red-500/20">
                              {battle.opponent_avatar_url ? (
                                <img src={battle.opponent_avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-display text-base text-red-400">
                                  {battle.opponent_username?.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-foreground mt-1.5 truncate max-w-[80px] font-semibold">
                              {battle.opponent_username}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-14 h-14 rounded-full border-2 border-dashed border-red-500/30 flex items-center justify-center bg-surface-2">
                              <span className="text-xl text-red-400/50">?</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground mt-1.5">Open</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Status badge */}
                    <div className={`absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full ${
                      battle.status === 'active' ? 'bg-red-500/90' :
                      battle.status === 'judging' ? 'bg-purple-500/90' : 'bg-amber-500/90'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider">
                        {battle.status === 'pending' ? 'Open' : 
                         battle.status === 'active' ? 'Live' : 'Judging'}
                      </span>
                    </div>
                    
                    {/* 1v1 label */}
                    <div className="absolute bottom-2 left-2 bg-gradient-to-r from-blue-600 to-red-600 px-2 py-0.5 rounded-full">
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider">1v1 Battle</span>
                    </div>
                    
                    {/* Prize */}
                    <div className="absolute top-2 right-2 bg-background/80 border border-gold/50 px-1.5 py-0.5 rounded-full">
                      <span className="text-[8px] font-bold text-gold">+{battle.winner_index_awarded || 20} IDX</span>
                    </div>
                  </div>
                  
                  {/* Battle Info */}
                  <div className="p-3">
                    <p className="font-display text-sm text-foreground truncate">
                      {battle.challenger_username} vs {battle.opponent_username || '???'}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">{battle.duration_hours}h Battle</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-medium">{battle.status}</span>
                    </div>
                    {/* Activity signal */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] text-red-400 font-medium">
                        {battle.status === 'pending' ? 'Waiting for opponent' :
                         battle.status === 'active' ? 'Edits in progress' : 'Awaiting judge verdict'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
            
            {/* Empty state */}
            {totalFeatured === 0 && (
              <div className="w-full py-6 text-center">
                <p className="text-xs text-muted-foreground">No active events right now</p>
              </div>
            )}
          </FeaturedCarousel>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          💰 GET PAID — Commissions Section
      ═══════════════════════════════════════════════════════════════════ */}
      <CommissionsSection />

      {/* ═══════════════════════════════════════════════════════════════════
          ⚖️ JUDGE AUTHORITY — Cinematic gateway to /judges
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="px-4 mt-2"
      >
        <Link to="/judges" className="block group">
          <div className="relative overflow-hidden rounded-xl bg-background group-hover:bg-surface-1/50 transition-all duration-500">
            {/* Scanline sweep */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-red-700/[0.04] to-transparent pointer-events-none z-0"
            />
            
            <div className="relative p-4 flex items-center gap-4">
              {/* Judge Icon — Authority red */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-sm border border-red-800/40 flex items-center justify-center bg-red-950/30 group-hover:bg-red-950/50 transition-colors">
                  <Gavel className="w-5 h-5 text-red-400" />
                </div>
                {/* Live indicator */}
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-600 border-2 border-background">
                  <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-75" />
                </div>
              </div>
              
              {/* Text block */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl tracking-[0.08em] text-foreground leading-none">JUDGES</h2>
                  <span className="text-[8px] px-1.5 py-0.5 bg-red-950/50 border border-red-800/40 text-red-400 font-bold uppercase tracking-widest rounded-sm">Authority</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">Submit your edit, get rated by your favorite judges.</p>
              </div>
              
              {/* CTA arrow */}
              <div className="shrink-0 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-red-700/50 group-hover:bg-red-950/30 transition-all duration-300">
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          QUICK MENU - Soft rounded white pills
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="px-4 mt-2"
      >
        <div className="bg-surface-1/40 backdrop-blur-sm rounded-2xl p-2 border border-white/5">
          <div className="grid grid-cols-4 gap-1.5">
            <Link to="/rankings" className="group">
              <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors">
                  <Trophy className="w-5 h-5 text-foreground/80 group-hover:text-foreground transition-colors" />
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Rankings</span>
              </div>
            </Link>
            
            <Link to="/league" className="group">
              <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors">
                  <Shield className="w-5 h-5 text-foreground/80 group-hover:text-foreground transition-colors" />
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">League</span>
              </div>
            </Link>
            
            <Link to="/units" className="group">
              <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors">
                  <Users2 className="w-5 h-5 text-foreground/80 group-hover:text-foreground transition-colors" />
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Units</span>
              </div>
            </Link>
            
            <Link to="/shop" className="group">
              <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors">
                  <Gift className="w-5 h-5 text-foreground/80 group-hover:text-foreground transition-colors" />
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Shop</span>
              </div>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          📰 EDITORIUM — Forbes-style feature carousel
      ═══════════════════════════════════════════════════════════════════ */}
      <EditoriumCarousel />



      {/* ═══════════════════════════════════════════════════════════════════
          EXPLORE GRID - IG-style visual collage
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-3 space-y-4"
      >
        {/* Trending Loops */}
        <div>
          <div className="px-4 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-gold rounded-full" />
                <h2 className="font-display text-lg text-foreground">TRENDING</h2>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <Link to="/loop" className="text-[9px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
                VIEW ALL <ArrowRight size={10} />
              </Link>
            </div>
          </div>
          <TrendingLoops limit={10} />
        </div>

        {/* Editorium Picks */}
        <div>
          <div className="px-4 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-red-500 rounded-full" />
                <h2 className="font-display text-lg text-foreground">EDITOR'S PICKS</h2>
              </div>
              <Link to="/editorium" className="text-[9px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
                EDITORIUM <ArrowRight size={10} />
              </Link>
            </div>
          </div>
          <EditoriumPicks limit={10} />
        </div>

        {/* Signal Feed — collapsible live activity */}
        <div className="mx-4 bg-surface-1/30 border border-border/20 px-3 py-1">
          <HubLiveFeed />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          INVITE FRIENDS - Subtle inline CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 px-4"
      >
        <button
          onClick={() => setInviteModalOpen(true)}
          className="w-full bg-surface-1/40 border border-border/30 hover:border-gold/40 transition-colors p-3 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-gold" />
            <span className="text-sm text-foreground">Invite Friends</span>
            <span className="text-[9px] text-muted-foreground">+170 XP</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
        </button>
      </motion.div>

      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
      <WalletDrawer open={walletOpen} onClose={() => setWalletOpen(false)} />
    </div>
  );
}
