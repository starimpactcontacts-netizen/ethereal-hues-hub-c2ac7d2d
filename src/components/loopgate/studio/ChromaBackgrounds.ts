/**
 * ChromaBackgrounds — Background replacement presets for chroma key
 */

export type ChromaBackground = {
  id: string;
  label: string;
  type: "color" | "gradient";
  value: string;
};

export const CHROMA_BACKGROUNDS: ChromaBackground[] = [
  { id: "transparent", label: "None", type: "color", value: "transparent" },
  { id: "black", label: "Black", type: "color", value: "#000000" },
  { id: "white", label: "White", type: "color", value: "#FFFFFF" },
  { id: "dark_blue", label: "Deep Blue", type: "color", value: "#0A1929" },
  { id: "purple", label: "Purple", type: "color", value: "#1A0A2E" },
  { id: "sunset", label: "Sunset", type: "gradient", value: "#FF6B35,#D62828,#003049" },
  { id: "ocean", label: "Ocean", type: "gradient", value: "#0077B6,#023E8A,#03045E" },
  { id: "neon", label: "Neon", type: "gradient", value: "#0A0A2E,#2B0A3D,#0A0A2E" },
  { id: "forest", label: "Forest", type: "gradient", value: "#1B4332,#2D6A4F,#081C15" },
  { id: "fire", label: "Fire", type: "gradient", value: "#FF4500,#FF6B00,#1A0A00" },
  { id: "aurora", label: "Aurora", type: "gradient", value: "#0A0A2E,#1B4D3E,#2E1065" },
  { id: "warm", label: "Warm", type: "gradient", value: "#2A1A0A,#5A3A10,#2A1A0A" },
];

export function renderChromaBackground(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  bg: ChromaBackground,
) {
  if (bg.value === "transparent") return;
  
  ctx.save();
  if (bg.type === "color") {
    ctx.fillStyle = bg.value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const colors = bg.value.split(",");
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    colors.forEach((c, i) => gradient.addColorStop(i / Math.max(1, colors.length - 1), c.trim()));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
}
