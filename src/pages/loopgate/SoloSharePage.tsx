import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Star, Send, ExternalLink, Loader2, Copy, Check, MessageCircle, Eye, Clock, AlertTriangle, Music, X, Download, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSoloShareBySlug, submitSoloShareRating } from '@/hooks/useSoloShares';
import { getEmbedUrl } from '@/lib/videoEmbed';
import BunnyVideo from '@/components/loopgate/BunnyVideo';
import { getBunnyThumbnail } from '@/lib/bunnyPlayback';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SEO from '@/components/SEO';
import { toast } from 'sonner';
import GateIcon from '@/components/loopgate/GateIcon';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import { attachHlsSource } from '@/lib/attachHlsSource';
import loopgateLogo from '@/assets/loopgate-logo.png';

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
    supabase.rpc('increment_solo_share_views' as any, { share_id: share.id }).then(() => {});
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

      // Preload brand mark for the embed bar
      let logo: HTMLImageElement | null = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = loopgateLogo;
      await new Promise<void>((res) => {
        logo!.onload = () => res();
        logo!.onerror = () => { logo = null; res(); };
      });

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

      const RED = '#FF3B3B';
      const BLUE = '#3B82F6';

      const codeText = share.slug.toUpperCase();

      const drawHUD = () => {
        const barH = 46;
        const barY = H - barH;
        const midY = barY + barH / 2;

        // Thin red | blue accent line — clean competitive split
        ctx.fillStyle = RED;
        ctx.fillRect(0, barY - 3, W / 2, 3);
        ctx.fillStyle = BLUE;
        ctx.fillRect(W / 2, barY - 3, W / 2, 3);

        // Bar background — flat black, sharp edges
        ctx.fillStyle = '#000';
        ctx.fillRect(0, barY, W, barH);

        ctx.textBaseline = 'middle';

        // Left: cover tile + now-playing-style two-line text (mirrors a music player's "art + title/artist")
        const tile = 28, tileX = 12, tileY = barY + (barH - tile) / 2;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(tileX, tileY, tile, tile);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tileX + 0.5, tileY + 0.5, tile - 1, tile - 1);
        if (logo) {
          try { ctx.drawImage(logo, tileX + 6, tileY + 6, tile - 12, tile - 12); } catch {}
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.font = '700 11px Teko, system-ui, sans-serif';
        ctx.fillText('LOOPGATE.GG', tileX + tile + 8, midY - 6);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '800 7px system-ui, -apple-system, sans-serif';
        ctx.fillText('TAP TO RATE THIS EDIT', tileX + tile + 8, midY + 6);

        // Center: 5-star "transport row" over a seek-bar-style slider
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i < 5; i++) {
          ctx.fillText('☆', W / 2 + (i - 2) * 14, midY - 7);
        }
        const sliderW = 110, sliderX = W / 2 - sliderW / 2, sliderY = midY + 6, fillW = sliderW * 0.55;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(sliderX, sliderY, sliderW, 2);
        const grad = ctx.createLinearGradient(sliderX, 0, sliderX + fillW, 0);
        grad.addColorStop(0, RED);
        grad.addColorStop(1, BLUE);
        ctx.fillStyle = grad;
        ctx.fillRect(sliderX, sliderY, fillW, 2);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sliderX + fillW, sliderY + 1, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Right: edit code
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '800 7px system-ui, -apple-system, sans-serif';
        ctx.fillText('CODE', W - 12, midY - 6);
        ctx.fillStyle = BLUE;
        ctx.font = '900 11px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(codeText, W - 12, midY + 6);
        ctx.textAlign = 'left';
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

  const dotGrid = {
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  };
  const TEKO = { fontFamily: 'Teko, sans-serif' };

  return (
    <div className="fixed inset-0 text-white flex flex-col overflow-hidden" style={{ background: '#0a0a0a' }}>
      <SEO
        title={`${title} — by @${share.username}`}
        description={description}
        canonical={`https://loopgate.gg/s/${share.slug}`}
        image={share.thumbnail_url || getBunnyThumbnail(share.video_url) || undefined}
      />
      <div className="fixed inset-0 pointer-events-none" style={dotGrid} />

      {/* Top bar — matches Loopgate's flat icon-chip header language */}
      <div className="shrink-0 z-20 backdrop-blur-xl border-b border-white/[0.06]" style={{ background: 'rgba(10,10,10,0.85)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-xl mx-auto px-3 h-12 flex items-center justify-between gap-2">
          <button
            onClick={() => (user ? navigate('/solo') : navigate('/start'))}
            className="w-9 h-9 rounded-md flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] active:scale-95 transition-all"
            aria-label="Exit"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.26em] text-white/30" style={TEKO}>Solo Edit</span>
          <button
            onClick={handleCopy}
            className="h-9 px-3 rounded-md flex items-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] active:scale-95 transition-all text-[11px] font-black uppercase tracking-wide text-white/70"
            style={TEKO}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>

      <main className="relative flex-1 overflow-y-auto overscroll-contain w-full max-w-xl mx-auto px-4 pb-24" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        {/* Header */}
        <div className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            {share.avatar_url ? (
              <img src={share.avatar_url} alt={share.username} className="w-11 h-11 rounded-full object-cover border border-white/[0.08]" />
            ) : (
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black border border-white/[0.08]" style={{ background: '#111114' }}>
                {share.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[9px] uppercase tracking-[0.24em] text-white/30 font-black" style={TEKO}>Solo Edit</div>
              <Link to={`/u/${share.username}`} className="text-[15px] font-black hover:underline truncate block text-white/90">
                @{share.username}
              </Link>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center justify-end gap-1">
                <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                <span className="text-[15px] font-black text-gold tabular-nums leading-none" style={TEKO}>
                  {share.total_ratings > 0 ? share.avg_rating.toFixed(2) : '—'}
                </span>
              </div>
              <div className="text-[9px] text-white/30 uppercase tracking-[0.18em] mt-0.5" style={TEKO}>
                {share.total_ratings} {share.total_ratings === 1 ? 'rating' : 'ratings'}
              </div>
            </div>
          </div>

          {share.title && (
            <h1 className="text-3xl font-bold leading-[0.95] italic tracking-tight uppercase mt-4" style={TEKO}>{share.title}</h1>
          )}
          {share.caption && !/^https?:\/\//i.test(share.caption.trim()) && (
            <p className="text-sm text-white/60 mt-2 whitespace-pre-wrap">{share.caption}</p>
          )}

          {/* Room code + session badges — sharp dark chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-white/[0.08]" style={{ background: '#111114' }}>
              <span className="text-[8px] uppercase tracking-[0.2em] text-white/30 font-black" style={TEKO}>Room</span>
              <span className="font-mono text-[12px] font-bold tracking-[0.2em] text-white/80">{share.slug.toUpperCase()}</span>
            </div>
            {share.timer_minutes && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/[0.08] text-[9px] uppercase tracking-[0.18em] text-white/50 font-black" style={{ ...TEKO, background: '#111114' }}>
                <Clock className="w-3 h-3 text-gold" />
                {share.timer_minutes >= 60 ? `${share.timer_minutes / 60}h` : `${share.timer_minutes}m`} session
              </span>
            )}
            {share.is_overtime && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/[0.08] text-amber-300 text-[9px] uppercase tracking-[0.18em] font-black" style={TEKO}>
                <AlertTriangle className="w-3 h-3" />
                Overtime
              </span>
            )}
            {share.song_name && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/[0.08] text-[9px] uppercase tracking-[0.18em] text-white/50 font-black" style={{ ...TEKO, background: '#111114' }}>
                <Music className="w-3 h-3 text-gold" />
                {share.song_name}
              </span>
            )}
          </div>
        </div>

        {/* Player */}
        <div className="relative w-full aspect-square overflow-hidden rounded-t-2xl border border-white/[0.08]" style={{ background: '#111114' }}>
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

          {/* Universal embed — Spotify-style "now playing" bar: cover + title/subtitle, star "transport row" over a seek-bar slider, code on the right */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none">
            <div className="h-[3px] w-full flex">
              <div className="w-1/2 h-full bg-[#FF3B3B]" />
              <div className="w-1/2 h-full bg-[#3B82F6]" />
            </div>
            <div className="flex items-center gap-3 px-2.5 py-2 bg-black border-t border-white/10">
              {/* Left: cover tile + now-playing-style two-line text */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-[26px] h-[26px] shrink-0 bg-white/[0.06] border border-white/15 flex items-center justify-center">
                  <GateIcon size={16} />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-[9px] font-black text-white tracking-[0.15em] truncate" style={TEKO}>LOOPGATE.GG</div>
                  <div className="text-[7px] uppercase tracking-[0.18em] text-white/40 font-bold truncate">Tap To Rate This Edit</div>
                </div>
              </div>

              {/* Center: 5-star "transport row" over a seek-bar-style slider */}
              <div className="flex flex-col items-center gap-[7px] shrink-0">
                <div className="flex items-center gap-[4px]">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-3 h-3 text-white/40" strokeWidth={2.25} />
                  ))}
                </div>
                <div className="relative w-[110px] h-[2px] bg-white/15">
                  <div className="absolute inset-y-0 left-0" style={{ width: '55%', background: 'linear-gradient(90deg, #FF3B3B, #3B82F6)' }} />
                  <div className="absolute top-1/2 left-[55%] -translate-y-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-white" />
                </div>
              </div>

              {/* Right: edit code */}
              <div className="flex flex-col items-end leading-tight flex-1 min-w-0">
                <span className="text-[7px] uppercase tracking-[0.15em] text-white/40 font-bold">Code</span>
                <span className="text-[10px] font-mono font-black text-[#3B82F6] tracking-[0.12em] truncate">{share.slug.toUpperCase()}</span>
              </div>
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

        {/* Stats strip — dark surfaces, $R currency convention */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl px-3 py-2.5 flex flex-col items-center gap-1 border border-white/[0.07]" style={{ background: '#111114' }}>
            <span className="flex items-center gap-1 text-[15px] font-black tabular-nums leading-none" style={TEKO}>
              <Eye className="w-3.5 h-3.5 text-white/30" />{share.views}
            </span>
            <span className="text-[8px] text-white/35 uppercase tracking-[0.22em] font-black leading-none" style={TEKO}>Views</span>
          </div>
          <div className="rounded-xl px-3 py-2.5 flex flex-col items-center gap-1 border border-white/[0.07]" style={{ background: '#111114' }}>
            <span className="flex items-center gap-1 text-[15px] font-black tabular-nums leading-none" style={TEKO}>
              <MessageCircle className="w-3.5 h-3.5 text-white/30" />{ratings.filter(r => r.comment).length}
            </span>
            <span className="text-[8px] text-white/35 uppercase tracking-[0.22em] font-black leading-none" style={TEKO}>Feedback</span>
          </div>
          <div className="rounded-xl px-3 py-2.5 flex flex-col items-center gap-1 border border-white/[0.07]" style={{ background: '#111114' }}>
            <span className="text-[15px] font-black tabular-nums leading-none" style={TEKO}>
              <span style={{ color: '#3BCB6B' }}>$</span>{share.rings_earned}
            </span>
            <span className="text-[8px] text-white/35 uppercase tracking-[0.22em] font-black leading-none" style={TEKO}>Rings</span>
          </div>
        </div>

        {/* Download CTA — Rings-green accent, matching Solo's currency tone */}
        <button
          onClick={handleDownloadVideo}
          disabled={downloading}
          className="relative mt-3 w-full overflow-hidden rounded-2xl border border-white/[0.07] active:scale-[0.985] transition-transform disabled:opacity-50"
          style={{ background: 'linear-gradient(180deg, #1a1a1e 0%, #0d0d10 100%)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #3BCB6B, transparent 60%)' }} />
          <div className="relative px-4 py-3.5 flex items-center justify-center gap-2">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#3BCB6B' }} /> : <Download className="w-4 h-4" style={{ color: '#3BCB6B' }} />}
            <span className="text-[13px] font-black uppercase tracking-[0.16em]" style={TEKO}>{downloading ? 'Baking…' : 'Download Edit'}</span>
          </div>
        </button>
        <p className="mt-1.5 text-[10px] text-white/30 text-center">
          Bakes the Valorant-style HUD onto your video. Up to 60s, .webm format.
        </p>

        {/* Rating block */}
        <section className="relative mt-6 rounded-2xl overflow-hidden border border-white/[0.07] p-4" style={{ background: 'linear-gradient(180deg, #18181b 0%, #0e0e10 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={dotGrid} />
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #fbbf24, transparent 60%)' }} />
          <div className="relative">
          {isOwner ? (
            <div className="text-center py-3">
              <p className="text-[12px] text-white/50">This is your edit. Share the link to start earning Rings.</p>
              <button
                onClick={handleCopy}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wide active:scale-[0.97] transition-transform bg-white/[0.05] border border-white/[0.08] text-white/70"
                style={TEKO}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Link copied' : 'Copy share link'}
              </button>
            </div>
          ) : alreadyRated ? (
            <div className="text-center py-3">
              <Check className="w-6 h-6 mx-auto text-emerald-400" />
              <p className="text-[13px] font-black mt-1.5">Thanks for rating</p>
              <p className="text-[11px] text-white/40">Your feedback is below.</p>
            </div>
          ) : (
            <>
              <div className="text-center text-[15px] font-black uppercase tracking-wide mb-3" style={TEKO}>Rate this edit</div>
              <div className="flex items-center justify-center gap-1 mb-4 rounded-xl bg-black/30 border border-white/[0.07] py-3">
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
                      <Star className={`w-10 h-10 transition-colors ${filled ? 'fill-gold text-gold' : 'text-white/15'}`} strokeWidth={1.5} />
                    </button>
                  );
                })}
              </div>

              {!user && (
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 24))}
                  placeholder="Your nickname"
                  className="bg-white/[0.04] border-white/[0.08] mb-3 text-sm"
                />
              )}

              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="Optional feedback for the editor..."
                rows={3}
                className="bg-white/[0.04] border-white/[0.08] text-sm resize-none"
              />

              <button
                onClick={handleSubmitRating}
                disabled={submitting || stars < 1}
                className="relative w-full mt-3 overflow-hidden rounded-xl border border-white/[0.07] active:scale-[0.985] transition-transform disabled:opacity-50"
                style={{ background: 'linear-gradient(180deg, #1a1a1e 0%, #0d0d10 100%)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #fbbf24, transparent 60%)' }} />
                <div className="relative px-4 py-3 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <Send className="w-4 h-4 text-gold" />}
                  <span className="text-[12px] font-black uppercase tracking-[0.16em]" style={TEKO}>Submit Rating</span>
                </div>
              </button>

              {!user && (
                <p className="text-[10px] text-white/35 text-center mt-2">
                  No account needed. <Link to="/start" className="underline text-white/60">Join Loopgate</Link> to track your ratings.
                </p>
              )}
            </>
          )}
          </div>
        </section>

        {/* Feedback wall */}
        {ratings.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-4 h-4 rounded-[5px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #fbbf24, #3BCB6B)' }}>
                <MessageCircle className="w-2.5 h-2.5 text-black" strokeWidth={2.5} />
              </div>
              <h2 className="text-[13px] font-extrabold tracking-tight text-white/80" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Feedback</h2>
            </div>
            <div className="space-y-2">
              {ratings.map((r) => (
                <div key={r.id} className="rounded-xl border border-white/[0.07] p-3" style={{ background: '#111114' }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[12px] font-black truncate" style={TEKO}>
                      {r.rater_nickname || 'Anonymous'}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: r.stars }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-gold text-gold" />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-[12px] text-white/60 mt-1.5 whitespace-pre-wrap">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="relative mt-10 rounded-2xl overflow-hidden border border-white/[0.07] p-5 text-center" style={{ background: 'linear-gradient(180deg, #18181b 0%, #0d0d10 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={dotGrid} />
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #3BCB6B, transparent 60%)' }} />
          <div className="relative">
            <div className="w-11 h-11 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(59,203,107,0.12)', border: '2px solid rgba(59,203,107,0.35)', boxShadow: '0 0 14px rgba(59,203,107,0.18)' }}>
              <GateIcon size={22} />
            </div>
            <h2 className="text-2xl font-bold leading-[0.95] italic tracking-tight uppercase mt-3" style={TEKO}>Your Edit, Your Page</h2>
            <p className="text-[12px] text-white/40 mt-1.5">
              Share any edit and get rated by the world. Earn Rings on every rating.
            </p>
            <button
              onClick={() => navigate(user ? '/solo/create' : '/start')}
              className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wide active:scale-[0.97] transition-transform"
              style={{ ...TEKO, background: 'rgba(59,203,107,0.1)', border: '1px solid rgba(59,203,107,0.25)', color: '#3BCB6B' }}
            >
              Create your Solo page <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}