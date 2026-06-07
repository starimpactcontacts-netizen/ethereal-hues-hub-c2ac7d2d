import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Target, ArrowRight, Crown, Shield, Users, Trophy, 
  Users2, TrendingUp, Coins, ShoppingBag, Gavel, Gift,
  ChevronRight, Plus, Infinity as InfinityIcon, Star, Swords, Loader2,
  Zap, UserRound, ChevronDown, Check, Clock, X, Info, Clapperboard, DollarSign, Crosshair, BarChart3,
  Play, ArrowLeft, Sparkles, UserPlus
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useActiveBattles } from '@/hooks/useActiveBattles';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRealEvents, useGlobalStats, useActiveSession, useRealRankings, getEventSlug } from '@/hooks/useRealData';
import { useUserActivityStats } from '@/hooks/useUserActivityStats';
import { useTempProfile } from '@/hooks/useTempProfile';
import { useGuestMode } from '@/hooks/useGuestMode';
import { useSanctionedTournaments } from '@/hooks/useSanctionedTournaments';
import { useBattles } from '@/hooks/useBattles';
import FeaturedEditBattlesSection from '@/components/loopgate/FeaturedEditBattlesSection';
import { ClassBadge } from '@/components/loopgate/ClassBadge';

import { useLiveActivity, type LiveActivityItem } from '@/hooks/useLiveActivity';
import { useFeaturedDrops } from '@/hooks/useFeaturedDrops';
import FeaturedDropCard from '@/components/loopgate/FeaturedDropCard';
import FeaturedCarousel from '@/components/loopgate/FeaturedCarousel';
import LoopMonster from '@/components/loopgate/LoopMonster';
import QuickFightButton from '@/components/loopgate/QuickFightButton';
import { useMyQuickFights, createQuickFightLobby, leaveQueue, joinWaitingQuickFight } from '@/hooks/useQuickFight';
import InstantMatchModal from '@/components/loopgate/InstantMatchModal';
import BattleSelectFlow from '@/components/loopgate/battle-select/BattleSelectFlow';
import { useSoloMode } from '@/hooks/useSoloMode';
import { useAccountPrompt } from '@/hooks/useAccountPrompt';
import GlitchEdge from '@/components/loopgate/GlitchEdge';
import InviteModal from '@/components/loopgate/InviteModal';
import CountdownTimer from '@/components/loopgate/CountdownTimer';
import JudgeReviewsFeed from '@/components/loopgate/JudgeReviewsFeed';
import ArenaCompetitionsSection from '@/components/loopgate/ArenaCompetitionsSection';
import JudgeDivisionBadge from '@/components/loopgate/JudgeDivisionBadge';
import XPProgressBar from '@/components/loopgate/XPProgressBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import lvMonogram from '@/assets/lv-monogram.png';
import { getRankFromScore, getRankFromLevel, getEffectiveRank } from '@/data/gqtConfig';
import IndexEarnBadge from '@/components/loopgate/IndexEarnBadge';
import FoundingBadge from '@/components/loopgate/FoundingBadge';
import RingsCoin from '@/components/loopgate/RingsCoin';
import RingsModal from '@/components/loopgate/RingsModal';
import { useEquippedBadges } from '@/hooks/useEquippedBadges';
import WalletDrawer from '@/components/loopgate/WalletDrawer';
import LoopyWelcomeModal from '@/components/loopgate/LoopyWelcomeModal';
import DailyLoginModal from '@/components/loopgate/DailyLoginModal';
import { useMyCashBattles, useMyCashBattleApplication } from '@/hooks/useCashBattles';
import { useMyCompetitionReminders } from '@/hooks/useMyCompetitionReminders';
import LiveBattleReminders, { type LiveBattleReminderItem } from '@/components/loopgate/LiveBattleReminder';
import SmartUsername from '@/components/loopgate/SmartUsername';

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
          <span className="text-[9px] text-foreground font-bold uppercase tracking-normal" style={{ fontFamily: 'Teko, sans-serif', fontSize: '13px' }}>
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
            <SmartUsername
              userId={item.user_id}
              username={item.username}
              className="text-foreground font-semibold truncate max-w-[70px]"
            />
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
          className="w-full text-center text-[8px] text-muted-foreground/50 hover:text-muted-foreground py-1 font-mono uppercase tracking-normal"
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
  const { profile, user, refreshProfile, isAdmin } = useAuth();
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
  const [ringsOpen, setRingsOpen] = useState(false);
  const [playExpanded, setPlayExpanded] = useState(false);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [judgeReviewCount, setJudgeReviewCount] = useState(0);
  const [userCrew, setUserCrew] = useState<UserCrew | null>(null);
  const [quickAction, setQuickAction] = useState<'edit_battle' | 'mission' | 'solo' | 'multiplayer'>('edit_battle');
  const [qfSearching, setQfSearching] = useState(false);
  const [qfElapsed, setQfElapsed] = useState(0);
  const [qfTipIdx, setQfTipIdx] = useState(0);
  const qfTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [instantMatch, setInstantMatch] = useState<null | {
    fightId: string;
    cancelled: boolean;
    you: { username: string; avatarUrl: string | null; level: number };
    opponent: { username: string; avatarUrl: string | null; level: number };
  }>(null);
  const [battleSelect, setBattleSelect] = useState<null | {
    fightId: string;
    you: { username: string; avatarUrl: string | null; level: number };
    opponent: { username: string; avatarUrl: string | null; level: number };
    youSide: 'red' | 'blue';
  }>(null);
  const { inQueue: qfInQueue, fights: qfFights } = useMyQuickFights();
  const { competitions: myLiveCompetitions } = useMyCompetitionReminders();
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const [featuredActiveIdx, setFeaturedActiveIdx] = useState(0);
  const featuredAutoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const [eventsActiveIdx, setEventsActiveIdx] = useState(0);
  const eventsAutoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { hasEquippedOG } = useEquippedBadges(user?.id);
  const { battles: myCashBattles, loading: myCashBattlesLoading } = useMyCashBattles();
  const { joinPool: hubJoinPool } = useMyCashBattleApplication();
  const [dismissedBanners, setDismissedBanners] = useState<{ battles?: boolean; solo?: boolean }>({});
  const [missionDrops, setMissionDrops] = useState<Array<{ id: string; song_name: string; poster_url: string | null; artist_name: string | null; max_pay: number }>>([]);
  const [liveOnline, setLiveOnline] = useState(0);

  // Real "online right now" = active_sessions in the last 5 minutes
  useEffect(() => {
    const fetchOnline = async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('active_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', fiveMinAgo);
      setLiveOnline(count || 0);
    };
    fetchOnline();
    const iv = setInterval(fetchOnline, 60000);
    return () => clearInterval(iv);
  }, []);

  // Fetch live missions for featured drops billboard
  useEffect(() => {
    const fetchMissions = async () => {
      const { data } = await supabase
        .from('commissions')
        .select('id, title, cover_url, artist_name, client_name, mission_type, custom_payouts, payout_cents')
        .eq('is_marketplace', true)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5);
      if (!data || data.length === 0) { setMissionDrops([]); return; }
      setMissionDrops(data.map((d: any) => {
        const payouts = d.custom_payouts || {};
        return {
          id: d.id,
          song_name: d.title,
          poster_url: d.cover_url,
          artist_name: d.artist_name || d.client_name || null,
          max_pay: d.payout_cents / 100,
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
  const qfActiveFight = qfFights.find(f => f.status === 'selecting' || f.status === 'active' || f.status === 'judging');
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

  // Lobby music while waiting in matchmaking queue
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { setLobbyMusicActive } = await import('@/components/loopgate/LobbyMusicPlayer');
      if (!cancelled) setLobbyMusicActive(qfIsSearching);
    })();
    return () => {
      cancelled = true;
      import('@/components/loopgate/LobbyMusicPlayer').then(m => m.setLobbyMusicActive(false));
    };
  }, [qfIsSearching]);

  useEffect(() => {
    if (!qfIsSearching) return;
    const iv = setInterval(() => setQfTipIdx(p => (p + 1) % QF_TIPS.length), 6000);
    return () => clearInterval(iv);
  }, [qfIsSearching]);

  useEffect(() => {
    if (!qfIsSearching) return;
    const matched = qfFights.find(f => f.status === 'selecting' || f.status === 'active');
    if (matched) {
      toast.success('⚔️ Match found!');
      navigate(`/fight/${matched.id}`);
      setQfSearching(false);
      supabase.functions.invoke('notify-quick-fight-match', { body: { fight_id: matched.id } }).catch(() => {});
    }
  }, [qfFights, qfIsSearching]);

  const handleQuickFight = async () => {
    if (!user || !profile) { openAccountPrompt('enter_battle', () => {}); return; }
    if (qfActiveFight) { navigate(`/fight/${qfActiveFight.id}`); return; }
    const existingWaiting = qfFights.find(f => f.status === 'waiting' && f.player_1_id === user.id);
    if (existingWaiting) { navigate(`/fight/${existingWaiting.id}`); return; }
    setQfSearching(true);
    try {
      // 1) Try to instantly match into an open public waiting lobby
      const { data: openLobbies } = await supabase
        .from('quick_fights')
        .select('id, player_1_id, player_1_username, player_1_avatar_url')
        .eq('status', 'waiting')
        .is('player_2_id', null)
        .or('is_private.is.null,is_private.eq.false')
        .neq('player_1_id', user.id)
        .is('hidden_at' as any, null)
        .order('created_at', { ascending: true })
        .limit(5);

      const candidate = (openLobbies || [])[0] as any;
      if (candidate) {
        const { data: opp } = await supabase
          .from('profiles')
          .select('level')
          .eq('id', candidate.player_1_id)
          .maybeSingle();
        setInstantMatch({
          fightId: candidate.id,
          cancelled: false,
          you: { username: profile.username, avatarUrl: profile.avatar_url, level: (profile as any).level || 1 },
          opponent: {
            username: candidate.player_1_username,
            avatarUrl: candidate.player_1_avatar_url,
            level: (opp as any)?.level || 1,
          },
        });
        setQfSearching(false);
        return;
      }

      // 2) No open lobby → create a new one
      const lobby = await createQuickFightLobby(user.id, profile.username, profile.avatar_url, { isPrivate: false, durationMinutes: 60 });
      if (!lobby) throw new Error('create lobby failed');
      await leaveQueue(user.id);
      toast.success('Edit Battle lobby created');
      navigate(`/fight/${lobby.id}`);
    } catch {
      toast.error("Couldn't create Edit Battle");
    } finally {
      setQfSearching(false);
    }
  };

  const confirmInstantMatch = async () => {
    if (!instantMatch || !user || !profile) return;
    const match = instantMatch;
    setInstantMatch(null);
    const { ok, error } = await joinWaitingQuickFight(
      match.fightId, user.id, profile.username, profile.avatar_url, null
    );
    if (ok) {
      toast.success('⚔️ Match locked in!');
      setBattleSelect({ fightId: match.fightId, you: match.you, opponent: match.opponent, youSide: 'blue' });
    } else {
      toast.error(error || 'Lobby already taken — try again');
    }
  };

  const handleCancelQueue = async () => {
    if (!user) return;
    await leaveQueue(user.id);
    setQfSearching(false);
    toast('Search cancelled', { duration: 2000 });
  };

  const handleMultiplayer = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('id, slug')
      .eq('status', 'lobby')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      navigate(`/competition/${(data as any).slug || (data as any).id}`);
    } else {
      navigate('/competitions');
    }
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
  const classLetter = getEffectiveRank(bestScore, profile?.level);
  const classRankConfig = getRankFromScore(
    bestScore && bestScore > 0
      ? bestScore
      : ({ 'S++': 100, 'S+': 95, 'S': 90, 'A': 75, 'B': 60, 'C': 50, 'D': 40, 'F': 0 } as Record<string, number>)[classLetter] ?? 0
  );

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
    <div
      className="min-h-screen pb-16 overflow-x-hidden relative"
      style={{
        background: '#0A0A0A',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.032) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }}
    >
      {/* Radial depth pull */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(255,255,255,0.022) 0%, transparent 100%)',
        }}
      />
      
      <LoopyWelcomeModal />
      <DailyLoginModal />
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO LAYER - Profile Card with Dimensional Gate Background
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 overflow-hidden" style={{ background: '#0a0a0a' }}>

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
               {/* Dot gradient overlay — always visible */}
               <div
                 className="absolute inset-0 pointer-events-none z-[1]"
                 style={{
                   backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 0.5px, transparent 0.5px)',
                   backgroundSize: '6px 6px',
                   maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                   WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                 }}
               />
                {/* OG Skin — glossy iridescent (matches OG chip) */}
                {hasEquippedOG && (
                  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    {/* Base dark wash so text stays legible */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,8,20,0.92)_0%,rgba(14,10,28,0.78)_45%,rgba(14,10,28,0.25)_80%,transparent_100%)]" />
                    {/* Iridescent holo sweep — blue → purple → pink */}
                    <div
                      className="absolute inset-0 opacity-[0.55]"
                      style={{
                        background:
                          'linear-gradient(110deg, rgba(120,180,255,0.18) 0%, rgba(190,150,255,0.22) 35%, rgba(255,180,230,0.18) 65%, rgba(150,210,255,0.20) 100%)',
                      }}
                    />
                    {/* Top glossy sheen */}
                    <div
                      className="absolute inset-x-0 top-0 h-[55%]"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 35%, transparent 100%)',
                      }}
                    />
                    {/* Center radial purple aura */}
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-[360px] h-[240px]"
                      style={{
                        background:
                          'radial-gradient(ellipse at center, rgba(180,140,255,0.22) 0%, rgba(120,180,255,0.10) 45%, transparent 75%)',
                      }}
                    />
                    {/* Shimmer specks */}
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 18% 28%, rgba(255,255,255,0.55) 0.6px, transparent 1.6px), radial-gradient(circle at 72% 22%, rgba(200,230,255,0.5) 0.6px, transparent 1.6px), radial-gradient(circle at 42% 70%, rgba(255,210,240,0.45) 0.5px, transparent 1.4px), radial-gradient(circle at 86% 62%, rgba(220,200,255,0.5) 0.5px, transparent 1.4px)',
                      }}
                    />
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(200,180,255,0.45)] to-transparent" />
                    {/* Corner accents */}
                    <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-[rgba(200,180,255,0.35)]" />
                    <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-[rgba(200,180,255,0.35)]" />
                  </div>
                )}
               {/* Top Row: Avatar + Identity + Currency */}
              <div className="relative z-10 p-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 group text-left min-w-0"
                  >
                    {/* Square avatar — no ring, clean */}
                    <div className="relative shrink-0">
                      <div className="w-[58px] h-[58px] rounded-md overflow-hidden bg-surface-2 group-hover:scale-[1.03] transition-transform"
                        style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                        {displayAvatar ? (
                          <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-display text-2xl text-foreground">
                              {displayUsername?.charAt(0).toUpperCase() || 'E'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 px-1 py-0.5 rounded-md bg-background border border-border flex items-center justify-center shadow-lg gap-0.5">
                        <img src={lvMonogram} alt="Lv" className="w-3 h-3 object-contain opacity-90" />
                        <span className="font-display text-sm font-bold text-foreground">{profile?.level || 1}</span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      {/* Username + special badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="font-display text-xl sm:text-2xl text-foreground leading-none truncate max-w-[160px] sm:max-w-[200px]">
                          <SmartUsername userId={user?.id} username={displayUsername} />
                        </h1>
                        {hasEquippedOG && <FoundingBadge size="sm" animate={false} />}
                      </div>
                      {/* Class crest + slanted league tag — loopgate HUD style */}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/class'); }}
                        className="flex items-center gap-2 mt-1.5 active:opacity-70 transition-opacity"
                      >
                        <ClassBadge rank={classLetter} size={34} />
                        <span
                          className="text-[18px] font-black uppercase leading-none"
                          style={{
                            fontFamily: 'Teko, sans-serif',
                            letterSpacing: '0.08em',
                            color: '#ffffff',
                            transform: 'skewX(-12deg)',
                            display: 'inline-block',
                            textShadow: '0 2px 0 rgba(0,0,0,0.55)',
                            WebkitTextStroke: '0.5px rgba(0,0,0,0.6)',
                            paintOrder: 'stroke fill',
                          }}
                        >
                          {classLetter} CLASS
                        </span>
                      </button>
                    </div>
                  </button>

                  {/* Currency — top right */}
                  <div className="shrink-0">
                    <button
                      onClick={() => setRingsOpen(true)}
                      className="flex items-baseline active:scale-95 transition-transform font-display text-xl font-bold leading-none"
                      style={{ letterSpacing: '-0.05em', WebkitTextStroke: '1.5px #000', paintOrder: 'stroke fill' }}
                    >
                      <span className="text-[#3BCB6B]" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.6)' }}>$</span>
                      <span className="text-foreground">R</span>
                      <span className="ml-1 tabular-nums text-foreground">
                        {((profile as any)?.rings || 0).toLocaleString()}
                      </span>
                    </button>
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

          {/* ⚔️ ACTIVE REMINDERS — above PLAY so it doesn't split the CTA stack */}
          {(() => {
            const qfItems: LiveBattleReminderItem[] = qfFights
              .filter(f => ['active', 'submitted', 'judging'].includes(f.status))
              .map(f => {
                const isP1 = f.player_1_id === user?.id;
                return {
                  kind: 'quick' as const,
                  id: f.id,
                  title: `${f.player_1_username} vs ${f.player_2_username || '???'}`,
                  participants: [
                    { userId: f.player_1_id, username: f.player_1_username },
                    { userId: f.player_2_id, username: f.player_2_username || '???' },
                  ],
                  status: f.status,
                  endsAt: f.ends_at,
                  hasSubmitted: isP1 ? !!f.player_1_submission_url : !!f.player_2_submission_url,
                  href: `/fight/${f.id}`,
                };
              });
            const items: LiveBattleReminderItem[] = [
              ...activeBattles.map(battle => {
                const isJudgeRole = battle.judge_id === user?.id;
                const isChallenger = battle.challenger_id === user?.id;
                return {
                  kind: 'battle' as const,
                  id: battle.id,
                  title: `${battle.challenger_username} vs ${battle.opponent_username || '???'}`,
                  participants: [
                    { userId: battle.challenger_id, username: battle.challenger_username },
                    { userId: battle.opponent_id, username: battle.opponent_username || '???' },
                  ],
                  status: battle.status,
                  endsAt: battle.ends_at,
                  hasSubmitted: isChallenger ? !!(battle as any).challenger_submission_url : !!(battle as any).opponent_submission_url,
                  isJudge: isJudgeRole,
                  href: `/battle/${battle.id}`,
                };
              }),
              ...qfItems,
              ...myLiveCompetitions.map(comp => ({
                kind: 'competition' as const,
                id: comp.id,
                title: comp.name,
                status: comp.status,
                endsAt: comp.status === 'voting' ? comp.voting_deadline : comp.deadline,
                hasSubmitted: comp.hasSubmitted,
                hasVoted: comp.hasVoted,
                href: `/competition/${comp.slug || comp.id}`,
              })),
            ];
            return items.length > 0 && !dismissedBanners.battles ? (
              <div className="px-4 mt-4 mb-2">
                <LiveBattleReminders items={items} />
              </div>
            ) : null;
          })()}

          {/* PLAY — aggressive arena CTA (red, angular, retro) */}
          <div className="relative mt-4 mb-3">
            <AnimatePresence mode="wait" initial={false}>
              {!playExpanded ? (
                <motion.div
                  key="play"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-center"
                >
                  <button
                    onClick={() => setPlayExpanded(true)}
                    className="group relative w-full max-w-[280px] active:scale-[0.98] transition-transform overflow-hidden"
                    style={{
                      background: '#FF3B3B',
                      boxShadow: 'inset 0 1px 0 hsl(0 100% 82% / 0.4), inset 0 -4px 0 hsl(0 80% 28% / 0.6), 0 0 28px hsl(0 100% 55% / 0.45)',
                    }}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                    <div className="relative flex items-center justify-center gap-2.5 py-[22px]">
                      <span
                        className="text-white uppercase leading-none"
                        style={{ fontFamily: 'Teko, sans-serif', fontSize: '34px', fontWeight: 600, letterSpacing: '0.01em', textShadow: '0 1px 0 rgba(0,0,0,0.45)' }}
                      >
                        PLAY
                      </span>
                    </div>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="w-full flex flex-col gap-2 max-w-[280px] mx-auto"
                >
                  <button
                    onClick={() => { setPlayExpanded(false); handleQuickFight(); }}
                    disabled={qfIsSearching}
                    className="relative w-full py-4 overflow-hidden active:scale-[0.99] transition disabled:opacity-60 flex flex-col items-center justify-center"
                    style={{ background: '#FF3B3B', boxShadow: 'inset 0 1px 0 hsl(0 100% 82% / 0.4), inset 0 -3px 0 hsl(0 80% 28% / 0.5), 0 0 20px hsl(0 100% 55% / 0.35)' }}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                    <span className="relative text-white uppercase leading-none flex items-center gap-2" style={{ fontFamily: 'Teko, sans-serif', fontSize: '32px', fontWeight: 700, letterSpacing: '0.04em', textShadow: '1px 1px 0 rgba(0,0,0,0.4)' }}>
                      {qfIsSearching && <Loader2 className="w-4 h-4 animate-spin" />}
                      Edit Battles
                    </span>
                    <span className="relative text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mt-1" style={{ fontFamily: 'Teko, sans-serif' }}>Enter 1v1 Lobby</span>
                  </button>

                  <button
                    onClick={() => { setPlayExpanded(false); handleMultiplayer(); }}
                    className="w-full py-4 active:scale-[0.99] transition flex flex-col items-center justify-center"
                    style={{ background: 'hsl(var(--surface-1))', border: '1px solid hsl(0 100% 55% / 0.4)' }}
                  >
                    <span className="text-foreground uppercase leading-none" style={{ fontFamily: 'Teko, sans-serif', fontSize: '32px', fontWeight: 700, letterSpacing: '0.04em' }}>Multiplayer</span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1" style={{ fontFamily: 'Teko, sans-serif' }}>Join An Open Lobby</span>
                  </button>

                  <button
                    onClick={() => setPlayExpanded(false)}
                    className="w-full py-3 active:scale-[0.99] transition"
                    style={{ background: 'hsl(var(--surface-1))', border: '1px solid hsl(var(--border))' }}
                  >
                    <span className="text-muted-foreground uppercase leading-none" style={{ fontFamily: 'Teko, sans-serif', fontSize: '26px', fontWeight: 700, letterSpacing: '0.04em' }}>Back</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>


      {activeSolo && !dismissedBanners.solo && (
        <div className="px-4 mt-2">
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate(`/studio?solo=${activeSolo.id}`)}
              className="flex-1 flex items-center gap-3 bg-surface-1 border border-border hover:border-foreground/20 p-3 transition-all text-left">
              <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-gold font-bold uppercase tracking-normal">Solo · {activeSolo.status}</span>
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


      {/* Arena banner removed — Arena access consolidated into quick-access grid */}

      {/* ═══ Collapsible: SHOP + RANKINGS ═══ */}
      <div className="px-4 -mt-2">
        <div className="w-full max-w-[280px] mx-auto">
          <button
            onClick={() => setMoreExpanded((v) => !v)}
            className="w-full flex items-center justify-center gap-2 py-2 active:scale-[0.99] transition"
            style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.12)' }}
            aria-expanded={moreExpanded}
          >
            <span
              className="text-white/80 uppercase leading-none"
              style={{ fontFamily: 'Teko, sans-serif', fontSize: '18px', fontWeight: 500, letterSpacing: '0.02em' }}
            >
              More
            </span>
            <ChevronDown
              className="w-4 h-4 text-white/60 transition-transform duration-200"
              style={{ transform: moreExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              strokeWidth={2.5}
            />
          </button>

          <AnimatePresence initial={false}>
            {moreExpanded && (
              <motion.div
                key="more-options"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/shop" className="group block w-full active:scale-[0.99] transition-transform">
                    <div
                      className="relative flex items-center justify-center gap-2.5 py-3 overflow-hidden"
                      style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                      <ShoppingBag className="relative w-3.5 h-3.5 text-white/60 shrink-0" strokeWidth={2.5} />
                      <span
                        className="relative text-white uppercase leading-none"
                        style={{ fontFamily: 'Teko, sans-serif', fontSize: '20px', fontWeight: 500, letterSpacing: '0.01em' }}
                      >
                        SHOP
                      </span>
                    </div>
                  </Link>

                  <Link to="/rankings" className="group block w-full active:scale-[0.99] transition-transform">
                    <div
                      className="relative flex items-center justify-center gap-2.5 py-3 overflow-hidden"
                      style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                      <Trophy className="relative w-3.5 h-3.5 text-white/60 shrink-0" strokeWidth={2.5} />
                      <span
                        className="relative text-white uppercase leading-none"
                        style={{ fontFamily: 'Teko, sans-serif', fontSize: '20px', fontWeight: 500, letterSpacing: '0.01em' }}
                      >
                        RANKINGS
                      </span>
                    </div>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══ FEATURED EVENT AD — slim cinematic strip under quick action ═══ */}
      {liveEvents.length > 0 && (
        <Link
          to={`/event/${getEventSlug(liveEvents[0])}`}
          className="relative block mt-3 mx-auto w-[calc(100%-4rem)] max-w-[360px] sm:max-w-[400px] active:scale-[0.99] transition-transform"
        >
          <div
            className="relative h-[72px] w-full overflow-hidden bg-black/90 flex items-center"
            style={{
              boxShadow:
                'inset 0 0 0 1px hsl(0 0% 100% / 0.08), 0 10px 24px hsl(0 0% 0% / 0.45)',
            }}
          >
            {/* Poster sliver on the left */}
            <div className="relative h-full w-[74px] shrink-0 overflow-hidden">
              {liveEvents[0].poster_url ? (
                <img
                  src={liveEvents[0].poster_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: '50% 32%' }}
                  loading="eager"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/40 to-black" />
              )}
              <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent to-black" />
            </div>

            {/* Center text */}
            <div className="flex-1 min-w-0 px-2.5">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                <span className="font-display text-[12px] uppercase tracking-normal text-red-400 leading-none shrink-0">Live Comp</span>
                {liveEvents[0].prize_pool && (
                  <span className="font-display text-[12px] uppercase tracking-normal text-emerald-400 leading-none px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/40 truncate">
                    {liveEvents[0].prize_pool} Prize
                  </span>
                )}
              </div>
              <h3 className="font-display text-[18px] leading-[0.95] text-white tracking-normal line-clamp-2 mt-1">
                {liveEvents[0].title.toUpperCase()}
              </h3>
            </div>

            {/* Enter pill */}
            <div className="flex items-center gap-1 mr-2 px-2.5 h-[32px] bg-emerald-400 text-black font-display text-[15px] uppercase tracking-normal leading-none shadow-[0_0_18px_rgba(16,185,129,0.45)] shrink-0">
              <span className="pt-[2px]">Enter</span>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </div>
          </div>
        </Link>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          🎵 FEATURED DROPS — All drops carousel
      ═══════════════════════════════════════════════════════════════════ */}
      {false && totalArtistFeatured > 0 && (
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

          {/* Section Header — matches FEATURED below for visual consistency */}
          <div className="relative flex items-center justify-between px-4 pt-2.5 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gold rounded-full" />
              <h2 className="font-display text-lg text-foreground">FEATURED DROPS</h2>
              <span className="text-[9px] text-muted-foreground">({totalArtistFeatured})</span>
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
              <Link key={`mission-${mission.id}`} to={`/commissions/${mission.id}`} className="shrink-0 w-[160px] h-[220px] snap-start">
                <div className="relative w-full h-full overflow-hidden group cursor-pointer rounded-2xl border border-emerald-500/30 bg-black flex flex-col">
                  <div className="relative w-full flex-1 min-h-0 overflow-hidden">
                  {mission.poster_url ? (
                    <img src={mission.poster_url} alt={mission.song_name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
                  {/* MISSION badge */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-emerald-600/90 backdrop-blur-sm px-2 py-0.5 rounded-sm">
                    <DollarSign className="w-2.5 h-2.5 text-white" />
                    <span className="text-[7px] font-black text-white uppercase tracking-normal">Mission</span>
                  </div>
                  {mission.max_pay > 0 && (
                    <div className="absolute top-2 right-2 z-10 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-sm">
                      <span className="font-display text-sm text-emerald-400 leading-none">${mission.max_pay}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                    {mission.artist_name && (
                      <p className="text-[7px] font-black text-emerald-400/70 uppercase tracking-normal mb-0.5">{mission.artist_name}</p>
                    )}
                    <h4 className="font-display text-sm text-white leading-tight truncate uppercase font-extrabold drop-shadow-lg">{mission.song_name}</h4>
                  </div>
                  </div>
                  {/* CTA footer — matches FeaturedDropCard */}
                  <div className="px-3 py-2 border-t border-white/[0.04] mt-auto">
                    <button className="w-full text-center py-1.5 rounded-lg bg-emerald-500 text-black text-[11px] font-black uppercase tracking-normal hover:bg-emerald-400 transition-colors" style={{ fontFamily: 'Teko, sans-serif' }}>
                      ENTER
                    </button>
                  </div>
                </div>
              </Link>
            ))}
            {artistDrops.map(drop => (
              <div key={drop.id} className="shrink-0 w-[160px] h-[220px] snap-start">
                <FeaturedDropCard drop={drop} />
              </div>
            ))}
          </FeaturedCarousel>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          COMP LOBBIES — open competition rooms
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mt-8">
        <ArenaCompetitionsSection onCreateClick={() => navigate(profile ? '/competition/create' : '/start')} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED EDIT BATTLES — admin-curated decided matchups
      ═══════════════════════════════════════════════════════════════════ */}
      <FeaturedEditBattlesSection />

      {/* ═══════════════════════════════════════════════════════════════════
          VERSION + COMMUNITY — footer strip below featured battles
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="px-4 mt-8 mb-6 flex flex-col items-center gap-3"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Version 1.13
        </span>
        <a
          href="https://discord.gg/R4bPuSvN57"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] transition-colors active:scale-[0.98] shadow-[0_0_18px_rgba(88,101,242,0.35)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <span className="font-display text-[16px] text-white uppercase tracking-normal leading-none pt-[2px]">
            Join Our Community
          </span>
        </a>
      </motion.div>

      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
      <WalletDrawer open={walletOpen} onClose={() => setWalletOpen(false)} />
      <RingsModal
        open={ringsOpen}
        onClose={() => setRingsOpen(false)}
        amount={(profile as any)?.rings || 0}
      />
      {instantMatch && (
        <InstantMatchModal
          open={!!instantMatch}
          you={instantMatch.you}
          opponent={instantMatch.opponent}
          onCancel={() => setInstantMatch(null)}
          onConfirm={confirmInstantMatch}
        />
      )}
      {battleSelect && (
        <BattleSelectFlow
          open={!!battleSelect}
          fightId={battleSelect.fightId}
          you={battleSelect.you}
          opponent={battleSelect.opponent}
          youSide={battleSelect.youSide}
          onComplete={() => {
            const id = battleSelect.fightId;
            setBattleSelect(null);
            navigate(`/fight/${id}`);
          }}
          onCancel={() => {
            const id = battleSelect.fightId;
            setBattleSelect(null);
            navigate(`/fight/${id}`);
          }}
        />
      )}
    </div>
  );
}
