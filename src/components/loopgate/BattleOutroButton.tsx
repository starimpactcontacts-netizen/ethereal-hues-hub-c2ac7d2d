import { useState } from 'react';
import { Download, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  player1Username: string;
  player2Username: string;
  player1Id: string;
  player2Id: string;
  player1Avatar?: string | null;
  player2Avatar?: string | null;
  fightId: string;
}

const SIZE = 1080;
const FPS = 30;
const INTRO_FRAMES = 60;   // 2.0s VS
const PER_MSG_FRAMES = 20; // 0.66s per message
const OUTRO_FRAMES = 20;   // 0.66s linger
const MAX_MESSAGES = 6;

interface Msg {
  user_id: string;
  username: string;
  avatar_url: string | null;
  message_text: string;
}

async function loadFonts(): Promise<void> {
  try {
    // @ts-ignore
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('700 220px Teko'),
        document.fonts.load('700 140px Teko'),
        document.fonts.load('700 96px Teko'),
        document.fonts.load('500 36px Teko'),
        document.fonts.load('400 34px Inter'),
        document.fonts.load('600 30px Inter'),
      ]);
    }
  } catch {}
}

const avatarCache = new Map<string, HTMLImageElement | null>();
async function loadAvatar(url: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!url) return null;
  if (avatarCache.has(url)) return avatarCache.get(url) || null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { avatarCache.set(url, img); resolve(img); };
    img.onerror = () => { avatarCache.set(url, null); resolve(null); };
    img.src = url;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawAvatarCircle(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, cx: number, cy: number, r: number, color: string, initial: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${r}px Teko, Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial.toUpperCase(), cx, cy + 2);
  }
  ctx.restore();
  // ring
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

function drawBackground(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Red/blue split radial glows that breathe
  const pulse = 0.85 + Math.sin(frame * 0.18) * 0.15;
  const rg = ctx.createRadialGradient(80, SIZE / 2, 40, 80, SIZE / 2, 900);
  rg.addColorStop(0, `rgba(239,68,68,${0.35 * pulse})`);
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const bg = ctx.createRadialGradient(SIZE - 80, SIZE / 2, 40, SIZE - 80, SIZE / 2, 900);
  bg.addColorStop(0, `rgba(59,130,246,${0.35 * pulse})`);
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Subtle scanlines
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let y = 0; y < SIZE; y += 4) ctx.fillRect(0, y, SIZE, 1);

  // Diagonal split line
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);
  ctx.rotate(Math.PI / 2);
  const grad = ctx.createLinearGradient(-SIZE / 2, 0, SIZE / 2, 0);
  grad.addColorStop(0, 'rgba(239,68,68,0.6)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(59,130,246,0.6)');
  ctx.fillStyle = grad;
  ctx.fillRect(-SIZE / 2, -1, SIZE, 2);
  ctx.restore();
}

function drawWatermark(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.font = '700 36px Teko, Impact, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('LOOPGATE.IO', SIZE - 36, SIZE - 28);
  ctx.restore();
}

