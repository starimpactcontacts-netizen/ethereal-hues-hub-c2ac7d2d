import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Target, ArrowRight, Crown, Shield, Users, Trophy, 
  Users2, TrendingUp, Coins, ShoppingBag, Gavel, Gift,
  ChevronRight, Plus, Infinity as InfinityIcon, Star, Swords, Loader2,
  Zap, UserRound, ChevronDown, Check, Clock, X, Info, Clapperboard, DollarSign, Crosshair
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

import { useLiveActivity, type LiveActivityItem } from '@/hooks/useLiveActivity';
import { useFeaturedDrops } from '@/hooks/useFeaturedDrops';
import FeaturedDropCard from '@/components/loopgate/FeaturedDropCard';
import FeaturedCarousel from '@/components/loopgate/FeaturedCarousel';
import LoopMonster from '@/components/loopgate/LoopMonster';
import QuickFightButton from '@/components/loopgate/QuickFightButton';
import { useMyQuickFights, leaveQueue } from '@/hooks/useQuickFight';
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
import { getRankFromScore } from '@/data/gqtConfig';
import EditoriumCarousel from '@/components/loopgate/EditoriumCarousel';
import IndexEarnBadge from '@/components/loopgate/IndexEarnBadge';
import FoundingBadge from '@/components/loopgate/FoundingBadge';
import { useEquippedBadges } from '@/hooks/useEquippedBadges';
import CommissionsSection from '@/components/loopgate/CommissionsSection';
import WalletDrawer from '@/components/loopgate/WalletDrawer';
import LoopyWelcomeModal from '@/components/loopgate/LoopyWelcomeModal';
import { startQuickMatch } from '@/lib/startQuickMatch';

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
  const hostedComps: any[] = [];
  const activityStats = useUserActivityStats(user?.id);
  const { activeBattles } = useActiveBattles();
  const { liveDrops } = useFeaturedDrops();
  const { activeSolo } = useSoloMode();
  const navigate = useNavigate();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [judgeReviewCount, setJudgeReviewCount] = useState(0);
  const [userCrew, setUserCrew] = useState<UserCrew | null>(null);
  const [quickAction, setQuickAction] = useState<'mission' | 'solo' | 'quick'>('mission');
  const [qfSearching, setQfSearching] = useState(false);
  const [qfElapsed, setQfElapsed] = useState(0);
  const [qfTipIdx, setQfTipIdx] = useState(0);
  const qfTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { inQueue: qfInQueue, fights: qfFights } = useMyQuickFights();
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const [featuredActiveIdx, setFeaturedActiveIdx] = useState(0);
  const featuredAutoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const [eventsActiveIdx, setEventsActiveIdx] = useState(0);
  const eventsAutoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { hasEquippedOG } = useEquippedBadges(user?.id);
  const [dismissedBanners, setDismissedBanners] = useState<{ battles?: boolean; solo?: boolean }>({});
  const [missionDrops, setMissionDrops] = useState<Array<{ id: string; song_name: string; poster_url: string | null; artist_name: string | null; max_pay: number }>>([]);

  // Fetch live missions for featured drops billboard
  useEffect(() => {
    const fetchMissions = async () => {
      const { data } = await supabase
        .from('featured_drops')
        .select('id, song_name, poster_url, mission_live, mission_custom_payouts, artist_id')
        .eq('mission_live', true)
        .order('created_at', { ascending: false })
        .limit(5);
      if (!data || data.length === 0) { setMissionDrops([]); return; }
      const artistIds = [...new Set(data.map((d: any) => d.artist_id).filter(Boolean))];
      let artistMap: Record<string, string> = {};
      if (artistIds.length > 0) {
        const { data: artists } = await supabase.from('featured_artists').select('id, name').in('id', artistIds);
        if (artists) artists.forEach(a => { artistMap[a.id] = a.name; });
      }
      setMissionDrops(data.map((d: any) => {
        const payouts = d.mission_custom_payouts || {};
        return {
          id: d.id,
          song_name: d.song_name,
          poster_url: d.poster_url,
          artist_name: d.artist_id ? artistMap[d.artist_id] || null : null,
          max_pay: Math.max((payouts.S || 0) / 100, (payouts.A || 0) / 100, (payouts.B || 0) / 100),
        };
      }));
    };
    fetchMissions();
  }, []);

  // Split drops: artist featured vs event drops (brand/film/official)
  const artistDrops = useMemo(() => {
    const drops = liveDrops.filter(d => (d as any).drop_type !== 'brand' && (d as any).drop_type !== 'film' && (!d.prize_usd || d.prize_usd === 0));
    return [...drops].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveDrops.map(d => d.id).join(',')]);

  const eventDrops = useMemo(() => {
    return liveDrops.filter(d => (d as any).drop_type === 'brand' || (d as any).drop_type === 'film' || (d.prize_usd > 0));
  }, [liveDrops]);

  // Legacy shuffledDrops kept for reference
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
      const result = await startQuickMatch({
        userId: user.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
      });

      if (result.type === 'battle') {
        toast.success('⚔️ Opponent found!');
        navigate(`/battle/${result.id}`);
        setQfSearching(false);
      } else if (result.type === 'fight') {
        toast.success('⚔️ Match found!');
        navigate(`/fight/${result.id}`);
        supabase.functions.invoke('notify-quick-fight-match', { body: { fight_id: result.id } }).catch(() => {});
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
  
  // Total counts
  const totalArtistFeatured = artistDrops.length + missionDrops.length;
  const totalEvents = eventDrops.length + premiumComps.length + activeSanctioned.length + featuredBattles.length;
  const totalFeatured = totalArtistFeatured + totalEvents;

  return (
    <div className="min-h-screen bg-background pb-16 overflow-x-hidden relative">
      {/* Gate lattice — subtle geometric texture */}
      <GatePattern opacity={1.5} tileSize={48} className="z-0" />
      <LoopMonster />
      <LoopyWelcomeModal />
      
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
      <div className="relative z-10 overflow-hidden">
        {/* Subtle top gradient */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-surface-1/50 to-transparent pointer-events-none" />
        {/* Side arch blurs — clipped to this container */}
        <div className="absolute top-0 -left-10 w-48 h-64 bg-surface-1 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute top-0 -right-10 w-48 h-64 bg-surface-1 rounded-full blur-[50px] pointer-events-none" />

        <div className="relative px-4 pt-5 pb-0">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
             <div className={`overflow-hidden relative rounded-t-xl ${hasEquippedOG ? 'bg-transparent' : 'bg-surface-1/80'}`}
               style={{
                 maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                 WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
               }}>
               {/* First Circle Skin — luxury prestige aesthetic */}
                {hasEquippedOG && (
                  <div
                    className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
                     style={{}}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background)/0.9)_0%,hsl(var(--background)/0.78)_42%,hsl(var(--background)/0.28)_76%,transparent_100%)]" />
                   {/* Subtle radial gold glow from center-top */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] h-[220px] bg-[radial-gradient(ellipse_at_center,_hsl(var(--gold)/0.07)_0%,_transparent_72%)]" />
                   
                   {/* Fine diagonal crosshatch */}
                    <svg className="absolute inset-0 w-full h-full opacity-[0.055]" xmlns="http://www.w3.org/2000/svg">
                     <defs>
                       <pattern id="fc-hatch" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                         <line x1="0" y1="0" x2="0" y2="20" stroke="#C4A44A" strokeWidth="0.5" />
                       </pattern>
                     </defs>
                     <rect width="100%" height="100%" fill="url(#fc-hatch)" />
                   </svg>
                   
                    {/* Soft depth without a hard dark bottom */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_28%,_hsl(var(--background)/0.18)_72%,_transparent_100%)]" />
                   
                   {/* Top accent line */}
                   <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                   
                   
                   {/* Corner accents */}
                   <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-gold/15" />
                   <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-gold/15" />
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
                      <div className="flex items-center gap-[6px] mt-1.5">
                        <button onClick={(e) => { e.stopPropagation(); navigate('/league'); }} className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase hover:text-gold transition-colors">{league.label}</button>
                        <span className="text-muted-foreground/30 text-[8px]">·</span>
                        {globalRank && globalRank <= 500 ? (
                          <>
                            <span className="text-[10px] font-bold tabular-nums text-foreground">#{globalRank}</span>
                            <span className="text-muted-foreground/30 text-[8px]">·</span>
                          </>
                        ) : null}
                        <button onClick={(e) => { e.stopPropagation(); navigate('/class'); }} className={`text-[10px] font-black hover:text-gold transition-colors ${classRankConfig?.color || 'text-muted-foreground'}`}>{classLetter}</button>
                      </div>
                    </div>
                  </button>

                  {/* Earnings + Index — top right */}
                  <div className="flex flex-col gap-1.5 shrink-0 items-end">
                    {/* Earnings — prominent real money display */}
                    <button onClick={() => setWalletOpen(true)} className="flex flex-col items-end group">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="font-display text-xl tabular-nums font-bold text-foreground leading-none">
                          {(Math.max(0, ((profile as any)?.earnings_cents || 0) - ((profile as any)?.pending_withdrawal_cents || 0) - ((profile as any)?.withdrawn_cents || 0)) / 100).toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[8px] text-muted-foreground/60 font-semibold uppercase tracking-wider mt-0.5">
                        <span className="text-emerald-400">$</span>{(((profile as any)?.earnings_cents || 0) / 100).toFixed(2)} LIFETIME
                      </span>
                    </button>
                    {/* Index */}
                    <Link to="/index" className="flex items-center gap-1.5">
                      <IndexEarnBadge size="sm" hideDollar />
                      <Coins className="w-3.5 h-3.5 text-gold" />
                      <span className="font-display text-sm tabular-nums font-bold text-foreground/80 leading-none">
                        {profile?.global_index_score || 0}
                      </span>
                      <span className="text-[8px] text-gold/50 font-bold tracking-wider">IDX</span>
                    </Link>
                  </div>
                </div>
              </div>
              {/* XP Progress Bar — closes out the profile card */}
              <div className="relative z-10 px-4 pb-3">
                <XPProgressBar 
                  xp={profile?.xp || 0} 
                  level={profile?.level || 1} 
                  size="sm"
                  showNumbers={true}
                />
              </div>
            </div>
          </motion.div>

          {/* Quick Access — Rolls Royce Starlight dock */}
          <div className="relative mt-4 mb-3">
            {/* ─── Bow arch — edge lines + heavy inward blur arch ─── */}
            <div className="pointer-events-none absolute inset-x-0 -top-20 h-[190px] z-0 overflow-visible">
              {/* Left edge line */}
              <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-foreground/10 via-foreground/5 to-transparent" />
              {/* Right edge line */}
              <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-foreground/10 via-foreground/5 to-transparent" />
              {/* Left inward blur — subtle */}
              <div
                className="absolute left-0 top-0 h-full w-[60px]"
                style={{
                  background: 'linear-gradient(to right, hsl(var(--surface-1) / 0.3) 0%, transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)',
                  filter: 'blur(18px)',
                }}
              />
              {/* Right inward blur — subtle */}
              <div
                className="absolute right-0 top-0 h-full w-[60px]"
                style={{
                  background: 'linear-gradient(to left, hsl(var(--surface-1) / 0.3) 0%, transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)',
                  filter: 'blur(18px)',
                }}
              />
              {/* Main arch — heavy blur mass connecting the legs */}
              <div
                className="absolute inset-x-0 top-0 h-full"
                style={{
                  background: 'radial-gradient(ellipse 88% 70% at 50% -10%, hsl(var(--surface-1) / 0.32) 0%, hsl(var(--surface-1) / 0.14) 40%, transparent 72%)',
                  filter: 'blur(30px)',
                }}
              />
            </div>
            {/* ─── BELT — horizontal band cutting through icons ─── */}
            <div className="absolute top-1/2 z-0 pointer-events-none" style={{ marginTop: '-8px', width: '100vw', left: '50%', transform: 'translateX(-50%) translateY(-50%)' }}>
              <div className="h-[18px] w-full" style={{
                background: 'linear-gradient(180deg, hsl(0 0% 0% / 0) 0%, hsl(0 0% 8% / 0.9) 20%, hsl(0 0% 12% / 1) 40%, hsl(0 0% 12% / 1) 60%, hsl(0 0% 8% / 0.9) 80%, hsl(0 0% 0% / 0) 100%)',
                borderTop: '1px solid hsl(0 0% 100% / 0.08)',
                borderBottom: '1px solid hsl(0 0% 100% / 0.06)',
              }} />
            </div>

            <div className="relative z-10 flex items-center justify-center gap-6">
            {/* UNITS */}
            <Link to={userCrew ? `/units/${userCrew.id}` : '/units'} className="group flex flex-col items-center gap-3">
              <div className="relative w-[68px] h-[68px] rounded-[22px] overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, hsl(0 0% 4%) 0%, hsl(0 0% 6%) 50%, hsl(0 0% 3%) 100%)',
                  border: '1px solid hsl(0 0% 100% / 0.05)',
                  boxShadow: '0 8px 32px hsl(0 0% 0% / 0.8), inset 0 1px 0 hsl(0 0% 100% / 0.03)',
                }}>
                <div className="absolute w-[1px] h-[1px] rounded-full bg-white/25 top-4 right-5" style={{ boxShadow: '0 0 2px hsl(0 0% 100% / 0.2)' }} />
                <div className="absolute w-[1px] h-[1px] rounded-full bg-white/20 bottom-4 left-5" style={{ boxShadow: '0 0 2px hsl(0 0% 100% / 0.15)' }} />
                <div className="absolute inset-[6px] rounded-[16px]" style={{ border: '1px solid hsl(0 0% 100% / 0.03)' }} />
                <div className="relative z-10 flex h-full w-full items-center justify-center">
                  {userCrew?.avatar_url ? (
                    <img src={userCrew.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover" />
                  ) : (
                    <Users2 className="w-7 h-7" style={{ color: 'hsl(0 0% 100% / 0.45)' }} />
                  )}
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'hsl(0 0% 100% / 0.35)' }}>{userCrew ? 'Unit' : 'Units'}</span>
            </Link>

            {/* CENTER — Studio or Judge Panel */}
            {isJudge ? (
              <Link to="/judge-panel" className="group flex flex-col items-center gap-3">
                <div className="relative w-[80px] h-[80px] rounded-[26px] overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, hsl(0 0% 4%) 0%, hsl(0 0% 6%) 50%, hsl(0 0% 3%) 100%)',
                    border: '1px solid hsl(0 0% 100% / 0.07)',
                    boxShadow: '0 12px 40px hsl(0 0% 0% / 0.85), inset 0 1px 0 hsl(0 0% 100% / 0.04), 0 0 20px hsl(0 0% 100% / 0.04), 0 0 1px hsl(0 0% 100% / 0.15)',
                  }}>
                  <div className="absolute inset-0 overflow-hidden rounded-[26px]">
                    <div className="absolute w-[2px] h-[2px] rounded-full bg-white/70 top-3 left-5" style={{ boxShadow: '0 0 4px hsl(0 0% 100% / 0.7)' }} />
                    <div className="absolute w-[1.5px] h-[1.5px] rounded-full bg-white/50 top-6 right-4" style={{ boxShadow: '0 0 3px hsl(0 0% 100% / 0.5)' }} />
                    <div className="absolute w-[1px] h-[1px] rounded-full bg-white/40 bottom-5 left-4" style={{ boxShadow: '0 0 2px hsl(0 0% 100% / 0.4)' }} />
                    <div className="absolute w-[1.5px] h-[1.5px] rounded-full bg-white/55 bottom-3 right-6" style={{ boxShadow: '0 0 3px hsl(0 0% 100% / 0.5)' }} />
                    <div className="absolute w-[1px] h-[1px] rounded-full bg-white/35 top-10 left-6" style={{ boxShadow: '0 0 2px hsl(0 0% 100% / 0.3)' }} />
                    <div className="absolute w-[2px] h-[2px] rounded-full bg-white/60 top-4 right-7" style={{ boxShadow: '0 0 4px hsl(0 0% 100% / 0.6)' }} />
                  </div>
                  <div className="absolute inset-[6px] rounded-[20px]" style={{ border: '1px solid hsl(0 0% 100% / 0.05)', background: 'linear-gradient(160deg, hsl(0 0% 100% / 0.03) 0%, transparent 60%)' }} />
                  <div className="relative z-10 flex h-full w-full items-center justify-center">
                    <Gavel className="w-9 h-9" style={{ color: 'hsl(0 0% 100% / 0.78)' }} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'hsl(0 0% 100% / 0.5)' }}>Panel</span>
              </Link>
            ) : (
              <Link to="/studio" className="group flex flex-col items-center gap-3">
                <div className="relative w-[80px] h-[80px] rounded-[26px] overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, hsl(0 0% 4%) 0%, hsl(0 0% 6%) 50%, hsl(0 0% 3%) 100%)',
                    border: '1px solid hsl(0 0% 100% / 0.07)',
                    boxShadow: '0 12px 40px hsl(0 0% 0% / 0.85), inset 0 1px 0 hsl(0 0% 100% / 0.05), 0 0 20px hsl(0 0% 100% / 0.04), 0 0 1px hsl(0 0% 100% / 0.15)',
                  }}>
                  <div className="absolute inset-0 overflow-hidden rounded-[26px]">
                    <div className="absolute w-[2px] h-[2px] rounded-full bg-white/70 top-3 left-5" style={{ boxShadow: '0 0 4px hsl(0 0% 100% / 0.8)' }} />
                    <div className="absolute w-[1.5px] h-[1.5px] rounded-full bg-white/55 top-5 right-4" style={{ boxShadow: '0 0 3px hsl(0 0% 100% / 0.6)' }} />
                    <div className="absolute w-[1px] h-[1px] rounded-full bg-white/40 bottom-5 left-4" style={{ boxShadow: '0 0 2px hsl(0 0% 100% / 0.4)' }} />
                    <div className="absolute w-[1.5px] h-[1.5px] rounded-full bg-white/60 bottom-3 right-5" style={{ boxShadow: '0 0 3px hsl(0 0% 100% / 0.6)' }} />
                    <div className="absolute w-[1px] h-[1px] rounded-full bg-white/35 top-9 left-3" style={{ boxShadow: '0 0 2px hsl(0 0% 100% / 0.3)' }} />
                    <div className="absolute w-[2px] h-[2px] rounded-full bg-white/65 top-4 right-7" style={{ boxShadow: '0 0 4px hsl(0 0% 100% / 0.7)' }} />
                    <div className="absolute w-[1px] h-[1px] rounded-full bg-white/30 bottom-6 left-7" style={{ boxShadow: '0 0 2px hsl(0 0% 100% / 0.3)' }} />
                  </div>
                  <div className="absolute inset-[6px] rounded-[20px]" style={{ border: '1px solid hsl(0 0% 100% / 0.05)', background: 'linear-gradient(160deg, hsl(0 0% 100% / 0.03) 0%, transparent 60%)' }} />
                  <div className="relative z-10 flex h-full w-full items-center justify-center">
                    <Clapperboard className="w-9 h-9" style={{ color: 'hsl(0 0% 100% / 0.82)' }} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'hsl(0 0% 100% / 0.5)' }}>Studio</span>
              </Link>
            )}

            {/* GQT */}
            <Link to="/gqt" className="group flex flex-col items-center gap-3">
              <div className="relative w-[68px] h-[68px] rounded-[22px] overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, hsl(0 0% 4%) 0%, hsl(0 0% 6%) 50%, hsl(0 0% 3%) 100%)',
                  border: '1px solid hsl(0 0% 100% / 0.05)',
                  boxShadow: '0 8px 32px hsl(0 0% 0% / 0.8), inset 0 1px 0 hsl(0 0% 100% / 0.03)',
                }}>
                <div className="absolute w-[1px] h-[1px] rounded-full bg-white/20 top-3 left-5" style={{ boxShadow: '0 0 2px hsl(0 0% 100% / 0.15)' }} />
                <div className="absolute w-[1px] h-[1px] rounded-full bg-white/25 bottom-5 right-4" style={{ boxShadow: '0 0 2px hsl(0 0% 100% / 0.2)' }} />
                <div className="absolute inset-[6px] rounded-[16px]" style={{ border: '1px solid hsl(0 0% 100% / 0.03)' }} />
                <div className="relative z-10 flex h-full w-full items-center justify-center">
                  <Target className="w-7 h-7" style={{ color: 'hsl(0 0% 100% / 0.45)' }} />
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'hsl(0 0% 100% / 0.35)' }}>GQT</span>
            </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ⚔️ ACTIVE REMINDERS — clean, dismissible */}
      {activeBattles.length > 0 && !dismissedBanners.battles && (
        <div className="px-4 mt-2 space-y-1.5">
          {activeBattles.slice(0, 2).map(battle => {
            const isJudgeRole = battle.judge_id === user?.id;
            const isChallenger = battle.challenger_id === user?.id;
            const roleLabel = isJudgeRole ? "JUDGING" : isChallenger ? 'CHALLENGER' : "DEFENDER";
            const roleEmoji = isJudgeRole ? '⚖️' : isChallenger ? '🗡️' : '🛡️';
            return (
              <div key={battle.id} className="flex items-center gap-1.5">
                <Link to={`/battle/${battle.id}`}
                  className="flex-1 flex items-center gap-3 bg-surface-1 border border-border hover:border-foreground/20 p-3 transition-all">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isJudgeRole ? 'bg-purple-500/15' : 'bg-red-500/15'}`}>
                    {isJudgeRole ? <Gavel className="w-4 h-4 text-purple-400" /> : <Swords className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isJudgeRole ? 'text-purple-400' : 'text-red-400'}`}>
                      {roleEmoji} {roleLabel} · {battle.status}
                    </span>
                    <p className="text-xs text-foreground truncate">{battle.challenger_username} vs {battle.opponent_username || '???'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
                <button onClick={() => setDismissedBanners(prev => ({ ...prev, battles: true }))}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0" aria-label="Dismiss">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          {activeBattles.length > 2 && (
            <Link to="/arena" className="block text-center text-[10px] text-muted-foreground hover:text-foreground">
              +{activeBattles.length - 2} more in My Arena →
            </Link>
          )}
        </div>
      )}

      {activeSolo && !dismissedBanners.solo && (
        <div className="px-4 mt-2">
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate(`/studio?solo=${activeSolo.id}`)}
              className="flex-1 flex items-center gap-3 bg-surface-1 border border-border hover:border-foreground/20 p-3 transition-all text-left">
              <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-gold font-bold uppercase tracking-wider">Solo · {activeSolo.status}</span>
                <p className="text-xs text-foreground font-bold truncate">{activeSolo.song_name}</p>
              </div>
              <span className="text-[10px] font-bold text-gold shrink-0">Resume →</span>
            </button>
            <button onClick={() => setDismissedBanners(prev => ({ ...prev, solo: true }))}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0" aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ⚔️ QUICK ACTION CTA — Premium cinematic button */}
      <div className="px-4 mt-1.5">
        <div className="flex flex-col gap-0">
          {/* Cinematic action container — Premium rounded */}
          <div 
            className="flex overflow-hidden rounded-xl border"
            style={{ 
              borderColor: quickAction === 'mission' ? 'rgba(16,185,129,0.35)' : quickAction === 'solo' ? 'rgba(255,255,255,0.20)' : 'rgba(239,68,68,0.35)',
              boxShadow: quickAction === 'mission'
                ? '0 4px 30px rgba(16,185,129,0.25), 0 0 60px rgba(16,185,129,0.08)'
                : quickAction === 'solo' 
                  ? '0 4px 30px rgba(255,255,255,0.12), 0 0 60px rgba(255,255,255,0.06)' 
                  : '0 4px 30px rgba(239,68,68,0.25), 0 0 60px rgba(239,68,68,0.08)'
            }}
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.01 }}
              disabled={quickAction === 'quick' && qfIsSearching}
              onClick={() => {
                if (!profile) { navigate('/start'); return; }
                if (quickAction === 'mission') {
                  navigate('/arena?filter=missions');
                } else if (quickAction === 'solo') {
                  navigate('/arena?mode=solo&auto=1');
                } else {
                  if (qfActiveFight) {
                    navigate(`/fight/${qfActiveFight.id}`);
                  } else {
                    handleQuickFight();
                  }
                }
              }}
              className={cn(
                "flex-1 relative overflow-hidden flex items-center justify-center gap-3 px-6 py-5 transition-all duration-300 touch-manipulation select-none",
                quickAction === 'mission'
                  ? ""
                  : quickAction === 'solo'
                    ? ""
                    : "bg-gradient-to-r from-red-600 via-red-500 to-red-600"
              )}
              style={quickAction === 'mission' ? {
                background: 'linear-gradient(135deg, hsl(160 84% 39%) 0%, hsl(152 76% 36%) 40%, hsl(145 72% 30%) 100%)',
              } : quickAction === 'solo' ? {
                background: 'linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(40 100% 50%) 40%, hsl(36 100% 48%) 100%)',
              } : undefined}
            >
               {/* Luxury geometric pattern overlay */}
               {(quickAction === 'solo' || quickAction === 'mission') && (
                 <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{
                   backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.5) 8px, rgba(255,255,255,0.5) 9px),
                     repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,255,255,0.5) 8px, rgba(255,255,255,0.5) 9px)`,
                 }} />
               )}
               {/* Shine sweep animation */}
               <motion.div
                 className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.20] to-transparent -skew-x-12 pointer-events-none"
                 animate={{ x: ['-200%', '200%'] }}
                 transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', repeatDelay: 2 }}
               />
               {/* Top gloss */}
               <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/[0.22] to-transparent pointer-events-none" />
              
              {quickAction === 'mission' ? (
                <>
                   <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center relative z-10 border border-white/40 shadow-lg shadow-black/20">
                     <Crosshair className="w-4.5 h-4.5 text-white drop-shadow-lg" />
                  </div>
                  <div className="flex flex-col relative z-10">
                    <span className="text-[28px] font-bold text-white uppercase tracking-wider leading-none drop-shadow-lg" style={{ fontFamily: 'Teko, sans-serif' }}>
                      Mission Edit
                    </span>
                    <span className="text-[9px] text-white/60 font-bold tracking-wider">GET PAID PER EDIT</span>
                  </div>
                </>
              ) : quickAction === 'solo' ? (
                <>
                   <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center relative z-10 border border-white/40 shadow-lg shadow-black/20">
                     <UserRound className="w-4.5 h-4.5 text-white drop-shadow-lg" />
                  </div>
                  <div className="flex flex-col relative z-10">
                    <span className="text-[28px] font-bold text-white uppercase tracking-wider leading-none drop-shadow-lg" style={{ fontFamily: 'Teko, sans-serif' }}>
                      Solo Edit
                    </span>
                    <span className="text-[9px] text-white/60 font-bold tracking-wider">EARN 100+ INDEX</span>
                  </div>
                </>
              ) : qfIsSearching ? (
                <>
                  <Loader2 className="w-5 h-5 text-white animate-spin relative z-10" />
                  <span className="text-[26px] font-bold text-white uppercase tracking-wider relative z-10" style={{ fontFamily: 'Teko, sans-serif' }}>
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
                  <span className="text-[26px] font-bold text-white uppercase tracking-wider relative z-10" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Return to Fight
                  </span>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/25 to-white/5 flex items-center justify-center relative z-10 border border-white/30 shadow-lg shadow-red-900/30">
                    <Zap className="w-4.5 h-4.5 text-white drop-shadow-lg" />
                  </div>
                  <div className="flex flex-col relative z-10">
                    <span className="text-[28px] font-bold text-white uppercase tracking-wider leading-none drop-shadow-lg" style={{ fontFamily: 'Teko, sans-serif' }}>
                      Quick Edit Battle
                    </span>
                    <span className="text-[9px] text-white/60 font-bold tracking-wider">WIN +20 INDEX</span>
                  </div>
                </>
              )}
            </motion.button>

            {/* Dropdown toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={cn(
                    "relative overflow-hidden flex items-center justify-center px-5 py-5 transition-colors touch-manipulation select-none border-l",
                    quickAction === 'mission'
                      ? "hover:brightness-110 border-white/10"
                      : quickAction === 'solo'
                        ? "hover:brightness-110 border-white/10"
                        : "bg-red-700/80 hover:bg-red-600/80 border-red-900/40"
                  )}
                  style={quickAction === 'mission' ? { background: 'hsl(152 72% 28%)' } : quickAction === 'solo' ? { background: 'hsl(33 100% 38%)' } : undefined}
                >
                   {(quickAction === 'solo' || quickAction === 'mission') && (
                     <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{
                       backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.5) 6px, rgba(255,255,255,0.5) 7px),
                         repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(255,255,255,0.5) 6px, rgba(255,255,255,0.5) 7px)`,
                     }} />
                   )}
                   <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
                   <ChevronDown className="w-5 h-5 text-white/90 relative z-10" />
                 </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-surface-1 border-border">
                <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">Quick Action</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setQuickAction('mission')} className="flex items-center gap-2 cursor-pointer">
                  <Crosshair className="w-4 h-4 text-emerald-400" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold">Mission Edit</span>
                    <span className="text-[10px] text-emerald-400 ml-1.5">GET PAID</span>
                  </div>
                  {quickAction === 'mission' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </DropdownMenuItem>
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
          🎵 FEATURED DROPS — All drops carousel
      ═══════════════════════════════════════════════════════════════════ */}
      {totalArtistFeatured > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-2 relative"
        >
          {/* Top decorative border line */}
          <div className="relative h-[1px] pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />
          </div>

          {/* Background Pattern */}
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
              <h3 className="font-display text-sm text-foreground">FEATURED DROPS</h3>
              <span className="text-[9px] text-muted-foreground">({totalArtistFeatured} active)</span>
            </div>
            <Link to="/arena?filter=official" className="text-[9px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
              VIEW ALL <ArrowRight size={10} />
            </Link>
          </div>
          
          {/* Artist Drops Carousel */}
          <FeaturedCarousel
            scrollRef={featuredScrollRef}
            activeIdx={featuredActiveIdx}
            setActiveIdx={setFeaturedActiveIdx}
            autoScrollRef={featuredAutoScrollRef}
            totalFeatured={totalArtistFeatured}
          >
            {/* Mission billboard cards — pinned first */}
            {missionDrops.map(mission => (
              <Link key={`mission-${mission.id}`} to={`/mission/${mission.id}`} className="shrink-0">
                <div className="relative w-[220px] h-[300px] overflow-hidden group cursor-pointer rounded-lg border-2 border-emerald-500/30">
                  {mission.poster_url ? (
                    <img src={mission.poster_url} alt={mission.song_name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  {/* MISSION badge */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 rounded-sm">
                    <DollarSign className="w-3 h-3 text-white" />
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Mission</span>
                  </div>
                  {mission.max_pay > 0 && (
                    <div className="absolute top-2.5 right-2.5 z-10 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-sm">
                      <span className="font-display text-2xl text-emerald-400 leading-none">${mission.max_pay}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {mission.artist_name && (
                      <p className="text-[8px] font-black text-emerald-400/70 uppercase tracking-[0.2em] mb-0.5">{mission.artist_name}</p>
                    )}
                    <h4 className="font-display text-lg text-white leading-tight truncate">{mission.song_name}</h4>
                    <div className="mt-2 flex items-center justify-center gap-2 bg-emerald-600 py-2 rounded-sm">
                      <Crosshair className="w-3.5 h-3.5 text-white" />
                      <span className="text-[11px] font-black text-white uppercase tracking-wider">Enter Mission</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {artistDrops.map(drop => (
              <FeaturedDropCard key={drop.id} drop={drop} />
            ))}
          </FeaturedCarousel>
        </motion.div>
      )}


      {/* ═══════════════════════════════════════════════════════════════════
          💰 GET PAID — Commissions Section
      ═══════════════════════════════════════════════════════════════════ */}
      <CommissionsSection />

      {/* ═══════════════════════════════════════════════════════════════════
          ⚖️ JUDGES — Clean minimal gateway to /judges
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="px-4 mt-2"
      >
        <Link to="/judges" className="block group">
          <div className="relative py-3.5 flex items-center gap-3">
            <Gavel className="w-5 h-5 text-foreground/50 group-hover:text-foreground transition-colors" />
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-sm tracking-[0.08em] text-foreground leading-none">JUDGES</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Get your edits rated by top judges.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/60 group-hover:translate-x-0.5 transition-all" />
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
