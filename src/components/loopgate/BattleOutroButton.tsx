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

// Square 1080x1080 PNG — IG / X / TikTok / FB friendly
const SIZE = 1080;

async function loadFonts(): Promise<void> {
  try {
    // @ts-ignore
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('900 140px Teko'),
        document.fonts.load('700 90px Teko'),
        document.fonts.load('700 80px Teko'),
        document.fonts.load('500 30px Teko'),
      ]);
    }
  } catch {}
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

function drawVerifiedBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#1d9bf0';
  ctx.beginPath();
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

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  side: 'red' | 'blue',
  username: string,
) {
  const isRed = side === 'red';
  const base = isRed ? [239, 68, 68] : [59, 130, 246];

  const rad = 28;
  // Gradient fill — saturated top, fading toward black bottom
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, `rgba(${base.join(',')},0.55)`);
  g.addColorStop(1, 'rgba(10,10,10,0.95)');
  roundRect(ctx, x, y, w, h, rad);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = `rgba(${base.join(',')},0.95)`;
  ctx.stroke();

  // Side label (RED / BLUE)
  ctx.fillStyle = `rgba(${base.join(',')},0.95)`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 38px Teko, Impact, sans-serif';
  ctx.fillText(side.toUpperCase(), x + w / 2, y + 60);

  // Username + verified badge centered
  const uname = '@' + (username || 'editor').slice(0, 12);
  ctx.fillStyle = '#fff';
  ctx.font = '900 110px Teko, Impact, sans-serif';
  const unameW = ctx.measureText(uname).width;
  const unameCY = y + h / 2;
  const badgeSize = 28;
  const gap = 18;
  const totalW = unameW + gap + badgeSize * 2;
  const unameX = x + w / 2 - (badgeSize + gap) / 2;
  ctx.textAlign = 'center';
  ctx.fillText(uname, unameX, unameCY + 4);
  const badgeX = x + w / 2 + unameW / 2 - (badgeSize + gap) / 2 + gap + badgeSize;
  drawVerifiedBadge(ctx, badgeX, unameCY, badgeSize);

  // TAP TO VOTE
  ctx.fillStyle = `rgba(${base.join(',')},0.85)`;
  ctx.font = '700 32px Teko, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TAP TO VOTE', x + w / 2, y + h - 50);
}

function drawPoster(ctx: CanvasRenderingContext2D, p1: string, p2: string) {
  // Black BG with soft red/blue glow at the bottom
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const lg = ctx.createRadialGradient(SIZE * 0.22, SIZE * 0.7, 40, SIZE * 0.22, SIZE * 0.7, 600);
  lg.addColorStop(0, 'rgba(239,68,68,0.22)');
  lg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const rg = ctx.createRadialGradient(SIZE * 0.78, SIZE * 0.7, 40, SIZE * 0.78, SIZE * 0.7, 600);
  rg.addColorStop(0, 'rgba(59,130,246,0.22)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Top hairline
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(80, 90, SIZE - 160, 1);

  // VOTE FOR ME headline
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 180px Teko, Impact, sans-serif';
  ctx.fillText('VOTE FOR ME', SIZE / 2, 220);

  // Subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '500 36px Teko, Impact, sans-serif';
  ctx.fillText('LIVE ON LOOPGATE.IO', SIZE / 2, 305);

  // Cards
  const padX = 70;
  const gap = 32;
  const cardY = 380;
  const cardH = 460;
  const cardW = (SIZE - padX * 2 - gap) / 2;
  drawCard(ctx, padX, cardY, cardW, cardH, 'red', p1);
  drawCard(ctx, padX + cardW + gap, cardY, cardW, cardH, 'blue', p2);

  // Center VS chip
  const vsCX = SIZE / 2;
  const vsCY = cardY + cardH / 2;
  ctx.fillStyle = '#000';
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(vsCX, vsCY, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '700 44px Teko, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('vs', vsCX, vsCY + 3);

  // Footer
  ctx.fillStyle = '#fff';
  ctx.font = '900 110px Teko, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LOOPGATE.IO', SIZE / 2, SIZE - 130);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '500 32px Teko, Impact, sans-serif';
  ctx.fillText('WHERE EDITORS BATTLE', SIZE / 2, SIZE - 70);
}

export default function BattleOutroButton({ player1Username, player2Username }: Props) {
  const [generating, setGenerating] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      await loadFonts();

      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D unavailable');

      drawPoster(ctx, player1Username, player2Username);

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG export failed')), 'image/png', 1.0)
      );
      const url = URL.createObjectURL(blob);
      setLastUrl(url);

      const a = document.createElement('a');
      a.href = url;
      a.download = `loopgate-vote-for-me.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success('Poster saved — post it as your story 🔥');
      setInstructionsOpen(true);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Could not generate poster');
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
          <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Generating poster…</>
        ) : (
          <><Download className="w-3.5 h-3.5 mr-2" /> Download "Vote For Me" Poster</>
        )}
      </Button>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="bg-black border border-white/10 text-white max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">Poster ready</DialogTitle>
            <DialogDescription className="text-white/60 text-xs">
              Square 1080×1080 PNG. Post it as a story / tweet / IG post. Every view = votes back to your battle.
            </DialogDescription>
          </DialogHeader>

          {lastUrl && (
            <div className="mx-auto" style={{ maxWidth: 240 }}>
              <img src={lastUrl} alt="Vote for me poster" className="w-full rounded-lg border border-white/10 bg-black aspect-square object-contain" />
            </div>
          )}

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-white/70 flex gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 text-white/50 mt-0.5" />
            <div>
              If it didn't save, long-press the preview and choose <span className="text-white">Save Image</span>.
            </div>
          </div>

          <div className="flex gap-2">
            {lastUrl && (
              <a
                href={lastUrl}
                download={`loopgate-vote-for-me.png`}
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
