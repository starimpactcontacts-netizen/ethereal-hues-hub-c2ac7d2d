// Synthesized DM sound effects using Web Audio API
let audioCtx: AudioContext | null = null;

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playMessageSent() {
  try {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.15);
  } catch {}
}

export function playMessageReceived() {
  try {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(660, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
    o.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.2);
  } catch {}
}
