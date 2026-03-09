/**
 * MotionTemplates — Pre-built motion graphics (Lower thirds, Intros, Outros, CTAs)
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutTemplate, Type, Tv, Zap, ArrowRight, X, Check } from "lucide-react";

const ACCENT = "#9999FF";

export type MotionTemplate = {
  id: string;
  label: string;
  category: "lower_third" | "intro" | "outro" | "cta" | "title_card";
  duration: number; // seconds
  color: string;
  accentColor: string;
  animation: "slide" | "fade" | "bounce" | "typewriter" | "glitch" | "scale";
  position: "bottom-left" | "bottom-center" | "center" | "top-center";
  fields: { id: string; label: string; defaultValue: string; maxLength: number }[];
};

export const MOTION_TEMPLATES: MotionTemplate[] = [
  // Lower Thirds
  {
    id: "lt_modern", label: "Modern Bar", category: "lower_third", duration: 4,
    color: "#ffffff", accentColor: "#9999FF", animation: "slide", position: "bottom-left",
    fields: [
      { id: "name", label: "Name", defaultValue: "Editor Name", maxLength: 30 },
      { id: "title", label: "Title", defaultValue: "@username", maxLength: 40 },
    ],
  },
  {
    id: "lt_minimal", label: "Minimal Line", category: "lower_third", duration: 3,
    color: "#ffffff", accentColor: "#22C55E", animation: "fade", position: "bottom-left",
    fields: [
      { id: "name", label: "Name", defaultValue: "Editor Name", maxLength: 30 },
    ],
  },
  {
    id: "lt_glitch", label: "Glitch Tag", category: "lower_third", duration: 3,
    color: "#FF004F", accentColor: "#00FFAA", animation: "glitch", position: "bottom-left",
    fields: [
      { id: "name", label: "Name", defaultValue: "EDITOR", maxLength: 20 },
      { id: "title", label: "Subtitle", defaultValue: "LOOPGATE", maxLength: 30 },
    ],
  },
  {
    id: "lt_broadcast", label: "Broadcast", category: "lower_third", duration: 5,
    color: "#ffffff", accentColor: "#3B82F6", animation: "slide", position: "bottom-center",
    fields: [
      { id: "name", label: "Name", defaultValue: "Breaking", maxLength: 30 },
      { id: "title", label: "Description", defaultValue: "New edit just dropped", maxLength: 50 },
    ],
  },

  // Title Cards
  {
    id: "tc_cinematic", label: "Cinematic Title", category: "title_card", duration: 4,
    color: "#ffffff", accentColor: "#D4A030", animation: "scale", position: "center",
    fields: [
      { id: "name", label: "Title", defaultValue: "THE EDIT", maxLength: 30 },
      { id: "title", label: "Subtitle", defaultValue: "A Loopgate Production", maxLength: 50 },
    ],
  },
  {
    id: "tc_bold", label: "Bold Impact", category: "title_card", duration: 3,
    color: "#ffffff", accentColor: "#FF004F", animation: "bounce", position: "center",
    fields: [
      { id: "name", label: "Title", defaultValue: "WATCH THIS", maxLength: 20 },
    ],
  },

  // Intros
  {
    id: "intro_count", label: "Countdown", category: "intro", duration: 5,
    color: "#ffffff", accentColor: "#FF6B00", animation: "scale", position: "center",
    fields: [
      { id: "name", label: "Channel", defaultValue: "LOOPGATE", maxLength: 20 },
    ],
  },

  // CTAs
  {
    id: "cta_follow", label: "Follow CTA", category: "cta", duration: 3,
    color: "#ffffff", accentColor: "#EF4444", animation: "bounce", position: "bottom-center",
    fields: [
      { id: "name", label: "CTA Text", defaultValue: "FOLLOW FOR MORE", maxLength: 25 },
      { id: "title", label: "Handle", defaultValue: "@username", maxLength: 30 },
    ],
  },
  {
    id: "cta_subscribe", label: "Subscribe", category: "cta", duration: 4,
    color: "#ffffff", accentColor: "#FF0000", animation: "slide", position: "bottom-center",
    fields: [
      { id: "name", label: "Text", defaultValue: "SUBSCRIBE", maxLength: 20 },
      { id: "title", label: "Sub text", defaultValue: "Join the crew", maxLength: 30 },
    ],
  },

  // Outros
  {
    id: "outro_end", label: "End Screen", category: "outro", duration: 6,
    color: "#ffffff", accentColor: "#9999FF", animation: "fade", position: "center",
    fields: [
      { id: "name", label: "Thanks", defaultValue: "Thanks for watching", maxLength: 30 },
      { id: "title", label: "Next", defaultValue: "More edits coming soon", maxLength: 40 },
    ],
  },
];

export type AppliedTemplate = {
  id: string;
  templateId: string;
  startTime: number;
  fieldValues: Record<string, string>;
};

/**
 * Render a motion template onto canvas
 */
