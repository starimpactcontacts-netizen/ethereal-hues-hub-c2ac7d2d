/**
 * StudioEmptyState — Cinematic entry screen
 * Competing with Filmora/CapCut/Premiere Pro first impressions
 */
import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Film, Upload, Wand2, ChevronLeft, Zap, Layers, Diamond, Sparkles, Music, ArrowUpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#9999FF";

const HERO_FEATURES = [
  { icon: Zap, label: "24+ Real-time FX", color: "#FF6B00" },
  { icon: Layers, label: "Multi-track PiP", color: "#00D4FF" },
  { icon: Diamond, label: "Keyframe Animation", color: "#AA44FF" },
  { icon: Sparkles, label: "Auto-Edit", color: "#FF004F" },
  { icon: Music, label: "Audio Mixing", color: "#A855F7" },
  { icon: ArrowUpCircle, label: "4K Upscale", color: "#22CC88" },
];

interface StudioEmptyStateProps {
  onOpenPicker: () => void;
  onAutoEdit: () => void;
  onBack?: () => void;
}

export default function StudioEmptyState({ onOpenPicker, onAutoEdit, onBack }: StudioEmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center px-6 touch-none overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 20%, #12121f 0%, #050508 60%, #000 100%)" }}
      onClick={onOpenPicker}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: `radial-gradient(circle, ${ACCENT}08, transparent 70%)`, filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,0,79,0.04), transparent 70%)", filter: "blur(50px)" }} />
      </div>

      {/* Back button */}
      <button
        onClick={(e) => { e.stopPropagation(); onBack ? onBack() : navigate("/hub"); }}
        className="absolute top-4 left-4 safe-top p-2.5 rounded-xl transition-all active:scale-95"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <ChevronLeft className="w-5 h-5" style={{ color: "#555" }} />
      </button>

      {/* Pro badge */}
      <div className="absolute top-5 right-5 safe-top flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ background: "rgba(153,153,255,0.05)", border: "1px solid rgba(153,153,255,0.1)" }}>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
        />
        <span className="text-[8px] font-black tracking-[0.2em] uppercase" style={{ color: ACCENT }}>STUDIO PRO</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-8 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated studio icon */}
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -inset-6 rounded-[32px]"
            style={{ background: `radial-gradient(circle, ${ACCENT}10, transparent)`, filter: "blur(20px)" }}
          />
          <motion.div
            animate={{ rotateY: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="w-24 h-24 rounded-[28px] flex items-center justify-center relative"
            style={{
              background: "linear-gradient(135deg, rgba(153,153,255,0.1), rgba(153,153,255,0.02))",
              border: "1px solid rgba(153,153,255,0.12)",
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}
          >
            <Film className="w-10 h-10" style={{ color: ACCENT }} />
            {/* Corner accent */}
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "#FF004F", boxShadow: "0 2px 8px rgba(255,0,79,0.4)" }}>
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white">
            Loopgate <span style={{ color: ACCENT }}>Studio</span>
          </h1>
          <p className="text-[12px] max-w-[260px] leading-relaxed" style={{ color: "#555" }}>
            Professional editing that rivals Premiere Pro, Final Cut & DaVinci — right from your phone.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onOpenPicker}
            className="h-14 px-10 rounded-2xl text-[14px] font-bold flex items-center gap-3 transition-all relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #7777DD)`,
              color: "#000",
              boxShadow: `0 4px 24px ${ACCENT}40, 0 1px 0 inset rgba(255,255,255,0.15)`,
            }}
          >
            <Upload className="w-5 h-5" /> Import Video
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); onAutoEdit(); }}
            className="h-11 px-7 rounded-xl text-[13px] font-semibold flex items-center gap-2.5 transition-all"
            style={{
              background: "rgba(255,0,79,0.06)",
              color: "#FF004F",
              border: "1px solid rgba(255,0,79,0.15)",
              boxShadow: "0 2px 12px rgba(255,0,79,0.05)",
            }}
          >
            <Wand2 className="w-4 h-4" /> AI Auto-Edit
          </motion.button>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-3 gap-2 max-w-[300px] w-full">
          {HERO_FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <Icon className="w-4 h-4" style={{ color: feat.color }} />
                <span className="text-[7px] font-bold text-center leading-tight" style={{ color: "#555" }}>{feat.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom tagline */}
        <div className="flex items-center gap-2">
          <div className="h-px w-8" style={{ background: "linear-gradient(90deg, transparent, #333)" }} />
          <span className="text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: "#333" }}>
            ZERO COMPROMISE
          </span>
          <div className="h-px w-8" style={{ background: "linear-gradient(90deg, #333, transparent)" }} />
        </div>
      </motion.div>
    </div>
  );
}
