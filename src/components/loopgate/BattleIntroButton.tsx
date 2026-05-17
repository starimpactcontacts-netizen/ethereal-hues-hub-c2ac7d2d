import { useState } from 'react';
import { Download, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import countdownSfx from '@/assets/sounds/battle-countdown.m4a';

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

// Phase frames
const VS_FRAMES = 45;          // 1.5s
const MSG_COUNT = 4;
const PER_MSG_FRAMES = 21;     // 0.7s each = 2.8s
const HOLD_AFTER_CHAT = 9;     // 0.3s
const COUNTDOWN_FRAMES = 90;   // 3.0s synced to audio

const RED = '#ef4444';
const BLUE = '#3b82f6';

interface Msg { user_id: string; username: string; message_text: string; }

async function loadFonts() {
  try {
    // @ts-ignore
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('900 320px Teko'),
        document.fonts.load('900 200px Teko'),
        document.fonts.load('900 110px Teko'),
        document.fonts.load('700 64px Teko'),
        document.fonts.load('700 42px Inter'),
        document.fonts.load('600 38px Inter'),
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

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawAvatar(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, cx: number, cy: number, r: number, color: string, initial: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    // cover crop
    const ar = img.width / img.height;
    let dw = r * 2, dh = r * 2;
    if (ar > 1) { dw = r * 2 * ar; } else { dh = (r * 2) / ar; }
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${Math.floor(r * 1.1)}px Teko, Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial.toUpperCase(), cx, cy + 4);
  }
  ctx.restore();
  ctx.lineWidth = 8;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

// FLAT split background — solid red left, solid blue right, hard divider
function drawSplitBG(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, SIZE / 2, SIZE);
  ctx.fillStyle = BLUE;
  ctx.fillRect(SIZE / 2, 0, SIZE / 2, SIZE);
  // hard white divider
  ctx.fillStyle = '#fff';
  ctx.fillRect(SIZE / 2 - 4, 0, 8, SIZE);
}

function drawFlatBG(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

function drawWatermark(ctx: CanvasRenderingContext2D, color = 'rgba(255,255,255,0.85)') {
  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.font = '900 32px Teko, Impact, sans-serif';
  ctx.fillStyle = color;
  ctx.fillText('LOOPGATE.IO', SIZE - 40, SIZE - 36);
  ctx.restore();
}

function drawVS(ctx: CanvasRenderingContext2D, frame: number, p1: string, p2: string, p1A: HTMLImageElement | null, p2A: HTMLImageElement | null) {
  drawSplitBG(ctx);

  const t = clamp01(frame / 18);
  const e = easeOut(t);
  const slide = (1 - e) * 300;

  // Title
  ctx.save();
  ctx.globalAlpha = clamp01((frame - 4) / 12);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '900 90px Teko, Impact, sans-serif';
  ctx.fillText('EDIT BATTLE', SIZE / 2, 160);
  ctx.font = '700 36px Inter, system-ui, sans-serif';
  ctx.fillText('LIVE ON LOOPGATE.IO', SIZE / 2, 215);
  ctx.restore();

  // Left avatar (red) — slides from left
  ctx.save();
  ctx.translate(-slide, 0);
  const lcx = SIZE * 0.27;
  const lcy = SIZE * 0.52;
  drawAvatar(ctx, p1A, lcx, lcy, 150, '#fff', p1[0] || 'R');
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '900 64px Teko, Impact, sans-serif';
  ctx.fillText('@' + p1.slice(0, 12), lcx, lcy + 220);
  ctx.font = '900 44px Teko, Impact, sans-serif';
  ctx.fillText('RED', lcx, lcy + 275);
  ctx.restore();

  // Right avatar (blue) — slides from right
  ctx.save();
  ctx.translate(slide, 0);
  const rcx = SIZE * 0.73;
  const rcy = SIZE * 0.52;
  drawAvatar(ctx, p2A, rcx, rcy, 150, '#fff', p2[0] || 'B');
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '900 64px Teko, Impact, sans-serif';
  ctx.fillText('@' + p2.slice(0, 12), rcx, rcy + 220);
  ctx.font = '900 44px Teko, Impact, sans-serif';
  ctx.fillText('BLUE', rcx, rcy + 275);
  ctx.restore();

  // VS — pops in
  const vsT = clamp01((frame - 8) / 14);
  const vsScale = 0.6 + easeOut(vsT) * 0.8;
  ctx.save();
  ctx.globalAlpha = vsT;
  ctx.translate(SIZE / 2, SIZE * 0.52);
  ctx.scale(vsScale, vsScale);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 14;
  ctx.font = '900 260px Teko, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText('VS', 0, 0);
  ctx.fillText('VS', 0, 0);
  ctx.restore();

  drawWatermark(ctx);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

function drawChat(ctx: CanvasRenderingContext2D, localFrame: number, messages: Msg[], p1Id: string, p1A: HTMLImageElement | null, p2A: HTMLImageElement | null, _p1Name: string, _p2Name: string) {
  drawFlatBG(ctx, '#0a0a0a');

  // Determine which message we're on (one-at-a-time, alternating side)
  const idx = Math.min(messages.length - 1, Math.floor(localFrame / PER_MSG_FRAMES));
  const m = messages[idx];
  if (!m) { drawWatermark(ctx, 'rgba(255,255,255,0.55)'); return; }
  const mf = localFrame - idx * PER_MSG_FRAMES;

  const isRed = m.user_id === p1Id;
  const color = isRed ? RED : BLUE;

  // Smooth ease in (0->6) and ease out (last 6)
  const inT = clamp01(mf / 6);
  const outT = clamp01((PER_MSG_FRAMES - mf) / 6);
  const eIn = easeOut(inT);
  const eOut = easeOut(outT);
  const alpha = Math.min(eIn, eOut);
  // gentle zoom: starts at 0.92, peaks at 1.0, ends at 1.04
  const lifeT = clamp01(mf / PER_MSG_FRAMES);
  const zoom = 0.94 + lifeT * 0.08;
  // horizontal drift from side
  const sideDriftStart = (isRed ? -1 : 1) * 80 * (1 - eIn);
  const sideDriftEnd = (isRed ? -1 : 1) * -40 * (1 - eOut);
  const dx = sideDriftStart + sideDriftEnd;

  // BIG zoomed-in bubble centered vertically, anchored to red/blue side
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(SIZE / 2 + dx, SIZE / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-SIZE / 2, -SIZE / 2);

  const avR = 95;
  const margin = 70;
  const avCx = isRed ? margin + avR : SIZE - margin - avR;
  const avCy = SIZE / 2;
  drawAvatar(ctx, isRed ? p1A : p2A, avCx, avCy, avR, '#fff', m.username[0] || (isRed ? 'R' : 'B'));

  // bubble — much bigger so it dominates the frame
  const bubbleMaxW = SIZE - margin * 2 - avR * 2 - 50;
  const padX = 44, padY = 32;
  ctx.font = '800 64px Inter, system-ui, sans-serif';
  const lines = wrapText(ctx, m.message_text, bubbleMaxW - padX * 2);
  const lineH = 76;
  const widths = lines.map(l => ctx.measureText(l).width);
  const textW = Math.max(280, Math.min(bubbleMaxW - padX * 2, Math.max(...widths, 0)));
  ctx.font = '900 36px Teko, Impact, sans-serif';
  const nameW = ctx.measureText('@' + m.username.slice(0, 14)).width;
  const innerW = Math.max(textW, nameW);
  const bubbleW = innerW + padX * 2;
  const bubbleH = lines.length * lineH + padY * 2 + 50;
  const bx = isRed ? avCx + avR + 28 : avCx - avR - 28 - bubbleW;
  const by = avCy - bubbleH / 2;

  // flat fill
  roundRect(ctx, bx, by, bubbleW, bubbleH, 22);
  ctx.fillStyle = color;
  ctx.fill();

  // name
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '900 36px Teko, Impact, sans-serif';
  ctx.textAlign = isRed ? 'left' : 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('@' + m.username.slice(0, 14), isRed ? bx + padX : bx + bubbleW - padX, by + padY - 6);

  // text
  ctx.fillStyle = '#fff';
  ctx.font = '800 64px Inter, system-ui, sans-serif';
  lines.forEach((ln, i) => {
    ctx.fillText(ln, isRed ? bx + padX : bx + bubbleW - padX, by + padY + 44 + i * lineH);
  });
  ctx.restore();

  drawWatermark(ctx, 'rgba(255,255,255,0.55)');
}

function drawCountdown(ctx: CanvasRenderingContext2D, localFrame: number) {
  // 0-30: "3", 30-60: "2", 60-80: "1", 80-90: "GO!"
  let label = '3', color = RED, segStart = 0, segLen = 30;
  if (localFrame >= 80) { label = 'GO!'; color = '#22c55e'; segStart = 80; segLen = 10; }
  else if (localFrame >= 60) { label = '1'; color = BLUE; segStart = 60; segLen = 20; }
  else if (localFrame >= 30) { label = '2'; color = '#f59e0b'; segStart = 30; segLen = 30; }

  // flash background on GO
  if (label === 'GO!') {
    drawFlatBG(ctx, '#fff');
  } else {
    drawSplitBG(ctx);
  }

  const localT = (localFrame - segStart) / segLen;
  const pop = easeOut(clamp01(localT * 2));
  const scale = 0.5 + pop * (label === 'GO!' ? 1.4 : 0.9);

  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);
  ctx.scale(scale, scale);
  ctx.fillStyle = label === 'GO!' ? color : '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = label === 'GO!' ? 24 : 18;
  ctx.font = `900 ${label === 'GO!' ? 480 : 600}px Teko, Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(label, 0, 0);
  ctx.fillText(label, 0, 0);
  ctx.restore();

  drawWatermark(ctx, label === 'GO!' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)');
}

function pickMimeType(): { mime: string; ext: string } {
  const candidates = [
    { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  for (const c of candidates) {
    if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return { mime: '', ext: 'webm' };
}

export default function BattleIntroButton({
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

      // Fetch chat messages
      const { data: rawMsgs } = await supabase
        .from('quick_fight_messages')
        .select('user_id, username, message_text, is_system, created_at')
        .eq('fight_id', fightId)
        .eq('is_system', false)
        .in('user_id', [player1Id, player2Id].filter(Boolean))
        .order('created_at', { ascending: false })
        .limit(MSG_COUNT);

      const messages: Msg[] = ((rawMsgs || []) as any[])
        .reverse()
        .map(m => ({
          user_id: m.user_id,
          username: m.username || (m.user_id === player1Id ? player1Username : player2Username),
          message_text: (m.message_text || '').slice(0, 80),
        }));

      if (messages.length === 0) {
        messages.push(
          { user_id: player1Id, username: player1Username, message_text: "you're cooked" },
          { user_id: player2Id, username: player2Username, message_text: 'we\'ll see' },
          { user_id: player1Id, username: player1Username, message_text: 'easy W' },
          { user_id: player2Id, username: player2Username, message_text: 'bet' },
        );
      }
      while (messages.length < MSG_COUNT) {
        messages.push({ ...messages[messages.length - 1] });
      }

      // Avatars
      const [p1A, p2A] = await Promise.all([loadAvatar(player1Avatar), loadAvatar(player2Avatar)]);

      // Canvas
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D unavailable');

      // Audio setup — decode and route to MediaStreamDestination
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx: AudioContext = new AC();
      const audioDest = audioCtx.createMediaStreamDestination();
      let audioBuffer: AudioBuffer | null = null;
      try {
        const res = await fetch(countdownSfx);
        const ab = await res.arrayBuffer();
        audioBuffer = await audioCtx.decodeAudioData(ab.slice(0));
      } catch (e) {
        console.warn('audio decode failed', e);
      }

      // Combined stream
      const videoStream = (canvas as any).captureStream(FPS) as MediaStream;
      const tracks = [...videoStream.getVideoTracks(), ...audioDest.stream.getAudioTracks()];
      const combined = new MediaStream(tracks);

      const { mime, ext } = pickMimeType();
      const recorder = new MediaRecorder(combined, mime ? { mimeType: mime, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 128_000 } : undefined);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime || 'video/webm' }));
      });
      recorder.start();

      const chatFrames = MSG_COUNT * PER_MSG_FRAMES + HOLD_AFTER_CHAT;
      const totalFrames = VS_FRAMES + chatFrames + COUNTDOWN_FRAMES;
      const frameMs = 1000 / FPS;
      const startedAt = performance.now();

      // Schedule audio at start of countdown phase
      const countdownStartMs = (VS_FRAMES + chatFrames) * frameMs;
      if (audioBuffer) {
        const src = audioCtx.createBufferSource();
        src.buffer = audioBuffer;
        const gain = audioCtx.createGain();
        gain.gain.value = 1.0;
        src.connect(gain).connect(audioDest);
        // also play out loud so user hears it
        src.connect(audioCtx.destination);
        src.start(audioCtx.currentTime + countdownStartMs / 1000);
      }

      for (let f = 0; f < totalFrames; f++) {
        if (f < VS_FRAMES) {
          drawVS(ctx, f, player1Username, player2Username, p1A, p2A);
        } else if (f < VS_FRAMES + chatFrames) {
          drawChat(ctx, f - VS_FRAMES, messages, player1Id, p1A, p2A, player1Username, player2Username);
        } else {
          drawCountdown(ctx, f - VS_FRAMES - chatFrames);
        }
        const target = startedAt + (f + 1) * frameMs;
        const wait = target - performance.now();
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
      }
      await new Promise(r => setTimeout(r, 200));
      recorder.stop();
      const blob = await done;
      try { audioCtx.close(); } catch {}

      const url = URL.createObjectURL(blob);
      setLastUrl(url);
      setLastExt(ext);

      const a = document.createElement('a');
      a.href = url;
      a.download = `loopgate-battle-intro.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success('Intro saved — splice it on the start 🔥');
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
              VS → trash talk → 3·2·1·GO. Splice on the start of your edit.
            </DialogDescription>
          </DialogHeader>

          {lastUrl && (
            <div className="mx-auto" style={{ maxWidth: 280 }}>
              <video src={lastUrl} autoPlay loop controls playsInline className="w-full rounded-lg border border-white/10 bg-black aspect-square object-contain" />
            </div>
          )}

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-white/70 flex gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 text-white/50 mt-0.5" />
            <div>
              {lastExt === 'mp4'
                ? <>Saved as MP4 with audio. If it didn't save, long-press the preview and choose <span className="text-white">Save Video</span>.</>
                : <>Saved as WebM with audio. CapCut / Premiere / DaVinci import WebM directly.</>}
            </div>
          </div>

          <div className="flex gap-2">
            {lastUrl && (
              <a href={lastUrl} download={`loopgate-battle-intro.${lastExt}`} className="flex-1 inline-flex items-center justify-center bg-white text-black hover:bg-white/90 font-display uppercase tracking-wider text-xs h-9 rounded-md">
                <Download className="w-3.5 h-3.5 mr-2" /> Save again
              </a>
            )}
            <Button variant="outline" size="sm" className="flex-1 border-white/15 bg-transparent text-white hover:bg-white/5" onClick={() => setOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
