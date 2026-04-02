import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Crosshair, DollarSign, Trophy, Send, ExternalLink,
  Loader2, Star, Clock, Eye, Zap, Target, TrendingUp, ChevronRight,
  Music, Shield, Flame, Swords, ArrowRight, Sparkles, ThumbsUp, ThumbsDown,
  Film, ChevronLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useEditorEarnings, RATING_COLORS, type SubmissionRating } from '@/hooks/useCommissions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface MissionData {
  id: string;
  song_name: string;
  title: string;
  artist_id: string;
  artist_name: string;
  artist_avatar: string | null;
  poster_url: string | null;
  mission_custom_payouts: Record<string, number> | null;
  mission_views_milestone: number;
  mission_views_bonus_cents: number;
  instant_payout: boolean;
  inspo_url: string | null;
  inspo_thumbnail_url: string | null;
  theme_description: string | null;
  submission_count: number;
}

interface MissionSubmission {
  id: string;
  user_id: string | null;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string | null;
  status: string | null;
  rating: string | null;
  earned_cents: number;
  feedback: string | null;
  created_at: string | null;
  upvotes?: number;
  downvotes?: number;
  thumbnail_url?: string | null;
}

interface OfficialEvent {
  id: string;
  title: string;
  prize_usd: number;
  poster_url: string | null;
}

const teko = { fontFamily: 'Teko, sans-serif' };
const RATINGS: SubmissionRating[] = ['S', 'A', 'B', 'C', 'D', 'F'];
const RANK_LABELS: Record<string, string> = { S: 'ELITE', A: 'PRO', B: 'SOLID', C: 'MID', D: 'WEAK', F: 'FAIL' };
const PASSING_RATINGS = ['S', 'A', 'B', 'C', 'D'];

