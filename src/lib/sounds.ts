/**
 * Lightweight Web Audio API sound system — Fortnite/Roblox-style UI feedback.
 * All sounds are synthesised; zero network requests.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* ── tiny helpers ─────────────────────────────────────────── */

function osc(
  c: AudioContext,
  type: OscillatorType,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  dest: AudioNode,
) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g).connect(dest);
  o.start(start);
  o.stop(start + dur);
}

/* ── public API ───────────────────────────────────────────── */

/** Default button tap — short bright click */
export function playTap() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.85;
    master.connect(c.destination);

    osc(c, 'sine', 1800, t, 0.06, 0.6, master);
    osc(c, 'triangle', 2600, t, 0.03, 0.3, master);
  } catch {
    /* Audio not available — silent fail */
  }
}

/** Navigation / tab switch — two-tone chirp */
export function playNav() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.70;
    master.connect(c.destination);

    osc(c, 'sine', 1200, t, 0.05, 0.5, master);
    osc(c, 'sine', 1600, t + 0.04, 0.06, 0.4, master);
  } catch {}
}

/** Success — ascending arpeggio */
export function playSuccess() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.70;
    master.connect(c.destination);

    osc(c, 'sine', 800, t, 0.08, 0.5, master);
    osc(c, 'sine', 1100, t + 0.06, 0.08, 0.45, master);
    osc(c, 'sine', 1500, t + 0.12, 0.10, 0.4, master);
  } catch {}
}

/** Error / deny — low buzz */
export function playError() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.60;
    master.connect(c.destination);

    osc(c, 'square', 200, t, 0.12, 0.3, master);
    osc(c, 'square', 180, t + 0.04, 0.10, 0.2, master);
  } catch {}
}

/** Fanfare — cinematic theme-reveal sting (rising sparkle + boom) */
export function playFanfare() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.85;
    master.connect(c.destination);

    // Low boom
    osc(c, 'sine', 90, t, 0.6, 0.7, master);
    osc(c, 'triangle', 180, t, 0.5, 0.45, master);
    // Rising sparkle arpeggio
    osc(c, 'triangle', 660, t + 0.05, 0.18, 0.5, master);
    osc(c, 'triangle', 880, t + 0.18, 0.18, 0.5, master);
    osc(c, 'triangle', 1320, t + 0.32, 0.22, 0.5, master);
    osc(c, 'sine',     1760, t + 0.50, 0.35, 0.45, master);
    // Shimmer tail
    osc(c, 'sine', 2640, t + 0.55, 0.45, 0.25, master);
    osc(c, 'sine', 3520, t + 0.60, 0.40, 0.18, master);
  } catch {}
}

/** Toggle on */
export function playToggleOn() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.70;
    master.connect(c.destination);

    osc(c, 'sine', 1000, t, 0.04, 0.5, master);
    osc(c, 'sine', 1400, t + 0.03, 0.05, 0.4, master);
  } catch {}
}

/** Toggle off */
export function playToggleOff() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.60;
    master.connect(c.destination);

    osc(c, 'sine', 1200, t, 0.04, 0.4, master);
    osc(c, 'sine', 900, t + 0.03, 0.05, 0.35, master);
  } catch {}
}

/** Match alert — CS:GO double-bell chime + Valorant sub hit + Fortnite sparkle arpeggio */
export function playMatchAlert() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.80;
    master.connect(c.destination);

    // VALORANT — deep sub punch + noise snap on impact
    osc(c, 'sine', 58,  t, 0.26, 0.90, master);
    osc(c, 'sine', 116, t, 0.16, 0.48, master);

    const snapBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.025), c.sampleRate);
    const sd = snapBuf.getChannelData(0);
    for (let i = 0; i < sd.length; i++) sd[i] = Math.random() * 2 - 1;
    const snap = c.createBufferSource();
    snap.buffer = snapBuf;
    const sg = c.createGain();
    sg.gain.setValueAtTime(0.48, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    snap.connect(sg).connect(master);
    snap.start(t);

    // CS:GO — iconic two-tone upward bell chime (C5 → E5)
    osc(c, 'sine',     523,  t + 0.05, 0.38, 0.68, master);
    osc(c, 'triangle', 1046, t + 0.05, 0.30, 0.24, master);
    osc(c, 'sine',     659,  t + 0.19, 0.42, 0.62, master);
    osc(c, 'triangle', 1318, t + 0.19, 0.32, 0.20, master);

    // FORTNITE / ROBLOX — quick ascending sparkle arpeggio (C6 E6 G6 C7)
    [1047, 1319, 1568, 2093].forEach((f, i) => {
      osc(c, 'sine', f, t + 0.22 + i * 0.05, 0.13, 0.30 - i * 0.05, master);
    });
  } catch {}
}

/** Countdown tick — CS:GO bomb-tick sharpness, escalating A5→E6 */
export function playCountdownTick(count: number) {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = count <= 2 ? 0.88 : 0.74;
    master.connect(c.destination);

    // CS:GO bomb tick: very short, sharp sine — pitch climbs each second
    const rows: Record<number, [number, number]> = {
      5: [880,  0.08],  // A5
      4: [988,  0.08],  // B5
      3: [1047, 0.09],  // C6
      2: [1175, 0.10],  // D6
      1: [1319, 0.14],  // E6 — urgent
    };
    const [freq, dur] = rows[count] ?? [880, 0.08];

    // Micro noise click (physical feel of a button/key)
    const cbuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.007), c.sampleRate);
    const cd = cbuf.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = Math.random() * 2 - 1;
    const ck = c.createBufferSource();
    ck.buffer = cbuf;
    const cg = c.createGain();
    cg.gain.setValueAtTime(0.20, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.007);
    ck.connect(cg).connect(master);
    ck.start(t);

    osc(c, 'sine',     freq,     t, dur,       0.82, master);
    osc(c, 'triangle', freq * 2, t, dur * 0.4, 0.18, master);

    if (count === 1) {
      // Final beat: Fortnite-style double-hit + sub thump
      osc(c, 'sine', 78,   t,        0.24, 0.58, master);
      osc(c, 'sine', freq, t + 0.07, 0.11, 0.62, master);
    }
  } catch {}
}
