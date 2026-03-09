/**
 * Keyframe Animation System — Loopgate Studio
 * Professional interpolation, easing, and animation presets.
 */

export type EasingType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "bounce"
  | "elastic"
  | "spring";

export type AnimatableProperty =
  | "opacity"
  | "scale"
  | "x"
  | "y"
  | "rotation"
  | "blur"
  | "saturation";

export type Keyframe = {
  id: string;
  time: number;
  value: number;
  easing: EasingType;
};

export type KeyframeTrack = {
  id: string;
  property: AnimatableProperty;
  keyframes: Keyframe[];
};

export type AnimationPreset = {
  id: string;
  label: string;
  icon: string;
  tracks: KeyframeTrack[];
  duration: number;
};

// ─── Easing Functions ───
export const easingFunctions: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  bounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  elastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
  spring: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// ─── Interpolate Value at Time ───
export function interpolateValue(
  track: KeyframeTrack,
  time: number
): number {
  const { keyframes } = track;
  if (keyframes.length === 0) return getDefaultValue(track.property);
  if (keyframes.length === 1) return keyframes[0].value;

  // Sort by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Before first keyframe
  if (time <= sorted[0].time) return sorted[0].value;

  // After last keyframe
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  // Find surrounding keyframes
  let prev = sorted[0];
  let next = sorted[1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time < sorted[i + 1].time) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }

  // Interpolate
  const t = (time - prev.time) / (next.time - prev.time);
  const easedT = easingFunctions[next.easing](t);

  return prev.value + (next.value - prev.value) * easedT;
}

function getDefaultValue(property: AnimatableProperty): number {
  switch (property) {
    case "opacity":
    case "scale":
    case "saturation":
      return 1;
    case "x":
    case "y":
    case "rotation":
    case "blur":
      return 0;
    default:
      return 0;
  }
}

