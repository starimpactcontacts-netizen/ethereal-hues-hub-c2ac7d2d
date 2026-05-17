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

const SIZE = 720;
const FPS = 30;
const DURATION = 3; // seconds
const TOTAL_FRAMES = FPS * DURATION;

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

async function loadTeko(): Promise<void> {
  try {
    // @ts-ignore
    if (document.fonts) await document.fonts.load('700 120px Teko');
  } catch {}
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  t: number, // 0..1 progress
  p1: string,
  p2: string,
) {
  const W = SIZE, H = SIZE;
  // Background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Subtle vignette
  const grad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7);
  grad.addColorStop(0, 'rgba(255,255,255,0.03)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Header — VOTE IN LOOPGATE.IO
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 76px Teko, Impact, sans-serif';
  ctx.letterSpacing = '4px' as any;
  ctx.fillText('VOTE IN LOOPGATE.IO', W / 2, 90);

  // Card area
  const cardX = 40, cardY = 160, cardW = W - 80, cardH = 440;
  // Card border
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  // Card header bar
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  ctx.fillRect(cardX, cardY, cardW, 60);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.moveTo(cardX, cardY + 60);
  ctx.lineTo(cardX + cardW, cardY + 60);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.font = '500 36px Teko, Impact, sans-serif';
  ctx.fillText('WHO WON?', cardX + 24, cardY + 32);

  // Live dot + votes
  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.arc(cardX + cardW - 130, cardY + 30, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a1a1aa';
  ctx.textAlign = 'left';
  ctx.font = '400 28px Teko, Impact, sans-serif';
  ctx.fillText('LIVE VOTING', cardX + cardW - 115, cardY + 32);

  // Two sides
  const padding = 12;
  const sideY = cardY + 60 + padding;
  const sideH = cardH - 60 - padding * 2;
  const sideW = (cardW - padding * 3) / 2;

  // Pulse intensity based on time
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 4);

  // RED side
  const redX = cardX + padding;
  drawSide(ctx, redX, sideY, sideW, sideH, 'red', p1, pulse);
  // BLUE side
  const blueX = redX + sideW + padding;
  drawSide(ctx, blueX, sideY, sideW, sideH, 'blue', p2, pulse);

  // VS chip in center
  const vsCX = cardX + cardW / 2;
  const vsCY = sideY + sideH / 2;
  ctx.fillStyle = '#000';
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(vsCX, vsCY, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '500 38px Teko, Impact, sans-serif';
  ctx.fillText('VS', vsCX, vsCY + 2);

  // Footer
  const footY = cardY + cardH + 40;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'center';
  ctx.font = '500 34px Teko, Impact, sans-serif';
  ctx.fillText('TAP A SIDE TO VOTE', W / 2, footY);

  // Watermark
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '500 26px Teko, Impact, sans-serif';
  ctx.fillText('LOOPGATE.IO', W / 2, H - 30);
}

function drawSide(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  side: 'red' | 'blue',
  username: string,
  pulse: number,
) {
  const isRed = side === 'red';
  const baseColor = isRed ? [239, 68, 68] : [59, 130, 246];

  // Background gradient
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, `rgba(${baseColor.join(',')},${0.10 + pulse * 0.08})`);
  g.addColorStop(1, 'rgba(0,0,0,0.95)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  // Border
  ctx.strokeStyle = `rgba(${baseColor.join(',')},${0.45 + pulse * 0.25})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // Side label
  ctx.fillStyle = `rgba(${baseColor.join(',')},0.95)`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '500 30px Teko, Impact, sans-serif';
  ctx.fillText(side.toUpperCase(), x + w / 2, y + 46);

  // Percent placeholder — "0%"
  ctx.fillStyle = '#fff';
  ctx.font = '600 110px Teko, Impact, sans-serif';
  ctx.fillText('0', x + w / 2 - 18, y + h / 2 - 6);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '600 56px Teko, Impact, sans-serif';
  ctx.fillText('%', x + w / 2 + 36, y + h / 2 + 10);

  // Username
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '500 36px Teko, Impact, sans-serif';
  const uname = '@' + (username || 'editor').slice(0, 16);
  ctx.fillText(uname, x + w / 2, y + h - 80);

  // VOTES line
  ctx.fillStyle = 'rgba(161,161,170,0.9)';
  ctx.font = '400 24px Teko, Impact, sans-serif';
  ctx.fillText('0 VOTES', x + w / 2, y + h - 40);
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
      await loadTeko();

      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D unavailable');

      // @ts-ignore
      const stream = canvas.captureStream(FPS);
      const { mime, ext } = pickMime();
      if (typeof MediaRecorder === 'undefined') throw new Error('Recording not supported on this device');

      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2_500_000 } : undefined);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime || 'video/webm' }));
      });

      recorder.start();

      // Frame loop, driven by real time so MediaRecorder captures cleanly
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const tick = () => {
          const elapsed = (performance.now() - start) / 1000;
          const t = Math.min(elapsed / DURATION, 1);

          // Fade in 0-0.5s, fade out 2.5-3s
          let alpha = 1;
          if (elapsed < 0.5) alpha = elapsed / 0.5;
          else if (elapsed > 2.5) alpha = Math.max(0, 1 - (elapsed - 2.5) / 0.5);

          drawFrame(ctx, t, player1Username, player2Username);
          // Fade overlay
          if (alpha < 1) {
            ctx.fillStyle = `rgba(0,0,0,${1 - alpha})`;
            ctx.fillRect(0, 0, SIZE, SIZE);
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
      a.download = `loopgate-outro.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success('Outro downloaded — add it to the end of your edit 🔥');
      setInstructionsOpen(true);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Could not generate outro');
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
          <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Generating outro…</>
        ) : (
          <><Download className="w-3.5 h-3.5 mr-2" /> Download Outro</>
        )}
      </Button>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="bg-black border border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">Outro ready</DialogTitle>
            <DialogDescription className="text-white/60">
              Add this 3-second clip to the end of your TikTok / IG edit to drive votes back to your battle.
              Every view = more traffic 🔥
            </DialogDescription>
          </DialogHeader>

          {lastUrl && (
            <video
              src={lastUrl}
              className="w-full rounded-lg border border-white/10 bg-black"
              autoPlay
              loop
              muted
              playsInline
            />
          )}

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/70 flex gap-2">
            <Info className="w-4 h-4 shrink-0 text-white/50 mt-0.5" />
            <div>
              If the file didn't save, long-press the preview above and choose <span className="text-white">Save Video</span>,
              or screen-record while it plays, then add it after your edit before posting.
            </div>
          </div>

          <div className="flex gap-2">
            {lastUrl && (
              <a
                href={lastUrl}
                download={`loopgate-outro.${lastExt}`}
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
