import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Star, Send, ExternalLink, Loader2, Copy, Check, MessageCircle, Eye, Clock, AlertTriangle, Music, X, Download, Shield } from 'lucide-react';
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
import html2canvas from 'html2canvas';
import { attachHlsSource } from '@/lib/attachHlsSource';

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
  const [editorProfile, setEditorProfile] = useState<{ level: number; league: string; global_index_score: number } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug && localStorage.getItem(RATED_KEY(slug))) setAlreadyRated(true);
  }, [slug]);

  // Fetch editor profile for HUD
  useEffect(() => {
    if (!share?.user_id) return;
    supabase
      .from('profiles')
      .select('level, league, global_index_score')
      .eq('id', share.user_id)
      .maybeSingle()
      .then(({ data }) => { if (data) setEditorProfile(data as any); });
  }, [share?.user_id]);

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

  const leagueLabel = (editorProfile?.league || 'open').toUpperCase();
  const levelNum = editorProfile?.level ?? 1;
  const idxScore = editorProfile?.global_index_score ?? 0;

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#000', scale: 2, useCORS: true, allowTaint: true });
      const link = document.createElement('a');
      link.download = `loopgate-${share.slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Card downloaded — post it anywhere.');
    } catch (e: any) {
      toast.error('Download failed. Try screenshotting instead.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!share) return;
    if (share.platform !== 'bunny') {
      toast.error('Video export only works for uploaded edits. Copy the share link instead.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      toast.error('Your browser can\'t export video. Try Chrome on desktop.');
      return;
    }
    setDownloading(true);
    const loadingToast = toast.loading('Baking HUD onto your edit…');
    let cleanupHls: (() => void) | null = null;
    let rafId = 0;
    const video = document.createElement('video');
    video.muted = false;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    try {
      cleanupHls = attachHlsSource(video, share.video_url);
      await new Promise<void>((resolve, reject) => {
        const ok = () => { video.removeEventListener('loadedmetadata', ok); resolve(); };
        const fail = () => { video.removeEventListener('error', fail); reject(new Error('Video failed to load')); };
        video.addEventListener('loadedmetadata', ok);
        video.addEventListener('error', fail);
        setTimeout(() => reject(new Error('Video load timeout')), 15000);
      });

      // Square 720x720 export
      const W = 720, H = 720;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Preload avatar
      let avatar: HTMLImageElement | null = null;
      if (share.avatar_url) {
        avatar = new Image();
        avatar.crossOrigin = 'anonymous';
        avatar.src = share.avatar_url;
        await new Promise<void>((res) => {
          avatar!.onload = () => res();
          avatar!.onerror = () => { avatar = null; res(); };
        });
      }

      const stream = canvas.captureStream(30);
      // Try to pipe audio
      try {
        const audioStream = (video as any).captureStream?.() || (video as any).mozCaptureStream?.();
        if (audioStream) {
          audioStream.getAudioTracks().forEach((t: MediaStreamTrack) => stream.addTrack(t));
        }
      } catch {}

      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm');
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_500_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

      const drawHUD = () => {
        // Top-left identity pill
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(16, 16, 260, 60);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
        ctx.strokeRect(16, 16, 260, 60);
        if (avatar) {
          try { ctx.drawImage(avatar, 26, 26, 40, 40); } catch {}
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(26, 26, 40, 40);
        }
        ctx.fillStyle = '#fff';
        ctx.font = '900 15px system-ui, -apple-system, sans-serif';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`@${share.username.toUpperCase()}`, 76, 44);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '800 10px system-ui, -apple-system, sans-serif';
        ctx.fillText(`LVL ${levelNum} · ${leagueLabel}`, 76, 62);

        // Top-right IDX
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(W - 168, 16, 152, 60);
        ctx.strokeStyle = 'rgba(251,191,36,0.5)';
        ctx.strokeRect(W - 168, 16, 152, 60);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '800 10px system-ui';
        ctx.fillText('IDX SCORE', W - 156, 36);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 22px system-ui';
        ctx.fillText(Number(idxScore).toFixed(2), W - 156, 64);

        // Bottom-left room code
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(16, H - 76, 240, 60);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.strokeRect(16, H - 76, 240, 60);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '800 10px system-ui';
        ctx.fillText('ROOM', 28, H - 56);
        ctx.fillStyle = '#fff';
        ctx.font = '900 18px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(share.slug.toUpperCase(), 28, H - 30);

        // Bottom-right brand
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(W - 220, H - 76, 204, 60);
        ctx.fillStyle = '#000';
        ctx.font = '900 16px system-ui';
        ctx.fillText('LOOPGATE.GG', W - 206, H - 46);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.font = '800 11px ui-monospace, monospace';
        ctx.fillText(`/s/${share.slug}`, W - 206, H - 26);
      };

      const draw = () => {
        const vw = video.videoWidth, vh = video.videoHeight;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        if (vw && vh) {
          const scale = Math.max(W / vw, H / vh);
          const dw = vw * scale, dh = vh * scale;
          try { ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh); } catch {}
        }
        drawHUD();
        rafId = requestAnimationFrame(draw);
      };

      // Cap export at 60s
      const maxDuration = Math.min(video.duration || 60, 60);
      video.currentTime = 0;
      await video.play();
      recorder.start(250);
      draw();

      await new Promise<void>((resolve) => {
        const tick = () => {
          if (video.ended || video.currentTime >= maxDuration) { resolve(); return; }
          requestAnimationFrame(tick);
        };
        tick();
      });

      cancelAnimationFrame(rafId);
      video.pause();
      recorder.stop();
      await new Promise<void>((res) => { recorder.onstop = () => res(); });

      const blob = new Blob(chunks, { type: 'video/webm' });
      if (blob.size < 1000) throw new Error('Empty recording');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `loopgate-${share.slug}.webm`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.dismiss(loadingToast);
      toast.success('Edit downloaded with HUD baked in.');
    } catch (e: any) {
      console.error('[Solo video export]', e);
      toast.dismiss(loadingToast);
      toast.error('Video export failed. Try the card download instead.');
    } finally {
      try { cleanupHls?.(); } catch {}
      cancelAnimationFrame(rafId);
      setDownloading(false);
    }
  };

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

          {/* Valorant-style HUD overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top-left: editor identity */}
            <div className="absolute top-2 left-2 flex items-center gap-2 px-2.5 py-1.5 bg-black/70 backdrop-blur-md border border-white/15"
                 style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}>
              {share.avatar_url ? (
                <img src={share.avatar_url} alt="" className="w-6 h-6 rounded-sm object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-6 h-6 bg-white/10 rounded-sm" />
              )}
              <div className="leading-tight pr-2">
                <div className="text-[10px] font-black tracking-wider text-white">@{share.username.toUpperCase()}</div>
                <div className="text-[8px] uppercase tracking-[0.2em] text-amber-400 font-bold">LVL {levelNum} · {leagueLabel}</div>
              </div>
            </div>

            {/* Top-right: IDX score */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 backdrop-blur-md border border-amber-400/40"
                 style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%)' }}>
              <Shield className="w-3 h-3 text-amber-400" />
              <div className="leading-tight">
                <div className="text-[8px] uppercase tracking-[0.2em] text-white/50 font-bold">IDX</div>
                <div className="text-[11px] font-black text-amber-400 tabular-nums">{Number(idxScore).toFixed(2)}</div>
              </div>
            </div>

            {/* Bottom-left: room code */}
            <div className="absolute bottom-2 left-2 px-2.5 py-1.5 bg-black/70 backdrop-blur-md border border-white/15"
                 style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}>
              <div className="text-[8px] uppercase tracking-[0.2em] text-white/50 font-bold">ROOM</div>
              <div className="text-[11px] font-mono font-black text-white tracking-[0.18em]">{share.slug.toUpperCase()}</div>
            </div>

            {/* Bottom-right: loopgate.gg branding */}
            <div className="absolute bottom-2 right-2 px-2.5 py-1.5 bg-amber-400 border border-amber-300"
                 style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%)' }}>
              <div className="text-[10px] font-black text-black tracking-[0.15em]">LOOPGATE.GG</div>
            </div>
          </div>
        </div>

        {/* Downloadable share card (hidden off-screen, rendered for capture) */}
        <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
          <div ref={cardRef} style={{ width: 1080, height: 1080, background: '#000', position: 'relative', fontFamily: 'system-ui, sans-serif' }}>
            {/* Thumbnail background */}
            {(share.thumbnail_url || getBunnyThumbnail(share.video_url)) && (
              <img
                src={share.thumbnail_url || getBunnyThumbnail(share.video_url) || ''}
                alt=""
                crossOrigin="anonymous"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
              />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)' }} />

            {/* Top bar: identity */}
            <div style={{ position: 'absolute', top: 48, left: 48, right: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(0,0,0,0.7)', padding: '16px 24px', border: '2px solid rgba(255,255,255,0.2)' }}>
                {share.avatar_url && <img src={share.avatar_url} crossOrigin="anonymous" alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />}
                <div>
                  <div style={{ color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: 2 }}>@{share.username.toUpperCase()}</div>
                  <div style={{ color: '#fbbf24', fontSize: 14, fontWeight: 800, letterSpacing: 4, marginTop: 4 }}>LVL {levelNum} · {leagueLabel}</div>
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.7)', padding: '16px 24px', border: '2px solid rgba(251,191,36,0.5)', textAlign: 'right' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 4, fontWeight: 800 }}>IDX SCORE</div>
                <div style={{ color: '#fbbf24', fontSize: 32, fontWeight: 900 }}>{Number(idxScore).toFixed(2)}</div>
              </div>
            </div>

            {/* Center title */}
            <div style={{ position: 'absolute', left: 48, right: 48, top: '40%', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, letterSpacing: 8, fontWeight: 800 }}>SOLO EDIT</div>
              <div style={{ color: '#fff', fontSize: 72, fontWeight: 900, letterSpacing: 2, marginTop: 12, lineHeight: 1 }}>
                {(share.title || `${share.username}'s Edit`).slice(0, 28).toUpperCase()}
              </div>
              {share.total_ratings > 0 && (
                <div style={{ marginTop: 24, color: '#fbbf24', fontSize: 32, fontWeight: 900 }}>
                  ★ {share.avg_rating.toFixed(2)} <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 700 }}>· {share.total_ratings} RATINGS</span>
                </div>
              )}
            </div>

            {/* Bottom bar: room + branding */}
            <div style={{ position: 'absolute', bottom: 48, left: 48, right: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ background: 'rgba(0,0,0,0.7)', padding: '16px 24px', border: '2px solid rgba(255,255,255,0.2)' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 4, fontWeight: 800 }}>RATE AT</div>
                <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: 2, fontFamily: 'monospace' }}>loopgate.gg/s/{share.slug}</div>
              </div>
              <div style={{ background: '#fbbf24', padding: '20px 28px', color: '#000', fontSize: 24, fontWeight: 900, letterSpacing: 3 }}>
                LOOPGATE.GG
              </div>
            </div>
          </div>
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

        {/* Download CTAs */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            onClick={handleDownloadVideo}
            disabled={downloading}
            className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-[0.18em] active:scale-[0.98] transition disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {downloading ? 'Baking' : 'Download Edit'}
          </button>
          <button
            onClick={handleDownloadCard}
            disabled={downloading}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[10px] font-bold uppercase tracking-[0.18em] active:scale-[0.98] transition disabled:opacity-50"
          >
            <Download className="w-3 h-3" /> Card
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-white/40 text-center">
          Bakes the Valorant-style HUD onto your video. Up to 60s, .webm format.
        </p>

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