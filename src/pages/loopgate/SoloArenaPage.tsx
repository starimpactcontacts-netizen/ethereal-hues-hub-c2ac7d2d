import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Music, Send, ExternalLink, Loader2, Star, 
  ArrowLeft, Wallet, CheckCircle2, Clock, Trophy, ChevronRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useEditorEarnings, RATING_COLORS, type SubmissionRating } from '@/hooks/useCommissions';
import { InfinityLoop } from '@/components/loopgate/InfinityLoop';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface FeaturedSong {
  id: string;
  title: string;
  song_name: string;
  artist_name: string;
  artist_avatar: string | null;
  poster_url: string | null;
  status: string | null;
  submission_count: number | null;
  mission_live: boolean;
  mission_custom_payouts: Record<string, number> | null;
  instant_payout: boolean;
  inspo_url: string | null;
  inspo_thumbnail_url: string | null;
  theme_description: string | null;
}

interface ArenaSubmission {
  id: string;
  drop_id: string;
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
}

const RATINGS: SubmissionRating[] = ['S', 'A', 'B', 'C', 'D', 'F'];

function BalanceBanner() {
  const { availableBalance } = useEditorEarnings();
  return (
    <Link to="/payouts">
      <div className="bg-gradient-to-r from-emerald-950/60 to-surface-1 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition-colors">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/60">Your Balance</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="font-display text-3xl text-foreground">{(availableBalance / 100).toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400/70 text-xs font-semibold">
          <Wallet className="w-4 h-4" /> Cash Out <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}

function SongCard({ song, onSelect, isSelected, isStaff, onToggleArena }: { 
  song: FeaturedSong; onSelect: (s: FeaturedSong) => void; isSelected: boolean; isStaff: boolean; onToggleArena?: (song: FeaturedSong) => void 
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(song)}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected 
          ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20' 
          : 'bg-surface-1/60 border-border/30 hover:border-border/60'
      }`}
    >
      <div className="flex items-center gap-3">
        {song.poster_url || song.artist_avatar ? (
          <img src={song.poster_url || song.artist_avatar || ''} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Music className="w-5 h-5 text-amber-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-sm text-foreground truncate">{song.song_name}</h4>
          <p className="text-[10px] text-muted-foreground truncate">{song.artist_name} · {song.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isStaff && onToggleArena && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleArena(song); }}
              className={`text-[9px] font-bold px-2 py-1 rounded border transition-colors ${
                song.mission_live 
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' 
                  : 'text-muted-foreground border-border/30 bg-muted/20'
              }`}
            >
              {song.mission_live ? '✓ MISSION LIVE' : 'OFF'}
            </button>
          )}
          {isSelected && (
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function SubmitPanel({ song, userId, onSubmitted }: { song: FeaturedSong; userId: string; onSubmitted: () => void }) {
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const detectPlatform = (u: string) => {
    if (u.includes('tiktok.com') || u.includes('vm.tiktok.com')) return 'tiktok';
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('instagram.com') || u.includes('instagr.am')) return 'instagram';
    return 'other';
  };

  const handleSubmit = async () => {
    if (!url.trim()) { toast.error('Paste your video link'); return; }
    setSubmitting(true);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    const { error } = await supabase
      .from('featured_submissions')
      .insert({
        drop_id: song.id,
        user_id: userId,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url,
        submission_url: url.trim(),
        platform: detectPlatform(url),
        status: 'pending',
      } as any);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Edit submitted! A judge will rate it soon.');
      setUrl('');
      onSubmitted();
    }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Theme & Inspo Preview */}
      {(song.theme_description || song.inspo_thumbnail_url || song.inspo_url) && (
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            🎨 Theme & Inspo
          </h4>
          {song.theme_description && (
            <p className="text-xs text-foreground/80 leading-relaxed">{song.theme_description}</p>
          )}
          {song.inspo_thumbnail_url && (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img src={song.inspo_thumbnail_url} alt="Inspo preview" className="w-full h-40 object-cover" />
              {song.inspo_url && (
                <a href={song.inspo_url} target="_blank" rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3" /> Watch Inspo
                  </span>
                </a>
              )}
            </div>
          )}
          {song.inspo_url && !song.inspo_thumbnail_url && (
            <a href={song.inspo_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:underline flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Watch Inspo Video
            </a>
          )}
        </div>
      )}

      {/* Instant payout badge */}
      {song.instant_payout && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">⚡ INSTANT</span>
          <span className="text-[10px] text-red-400">Paid within 24-48h</span>
        </div>
      )}

      <div className="bg-surface-1/80 border border-amber-500/15 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-foreground">{song.song_name}</span>
          <span className="text-xs text-muted-foreground">by {song.artist_name}</span>
        </div>
        <Input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste your TikTok, YouTube, or Instagram link..."
          className="h-10 bg-background/50"
        />
        <Button
          onClick={handleSubmit}
          disabled={submitting || !url.trim()}
          className="w-full mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-background font-bold"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Submit Edit</>}
        </Button>
      </div>
    </motion.div>
  );
}

function MySubmissions({ submissions, isStaff, onRate }: { submissions: ArenaSubmission[]; isStaff: boolean; onRate: (sub: ArenaSubmission) => void }) {
  if (submissions.length === 0) return null;

  return (
    <div>
      <h3 className="font-display text-sm text-foreground mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-400" />
        {isStaff ? `All Submissions (${submissions.length})` : 'My Submissions'}
      </h3>
      <div className="space-y-2">
        {submissions.map(sub => (
          <div key={sub.id} className={`bg-surface-1 border rounded-lg p-3 ${
            sub.rating ? 'border-amber-500/20' : 'border-border/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {sub.avatar_url ? (
                    <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold">{sub.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground">@{sub.username}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(sub.submission_url, '_blank', 'noopener,noreferrer')}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      <ExternalLink className="w-2.5 h-2.5" /> Watch
                    </button>
                    {sub.platform && (
                      <span className="text-[9px] text-muted-foreground capitalize">{sub.platform}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {sub.rating ? (
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-black ${RATING_COLORS[sub.rating as SubmissionRating] || ''}`}>
                    <span className="text-base">{sub.rating}</span>
                    {sub.earned_cents > 0 && (
                      <span className="text-emerald-400 font-bold text-[10px]">+${sub.earned_cents / 100}</span>
                    )}
                  </div>
                ) : isStaff ? (
                  <Button size="sm" variant="outline" onClick={() => onRate(sub)}
                    className="text-[10px] h-7 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                    <Star className="w-3 h-3 mr-1" /> Rate
                  </Button>
                ) : (
                  <span className="text-[9px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded font-bold">PENDING</span>
                )}
              </div>
            </div>
            {sub.feedback && (
              <p className="text-[10px] text-muted-foreground mt-2 italic border-t border-border/20 pt-2">"{sub.feedback}"</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingModal({ submission, payoutMap, onClose, onRated }: { submission: ArenaSubmission; payoutMap: Record<string, number> | null; onClose: () => void; onRated: () => void }) {
  const [selectedRating, setSelectedRating] = useState<SubmissionRating | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getPayout = (rating: SubmissionRating) => (payoutMap?.[rating] ?? 0);

  const handleRate = async () => {
    if (!selectedRating) { toast.error('Pick a rating'); return; }
    if (!feedback.trim()) { toast.error('Feedback is mandatory — editors need to know why'); return; }
    setSubmitting(true);

    const earnedCents = getPayout(selectedRating);
    const { error } = await supabase
      .from('featured_submissions')
      .update({
        rating: selectedRating,
        earned_cents: earnedCents,
        status: selectedRating === 'F' ? 'declined' : 'scored',
        feedback: feedback.trim() || null,
        qoi_score: selectedRating === 'S' ? 90 : selectedRating === 'A' ? 75 : selectedRating === 'B' ? 60 : selectedRating === 'C' ? 45 : selectedRating === 'D' ? 30 : 15,
      } as any)
      .eq('id', submission.id);

    if (error) {
      toast.error(error.message);
    } else {
      const payout = getPayout(selectedRating);
      if (payout > 0) {
        toast.success(`Rated ${selectedRating} — $${(payout / 100).toFixed(0)} awarded to @${submission.username}`);
      } else {
        toast.success(`Rated ${selectedRating} — Index points only`);
      }
      onRated();
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-card border border-border rounded-xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        
        <h3 className="font-display text-lg text-foreground flex items-center gap-2">
          <InfinityLoop size={20} /> Rate @{submission.username}
        </h3>

        <button onClick={() => window.open(submission.submission_url, '_blank', 'noopener,noreferrer')}
          className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Watch Edit
        </button>

        <div className="grid grid-cols-6 gap-2">
          {RATINGS.map(r => {
            const payout = getPayout(r);
            const isSelected = selectedRating === r;
            return (
              <motion.button key={r} whileTap={{ scale: 0.92 }} onClick={() => setSelectedRating(r)}
                className={`flex flex-col items-center py-3 rounded-lg border-2 transition-all ${
                  isSelected ? RATING_COLORS[r] + ' ring-2 ring-offset-1 ring-offset-background' : 'border-border/30 bg-surface-1 hover:border-border/60'
                }`}>
                <span className={`text-xl font-black ${isSelected ? '' : 'text-foreground'}`}>{r}</span>
                {payout > 0 ? (
                  <span className="text-[9px] font-bold text-emerald-400 mt-0.5">${payout / 100}</span>
                ) : (
                  <span className="text-[9px] text-muted-foreground mt-0.5">IDX</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {selectedRating && getPayout(selectedRating) > 0 && (
          <p className="text-sm text-emerald-400 font-bold text-center">
            +${(getPayout(selectedRating) / 100).toFixed(0)} will be added to @{submission.username}'s balance
          </p>
        )}

        <div>
          <Label className="text-xs font-bold text-red-400">Feedback (REQUIRED)</Label>
          <p className="text-[9px] text-muted-foreground mb-1">Tell them why — what to improve or what they nailed</p>
          <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Great transitions but pacing needs work..." className="min-h-[80px] resize-none" />
        </div>

        <Button onClick={handleRate} disabled={submitting || !selectedRating || !feedback.trim()}
          className="w-full bg-amber-500 hover:bg-amber-400 text-background font-bold text-base py-5">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
            <Star className="w-4 h-4 mr-2" /> Confirm {selectedRating || '...'} Rating
          </>}
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function SoloArenaPage() {
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;
  const [songs, setSongs] = useState<FeaturedSong[]>([]);
  const [selectedSong, setSelectedSong] = useState<FeaturedSong | null>(null);
  const [submissions, setSubmissions] = useState<ArenaSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingTarget, setRatingTarget] = useState<ArenaSubmission | null>(null);

  const fetchSongs = useCallback(async () => {
    const query = supabase
      .from('featured_drops')
      .select('id, title, song_name, poster_url, status, submission_count, artist_id, mission_live, mission_custom_payouts, instant_payout, inspo_url, inspo_thumbnail_url, theme_description, featured_artists(name, avatar_url)')
      .order('created_at', { ascending: false });

    // Non-staff only see missions explicitly pushed live from admin
    if (!isStaff) {
      query.eq('mission_live', true);
    }

    const { data } = await query;

    if (data) {
      setSongs(data.map((d: any) => ({
        id: d.id,
        title: d.title,
        song_name: d.song_name,
        artist_name: d.featured_artists?.name || 'Unknown',
        artist_avatar: d.featured_artists?.avatar_url,
        poster_url: d.poster_url,
        status: d.status,
        submission_count: d.submission_count,
        mission_live: d.mission_live ?? false,
        mission_custom_payouts: d.mission_custom_payouts as Record<string, number> | null,
        instant_payout: d.instant_payout ?? false,
        inspo_url: d.inspo_url || null,
        inspo_thumbnail_url: d.inspo_thumbnail_url || null,
        theme_description: d.theme_description || null,
      })));
    }
    setLoading(false);
  }, [isStaff]);

  const fetchSubmissions = useCallback(async () => {
    if (!user) return;
    
    const query = supabase
      .from('featured_submissions')
      .select('id, drop_id, user_id, username, avatar_url, submission_url, platform, status, rating, earned_cents, feedback, created_at')
      .order('created_at', { ascending: false });

    // Staff sees all, editors see only their own
    if (!isStaff) {
      query.eq('user_id', user.id);
    }

    const { data } = await query.limit(100);
    if (data) setSubmissions(data as any as ArenaSubmission[]);
  }, [user, isStaff]);

  const toggleArenaEligible = useCallback(async (song: FeaturedSong) => {
    const newVal = !song.mission_live;
    await supabase.from('featured_drops').update({ mission_live: newVal } as any).eq('id', song.id);
    setSongs(prev => prev.map(s => s.id === song.id ? { ...s, mission_live: newVal } : s));
    toast.success(newVal ? `${song.song_name} pushed live to Get Paid` : `${song.song_name} removed from Get Paid`);
  }, []);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);
  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const mySubmissionForSong = selectedSong ? submissions.find(s => s.drop_id === selectedSong.id && s.user_id === user?.id) : null;
  const displaySubmissions = selectedSong 
    ? submissions.filter(s => s.drop_id === selectedSong.id) 
    : submissions;
  const selectedSongPayouts = (selectedSong?.mission_custom_payouts as Record<string, number> | null) || null;
  const ratingPayoutMap = ratingTarget
    ? ((songs.find(s => s.id === ratingTarget.drop_id)?.mission_custom_payouts as Record<string, number> | null) || null)
    : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-950/30 to-background border-b border-amber-500/10 px-4 pt-4 pb-5">
        <Link to="/hub" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Hub
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
            <InfinityLoop size={24} />
          </div>
          <div>
            <h1 className="font-display text-2xl text-foreground">SOLO ARENA</h1>
            <p className="text-[10px] text-muted-foreground">Pick a song. Submit your edit. Earn up to $5.</p>
          </div>
        </div>

        {/* Payout tiers */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {RATINGS.map(r => {
              const p = selectedSongPayouts?.[r] ?? 0;
              return (
                <div key={r} className={`px-2 py-1 rounded border text-[10px] font-bold ${RATING_COLORS[r]}`}>
                  {r}{p > 0 ? ` = $${(p / 100).toFixed(0)}` : ' = IDX'}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Balance */}
        {user && <BalanceBanner />}

        {/* Song selection */}
        <div>
          <h3 className="font-display text-sm text-foreground mb-2 flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" /> {isStaff ? 'Manage Arena Songs' : 'Pick a Song'}
          </h3>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-amber-400 animate-spin" /></div>
          ) : songs.length === 0 ? (
            <div className="text-center py-8 bg-surface-1/60 border border-border/30 rounded-lg">
              <Music className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No songs available right now</p>
              <p className="text-[10px] text-muted-foreground mt-1">Check back soon for new drops</p>
            </div>
          ) : (
            <div className="space-y-2">
              {songs.map(s => (
                <SongCard key={s.id} song={s} onSelect={setSelectedSong} isSelected={selectedSong?.id === s.id} isStaff={isStaff} onToggleArena={toggleArenaEligible} />
              ))}
            </div>
          )}
        </div>

        {/* Submit form */}
        {selectedSong && user && !mySubmissionForSong && (
          <SubmitPanel song={selectedSong} userId={user.id} onSubmitted={fetchSubmissions} />
        )}

        {/* Already submitted for this song */}
        {mySubmissionForSong && (
          <div className={`border p-4 rounded-lg ${
            mySubmissionForSong.rating ? 'bg-amber-950/20 border-amber-500/30' : 'bg-surface-1 border-border/50'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {mySubmissionForSong.rating ? (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-black ${RATING_COLORS[mySubmissionForSong.rating as SubmissionRating]}`}>
                  <span className="text-base">{mySubmissionForSong.rating}</span>
                  {mySubmissionForSong.earned_cents > 0 && (
                    <span className="text-emerald-400 font-bold text-[10px]">+${mySubmissionForSong.earned_cents / 100}</span>
                  )}
                </div>
              ) : (
                <><Clock className="w-4 h-4 text-amber-400" /><span className="text-sm font-bold text-amber-400">Pending Rating</span></>
              )}
            </div>
            {mySubmissionForSong.earned_cents > 0 && (
              <p className="text-sm text-emerald-400 font-bold">+${(mySubmissionForSong.earned_cents / 100).toFixed(0)} added to your balance 🎉</p>
            )}
            {mySubmissionForSong.feedback && (
              <p className="text-[10px] text-muted-foreground mt-2 italic">"{mySubmissionForSong.feedback}"</p>
            )}
          </div>
        )}

        {/* Submissions */}
        <MySubmissions submissions={displaySubmissions} isStaff={isStaff} onRate={setRatingTarget} />

        {/* Not logged in */}
        {!user && (
          <Link to="/login">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
              <p className="text-sm text-amber-400 font-bold">Log in to submit your edit</p>
              <p className="text-[10px] text-muted-foreground mt-1">Create an account to start earning</p>
            </div>
          </Link>
        )}
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingTarget && (
          <RatingModal submission={ratingTarget} payoutMap={ratingPayoutMap} onClose={() => setRatingTarget(null)} onRated={fetchSubmissions} />
        )}
      </AnimatePresence>
    </div>
  );
}
