import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Download, Film, Play, Pause, Type, Music, X,
  Loader2, Check, SkipBack, SkipForward, Scissors, RotateCcw,
  ChevronLeft, ChevronDown, Sparkles, Volume2, VolumeX, Gauge, Layers, Move,
  Wand2, SlidersHorizontal, Settings, ArrowUpCircle, Crop,
  Zap, Vibrate, Search, FlipHorizontal, FlipVertical, Grid3x3, Waves,
  Rainbow, RefreshCw, Paintbrush, Gem, LayoutGrid,
  MonitorPlay, FilmIcon, Circle, Wind, Smartphone, Monitor, Square,
  Sun, Lightbulb, Sunrise, RectangleHorizontal, RectangleVertical,
  ArrowLeft, ArrowRight, ArrowUp, MoveHorizontal,
  RotateCw, Maximize, Minimize, Blend, Activity, Eye,
  Diamond, Layers as LayersIcon, AudioLines
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StudioSubmitButton from "./StudioSubmitButton";
import AutoEditWizard from "./studio/AutoEditWizard";
import MobileAITools from "./studio/MobileAITools";
import GestureTimeline from "./studio/GestureTimeline";
import KeyframeEditor, { interpolateKeyframes, type Keyframe, type KeyframedProperty } from "./studio/KeyframeEditor";
import BlendModePanel, { BLEND_MODES, OVERLAY_PRESETS, applyOverlay, type BlendMode, type OverlayPreset } from "./studio/BlendModes";
import ColorScopes from "./studio/ColorScopes";
import MaskingPanel, { renderMaskToCanvas, type Mask, type MaskShape, DEFAULT_MASK } from "./studio/MaskingPanel";
import AudioFXPanel, { DEFAULT_AUDIO_FX, type AudioFXState } from "./studio/AudioFXPanel";
import MotionTemplatesPanel, { MOTION_TEMPLATES, renderMotionTemplate, type AppliedTemplate } from "./studio/MotionTemplates";
import CompositorPanel, { renderCompositorLayers, DEFAULT_PIP, type CompositorLayer } from "./studio/CompositorPanel";
import { LUT_PRESETS, applyLUTPreset, type LUT3D } from "@/lib/studioColorScience";
import { MotionSmoother, estimateMotion, applyStabilization, DEFAULT_STABILIZER, type StabilizerConfig } from "@/lib/studioStabilizer";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  FILTER_PRESETS, TEXT_STYLES, EFFECTS, TRANSITIONS, SPEED_OPTIONS,
  EXPORT_QUALITIES,
  applyEffect, renderTextOverlay, buildComputedFilter, formatTimecode,
  type FilterPreset, type TextStyleKey, type ExportQuality,
} from "@/lib/studioEffects";
import {
  DEFAULT_ADJUSTMENTS, ADJUST_SECTIONS,
  buildAdjustFilter, applyCanvasAdjustments, hasAdjustments,
  type AdjustmentValues, type AdjustSection,
} from "@/lib/studioAdjustments";
import { SPEED_CURVE_PRESETS, getSpeedAtTime, type SpeedCurve } from "@/lib/studioSpeedCurves";

type TextOverlay = { id: string; text: string; x: number; y: number; style: TextStyleKey; startTime: number; endTime: number };
type EditorTool = "trim" | "filters" | "text" | "audio" | "speed" | "effects" | "transitions" | "adjust" | "export" | "upscale" | "crop" | "keyframes" | "blend" | "scopes" | "masks" | "audiofx" | "motion" | "compositor" | "stabilize";

// ─── Crop Presets (v1.5) ───
type CropPreset = { id: string; label: string; icon: typeof Monitor; ratio: number; desc: string };
const CROP_PRESETS: CropPreset[] = [
  { id: "16:9", label: "16:9", icon: Monitor, ratio: 16 / 9, desc: "YouTube" },
  { id: "9:16", label: "9:16", icon: Smartphone, ratio: 9 / 16, desc: "TikTok / Reels" },
  { id: "1:1", label: "1:1", icon: Square, ratio: 1, desc: "Square" },
  { id: "4:5", label: "4:5", icon: RectangleVertical, ratio: 4 / 5, desc: "Instagram" },
  { id: "4:3", label: "4:3", icon: RectangleHorizontal, ratio: 4 / 3, desc: "Classic" },
  { id: "21:9", label: "21:9", icon: RectangleHorizontal, ratio: 21 / 9, desc: "Ultrawide" },
];

const ACCENT = "#9999FF";
const ACCENT_DIM = "rgba(153,153,255,0.10)";
const ACCENT_BORDER = "rgba(153,153,255,0.22)";

type ExportFormat = { mimeType: string; extension: "mp4" | "webm" };
const EXPORT_FORMATS: ExportFormat[] = [
  { mimeType: "video/mp4;codecs=h264", extension: "mp4" },
  { mimeType: "video/mp4", extension: "mp4" },
  { mimeType: "video/webm;codecs=vp9", extension: "webm" },
  { mimeType: "video/webm", extension: "webm" },
];

function resolveExportFormat(): ExportFormat {
  for (const format of EXPORT_FORMATS) {
    if (MediaRecorder.isTypeSupported(format.mimeType)) return format;
  }
  return { mimeType: "video/webm", extension: "webm" };
}

// ─── Icon Maps (match desktop) ───
const EFFECT_ICONS: Record<string, typeof Zap> = {
  glitch: Zap, shake: Vibrate, zoom_pulse: Search, mirror: FlipHorizontal,
  pixelate: Grid3x3, wave: Waves, rgb_split: Rainbow, invert: RefreshCw,
  duotone: Paintbrush, chromatic: Gem, posterize: LayoutGrid, vhs: MonitorPlay,
  grain: FilmIcon, halftone: Circle, blur_pulse: Wind, flash: Sun,
  light_leak: Sunrise, strobe: Lightbulb,
};

const TRANSITION_ICONS: Record<string, typeof Zap> = {
  fade: Sunrise, dissolve: Sparkles, slide_left: ArrowLeft, slide_right: ArrowRight,
  slide_up: ArrowUp, wipe: MoveHorizontal, zoom_in: Maximize, zoom_out: Minimize,
  spin: RotateCw, blur_trans: Wind, glitch_trans: Zap, flash_trans: Sun,
};

const FILTER_PREVIEWS: Record<string, string> = {
  none: "linear-gradient(135deg, #444 0%, #666 100%)",
  chrome: "linear-gradient(135deg, #8BA4B0 0%, #C0CDD4 50%, #7A9AAC 100%)",
  fade: "linear-gradient(135deg, #A5B0C0 0%, #D5D0CA 50%, #B0A8A0 100%)",
  bw: "linear-gradient(135deg, #222 0%, #888 50%, #444 100%)",
  cinematic: "linear-gradient(135deg, #2A1F14 0%, #7A5B3E 50%, #3A2A1C 100%)",
  noir: "linear-gradient(135deg, #0A0A0A 0%, #3A3A3A 50%, #1A1A1A 100%)",
  blockbuster: "linear-gradient(135deg, #1A2540 0%, #3A5580 50%, #0E1830 100%)",
  anamorphic: "linear-gradient(135deg, #1A3040 0%, #2A5A70 50%, #183848 100%)",
  teal_orange: "linear-gradient(135deg, #1A5A5A 0%, #D4804A 50%, #186060 100%)",
  phonk: "linear-gradient(135deg, #3A0020 0%, #8A1050 50%, #200010 100%)",
  cold: "linear-gradient(135deg, #1A3050 0%, #4A7AAA 50%, #2A4060 100%)",
  heat: "linear-gradient(135deg, #5A1A0A 0%, #D4602A 50%, #3A1005 100%)",
  neon: "linear-gradient(135deg, #2A0050 0%, #AA30DD 50%, #5500AA 100%)",
  dream: "linear-gradient(135deg, #3A2060 0%, #8A60B0 50%, #5A3A80 100%)",
  lofi: "linear-gradient(135deg, #2A0A0A 0%, #6A2020 50%, #3A1010 100%)",
  golden_hour: "linear-gradient(135deg, #5A3A10 0%, #D4A030 50%, #7A5020 100%)",
  midnight: "linear-gradient(135deg, #0A0A2A 0%, #1A2050 50%, #050520 100%)",
  toxic: "linear-gradient(135deg, #0A2A0A 0%, #30AA30 50%, #0A4A0A 100%)",
  vintage: "linear-gradient(135deg, #4A3520 0%, #8A6A40 50%, #5A4030 100%)",
  kodak: "linear-gradient(135deg, #5A4020 0%, #C49040 50%, #6A5030 100%)",
  fuji: "linear-gradient(135deg, #1A4040 0%, #50A090 50%, #2A5050 100%)",
  polaroid: "linear-gradient(135deg, #706050 0%, #C0B0A0 50%, #908070 100%)",
  film_burn: "linear-gradient(135deg, #3A1005 0%, #AA4020 50%, #5A2010 100%)",
  super8: "linear-gradient(135deg, #2A1A0A 0%, #6A4A20 50%, #3A2A10 100%)",
};

interface QuickClipEditorProps {
  initialFile?: File | null;
  onBack?: () => void;
}

