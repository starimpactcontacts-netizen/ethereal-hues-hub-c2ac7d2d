import { useState } from 'react';
import { Download, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Props {
  player1Username: string;
  player2Username: string;
  fightId?: string;
}

// Vertical 9:16 for TikTok / Reels / Shorts. Small + sharp.
const W = 540;
const H = 960;
const FPS = 30;
const DURATION = 2.5; // seconds — short = high completion rate

function pickMime(): { mime: string; ext: string } {
  const candidates: { mime: string; ext: string }[] = [
    { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  for (const c of candidates) {
    // @ts-ignore
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c.mime)) return c;
  }
  return { mime: '', ext: 'webm' };
}

async function loadFonts(): Promise<void> {
  try {
    // @ts-ignore
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('700 96px Teko'),
        document.fonts.load('500 32px Teko'),
        document.fonts.load('600 28px Inter'),
      ]);
    }
  } catch {}
}

// Easing
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function drawVerifiedBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  // X-style blue checkmark badge
  ctx.save();
  ctx.fillStyle = '#1d9bf0';
  ctx.beginPath();
  // 8-point starburst (approx)
  const points = 16;
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = i % 2 === 0 ? size : size * 0.86;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Check
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(2, size * 0.22);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.38, cy + size * 0.02);
  ctx.lineTo(cx - size * 0.08, cy + size * 0.32);
  ctx.lineTo(cx + size * 0.42, cy - size * 0.28);
  ctx.stroke();
  ctx.restore();
}

