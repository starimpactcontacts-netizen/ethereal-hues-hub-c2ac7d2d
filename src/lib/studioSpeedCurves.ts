/**
 * Loopgate Studio — Speed Curves & Ramping Engine
 * Non-linear speed control with Bezier curves for professional speed ramping
 */

// ─── Types ───
export type SpeedKeyframe = {
  time: number;      // Position in clip (0-1 normalized)
  speed: number;     // Speed multiplier (0.1 - 4.0)
};

export type SpeedCurve = {
  id: string;
  name: string;
  keyframes: SpeedKeyframe[];
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';
  bezierControls?: [number, number, number, number]; // [x1, y1, x2, y2]
};

// ─── Presets ───
export const SPEED_CURVE_PRESETS: SpeedCurve[] = [
  {
    id: 'linear',
    name: 'Linear',
    keyframes: [
      { time: 0, speed: 1 },
      { time: 1, speed: 1 },
    ],
    easing: 'linear',
  },
  {
    id: 'smooth_slow',
    name: 'Smooth Slow-Mo',
    keyframes: [
      { time: 0, speed: 1 },
      { time: 0.3, speed: 0.3 },
      { time: 0.7, speed: 0.3 },
      { time: 1, speed: 1 },
    ],
    easing: 'ease-in-out',
  },
  {
    id: 'cinematic_drop',
    name: 'Cinematic Drop',
    keyframes: [
      { time: 0, speed: 1 },
      { time: 0.2, speed: 0.15 },
      { time: 0.5, speed: 0.15 },
      { time: 0.7, speed: 2 },
      { time: 1, speed: 1 },
    ],
    easing: 'bezier',
    bezierControls: [0.25, 0.1, 0.25, 1],
  },
  {
    id: 'impact_freeze',
    name: 'Impact Freeze',
    keyframes: [
      { time: 0, speed: 1.5 },
      { time: 0.45, speed: 1.5 },
      { time: 0.5, speed: 0.05 },
      { time: 0.55, speed: 0.05 },
      { time: 0.6, speed: 2 },
      { time: 1, speed: 1 },
    ],
    easing: 'ease-out',
  },
  {
    id: 'phonk_ramp',
    name: 'Phonk Ramp',
    keyframes: [
      { time: 0, speed: 0.5 },
      { time: 0.4, speed: 0.5 },
      { time: 0.5, speed: 2.5 },
      { time: 0.6, speed: 0.3 },
      { time: 0.8, speed: 2 },
      { time: 1, speed: 1 },
    ],
    easing: 'ease-in-out',
  },
  {
    id: 'bounce_back',
    name: 'Bounce Back',
    keyframes: [
      { time: 0, speed: 1 },
      { time: 0.3, speed: 0.2 },
      { time: 0.5, speed: 1.5 },
      { time: 0.65, speed: 0.4 },
      { time: 0.8, speed: 1.2 },
      { time: 1, speed: 1 },
    ],
    easing: 'bezier',
    bezierControls: [0.68, -0.55, 0.27, 1.55],
  },
  {
    id: 'whip_pan',
    name: 'Whip Pan',
    keyframes: [
      { time: 0, speed: 1 },
      { time: 0.1, speed: 3 },
      { time: 0.3, speed: 3 },
      { time: 0.4, speed: 1 },
      { time: 1, speed: 1 },
    ],
    easing: 'ease-out',
  },
  {
    id: 'reverse_burst',
    name: 'Reverse Burst',
    keyframes: [
      { time: 0, speed: -1 },
      { time: 0.3, speed: -0.3 },
      { time: 0.5, speed: 2 },
      { time: 1, speed: 1 },
    ],
    easing: 'ease-in-out',
  },
];

// ─── Bezier Math ───
function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function solveBezierX(x: number, x1: number, x2: number, epsilon = 0.0001): number {
  // Newton-Raphson to find t for given x
  let t = x;
  for (let i = 0; i < 8; i++) {
    const currentX = cubicBezier(t, 0, x1, x2, 1);
    const dx = currentX - x;
    if (Math.abs(dx) < epsilon) return t;
    const derivative = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
    if (Math.abs(derivative) < 1e-6) break;
    t -= dx / derivative;
    t = Math.max(0, Math.min(1, t));
  }
  return t;
}

export function evaluateBezierCurve(
  x: number,
  controls: [number, number, number, number]
): number {
  const [x1, y1, x2, y2] = controls;
  const t = solveBezierX(x, x1, x2);
  return cubicBezier(t, 0, y1, y2, 1);
}