export default function QuickClipEditor({ initialFile, onBack }: QuickClipEditorProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const [file, setFile] = useState<File | null>(initialFile ?? null);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialFile ? URL.createObjectURL(initialFile) : null);
  
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterPreset>(FILTER_PRESETS[0]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [textInput, setTextInput] = useState("");
  const [textStyle, setTextStyle] = useState<TextStyleKey>("bold");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState("");
  const [activeTool, setActiveTool] = useState<EditorTool | null>(null);
  const [state, setState] = useState<"idle" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultExt, setResultExt] = useState<"mp4" | "webm">("webm");
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!initialFile);
  const [autoEditOpen, setAutoEditOpen] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [activeTransition, setActiveTransition] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);
  const [exportQuality, setExportQuality] = useState<ExportQuality>("standard");
  const [filterTab, setFilterTab] = useState<string>("all");

  // Advanced adjustments
  const [adjustments, setAdjustments] = useState<AdjustmentValues>({ ...DEFAULT_ADJUSTMENTS });
  const [openSections, setOpenSections] = useState<Record<AdjustSection, boolean>>({ color: true, lightness: true, effects: false });

  // Upscale state
  const upscaleInputRef = useRef<HTMLInputElement>(null);
  const [upscaleFile, setUpscaleFile] = useState<File | null>(null);
  const [upscaleUrl, setUpscaleUrl] = useState<string | null>(null);
  const [upscaleMode, setUpscaleMode] = useState<"2x" | "4x">("2x");
  const [upscaleState, setUpscaleState] = useState<"idle" | "processing" | "done">("idle");
  const [upscaleProgress, setUpscaleProgress] = useState(0);
  const [upscaleResultUrl, setUpscaleResultUrl] = useState<string | null>(null);
  const [upscaleResultExt, setUpscaleResultExt] = useState<"mp4" | "webm">("webm");
  const [upscaleDims, setUpscaleDims] = useState<{ w: number; h: number } | null>(null);

  // Crop & Transform (v1.5)
  const [cropPreset, setCropPreset] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // ═══ TRANSFORM v2.0 — StretchTok Ready ═══
  const [scaleX, setScaleX] = useState(1.0);
  const [scaleY, setScaleY] = useState(1.0);
  const [posX, setPosX] = useState(0.5);   // 0-1 normalized (0.5 = center)
  const [posY, setPosY] = useState(0.5);
  const [videoOpacity, setVideoOpacity] = useState(1.0);
  const [freeRotation, setFreeRotation] = useState(0); // -180 to 180
  const [scaleLocked, setScaleLocked] = useState(true);

  // Speed Curves (v1.5)
  const [activeSpeedCurve, setActiveSpeedCurve] = useState<SpeedCurve | null>(null);

  // Blend & Overlay
  const [blendMode, setBlendMode] = useState<BlendMode>("source-over");
  const [activeOverlayId, setActiveOverlayId] = useState("none");
  const [overlayOpacity, setOverlayOpacity] = useState(0.3);

  // Keyframes
  const [keyframeData, setKeyframeData] = useState<Record<string, Keyframe[]>>({});

  // Timeline markers & layers
  const [timelineMarkers, setTimelineMarkers] = useState<{ id: string; time: number; color: string; label: string; type: "cut" | "beat" | "effect" | "caption" }[]>([]);

  // AI Tools overlay
  const [aiToolsOpen, setAiToolsOpen] = useState(false);

  // ═══ NEW PRO TOOLS STATE ═══
  // Color Scopes & LUTs
  const [activeLUT, setActiveLUT] = useState<string | null>(null);
  const [lutIntensity, setLutIntensity] = useState(1.0);
  const [customLUT, setCustomLUT] = useState<LUT3D | null>(null);

  // Masking
  const [masks, setMasks] = useState<Mask[]>([]);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);

  // Audio FX
  const [audioFX, setAudioFX] = useState<AudioFXState>({ ...DEFAULT_AUDIO_FX });

  // Motion Graphics Templates
  const [appliedTemplates, setAppliedTemplates] = useState<AppliedTemplate[]>([]);

  // Compositor (PiP / Split Screen)
  const [compositorLayers, setCompositorLayers] = useState<CompositorLayer[]>([]);
  const [selectedCompositorLayerId, setSelectedCompositorLayerId] = useState<string | null>(null);
  const [activeSplitLayout, setActiveSplitLayout] = useState<string | null>(null);
  const compositorVideos = useRef(new Map<string, HTMLVideoElement>());

  // Stabilizer
  const [stabilizer, setStabilizer] = useState<StabilizerConfig>({ ...DEFAULT_STABILIZER });
  const stabSmoother = useRef(new MotionSmoother(0.5));
  const prevFrameData = useRef<ImageData | null>(null);

  // Chroma key
  const [chromaEnabled, setChromaEnabled] = useState(false);
  const [chromaColor, setChromaColor] = useState("#00FF00");
  const [chromaThreshold, setChromaThreshold] = useState(80);

  const hasTriggeredPicker = useRef(false);

  const computedFilter = useMemo(() => buildComputedFilter(activeFilter, brightness, contrast, saturation, hueRotate), [activeFilter, brightness, contrast, saturation, hueRotate]);

  // Chroma key function
  const applyChromaKey = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, keyColor: string, threshold: number) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    // Parse hex color
    const r0 = parseInt(keyColor.slice(1, 3), 16);
    const g0 = parseInt(keyColor.slice(3, 5), 16);
    const b0 = parseInt(keyColor.slice(5, 7), 16);
    for (let i = 0; i < data.length; i += 4) {
      const dist = Math.sqrt(
        (data[i] - r0) ** 2 + (data[i + 1] - g0) ** 2 + (data[i + 2] - b0) ** 2
      );
      if (dist < threshold) {
        data[i + 3] = 0; // Make transparent
      } else if (dist < threshold * 1.5) {
        data[i + 3] = Math.round(((dist - threshold) / (threshold * 0.5)) * 255);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);

  // Keyframe helpers
  const addKeyframe = useCallback((propertyId: string, time: number, value: number) => {
    setKeyframeData(prev => ({
      ...prev,
      [propertyId]: [...(prev[propertyId] || []), { id: crypto.randomUUID(), time, value, easing: "ease-out" as const }],
    }));
    toast.success(`Keyframe added at ${time.toFixed(1)}s`);
  }, []);

  const removeKeyframe = useCallback((propertyId: string, keyframeId: string) => {
    setKeyframeData(prev => ({
      ...prev,
      [propertyId]: (prev[propertyId] || []).filter(kf => kf.id !== keyframeId),
    }));
  }, []);

  const toggleEffect = (effectId: string) => {
    setActiveEffects(prev => prev.includes(effectId) ? prev.filter(e => e !== effectId) : [...prev, effectId]);
  };

  const resetColorGrading = () => { setBrightness(100); setContrast(100); setSaturation(100); setHueRotate(0); setAdjustments({ ...DEFAULT_ADJUSTMENTS }); };

  const updateAdjustment = (key: keyof AdjustmentValues, value: number) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  const toggleSection = (section: AdjustSection) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const openVideoPicker = useCallback(() => {
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }, []);

  // Auto-open file picker + one-tap fallback for iOS/Android restrictions
  // Skip if initialFile was provided (coming from StudioHome)
  useEffect(() => {
    if (file) {
      hasTriggeredPicker.current = false;
      return;
    }
    if (initialFile) return; // Don't auto-trigger if we had an initial file
    if (hasTriggeredPicker.current) return;

    hasTriggeredPicker.current = true;
    const t = window.setTimeout(() => openVideoPicker(), 80);
    const onFirstTap = () => openVideoPicker();
    window.addEventListener("pointerup", onFirstTap, { once: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerup", onFirstTap);
    };
  }, [file, openVideoPicker, initialFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
    if (f.size > 2 * 1024 * 1024 * 1024) { toast.error("Max 2GB"); return; }
    setFile(f); setVideoUrl(URL.createObjectURL(f)); setResultUrl(null); setResultExt("webm"); setState("idle");
    setProgress(0); setTextOverlays([]); setActiveFilter(FILTER_PRESETS[0]);
    setAudioFile(null); setAudioName(""); setSpeed(1); setIsFullscreen(true);
    setActiveEffects([]); setActiveTransition(null); resetColorGrading();
    setScaleX(1); setScaleY(1); setPosX(0.5); setPosY(0.5); setVideoOpacity(1); setFreeRotation(0); setScaleLocked(true);
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("audio/")) { toast.error("Please select an audio file"); return; }
    setAudioFile(f); setAudioName(f.name); toast.success("Audio track added");
    e.target.value = "";
  };

  // Thumbnails
  useEffect(() => {
    if (!videoUrl) return;
    const vid = document.createElement("video");
    vid.src = videoUrl; vid.crossOrigin = "anonymous"; vid.muted = true; vid.preload = "auto";
    vid.onloadedmetadata = () => {
      setDuration(vid.duration); setTrimEnd(vid.duration);
      const count = Math.min(14, Math.max(6, Math.floor(vid.duration / 2)));
      const interval = vid.duration / count;
      const canvas = document.createElement("canvas"); canvas.width = 80; canvas.height = 60;
      const ctx = canvas.getContext("2d")!;
      const thumbs: string[] = []; let i = 0;
      const captureFrame = () => { if (i >= count) { setThumbnails(thumbs); return; } vid.currentTime = i * interval; };
      vid.onseeked = () => { ctx.drawImage(vid, 0, 0, 80, 60); thumbs.push(canvas.toDataURL("image/jpeg", 0.5)); i++; captureFrame(); };
      captureFrame();
    };
  }, [videoUrl]);

  // Video events
  useEffect(() => {
    const vid = videoRef.current; if (!vid) return;
    const onMeta = () => { setDuration(vid.duration); setTrimEnd(vid.duration); };
    const onTime = () => setCurrentTime(vid.currentTime);
    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("timeupdate", onTime);
    return () => { vid.removeEventListener("loadedmetadata", onMeta); vid.removeEventListener("timeupdate", onTime); };
  }, [videoUrl]);

  // Canvas render loop — with advanced adjustments + crop/transform (v1.5)
  useEffect(() => {
    const vid = videoRef.current; const canvas = canvasRef.current;
    if (!vid || !canvas || !videoUrl) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let running = true;
    const draw = () => {
      if (!running) return;
      if (vid.videoWidth && vid.videoHeight) {
        // Calculate output dimensions based on crop preset
        let outW = vid.videoWidth;
        let outH = vid.videoHeight;
        if (cropPreset) {
          const preset = CROP_PRESETS.find(p => p.id === cropPreset);
          if (preset) {
            const srcRatio = vid.videoWidth / vid.videoHeight;
            if (srcRatio > preset.ratio) {
              outW = Math.round(vid.videoHeight * preset.ratio);
              outH = vid.videoHeight;
            } else {
              outW = vid.videoWidth;
              outH = Math.round(vid.videoWidth / preset.ratio);
            }
          }
        }
        // Swap dimensions if rotated 90/270
        const isRotated90 = rotation === 90 || rotation === 270;
        const finalW = isRotated90 ? outH : outW;
        const finalH = isRotated90 ? outW : outH;
        if (canvas.width !== finalW || canvas.height !== finalH) {
          canvas.width = finalW; canvas.height = finalH;
        }
        const adjFilter = buildAdjustFilter(adjustments);
        const combinedFilter = [computedFilter, adjFilter].filter(f => f !== "none").join(" ") || "none";
        ctx.save();
        ctx.filter = combinedFilter;
        ctx.globalAlpha = videoOpacity;
        // Apply transforms — position, rotation, scale (stretch)
        const centerX = finalW * posX;
        const centerY = finalH * posY;
        ctx.translate(centerX, centerY);
        ctx.rotate(((rotation + freeRotation) * Math.PI) / 180);
        ctx.scale((flipH ? -1 : 1) * scaleX, (flipV ? -1 : 1) * scaleY);
        // Draw centered at transform origin
        const drawW = isRotated90 ? finalH : finalW;
        const drawH = isRotated90 ? finalW : finalH;
        const sx = (vid.videoWidth - outW) / 2;
        const sy = (vid.videoHeight - outH) / 2;
        ctx.drawImage(vid, sx, sy, outW, outH, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.globalAlpha = 1.0;
        ctx.restore();
        ctx.filter = "none";
        if (hasAdjustments(adjustments)) {
          applyCanvasAdjustments(ctx, canvas, adjustments);
        }
        activeEffects.forEach(effectId => { try { applyEffect(ctx, canvas, effectId, vid.currentTime); } catch { /* */ } });
        // Apply LUT
        if (activeLUT) {
          const lutPreset = LUT_PRESETS.find(l => l.id === activeLUT);
          if (lutPreset) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            applyLUTPreset(imageData, lutPreset, lutIntensity);
            ctx.putImageData(imageData, 0, 0);
          }
        }
        // Apply overlay
        const overlayPreset = OVERLAY_PRESETS.find(o => o.id === activeOverlayId);
        if (overlayPreset) applyOverlay(ctx, canvas, overlayPreset, overlayOpacity);
        // Apply chroma key
        if (chromaEnabled) {
          applyChromaKey(ctx, canvas, chromaColor, chromaThreshold);
        }
        // Apply masks
        if (masks.length > 0) {
          renderMaskToCanvas(ctx, canvas, masks);
        }
        // Render compositor layers (PiP)
        if (compositorLayers.length > 0) {
          renderCompositorLayers(ctx, canvas, compositorLayers, compositorVideos.current);
        }
        // Render motion templates
        appliedTemplates.forEach((at) => {
          const tmpl = MOTION_TEMPLATES.find(t => t.id === at.templateId);
          if (tmpl && vid.currentTime >= at.startTime && vid.currentTime <= at.startTime + tmpl.duration) {
            const progress = (vid.currentTime - at.startTime) / tmpl.duration;
            renderMotionTemplate(ctx, canvas, tmpl, at.fieldValues, progress);
          }
        });
        // Text overlays
        textOverlays.forEach((overlay) => {
          if (vid.currentTime >= overlay.startTime && vid.currentTime <= overlay.endTime) {
            try { renderTextOverlay(ctx, canvas, overlay.text, overlay.x, overlay.y, overlay.style); } catch { /* */ }
          }
        });
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [videoUrl, computedFilter, textOverlays, activeEffects, adjustments, cropPreset, rotation, flipH, flipV, scaleX, scaleY, posX, posY, videoOpacity, freeRotation, activeOverlayId, overlayOpacity, chromaEnabled, chromaColor, chromaThreshold, activeLUT, lutIntensity, masks, compositorLayers, appliedTemplates]);

  const togglePlay = () => {
    const vid = videoRef.current; if (!vid) return;
    if (vid.paused) {
      if (vid.currentTime < trimStart || vid.currentTime >= trimEnd) vid.currentTime = trimStart;
      vid.playbackRate = speed; vid.play().catch(() => {}); setPlaying(true);
    } else { vid.pause(); setPlaying(false); }
  };

  useEffect(() => {
    const vid = videoRef.current; if (!vid || !playing) return;
    const check = () => { if (vid.currentTime >= trimEnd) { vid.pause(); vid.currentTime = trimStart; setPlaying(false); } };
    const id = setInterval(check, 50);
    return () => clearInterval(id);
  }, [playing, trimEnd, trimStart]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted; }, [muted]);

  const addTextOverlay = () => {
    if (!textInput.trim()) return;
    setTextOverlays(prev => [...prev, { id: crypto.randomUUID(), text: textInput, x: 0.5, y: 0.5, style: textStyle, startTime: trimStart, endTime: trimEnd }]);
    setTextInput(""); toast.success("Text added");
  };

  const clearFile = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setVideoUrl(null); setResultUrl(null); setResultExt("webm"); setState("idle");
    setProgress(0); setTextOverlays([]); setActiveFilter(FILTER_PRESETS[0]);
    setAudioFile(null); setAudioName(""); setTrimStart(0); setTrimEnd(0);
    setPlaying(false); setThumbnails([]); setSpeed(1); setIsFullscreen(false);
    setActiveEffects([]); setActiveTransition(null); resetColorGrading();
    setScaleX(1); setScaleY(1); setPosX(0.5); setPosY(0.5); setVideoOpacity(1); setFreeRotation(0); setScaleLocked(true);
    hasTriggeredPicker.current = false;
  };

  const seekTo = (time: number) => {
    const vid = videoRef.current; if (!vid) return;
    const clamped = Math.max(0, Math.min(duration, time));
    vid.currentTime = clamped; setCurrentTime(clamped);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = trimStart + pct * (trimEnd - trimStart);
    seekTo(time);
  };

  // Export — with advanced adjustments
  const startExport = useCallback(async () => {
    const vid = videoRef.current; const canvas = canvasRef.current;
    if (!vid || !canvas || !file) return;
    setState("processing"); setProgress(0);
    const quality = EXPORT_QUALITIES.find(q => q.id === exportQuality) ?? EXPORT_QUALITIES[1];
    const exportFormat = resolveExportFormat();
    const ctx = canvas.getContext("2d")!;
    const exportW = Math.round(vid.videoWidth * quality.resolution);
    const exportH = Math.round(vid.videoHeight * quality.resolution);
    canvas.width = exportW; canvas.height = exportH;
    const stream = canvas.captureStream(quality.fps);
    if (audioFile) {
      try {
        const audioCtx = new AudioContext();
        const buf = await audioFile.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(buf);
        const source = audioCtx.createBufferSource();
        source.buffer = decoded;
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        source.start(0);
      } catch { /* continue without audio */ }
    }
    const recorderOptions: MediaRecorderOptions = { videoBitsPerSecond: quality.bitrate, mimeType: exportFormat.mimeType };
    const recorder = new MediaRecorder(stream, recorderOptions);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const resultPromise = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: exportFormat.mimeType })); });
    recorder.start(100);
    vid.currentTime = trimStart; vid.muted = true; vid.playbackRate = 1;
    await vid.play().catch(() => {});
    const exportDuration = trimEnd - trimStart;
    const drawLoop = () => {
      if (vid.currentTime >= trimEnd || vid.ended) { vid.pause(); recorder.stop(); return; }
      const adjFilter = buildAdjustFilter(adjustments);
      const combinedFilter = [computedFilter, adjFilter].filter(f => f !== "none").join(" ") || "none";
      ctx.save();
      ctx.filter = combinedFilter;
      ctx.globalAlpha = videoOpacity;
      const centerX = exportW * posX;
      const centerY = exportH * posY;
      ctx.translate(centerX, centerY);
      ctx.rotate(((rotation + freeRotation) * Math.PI) / 180);
      ctx.scale((flipH ? -1 : 1) * scaleX, (flipV ? -1 : 1) * scaleY);
      ctx.drawImage(vid, -exportW / 2, -exportH / 2, exportW, exportH);
      ctx.globalAlpha = 1.0;
      ctx.restore();
      ctx.filter = "none";
      if (hasAdjustments(adjustments)) {
        applyCanvasAdjustments(ctx, canvas, adjustments);
      }
      activeEffects.forEach(effectId => { try { applyEffect(ctx, canvas, effectId, vid.currentTime); } catch { /* */ } });
      textOverlays.forEach((overlay) => {
        if (vid.currentTime >= overlay.startTime && vid.currentTime <= overlay.endTime) {
          try { renderTextOverlay(ctx, canvas, overlay.text, overlay.x, overlay.y, overlay.style); } catch { /* */ }
        }
      });
      setProgress(Math.min(99, Math.round(((vid.currentTime - trimStart) / exportDuration) * 100)));
      requestAnimationFrame(drawLoop);
    };
    drawLoop();
    const blob = await resultPromise;
    setResultUrl(URL.createObjectURL(blob));
    setResultExt(exportFormat.extension);
    setProgress(100); setState("done"); vid.muted = muted; vid.playbackRate = speed;
    canvas.width = vid.videoWidth; canvas.height = vid.videoHeight;
    toast.success("Export complete!");
  }, [file, trimStart, trimEnd, computedFilter, textOverlays, audioFile, muted, speed, activeEffects, exportQuality, adjustments, scaleX, scaleY, posX, posY, videoOpacity, freeRotation, rotation, flipH, flipV, cropPreset]);

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a"); a.href = resultUrl;
    a.download = `${file.name.replace(/\.[^/.]+$/, "")}_loopgate.${resultExt}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const filteredFilters = useMemo(() => filterTab === "all" ? FILTER_PRESETS : FILTER_PRESETS.filter(f => f.category === filterTab), [filterTab]);

  // ─── Upscaler ───
  const handleUpscaleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f2 = e.target.files?.[0];
    if (!f2 || !f2.type.startsWith("video/")) { toast.error("Select a video file"); return; }
    if (f2.size > 2 * 1024 * 1024 * 1024) { toast.error("Max 2GB"); return; }
    setUpscaleFile(f2); setUpscaleUrl(URL.createObjectURL(f2));
    setUpscaleResultUrl(null); setUpscaleResultExt("webm"); setUpscaleState("idle"); setUpscaleProgress(0);
    e.target.value = "";
  };
  const startUpscale = useCallback(async () => {
    if (!upscaleUrl || !upscaleFile) return;
    setUpscaleState("processing"); setUpscaleProgress(0);
    const video = document.createElement("video");
    video.src = upscaleUrl; video.muted = true; video.playsInline = true;
    await new Promise<void>((res, rej) => { video.onloadedmetadata = () => res(); video.onerror = () => rej(); });
    const origW = video.videoWidth, origH = video.videoHeight;
    setUpscaleDims({ w: origW, h: origH });
    const scale = upscaleMode === "2x" ? 2 : 4;
    let finalW = origW * scale, finalH = origH * scale;
    if (finalW > 3840 || finalH > 3840) { const r = Math.min(3840 / finalW, 3840 / finalH); finalW = Math.round(finalW * r); finalH = Math.round(finalH * r); }
    finalW = finalW % 2 === 0 ? finalW : finalW + 1; finalH = finalH % 2 === 0 ? finalH : finalH + 1;
    const cvs = document.createElement("canvas"); cvs.width = finalW; cvs.height = finalH;
    const ctx2 = cvs.getContext("2d")!; ctx2.imageSmoothingEnabled = true; ctx2.imageSmoothingQuality = "high";
    const stream = cvs.captureStream(30);
    const exportFormat = resolveExportFormat();
    const recorder = new MediaRecorder(stream, {
      mimeType: exportFormat.mimeType,
      videoBitsPerSecond: Math.min(finalW * finalH * 8, 40_000_000),
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data); };
    const resultPromise = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: exportFormat.mimeType })); });
    recorder.start(100); video.currentTime = 0; await video.play();
    const dur = video.duration;
    const drawLoop = () => {
      if (video.ended || video.paused) { recorder.stop(); return; }
      ctx2.drawImage(video, 0, 0, finalW, finalH);
      setUpscaleProgress(Math.min(99, Math.round((video.currentTime / dur) * 100)));
      requestAnimationFrame(drawLoop);
    };
    drawLoop(); video.onended = () => recorder.stop();
    const blob = await resultPromise;
    setUpscaleResultUrl(URL.createObjectURL(blob)); setUpscaleResultExt(exportFormat.extension); setUpscaleProgress(100); setUpscaleState("done");
    toast.success("Video upscaled!"); video.pause(); video.src = "";
  }, [upscaleUrl, upscaleFile, upscaleMode]);
  const handleUpscaleDownload = () => {
    if (!upscaleResultUrl || !upscaleFile) return;
    const a = document.createElement("a"); a.href = upscaleResultUrl;
    a.download = `${upscaleFile.name.replace(/\.[^/.]+$/, "")}_${upscaleMode}_upscaled.${upscaleResultExt}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  const clearUpscale = () => {
    if (upscaleUrl) URL.revokeObjectURL(upscaleUrl);
    if (upscaleResultUrl) URL.revokeObjectURL(upscaleResultUrl);
    setUpscaleFile(null); setUpscaleUrl(null); setUpscaleResultUrl(null);
    setUpscaleState("idle"); setUpscaleProgress(0); setUpscaleDims(null);
  };

  // ─── Viewport Overlays ───
  const [showGrid, setShowGrid] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);

  // ─── Seamless Import — auto-opens picker, minimal wait state ───
  if (!file) {
    return (
      <div
        className="fixed inset-0 z-[120] flex flex-col items-center justify-center px-6 touch-none overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #0d0d1a 0%, #050508 100%)" }}
        onClick={openVideoPicker}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onBack ? onBack() : navigate("/hub"); }}
          className="absolute top-4 left-4 safe-top p-2 rounded-xl transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <ChevronLeft className="w-5 h-5" style={{ color: "#666" }} />
        </button>

        {/* Pro badge */}
        <div className="absolute top-5 right-5 safe-top flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(153,153,255,0.06)", border: "1px solid rgba(153,153,255,0.12)" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
          <span className="text-[8px] font-black tracking-[0.2em] uppercase" style={{ color: ACCENT }}>STUDIO PRO</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated icon */}
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute inset-0 rounded-3xl"
              style={{ background: `radial-gradient(circle, ${ACCENT}15, transparent 70%)`, filter: "blur(20px)" }}
            />
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center relative"
              style={{ background: "linear-gradient(135deg, rgba(153,153,255,0.08), rgba(153,153,255,0.02))", border: "1px solid rgba(153,153,255,0.12)" }}>
              <Film className="w-8 h-8" style={{ color: ACCENT }} />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-lg font-black tracking-tight text-white">Loopgate Studio</h2>
            <p className="text-[11px] max-w-[200px] leading-relaxed" style={{ color: "#555" }}>
              Professional-grade editing. Zero compromise.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full items-center">
            <button
              onClick={openVideoPicker}
              className="h-12 px-8 rounded-2xl text-[13px] font-bold flex items-center gap-2.5 transition-all active:scale-95 relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #7777DD)`, color: "#000", boxShadow: `0 4px 20px ${ACCENT}40` }}
            >
              <Upload className="w-4 h-4" /> Import Video
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setAutoEditOpen(true); }}
              className="h-10 px-6 rounded-xl text-[12px] font-semibold flex items-center gap-2 transition-all active:scale-95"
              style={{ background: "rgba(255,0,79,0.06)", color: "#FF004F", border: "1px solid rgba(255,0,79,0.15)" }}
            >
              <Wand2 className="w-3.5 h-3.5" /> AI Auto-Edit
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-1.5 max-w-[280px]">
            {["4K Export", "AI Tools", "LUTs", "Keyframes", "Masks", "PiP", "Motion GFX", "Audio FX", "Stabilize"].map(f => (
              <span key={f} className="px-2 py-0.5 rounded-full text-[7px] font-bold tracking-wider uppercase"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#444" }}>
                {f}
              </span>
            ))}
          </div>
        </motion.div>

        {autoEditOpen && (
          <AutoEditWizard
            onClose={() => setAutoEditOpen(false)}
            onTimelineReady={(timeline, clips) => {
              setAutoEditOpen(false);
              toast.success("AI edit ready! Apply it in the full Studio for multi-clip timelines.");
            }}
          />
        )}
        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
      </div>
    );
  }

  // ─── Full Editor ───
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className={`flex flex-col touch-none overflow-hidden ${isFullscreen ? "fixed inset-0 z-[120]" : "relative"}`}
        style={{ height: isFullscreen ? "100dvh" : "auto", background: "#0a0a0a" }}>

        {/* ─── Top Bar — Pro Chrome ─── */}
        <div className="flex items-center gap-2 px-2 py-2 flex-shrink-0 safe-top"
          style={{ background: "linear-gradient(180deg, #141418 0%, #111114 100%)", borderBottom: "1px solid #1e1e24" }}>
          <button onClick={() => onBack ? onBack() : navigate("/hub")}
            className="p-1.5 rounded-lg transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <ChevronLeft className="w-4 h-4" style={{ color: "#666" }} />
          </button>

          {/* Project info */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${ACCENT}15, ${ACCENT}05)`, border: `1px solid ${ACCENT}15` }}>
              <Film className="w-3 h-3" style={{ color: ACCENT }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold truncate text-white/90">{file.name.replace(/\.[^/.]+$/, "")}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-mono" style={{ color: "#555" }}>{formatTimecode(trimEnd - trimStart)}</span>
                <span className="w-0.5 h-0.5 rounded-full" style={{ background: "#333" }} />
                <span className="text-[8px] font-mono" style={{ color: "#555" }}>{file.name.split('.').pop()?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <StudioSubmitButton />
            {state === "done" ? (
              <button onClick={handleDownload}
                className="h-7 px-3.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
                style={{ background: `linear-gradient(135deg, #22C55E, #16A34A)`, color: "#fff", boxShadow: "0 2px 8px rgba(34,197,94,0.3)" }}>
                <Download className="w-3 h-3" /> Save
              </button>
            ) : (
              <button onClick={startExport} disabled={state === "processing"}
                className="h-7 px-3.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all disabled:opacity-30 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #7777DD)`, color: "#000", boxShadow: `0 2px 8px ${ACCENT}30` }}>
                {state === "processing" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
                {state === "processing" ? `${progress}%` : "Export"}
              </button>
            )}
          </div>
        </div>

        {/* ─── Video Preview — Pro Viewport ─── */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0"
          style={{ background: "radial-gradient(ellipse at center, #0a0a0e 0%, #050507 100%)" }}>
          <video ref={videoRef} src={videoUrl!} className="hidden" playsInline preload="auto" />

          {/* Viewport frame */}
          <div className="relative">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" style={{ borderRadius: 2 }} />

            {/* Grid overlay */}
            {showGrid && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
                <line x1="33.3%" y1="0" x2="33.3%" y2="100%" stroke="white" strokeWidth="0.5" />
                <line x1="66.6%" y1="0" x2="66.6%" y2="100%" stroke="white" strokeWidth="0.5" />
                <line x1="0" y1="33.3%" x2="100%" y2="33.3%" stroke="white" strokeWidth="0.5" />
                <line x1="0" y1="66.6%" x2="100%" y2="66.6%" stroke="white" strokeWidth="0.5" />
              </svg>
            )}

            {/* Safe zones */}
            {showSafeZones && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute" style={{ inset: "10%", border: "1px dashed rgba(255,255,255,0.1)" }} />
                <div className="absolute" style={{ inset: "5%", border: "1px dashed rgba(255,0,0,0.15)" }} />
              </div>
            )}
          </div>

          {/* Play overlay */}
          <AnimatePresence>
            {!playing && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm"
                  style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 30px rgba(0,0,0,0.5)" }}>
                  <Play className="w-6 h-6 text-white/90 ml-0.5" />
                </div>
              </motion.button>
            )}
          </AnimatePresence>
          {playing && <button onClick={togglePlay} className="absolute inset-0" />}

          {/* Top-left: Active effects chips */}
          {activeEffects.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[60%]">
              {activeEffects.map(eff => (
                <span key={eff} className="px-1.5 py-0.5 rounded text-[7px] font-bold tracking-wider"
                  style={{ background: "rgba(0,0,0,0.7)", color: ACCENT, border: `1px solid ${ACCENT}20`, backdropFilter: "blur(8px)" }}>
                  {EFFECTS.find(e => e.id === eff)?.label}
                </span>
              ))}
            </div>
          )}

          {/* Top-right: HUD badges */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {/* Viewport tools */}
            <button onClick={() => setShowGrid(!showGrid)}
              className="w-6 h-6 rounded flex items-center justify-center transition-all"
              style={{ background: showGrid ? "rgba(153,153,255,0.15)" : "rgba(0,0,0,0.4)", border: `1px solid ${showGrid ? ACCENT + "30" : "rgba(255,255,255,0.06)"}` }}>
              <Grid3x3 className="w-3 h-3" style={{ color: showGrid ? ACCENT : "#555" }} />
            </button>
            <button onClick={() => setShowSafeZones(!showSafeZones)}
              className="w-6 h-6 rounded flex items-center justify-center transition-all"
              style={{ background: showSafeZones ? "rgba(153,153,255,0.15)" : "rgba(0,0,0,0.4)", border: `1px solid ${showSafeZones ? ACCENT + "30" : "rgba(255,255,255,0.06)"}` }}>
              <Monitor className="w-3 h-3" style={{ color: showSafeZones ? ACCENT : "#555" }} />
            </button>

            {(speed !== 1 || activeSpeedCurve) && (
              <div className="px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{ background: "rgba(0,0,0,0.7)", border: `1px solid ${ACCENT}20` }}>
                {activeSpeedCurve ? (
                  <>
                    <Activity className="w-2.5 h-2.5" style={{ color: ACCENT }} />
                    <span className="text-[8px] font-bold" style={{ color: ACCENT }}>{activeSpeedCurve.name}</span>
                  </>
                ) : (
                  <span className="text-[8px] font-bold" style={{ color: ACCENT }}>{speed}x</span>
                )}
              </div>
            )}
          </div>

          {/* Mute button */}
          <button onClick={() => setMuted(!muted)}
            className="absolute bottom-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
            {muted ? <VolumeX className="w-3.5 h-3.5" style={{ color: "#555" }} /> : <Volume2 className="w-3.5 h-3.5" style={{ color: "#888" }} />}
          </button>

          {/* Export overlay */}
          {state === "processing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)" }}>
              <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                  <Loader2 className="w-10 h-10" style={{ color: ACCENT }} />
                </motion.div>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color: ACCENT }}>{progress}</span>
              </div>
              <p className="text-xs font-medium" style={{ color: "#888" }}>Rendering...</p>
              <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: "#1a1a1a" }}>
                <motion.div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${ACCENT}, #7777DD)` }}
                  transition={{ duration: 0.3 }} />
              </div>
            </div>
          )}

          {state === "done" && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-3 left-3 right-3 rounded-xl p-2.5 flex items-center gap-2 backdrop-blur-sm"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <Check className="w-4 h-4" style={{ color: "#22c55e" }} />
              <span className="text-[10px] font-semibold" style={{ color: "#22c55e" }}>Export complete — tap Save</span>
            </motion.div>
          )}
        </div>

        {/* ─── Pro Timeline ─── */}
        <div className="flex-shrink-0" style={{ background: "#111114", borderTop: "1px solid #1a1a1e" }}>
          {/* Transport controls */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-bold tabular-nums tracking-tight" style={{ color: ACCENT }}>{formatTimecode(currentTime)}</span>
              <span className="text-[8px]" style={{ color: "#333" }}>/</span>
              <span className="text-[10px] font-mono tabular-nums tracking-tight" style={{ color: "#444" }}>{formatTimecode(duration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => seekTo(trimStart)} className="w-7 h-7 rounded-md flex items-center justify-center transition-all active:scale-90"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <SkipBack className="w-3.5 h-3.5" style={{ color: "#555" }} />
              </button>
              <button onClick={togglePlay}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: `linear-gradient(135deg, ${ACCENT}15, ${ACCENT}08)`, border: `1px solid ${ACCENT}20`, boxShadow: playing ? `0 0 12px ${ACCENT}15` : "none" }}>
                {playing ? <Pause className="w-4 h-4" style={{ color: ACCENT }} /> : <Play className="w-4 h-4 ml-0.5" style={{ color: ACCENT }} />}
              </button>
              <button onClick={() => seekTo(trimEnd)} className="w-7 h-7 rounded-md flex items-center justify-center transition-all active:scale-90"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <SkipForward className="w-3.5 h-3.5" style={{ color: "#555" }} />
              </button>
            </div>
            <span className="text-[9px] font-mono" style={{ color: "#333" }}>{formatTimecode(trimEnd - trimStart)}</span>
          </div>

          {/* Timeline ruler */}
          <div className="px-3 pb-0.5">
            <div className="h-3 relative flex items-end">
              {Array.from({ length: Math.min(20, Math.ceil(duration)) }).map((_, i) => {
                const t = (i / Math.min(20, Math.ceil(duration))) * 100;
                return (
                  <div key={i} className="absolute bottom-0 flex flex-col items-center" style={{ left: `${t}%` }}>
                    <span className="text-[5px] font-mono" style={{ color: "#333" }}>{Math.round(i * duration / Math.min(20, Math.ceil(duration)))}s</span>
                    <div className="w-px h-1" style={{ background: "#2a2a2a" }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main timeline track */}
          <div className="px-3 pb-2">
            {/* Track header */}
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1 h-3 rounded-full" style={{ background: ACCENT }} />
              <span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: "#444" }}>V1 — Main</span>
              {audioName && (
                <>
                  <span className="mx-1 text-[7px]" style={{ color: "#222" }}>|</span>
                  <div className="w-1 h-3 rounded-full" style={{ background: "#A855F7" }} />
                  <span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: "#444" }}>A1</span>
                </>
              )}
            </div>

            <div ref={timelineRef} onClick={handleTimelineClick}
              className="relative h-16 rounded-xl overflow-hidden cursor-pointer"
              style={{ background: "#0a0a0d", border: "1px solid #1a1a1e", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)" }}>
              {/* Thumbnail strip */}
              <div className="absolute inset-0 flex">
                {thumbnails.map((thumb, i) => (
                  <div key={i} className="flex-1 h-full overflow-hidden" style={{ opacity: 0.4 }}>
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {thumbnails.length === 0 && (
                  <div className="flex-1 flex items-center justify-center" style={{ background: "#0d0d10" }}>
                    <span className="text-[8px] font-bold tracking-wider" style={{ color: "#222" }}>NO MEDIA</span>
                  </div>
                )}
              </div>

              {/* Active region highlight */}
              {duration > 0 && (
                <div className="absolute inset-0">
                  {/* Inactive regions */}
                  <div className="absolute inset-y-0 left-0" style={{ width: `${(trimStart / duration) * 100}%`, background: "rgba(0,0,0,0.7)" }} />
                  <div className="absolute inset-y-0 right-0" style={{ width: `${((duration - trimEnd) / duration) * 100}%`, background: "rgba(0,0,0,0.7)" }} />

                  {/* Trim handles — glowing */}
                  <div className="absolute inset-y-0 w-1.5 cursor-col-resize z-10 rounded-l"
                    style={{ left: `${(trimStart / duration) * 100}%`, background: `linear-gradient(180deg, ${ACCENT}, #7777DD)`, boxShadow: `0 0 6px ${ACCENT}40` }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      const rect = timelineRef.current!.getBoundingClientRect();
                      const onMove = (ev: TouchEvent) => { const pct = Math.max(0, Math.min((trimEnd - 0.5) / duration, (ev.touches[0].clientX - rect.left) / rect.width)); setTrimStart(pct * duration); };
                      const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
                      window.addEventListener("touchmove", onMove, { passive: true }); window.addEventListener("touchend", onEnd);
                    }} />
                  <div className="absolute inset-y-0 w-1.5 cursor-col-resize z-10 rounded-r"
                    style={{ left: `calc(${(trimEnd / duration) * 100}% - 6px)`, background: `linear-gradient(180deg, ${ACCENT}, #7777DD)`, boxShadow: `0 0 6px ${ACCENT}40` }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      const rect = timelineRef.current!.getBoundingClientRect();
                      const onMove = (ev: TouchEvent) => { const pct = Math.max((trimStart + 0.5) / duration, Math.min(1, (ev.touches[0].clientX - rect.left) / rect.width)); setTrimEnd(pct * duration); };
                      const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
                      window.addEventListener("touchmove", onMove, { passive: true }); window.addEventListener("touchend", onEnd);
                    }} />

                  {/* Playhead — premium glow */}
                  <div className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: `${(currentTime / duration) * 100}%` }}>
                    <div className="absolute -left-px w-0.5 h-full" style={{ background: "white", boxShadow: "0 0 4px rgba(255,255,255,0.4)" }} />
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-sm rotate-45" style={{ background: "white", boxShadow: "0 0 6px rgba(255,255,255,0.5)" }} />
                  </div>

                  {/* Timeline markers */}
                  {timelineMarkers.map(marker => (
                    <div key={marker.id} className="absolute top-0 w-px z-15 pointer-events-none"
                      style={{ left: `${(marker.time / duration) * 100}%`, height: "100%", background: marker.color, opacity: 0.6 }}>
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: marker.color }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Audio track */}
              {audioName && (
                <div className="absolute bottom-0 left-0 right-0 h-4 flex items-center px-1.5"
                  style={{ background: "linear-gradient(180deg, transparent, rgba(168,85,247,0.06))", borderTop: "1px solid rgba(168,85,247,0.1)" }}>
                  <Music className="w-2 h-2 mr-0.5 flex-shrink-0" style={{ color: "rgba(168,85,247,0.4)" }} />
                  <span className="text-[6px] truncate font-medium" style={{ color: "rgba(168,85,247,0.4)" }}>{audioName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Tool Panel ─── */}
        <AnimatePresence>
          {activeTool && state === "idle" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="flex-shrink-0 overflow-hidden"
              style={{ background: "linear-gradient(180deg, #131316 0%, #0e0e11 100%)", borderTop: "1px solid #1a1a1e" }}
            >
              <div className="p-4 max-h-[35vh] overflow-y-auto" style={{ scrollbarWidth: "none" }}>

                {/* ════ FILTERS — gradient previews ════ */}
                {activeTool === "filters" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Filters</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {["all", "basic", "cinema", "mood", "film"].map(cat => (
                        <button key={cat} onClick={() => setFilterTab(cat)}
                          className="px-2.5 py-1 text-[8px] font-semibold rounded-md flex-shrink-0 transition-all capitalize"
                          style={{
                            background: filterTab === cat ? ACCENT_DIM : "transparent",
                            color: filterTab === cat ? ACCENT : "#555",
                            border: filterTab === cat ? `1px solid ${ACCENT_BORDER}` : "1px solid transparent",
                          }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {filteredFilters.map((preset) => {
                        const isActive = activeFilter.name === preset.name;
                        const bg = FILTER_PREVIEWS[preset.name] || `linear-gradient(135deg, ${preset.color}, ${preset.color})`;
                        return (
                          <button key={preset.name} onClick={() => setActiveFilter(preset)} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                            <div className="w-14 h-14 rounded-lg transition-all relative overflow-hidden"
                              style={{
                                background: bg,
                                border: isActive ? `2px solid ${ACCENT}` : "2px solid #2a2a2a",
                                boxShadow: isActive ? `0 0 8px ${ACCENT}44` : "none",
                              }}>
                              <div className="absolute inset-0 flex flex-col justify-end">
                                <div className="h-[30%] w-full" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.4))" }} />
                              </div>
                              {isActive && (
                                <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: ACCENT }}>
                                  <Check className="w-2 h-2 text-black" />
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] font-medium" style={{ color: isActive ? ACCENT : "#666" }}>{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ════ EFFECTS — Lucide icons ════ */}
                {activeTool === "effects" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Effects</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {EFFECTS.map((effect) => {
                        const isActive = activeEffects.includes(effect.id);
                        const IconComp = EFFECT_ICONS[effect.id] || Sparkles;
                        return (
                          <button key={effect.id} onClick={() => toggleEffect(effect.id)}
                            className="py-3 rounded-lg flex flex-col items-center gap-1.5 transition-all"
                            style={{
                              background: isActive ? ACCENT_DIM : "#151515",
                              border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                            }}>
                            <IconComp className="w-4 h-4" style={{ color: isActive ? ACCENT : "#666" }} />
                            <span className="text-[8px] font-medium" style={{ color: isActive ? ACCENT : "#666" }}>{effect.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {activeEffects.length > 0 && (
                      <button onClick={() => setActiveEffects([])}
                        className="w-full py-2 text-[10px] font-medium rounded-lg"
                        style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                        Clear All ({activeEffects.length})
                      </button>
                    )}
                  </div>
                )}

                {/* ════ TRANSITIONS — Lucide icons ════ */}
                {activeTool === "transitions" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Transitions</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {TRANSITIONS.map((trans) => {
                        const isActive = activeTransition === trans.id;
                        const IconComp = TRANSITION_ICONS[trans.id] || Layers;
                        return (
                          <button key={trans.id} onClick={() => setActiveTransition(isActive ? null : trans.id)}
                            className="py-3 rounded-lg flex flex-col items-center gap-1.5 transition-all"
                            style={{
                              background: isActive ? ACCENT_DIM : "#151515",
                              border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                            }}>
                            <IconComp className="w-4 h-4" style={{ color: isActive ? ACCENT : "#666" }} />
                            <span className="text-[8px] font-medium" style={{ color: isActive ? ACCENT : "#666" }}>{trans.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ════ TEXT ════ */}
                {activeTool === "text" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Text</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type your text..."
                      className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all"
                      style={{ background: "#151515", border: "1px solid #2a2a2a", color: "#e0e0e0" }}
                      autoFocus />
                    <div className="grid grid-cols-3 gap-1">
                      {(Object.entries(TEXT_STYLES) as [TextStyleKey, typeof TEXT_STYLES[TextStyleKey]][]).map(([key, s]) => (
                        <button key={key} onClick={() => setTextStyle(key)}
                          className="py-2 text-[9px] font-semibold rounded-md transition-all capitalize"
                          style={{
                            background: textStyle === key ? ACCENT_DIM : "#151515",
                            color: textStyle === key ? ACCENT : "#555",
                            border: textStyle === key ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                          }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={addTextOverlay} disabled={!textInput.trim()}
                      className="w-full h-10 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                      style={{ background: ACCENT, color: "#000" }}>
                      Add Text
                    </button>
                    {textOverlays.length > 0 && (
                      <div className="space-y-1.5">
                        {textOverlays.map(t => (
                          <div key={t.id} className="flex items-center gap-2 rounded-md px-3 py-2" style={{ background: "#151515", border: "1px solid #222" }}>
                            <Type className="w-3 h-3 flex-shrink-0" style={{ color: "#555" }} />
                            <span className="text-[11px] truncate flex-1" style={{ color: "#aaa" }}>{t.text}</span>
                            <button onClick={() => setTextOverlays(prev => prev.filter(x => x.id !== t.id))}>
                              <X className="w-3 h-3" style={{ color: "#555" }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ════ AUDIO ════ */}
                {activeTool === "audio" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Audio</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    {audioName ? (
                      <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: "#151515", border: "1px solid rgba(168,85,247,0.2)" }}>
                        <Music className="w-4 h-4" style={{ color: "#a855f7" }} />
                        <span className="text-xs truncate flex-1" style={{ color: "#ccc" }}>{audioName}</span>
                        <button onClick={() => { setAudioFile(null); setAudioName(""); }} className="text-[10px] font-medium" style={{ color: "#ef4444" }}>Remove</button>
                      </div>
                    ) : (
                      <button onClick={() => audioInputRef.current?.click()}
                        className="w-full py-8 rounded-lg flex flex-col items-center gap-3 transition-all"
                        style={{ border: "1px dashed #333", background: "#151515" }}>
                        <Music className="w-5 h-5" style={{ color: "#555" }} />
                        <span className="text-xs" style={{ color: "#888" }}>Add Music Track</span>
                      </button>
                    )}
                    <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
                  </div>
                )}

                {/* ════ SPEED + CURVES (v1.5) ════ */}
                {activeTool === "speed" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Speed</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    {/* Quick Speed Options */}
                    <div>
                      <span className="text-[9px] uppercase tracking-wider mb-1.5 block" style={{ color: "#555" }}>Quick</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {SPEED_OPTIONS.map((s) => (
                          <button key={s} onClick={() => { setSpeed(s); setActiveSpeedCurve(null); }}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg transition-all"
                            style={{
                              background: speed === s && !activeSpeedCurve ? ACCENT_DIM : "#151515",
                              color: speed === s && !activeSpeedCurve ? ACCENT : "#666",
                              border: speed === s && !activeSpeedCurve ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                            }}>
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Speed Curves */}
                    <div>
                      <span className="text-[9px] uppercase tracking-wider mb-1.5 block" style={{ color: "#555" }}>Curves</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {SPEED_CURVE_PRESETS.filter(c => c.id !== 'linear').map((curve) => {
                          const isActive = activeSpeedCurve?.id === curve.id;
                          return (
                            <button key={curve.id} onClick={() => { setActiveSpeedCurve(isActive ? null : curve); if (!isActive) setSpeed(1); }}
                              className="py-2.5 px-3 rounded-lg flex items-center gap-2 transition-all text-left"
                              style={{
                                background: isActive ? ACCENT_DIM : "#151515",
                                border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                              }}>
                              <Activity className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? ACCENT : "#555" }} />
                              <span className="text-[10px] font-medium truncate" style={{ color: isActive ? ACCENT : "#888" }}>{curve.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {activeSpeedCurve && (
                      <div className="rounded-lg p-2.5" style={{ background: "#151515", border: `1px solid ${ACCENT_BORDER}` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-3 h-3" style={{ color: ACCENT }} />
                          <span className="text-[10px] font-semibold" style={{ color: ACCENT }}>{activeSpeedCurve.name}</span>
                        </div>
                        <div className="h-10 rounded flex items-end gap-px overflow-hidden" style={{ background: "#0a0a0a" }}>
                          {Array.from({ length: 20 }).map((_, i) => {
                            const t = i / 19;
                            const spd = getSpeedAtTime(activeSpeedCurve, t);
                            const h = Math.max(4, Math.min(40, (spd / 3) * 40));
                            return <div key={i} className="flex-1 rounded-t" style={{ height: h, background: ACCENT, opacity: 0.6 + (spd / 5) }} />;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ════ TRANSFORM v2.0 — StretchTok Ready ════ */}
                {activeTool === "crop" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Transform</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>

                    {/* ─── SCALE (STRETCH) ─── */}
                    <div className="p-3 rounded-xl" style={{ background: "#0D0D0D", border: "1px solid #1A1A1A" }}>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "#666" }}>Scale / Stretch</span>
                        <button
                          onClick={() => {
                            setScaleLocked(!scaleLocked);
                            if (!scaleLocked) { setScaleY(scaleX); }
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold transition-all"
                          style={{
                            color: scaleLocked ? ACCENT : "#555",
                            background: scaleLocked ? ACCENT_DIM : "transparent",
                            border: `1px solid ${scaleLocked ? ACCENT_BORDER : "#333"}`,
                          }}
                        >
                          {scaleLocked ? "🔗 Locked" : "🔓 Free"}
                        </button>
                      </div>

                      {/* Scale X */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-mono font-bold w-3" style={{ color: "#555" }}>X</span>
                        <Slider
                          value={[scaleX]}
                          min={0.1} max={3.0} step={0.01}
                          onValueChange={([v]) => {
                            setScaleX(v);
                            if (scaleLocked) setScaleY(v);
                          }}
                          className="flex-1"
                        />
                        <span className="text-[10px] font-mono font-bold w-9 text-right" style={{ color: scaleX !== 1 ? ACCENT : "#555" }}>
                          {scaleX.toFixed(2)}
                        </span>
                      </div>

                      {/* Scale Y */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold w-3" style={{ color: "#555" }}>Y</span>
                        <Slider
                          value={[scaleY]}
                          min={0.1} max={3.0} step={0.01}
                          onValueChange={([v]) => {
                            setScaleY(v);
                            if (scaleLocked) setScaleX(v);
                          }}
                          className="flex-1"
                        />
                        <span className="text-[10px] font-mono font-bold w-9 text-right" style={{ color: scaleY !== 1 ? ACCENT : "#555" }}>
                          {scaleY.toFixed(2)}
                        </span>
                      </div>

                      {/* Quick stretch presets */}
                      <div className="flex gap-1 mt-2.5">
                        {[
                          { label: "1:1", x: 1, y: 1 },
                          { label: "Tall", x: 0.7, y: 1.3 },
                          { label: "Wide", x: 1.4, y: 0.8 },
                          { label: "Stretch", x: 1.5, y: 1.5 },
                          { label: "Squish", x: 1.8, y: 0.5 },
                        ].map(p => (
                          <button key={p.label}
                            onClick={() => { setScaleX(p.x); setScaleY(p.y); setScaleLocked(false); }}
                            className="flex-1 py-1.5 rounded text-[8px] font-bold transition-all"
                            style={{
                              background: scaleX === p.x && scaleY === p.y ? ACCENT_DIM : "#151515",
                              border: scaleX === p.x && scaleY === p.y ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                              color: scaleX === p.x && scaleY === p.y ? ACCENT : "#666",
                            }}
                          >{p.label}</button>
                        ))}
                      </div>
                    </div>

                    {/* ─── POSITION ─── */}
                    <div className="p-3 rounded-xl" style={{ background: "#0D0D0D", border: "1px solid #1A1A1A" }}>
                      <span className="text-[9px] uppercase tracking-wider font-bold block mb-2.5" style={{ color: "#666" }}>Position</span>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-mono font-bold w-3" style={{ color: "#555" }}>X</span>
                        <Slider value={[posX]} min={0} max={1} step={0.005}
                          onValueChange={([v]) => setPosX(v)} className="flex-1" />
                        <span className="text-[10px] font-mono font-bold w-9 text-right" style={{ color: posX !== 0.5 ? ACCENT : "#555" }}>
                          {(posX * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold w-3" style={{ color: "#555" }}>Y</span>
                        <Slider value={[posY]} min={0} max={1} step={0.005}
                          onValueChange={([v]) => setPosY(v)} className="flex-1" />
                        <span className="text-[10px] font-mono font-bold w-9 text-right" style={{ color: posY !== 0.5 ? ACCENT : "#555" }}>
                          {(posY * 100).toFixed(0)}%
                        </span>
                      </div>
                      <button onClick={() => { setPosX(0.5); setPosY(0.5); }}
                        className="mt-2 w-full py-1.5 rounded text-[8px] font-bold"
                        style={{ color: "#555", background: "#151515", border: "1px solid #222" }}>
                        Center
                      </button>
                    </div>

                    {/* ─── ROTATION ─── */}
                    <div className="p-3 rounded-xl" style={{ background: "#0D0D0D", border: "1px solid #1A1A1A" }}>
                      <span className="text-[9px] uppercase tracking-wider font-bold block mb-2.5" style={{ color: "#666" }}>Rotation</span>
                      {/* Free rotation slider */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <RotateCw className="w-3 h-3" style={{ color: "#555" }} />
                        <Slider value={[freeRotation]} min={-180} max={180} step={0.5}
                          onValueChange={([v]) => setFreeRotation(v)} className="flex-1" />
                        <span className="text-[10px] font-mono font-bold w-10 text-right" style={{ color: freeRotation !== 0 ? ACCENT : "#555" }}>
                          {freeRotation.toFixed(1)}°
                        </span>
                      </div>
                      {/* Quick rotation presets */}
                      <div className="flex gap-1.5">
                        {[0, 90, 180, 270].map((deg) => (
                          <button key={deg} onClick={() => setRotation(deg)}
                            className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                            style={{
                              background: rotation === deg ? ACCENT_DIM : "#151515",
                              border: rotation === deg ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                            }}>
                            <RotateCw className="w-3 h-3" style={{ color: rotation === deg ? ACCENT : "#666", transform: `rotate(${deg}deg)` }} />
                            <span className="text-[9px] font-medium" style={{ color: rotation === deg ? ACCENT : "#666" }}>{deg}°</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ─── OPACITY ─── */}
                    <div className="p-3 rounded-xl" style={{ background: "#0D0D0D", border: "1px solid #1A1A1A" }}>
                      <span className="text-[9px] uppercase tracking-wider font-bold block mb-2.5" style={{ color: "#666" }}>Opacity</span>
                      <div className="flex items-center gap-2">
                        <Eye className="w-3 h-3" style={{ color: "#555" }} />
                        <Slider value={[videoOpacity]} min={0} max={1} step={0.01}
                          onValueChange={([v]) => setVideoOpacity(v)} className="flex-1" />
                        <span className="text-[10px] font-mono font-bold w-9 text-right" style={{ color: videoOpacity !== 1 ? ACCENT : "#555" }}>
                          {(videoOpacity * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* ─── FLIP ─── */}
                    <div className="flex gap-1.5">
                      <button onClick={() => setFlipH(!flipH)}
                        className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                        style={{
                          background: flipH ? ACCENT_DIM : "#151515",
                          border: flipH ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                        }}>
                        <FlipHorizontal className="w-4 h-4" style={{ color: flipH ? ACCENT : "#666" }} />
                        <span className="text-[10px] font-medium" style={{ color: flipH ? ACCENT : "#666" }}>Flip H</span>
                      </button>
                      <button onClick={() => setFlipV(!flipV)}
                        className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                        style={{
                          background: flipV ? ACCENT_DIM : "#151515",
                          border: flipV ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                        }}>
                        <FlipVertical className="w-4 h-4" style={{ color: flipV ? ACCENT : "#666" }} />
                        <span className="text-[10px] font-medium" style={{ color: flipV ? ACCENT : "#666" }}>Flip V</span>
                      </button>
                    </div>

                    {/* ─── ASPECT RATIO ─── */}
                    <div>
                      <span className="text-[9px] uppercase tracking-wider mb-1.5 block" style={{ color: "#555" }}>Aspect Ratio</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {CROP_PRESETS.map((preset) => {
                          const isActive = cropPreset === preset.id;
                          const IconComp = preset.icon;
                          return (
                            <button key={preset.id} onClick={() => setCropPreset(isActive ? null : preset.id)}
                              className="py-2 rounded-lg flex flex-col items-center gap-0.5 transition-all"
                              style={{
                                background: isActive ? ACCENT_DIM : "#151515",
                                border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                              }}>
                              <IconComp className="w-3.5 h-3.5" style={{ color: isActive ? ACCENT : "#666" }} />
                              <span className="text-[8px] font-semibold" style={{ color: isActive ? ACCENT : "#888" }}>{preset.label}</span>
                              <span className="text-[7px]" style={{ color: "#555" }}>{preset.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ─── RESET ALL ─── */}
                    {(cropPreset || rotation !== 0 || flipH || flipV || scaleX !== 1 || scaleY !== 1 || posX !== 0.5 || posY !== 0.5 || videoOpacity !== 1 || freeRotation !== 0) && (
                      <button onClick={() => {
                        setCropPreset(null); setRotation(0); setFlipH(false); setFlipV(false);
                        setScaleX(1); setScaleY(1); setPosX(0.5); setPosY(0.5);
                        setVideoOpacity(1); setFreeRotation(0); setScaleLocked(true);
                      }}
                        className="w-full py-2 text-[10px] font-medium rounded-lg"
                        style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                        Reset All Transforms
                      </button>
                    )}
                  </div>
                )}

                {/* ════ TRIM ════ */}
                {activeTool === "trim" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Trim</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] uppercase tracking-wider" style={{ color: "#555" }}>Start</label>
                        <Slider value={[trimStart]} onValueChange={(v) => setTrimStart(Math.min(v[0], trimEnd - 0.5))} min={0} max={duration} step={0.1} />
                        <span className="text-[10px] font-mono" style={{ color: ACCENT }}>{formatTimecode(trimStart)}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] uppercase tracking-wider" style={{ color: "#555" }}>End</label>
                        <Slider value={[trimEnd]} onValueChange={(v) => setTrimEnd(Math.max(v[0], trimStart + 0.5))} min={0} max={duration} step={0.1} />
                        <span className="text-[10px] font-mono" style={{ color: ACCENT }}>{formatTimecode(trimEnd)}</span>
                      </div>
                    </div>
                    <button onClick={() => { setTrimStart(0); setTrimEnd(duration); }}
                      className="text-[10px] h-8 px-3 rounded-lg flex items-center gap-1.5 transition-all"
                      style={{ border: "1px solid #2a2a2a", color: "#888" }}>
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                )}

                {/* ════ ADJUST — CapCut-level ════ */}
                {activeTool === "adjust" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Adjustments</span>
                      <div className="flex gap-3">
                        <button onClick={resetColorGrading} className="text-[9px] font-medium px-2 py-0.5 rounded" style={{ color: ACCENT, background: ACCENT_DIM }}>Reset</button>
                        <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                      </div>
                    </div>

                    {ADJUST_SECTIONS.map(section => (
                      <div key={section.id}>
                        <button onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between py-1.5"
                          style={{ borderBottom: "1px solid #1e1e1e" }}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm flex items-center justify-center"
                              style={{
                                background: section.params.some(p => adjustments[p.key] !== DEFAULT_ADJUSTMENTS[p.key]) ? ACCENT : "#333",
                              }}>
                              {section.params.some(p => adjustments[p.key] !== DEFAULT_ADJUSTMENTS[p.key]) && (
                                <Check className="w-2 h-2 text-black" />
                              )}
                            </div>
                            <span className="text-[10px] font-semibold" style={{ color: "#ccc" }}>{section.label}</span>
                          </div>
                          <ChevronDown className="w-3 h-3 transition-transform" style={{
                            color: "#555",
                            transform: openSections[section.id] ? "rotate(0deg)" : "rotate(-90deg)",
                          }} />
                        </button>
                        {openSections[section.id] && (
                          <div className="space-y-3 pt-2 pb-1">
                            {section.params.map(param => {
                              const value = adjustments[param.key];
                              const isModified = value !== DEFAULT_ADJUSTMENTS[param.key];
                              return (
                                <div key={param.key} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium" style={{ color: isModified ? "#ddd" : "#888" }}>{param.label}</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded min-w-[28px] text-center"
                                        style={{ color: isModified ? "#ccc" : "#555", background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                                        {value}
                                      </span>
                                      {isModified && (
                                        <button onClick={() => updateAdjustment(param.key, DEFAULT_ADJUSTMENTS[param.key])}
                                          className="w-4 h-4 rounded flex items-center justify-center">
                                          <RotateCcw className="w-2.5 h-2.5" style={{ color: "#555" }} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="relative">
                                    {param.gradient && (
                                      <div className="absolute inset-0 h-[6px] top-[9px] rounded-full opacity-40 pointer-events-none"
                                        style={{ background: param.gradient }} />
                                    )}
                                    <Slider value={[value]} onValueChange={(v) => updateAdjustment(param.key, v[0])}
                                      min={param.min} max={param.max} step={1} className="w-full" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ════ EXPORT ════ */}
                {activeTool === "export" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Export Quality</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <div className="space-y-1.5">
                      {EXPORT_QUALITIES.map((q) => (
                        <button key={q.id} onClick={() => setExportQuality(q.id)}
                          className="w-full text-left px-4 py-3 rounded-lg transition-all"
                          style={{
                            background: exportQuality === q.id ? ACCENT_DIM : "#151515",
                            border: exportQuality === q.id ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                          }}>
                          <span className="text-xs font-semibold" style={{ color: exportQuality === q.id ? ACCENT : "#ccc" }}>{q.label}</span>
                          <span className="text-[9px] ml-2" style={{ color: "#555" }}>{q.fps}fps • {(q.bitrate / 1_000_000).toFixed(0)}Mbps</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ════ UPSCALE ════ */}
                {activeTool === "upscale" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Upscale</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    {!upscaleFile ? (
                      <button onClick={() => upscaleInputRef.current?.click()}
                        className="w-full py-8 rounded-lg flex flex-col items-center gap-3 transition-all"
                        style={{ border: "1px dashed #333", background: "#151515" }}>
                        <ArrowUpCircle className="w-6 h-6" style={{ color: ACCENT }} />
                        <span className="text-xs" style={{ color: "#888" }}>Upload Video to Upscale</span>
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "#151515", border: "1px solid #2a2a2a" }}>
                          <Film className="w-4 h-4" style={{ color: "#666" }} />
                          <span className="text-[10px] truncate flex-1" style={{ color: "#ccc" }}>{upscaleFile.name}</span>
                          <button onClick={clearUpscale}><X className="w-3 h-3" style={{ color: "#555" }} /></button>
                        </div>
                        {upscaleState === "idle" && (
                          <>
                            <div className="flex gap-1.5">
                              {(["2x", "4x"] as const).map((m) => (
                                <button key={m} onClick={() => setUpscaleMode(m)}
                                  className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all"
                                  style={{
                                    background: upscaleMode === m ? ACCENT_DIM : "#151515",
                                    color: upscaleMode === m ? ACCENT : "#666",
                                    border: upscaleMode === m ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                                  }}>
                                  {m}
                                </button>
                              ))}
                            </div>
                            <button onClick={startUpscale}
                              className="w-full h-10 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: ACCENT, color: "#000" }}>
                              Upscale {upscaleMode}
                            </button>
                          </>
                        )}
                        {upscaleState === "processing" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: ACCENT }} />
                              <span className="text-[10px]" style={{ color: "#ccc" }}>Upscaling {upscaleMode}... {upscaleProgress}%</span>
                            </div>
                            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${upscaleProgress}%`, background: ACCENT }} />
                            </div>
                          </div>
                        )}
                        {upscaleState === "done" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                              <Check className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                              <span className="text-[10px] font-medium" style={{ color: "#22c55e" }}>Upscale complete!</span>
                            </div>
                            <button onClick={handleUpscaleDownload}
                              className="w-full h-10 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: ACCENT, color: "#000" }}>
                              <Download className="w-3.5 h-3.5 inline mr-1.5" /> Download
                            </button>
                            <button onClick={clearUpscale}
                              className="w-full py-2 text-[10px] rounded-lg"
                              style={{ color: "#888", border: "1px solid #2a2a2a" }}>
                              Upscale Another
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    <input ref={upscaleInputRef} type="file" accept="video/*" onChange={handleUpscaleFile} className="hidden" />
                  </div>
                )}

                {/* ════ KEYFRAMES ════ */}
                {activeTool === "keyframes" && (
                  <KeyframeEditor
                    properties={[
                      { id: "scaleX", label: "Scale X", icon: Maximize, color: "#00D4FF", keyframes: keyframeData["scaleX"] || [], min: 0.1, max: 3, unit: "x", currentValue: scaleX },
                      { id: "scaleY", label: "Scale Y", icon: Maximize, color: "#00AAFF", keyframes: keyframeData["scaleY"] || [], min: 0.1, max: 3, unit: "x", currentValue: scaleY },
                      { id: "posX", label: "Position X", icon: Move, color: "#FF6B00", keyframes: keyframeData["posX"] || [], min: 0, max: 1, unit: "", currentValue: posX },
                      { id: "posY", label: "Position Y", icon: Move, color: "#FF4400", keyframes: keyframeData["posY"] || [], min: 0, max: 1, unit: "", currentValue: posY },
                      { id: "rotation", label: "Rotation", icon: RotateCw, color: "#AA44FF", keyframes: keyframeData["rotation"] || [], min: -180, max: 180, unit: "°", currentValue: freeRotation },
                      { id: "opacity", label: "Opacity", icon: Eye, color: "#22CC88", keyframes: keyframeData["opacity"] || [], min: 0, max: 1, unit: "", currentValue: videoOpacity },
                    ]}
                    currentTime={currentTime}
                    duration={duration}
                    onAddKeyframe={addKeyframe}
                    onRemoveKeyframe={removeKeyframe}
                    onClose={() => setActiveTool(null)}
                  />
                )}

                {/* ════ BLEND & OVERLAY ════ */}
                {activeTool === "blend" && (
                  <BlendModePanel
                    activeBlendMode={blendMode}
                    activeOverlay={activeOverlayId}
                    overlayOpacity={overlayOpacity}
                    onBlendModeChange={setBlendMode}
                    onOverlayChange={setActiveOverlayId}
                    onOverlayOpacityChange={setOverlayOpacity}
                    onClose={() => setActiveTool(null)}
                  />
                )}

                {/* ════ COLOR SCOPES & LUTs ════ */}
                {activeTool === "scopes" && (
                  <ColorScopes
                    canvasRef={canvasRef}
                    isPlaying={playing}
                    activeLUT={activeLUT}
                    lutIntensity={lutIntensity}
                    customLUT={customLUT}
                    onLUTChange={setActiveLUT}
                    onLUTIntensityChange={setLutIntensity}
                    onCustomLUTLoad={setCustomLUT}
                    onClose={() => setActiveTool(null)}
                  />
                )}

                {/* ════ MASKING ════ */}
                {activeTool === "masks" && (
                  <MaskingPanel
                    masks={masks}
                    selectedMaskId={selectedMaskId}
                    onAddMask={(shape: MaskShape) => {
                      const newMask: Mask = { ...DEFAULT_MASK, id: crypto.randomUUID(), shape };
                      setMasks(prev => [...prev, newMask]);
                      setSelectedMaskId(newMask.id);
                    }}
                    onUpdateMask={(id, updates) => setMasks(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))}
                    onDeleteMask={(id) => { setMasks(prev => prev.filter(m => m.id !== id)); if (selectedMaskId === id) setSelectedMaskId(null); }}
                    onSelectMask={setSelectedMaskId}
                    onClose={() => setActiveTool(null)}
                  />
                )}

                {/* ════ AUDIO FX ════ */}
                {activeTool === "audiofx" && (
                  <AudioFXPanel
                    audioFX={audioFX}
                    onUpdate={setAudioFX}
                    onClose={() => setActiveTool(null)}
                  />
                )}

                {/* ════ MOTION GRAPHICS ════ */}
                {activeTool === "motion" && (
                  <MotionTemplatesPanel
                    appliedTemplates={appliedTemplates}
                    currentTime={currentTime}
                    onApplyTemplate={(template, fieldValues, startTime) => {
                      setAppliedTemplates(prev => [...prev, {
                        id: crypto.randomUUID(),
                        templateId: template.id,
                        startTime,
                        fieldValues,
                      }]);
                      toast.success(`${template.label} added at ${startTime.toFixed(1)}s`);
                    }}
                    onRemoveTemplate={(id) => setAppliedTemplates(prev => prev.filter(at => at.id !== id))}
                    onClose={() => setActiveTool(null)}
                  />
                )}

                {/* ════ COMPOSITOR (PiP) ════ */}
                {activeTool === "compositor" && (
                  <CompositorPanel
                    layers={compositorLayers}
                    selectedLayerId={selectedCompositorLayerId}
                    activeSplitLayout={activeSplitLayout}
                    onAddLayer={(file) => {
                      const url = URL.createObjectURL(file);
                      const layer: CompositorLayer = {
                        ...DEFAULT_PIP,
                        id: crypto.randomUUID(),
                        videoUrl: url,
                        fileName: file.name,
                      };
                      // Create video element
                      const vid = document.createElement("video");
                      vid.src = url;
                      vid.loop = true;
                      vid.muted = true;
                      vid.playsInline = true;
                      vid.play().catch(() => {});
                      compositorVideos.current.set(layer.id, vid);
                      setCompositorLayers(prev => [...prev, layer]);
                      setSelectedCompositorLayerId(layer.id);
                      toast.success("PiP layer added");
                    }}
                    onUpdateLayer={(id, updates) => setCompositorLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))}
                    onDeleteLayer={(id) => {
                      const vid = compositorVideos.current.get(id);
                      if (vid) { vid.pause(); vid.src = ""; compositorVideos.current.delete(id); }
                      setCompositorLayers(prev => prev.filter(l => l.id !== id));
                      if (selectedCompositorLayerId === id) setSelectedCompositorLayerId(null);
                    }}
                    onSelectLayer={setSelectedCompositorLayerId}
                    onSplitLayoutChange={setActiveSplitLayout}
                    onClose={() => setActiveTool(null)}
                  />
                )}

                {/* ════ STABILIZER ════ */}
                {activeTool === "stabilize" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" style={{ color: "#F59E0B" }} />
                        <span className="text-[11px] font-bold text-white">Stabilization</span>
                      </div>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <button
                      onClick={() => setStabilizer(prev => ({ ...prev, enabled: !prev.enabled }))}
                      className="w-full py-3 rounded-xl text-[10px] font-bold transition-all"
                      style={{
                        background: stabilizer.enabled ? "rgba(245,158,11,0.15)" : "#111",
                        color: stabilizer.enabled ? "#F59E0B" : "#666",
                        border: `1px solid ${stabilizer.enabled ? "rgba(245,158,11,0.3)" : "#1a1a1a"}`,
                      }}>
                      {stabilizer.enabled ? "✓ Stabilization ON" : "Enable Stabilization"}
                    </button>
                    {stabilizer.enabled && (
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px]" style={{ color: "#555" }}>Smoothing</span>
                            <span className="text-[9px] font-mono" style={{ color: "#F59E0B" }}>{Math.round(stabilizer.smoothing * 100)}%</span>
                          </div>
                          <input type="range" min={10} max={95} value={Math.round(stabilizer.smoothing * 100)}
                            onChange={(e) => setStabilizer(prev => ({ ...prev, smoothing: Number(e.target.value) / 100 }))}
                            className="w-full accent-[#F59E0B]" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px]" style={{ color: "#555" }}>Crop (for stabilization room)</span>
                            <span className="text-[9px] font-mono" style={{ color: "#F59E0B" }}>{Math.round(stabilizer.cropAmount * 100)}%</span>
                          </div>
                          <input type="range" min={5} max={25} value={Math.round(stabilizer.cropAmount * 100)}
                            onChange={(e) => setStabilizer(prev => ({ ...prev, cropAmount: Number(e.target.value) / 100 }))}
                            className="w-full accent-[#F59E0B]" />
                        </div>
                        <p className="text-[8px]" style={{ color: "#444" }}>
                          Higher smoothing = less shake but more crop. Adjust crop to give the stabilizer room to work.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Pro Toolbar ─── */}
        <div className="flex-shrink-0" style={{ background: "linear-gradient(180deg, #131316 0%, #0e0e11 100%)", borderTop: "1px solid #1a1a1e" }}>
          <div className="flex items-center py-1 px-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {/* AI — special treatment */}
            <button
              onClick={() => setAiToolsOpen(true)}
              className="flex-shrink-0 py-2 px-3 flex flex-col items-center gap-0.5 rounded-xl mr-0.5 transition-all active:scale-90 relative"
              style={{ background: "linear-gradient(135deg, rgba(255,0,79,0.08), rgba(255,0,79,0.03))", border: "1px solid rgba(255,0,79,0.12)" }}>
              <Wand2 className="w-[16px] h-[16px]" style={{ color: "#FF004F" }} />
              <span className="text-[6px] font-black tracking-[0.15em] uppercase" style={{ color: "#FF004F" }}>AI</span>
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "#FF004F", boxShadow: "0 0 4px #FF004F" }} />
            </button>

            {/* Separator */}
            <div className="w-px h-6 mx-1 flex-shrink-0" style={{ background: "#1e1e24" }} />

            {/* Tool groups with separators */}
            {([
              // Edit group
              { id: "trim" as EditorTool, icon: Scissors, label: "Trim", group: "edit" },
              { id: "crop" as EditorTool, icon: Crop, label: "Crop", group: "edit" },
              { id: "speed" as EditorTool, icon: Gauge, label: "Speed", group: "edit" },
              { id: "---1" as EditorTool, icon: null, label: "", group: "sep" },
              // Color group
              { id: "filters" as EditorTool, icon: Wand2, label: "Filter", group: "color" },
              { id: "adjust" as EditorTool, icon: SlidersHorizontal, label: "Grade", group: "color" },
              { id: "scopes" as EditorTool, icon: Activity, label: "Scopes", group: "color" },
              { id: "blend" as EditorTool, icon: Blend, label: "Blend", group: "color" },
              { id: "---2" as EditorTool, icon: null, label: "", group: "sep" },
              // Compose group
              { id: "text" as EditorTool, icon: Type, label: "Text", group: "compose" },
              { id: "motion" as EditorTool, icon: LayoutGrid, label: "GFX", group: "compose" },
              { id: "masks" as EditorTool, icon: Circle, label: "Mask", group: "compose" },
              { id: "compositor" as EditorTool, icon: Layers, label: "PiP", group: "compose" },
              { id: "---3" as EditorTool, icon: null, label: "", group: "sep" },
              // Animate group
              { id: "effects" as EditorTool, icon: Sparkles, label: "FX", group: "animate" },
              { id: "transitions" as EditorTool, icon: Layers, label: "Trans", group: "animate" },
              { id: "keyframes" as EditorTool, icon: Diamond, label: "Keys", group: "animate" },
              { id: "---4" as EditorTool, icon: null, label: "", group: "sep" },
              // Audio group
              { id: "audio" as EditorTool, icon: Music, label: "Audio", group: "audio" },
              { id: "audiofx" as EditorTool, icon: AudioLines, label: "FX", group: "audio" },
              { id: "---5" as EditorTool, icon: null, label: "", group: "sep" },
              // Output group
              { id: "stabilize" as EditorTool, icon: Activity, label: "Stab", group: "output" },
              { id: "upscale" as EditorTool, icon: ArrowUpCircle, label: "4K", group: "output" },
              { id: "export" as EditorTool, icon: Settings, label: "Export", group: "output" },
            ] as const).map(({ id, icon: Icon, label, group }) => {
              if (group === "sep") {
                return <div key={id} className="w-px h-5 mx-0.5 flex-shrink-0" style={{ background: "#1a1a1e" }} />;
              }
              const isActive = activeTool === id;
              return (
                <button key={id}
                  onClick={() => setActiveTool(activeTool === id ? null : id as EditorTool)}
                  className="flex-shrink-0 py-1.5 px-2.5 flex flex-col items-center gap-0.5 rounded-lg transition-all duration-100 active:scale-90 relative"
                  style={{
                    color: isActive ? ACCENT : "#555",
                    background: isActive ? `${ACCENT}10` : "transparent",
                  }}>
                  {Icon && <Icon className="w-[15px] h-[15px]" />}
                  <span className="text-[6px] font-bold tracking-[0.1em] uppercase">{label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 4px ${ACCENT}` }} />
                  )}
                </button>
              );
            })}
          </div>
          <div className="safe-bottom" />
        </div>

        {/* AI Tools overlay */}
        <AnimatePresence>
          {aiToolsOpen && (
            <MobileAITools
              duration={trimEnd - trimStart}
              onCaptionsGenerated={(captions) => {
                // Convert AI captions to text overlays
                const newOverlays = captions.map((cap) => ({
                  id: crypto.randomUUID(),
                  text: cap.text,
                  x: 0.5,
                  y: cap.position === "top" ? 0.15 : cap.position === "bottom" ? 0.85 : 0.5,
                  style: (cap.style || "bold") as TextStyleKey,
                  startTime: cap.startTime + trimStart,
                  endTime: cap.endTime + trimStart,
                }));
                setTextOverlays(prev => [...prev, ...newOverlays]);
                // Add markers for captions
                const newMarkers = captions.map((cap) => ({
                  id: crypto.randomUUID(),
                  time: cap.startTime + trimStart,
                  color: "#00D4FF",
                  label: cap.text.substring(0, 10),
                  type: "caption" as const,
                }));
                setTimelineMarkers(prev => [...prev, ...newMarkers]);
                toast.success(`${captions.length} captions applied!`);
              }}
              onSmartCutsGenerated={(cuts) => {
                const newMarkers = cuts.map((cut) => ({
                  id: crypto.randomUUID(),
                  time: cut.time,
                  color: "#FF6B00",
                  label: cut.type,
                  type: "cut" as const,
                }));
                setTimelineMarkers(prev => [...prev, ...newMarkers]);
                // Apply suggested effects at cut points
                cuts.forEach(cut => {
                  if (cut.effect && cut.effect !== "none" && !activeEffects.includes(cut.effect)) {
                    setActiveEffects(prev => [...prev, cut.effect!]);
                  }
                });
                toast.success(`${cuts.length} cut markers added!`);
              }}
              onEffectsSuggested={(suggestion) => {
                // Apply filter
                const filter = FILTER_PRESETS.find(f => f.name === suggestion.filter || f.label.toLowerCase() === suggestion.filter.toLowerCase());
                if (filter) setActiveFilter(filter);
                // Apply effects
                suggestion.effects.forEach(eff => {
                  if (!activeEffects.includes(eff)) {
                    setActiveEffects(prev => [...prev, eff]);
                  }
                });
                // Apply speed
                if (suggestion.speed) setSpeed(suggestion.speed);
                toast.success(`Applied: ${suggestion.vibe}`);
              }}
              onBgRemoveStart={() => {
                setChromaEnabled(true);
                toast.success("Chroma key enabled");
              }}
              onClose={() => setAiToolsOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Auto-Edit Wizard overlay (from empty state) */}
        {autoEditOpen && (
          <AutoEditWizard
            onClose={() => setAutoEditOpen(false)}
            onTimelineReady={(timeline, clips) => {
              setAutoEditOpen(false);
              toast.success("AI timeline generated! Use full Studio for multi-clip editing.");
            }}
          />
        )}

        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
      </motion.div>
    </AnimatePresence>
  );
}