function drawHeader(ctx: CanvasRenderingContext2D, t: number, headerY: number) {
  // "VOTE FOR ME" with shimmer sweep
  ctx.save();
  const txt = 'VOTE FOR ME';
  ctx.font = '700 96px Teko, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Slight rise-in on first 0.4s
  const rise = t < 0.25 ? (1 - easeOut(t / 0.25)) * 18 : 0;

  ctx.fillStyle = '#fff';
  ctx.fillText(txt, W / 2, headerY + rise);

  // Shimmer sweep
  const sweepX = -W + (t * (W * 2.4)) % (W * 2.4);
  const grad = ctx.createLinearGradient(sweepX, 0, sweepX + 180, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = grad;
  ctx.fillRect(0, headerY - 60, W, 120);
  ctx.restore();

  // Subtitle
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '500 28px Teko, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '6px' as any;
  ctx.fillText('LIVE ON LOOPGATE.IO', W / 2, headerY + 60);
  ctx.restore();
}

function drawSide(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  side: 'red' | 'blue',
  username: string,
  highlight: number, // 0..1 alternating attention pulse
  enterT: number, // 0..1 enter animation
) {
  const isRed = side === 'red';
  const base = isRed ? [239, 68, 68] : [59, 130, 246];

  // Enter slide from outside
  const offset = (1 - easeOut(enterT)) * (isRed ? -60 : 60);
  ctx.save();
  ctx.translate(offset, 0);
  ctx.globalAlpha = easeOut(enterT);

  // Card background
  const rad = 24;
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, `rgba(${base.join(',')},${0.22 + highlight * 0.18})`);
  g.addColorStop(1, 'rgba(10,10,10,0.95)');
  roundRect(ctx, x, y, w, h, rad);
  ctx.fillStyle = g;
  ctx.fill();

  // Border (pulsing)
  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(${base.join(',')},${0.5 + highlight * 0.5})`;
  ctx.stroke();

  // Glow when highlighted
  if (highlight > 0.05) {
    ctx.save();
    ctx.shadowColor = `rgba(${base.join(',')},${highlight})`;
    ctx.shadowBlur = 40 * highlight;
    ctx.strokeStyle = `rgba(${base.join(',')},${highlight * 0.9})`;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, rad);
    ctx.stroke();
    ctx.restore();
  }

  // Side label
  ctx.fillStyle = `rgba(${base.join(',')},0.95)`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '500 26px Teko, Impact, sans-serif';
  ctx.fillText(side.toUpperCase(), x + w / 2, y + 36);

  // Username + verified badge
  const uname = '@' + (username || 'editor').slice(0, 14);
  ctx.fillStyle = '#fff';
  ctx.font = '700 56px Teko, Impact, sans-serif';
  const unameMetrics = ctx.measureText(uname);
  const unameW = unameMetrics.width;
  const unameCY = y + h / 2 + 4;

  ctx.fillText(uname, x + w / 2, unameCY);

  // Verified badge to the right of the name
  const badgeSize = 14;
  const badgeX = x + w / 2 + unameW / 2 + badgeSize + 6;
  const badgeY = unameCY - 2;
  drawVerifiedBadge(ctx, badgeX, badgeY, badgeSize);

  // "TAP TO VOTE" small CTA
  ctx.fillStyle = `rgba(${base.join(',')},${0.6 + highlight * 0.4})`;
  ctx.font = '500 22px Teko, Impact, sans-serif';
  ctx.fillText('TAP TO VOTE', x + w / 2, y + h - 32);

  // Finger tap indicator when highlighted strongly
  if (highlight > 0.6) {
    const rings = 3;
    for (let i = 0; i < rings; i++) {
      const phase = (highlight - 0.6) / 0.4;
      const r = 18 + i * 16 + phase * 14;
      const a = (1 - phase) * 0.4 - i * 0.1;
      if (a > 0) {
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2 - 30, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  p1: string,
  p2: string,
) {
  const t = Math.min(elapsed / DURATION, 1);

  // BG — true black
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Subtle drifting radial accents (red left, blue right)
  const drift = Math.sin(elapsed * 1.2) * 20;
  const rg = ctx.createRadialGradient(120 + drift, H * 0.55, 40, 120 + drift, H * 0.55, 380);
  rg.addColorStop(0, 'rgba(239,68,68,0.18)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W - 120 - drift, H * 0.55, 40, W - 120 - drift, H * 0.55, 380);
  bg.addColorStop(0, 'rgba(59,130,246,0.18)');
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Top hairline + LIVE pip
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(40, 60, W - 80, 1);

  // Header
  const headerY = 200;
  drawHeader(ctx, t, headerY);

  // Sides
  const cardPad = 36;
  const cardGap = 18;
  const cardY = 340;
  const cardH = 360;
  const cardW = (W - cardPad * 2 - cardGap) / 2;

  // Alternating attention pulse on each side
  const cycle = (elapsed % 1.4) / 1.4; // 0..1
  const redHi = cycle < 0.5 ? Math.sin((cycle / 0.5) * Math.PI) : 0;
  const blueHi = cycle >= 0.5 ? Math.sin(((cycle - 0.5) / 0.5) * Math.PI) : 0;

  // Each side enters between 0.15-0.55s
  const enter1 = Math.min(1, Math.max(0, (elapsed - 0.15) / 0.4));
  const enter2 = Math.min(1, Math.max(0, (elapsed - 0.25) / 0.4));

  drawSide(ctx, cardPad, cardY, cardW, cardH, 'red', p1, redHi, enter1);
  drawSide(ctx, cardPad + cardW + cardGap, cardY, cardW, cardH, 'blue', p2, blueHi, enter2);

  // Center VS chip — appears at 0.4s
  const vsT = Math.min(1, Math.max(0, (elapsed - 0.4) / 0.35));
  if (vsT > 0) {
    const vsScale = easeOut(vsT);
    const vsCX = W / 2;
    const vsCY = cardY + cardH / 2;
    ctx.save();
    ctx.translate(vsCX, vsCY);
    ctx.scale(vsScale, vsScale);
    ctx.fillStyle = '#000';
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 28px Teko, Impact, sans-serif';
    ctx.fillText('VS', 0, 2);
    ctx.restore();
  }

  // Footer CTA — "loopgate.io" prominent
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.font = '700 54px Teko, Impact, sans-serif';
  ctx.fillText('LOOPGATE.IO', W / 2, H - 130);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '500 24px Teko, Impact, sans-serif';
  ctx.fillText('WHERE EDITORS BATTLE', W / 2, H - 80);
  ctx.restore();
}

export default function BattleOutroButton({ player1Username, player2Username }: Props) {
  const [generating, setGenerating] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [lastExt, setLastExt] = useState<string>('mp4');

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      await loadFonts();

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D unavailable');

      // @ts-ignore
      const stream = canvas.captureStream(FPS);
      const { mime, ext } = pickMime();
      if (typeof MediaRecorder === 'undefined') throw new Error('Recording not supported on this device');

      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 1_800_000 } : undefined);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime || 'video/webm' }));
      });

      recorder.start();

      const start = performance.now();
      await new Promise<void>((resolve) => {
        const tick = () => {
          const elapsed = (performance.now() - start) / 1000;

          drawFrame(ctx, elapsed, player1Username, player2Username);

          // Fade in 0-0.3s, fade out last 0.35s
          let alpha = 1;
          if (elapsed < 0.3) alpha = elapsed / 0.3;
          else if (elapsed > DURATION - 0.35) alpha = Math.max(0, (DURATION - elapsed) / 0.35);
          if (alpha < 1) {
            ctx.fillStyle = `rgba(0,0,0,${1 - alpha})`;
            ctx.fillRect(0, 0, W, H);
          }

          if (elapsed >= DURATION) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      recorder.stop();
      const blob = await done;
      if (blob.size === 0) throw new Error('Empty recording');

      const url = URL.createObjectURL(blob);
      setLastUrl(url);
      setLastExt(ext);

      const a = document.createElement('a');
      a.href = url;
      a.download = `loopgate-vote-for-me.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success('Promo clip downloaded — splice it onto your edit 🔥');
      setInstructionsOpen(true);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Could not generate clip');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={generating}
        size="sm"
        className="w-full bg-white text-black hover:bg-white/90 font-display uppercase tracking-wider text-xs"
      >
        {generating ? (
          <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Generating clip…</>
        ) : (
          <><Download className="w-3.5 h-3.5 mr-2" /> Download "Vote For Me" Clip</>
        )}
      </Button>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="bg-black border border-white/10 text-white max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">Clip ready</DialogTitle>
            <DialogDescription className="text-white/60 text-xs">
              Splice this 2.5s outro onto the end of your TikTok / Reel. Every view = votes back to your battle.
            </DialogDescription>
          </DialogHeader>

          {lastUrl && (
            <div className="mx-auto" style={{ maxWidth: 220 }}>
              <video
                src={lastUrl}
                className="w-full rounded-lg border border-white/10 bg-black"
                style={{ aspectRatio: '9/16' }}
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          )}

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-white/70 flex gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 text-white/50 mt-0.5" />
            <div>
              If it didn't save, long-press the preview and choose <span className="text-white">Save Video</span>.
            </div>
          </div>

          <div className="flex gap-2">
            {lastUrl && (
              <a
                href={lastUrl}
                download={`loopgate-vote-for-me.${lastExt}`}
                className="flex-1 inline-flex items-center justify-center bg-white text-black hover:bg-white/90 font-display uppercase tracking-wider text-xs h-9 rounded-md"
              >
                <Download className="w-3.5 h-3.5 mr-2" /> Save again
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-white/15 bg-transparent text-white hover:bg-white/5"
              onClick={() => setInstructionsOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
