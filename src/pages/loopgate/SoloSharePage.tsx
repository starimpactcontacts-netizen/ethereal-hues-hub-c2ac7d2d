import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Star, Send, ExternalLink, Loader2, Copy, Check, MessageCircle, Eye, AlertTriangle, Music, Film, X, Download, ChevronRight } from 'lucide-react';
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
  const playerVideoRef = useRef<HTMLVideoElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressHandleRef = useRef<HTMLDivElement>(null);
  const [videoAspect, setVideoAspect] = useState<number | null>(null);

  // "Already rated" must be account-aware — a stale localStorage flag from a different
  // login (or an earlier test) on the same browser would otherwise wrongly lock out a
  // fresh account. Logged-in users are checked against the real rating records; only
  // anonymous raters (who have no account to verify against) fall back to localStorage.
  useEffect(() => {
    if (user) {
      setAlreadyRated(ratings.some(r => r.rater_user_id === user.id));
    } else if (slug) {
      setAlreadyRated(!!localStorage.getItem(RATED_KEY(slug)));
    }
  }, [user, ratings, slug]);

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

  // Drive the now-playing seek bar straight off the video's currentTime every frame —
  // smoother than React state + the ~4Hz `timeupdate` event, which visibly steps.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = playerVideoRef.current;
      if (v && v.duration) {
        const pct = `${Math.min(100, Math.max(0, (v.currentTime / v.duration) * 100))}%`;
        if (progressFillRef.current) progressFillRef.current.style.width = pct;
        if (progressHandleRef.current) progressHandleRef.current.style.left = pct;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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

      // Match the canvas to the edit's native aspect ratio (9:16, 3:4, 1:1, etc.) — never force-crop to square
      const vw0 = video.videoWidth || 720, vh0 = video.videoHeight || 720;
      const maxDim = 1080;
      const exportScale = Math.min(1, maxDim / Math.max(vw0, vh0));
      const W = Math.round(vw0 * exportScale), H = Math.round(vh0 * exportScale);
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Preload brand mark + cover art for the embed bar
      let logo: HTMLImageElement | null = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = loopgateLogo;
      await new Promise<void>((res) => {
        logo!.onload = () => res();
        logo!.onerror = () => { logo = null; res(); };
      });

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

      const RED = '#FF3B3B';
      const BLUE = '#3B82F6';

      const codeText = share.slug.toUpperCase();
      const editorText = `@${share.username}`.toUpperCase();
      const sessionText = share.timer_minutes
        ? `${share.timer_minutes >= 60 ? `${share.timer_minutes / 60}HR` : `${share.timer_minutes}MIN`} EDIT`
        : 'SOLO EDIT';

      // Tiny icon glyphs, drawn from primitives (song note / scenepack film-strip)
      const iconGray = 'rgba(255,255,255,0.35)';
      const drawIconSong = (x: number, y: number) => {
        ctx.fillStyle = iconGray;
        ctx.beginPath(); ctx.ellipse(x + 1.5, y + 7, 1.8, 1.4, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 7.5, y + 6, 1.8, 1.4, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = iconGray; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 3.2, y + 7); ctx.lineTo(x + 3.2, y); ctx.lineTo(x + 9.2, y - 1); ctx.lineTo(x + 9.2, y + 6);
        ctx.stroke();
      };
      const drawIconScenepack = (x: number, y: number) => {
        ctx.strokeStyle = iconGray; ctx.lineWidth = 1;
        const w = 11, h = 8;
        ctx.strokeRect(x + 0.5, y + 2.5, w, h);
        ctx.beginPath();
        for (let i = 1; i < 4; i++) {
          const lx = x + (w / 4) * i;
          ctx.moveTo(lx, y + 2.5); ctx.lineTo(lx, y + 4);
          ctx.moveTo(lx, y + 9); ctx.lineTo(lx, y + 10.5);
        }
        ctx.stroke();
      };

      // "RATE" micro-label + 5 small grey "blinking" stars — mirrors the on-screen Minecraft cue
      const drawRatingCue = (x: number, cy: number) => {
        const spacing = 12;
        const gap = 7;
        ctx.textAlign = 'left';
        ctx.font = '900 6px Minecraft, monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('RATE', x, cy);
        const labelW = ctx.measureText('RATE').width;

        const starsStartX = x + labelW + gap;
        const t = performance.now() / 1000;
        ctx.font = '900 9px Minecraft, monospace';
        for (let i = 0; i < 5; i++) {
          const wave = (Math.sin(((t - i * 0.25) / 1.6) * Math.PI * 2) + 1) / 2;
          ctx.fillStyle = `rgba(255,255,255,${(0.25 + wave * 0.25).toFixed(2)})`;
          ctx.fillText('★', starsStartX + i * spacing, cy);
        }
      };

      const drawHUD = () => {
        ctx.textBaseline = 'middle';

        // Corner badges — brand mark (Minecraft font, red edge) + room code (blue edge), small + sharp
        const badgeH = 15;
        ctx.font = '900 8px Minecraft, monospace';
        const brandW = ctx.measureText('LOOPGATE.GG').width + 14;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(10, 10, brandW, badgeH);
        ctx.fillStyle = RED;
        ctx.fillRect(10, 10, 3, badgeH);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText('LOOPGATE.GG', 17, 10 + badgeH / 2 + 1);

        ctx.font = '800 6px system-ui, -apple-system, sans-serif';
        const roomLabelW = ctx.measureText('ROOM').width;
        ctx.font = '900 8px ui-monospace, SFMono-Regular, Menlo, monospace';
        const roomCodeW = ctx.measureText(codeText).width;
        const roomBadgeW = roomLabelW + roomCodeW + 18;
        const roomBadgeX = W - 10 - roomBadgeW;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(roomBadgeX, 10, roomBadgeW, badgeH);
        ctx.fillStyle = BLUE;
        ctx.fillRect(roomBadgeX + roomBadgeW - 3, 10, 3, badgeH);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '800 6px system-ui, -apple-system, sans-serif';
        ctx.fillText('ROOM', roomBadgeX + 7, 10 + badgeH / 2 + 1);
        ctx.fillStyle = '#fff';
        ctx.font = '900 8px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(codeText, roomBadgeX + 7 + roomLabelW + 5, 10 + badgeH / 2 + 1);

        // Bottom "now playing" bar — live, tracks real playback progress
        const cueH = 16;
        const rowH = 38;
        const barH = rowH;
        const barY = H - barH;
        const midY = barY + rowH / 2;
        const cueY = barY - cueH / 2 - 2;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, barY, W, barH);

        // Editor avatar + username + session length
        const tile = 24, tileX = 12, tileY = barY + (barH - tile) / 2;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(tileX, tileY, tile, tile);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tileX + 0.5, tileY + 0.5, tile - 1, tile - 1);
        if (avatar) {
          try { ctx.drawImage(avatar, tileX, tileY, tile, tile); } catch {}
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.font = '900 10px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(share.username.charAt(0).toUpperCase(), tileX + tile / 2, tileY + tile / 2 + 1);
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.font = '900 8px system-ui, -apple-system, sans-serif';
        ctx.fillText(editorText, tileX + tile + 7, midY - 5);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '800 6px system-ui, -apple-system, sans-serif';
        ctx.fillText(sessionText, tileX + tile + 7, midY + 5);

        // Live progress slider — Spotify-style white track + green fill, moves with actual playback
        const sliderX = tileX + tile + 138;
        const sliderW = W - sliderX - 95;
        const progress = maxDuration > 0 ? Math.min(1, Math.max(0, video.currentTime / maxDuration)) : 0;
        const fillW = sliderW * progress;
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(sliderX, midY - 1, sliderW, 2);
        if (fillW > 0) {
          ctx.fillStyle = '#1DB954';
          ctx.fillRect(sliderX, midY - 1, fillW, 2);
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sliderX + fillW, midY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Icon cluster — song + scenepack
        const iconY = midY - 4;
        drawIconSong(W - 56, iconY);
        drawIconScenepack(W - 34, iconY);

        // Rating cue — floats just above the bar, beside the editor identity, at ~50% opacity
        drawRatingCue(tileX, cueY);
      };

      const draw = () => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        // Canvas already matches the video's native aspect ratio — draw it edge-to-edge, nothing cropped or stretched
        try { ctx.drawImage(video, 0, 0, W, H); } catch {}
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
  const MINECRAFT = { fontFamily: 'Minecraft, monospace' };
  const sessionLabel = share.timer_minutes
    ? `${share.timer_minutes >= 60 ? `${share.timer_minutes / 60}HR` : `${share.timer_minutes}MIN`} EDIT`
    : 'SOLO EDIT';
  const coverArt = share.thumbnail_url || getBunnyThumbnail(share.video_url) || undefined;

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
        {/* Header — trimmed down: the embed itself already carries identity, room code & session, so this surfaces only what isn't baked in: title, overall rating, caption, song */}
        <div className="pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.24em] text-white/30 font-black" style={TEKO}>Solo Edit</div>
              {share.title && (
                <h1 className="text-3xl font-bold leading-[0.95] italic tracking-tight uppercase mt-1" style={TEKO}>{share.title}</h1>
              )}
              <Link to={`/u/${share.username}`} className="text-[12px] font-bold text-white/40 hover:text-white/70 hover:underline mt-1.5 inline-block truncate">
                by @{share.username}
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

          {share.caption && !/^https?:\/\//i.test(share.caption.trim()) && (
            <p className="text-sm text-white/60 mt-2 whitespace-pre-wrap">{share.caption}</p>
          )}

          {(share.is_overtime || share.song_name) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
          )}
        </div>

        {/* Player — sized to the edit's native aspect ratio (9:16, 3:4, 1:1, etc.) so nothing gets cropped or stretched */}
        <div
          className="relative w-full overflow-hidden border border-white/[0.08]"
          style={{ background: '#111114', aspectRatio: videoAspect ? String(videoAspect) : '1' }}
        >
          {share.platform === 'bunny' ? (
            <BunnyVideo
              ref={playerVideoRef}
              src={share.video_url}
              poster={coverArt}
              className="absolute inset-0 w-full h-full object-cover"
              controls
              autoPlay={false}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) setVideoAspect(v.videoWidth / v.videoHeight);
              }}
            />
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

          {/* Corner badges — brand mark (Minecraft font) and room code, small + sharp-edged */}
          <div className="absolute top-2 left-2 flex items-center gap-1 pl-1 pr-1.5 py-[3px] bg-black/85 backdrop-blur-sm border-l-[3px] border-l-[#FF3B3B] pointer-events-none">
            <GateIcon size={9} />
            <span className="text-[8px] text-white tracking-wider leading-none" style={MINECRAFT}>LOOPGATE.GG</span>
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1 pl-1.5 pr-1 py-[3px] bg-black/85 backdrop-blur-sm border-r-[3px] border-r-[#3B82F6] pointer-events-none">
            <span className="text-[6px] uppercase tracking-[0.15em] text-white/40 font-bold">Room</span>
            <span className="text-[8px] font-mono font-black text-white tracking-[0.12em] leading-none">{share.slug.toUpperCase()}</span>
          </div>

          {/* Live "now playing" bar — tracks real playback progress, baked into the downloaded edit */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none flex flex-col">
            {/* Rating cue — floats just above the bar, beside the editor identity, at 50% opacity */}
            <div className="flex items-center gap-1.5 px-2.5 pb-1 opacity-50">
              <span className="text-[6px] uppercase tracking-[0.22em] text-white font-black leading-none" style={MINECRAFT}>Rate</span>
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="text-white animate-pulse leading-none"
                  style={{ ...MINECRAFT, fontSize: '9px', animationDelay: `${i * 0.25}s`, animationDuration: '1.6s' }}
                >
                  ★
                </span>
              ))}
            </div>

            <div className="bg-black border-t border-white/10 flex items-center gap-2 px-2.5 py-1.5">
              {/* Editor avatar + username + session length */}
              <div className="flex items-center gap-1.5 min-w-0 shrink-0" style={{ width: '38%' }}>
                {share.avatar_url ? (
                  <img src={share.avatar_url} alt="" className="w-6 h-6 object-cover shrink-0 border border-white/15" crossOrigin="anonymous" />
                ) : (
                  <div className="w-6 h-6 shrink-0 bg-white/[0.06] border border-white/15 flex items-center justify-center">
                    <span className="text-[8px] font-black text-white/30">{share.username.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="leading-tight min-w-0">
                  <div className="text-[8px] font-black text-white uppercase tracking-wider truncate">@{share.username}</div>
                  <div className="text-[6px] uppercase tracking-[0.18em] text-white/40 font-bold truncate">{sessionLabel}</div>
                </div>
              </div>

              {/* Live seek-bar — Spotify-style white track + green fill, driven via rAF for a smooth glide */}
              <div className="relative flex-1 h-[2px] bg-white/25">
                <div ref={progressFillRef} className="absolute inset-y-0 left-0 bg-[#1DB954]" style={{ width: '0%' }} />
                <div
                  ref={progressHandleRef}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-white"
                  style={{ left: '0%' }}
                />
              </div>

              {/* Icon cluster — song + scenepack */}
              <div className="flex items-center gap-1.5 shrink-0 text-white/35">
                <Music className="w-3 h-3" />
                <Film className="w-3 h-3" />
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