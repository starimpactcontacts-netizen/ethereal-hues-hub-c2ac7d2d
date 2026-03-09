/**
 * AnimatedTextPresets — 15+ text animation styles for NodeVideo-level text
 * Each preset returns CSS transform/opacity for a given progress (0-1)
 */

export type TextAnimation = {
  id: string;
  label: string;
  preview: string; // Short demo text
  apply: (progress: number) => { transform: string; opacity: number; filter?: string };
};

export const TEXT_ANIMATIONS: TextAnimation[] = [
  {
    id: "none",
    label: "None",
    preview: "Aa",
    apply: () => ({ transform: "none", opacity: 1 }),
  },
  {
    id: "fade_in",
    label: "Fade In",
    preview: "👁",
    apply: (p) => ({ transform: "none", opacity: Math.min(1, p * 3) }),
  },
  {
    id: "typewriter",
    label: "Typewriter",
    preview: "⌨️",
    apply: (p) => ({
      transform: "none",
      opacity: 1,
      filter: p < 0.1 ? "none" : "none",
    }),
  },
  {
    id: "bounce_in",
    label: "Bounce",
    preview: "⬆",
    apply: (p) => {
      const t = Math.min(1, p * 4);
      const bounce = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      return { transform: `scale(${0.3 + bounce * 0.7}) translateY(${(1 - bounce) * -30}px)`, opacity: Math.min(1, t * 2) };
    },
  },
  {
    id: "slide_up",
    label: "Slide Up",
    preview: "↑",
    apply: (p) => {
      const t = Math.min(1, p * 3);
      const ease = 1 - Math.pow(1 - t, 3);
      return { transform: `translateY(${(1 - ease) * 60}px)`, opacity: ease };
    },
  },
  {
    id: "slide_left",
    label: "Slide Left",
    preview: "←",
    apply: (p) => {
      const t = Math.min(1, p * 3);
      const ease = 1 - Math.pow(1 - t, 3);
      return { transform: `translateX(${(1 - ease) * 80}px)`, opacity: ease };
    },
  },
  {
    id: "zoom_in",
    label: "Zoom In",
    preview: "🔍",
    apply: (p) => {
      const t = Math.min(1, p * 3);
      return { transform: `scale(${0.1 + t * 0.9})`, opacity: t };
    },
  },
  {
    id: "zoom_out",
    label: "Zoom Out",
    preview: "🔎",
    apply: (p) => {
      const t = Math.min(1, p * 3);
      return { transform: `scale(${2 - t})`, opacity: t };
    },
  },
  {
    id: "glitch",
    label: "Glitch",
    preview: "⚡",
    apply: (p) => {
      const flicker = Math.sin(p * 80) > 0.3 ? 1 : 0.1;
      const offsetX = Math.sin(p * 40) * 3;
      return {
        transform: `translateX(${offsetX}px) skewX(${Math.sin(p * 30) * 2}deg)`,
        opacity: p < 0.15 ? flicker : 1,
        filter: p < 0.2 ? `hue-rotate(${Math.random() * 360}deg)` : "none",
      };
    },
  },
  {
    id: "shake",
    label: "Shake",
    preview: "📳",
    apply: (p) => {
      const intensity = Math.max(0, 1 - p * 2) * 5;
      return {
        transform: `translate(${Math.sin(p * 60) * intensity}px, ${Math.cos(p * 50) * intensity}px)`,
        opacity: 1,
      };
    },
  },
  {
    id: "spin_in",
    label: "Spin In",
    preview: "🔄",
    apply: (p) => {
      const t = Math.min(1, p * 3);
      const ease = 1 - Math.pow(1 - t, 3);
      return { transform: `rotate(${(1 - ease) * 360}deg) scale(${ease})`, opacity: ease };
    },
  },
  {
    id: "elastic",
    label: "Elastic",
    preview: "🎯",
    apply: (p) => {
      const t = Math.min(1, p * 2.5);
      const elastic = t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
      return { transform: `scale(${elastic})`, opacity: Math.min(1, t * 3) };
    },
  },
  {
    id: "wave",
    label: "Wave",
    preview: "〰️",
    apply: (p) => {
      const wave = Math.sin(p * Math.PI * 4) * 8 * Math.max(0, 1 - p);
      return { transform: `translateY(${wave}px)`, opacity: 1 };
    },
  },
  {
    id: "flip_in",
    label: "Flip In",
    preview: "🔃",
    apply: (p) => {
      const t = Math.min(1, p * 3);
      return { transform: `perspective(400px) rotateX(${(1 - t) * 90}deg)`, opacity: t };
    },
  },
  {
    id: "blur_in",
    label: "Blur In",
    preview: "🌫",
    apply: (p) => {
      const t = Math.min(1, p * 3);
      return { transform: `scale(${0.8 + t * 0.2})`, opacity: t, filter: `blur(${(1 - t) * 8}px)` };
    },
  },
  {
    id: "neon_pulse",
    label: "Neon Pulse",
    preview: "💡",
    apply: (p) => {
      const pulse = 0.7 + Math.sin(p * Math.PI * 6) * 0.3;
      return { transform: "none", opacity: pulse };
    },
  },
];

/**
 * Render animated text onto canvas with animation applied
 */
export function renderAnimatedText(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  fontFamily: string,
  animation: TextAnimation,
  progress: number, // 0-1 within the text overlay's timespan
  shadow?: string,
  strokeColor?: string,
  strokeWidth?: number,
) {
  const anim = animation.apply(progress);
  
  ctx.save();
  ctx.globalAlpha = anim.opacity;
  
  // Parse transform for translate/scale/rotate
  const px = x * canvas.width;
  const py = y * canvas.height;
  ctx.translate(px, py);
  
  // Apply basic transforms from animation
  const scaleMatch = anim.transform.match(/scale\(([^)]+)\)/);
  const translateYMatch = anim.transform.match(/translateY\(([^)]+)px\)/);
  const translateXMatch = anim.transform.match(/translateX\(([^)]+)px\)/);
  const rotateMatch = anim.transform.match(/rotate\(([^)]+)deg\)/);
  
  if (scaleMatch) {
    const s = parseFloat(scaleMatch[1]);
    ctx.scale(s, s);
  }
  if (translateYMatch) ctx.translate(0, parseFloat(translateYMatch[1]));
  if (translateXMatch) ctx.translate(parseFloat(translateXMatch[1]), 0);
  if (rotateMatch) ctx.rotate(parseFloat(rotateMatch[1]) * Math.PI / 180);
  
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Shadow
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
  }
  
  // Stroke
  if (strokeColor && strokeWidth) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.strokeText(text, 0, 0);
  }
  
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  
  ctx.restore();
}
