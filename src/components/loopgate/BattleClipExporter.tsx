import { useCallback, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getBunnyPlaybackUrl } from '@/lib/bunnyPlayback';

interface Props {
  fightId: string;
  redUrl: string;
  blueUrl: string;
  redUsername: string;
  blueUsername: string;
  redScore?: number;
  blueScore?: number;
  winnerSide?: 'red' | 'blue' | null;
  status?: string;
}

const W = 720;            // output width (portrait 9:16)
const H = 1280;           // output height
const INTRO_MS = 2000;
const PLAY_MS = 10000;    // duration of side-by-side playback
const OUTRO_MS = 2000;
const FPS = 30;

async function waitVideoReady(v: HTMLVideoElement): Promise<void> {
  if (v.readyState >= 2) return;
  await new Promise<void>((resolve, reject) => {
    const ok = () => { cleanup(); resolve(); };
    const err = () => { cleanup(); reject(new Error('video load failed')); };
    const cleanup = () => {
      v.removeEventListener('loadeddata', ok);
      v.removeEventListener('error', err);
    };
    v.addEventListener('loadeddata', ok);
    v.addEventListener('error', err);
  });
}

export default function BattleClipExporter({
  redUrl, blueUrl, redUsername, blueUsername,
  redScore = 0, blueScore = 0, winnerSide, status,
}: Props) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);

  const run = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    setProgress(0);
    cancelRef.current = false;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) { toast.error('Canvas unavailable'); setExporting(false); return; }

    const red = document.createElement('video');
    const blue = document.createElement('video');
    for (const v of [red, blue]) {
      v.crossOrigin = 'anonymous';
      v.muted = false;
      v.playsInline = true;
      v.preload = 'auto';
    }
    red.src = getBunnyPlaybackUrl(redUrl);
    blue.src = getBunnyPlaybackUrl(blueUrl);

    try {
      await Promise.all([waitVideoReady(red), waitVideoReady(blue)]);
    } catch {
      toast.error('Could not load one of the edits');
      setExporting(false);
      return;
    }

    // Mix audio from both videos (best effort)
    let audioDest: MediaStreamAudioDestinationNode | null = null;
    let actx: AudioContext | null = null;
    try {
      actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioDest = actx.createMediaStreamDestination();
      for (const v of [red, blue]) {
        try {
          const src = actx.createMediaElementSource(v);
          const gain = actx.createGain();
          gain.gain.value = 0.7;
          src.connect(gain).connect(audioDest);
          // Do NOT connect to destination — we don't want local playback
        } catch (e) {
          // ignore — some browsers throw if already connected
        }
      }
    } catch {}

    const canvasStream = canvas.captureStream(FPS);
    if (audioDest) {
      for (const t of audioDest.stream.getAudioTracks()) canvasStream.addTrack(t);
    }

    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(canvasStream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start(250);

    const TOTAL = INTRO_MS + PLAY_MS + OUTRO_MS;
    const t0 = performance.now();

    // Start playback when entering battle phase
    let started = false;
    const startPlayback = async () => {
      if (started) return; started = true;
      try {
        red.currentTime = 0; blue.currentTime = 0;
        await Promise.all([red.play(), blue.play()]);
      } catch (e) {
        console.warn('playback err', e);
      }
    };

    function drawIntro(p: number) {
      // Cinematic black background with red/blue split
      const grd = ctx!.createLinearGradient(0, 0, W, 0);
      grd.addColorStop(0, '#1a0a0a');
      grd.addColorStop(0.5, '#000000');
      grd.addColorStop(1, '#0a0a1a');
      ctx!.fillStyle = grd; ctx!.fillRect(0, 0, W, H);

      // Title
      const intro = Math.min(1, p * 1.4);
      ctx!.globalAlpha = intro;
      ctx!.fillStyle = '#fff';
      ctx!.textAlign = 'center';
      ctx!.font = '900 56px "Bebas Neue", Impact, sans-serif';
      ctx!.fillText('LOOPGATE', W / 2, H / 2 - 200);
      ctx!.font = '700 28px "Bebas Neue", Impact, sans-serif';
      ctx!.fillStyle = 'rgba(255,255,255,0.55)';
      ctx!.fillText('E D I T   B A T T L E', W / 2, H / 2 - 160);

      // Names
      const slide = Math.min(1, Math.max(0, (p - 0.15) * 1.6));
      const ox = (1 - slide) * 200;
      ctx!.globalAlpha = slide;
      ctx!.font = '900 78px "Bebas Neue", Impact, sans-serif';
      ctx!.fillStyle = '#ef4444';
      ctx!.textAlign = 'right';
      ctx!.shadowColor = 'rgba(239,68,68,0.7)'; ctx!.shadowBlur = 30;
      ctx!.fillText(redUsername.toUpperCase(), W / 2 - 20 - ox, H / 2 + 20);
      ctx!.fillStyle = '#3b82f6';
      ctx!.textAlign = 'left';
      ctx!.shadowColor = 'rgba(59,130,246,0.7)';
      ctx!.fillText(blueUsername.toUpperCase(), W / 2 + 20 + ox, H / 2 + 20);
      ctx!.shadowBlur = 0;

      // VS
      const vsScale = 0.7 + Math.min(1, p * 2) * 0.3;
      ctx!.globalAlpha = Math.min(1, p * 2);
      ctx!.fillStyle = '#fff';
      ctx!.textAlign = 'center';
      ctx!.font = `900 ${Math.round(120 * vsScale)}px "Bebas Neue", Impact, sans-serif`;
      ctx!.shadowColor = 'rgba(255,255,255,0.5)'; ctx!.shadowBlur = 30;
      ctx!.fillText('VS', W / 2, H / 2 + 110);
      ctx!.shadowBlur = 0;
      ctx!.globalAlpha = 1;
    }

    function drawBattle() {
      ctx!.fillStyle = '#000'; ctx!.fillRect(0, 0, W, H);
      // Two stacked square panels
      const panelH = (H - 80) / 2 - 40; // leave room for scoreboard
      const top = 100;
      drawCover(red, 0, top, W, panelH);
      drawCover(blue, 0, top + panelH + 40, W, panelH);

      // Side labels
      ctx!.fillStyle = 'rgba(239,68,68,0.95)';
      ctx!.fillRect(0, top, W, 6);
      ctx!.fillStyle = 'rgba(59,130,246,0.95)';
      ctx!.fillRect(0, top + panelH + 40 + panelH - 6, W, 6);

      // VS divider strip between
      const midY = top + panelH;
      ctx!.fillStyle = '#000'; ctx!.fillRect(0, midY, W, 40);
      ctx!.fillStyle = '#fff';
      ctx!.textAlign = 'center';
      ctx!.font = '900 28px "Bebas Neue", Impact, sans-serif';
      ctx!.fillText('— VS —', W / 2, midY + 28);

      // Scoreboard top
      drawScoreboard();
    }

    function drawScoreboard() {
      ctx!.fillStyle = 'rgba(0,0,0,0.85)';
      ctx!.fillRect(0, 0, W, 90);
      ctx!.fillStyle = '#ef4444';
      ctx!.fillRect(0, 86, W / 2, 4);
      ctx!.fillStyle = '#3b82f6';
      ctx!.fillRect(W / 2, 86, W / 2, 4);

      ctx!.textAlign = 'left';
      ctx!.font = '900 26px "Bebas Neue", Impact, sans-serif';
      ctx!.fillStyle = '#ef4444';
      ctx!.fillText(redUsername.toUpperCase(), 24, 36);
      ctx!.textAlign = 'right';
      ctx!.fillStyle = '#3b82f6';
      ctx!.fillText(blueUsername.toUpperCase(), W - 24, 36);

      // Scores
      ctx!.font = '900 44px "Bebas Neue", Impact, sans-serif';
      ctx!.fillStyle = '#fff';
      ctx!.textAlign = 'center';
      ctx!.fillText(`${redScore}  -  ${blueScore}`, W / 2, 70);

      ctx!.font = '700 14px "Bebas Neue", Impact, sans-serif';
      ctx!.fillStyle = 'rgba(255,255,255,0.5)';
      ctx!.fillText('LOOPGATE  •  EDIT BATTLE', W / 2, 24);
    }

    function drawOutro(p: number) {
      ctx!.fillStyle = '#000'; ctx!.fillRect(0, 0, W, H);
      const winnerName = winnerSide === 'red' ? redUsername : winnerSide === 'blue' ? blueUsername : null;
      const winnerColor = winnerSide === 'red' ? '#ef4444' : winnerSide === 'blue' ? '#3b82f6' : '#fff';

      ctx!.globalAlpha = Math.min(1, p * 2);
      ctx!.textAlign = 'center';
      ctx!.fillStyle = 'rgba(255,255,255,0.5)';
      ctx!.font = '700 26px "Bebas Neue", Impact, sans-serif';
      ctx!.fillText(winnerName ? 'WINNER' : 'AWAITING JUDGE', W / 2, H / 2 - 80);

      if (winnerName) {
        ctx!.fillStyle = winnerColor;
        ctx!.font = '900 96px "Bebas Neue", Impact, sans-serif';
        ctx!.shadowColor = winnerColor + 'aa'; ctx!.shadowBlur = 40;
        ctx!.fillText(winnerName.toUpperCase(), W / 2, H / 2 + 10);
        ctx!.shadowBlur = 0;
        ctx!.fillStyle = '#fff';
        ctx!.font = '900 64px "Bebas Neue", Impact, sans-serif';
        ctx!.fillText(`${redScore}  -  ${blueScore}`, W / 2, H / 2 + 90);
      }

      ctx!.fillStyle = 'rgba(255,255,255,0.7)';
      ctx!.font = '900 38px "Bebas Neue", Impact, sans-serif';
      ctx!.fillText('LOOPGATE.IO', W / 2, H - 120);
      ctx!.fillStyle = 'rgba(255,255,255,0.35)';
      ctx!.font = '700 18px "Bebas Neue", Impact, sans-serif';
      ctx!.fillText('JOIN THE NEXT BATTLE', W / 2, H - 90);
      ctx!.globalAlpha = 1;
    }

    function drawCover(v: HTMLVideoElement, x: number, y: number, w: number, h: number) {
      const vw = v.videoWidth || 16, vh = v.videoHeight || 9;
      const vr = vw / vh, dr = w / h;
      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (vr > dr) { sw = vh * dr; sx = (vw - sw) / 2; }
      else { sh = vw / dr; sy = (vh - sh) / 2; }
      try { ctx!.drawImage(v, sx, sy, sw, sh, x, y, w, h); } catch {}
    }

    await new Promise<void>((resolve) => {
      const tick = () => {
        if (cancelRef.current) { resolve(); return; }
        const elapsed = performance.now() - t0;
        setProgress(Math.min(1, elapsed / TOTAL));

        if (elapsed < INTRO_MS) {
          drawIntro(elapsed / INTRO_MS);
        } else if (elapsed < INTRO_MS + PLAY_MS) {
          startPlayback();
          drawBattle();
        } else if (elapsed < TOTAL) {
          drawOutro((elapsed - INTRO_MS - PLAY_MS) / OUTRO_MS);
        } else {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    red.pause(); blue.pause();
    recorder.stop();
    await new Promise<void>((r) => { recorder.onstop = () => r(); });
    try { actx?.close(); } catch {}

    const blob = new Blob(chunks, { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loopgate-battle-${redUsername}-vs-${blueUsername}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);

    setExporting(false);
    setProgress(0);
    toast.success('Clip downloaded — ready for TikTok 🎬');
  }, [redUrl, blueUrl, redUsername, blueUsername, redScore, blueScore, winnerSide, exporting]);

  return (
    <button
      onClick={run}
      disabled={exporting}
      title="Download battle clip"
      className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors touch-manipulation disabled:opacity-60"
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[10px] tabular-nums">{Math.round(progress * 100)}%</span>
        </>
      ) : (
        <Download className="w-4 h-4" />
      )}
    </button>
  );
}
