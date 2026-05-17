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

// Square 1:1 — works everywhere (IG post, TikTok overlay, X, story-safe)
const SIZE = 1080;

async function loadFonts(): Promise<void> {
  try {
    // @ts-ignore
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('700 140px Teko'),
        document.fonts.load('700 110px Teko'),
        document.fonts.load('500 36px Teko'),
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

function drawSide(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  side: 'red' | 'blue',
) {
  const isRed = side === 'red';
  const base = isRed ? [239, 68, 68] : [59, 130, 246];
  const rad = 36;

  // Gradient fill
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, `rgba(${base.join(',')},0.55)`);
  g.addColorStop(1, `rgba(${base.join(',')},0.15)`);
  roundRect(ctx, x, y, w, h, rad);
  ctx.fillStyle = g;
  ctx.fill();

  // Border
  ctx.lineWidth = 3;
  ctx.strokeStyle = `rgba(${base.join(',')},0.95)`;
  ctx.stroke();

  // Side label (top)
  ctx.fillStyle = `rgba(${base.join(',')},1)`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '500 40px Teko, Impact, sans-serif';
  ctx.fillText(side.toUpperCase(), x + w / 2, y + 56);

  // CTA (bottom)
  ctx.fillStyle = `rgba(${base.join(',')},0.95)`;
  ctx.font = '500 32px Teko, Impact, sans-serif';
  ctx.fillText('TAP TO VOTE', x + w / 2, y + h - 44);
}

function drawFrame(ctx: CanvasRenderingContext2D, p1: string, p2: string) {
  // BG
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Radial accents
  const rg = ctx.createRadialGradient(220, SIZE * 0.6, 60, 220, SIZE * 0.6, 620);
  rg.addColorStop(0, 'rgba(239,68,68,0.22)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const bg = ctx.createRadialGradient(SIZE - 220, SIZE * 0.6, 60, SIZE - 220, SIZE * 0.6, 620);
  bg.addColorStop(0, 'rgba(59,130,246,0.22)');
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Top hairline
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(80, 90, SIZE - 160, 1);

  // Header
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.font = '700 150px Teko, Impact, sans-serif';
  ctx.fillText('VOTE FOR ME', SIZE / 2, 200);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '500 34px Teko, Impact, sans-serif';
  ctx.fillText('LIVE ON LOOPGATE.IO', SIZE / 2, 290);
  ctx.restore();

  // Sides
  const cardPad = 70;
  const cardGap = 28;
  const cardY = 360;
  const cardH = 460;
  const cardW = (SIZE - cardPad * 2 - cardGap) / 2;

  drawSide(ctx, cardPad, cardY, cardW, cardH, 'red');
  drawSide(ctx, cardPad + cardW + cardGap, cardY, cardW, cardH, 'blue');

  // Usernames — drawn after cards so we can place verified badges
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 88px Teko, Impact, sans-serif';
  const unameCY = cardY + cardH / 2;

  const drawName = (cx: number, name: string) => {
    const uname = '@' + (name || 'editor').slice(0, 12);
    const metrics = ctx.measureText(uname);
    const w = metrics.width;
    ctx.fillStyle = '#fff';
    // shift name slightly left so badge fits inside card
    const nameCX = cx - 18;
    ctx.fillText(uname, nameCX, unameCY);
    const badgeSize = 22;
    const badgeX = nameCX + w / 2 + badgeSize + 10;
    drawVerifiedBadge(ctx, badgeX, unameCY - 4, badgeSize);
  };

  drawName(cardPad + cardW / 2, p1);
  drawName(cardPad + cardW + cardGap + cardW / 2, p2);
  ctx.restore();

  // VS chip in center
  const vsCX = SIZE / 2;
  const vsCY = cardY + cardH / 2;
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(vsCX, vsCY, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 38px Teko, Impact, sans-serif';
  ctx.fillText('VS', vsCX, vsCY + 3);
  ctx.restore();

  // Footer brand lockup
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.font = '700 84px Teko, Impact, sans-serif';
  ctx.fillText('LOOPGATE.IO', SIZE / 2, SIZE - 130);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '500 32px Teko, Impact, sans-serif';
  ctx.fillText('WHERE EDITORS BATTLE', SIZE / 2, SIZE - 70);
  ctx.restore();
}

export default function BattleOutroButton({ player1Username, player2Username }: Props) {
  const [generating, setGenerating] = useState(false);
  const [open, setOpen] = useState(false);
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

      drawFrame(ctx, player1Username, player2Username);

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encode failed'))), 'image/png')
      );

      const url = URL.createObjectURL(blob);
      setLastUrl(url);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'loopgate-vote-for-me.png';
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success('Saved — drop it on your post 🔥');
      setOpen(true);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Could not generate image');
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
          <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Generating…</>
        ) : (
          <><Download className="w-3.5 h-3.5 mr-2" /> Download "Vote For Me" Image</>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black border border-white/10 text-white max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">Image ready</DialogTitle>
            <DialogDescription className="text-white/60 text-xs">
              Post it as your IG story, TikTok cover, or splice onto your edit. Every view = votes back to your battle.
            </DialogDescription>
          </DialogHeader>

          {lastUrl && (
            <div className="mx-auto" style={{ maxWidth: 260 }}>
              <img
                src={lastUrl}
                alt="Vote For Me promo"
                className="w-full rounded-lg border border-white/10 bg-black aspect-square object-contain"
              />
            </div>
          )}

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-white/70 flex gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 text-white/50 mt-0.5" />
            <div>If it didn't save, long-press the preview and choose <span className="text-white">Save Image</span>.</div>
          </div>

          <div className="flex gap-2">
            {lastUrl && (
              <a
                href={lastUrl}
                download="loopgate-vote-for-me.png"
                className="flex-1 inline-flex items-center justify-center bg-white text-black hover:bg-white/90 font-display uppercase tracking-wider text-xs h-9 rounded-md"
              >
                <Download className="w-3.5 h-3.5 mr-2" /> Save again
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-white/15 bg-transparent text-white hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}