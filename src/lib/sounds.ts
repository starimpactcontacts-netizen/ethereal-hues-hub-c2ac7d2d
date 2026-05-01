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