export function renderMotionTemplate(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  template: MotionTemplate,
  fieldValues: Record<string, string>,
  progress: number // 0-1 within the template's duration
): void {
  const w = canvas.width;
  const h = canvas.height;

  // Animation easing
  const enterDuration = 0.15;
  const exitStart = 0.85;
  let animProgress = 1;
  let opacity = 1;

  if (progress < enterDuration) {
    animProgress = progress / enterDuration;
    opacity = animProgress;
  } else if (progress > exitStart) {
    animProgress = 1 - (progress - exitStart) / (1 - exitStart);
    opacity = animProgress;
  }

  ctx.save();
  ctx.globalAlpha = opacity;

  const name = fieldValues["name"] || template.fields[0]?.defaultValue || "";
  const title = fieldValues["title"] || template.fields[1]?.defaultValue || "";

  // Position
  let x = 0, y = 0;
  switch (template.position) {
    case "bottom-left": x = w * 0.05; y = h * 0.82; break;
    case "bottom-center": x = w * 0.5; y = h * 0.85; break;
    case "center": x = w * 0.5; y = h * 0.5; break;
    case "top-center": x = w * 0.5; y = h * 0.15; break;
  }

  // Animation transforms
  switch (template.animation) {
    case "slide":
      if (progress < enterDuration) x -= (1 - animProgress) * w * 0.3;
      break;
    case "bounce":
      if (progress < enterDuration) {
        const bounce = Math.sin(animProgress * Math.PI * 2) * (1 - animProgress) * 10;
        y += bounce;
      }
      break;
    case "scale": {
      const scale = progress < enterDuration ? animProgress : (progress > exitStart ? animProgress : 1);
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.translate(-x, -y);
      break;
    }
  }

  const isCenter = template.position === "center" || template.position === "top-center";
  ctx.textAlign = isCenter ? "center" : "left";

  if (template.category === "lower_third") {
    // Background bar
    const barW = Math.max(200, name.length * 14 + 40);
    const barX = isCenter ? x - barW / 2 : x;
    
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.beginPath();
    ctx.roundRect(barX, y - 12, barW, title ? 38 : 24, 4);
    ctx.fill();

    // Accent line
    ctx.fillStyle = template.accentColor;
    ctx.fillRect(barX, y - 12, 3, title ? 38 : 24);

    // Text
    ctx.fillStyle = template.color;
    ctx.font = `bold ${Math.round(w * 0.025)}px system-ui`;
    ctx.fillText(name, barX + 12, y + 4);

    if (title) {
      ctx.font = `${Math.round(w * 0.018)}px system-ui`;
      ctx.fillStyle = template.accentColor;
      ctx.fillText(title, barX + 12, y + 22);
    }
  } else if (template.category === "title_card" || template.category === "intro") {
    ctx.fillStyle = template.color;
    ctx.font = `900 ${Math.round(w * 0.06)}px system-ui`;
    ctx.fillText(name, x, y);

    if (title) {
      ctx.font = `300 ${Math.round(w * 0.022)}px system-ui`;
      ctx.fillStyle = template.accentColor;
      ctx.fillText(title, x, y + w * 0.05);
    }
  } else if (template.category === "cta") {
    const btnW = Math.max(160, name.length * 12 + 40);
    const btnH = 36;
    const btnX = isCenter ? x - btnW / 2 : x;

    ctx.fillStyle = template.accentColor;
    ctx.beginPath();
    ctx.roundRect(btnX, y - btnH / 2, btnW, btnH, 8);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = `800 ${Math.round(w * 0.022)}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(name, btnX + btnW / 2, y + 6);

    if (title) {
      ctx.font = `${Math.round(w * 0.016)}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(title, btnX + btnW / 2, y + btnH / 2 + 16);
    }
  } else if (template.category === "outro") {
    ctx.fillStyle = template.color;
    ctx.font = `600 ${Math.round(w * 0.035)}px system-ui`;
    ctx.fillText(name, x, y);
    if (title) {
      ctx.font = `300 ${Math.round(w * 0.02)}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(title, x, y + w * 0.04);
    }
  }

  ctx.restore();
}

interface MotionTemplatesPanelProps {
  appliedTemplates: AppliedTemplate[];
  currentTime: number;
  onApplyTemplate: (template: MotionTemplate, fieldValues: Record<string, string>, startTime: number) => void;
  onRemoveTemplate: (id: string) => void;
  onClose: () => void;
}

export default function MotionTemplatesPanel({
  appliedTemplates, currentTime, onApplyTemplate, onRemoveTemplate, onClose,
}: MotionTemplatesPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MotionTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [filterCat, setFilterCat] = useState<string>("all");

  const categories = [
    { id: "all", label: "All" },
    { id: "lower_third", label: "Lower Thirds" },
    { id: "title_card", label: "Titles" },
    { id: "cta", label: "CTAs" },
    { id: "intro", label: "Intros" },
    { id: "outro", label: "Outros" },
  ];

  const filtered = filterCat === "all" ? MOTION_TEMPLATES : MOTION_TEMPLATES.filter(t => t.category === filterCat);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4" style={{ color: "#EC4899" }} />
          <span className="text-[11px] font-bold text-white">Motion Graphics</span>
        </div>
        <button onClick={onClose} className="text-[10px]" style={{ color: "#555" }}>Done</button>
      </div>

      {selectedTemplate ? (
        /* Field editor */
        <div className="space-y-2">
          <button onClick={() => setSelectedTemplate(null)} className="text-[9px] flex items-center gap-1" style={{ color: ACCENT }}>
            ← Back to templates
          </button>
          <div className="text-[10px] font-bold text-white">{selectedTemplate.label}</div>
          {selectedTemplate.fields.map((field) => (
            <div key={field.id}>
              <label className="text-[8px] block mb-0.5" style={{ color: "#555" }}>{field.label}</label>
              <input
                type="text"
                value={fieldValues[field.id] ?? field.defaultValue}
                onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                maxLength={field.maxLength}
                className="w-full px-2.5 py-2 rounded-lg text-[10px] font-bold text-white outline-none"
                style={{ background: "#111", border: "1px solid #1a1a1a" }}
              />
            </div>
          ))}
          <button
            onClick={() => {
              onApplyTemplate(selectedTemplate, fieldValues, currentTime);
              setSelectedTemplate(null);
              setFieldValues({});
            }}
            className="w-full py-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 active:scale-97 transition-all"
            style={{ background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.3)", color: "#EC4899" }}>
            <Check className="w-3.5 h-3.5" /> Apply at {currentTime.toFixed(1)}s
          </button>
        </div>
      ) : (
        <>
          {/* Category filter */}
          <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setFilterCat(cat.id)}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[8px] font-bold"
                style={{
                  background: filterCat === cat.id ? "rgba(236,72,153,0.1)" : "#111",
                  color: filterCat === cat.id ? "#EC4899" : "#555",
                  border: filterCat === cat.id ? "1px solid rgba(236,72,153,0.22)" : "1px solid #1a1a1a",
                }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {filtered.map((t) => (
              <button key={t.id} onClick={() => { setSelectedTemplate(t); setFieldValues({}); }}
                className="rounded-xl p-3 text-left transition-all active:scale-95"
                style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="w-full h-10 rounded-lg mb-2 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${t.accentColor}20, ${t.accentColor}05)`, border: `1px solid ${t.accentColor}20` }}>
                  <span className="text-[7px] font-black tracking-wider" style={{ color: t.accentColor }}>
                    {t.fields[0]?.defaultValue.toUpperCase()}
                  </span>
                </div>
                <span className="text-[8px] font-bold text-white block">{t.label}</span>
                <span className="text-[7px]" style={{ color: "#555" }}>{t.duration}s · {t.animation}</span>
              </button>
            ))}
          </div>

          {/* Applied templates */}
          {appliedTemplates.length > 0 && (
            <div className="space-y-1">
              <span className="text-[8px] font-bold" style={{ color: "#444" }}>APPLIED</span>
              {appliedTemplates.map((at) => {
                const tmpl = MOTION_TEMPLATES.find(t => t.id === at.templateId);
                return (
                  <div key={at.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "#111" }}>
                    <span className="text-[8px] font-bold text-white flex-1">{tmpl?.label}</span>
                    <span className="text-[7px] font-mono" style={{ color: "#555" }}>{at.startTime.toFixed(1)}s</span>
                    <button onClick={() => onRemoveTemplate(at.id)} className="p-0.5">
                      <X className="w-2.5 h-2.5" style={{ color: "#555" }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