function drawIntro(
  ctx: CanvasRenderingContext2D,
  frame: number,
  p1: string,
  p2: string,
  p1Avatar: HTMLImageElement | null,
  p2Avatar: HTMLImageElement | null,
) {
  drawBackground(ctx, frame);

  const t = clamp01(frame / INTRO_FRAMES);
  const e = easeOut(t);

  // Glitch shake in first 12 frames
  const shake = frame < 12 ? (Math.random() - 0.5) * 10 : 0;

  // Left/right slide for avatars + names
  const slideLeft = -200 + e * 200;
  const slideRight = 200 - e * 200;

  // RED side
  ctx.save();
  ctx.translate(SIZE * 0.25 + slideLeft + shake, SIZE / 2);
  drawAvatarCircle(ctx, p1Avatar, 0, -60, 110, '#ef4444', (p1[0] || 'R'));
  ctx.fillStyle = '#fff';
  ctx.font = '700 64px Teko, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('@' + p1.slice(0, 14), 0, 100);
  ctx.fillStyle = '#ef4444';
  ctx.font = '700 38px Teko, Impact, sans-serif';
  ctx.fillText('RED', 0, 160);
  ctx.restore();

  // BLUE side
  ctx.save();
  ctx.translate(SIZE * 0.75 + slideRight - shake, SIZE / 2);
  drawAvatarCircle(ctx, p2Avatar, 0, -60, 110, '#3b82f6', (p2[0] || 'B'));
  ctx.fillStyle = '#fff';
  ctx.font = '700 64px Teko, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('@' + p2.slice(0, 14), 0, 100);
  ctx.fillStyle = '#3b82f6';
  ctx.font = '700 38px Teko, Impact, sans-serif';
  ctx.fillText('BLUE', 0, 160);
  ctx.restore();

  // VS in center with scale + glitch
  const vsScale = 0.4 + easeOut(clamp01((frame - 10) / 30)) * 0.8;
  const vsOpacity = clamp01((frame - 10) / 20);
  ctx.save();
  ctx.globalAlpha = vsOpacity;
  ctx.translate(SIZE / 2 + shake * 0.5, SIZE / 2 - 50);
  ctx.scale(vsScale, vsScale);
  // glow
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#fff';
  ctx.font = '700 240px Teko, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', 0, 0);
  ctx.restore();

  // Top header
  ctx.save();
  ctx.globalAlpha = clamp01((frame - 20) / 20);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '700 56px Teko, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EDIT BATTLE', SIZE / 2, 110);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '500 30px Teko, Impact, sans-serif';
  ctx.fillText('LIVE ON LOOPGATE.IO', SIZE / 2, 160);
  ctx.restore();

  drawWatermark(ctx);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function drawChat(
  ctx: CanvasRenderingContext2D,
  frame: number,
  messages: Msg[],
  p1Id: string,
  p1Avatar: HTMLImageElement | null,
  p2Avatar: HTMLImageElement | null,
) {
  drawBackground(ctx, frame);

  // Header
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '700 60px Teko, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TRASH TALK', SIZE / 2, 100);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 28px Teko, Impact, sans-serif';
  ctx.fillText('PRE-FIGHT — BATTLE CHAT', SIZE / 2, 145);
  ctx.restore();

  // Show messages up to the current frame
  const chatStart = INTRO_FRAMES;
  const relFrame = frame - chatStart;

  const startY = 220;
  const slotH = 110;

  for (let i = 0; i < messages.length; i++) {
    const msgFrame = relFrame - i * PER_MSG_FRAMES;
    if (msgFrame < 0) break;
    const t = clamp01(msgFrame / 12);
    const e = easeOut(t);

    const m = messages[i];
    const isRed = m.user_id === p1Id;
    const baseColor = isRed ? [239, 68, 68] : [59, 130, 246];

    const y = startY + i * slotH;
    const slideFrom = isRed ? -300 : 300;
    const slide = slideFrom * (1 - e);
    const alpha = e;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(slide, 0);

    const avatarR = 38;
    const avatarCX = isRed ? 80 + avatarR : SIZE - 80 - avatarR;
    const avatarCY = y + 48;
    drawAvatarCircle(
      ctx,
      isRed ? p1Avatar : p2Avatar,
      avatarCX, avatarCY, avatarR,
      `rgb(${baseColor.join(',')})`,
      m.username[0] || (isRed ? 'R' : 'B'),
    );

    // Bubble
    const bubbleMaxW = SIZE - 80 - 80 - avatarR * 2 - 28 - 40;
    const padX = 22, padY = 14;
    ctx.font = '500 32px Inter, system-ui, sans-serif';
    const lines = wrapText(ctx, m.message_text, bubbleMaxW);
    const lineH = 40;
    const textW = Math.min(bubbleMaxW, Math.max(...lines.map(l => ctx.measureText(l).width)));
    const bubbleW = textW + padX * 2;
    const bubbleH = lines.length * lineH + padY * 2 + 28;
    const bubbleX = isRed ? avatarCX + avatarR + 18 : SIZE - 80 - avatarR * 2 - 18 - bubbleW + avatarR * 2 - 18;
    // simpler: align bubble next to avatar
    const bx = isRed ? avatarCX + avatarR + 18 : avatarCX - avatarR - 18 - bubbleW;
    const by = y;

    // Bubble fill (tinted)
    const grad = ctx.createLinearGradient(bx, by, bx, by + bubbleH);
    grad.addColorStop(0, `rgba(${baseColor.join(',')},0.35)`);
    grad.addColorStop(1, `rgba(${baseColor.join(',')},0.12)`);
    roundRect(ctx, bx, by, bubbleW, bubbleH, 18);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(${baseColor.join(',')},0.9)`;
    ctx.shadowColor = `rgba(${baseColor.join(',')},0.6)`;
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Username
    ctx.fillStyle = `rgb(${baseColor.join(',')})`;
    ctx.font = '700 26px Teko, Impact, sans-serif';
    ctx.textAlign = isRed ? 'left' : 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('@' + m.username.slice(0, 14), isRed ? bx + padX : bx + bubbleW - padX, by + padY - 4);

    // Message lines
    ctx.fillStyle = '#fff';
    ctx.font = '500 32px Inter, system-ui, sans-serif';
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, isRed ? bx + padX : bx + bubbleW - padX, by + padY + 28 + idx * lineH);
    });

    ctx.restore();
  }

  drawWatermark(ctx);
}

function pickMimeType(): { mime: string; ext: string } {
  const candidates: { mime: string; ext: string }[] = [
    { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  for (const c of candidates) {
    if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return { mime: '', ext: 'webm' };
}

export default function BattleOutroButton({
  player1Username, player2Username,
  player1Id, player2Id,
  player1Avatar, player2Avatar,
  fightId,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [lastExt, setLastExt] = useState<string>('mp4');

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      await loadFonts();

      // 1) Fetch last 6 battle-chat messages (red vs blue only)
      const { data: rawMsgs } = await supabase
        .from('quick_fight_messages')
        .select('user_id, username, avatar_url, message_text, is_system, created_at')
        .eq('fight_id', fightId)
        .eq('is_system', false)
        .in('user_id', [player1Id, player2Id].filter(Boolean))
        .order('created_at', { ascending: false })
        .limit(MAX_MESSAGES);

      const messages: Msg[] = ((rawMsgs || []) as any[])
        .reverse()
        .map(m => ({
          user_id: m.user_id,
          username: m.username || (m.user_id === player1Id ? player1Username : player2Username),
          avatar_url: m.avatar_url,
          message_text: (m.message_text || '').slice(0, 120),
        }));

      // Fallback hype lines if no messages
      if (messages.length === 0) {
        messages.push(
          { user_id: player1Id, username: player1Username, avatar_url: player1Avatar || null, message_text: 'You ready?' },
          { user_id: player2Id, username: player2Username, avatar_url: player2Avatar || null, message_text: "Let's go." },
        );
      }

      // 2) Preload avatars
      const uniqAvatars = new Map<string, string | null>();
      uniqAvatars.set(player1Id, player1Avatar || null);
      uniqAvatars.set(player2Id, player2Avatar || null);
      for (const m of messages) if (!uniqAvatars.has(m.user_id)) uniqAvatars.set(m.user_id, m.avatar_url);
      const avatarMap = new Map<string, HTMLImageElement | null>();
      await Promise.all([...uniqAvatars.entries()].map(async ([id, url]) => {
        avatarMap.set(id, await loadAvatar(url));
      }));
      const p1A = avatarMap.get(player1Id) || null;
      const p2A = avatarMap.get(player2Id) || null;

      // 3) Setup canvas + recorder
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D unavailable');

      const stream = (canvas as any).captureStream(FPS) as MediaStream;
      const { mime, ext } = pickMimeType();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 5_000_000 } : undefined);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime || 'video/webm' }));
      });

      recorder.start();

      const totalFrames = INTRO_FRAMES + messages.length * PER_MSG_FRAMES + OUTRO_FRAMES;
      const frameMs = 1000 / FPS;
      const startedAt = performance.now();

      for (let f = 0; f < totalFrames; f++) {
        if (f < INTRO_FRAMES) {
          drawIntro(ctx, f, player1Username, player2Username, p1A, p2A);
        } else {
          // Build a per-message avatar resolver
          drawChat(ctx, f, messages, player1Id, p1A, p2A);
        }
        // Force the captured stream to advance in real-ish time
        const targetT = startedAt + (f + 1) * frameMs;
        const wait = targetT - performance.now();
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
      }

      // Small tail to flush last frame
      await new Promise(r => setTimeout(r, 120));
      recorder.stop();
      const blob = await done;

      const url = URL.createObjectURL(blob);
      setLastUrl(url);
      setLastExt(ext);

      const a = document.createElement('a');
      a.href = url;
      a.download = `loopgate-battle-intro.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success('Battle intro saved — drop it on your post 🔥');
      setOpen(true);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Could not generate intro');
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
          <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Rendering intro…</>
        ) : (
          <><Download className="w-3.5 h-3.5 mr-2" /> Download Battle Intro</>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black border border-white/10 text-white max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">Intro ready</DialogTitle>
            <DialogDescription className="text-white/60 text-xs">
              Splice it onto the start of your edit. Square 1080×1080 — works on IG, TikTok, YouTube, X.
            </DialogDescription>
          </DialogHeader>

          {lastUrl && (
            <div className="mx-auto" style={{ maxWidth: 280 }}>
              <video
                src={lastUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded-lg border border-white/10 bg-black aspect-square object-contain"
              />
            </div>
          )}

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-white/70 flex gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 text-white/50 mt-0.5" />
            <div>
              {lastExt === 'mp4'
                ? <>Saved as MP4. If it didn't save, long-press the preview and choose <span className="text-white">Save Video</span>.</>
                : <>Saved as WebM (your browser doesn't support MP4 recording). Most editors (CapCut, Premiere, DaVinci) import WebM directly.</>}
            </div>
          </div>

          <div className="flex gap-2">
            {lastUrl && (
              <a
                href={lastUrl}
                download={`loopgate-battle-intro.${lastExt}`}
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