export default function MissionLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;
  const { availableBalance } = useEditorEarnings();

  const [mission, setMission] = useState<MissionData | null>(null);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [ratedSubmissions, setRatedSubmissions] = useState<MissionSubmission[]>([]);
  const [mySubmission, setMySubmission] = useState<MissionSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<MissionSubmission | null>(null);
  const [officialEvent, setOfficialEvent] = useState<OfficialEvent | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});

  const carouselRef = useRef<HTMLDivElement>(null);

  const fetchMission = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('featured_drops')
      .select('id, title, song_name, poster_url, mission_custom_payouts, mission_views_milestone, mission_views_bonus_cents, instant_payout, inspo_url, inspo_thumbnail_url, theme_description, submission_count, artist_id, featured_artists(name, avatar_url)')
      .eq('id', id)
      .single();

    if (data) {
      const d = data as any;
      setMission({
        id: d.id,
        song_name: d.song_name,
        title: d.title,
        artist_id: d.artist_id,
        artist_name: d.featured_artists?.name || 'Unknown',
        artist_avatar: d.featured_artists?.avatar_url || null,
        poster_url: d.poster_url,
        mission_custom_payouts: d.mission_custom_payouts,
        mission_views_milestone: d.mission_views_milestone || 0,
        mission_views_bonus_cents: d.mission_views_bonus_cents || 0,
        instant_payout: d.instant_payout ?? false,
        inspo_url: d.inspo_url || null,
        inspo_thumbnail_url: d.inspo_thumbnail_url || null,
        theme_description: d.theme_description || null,
        submission_count: d.submission_count || 0,
      });

      // Find official event for the same artist (prize_usd > 0, live status)
      // Don't exclude current drop — it might BE the event
      const { data: eventData } = await supabase
        .from('featured_drops')
        .select('id, title, prize_usd, poster_url')
        .eq('artist_id', d.artist_id)
        .gt('prize_usd', 0)
        .in('status', ['live', 'judging'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (eventData && eventData.length > 0) {
        setOfficialEvent(eventData[0] as any);
      }
    }
    setLoading(false);
  }, [id]);

  const fetchSubmissions = useCallback(async () => {
    if (!id) return;
    const query = supabase
      .from('featured_submissions')
      .select('id, user_id, username, avatar_url, submission_url, platform, status, rating, earned_cents, feedback, created_at, upvotes, downvotes, thumbnail_url')
      .eq('drop_id', id)
      .order('created_at', { ascending: false });

    if (!isStaff) {
      if (user) query.eq('user_id', user.id);
      else return;
    }

    const { data } = await query.limit(50);
    if (data) {
      setSubmissions(data as any as MissionSubmission[]);
      if (user) {
        setMySubmission((data as any[]).find(s => s.user_id === user.id) || null);
      }
    }
  }, [id, user, isStaff]);

  // Fetch ALL rated submissions for social proof carousel (public)
  const fetchRatedSubmissions = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('featured_submissions')
      .select('id, user_id, username, avatar_url, submission_url, platform, rating, earned_cents, feedback, created_at, upvotes, downvotes, thumbnail_url')
      .eq('drop_id', id)
      .not('rating', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setRatedSubmissions(data as any as MissionSubmission[]);
  }, [id]);

  // Fetch user's votes
  const fetchMyVotes = useCallback(async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from('featured_submission_votes')
      .select('submission_id, vote_type')
      .eq('user_id', user.id);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(v => { map[v.submission_id] = v.vote_type; });
      setMyVotes(map);
    }
  }, [user, id]);

  useEffect(() => { fetchMission(); }, [fetchMission]);
  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);
  useEffect(() => { fetchRatedSubmissions(); }, [fetchRatedSubmissions]);
  useEffect(() => { fetchMyVotes(); }, [fetchMyVotes]);

  const detectPlatform = (u: string) => {
    if (u.includes('tiktok.com') || u.includes('vm.tiktok.com')) return 'tiktok';
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('instagram.com')) return 'instagram';
    return 'other';
  };

  const handleSubmit = async () => {
    if (!url.trim() || !user || !mission) return;
    setSubmitting(true);

    const { data: profile } = await supabase
      .from('profiles').select('username, avatar_url').eq('id', user.id).single();

    const { error } = await supabase
      .from('featured_submissions')
      .insert({
        drop_id: mission.id,
        user_id: user.id,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url,
        submission_url: url.trim(),
        platform: detectPlatform(url),
        status: 'pending',
      } as any);

    if (error) toast.error(error.message);
    else { toast.success('Edit submitted!'); setUrl(''); fetchSubmissions(); fetchRatedSubmissions(); }
    setSubmitting(false);
  };

  const handleVote = async (submissionId: string, voteType: 'up' | 'down') => {
    if (!user) { toast.error('Sign in to vote'); return; }
    const existing = myVotes[submissionId];

    if (existing === voteType) {
      // Remove vote
      await supabase.from('featured_submission_votes').delete()
        .eq('submission_id', submissionId).eq('user_id', user.id);
      setMyVotes(prev => { const n = { ...prev }; delete n[submissionId]; return n; });
    } else {
      // Upsert vote
      if (existing) {
        await supabase.from('featured_submission_votes')
          .update({ vote_type: voteType } as any)
          .eq('submission_id', submissionId).eq('user_id', user.id);
      } else {
        await supabase.from('featured_submission_votes')
          .insert({ submission_id: submissionId, user_id: user.id, vote_type: voteType } as any);
      }
      setMyVotes(prev => ({ ...prev, [submissionId]: voteType }));
    }
    // Refetch to get updated counts
    fetchRatedSubmissions();
  };

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  const payouts = mission?.mission_custom_payouts || {};
  const maxPayout = Math.max(...Object.values(payouts).map(v => Number(v) || 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Mission not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ═══ HERO BANNER ═══ */}
      <div className="relative h-[240px] overflow-hidden">
        {mission.poster_url ? (
          <img src={mission.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-surface-1" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 3px)' }} />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />

        <div className="absolute top-4 left-4 z-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-foreground/60 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back</span>
          </button>
        </div>

        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {mission.instant_payout && (
            <div className="bg-red-600 px-2.5 py-1">
              <span className="text-[8px] font-black text-white uppercase tracking-wider">24H Pay</span>
            </div>
          )}
          <div className="bg-emerald-600 px-2.5 py-1 flex items-center gap-1 shadow-lg shadow-emerald-600/30">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[8px] font-black text-white uppercase tracking-wider">Live</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-1">{mission.artist_name}</p>
          <h1 style={teko} className="text-3xl text-foreground leading-none tracking-wide">{mission.song_name}</h1>
          <p className="text-[10px] text-muted-foreground mt-1">{mission.title}</p>
        </div>
      </div>

      {/* ═══ ENTER LOBBY — Only shows when a real official event exists ═══ */}
      {officialEvent && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 -mt-2 relative z-10 mb-3"
        >
          <Link to={`/drop/${officialEvent.id}`}>
            <div 
              className="relative overflow-hidden group"
              style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.15), 0 0 60px rgba(16, 185, 129, 0.08)' }}
            >
              {officialEvent.poster_url ? (
                <div 
                  className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-700"
                  style={{ backgroundImage: `url(${officialEvent.poster_url})` }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-background to-emerald-950/50" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/90" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-emerald-950/30" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 3px)' }} />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
              
              <div className="relative px-4 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Swords className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.15em]">Official Event</span>
                  </div>
                  <h3 style={teko} className="text-[17px] text-white leading-tight truncate tracking-wide">
                    {officialEvent.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span className="text-[12px] font-black text-emerald-400">${officialEvent.prize_usd} Prize</span>
                  </div>
                </div>
                
                <div className="shrink-0">
                  <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 px-5 py-2.5 group-hover:from-emerald-500 group-hover:via-emerald-400 group-hover:to-emerald-500 transition-all shadow-lg shadow-emerald-900/40">
                    <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none" />
                    <div className="flex items-center gap-2 relative z-10">
                      <Target className="w-4 h-4 text-white drop-shadow" />
                      <span style={teko} className="text-[15px] text-white uppercase tracking-wider drop-shadow">
                        Enter Lobby
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Auto-queue notice — always visible */}
      <div className="px-4 mb-2">
        <div className="bg-emerald-950/40 border border-emerald-500/15 px-3 py-2 flex items-center gap-2">
          <Zap className="w-3 h-3 text-emerald-400/60 shrink-0" />
          <p className="text-[9px] text-emerald-400/70">
            <span className="font-bold text-emerald-400/90">Submissions auto-enter lobby queue</span> — rated C+ or higher joins the competition
          </p>
        </div>
      </div>

      {/* ═══ SUBMISSION AREA ═══ */}
      <div className="px-4 mt-3 space-y-3">
        {/* Show previous submission result if exists */}
        {mySubmission?.rating && (
          <div className="flex items-center gap-3 py-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-base font-black ${RATING_COLORS[mySubmission.rating as SubmissionRating]}`}>
              {mySubmission.rating}
              {mySubmission.earned_cents > 0 && (
                <span className="text-emerald-400 text-xs">+${(mySubmission.earned_cents / 100).toFixed(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{RANK_LABELS[mySubmission.rating] || ''} — Last submission</span>
              {mySubmission.feedback && (
                <p className="text-[9px] text-foreground/50 italic mt-0.5 truncate">"{mySubmission.feedback}"</p>
              )}
            </div>
            {officialEvent && PASSING_RATINGS.includes(mySubmission.rating) && (
              <Link to={`/drop/${officialEvent.id}`}>
                <div className="text-[8px] font-black text-emerald-400/60 flex items-center gap-0.5">
                  <Swords className="w-3 h-3" /> Event
                </div>
              </Link>
            )}
          </div>
        )}

        {mySubmission && !mySubmission.rating && (
          <div className="flex items-center gap-2 py-2">
            <Clock className="w-4 h-4 text-gold animate-pulse" />
            <span className="text-xs font-bold text-gold">Awaiting Rating</span>
            <span className="text-[9px] text-muted-foreground ml-auto">You can submit another edit below</span>
          </div>
        )}

        {/* Submit form — always visible for logged-in users */}
        {!user ? (
          <Link to="/login">
            <div className="bg-destructive/10 border border-destructive/20 p-4 text-center rounded-sm">
              <Crosshair className="w-5 h-5 text-destructive mx-auto mb-1.5" />
              <p style={teko} className="text-xl text-foreground">SIGN IN TO COMPETE</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Create a free account to start earning</p>
            </div>
          </Link>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Crosshair className="w-3.5 h-3.5 text-status-live" />
              <span className="text-[10px] font-black text-status-live uppercase tracking-[0.2em]">
                {mySubmission ? 'Submit Another Edit' : 'Submit Your Edit'}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="Paste your TikTok, YouTube, or IG link..."
                className="h-10 bg-surface-1 border-border/40 font-mono text-sm flex-1"
              />
              <Button
                onClick={handleSubmit}
                disabled={submitting || !url.trim()}
                className="h-10 px-5 bg-status-live hover:bg-status-live/90 text-white uppercase tracking-wider shrink-0"
                style={teko}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <span className="text-base flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Go</span>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Link to={`/studio?mission=${mission.id}`} className="text-[9px] font-black text-destructive/60 hover:text-destructive uppercase tracking-wider flex items-center gap-1">
                <Film className="w-3 h-3" /> Open Studio
              </Link>
              {officialEvent && (
                <p className="text-[8px] text-status-live/50">
                  ✓ Auto-enters <span className="font-bold text-status-live/70">${officialEvent.prize_usd} event</span> after rating
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ DIVIDER ═══ */}
      <div className="mx-4 mt-4 mb-3 h-px bg-border/30" />

      {/* ═══ SOCIAL PROOF — RATED EDITS CAROUSEL ═══ */}
      <div>
        <div className="px-4 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-gold" />
            <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Rated Edits</span>
          </div>
          {ratedSubmissions.length > 0 && (
            <span className="text-[9px] text-muted-foreground">{ratedSubmissions.length} rated</span>
          )}
        </div>

        {ratedSubmissions.length === 0 ? (
          <div className="px-4">
            <div className="border border-dashed border-border/30 py-6 flex flex-col items-center gap-1.5 rounded-sm">
              <Star className="w-4 h-4 text-muted-foreground/20" />
              <p className="text-[10px] text-muted-foreground/40 font-bold">No rated edits yet — be the first</p>
            </div>
          </div>
        ) : (
          <div className="relative group/carousel">
            {ratedSubmissions.length > 2 && (
              <>
                <button onClick={() => scrollCarousel('left')}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                <button onClick={() => scrollCarousel('right')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </button>
              </>
            )}
            <div ref={carouselRef} className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2">
              {ratedSubmissions.map(sub => (
                <RatedEditCard key={sub.id} sub={sub} myVote={myVotes[sub.id]} onVote={handleVote} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ DIVIDER ═══ */}
      <div className="mx-4 mt-3 mb-3 h-px bg-border/30" />

      {/* ═══ EARNINGS POTENTIAL ═══ */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-status-live" />
            <span className="text-[10px] font-black text-status-live uppercase tracking-[0.2em]">Earnings</span>
          </div>
          {maxPayout > 0 && (
            <span style={teko} className="text-base text-status-live">UP TO ${(maxPayout / 100).toFixed(0)}</span>
          )}
        </div>

        <div className="grid grid-cols-6 gap-px bg-border/20 rounded-sm overflow-hidden">
          {RATINGS.map(r => {
            const cents = payouts[r] || 0;
            const hasPay = cents > 0;
            return (
              <div key={r} className={`py-3 flex flex-col items-center gap-1 ${hasPay ? 'bg-surface-1' : 'bg-surface-0'}`}>
                <span className={`text-xs font-black ${
                  r === 'S' ? 'text-gold' :
                  r === 'A' ? 'text-status-live' :
                  r === 'B' ? 'text-blue-400' :
                  'text-muted-foreground'
                }`}>{r}</span>
                <span className={`text-[10px] font-bold ${hasPay ? 'text-status-live' : 'text-muted-foreground/40'}`}>
                  {hasPay ? `$${(cents / 100).toFixed(2)}` : 'IDX'}
                </span>
                <span className="text-[7px] text-muted-foreground/30 font-bold uppercase">{RANK_LABELS[r]}</span>
              </div>
            );
          })}
        </div>

        {mission.mission_views_milestone > 0 && mission.mission_views_bonus_cents > 0 && (
          <div className="mt-1.5 flex items-center gap-2 py-1.5">
            <Eye className="w-3 h-3 text-gold" />
            <span className="text-[9px] font-black text-gold uppercase tracking-wider">
              {(mission.mission_views_milestone / 1000).toFixed(0)}K VIEWS = +${(mission.mission_views_bonus_cents / 100).toFixed(0)} BONUS
            </span>
            <span className="text-[7px] text-gold/40 ml-auto">C+ rank only</span>
          </div>
        )}
      </div>

      {/* ═══ YOUR BALANCE — inline row ═══ */}
      {user && (
        <div className="px-4 mt-3 flex items-center justify-between py-2 border-t border-b border-border/20">
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-status-live" />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Balance</span>
            <span style={teko} className="text-base text-status-live leading-none">${(availableBalance / 100).toFixed(2)}</span>
          </div>
          <Link to="/payouts" className="text-[8px] font-black text-status-live/50 hover:text-status-live uppercase tracking-wider flex items-center gap-1">
            Withdraw <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ═══ HOW IT WORKS ═══ */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[10px] font-black text-destructive/60 uppercase tracking-[0.2em]">⚔️ How It Works</span>
        </div>
        <div className="space-y-2.5">
          {[
            { step: '01', icon: Music, label: 'Listen to the track', desc: 'Study the vibe, tempo & mood' },
            { step: '02', icon: Target, label: 'Create your edit', desc: 'Use any NLE — make it slap' },
            { step: '03', icon: Send, label: 'Submit your link', desc: 'TikTok, YouTube, or Instagram' },
            { step: '04', icon: Star, label: 'Get rated & paid', desc: 'QOI score + class rank + payout' },
            ...(officialEvent ? [{
              step: '05', icon: Swords, label: 'Auto-enter official event', desc: `Rated C+ or better → enters $${officialEvent.prize_usd} event`
            }] : []),
          ].map(({ step, icon: Icon, label, desc }) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-7 h-7 ${step === '05' ? 'bg-status-live/15 border-status-live/20' : 'bg-destructive/8 border-destructive/15'} border rounded-sm flex items-center justify-center shrink-0`}>
                <span className={`text-[9px] font-black ${step === '05' ? 'text-status-live' : 'text-destructive/70'}`}>{step}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3 h-3 ${step === '05' ? 'text-status-live/60' : 'text-foreground/30'}`} />
                  <span className={`text-xs font-bold ${step === '05' ? 'text-status-live' : 'text-foreground/80'}`}>{label}</span>
                </div>
                <p className="text-[9px] text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ THEME & INSPO ═══ */}
      {(mission.theme_description || mission.inspo_thumbnail_url || mission.inspo_url) && (
        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black text-purple-400/70 uppercase tracking-[0.2em]">🎨 Theme & Inspiration</span>
          </div>
          <div className="space-y-2.5">
            {mission.theme_description && (
              <p className="text-xs text-foreground/70 leading-relaxed">{mission.theme_description}</p>
            )}
            {mission.inspo_thumbnail_url && (
              <div className="relative overflow-hidden rounded-sm border border-border/30">
                <img src={mission.inspo_thumbnail_url} alt="Inspo" className="w-full h-44 object-cover" />
                {mission.inspo_url && (
                  <a href={mission.inspo_url} target="_blank" rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="bg-foreground/10 backdrop-blur-md px-4 py-2 border border-foreground/20 text-xs font-black text-foreground flex items-center gap-2 uppercase tracking-wider">
                      <ExternalLink className="w-3.5 h-3.5" /> Watch Inspo
                    </span>
                  </a>
                )}
              </div>
            )}
            {mission.inspo_url && !mission.inspo_thumbnail_url && (
              <a href={mission.inspo_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 font-bold">
                <ExternalLink className="w-3.5 h-3.5" /> Watch Inspo Video
              </a>
            )}
          </div>
        </div>
      )}

      {/* ═══ SUBMISSIONS (Staff) ═══ */}
      {isStaff && submissions.length > 0 && (
        <div className="px-4 mt-4">
          <div className="mx-0 mb-3 h-px bg-border/30" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">Submissions</span>
            <span className="text-[9px] text-muted-foreground">{submissions.length} total</span>
          </div>
          <div className="space-y-1.5">
            {submissions.map(sub => (
              <div key={sub.id} className="flex items-center justify-between py-2 border-b border-border/15 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-surface-2 rounded-sm flex items-center justify-center overflow-hidden shrink-0">
                    {sub.avatar_url ? <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" /> :
                      <span className="text-[10px] font-bold text-muted-foreground">{sub.username?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground truncate block">@{sub.username}</span>
                    <button onClick={() => window.open(sub.submission_url, '_blank')}
                      className="text-[9px] text-status-live hover:underline flex items-center gap-0.5">
                      <ExternalLink className="w-2.5 h-2.5" /> Watch
                    </button>
                  </div>
                </div>
                {sub.rating ? (
                  <div className={`px-2 py-1 border text-xs font-black ${RATING_COLORS[sub.rating as SubmissionRating]}`}>
                    {sub.rating} {sub.earned_cents > 0 && <span className="text-status-live text-[9px]">+${sub.earned_cents / 100}</span>}
                  </div>
                ) : (
                  <button onClick={() => setRatingTarget(sub)}
                    className="text-[9px] font-black text-gold bg-gold/10 border border-gold/20 px-2.5 py-1.5 hover:bg-gold/20 transition-colors uppercase tracking-wider">
                    <Star className="w-3 h-3 inline mr-1" />Rate
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ RATING MODAL ═══ */}
      <AnimatePresence>
        {ratingTarget && (
          <RatingModal
            submission={ratingTarget}
            payoutMap={mission.mission_custom_payouts}
            officialEvent={officialEvent}
            missionArtistId={mission.artist_id}
            onClose={() => setRatingTarget(null)}
            onRated={() => { fetchSubmissions(); fetchRatedSubmissions(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══ RATED EDIT CARD ═══ */
function RatedEditCard({ sub, myVote, onVote }: { sub: MissionSubmission; myVote?: string; onVote: (id: string, type: 'up' | 'down') => void }) {
  const ratingColor = sub.rating === 'S' ? 'text-amber-400 border-amber-500/50 bg-amber-500/10' :
    sub.rating === 'A' ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' :
    sub.rating === 'B' ? 'text-blue-400 border-blue-500/50 bg-blue-500/10' :
    sub.rating === 'C' ? 'text-foreground/60 border-border bg-surface-1' :
    sub.rating === 'D' ? 'text-orange-400 border-orange-500/50 bg-orange-500/10' :
    'text-red-400 border-red-500/50 bg-red-500/10';

  return (
    <div className="shrink-0 w-[200px] bg-surface-0 border border-border/40 overflow-hidden hover:border-border/60 transition-colors">
      {/* Top — rating badge + username */}
      <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border/20">
        <div className={`w-7 h-7 border flex items-center justify-center shrink-0 ${ratingColor}`}>
          <span className="text-sm font-black">{sub.rating}</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold text-foreground truncate block">@{sub.username}</span>
          {sub.earned_cents > 0 && (
            <span className="text-[9px] font-black text-emerald-400">+${(sub.earned_cents / 100).toFixed(0)} earned</span>
          )}
        </div>
      </div>

      {/* Feedback preview */}
      {sub.feedback && (
        <div className="px-2.5 py-2 border-b border-border/10">
          <p className="text-[9px] text-muted-foreground italic leading-relaxed line-clamp-2">"{sub.feedback}"</p>
        </div>
      )}

      {/* Actions — watch + vote */}
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <button onClick={() => window.open(sub.submission_url, '_blank')}
          className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Watch
        </button>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onVote(sub.id, 'up')}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold transition-colors ${
              myVote === 'up' ? 'text-emerald-400 bg-emerald-500/15' : 'text-muted-foreground/40 hover:text-emerald-400'
            }`}>
            <ThumbsUp className="w-3 h-3" />
            <span>{sub.upvotes || 0}</span>
          </button>
          <button onClick={() => onVote(sub.id, 'down')}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold transition-colors ${
              myVote === 'down' ? 'text-red-400 bg-red-500/15' : 'text-muted-foreground/40 hover:text-red-400'
            }`}>
            <ThumbsDown className="w-3 h-3" />
            <span>{sub.downvotes || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ RATING MODAL ═══ */
function RatingModal({ submission, payoutMap, officialEvent, missionArtistId, onClose, onRated }: {
  submission: MissionSubmission;
  payoutMap: Record<string, number> | null;
  officialEvent: OfficialEvent | null;
  missionArtistId: string;
  onClose: () => void;
  onRated: () => void;
}) {
  const [selectedRating, setSelectedRating] = useState<SubmissionRating | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getPayout = (r: SubmissionRating) => (payoutMap?.[r] ?? 0);

  const handleRate = async () => {
    if (!selectedRating) { toast.error('Pick a rating'); return; }
    if (!feedback.trim()) { toast.error('Feedback is mandatory'); return; }
    setSubmitting(true);

    const earnedCents = getPayout(selectedRating);
    const qoiScore = selectedRating === 'S' ? 90 : selectedRating === 'A' ? 75 : selectedRating === 'B' ? 60 : selectedRating === 'C' ? 45 : selectedRating === 'D' ? 30 : 15;

    const { error } = await supabase
      .from('featured_submissions')
      .update({
        rating: selectedRating,
        earned_cents: earnedCents,
        status: selectedRating === 'F' ? 'declined' : 'scored',
        feedback: feedback.trim(),
        qoi_score: qoiScore,
      } as any)
      .eq('id', submission.id);

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // ═══ AUTO-ENTRY: If rated C+ or better and official event exists, queue into it ═══
    const isPassing = PASSING_RATINGS.includes(selectedRating);
    if (isPassing && officialEvent && submission.user_id) {
      try {
        const { data: existing } = await supabase
          .from('featured_drop_queue')
          .select('id')
          .eq('drop_id', officialEvent.id)
          .eq('user_id', submission.user_id)
          .limit(1);

        if (!existing || existing.length === 0) {
          const { data: existingSub } = await supabase
            .from('featured_submissions')
            .select('id')
            .eq('drop_id', officialEvent.id)
            .eq('user_id', submission.user_id)
            .limit(1);

          if (!existingSub || existingSub.length === 0) {
            await supabase
              .from('featured_drop_queue')
              .insert({
                drop_id: officialEvent.id,
                user_id: submission.user_id,
                username: submission.username,
                avatar_url: submission.avatar_url,
                submission_url: submission.submission_url,
                platform: submission.platform || 'tiktok',
                status: 'waiting',
              } as any);
          }
        }
      } catch (e) {
        console.error('Auto-entry to official event failed:', e);
      }

      toast.success(
        `Rated ${selectedRating}${earnedCents > 0 ? ` — $${(earnedCents / 100).toFixed(0)} awarded` : ''} · Auto-entered $${officialEvent.prize_usd} event! 🔥`,
        { duration: 5000 }
      );
    } else {
      toast.success(`Rated ${selectedRating}${earnedCents > 0 ? ` — $${(earnedCents / 100).toFixed(0)} awarded` : ''}`);
    }

    onRated();
    onClose();
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-surface-0 border-2 border-amber-500/30 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span style={{ fontFamily: 'Teko, sans-serif' }} className="text-lg text-foreground">RATE @{submission.username}</span>
          </div>
          <button onClick={() => window.open(submission.submission_url, '_blank')}
            className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Watch
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-6 gap-1.5">
            {RATINGS.map(r => {
              const payout = getPayout(r);
              const isSelected = selectedRating === r;
              return (
                <button key={r} onClick={() => setSelectedRating(r)}
                  className={`flex flex-col items-center py-3 border-2 transition-all ${
                    isSelected ? RATING_COLORS[r] + ' ring-1 ring-offset-1 ring-offset-background' : 'border-border/30 bg-surface-1 hover:border-border/60'
                  }`}>
                  <span className="text-xl font-black">{r}</span>
                  <span className={`text-[8px] font-bold mt-0.5 ${payout > 0 ? 'text-emerald-400' : 'text-muted-foreground/40'}`}>
                    {payout > 0 ? `$${payout / 100}` : 'IDX'}
                  </span>
                </button>
              );
            })}
          </div>

          {officialEvent && selectedRating && PASSING_RATINGS.includes(selectedRating) && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 flex items-center gap-2">
              <Swords className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[9px] text-emerald-400 font-bold">
                This will auto-enter their edit into the <span className="font-black">${officialEvent.prize_usd} Official Event</span>
              </span>
            </div>
          )}

          {selectedRating === 'F' && officialEvent && (
            <div className="bg-red-950/30 border border-red-500/20 px-3 py-2 flex items-center gap-2">
              <span className="text-[9px] text-red-400/60">F-rated edits do not auto-enter the official event</span>
            </div>
          )}

          <div>
            <Label className="text-[10px] font-black text-red-400 uppercase tracking-wider">Feedback (Required)</Label>
            <Textarea value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="What did they do well? What needs work?"
              className="min-h-[80px] resize-none mt-1 bg-surface-1" />
          </div>

          <Button onClick={handleRate} disabled={submitting || !selectedRating || !feedback.trim()}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-background font-display text-lg uppercase tracking-wider">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : `Confirm ${selectedRating || '...'}`}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