// ─── Animation Presets ───
export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: "fade_in",
    label: "Fade In",
    icon: "🌅",
    duration: 0.5,
    tracks: [
      {
        id: "fade_opacity",
        property: "opacity",
        keyframes: [
          { id: "k1", time: 0, value: 0, easing: "easeOut" },
          { id: "k2", time: 0.5, value: 1, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "fade_out",
    label: "Fade Out",
    icon: "🌙",
    duration: 0.5,
    tracks: [
      {
        id: "fade_opacity",
        property: "opacity",
        keyframes: [
          { id: "k1", time: 0, value: 1, easing: "easeIn" },
          { id: "k2", time: 0.5, value: 0, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "scale_up",
    label: "Scale Up",
    icon: "📈",
    duration: 0.6,
    tracks: [
      {
        id: "scale_track",
        property: "scale",
        keyframes: [
          { id: "k1", time: 0, value: 0.5, easing: "easeOut" },
          { id: "k2", time: 0.6, value: 1, easing: "linear" },
        ],
      },
      {
        id: "opacity_track",
        property: "opacity",
        keyframes: [
          { id: "k1", time: 0, value: 0, easing: "easeOut" },
          { id: "k2", time: 0.3, value: 1, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "scale_down",
    label: "Scale Down",
    icon: "📉",
    duration: 0.6,
    tracks: [
      {
        id: "scale_track",
        property: "scale",
        keyframes: [
          { id: "k1", time: 0, value: 1.5, easing: "easeOut" },
          { id: "k2", time: 0.6, value: 1, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "spin_in",
    label: "Spin In",
    icon: "🌀",
    duration: 0.8,
    tracks: [
      {
        id: "rotation_track",
        property: "rotation",
        keyframes: [
          { id: "k1", time: 0, value: -180, easing: "easeOut" },
          { id: "k2", time: 0.8, value: 0, easing: "linear" },
        ],
      },
      {
        id: "scale_track",
        property: "scale",
        keyframes: [
          { id: "k1", time: 0, value: 0, easing: "easeOut" },
          { id: "k2", time: 0.8, value: 1, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "bounce_in",
    label: "Bounce In",
    icon: "⚡",
    duration: 0.8,
    tracks: [
      {
        id: "scale_track",
        property: "scale",
        keyframes: [
          { id: "k1", time: 0, value: 0, easing: "bounce" },
          { id: "k2", time: 0.8, value: 1, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "elastic_in",
    label: "Elastic",
    icon: "🎯",
    duration: 1.0,
    tracks: [
      {
        id: "scale_track",
        property: "scale",
        keyframes: [
          { id: "k1", time: 0, value: 0, easing: "elastic" },
          { id: "k2", time: 1.0, value: 1, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "slide_right",
    label: "Slide Right",
    icon: "➡️",
    duration: 0.5,
    tracks: [
      {
        id: "x_track",
        property: "x",
        keyframes: [
          { id: "k1", time: 0, value: -100, easing: "easeOut" },
          { id: "k2", time: 0.5, value: 0, easing: "linear" },
        ],
      },
      {
        id: "opacity_track",
        property: "opacity",
        keyframes: [
          { id: "k1", time: 0, value: 0, easing: "easeOut" },
          { id: "k2", time: 0.3, value: 1, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "slide_up",
    label: "Slide Up",
    icon: "⬆️",
    duration: 0.5,
    tracks: [
      {
        id: "y_track",
        property: "y",
        keyframes: [
          { id: "k1", time: 0, value: 50, easing: "easeOut" },
          { id: "k2", time: 0.5, value: 0, easing: "linear" },
        ],
      },
      {
        id: "opacity_track",
        property: "opacity",
        keyframes: [
          { id: "k1", time: 0, value: 0, easing: "easeOut" },
          { id: "k2", time: 0.3, value: 1, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "shake",
    label: "Shake",
    icon: "📳",
    duration: 0.5,
    tracks: [
      {
        id: "x_track",
        property: "x",
        keyframes: [
          { id: "k1", time: 0, value: 0, easing: "linear" },
          { id: "k2", time: 0.1, value: -10, easing: "linear" },
          { id: "k3", time: 0.2, value: 10, easing: "linear" },
          { id: "k4", time: 0.3, value: -8, easing: "linear" },
          { id: "k5", time: 0.4, value: 6, easing: "linear" },
          { id: "k6", time: 0.5, value: 0, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "blur_in",
    label: "Blur In",
    icon: "💨",
    duration: 0.6,
    tracks: [
      {
        id: "blur_track",
        property: "blur",
        keyframes: [
          { id: "k1", time: 0, value: 20, easing: "easeOut" },
          { id: "k2", time: 0.6, value: 0, easing: "linear" },
        ],
      },
      {
        id: "opacity_track",
        property: "opacity",
        keyframes: [
          { id: "k1", time: 0, value: 0, easing: "easeOut" },
          { id: "k2", time: 0.4, value: 1, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "desaturate",
    label: "Color Pop",
    icon: "🎨",
    duration: 0.8,
    tracks: [
      {
        id: "saturation_track",
        property: "saturation",
        keyframes: [
          { id: "k1", time: 0, value: 0, easing: "easeOut" },
          { id: "k2", time: 0.8, value: 1, easing: "linear" },
        ],
      },
    ],
  },
];

// ─── Apply Keyframe Animation to Canvas ───
export function applyKeyframeAnimation(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tracks: KeyframeTrack[],
  time: number,
  startTime: number
): void {
  const relativeTime = time - startTime;
  if (relativeTime < 0) return;

  const values: Record<AnimatableProperty, number> = {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    rotation: 0,
    blur: 0,
    saturation: 1,
  };

  // Interpolate all tracks
  for (const track of tracks) {
    values[track.property] = interpolateValue(track, relativeTime);
  }

  // Apply transformations
  ctx.save();

  ctx.globalAlpha = values.opacity;

  ctx.translate(canvas.width / 2 + values.x, canvas.height / 2 + values.y);
  ctx.rotate((values.rotation * Math.PI) / 180);
  ctx.scale(values.scale, values.scale);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  // Apply blur via filter
  if (values.blur > 0) {
    ctx.filter = `blur(${values.blur}px)`;
  }

  // Saturation would be applied via CSS filter on the video element
}

export function resetKeyframeAnimation(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}
