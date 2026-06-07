import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Star, Send, ExternalLink, Loader2, Copy, Check, MessageCircle, Eye, Clock, AlertTriangle, Music, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSoloShareBySlug, submitSoloShareRating } from '@/hooks/useSoloShares';
import { getEmbedUrl } from '@/lib/videoEmbed';
import BunnyVideo from '@/components/loopgate/BunnyVideo';
import { getBunnyThumbnail } from '@/lib/bunnyPlayback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SEO from '@/components/SEO';
import { toast } from 'sonner';
import GateIcon from '@/components/loopgate/GateIcon';
import { supabase } from '@/integrations/supabase/client';

const RATED_KEY = (slug: string) => `lg_solo_rated_${slug}`;

export default function SoloSharePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { share, ratings, loading, notFound, refetch } = useSoloShareBySlug(slug);

  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [nickname, setNickname] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug && localStorage.getItem(RATED_KEY(slug))) setAlreadyRated(true);
  }, [slug]);

  // Bump views once per page load (best-effort, non-owner)
  useEffect(() => {
    if (!share) return;
    if (user && user.id === share.user_id) return;
    const key = `lg_solo_viewed_${share.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    supabase.rpc as any; // no-op type guard
    supabase
      .from('solo_shares' as any)
      .update({ views: (share.views || 0) + 1 })
      .eq('id', share.id)
      .then(() => {});
  }, [share, user]);

  const embedUrl = useMemo(
    () => (share && share.platform !== 'bunny' ? getEmbedUrl(share.video_url, share.platform, share.start_offset_seconds || 0) : null),
    [share]
  );

  const shareUrl = typeof window !== 'undefined' && slug ? `${window.location.origin}/s/${slug}` : '';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  if (notFound || !share) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center px-6">
        <GateIcon size={48} />
        <h1 className="font-display text-3xl mt-4 text-white">Edit not found</h1>
        <p className="text-white/50 text-sm mt-2">This shared edit may have been removed.</p>
        <Link to="/start" className="mt-6 px-5 py-2.5 bg-white text-black rounded-xl font-bold text-sm">
          Join Loopgate
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === share.user_id;

  const handleSubmitRating = async () => {
    if (isOwner) { toast.error("You can't rate your own edit."); return; }
    if (stars < 1) { toast.error('Pick a star rating first.'); return; }
    if (!user && !nickname.trim()) { toast.error('Add a nickname so the editor knows who rated.'); return; }

    setSubmitting(true);
    const res = await submitSoloShareRating({
      share_id: share.id,
      stars,
      comment: comment.trim() || null,
      rater_nickname: user ? (profile?.username || null) : nickname.trim(),
      rater_user_id: user?.id || null,
    });
    setSubmitting(false);
    if (!res.ok) { toast.error(res.error || 'Failed to submit rating.'); return; }
    localStorage.setItem(RATED_KEY(share.slug), '1');
    setAlreadyRated(true);
    toast.success('Rating submitted. The editor just earned Rings.');
    setStars(0);
    setComment('');
    refetch();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const title = share.title || `${share.username}'s Edit`;
  const description = share.caption || `Rate ${share.username}'s edit on Loopgate. Independent rating page for editors.`;

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      <SEO
        title={`${title} — by @${share.username}`}
        description={description}
        canonical={`https://loopgate.gg/s/${share.slug}`}
        image={share.thumbnail_url || getBunnyThumbnail(share.video_url) || undefined}
      />

      {/* Top bar */}
      <div className="shrink-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-xl mx-auto px-3 h-12 flex items-center justify-between gap-2">
          <button
            onClick={() => (user ? navigate('/solo') : navigate('/start'))}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Exit"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto overscroll-contain w-full max-w-xl mx-auto px-4 pb-24" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        {/* Header */}
        <div className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            {share.avatar_url ? (
              <img src={share.avatar_url} alt={share.username} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                {share.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Solo Edit</div>
              <Link to={`/u/${share.username}`} className="text-sm font-bold hover:underline truncate block">
                @{share.username}
              </Link>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span className="text-sm font-bold">
                  {share.total_ratings > 0 ? share.avg_rating.toFixed(2) : '—'}
                </span>
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider">
                {share.total_ratings} {share.total_ratings === 1 ? 'rating' : 'ratings'}
              </div>
            </div>
          </div>

          {share.title && (
            <h1 className="font-display text-2xl mt-4 leading-tight">{share.title}</h1>
          )}
          {share.caption && !/^https?:\/\//i.test(share.caption.trim()) && (
            <p className="text-sm text-white/70 mt-2 whitespace-pre-wrap">{share.caption}</p>
          )}

          {/* Room code pill */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">Room Code</span>
            <span className="font-mono text-sm font-bold tracking-[0.2em]">{share.slug.toUpperCase()}</span>
          </div>

          {/* Session badges */}
          {(share.timer_minutes || share.song_name || share.is_overtime) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {share.timer_minutes && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.18em] text-white/60">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {share.timer_minutes >= 60 ? `${share.timer_minutes / 60}h` : `${share.timer_minutes}m`} session
                </span>
              )}
              {share.is_overtime && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] uppercase tracking-[0.18em] font-bold">
                  <AlertTriangle className="w-3 h-3" />
                  Overtime
                </span>
              )}
              {share.song_name && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.18em] text-white/60">
                  <Music className="w-3 h-3 text-amber-400" />
                  {share.song_name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Player */}
        <div className="relative w-full aspect-square overflow-hidden bg-zinc-900 border border-white/10">
          {share.platform === 'bunny' ? (
            <BunnyVideo src={share.video_url} poster={share.thumbnail_url || getBunnyThumbnail(share.video_url) || undefined} className="absolute inset-0 w-full h-full object-cover" controls autoPlay={false} />
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <ExternalLink className="w-8 h-8 text-white/40" />
              <p className="text-sm text-white/60">This player can't be embedded.</p>
              <a
                href={share.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold"
              >
                Watch on {share.platform}
              </a>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-4 mt-3 text-[11px] text-white/50">
          <div className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {share.views} views</div>
          <div className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {ratings.filter(r => r.comment).length} feedback</div>
          <div className="flex items-center gap-1">
            <span className="font-black text-emerald-400 text-[12px] tracking-tight">R$</span>
            <span>{share.rings_earned} earned</span>
          </div>
        </div>

        {/* Rating block */}
        <section className="mt-6 rounded-2xl bg-[#0e0e0e] border border-white/5 p-4">
          {isOwner ? (
            <div className="text-center py-3">
              <p className="text-sm text-white/70">This is your edit. Share the link to start earning Rings.</p>
              <button
                onClick={handleCopy}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black text-xs font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Link copied' : 'Copy share link'}
              </button>
            </div>
          ) : alreadyRated ? (
            <div className="text-center py-3">
              <Check className="w-6 h-6 mx-auto text-emerald-400" />
              <p className="text-sm font-bold mt-1">Thanks for rating</p>
              <p className="text-xs text-white/50">Your feedback is below.</p>
            </div>
          ) : (
            <>
              <div className="text-center font-display text-lg font-bold mb-3">Rate this edit</div>
              <div className="flex items-center justify-center gap-1 mb-4 rounded-xl bg-white/[0.04] border border-white/10 py-3">
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = (hover || stars) >= n;
                  return (
                    <button
                      key={n}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setStars(n)}
                      className="p-1 active:scale-90 transition-transform"
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    >
                      <Star className={`w-10 h-10 transition-colors ${filled ? 'fill-amber-400 text-amber-400' : 'text-white/15'}`} strokeWidth={1.5} />
                    </button>
                  );
                })}
              </div>

              {!user && (
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 24))}
                  placeholder="Your nickname"
                  className="bg-white/5 border-white/10 mb-3 text-sm"
                />
              )}

              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="Optional feedback for the editor..."
                rows={3}
                className="bg-white/5 border-white/10 text-sm resize-none"
              />

              <Button
                onClick={handleSubmitRating}
                disabled={submitting || stars < 1}
                className="w-full mt-3 bg-white text-black hover:bg-white/90 font-bold"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><Send className="w-4 h-4 mr-1.5" /> Submit Rating</>
                )}
              </Button>

              {!user && (
                <p className="text-[10px] text-white/40 text-center mt-2">
                  No account needed. <Link to="/start" className="underline">Join Loopgate</Link> to track your ratings.
                </p>
              )}
            </>
          )}
        </section>

        {/* Feedback wall */}
        {ratings.length > 0 && (
          <section className="mt-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2">Feedback</div>
            <div className="space-y-2">
              {ratings.map((r) => (
                <div key={r.id} className="rounded-xl bg-[#0e0e0e] border border-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold truncate">
                      {r.rater_nickname || 'Anonymous'}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: r.stars }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-white/80 mt-1 whitespace-pre-wrap">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="mt-10 rounded-2xl border border-white/10 p-5 text-center bg-gradient-to-b from-white/[0.03] to-transparent">
          <GateIcon size={36} className="mx-auto" />
          <h2 className="font-display text-2xl mt-2">YOUR EDIT, YOUR PAGE.</h2>
          <p className="text-sm text-white/60 mt-1">
            Share any edit and get rated by the world. Earn Rings on every rating.
          </p>
          <button
            onClick={() => navigate(user ? '/solo/create' : '/start')}
            className="mt-4 px-5 py-2.5 bg-white text-black rounded-xl text-sm font-bold"
          >
            Create your Solo page
          </button>
        </section>
      </main>
    </div>
  );
}