// ─── Core Functions ───

/**
 * Get interpolated speed at a given normalized time
 */
export function getSpeedAtTime(curve: SpeedCurve, normalizedTime: number): number {
  const { keyframes, easing, bezierControls } = curve;
  
  if (keyframes.length === 0) return 1;
  if (keyframes.length === 1) return keyframes[0].speed;
  
  // Clamp time
  const t = Math.max(0, Math.min(1, normalizedTime));
  
  // Find surrounding keyframes
  let leftIdx = 0;
  let rightIdx = keyframes.length - 1;
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
      leftIdx = i;
      rightIdx = i + 1;
      break;
    }
  }
  
  const left = keyframes[leftIdx];
  const right = keyframes[rightIdx];
  
  // Normalized position between keyframes
  const segmentT = (t - left.time) / (right.time - left.time || 1);
  
  // Apply easing
  let easedT: number;
  switch (easing) {
    case 'ease-in':
      easedT = segmentT * segmentT;
      break;
    case 'ease-out':
      easedT = 1 - (1 - segmentT) * (1 - segmentT);
      break;
    case 'ease-in-out':
      easedT = segmentT < 0.5
        ? 2 * segmentT * segmentT
        : 1 - Math.pow(-2 * segmentT + 2, 2) / 2;
      break;
    case 'bezier':
      if (bezierControls) {
        easedT = evaluateBezierCurve(segmentT, bezierControls);
      } else {
        easedT = segmentT;
      }
      break;
    default:
      easedT = segmentT;
  }
  
  // Interpolate speed
  return left.speed + (right.speed - left.speed) * easedT;
}

/**
 * Convert source time to playback time accounting for speed curve
 * (Integration of speed function)
 */
export function sourceToPlaybackTime(
  curve: SpeedCurve,
  sourceTime: number,
  totalDuration: number,
  samples = 100
): number {
  const normalizedSource = sourceTime / totalDuration;
  let playbackTime = 0;
  const dt = normalizedSource / samples;
  
  for (let i = 0; i < samples; i++) {
    const t = (i + 0.5) * dt;
    const speed = getSpeedAtTime(curve, t);
    playbackTime += dt / Math.max(0.01, Math.abs(speed));
  }
  
  return playbackTime * totalDuration;
}

/**
 * Convert playback time to source time (inverse)
 */
export function playbackToSourceTime(
  curve: SpeedCurve,
  playbackTime: number,
  totalDuration: number,
  samples = 100
): number {
  const target = playbackTime / totalDuration;
  let sourceTime = 0;
  let accumulatedPlayback = 0;
  const dt = 1 / samples;
  
  for (let i = 0; i < samples && accumulatedPlayback < target; i++) {
    const t = i * dt;
    const speed = getSpeedAtTime(curve, t);
    const playbackDelta = dt / Math.max(0.01, Math.abs(speed));
    
    if (accumulatedPlayback + playbackDelta >= target) {
      // Interpolate within this segment
      const remaining = target - accumulatedPlayback;
      const fraction = remaining / playbackDelta;
      sourceTime = (t + fraction * dt) * totalDuration;
      break;
    }
    
    accumulatedPlayback += playbackDelta;
    sourceTime = (t + dt) * totalDuration;
  }
  
  return sourceTime;
}

/**
 * Calculate total playback duration after speed curve is applied
 */
export function getModifiedDuration(curve: SpeedCurve, originalDuration: number, samples = 100): number {
  let totalPlayback = 0;
  const dt = 1 / samples;
  
  for (let i = 0; i < samples; i++) {
    const t = (i + 0.5) * dt;
    const speed = getSpeedAtTime(curve, t);
    totalPlayback += dt / Math.max(0.01, Math.abs(speed));
  }
  
  return totalPlayback * originalDuration;
}

/**
 * Generate curve visualization points for canvas/SVG
 */
export function generateCurvePoints(
  curve: SpeedCurve,
  width: number,
  height: number,
  minSpeed = 0,
  maxSpeed = 3
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const samples = Math.max(50, Math.floor(width / 3));
  
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const speed = getSpeedAtTime(curve, t);
    const normalizedSpeed = (speed - minSpeed) / (maxSpeed - minSpeed);
    
    points.push({
      x: t * width,
      y: height - Math.max(0, Math.min(1, normalizedSpeed)) * height,
    });
  }
  
  return points;
}
