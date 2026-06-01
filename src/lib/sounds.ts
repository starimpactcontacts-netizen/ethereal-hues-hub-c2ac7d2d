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

/** Match alert — engine rev build → ignition impact → roar (Valorant/anime energy) */
export function playMatchAlert() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.88;
    master.connect(c.destination);

    // ── RUMBLE BUILD (0 → 180ms): low filtered noise sweeping up ──
    const rBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.22), c.sampleRate);
    const rd = rBuf.getChannelData(0);
    for (let i = 0; i < rd.length; i++) rd[i] = Math.random() * 2 - 1;
    const rSrc = c.createBufferSource(); rSrc.buffer = rBuf;
    const rFilt = c.createBiquadFilter(); rFilt.type = 'lowpass';
    rFilt.frequency.setValueAtTime(60, t);
    rFilt.frequency.exponentialRampToValueAtTime(280, t + 0.20);
    const rGain = c.createGain();
    rGain.gain.setValueAtTime(0, t);
    rGain.gain.linearRampToValueAtTime(0.65, t + 0.20);
    rSrc.connect(rFilt).connect(rGain).connect(master);
    rSrc.start(t);

    // ── IGNITION IMPACT (at 190ms): sub punch + bandpass crack ──
    osc(c, 'sine', 52, t + 0.19, 0.38, 0.92, master);
    osc(c, 'sine', 104, t + 0.19, 0.22, 0.55, master);

    const iBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.07), c.sampleRate);
    const id = iBuf.getChannelData(0);
    for (let i = 0; i < id.length; i++) id[i] = Math.random() * 2 - 1;
    const iSrc = c.createBufferSource(); iSrc.buffer = iBuf;
    const iFilt = c.createBiquadFilter(); iFilt.type = 'bandpass';
    iFilt.frequency.value = 1400; iFilt.Q.value = 0.9;
    const iGain = c.createGain();
    iGain.gain.setValueAtTime(0.75, t + 0.19);
    iGain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    iSrc.connect(iFilt).connect(iGain).connect(master);
    iSrc.start(t + 0.19);

    // ── ENGINE ROAR (190 → 650ms): sawtooth growl sweeping up ──
    const roar = c.createOscillator(); roar.type = 'sawtooth';
    roar.frequency.setValueAtTime(52, t + 0.19);
    roar.frequency.exponentialRampToValueAtTime(92, t + 0.60);
    const roarFilt = c.createBiquadFilter(); roarFilt.type = 'lowpass';
    roarFilt.frequency.value = 380;
    const roarGain = c.createGain();
    roarGain.gain.setValueAtTime(0, t + 0.19);
    roarGain.gain.linearRampToValueAtTime(0.38, t + 0.26);
    roarGain.gain.exponentialRampToValueAtTime(0.001, t + 0.68);
    roar.connect(roarFilt).connect(roarGain).connect(master);
    roar.start(t + 0.19); roar.stop(t + 0.70);

    // ── ANIME SHIMMER TAIL: high sine sparks after impact ──
    osc(c, 'sine', 3200, t + 0.21, 0.16, 0.20, master);
    osc(c, 'sine', 5000, t + 0.24, 0.12, 0.14, master);
  } catch {}
}

/** Countdown tick — anime impact frame: bandpass noise SHHK + sub punch */
export function playCountdownTick(count: number) {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = count <= 2 ? 0.88 : 0.72;
    master.connect(c.destination);

    // Bandpass noise burst — the "SHHK" impact texture
    const dur = 0.045;
    const nBuf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const nd = nBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const nSrc = c.createBufferSource(); nSrc.buffer = nBuf;
    const nFilt = c.createBiquadFilter(); nFilt.type = 'bandpass';
    // Pitch climbs as count goes 5 → 1
    nFilt.frequency.value = 2200 + (5 - count) * 600;
    nFilt.Q.value = 1.4;
    const nGain = c.createGain();
    nGain.gain.setValueAtTime(0.60, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    nSrc.connect(nFilt).connect(nGain).connect(master);
    nSrc.start(t);

    // Sub body under the noise
    osc(c, 'sine', count <= 2 ? 88 : 66, t, 0.07, count <= 2 ? 0.65 : 0.48, master);

    if (count === 1) {
      // Final tick: extra low thud + second hit = full anime clash
      osc(c, 'sine', 44, t, 0.22, 0.78, master);
      const fBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.06), c.sampleRate);
      const fd = fBuf.getChannelData(0);
      for (let i = 0; i < fd.length; i++) fd[i] = Math.random() * 2 - 1;
      const fSrc = c.createBufferSource(); fSrc.buffer = fBuf;
      const fFilt = c.createBiquadFilter(); fFilt.type = 'lowpass';
      fFilt.frequency.value = 600;
      const fGain = c.createGain();
      fGain.gain.setValueAtTime(0.55, t + 0.02);
      fGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      fSrc.connect(fFilt).connect(fGain).connect(master);
      fSrc.start(t + 0.02);
    }
  } catch {}
}
