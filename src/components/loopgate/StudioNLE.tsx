import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Download, Film, Play, Pause, Type, Music, X,
  Loader2, SkipBack, SkipForward, Scissors, RotateCcw,
  Sparkles, Volume2, VolumeX, Plus, Image,
  Layers, Eye, EyeOff,
  Trash2, Copy, ZoomIn, ZoomOut, Undo, Redo,
  FileVideo, Wand2, SlidersHorizontal, Keyboard, Settings,
  Mic, ArrowUpCircle, Check, ChevronDown, Palette, Move,
  AlignCenter, AlignLeft, AlignRight, Bold as BoldIcon,
  Zap, Vibrate, Search, FlipHorizontal, Grid3x3, Waves,
  Rainbow, RefreshCw, Paintbrush, Gem, LayoutGrid,
  MonitorPlay, FilmIcon, Circle, Wind,
  Sun, Lightbulb, Sunrise,
  ArrowLeft, ArrowRight, ArrowUp, MoveHorizontal,
  RotateCw, Maximize, Minimize, Blend, GripVertical,
  Crop, FlipVertical, RectangleHorizontal, Square, Smartphone, Monitor,
  Ratio
} from "lucide-react";
import { useUndoRedo } from "./studio/useUndoRedo";
import { useCanvasDrag } from "./studio/useCanvasDrag";
import { useTimelineDrag } from "./studio/useTimelineDrag";
import type { ClipSegment, EditorSnapshot } from "./studio/types";
import { motion, AnimatePresence } from "framer-motion";
import StudioSubmitButton from "./StudioSubmitButton";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  FILTER_PRESETS, EFFECTS, TRANSITIONS, SPEED_OPTIONS,
  EXPORT_QUALITIES,
  applyEffect, buildComputedFilter, formatTimecode,
  type FilterPreset, type ExportQuality,
} from "@/lib/studioEffects";
import {
  STUDIO_FONTS, TEXT_ANIMATIONS, TEXT_COLORS, FONT_CATEGORIES,
  loadAllFonts, preconnectGoogleFonts,
  type StudioFont, type FontCategory, type TextAnimation,
} from "@/lib/studioFonts";
import {
  DEFAULT_ADJUSTMENTS, ADJUST_SECTIONS,
  buildAdjustFilter, applyCanvasAdjustments, hasAdjustments,
  type AdjustmentValues, type AdjustSection,
} from "@/lib/studioAdjustments";

// ─── Types ───
type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  font: StudioFont;
  fontSize: number;
  fontWeight: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  shadow: boolean;
  glow: boolean;
  animation: string;
  align: "left" | "center" | "right";
  startTime: number;
  endTime: number;
};
type MediaItem = { id: string; file: File; url: string; thumbnail: string; duration: number; name: string; type: "video" | "audio" | "image" };
type TimelineTrack = { id: string; name: string; type: "video" | "audio" | "text" | "effect"; visible: boolean; locked: boolean };
type ToolTab = "media" | "audio" | "text" | "effects" | "transitions" | "filters" | "adjust" | "export" | "upscale" | "crop";
type EffectIntensity = Record<string, number>;

// Studio accent — refined blue-violet
const ACCENT = "#7C6AFF";
const ACCENT_DIM = "rgba(124,106,255,0.10)";
const ACCENT_BORDER = "rgba(124,106,255,0.25)";
const ACCENT_GLOW = "rgba(124,106,255,0.35)";

// Crop/Aspect ratio presets
type CropPreset = { id: string; label: string; icon: typeof Square; ratio: number | null; desc: string };
const CROP_PRESETS: CropPreset[] = [
  { id: "free", label: "Free", icon: Crop, ratio: null, desc: "No constraints" },
  { id: "16:9", label: "16:9", icon: Monitor, ratio: 16 / 9, desc: "Landscape / YouTube" },
  { id: "9:16", label: "9:16", icon: Smartphone, ratio: 9 / 16, desc: "Portrait / Reels / TikTok" },
  { id: "4:3", label: "4:3", icon: RectangleHorizontal, ratio: 4 / 3, desc: "Classic TV" },
  { id: "1:1", label: "1:1", icon: Square, ratio: 1, desc: "Square / Instagram" },
  { id: "4:5", label: "4:5", icon: Smartphone, ratio: 4 / 5, desc: "Portrait / Feed" },
  { id: "21:9", label: "21:9", icon: Monitor, ratio: 21 / 9, desc: "Ultrawide / Cinema" },
  { id: "2.39:1", label: "2.39:1", icon: Film, ratio: 2.39, desc: "Anamorphic" },
];

const TOOL_TABS: { id: ToolTab; icon: typeof Film; label: string }[] = [
  { id: "media", icon: FileVideo, label: "Media" },
  { id: "audio", icon: Music, label: "Audio" },
  { id: "text", icon: Type, label: "Text" },
  { id: "crop", icon: Crop, label: "Crop" },
  { id: "effects", icon: Sparkles, label: "Effects" },
  { id: "transitions", icon: Layers, label: "Transitions" },
  { id: "filters", icon: Wand2, label: "Filters" },
  { id: "adjust", icon: SlidersHorizontal, label: "Adjust" },
  { id: "upscale", icon: ArrowUpCircle, label: "Upscale" },
  { id: "export", icon: Settings, label: "Export" },
];

// ─── Effect / Transition Icon Maps (replace emoji) ───
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

// ─── Filter preview gradient backgrounds ───
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

interface StudioNLEProps {
  initialFile?: File | null;
  onBack?: () => void;
}

export default function StudioNLE({ initialFile, onBack }: StudioNLEProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  // Core state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterPreset>(FILTER_PRESETS[0]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState("");
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<"idle" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [effectIntensities, setEffectIntensities] = useState<EffectIntensity>({});
  const [activeTransition, setActiveTransition] = useState<string | null>(null);
  const [transitionDuration, setTransitionDuration] = useState(0.5);

  // Text editor state
  const [textInput, setTextInput] = useState("");
  const [textFont, setTextFont] = useState<StudioFont>(STUDIO_FONTS[0]);
  const [textFontSize, setTextFontSize] = useState(48);
  const [textFontWeight, setTextFontWeight] = useState(700);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textStrokeColor, setTextStrokeColor] = useState("#000000");
  const [textStrokeWidth, setTextStrokeWidth] = useState(3);
  const [textShadow, setTextShadow] = useState(false);
  const [textGlow, setTextGlow] = useState(false);
  const [textAnimation, setTextAnimation] = useState("none");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [fontCategory, setFontCategory] = useState<FontCategory | "all">("all");
  const [fontSearch, setFontSearch] = useState("");
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // UI state
  const [activeToolTab, setActiveToolTab] = useState<ToolTab | null>("media");
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [exportQuality, setExportQuality] = useState<ExportQuality>("high");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [effectCategory, setEffectCategory] = useState<string>("all");

  // Upscale state
  const upscaleInputRef = useRef<HTMLInputElement>(null);
  const [upscaleFile, setUpscaleFile] = useState<File | null>(null);
  const [upscaleUrl, setUpscaleUrl] = useState<string | null>(null);
  const [upscaleMode, setUpscaleMode] = useState<"2x" | "4x">("2x");
  const [upscaleState, setUpscaleState] = useState<"idle" | "processing" | "done">("idle");
  const [upscaleProgress, setUpscaleProgress] = useState(0);
  const [upscaleResultUrl, setUpscaleResultUrl] = useState<string | null>(null);
  const [upscaleDims, setUpscaleDims] = useState<{ w: number; h: number } | null>(null);

  // Color grading (legacy — kept for filter presets)
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);

  // Advanced adjustments
  const [adjustments, setAdjustments] = useState<AdjustmentValues>({ ...DEFAULT_ADJUSTMENTS });
  const [openSections, setOpenSections] = useState<Record<AdjustSection, boolean>>({ color: true, lightness: true, effects: true });

  // Undo/Redo system
  const { pushSnapshot, undo: undoAction, redo: redoAction, canUndo, canRedo } = useUndoRedo<EditorSnapshot>();

  // Clip segments for splitting
  const [segments, setSegments] = useState<ClipSegment[]>([]);

  // Crop/Transform state
  const [cropPreset, setCropPreset] = useState<string>("free");
  const [rotation, setRotation] = useState(0); // degrees
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const activeMedia = useMemo(() => mediaItems.find((m) => m.id === activeMediaId) ?? null, [mediaItems, activeMediaId]);
  const [tracks] = useState<TimelineTrack[]>([
    { id: "v1", name: "Video", type: "video", visible: true, locked: false },
    { id: "a1", name: "Audio", type: "audio", visible: true, locked: false },
    { id: "t1", name: "Text", type: "text", visible: true, locked: false },
    { id: "e1", name: "FX", type: "effect", visible: true, locked: false },
  ]);

  const videoUrl = activeMedia?.url ?? null;
  const computedFilter = useMemo(() => buildComputedFilter(activeFilter, brightness, contrast, saturation, hueRotate), [activeFilter, brightness, contrast, saturation, hueRotate]);
  const filteredFilters = useMemo(() => filterCategory === "all" ? FILTER_PRESETS : FILTER_PRESETS.filter(f => f.category === filterCategory), [filterCategory]);
  const filteredEffects = useMemo(() => effectCategory === "all" ? EFFECTS : EFFECTS.filter(e => e.category === effectCategory), [effectCategory]);

  const filteredFonts = useMemo(() => {
    let fonts = fontCategory === "all" ? STUDIO_FONTS : STUDIO_FONTS.filter(f => f.category === fontCategory);
    if (fontSearch.trim()) {
      const q = fontSearch.toLowerCase();
      fonts = fonts.filter(f => f.label.toLowerCase().includes(q));
    }
    return fonts;
  }, [fontCategory, fontSearch]);

  // ─── Canvas text dragging ───
  const canvasDrag = useCanvasDrag({
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    textOverlays,
    currentTime,
    onUpdateOverlay: (id, updates) => setTextOverlays(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)),
  });

  // ─── Timeline dragging ───
  const timelineDrag = useTimelineDrag({
    timelineRef: timelineRef as React.RefObject<HTMLDivElement>,
    duration,
    onSeek: (t) => { const vid = videoRef.current; if (vid) { vid.currentTime = t; setCurrentTime(t); } },
    onTrimStartChange: setTrimStart,
    onTrimEndChange: setTrimEnd,
    trimStart,
    trimEnd,
  });

  // ─── Snapshot helper for undo ───
  const getSnapshot = useCallback((): EditorSnapshot => ({
    textOverlays,
    trimStart,
    trimEnd,
    activeFilter: activeFilter.name,
    activeEffects,
    effectIntensities,
    adjustments: adjustments as any,
    speed,
    segments,
  }), [textOverlays, trimStart, trimEnd, activeFilter, activeEffects, effectIntensities, adjustments, speed, segments]);

  const saveUndoSnapshot = useCallback(() => {
    pushSnapshot(getSnapshot());
  }, [pushSnapshot, getSnapshot]);

  const handleUndo = useCallback(() => {
    const prev = undoAction(getSnapshot());
    if (!prev) return;
    setTextOverlays(prev.textOverlays);
    setTrimStart(prev.trimStart);
    setTrimEnd(prev.trimEnd);
    const filter = FILTER_PRESETS.find(f => f.name === prev.activeFilter);
    if (filter) setActiveFilter(filter);
    setActiveEffects(prev.activeEffects);
    setEffectIntensities(prev.effectIntensities);
    setAdjustments(prev.adjustments as any);
    setSpeed(prev.speed);
    setSegments(prev.segments);
    toast.success("Undo");
  }, [undoAction, getSnapshot]);

  const handleRedo = useCallback(() => {
    const next = redoAction(getSnapshot());
    if (!next) return;
    setTextOverlays(next.textOverlays);
    setTrimStart(next.trimStart);
    setTrimEnd(next.trimEnd);
    const filter = FILTER_PRESETS.find(f => f.name === next.activeFilter);
    if (filter) setActiveFilter(filter);
    setActiveEffects(next.activeEffects);
    setEffectIntensities(next.effectIntensities);
    setAdjustments(next.adjustments as any);
    setSpeed(next.speed);
    setSegments(next.segments);
    toast.success("Redo");
  }, [redoAction, getSnapshot]);

  // ─── Load Fonts ───
  useEffect(() => {
    preconnectGoogleFonts();
    loadAllFonts();
  }, []);

  // ─── Auto-load initial file from StudioHome ───
  useEffect(() => {
    if (!initialFile) return;
    const url = URL.createObjectURL(initialFile);
    const id = crypto.randomUUID();
    const vid = document.createElement("video");
    vid.src = url; vid.muted = true; vid.preload = "auto";
    vid.onloadedmetadata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 160; canvas.height = 90;
      vid.currentTime = 1;
      vid.onseeked = () => {
        canvas.getContext("2d")!.drawImage(vid, 0, 0, 160, 90);
        const thumb = canvas.toDataURL("image/jpeg", 0.6);
        setMediaItems([{ id, file: initialFile, url, thumbnail: thumb, duration: vid.duration, name: initialFile.name, type: "video" }]);
        setActiveMediaId(id);
      };
    };
  }, []); // Only on mount

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      switch (e.key) {
        case " ": e.preventDefault(); togglePlay(); break;
        case "ArrowLeft": e.preventDefault(); seekTo(Math.max(0, currentTime - (e.shiftKey ? 5 : 1))); break;
        case "ArrowRight": e.preventDefault(); seekTo(Math.min(duration, currentTime + (e.shiftKey ? 5 : 1))); break;
        case "j": seekTo(Math.max(0, currentTime - 5)); break;
        case "k": togglePlay(); break;
        case "l": seekTo(Math.min(duration, currentTime + 5)); break;
        case "i": saveUndoSnapshot(); setTrimStart(currentTime); toast.success("In point set"); break;
        case "o": saveUndoSnapshot(); setTrimEnd(currentTime); toast.success("Out point set"); break;
        case "s": if (e.ctrlKey || e.metaKey) { e.preventDefault(); startExport(); } break;
        case "z":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
          }
          break;
        case "m": setMuted(prev => !prev); break;
        case "[": setSpeed(prev => SPEED_OPTIONS[Math.max(0, SPEED_OPTIONS.indexOf(prev) - 1)]); break;
        case "]": setSpeed(prev => SPEED_OPTIONS[Math.min(SPEED_OPTIONS.length - 1, SPEED_OPTIONS.indexOf(prev) + 1)]); break;
        case "Home": seekTo(trimStart); break;
        case "End": seekTo(trimEnd); break;
        case "?": setShowShortcuts(prev => !prev); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentTime, duration, trimStart, trimEnd, playing, handleUndo, handleRedo, saveUndoSnapshot]);

  // ─── File Handling ───
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith("video/") && !f.type.startsWith("image/") && !f.type.startsWith("audio/")) {
        toast.error(`Unsupported file: ${f.name}`); return;
      }
      if (f.size > 2 * 1024 * 1024 * 1024) { toast.error("Max 2GB per file"); return; }
      const url = URL.createObjectURL(f);
      const id = crypto.randomUUID();
      const type = f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : "image";
      if (type === "video") {
        const vid = document.createElement("video");
        vid.src = url; vid.muted = true; vid.preload = "auto";
        vid.onloadedmetadata = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 160; canvas.height = 90;
          vid.currentTime = 1;
          vid.onseeked = () => {
            canvas.getContext("2d")!.drawImage(vid, 0, 0, 160, 90);
            const thumb = canvas.toDataURL("image/jpeg", 0.6);
            setMediaItems((prev) => [...prev, { id, file: f, url, thumbnail: thumb, duration: vid.duration, name: f.name, type }]);
            if (!activeMediaId) setActiveMediaId(id);
          };
        };
      } else {
        setMediaItems((prev) => [...prev, { id, file: f, url, thumbnail: "", duration: 0, name: f.name, type }]);
        if (!activeMediaId && type === "image") setActiveMediaId(id);
      }
    });
    e.target.value = "";
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("audio/")) { toast.error("Please select an audio file"); return; }
    setAudioFile(f); setAudioName(f.name); toast.success("Audio track added");
    e.target.value = "";
  };

  const removeMedia = (id: string) => {
    setMediaItems((prev) => { const item = prev.find((m) => m.id === id); if (item) URL.revokeObjectURL(item.url); return prev.filter((m) => m.id !== id); });
    if (activeMediaId === id) setActiveMediaId(mediaItems.find((m) => m.id !== id)?.id ?? null);
  };

  const toggleEffect = (effectId: string) => {
    setActiveEffects(prev => {
      if (prev.includes(effectId)) return prev.filter(e => e !== effectId);
      return [...prev, effectId];
    });
    if (!effectIntensities[effectId]) {
      setEffectIntensities(prev => ({ ...prev, [effectId]: 0.7 }));
    }
  };

  const setEffectIntensity = (effectId: string, value: number) => {
    setEffectIntensities(prev => ({ ...prev, [effectId]: value }));
  };

  // ─── Timeline Thumbnails ───
  useEffect(() => {
    if (!videoUrl) { setThumbnails([]); return; }
    const vid = document.createElement("video");
    vid.src = videoUrl; vid.crossOrigin = "anonymous"; vid.muted = true; vid.preload = "auto";
    vid.onloadedmetadata = () => {
      setDuration(vid.duration); setTrimEnd(vid.duration);
      const count = Math.min(24, Math.max(8, Math.floor(vid.duration / 1.2)));
      const interval = vid.duration / count;
      const canvas = document.createElement("canvas"); canvas.width = 80; canvas.height = 45;
      const ctx = canvas.getContext("2d")!;
      const thumbs: string[] = []; let i = 0;
      const captureFrame = () => { if (i >= count) { setThumbnails(thumbs); return; } vid.currentTime = i * interval; };
      vid.onseeked = () => { ctx.drawImage(vid, 0, 0, 80, 45); thumbs.push(canvas.toDataURL("image/jpeg", 0.4)); i++; captureFrame(); };
      captureFrame();
    };
  }, [videoUrl]);

  // ─── Video Events ───
  useEffect(() => {
    const vid = videoRef.current; if (!vid) return;
    const onMeta = () => { setDuration(vid.duration); setTrimEnd(vid.duration); };
    const onTime = () => setCurrentTime(vid.currentTime);
    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("timeupdate", onTime);
    return () => { vid.removeEventListener("loadedmetadata", onMeta); vid.removeEventListener("timeupdate", onTime); };
  }, [videoUrl]);

  // ─── Canvas Render Loop ───
  useEffect(() => {
    const vid = videoRef.current; const canvas = canvasRef.current;
    if (!vid || !canvas || !videoUrl) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let running = true;

    // Calculate crop dimensions
    const getCropDimensions = (vw: number, vh: number) => {
      const preset = CROP_PRESETS.find(p => p.id === cropPreset);
      if (!preset || !preset.ratio) return { sx: 0, sy: 0, sw: vw, sh: vh, dw: vw, dh: vh };
      const targetRatio = preset.ratio;
      const sourceRatio = vw / vh;
      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (sourceRatio > targetRatio) {
        sw = Math.round(vh * targetRatio);
        sx = Math.round((vw - sw) / 2);
      } else {
        sh = Math.round(vw / targetRatio);
        sy = Math.round((vh - sh) / 2);
      }
      return { sx, sy, sw, sh, dw: sw, dh: sh };
    };

    const draw = () => {
      if (!running) return;
      if (vid.videoWidth && vid.videoHeight) {
        const crop = getCropDimensions(vid.videoWidth, vid.videoHeight);
        
        // Resize canvas to cropped output
        if (canvas.width !== crop.dw || canvas.height !== crop.dh) {
          canvas.width = crop.dw;
          canvas.height = crop.dh;
        }
        
        ctx.save();
        
        // Apply rotation and flip transforms
        if (rotation !== 0 || flipH || flipV) {
          ctx.translate(crop.dw / 2, crop.dh / 2);
          if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
          ctx.translate(-crop.dw / 2, -crop.dh / 2);
        }

        // Apply CSS-based filters (presets + basic grading)
        const adjFilter = buildAdjustFilter(adjustments);
        const combinedFilter = [computedFilter, adjFilter].filter(f => f !== "none").join(" ") || "none";
        ctx.filter = combinedFilter;
        ctx.drawImage(vid, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, crop.dw, crop.dh);
        ctx.filter = "none";
        ctx.restore();

        // Apply pixel-based adjustments (highlights, shadows, sharpen, vignette, etc.)
        if (hasAdjustments(adjustments)) {
          applyCanvasAdjustments(ctx, canvas, adjustments);
        }

        // Apply effects with per-effect intensity
        activeEffects.forEach(effectId => {
          const intensity = effectIntensities[effectId] ?? 0.7;
          try { applyEffect(ctx, canvas, effectId, vid.currentTime, intensity); } catch { /* graceful */ }
        });

        // Apply transitions
        if (activeTransition && duration > 0) {
          applyTransitionToCanvas(ctx, canvas, activeTransition, vid.currentTime, duration, transitionDuration);
        }

        // Render text overlays with full styling
        textOverlays.forEach((overlay) => {
          if (vid.currentTime >= overlay.startTime && vid.currentTime <= overlay.endTime) {
            renderFullTextOverlay(ctx, canvas, overlay, vid.currentTime);
          }
        });

        // Draw crop overlay guides when crop tool is active
        if (cropPreset !== "free" && activeToolTab === "crop") {
          ctx.strokeStyle = "rgba(124,106,255,0.3)";
          ctx.lineWidth = 1;
          // Rule of thirds
          for (let i = 1; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo((crop.dw / 3) * i, 0);
            ctx.lineTo((crop.dw / 3) * i, crop.dh);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, (crop.dh / 3) * i);
            ctx.lineTo(crop.dw, (crop.dh / 3) * i);
            ctx.stroke();
          }
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [videoUrl, computedFilter, textOverlays, activeEffects, effectIntensities, activeTransition, transitionDuration, duration, adjustments, cropPreset, rotation, flipH, flipV, activeToolTab]);

  // ─── Text Rendering Engine ───
  const renderFullTextOverlay = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, overlay: TextOverlay, time: number) => {
    const { text, x, y, font, fontSize, fontWeight, color, strokeColor, strokeWidth, shadow, glow, animation, align } = overlay;
    const w = canvas.width, h = canvas.height;

    // Calculate animation progress
    const elapsed = time - overlay.startTime;
    const totalDur = overlay.endTime - overlay.startTime;
    let animProgress = 1;
    let offsetX = 0, offsetY = 0, scale = 1, alpha = 1, blur = 0;

    if (animation !== "none" && elapsed < 0.5) {
      animProgress = Math.min(1, elapsed / 0.5);
      const ease = 1 - Math.pow(1 - animProgress, 3); // ease-out cubic
      switch (animation) {
        case "fade_in": alpha = ease; break;
        case "slide_up": offsetY = (1 - ease) * 60; alpha = ease; break;
        case "slide_down": offsetY = -(1 - ease) * 60; alpha = ease; break;
        case "scale_in": scale = 0.3 + ease * 0.7; alpha = ease; break;
        case "bounce": scale = ease < 0.6 ? ease / 0.6 * 1.2 : 1.2 - (ease - 0.6) / 0.4 * 0.2; alpha = Math.min(1, ease * 2); break;
        case "rotate_in": scale = ease; alpha = ease; break;
        case "blur_in": blur = (1 - ease) * 10; alpha = ease; break;
        case "typewriter": break; // handled below
        case "shake":
          if (ease < 1) { offsetX = Math.sin(elapsed * 40) * 5 * (1 - ease); offsetY = Math.cos(elapsed * 35) * 3 * (1 - ease); }
          alpha = Math.min(1, ease * 3);
          break;
        case "glitch":
          if (ease < 1) { offsetX = (Math.random() - 0.5) * 20 * (1 - ease); offsetY = (Math.random() - 0.5) * 10 * (1 - ease); }
          alpha = Math.min(1, ease * 2);
          break;
        case "wave": offsetY = Math.sin(elapsed * 8) * 10 * (1 - ease); alpha = ease; break;
      }
    }

    // Typewriter: only show partial text
    let displayText = text;
    if (animation === "typewriter" && elapsed < text.length * 0.06) {
      const charsToShow = Math.floor(elapsed / 0.06);
      displayText = text.substring(0, Math.max(1, charsToShow));
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    if (blur > 0) ctx.filter = `blur(${blur}px)`;

    const scaledSize = Math.round(fontSize * (w / 1920)); // Scale to video resolution
    ctx.font = `${fontWeight} ${scaledSize}px ${font.family}, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";

    const px = w * x + offsetX;
    const py = h * y + offsetY;

    if (scale !== 1) {
      ctx.translate(px, py);
      ctx.scale(scale, scale);
      ctx.translate(-px, -py);
    }

    // Shadow
    if (shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = scaledSize * 0.15;
      ctx.shadowOffsetX = scaledSize * 0.04;
      ctx.shadowOffsetY = scaledSize * 0.04;
    }

    // Glow
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = scaledSize * 0.4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Stroke
    if (strokeWidth > 0 && strokeColor !== "transparent") {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth * (w / 1920);
      ctx.lineJoin = "round";
      ctx.strokeText(displayText, px, py);
    }

    // Fill
    ctx.fillStyle = color;
    ctx.fillText(displayText, px, py);

    ctx.restore();
  };

  // ─── Transition Engine ───
  const applyTransitionToCanvas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, transId: string, time: number, dur: number, transDur: number) => {
    const w = canvas.width, h = canvas.height;
    // Intro transition (first transDur seconds)
    const introProgress = Math.min(1, time / transDur);
    // Outro transition (last transDur seconds)
    const outroStart = dur - transDur;
    const outroProgress = time > outroStart ? Math.min(1, (time - outroStart) / transDur) : -1;

    const applyTrans = (progress: number, isOutro: boolean) => {
      const p = isOutro ? progress : 1 - progress;
      if (p <= 0) return;

      switch (transId) {
        case "fade": {
          ctx.fillStyle = `rgba(0,0,0,${p})`;
          ctx.fillRect(0, 0, w, h);
          break;
        }
        case "dissolve": {
          ctx.globalAlpha = p * 0.8;
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, w, h);
          ctx.globalAlpha = 1;
          break;
        }
        case "slide_left": {
          const imgData = ctx.getImageData(0, 0, w, h);
          ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
          ctx.putImageData(imgData, isOutro ? -w * p : w * p, 0);
          break;
        }
        case "slide_right": {
          const imgData = ctx.getImageData(0, 0, w, h);
          ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
          ctx.putImageData(imgData, isOutro ? w * p : -w * p, 0);
          break;
        }
        case "slide_up": {
          const imgData = ctx.getImageData(0, 0, w, h);
          ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
          ctx.putImageData(imgData, 0, isOutro ? -h * p : h * p);
          break;
        }
        case "wipe": {
          const wipeX = isOutro ? w * (1 - p) : w * p;
          ctx.fillStyle = "#000";
          if (isOutro) ctx.fillRect(wipeX, 0, w - wipeX, h);
          else ctx.fillRect(0, 0, w - wipeX, h);
          break;
        }
        case "zoom_in": {
          const scale = isOutro ? 1 + p * 2 : 3 - p * 2;
          const imgData = ctx.getImageData(0, 0, w, h);
          ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.scale(scale, scale);
          ctx.globalAlpha = isOutro ? 1 - p : p;
          ctx.translate(-w / 2, -h / 2);
          ctx.putImageData(imgData, 0, 0);
          ctx.restore();
          ctx.globalAlpha = 1;
          break;
        }
        case "zoom_out": {
          const s = isOutro ? 1 - p * 0.5 : 0.5 + p * 0.5;
          ctx.globalAlpha = isOutro ? 1 - p : p;
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.scale(s, s);
          ctx.translate(-w / 2, -h / 2);
          ctx.restore();
          ctx.globalAlpha = 1;
          break;
        }
        case "spin": {
          const angle = p * Math.PI * 0.5;
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.rotate(isOutro ? angle : -angle);
          ctx.globalAlpha = 1 - p * 0.5;
          ctx.translate(-w / 2, -h / 2);
          ctx.restore();
          ctx.globalAlpha = 1;
          break;
        }
        case "blur_trans": {
          ctx.globalAlpha = p;
          ctx.filter = `blur(${p * 20}px)`;
          const imgData = ctx.getImageData(0, 0, w, h);
          ctx.putImageData(imgData, 0, 0);
          ctx.filter = "none";
          ctx.globalAlpha = 1;
          break;
        }
        case "glitch_trans": {
          if (p > 0.1) {
            const slices = Math.round(p * 15);
            for (let i = 0; i < slices; i++) {
              const sy = Math.random() * h;
              const sh = 2 + Math.random() * 20;
              const ox = (Math.random() - 0.5) * w * p * 0.3;
              try {
                const slice = ctx.getImageData(0, Math.floor(sy), w, Math.min(Math.ceil(sh), h - Math.floor(sy)));
                ctx.putImageData(slice, ox, Math.floor(sy));
              } catch { /* */ }
            }
            ctx.fillStyle = `rgba(0,0,0,${p * 0.3})`;
            ctx.fillRect(0, 0, w, h);
          }
          break;
        }
        case "flash_trans": {
          ctx.fillStyle = `rgba(255,255,255,${p})`;
          ctx.fillRect(0, 0, w, h);
          break;
        }
      }
    };

    if (introProgress < 1) applyTrans(introProgress, false);
    if (outroProgress >= 0) applyTrans(outroProgress, true);
  };

  // ─── Playback Controls ───
  const togglePlay = useCallback(() => {
    const vid = videoRef.current; if (!vid || !videoUrl) return;
    if (vid.paused) {
      if (vid.currentTime < trimStart || vid.currentTime >= trimEnd) vid.currentTime = trimStart;
      vid.playbackRate = speed; vid.play().catch(() => {}); setPlaying(true);
    } else { vid.pause(); setPlaying(false); }
  }, [trimStart, trimEnd, speed, videoUrl]);

  useEffect(() => {
    const vid = videoRef.current; if (!vid || !playing) return;
    const check = () => { if (vid.currentTime >= trimEnd) { vid.pause(); vid.currentTime = trimStart; setPlaying(false); } };
    const id = setInterval(check, 50);
    return () => clearInterval(id);
  }, [playing, trimEnd, trimStart]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted; }, [muted]);

  const seekTo = useCallback((time: number) => {
    const vid = videoRef.current; if (!vid) return;
    const clamped = Math.max(0, Math.min(duration, time));
    vid.currentTime = clamped; setCurrentTime(clamped);
  }, [duration]);

  // handleTimelineClick replaced by useTimelineDrag


  const addTextOverlay = () => {
    if (!textInput.trim()) return;
    const overlay: TextOverlay = {
      id: crypto.randomUUID(),
      text: textInput,
      x: 0.5, y: 0.5,
      font: textFont,
      fontSize: textFontSize,
      fontWeight: textFontWeight,
      color: textColor,
      strokeColor: textStrokeColor,
      strokeWidth: textStrokeWidth,
      shadow: textShadow,
      glow: textGlow,
      animation: textAnimation,
      align: textAlign,
      startTime: trimStart,
      endTime: trimEnd,
    };
    saveUndoSnapshot();
    setTextOverlays((prev) => [...prev, overlay]);
    setTextInput(""); toast.success("Text overlay added");
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeTextOverlay = (id: string) => {
    saveUndoSnapshot();
    setTextOverlays((prev) => prev.filter((t) => t.id !== id));
    if (editingTextId === id) setEditingTextId(null);
  };

  const splitAtPlayhead = () => {
    if (!activeMedia || currentTime <= trimStart || currentTime >= trimEnd) return;
    saveUndoSnapshot();
    
    // If no segments yet, create the initial segment
    if (segments.length === 0) {
      const seg: ClipSegment = {
        id: crypto.randomUUID(),
        mediaId: activeMedia.id,
        sourceStart: trimStart,
        sourceEnd: trimEnd,
        trackPosition: 0,
        duration: trimEnd - trimStart,
      };
      // Split into two segments
      const seg1: ClipSegment = { ...seg, id: crypto.randomUUID(), sourceEnd: currentTime, duration: currentTime - trimStart };
      const seg2: ClipSegment = { ...seg, id: crypto.randomUUID(), sourceStart: currentTime, trackPosition: currentTime - trimStart, duration: trimEnd - currentTime };
      setSegments([seg1, seg2]);
    } else {
      // Find the segment that contains the playhead
      const segIdx = segments.findIndex(s => currentTime >= s.sourceStart && currentTime < s.sourceEnd);
      if (segIdx === -1) return;
      const seg = segments[segIdx];
      const seg1: ClipSegment = { ...seg, id: crypto.randomUUID(), sourceEnd: currentTime, duration: currentTime - seg.sourceStart };
      const seg2: ClipSegment = { ...seg, id: crypto.randomUUID(), sourceStart: currentTime, trackPosition: seg.trackPosition + (currentTime - seg.sourceStart), duration: seg.sourceEnd - currentTime };
      const newSegments = [...segments];
      newSegments.splice(segIdx, 1, seg1, seg2);
      setSegments(newSegments);
    }
    toast.success(`Split at ${formatTimecode(currentTime, true)}`);
  };

  const deleteSegment = (segId: string) => {
    saveUndoSnapshot();
    setSegments(prev => prev.filter(s => s.id !== segId));
    toast.success("Segment deleted");
  };

  const resetColorGrading = () => { setBrightness(100); setContrast(100); setSaturation(100); setHueRotate(0); setAdjustments({ ...DEFAULT_ADJUSTMENTS }); };

  const updateAdjustment = (key: keyof AdjustmentValues, value: number) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  const toggleSection = (section: AdjustSection) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ─── Upscaler ───
  const handleUpscaleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("video/")) { toast.error("Select a video file"); return; }
    if (f.size > 2 * 1024 * 1024 * 1024) { toast.error("Max 2GB"); return; }
    setUpscaleFile(f); setUpscaleUrl(URL.createObjectURL(f));
    setUpscaleResultUrl(null); setUpscaleState("idle"); setUpscaleProgress(0);
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
    const canvas = document.createElement("canvas"); canvas.width = finalW; canvas.height = finalH;
    const ctx = canvas.getContext("2d")!; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: Math.min(finalW * finalH * 8, 40_000_000) });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const resultPromise = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });
    recorder.start(100); video.currentTime = 0; await video.play();
    const dur = video.duration;
    const drawLoop = () => {
      if (video.ended || video.paused) { recorder.stop(); return; }
      ctx.drawImage(video, 0, 0, finalW, finalH);
      setUpscaleProgress(Math.min(99, Math.round((video.currentTime / dur) * 100)));
      requestAnimationFrame(drawLoop);
    };
    drawLoop();
    video.onended = () => recorder.stop();
    const blob = await resultPromise;
    setUpscaleResultUrl(URL.createObjectURL(blob)); setUpscaleProgress(100); setUpscaleState("done");
    toast.success("Video upscaled!"); video.pause(); video.src = "";
  }, [upscaleUrl, upscaleFile, upscaleMode]);

  const handleUpscaleDownload = () => {
    if (!upscaleResultUrl || !upscaleFile) return;
    const a = document.createElement("a"); a.href = upscaleResultUrl;
    a.download = `${upscaleFile.name.replace(/\.[^/.]+$/, "")}_${upscaleMode}_upscaled.webm`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const clearUpscale = () => {
    if (upscaleUrl) URL.revokeObjectURL(upscaleUrl);
    if (upscaleResultUrl) URL.revokeObjectURL(upscaleResultUrl);
    setUpscaleFile(null); setUpscaleUrl(null); setUpscaleResultUrl(null);
    setUpscaleState("idle"); setUpscaleProgress(0); setUpscaleDims(null);
  };

  // ─── Export (with native audio preservation) ───
  const startExport = useCallback(async () => {
    const vid = videoRef.current; const canvas = canvasRef.current;
    if (!vid || !canvas || !activeMedia) return;
    setState("processing"); setProgress(0);
    const quality = EXPORT_QUALITIES.find(q => q.id === exportQuality) ?? EXPORT_QUALITIES[2];
    const ctx = canvas.getContext("2d")!;
    
    // Calculate crop for export
    const cropP = CROP_PRESETS.find(p => p.id === cropPreset);
    let exportW: number, exportH: number;
    let cropSx = 0, cropSy = 0, cropSw = vid.videoWidth, cropSh = vid.videoHeight;
    if (cropP && cropP.ratio) {
      const sourceRatio = vid.videoWidth / vid.videoHeight;
      if (sourceRatio > cropP.ratio) {
        cropSw = Math.round(vid.videoHeight * cropP.ratio);
        cropSx = Math.round((vid.videoWidth - cropSw) / 2);
      } else {
        cropSh = Math.round(vid.videoWidth / cropP.ratio);
        cropSy = Math.round((vid.videoHeight - cropSh) / 2);
      }
    }
    exportW = Math.round(cropSw * quality.resolution);
    exportH = Math.round(cropSh * quality.resolution);
    canvas.width = exportW; canvas.height = exportH;
    const stream = canvas.captureStream(quality.fps);

    // Capture native video audio
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    let hasAudioSource = false;

    try {
      // Get audio from the video element itself
      const vidSource = audioCtx.createMediaElementSource(vid);
      vidSource.connect(dest);
      vidSource.connect(audioCtx.destination); // Also hear it during export
      hasAudioSource = true;
    } catch {
      // Video may not have audio track, continue silently
    }

    // Mix in custom audio file if present
    if (audioFile) {
      try {
        const buf = await audioFile.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(buf);
        const source = audioCtx.createBufferSource();
        source.buffer = decoded;
        source.connect(dest);
        source.start(0);
        hasAudioSource = true;
      } catch { /* audio error, continue without */ }
    }

    // Add audio tracks to the stream
    if (hasAudioSource) {
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: quality.bitrate });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const resultPromise = new Promise<Blob>((resolve) => { recorder.onstop = () => { audioCtx.close(); resolve(new Blob(chunks, { type: mimeType })); }; });
    recorder.start(100);
    vid.currentTime = trimStart; vid.muted = false; vid.playbackRate = 1;
    await vid.play().catch(() => {});
    const exportDuration = trimEnd - trimStart;
    const drawLoop = () => {
      if (vid.currentTime >= trimEnd || vid.ended) { vid.pause(); recorder.stop(); return; }
      ctx.save();
      // Apply rotation/flip for export
      if (rotation !== 0 || flipH || flipV) {
        ctx.translate(exportW / 2, exportH / 2);
        if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.translate(-exportW / 2, -exportH / 2);
      }
      const adjFilter = buildAdjustFilter(adjustments);
      const combinedExportFilter = [computedFilter, adjFilter].filter(f => f !== "none").join(" ") || "none";
      ctx.filter = combinedExportFilter;
      ctx.drawImage(vid, cropSx, cropSy, cropSw, cropSh, 0, 0, exportW, exportH);
      ctx.filter = "none";
      ctx.restore();
      if (hasAdjustments(adjustments)) {
        applyCanvasAdjustments(ctx, canvas, adjustments);
      }
      activeEffects.forEach(effectId => {
        const intensity = effectIntensities[effectId] ?? 0.7;
        try { applyEffect(ctx, canvas, effectId, vid.currentTime, intensity); } catch { /* */ }
      });
      if (activeTransition) {
        applyTransitionToCanvas(ctx, canvas, activeTransition, vid.currentTime - trimStart, exportDuration, transitionDuration);
      }
      textOverlays.forEach((overlay) => {
        if (vid.currentTime >= overlay.startTime && vid.currentTime <= overlay.endTime) {
          renderFullTextOverlay(ctx, canvas, overlay, vid.currentTime);
        }
      });
      setProgress(Math.min(99, Math.round(((vid.currentTime - trimStart) / exportDuration) * 100)));
      requestAnimationFrame(drawLoop);
    };
    drawLoop();
    const blob = await resultPromise;
    setResultUrl(URL.createObjectURL(blob));
    setProgress(100); setState("done"); vid.muted = muted; vid.playbackRate = speed;
    canvas.width = vid.videoWidth; canvas.height = vid.videoHeight;
    toast.success("Export complete!");
  }, [activeMedia, trimStart, trimEnd, computedFilter, textOverlays, audioFile, muted, speed, activeEffects, effectIntensities, exportQuality, activeTransition, transitionDuration, adjustments]);

  const handleDownload = () => {
    if (!resultUrl || !activeMedia) return;
    const a = document.createElement("a"); a.href = resultUrl;
    a.download = `${activeMedia.name.replace(/\.[^/.]+$/, "")}_loopgate.webm`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ─── RENDER ───
  return (
    <div className="h-full flex flex-col overflow-hidden select-none" style={{ background: "#09090c", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ TOP TOOLBAR ═══ */}
      <div className="h-11 flex items-center px-2 gap-0.5 flex-shrink-0 z-20" style={{ background: "#111114", borderBottom: "1px solid #1e1e24" }}>
        <button onClick={() => onBack ? onBack() : navigate("/hub")} className="p-1.5 rounded-lg transition-all hover:bg-white/5 mr-1" title="Back to Loopgate">
          <ArrowLeft className="w-4 h-4" style={{ color: "#888" }} />
        </button>
        <div className="w-px h-5 mr-1" style={{ background: "#1e1e24" }} />
        {TOOL_TABS.map((tab) => {
          const isActive = activeToolTab === tab.id;
          return (
            <button key={tab.id}
              onClick={() => setActiveToolTab(isActive ? null : tab.id)}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-all duration-200 relative"
              style={{
                color: isActive ? ACCENT : "#666",
                background: isActive ? ACCENT_DIM : "transparent",
              }}>
              <tab.icon className="w-4 h-4" />
              <span className="text-[8px] font-semibold tracking-wide">{tab.label}</span>
              {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full" style={{ background: ACCENT }} />}
            </button>
          );
        })}
        <div className="flex-1" />
        {/* Undo/Redo */}
        <button onClick={handleUndo} disabled={!canUndo} className="p-1.5 rounded-md transition-all hover:bg-white/5 disabled:opacity-20" title="Undo (⌘Z)">
          <Undo className="w-4 h-4" style={{ color: "#aaa" }} />
        </button>
        <button onClick={handleRedo} disabled={!canRedo} className="p-1.5 rounded-md transition-all hover:bg-white/5 disabled:opacity-20" title="Redo (⌘⇧Z)">
          <Redo className="w-4 h-4" style={{ color: "#aaa" }} />
        </button>
        <div className="w-px h-5 mx-1" style={{ background: "#1e1e24" }} />
        <StudioSubmitButton />
        <div className="w-px h-5 mx-1" style={{ background: "#1e1e24" }} />
        {state === "done" ? (
          <button onClick={handleDownload}
            className="h-8 px-5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #a78bfa)`, color: "#fff", boxShadow: `0 0 16px ${ACCENT_GLOW}` }}>
            <Download className="w-3.5 h-3.5" /> Save
          </button>
        ) : (
          <button onClick={startExport} disabled={state === "processing" || !activeMedia}
            className="h-8 px-5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-30"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #a78bfa)`, color: "#fff", boxShadow: `0 0 16px ${ACCENT_GLOW}` }}>
            {state === "processing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {state === "processing" ? `${progress}%` : "Export"}
          </button>
        )}
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex min-h-0">

        {/* ─── LEFT PANEL ─── */}
        <AnimatePresence mode="wait">
          {activeToolTab && (
            <motion.div
              key={activeToolTab}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className="flex-shrink-0 overflow-hidden flex flex-col"
              style={{ background: "#1a1a1a", borderRight: "1px solid #2a2a2a" }}
            >
              <div className="flex items-center h-9 px-3 flex-shrink-0" style={{ borderBottom: "1px solid #222" }}>
                <span className="text-xs font-semibold" style={{ color: "#e0e0e0" }}>
                  {TOOL_TABS.find(t => t.id === activeToolTab)?.label}
                </span>
                <div className="flex-1" />
                <button onClick={() => setActiveToolTab(null)} className="p-1 rounded hover:bg-white/5 transition-all">
                  <X className="w-3.5 h-3.5" style={{ color: "#666" }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>

                {/* ════════ MEDIA ════════ */}
                {activeToolTab === "media" && (
                  <>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 rounded-lg flex flex-col items-center gap-3 transition-all hover:bg-white/5"
                      style={{ border: `1px dashed #333`, background: "#151515" }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: ACCENT_DIM }}>
                        <Plus className="w-5 h-5" style={{ color: ACCENT }} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium" style={{ color: ACCENT }}>Import</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>Videos, photos, and audio</p>
                      </div>
                    </button>
                    {mediaItems.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 pt-2">
                        {mediaItems.map((item) => (
                          <div key={item.id}
                            onClick={() => setActiveMediaId(item.id)}
                            className="relative group cursor-pointer rounded-md overflow-hidden transition-all"
                            style={{ border: activeMediaId === item.id ? `2px solid ${ACCENT}` : "2px solid transparent" }}>
                            {item.thumbnail ? (
                              <img src={item.thumbnail} alt={item.name} className="w-full aspect-video object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full aspect-video flex items-center justify-center" style={{ background: "#1e1e1e" }}>
                                {item.type === "audio" ? <Music className="w-5 h-5" style={{ color: "#444" }} /> : <Image className="w-5 h-5" style={{ color: "#444" }} />}
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 p-1.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
                              <p className="text-[8px] text-white/80 truncate">{item.name}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full items-center justify-center hidden group-hover:flex"
                              style={{ background: "rgba(0,0,0,0.7)" }}>
                              <X className="w-2.5 h-2.5 text-white/70" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ════════ CROP / TRANSFORM ════════ */}
                {activeToolTab === "crop" && (
                  <>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: "#666" }}>Aspect Ratio</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CROP_PRESETS.map((preset) => {
                          const isActive = cropPreset === preset.id;
                          const Icon = preset.icon;
                          return (
                            <button key={preset.id}
                              onClick={() => setCropPreset(isActive ? "free" : preset.id)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all"
                              style={{
                                background: isActive ? ACCENT_DIM : "#151515",
                                border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                              }}>
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? ACCENT : "#555" }} />
                              <div className="text-left">
                                <span className="text-[11px] font-semibold block" style={{ color: isActive ? ACCENT : "#bbb" }}>{preset.label}</span>
                                <span className="text-[8px] block" style={{ color: "#555" }}>{preset.desc}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rotation */}
                    <div className="space-y-2 pt-2" style={{ borderTop: "1px solid #222" }}>
                      <span className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: "#666" }}>Rotation</span>
                      <div className="flex items-center gap-2">
                        <Slider value={[rotation]} onValueChange={v => setRotation(v[0])} min={-180} max={180} step={1} className="flex-1" />
                        <span className="text-[10px] font-mono w-10 text-right" style={{ color: "#888" }}>{rotation}°</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[-90, 0, 90, 180].map(deg => (
                          <button key={deg} onClick={() => setRotation(deg)}
                            className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all"
                            style={{
                              background: rotation === deg ? ACCENT_DIM : "#151515",
                              border: rotation === deg ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                              color: rotation === deg ? ACCENT : "#666",
                            }}>
                            {deg === 0 ? "0°" : `${deg}°`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Flip */}
                    <div className="space-y-2 pt-2" style={{ borderTop: "1px solid #222" }}>
                      <span className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: "#666" }}>Flip</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => setFlipH(!flipH)}
                          className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
                          style={{
                            background: flipH ? ACCENT_DIM : "#151515",
                            border: flipH ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                            color: flipH ? ACCENT : "#666",
                          }}>
                          <FlipHorizontal className="w-4 h-4" />
                          <span className="text-[10px] font-medium">Horizontal</span>
                        </button>
                        <button onClick={() => setFlipV(!flipV)}
                          className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
                          style={{
                            background: flipV ? ACCENT_DIM : "#151515",
                            border: flipV ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                            color: flipV ? ACCENT : "#666",
                          }}>
                          <FlipVertical className="w-4 h-4" />
                          <span className="text-[10px] font-medium">Vertical</span>
                        </button>
                      </div>
                    </div>

                    {/* Reset */}
                    {(cropPreset !== "free" || rotation !== 0 || flipH || flipV) && (
                      <button onClick={() => { setCropPreset("free"); setRotation(0); setFlipH(false); setFlipV(false); }}
                        className="w-full py-2 text-[10px] font-medium rounded-lg transition-all hover:bg-red-500/10"
                        style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                        Reset Transform
                      </button>
                    )}
                  </>
                )}


                {activeToolTab === "text" && (
                  <>
                    {/* Text input */}
                    <input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type your text..."
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-all"
                      style={{ background: "#151515", border: `1px solid #2a2a2a`, color: "#e0e0e0" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = ACCENT}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#2a2a2a"}
                      onKeyDown={(e) => e.key === "Enter" && addTextOverlay()} />

                    {/* Font picker */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium" style={{ color: "#888" }}>Font</span>
                      <button onClick={() => setShowFontPicker(!showFontPicker)}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 transition-all hover:bg-white/3"
                        style={{ background: "#151515", border: "1px solid #2a2a2a" }}>
                        <span className="text-xs truncate" style={{ color: "#ccc", fontFamily: textFont.family }}>{textFont.label}</span>
                        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#555", transform: showFontPicker ? "rotate(180deg)" : "" }} />
                      </button>

                      <AnimatePresence>
                        {showFontPicker && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden rounded-lg" style={{ border: "1px solid #2a2a2a", background: "#111" }}>
                            {/* Font search */}
                            <input value={fontSearch} onChange={e => setFontSearch(e.target.value)} placeholder="Search fonts..."
                              className="w-full px-3 py-2 text-[11px] focus:outline-none" style={{ background: "transparent", color: "#ccc", borderBottom: "1px solid #222" }} />
                            {/* Font category tabs */}
                            <div className="flex gap-0.5 p-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                              {FONT_CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setFontCategory(cat.id)}
                                  className="px-2 py-0.5 text-[8px] font-semibold rounded flex-shrink-0 transition-all"
                                  style={{
                                    background: fontCategory === cat.id ? ACCENT_DIM : "transparent",
                                    color: fontCategory === cat.id ? ACCENT : "#555",
                                  }}>{cat.label}</button>
                              ))}
                            </div>
                            {/* Font list */}
                            <div className="max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                              {filteredFonts.map(font => (
                                <button key={font.label} onClick={() => { setTextFont(font); setShowFontPicker(false); setFontSearch(""); }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-all flex items-center justify-between"
                                  style={{ borderBottom: "1px solid #1a1a1a" }}>
                                  <span className="text-xs truncate" style={{ color: textFont.label === font.label ? ACCENT : "#ccc", fontFamily: font.family }}>
                                    {font.label}
                                  </span>
                                  <span className="text-[8px] capitalize flex-shrink-0 ml-2" style={{ color: "#444" }}>{font.category}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Font size & weight */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[10px]" style={{ color: "#888" }}>Size</span>
                          <span className="text-[10px] font-mono" style={{ color: "#555" }}>{textFontSize}px</span>
                        </div>
                        <Slider value={[textFontSize]} onValueChange={v => setTextFontSize(v[0])} min={12} max={200} step={1} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[10px]" style={{ color: "#888" }}>Weight</span>
                          <span className="text-[10px] font-mono" style={{ color: "#555" }}>{textFontWeight}</span>
                        </div>
                        <Slider value={[textFontWeight]} onValueChange={v => setTextFontWeight(v[0])} min={300} max={900} step={100} />
                      </div>
                    </div>

                    {/* Color pickers */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium" style={{ color: "#888" }}>Color</span>
                      <div className="flex flex-wrap gap-1">
                        {TEXT_COLORS.map(c => (
                          <button key={c} onClick={() => setTextColor(c)}
                            className="w-5 h-5 rounded-full transition-all"
                            style={{
                              background: c,
                              border: textColor === c ? `2px solid ${ACCENT}` : "2px solid #333",
                              boxShadow: textColor === c ? `0 0 6px ${c}44` : "none",
                            }} />
                        ))}
                        <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                          className="w-5 h-5 rounded-full cursor-pointer" style={{ border: "2px solid #333" }} />
                      </div>
                    </div>

                    {/* Stroke */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[10px]" style={{ color: "#888" }}>Stroke</span>
                        <span className="text-[10px] font-mono" style={{ color: "#555" }}>{textStrokeWidth}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="color" value={textStrokeColor} onChange={e => setTextStrokeColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer flex-shrink-0" style={{ border: "1px solid #333" }} />
                        <Slider value={[textStrokeWidth]} onValueChange={v => setTextStrokeWidth(v[0])} min={0} max={10} step={1} className="flex-1" />
                      </div>
                    </div>

                    {/* Alignment */}
                    <div className="flex gap-1">
                      {([
                        { id: "left", icon: AlignLeft },
                        { id: "center", icon: AlignCenter },
                        { id: "right", icon: AlignRight },
                      ] as const).map(({ id, icon: Icon }) => (
                        <button key={id} onClick={() => setTextAlign(id)}
                          className="flex-1 py-1.5 rounded-md flex items-center justify-center transition-all"
                          style={{
                            background: textAlign === id ? ACCENT_DIM : "#151515",
                            border: textAlign === id ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                            color: textAlign === id ? ACCENT : "#666",
                          }}>
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>

                    {/* Style toggles */}
                    <div className="flex gap-1.5">
                      <button onClick={() => setTextShadow(!textShadow)}
                        className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all"
                        style={{
                          background: textShadow ? ACCENT_DIM : "#151515",
                          border: textShadow ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                          color: textShadow ? ACCENT : "#666",
                        }}>Shadow</button>
                      <button onClick={() => setTextGlow(!textGlow)}
                        className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all"
                        style={{
                          background: textGlow ? ACCENT_DIM : "#151515",
                          border: textGlow ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                          color: textGlow ? ACCENT : "#666",
                        }}>Glow</button>
                    </div>

                    {/* Animation */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium" style={{ color: "#888" }}>Animation</span>
                      <div className="grid grid-cols-4 gap-1">
                        {TEXT_ANIMATIONS.map(anim => (
                          <button key={anim.id} onClick={() => setTextAnimation(anim.id)}
                            className="py-2 rounded-md flex flex-col items-center gap-0.5 transition-all"
                            style={{
                              background: textAnimation === anim.id ? ACCENT_DIM : "#151515",
                              border: textAnimation === anim.id ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                            }}>
                            <span className="text-sm">{anim.icon}</span>
                            <span className="text-[7px]" style={{ color: textAnimation === anim.id ? ACCENT : "#666" }}>{anim.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="rounded-lg p-4 flex items-center justify-center" style={{ background: "#0a0a0a", border: "1px solid #222", minHeight: 60 }}>
                      <span style={{
                        fontFamily: textFont.family,
                        fontSize: Math.min(textFontSize, 36),
                        fontWeight: textFontWeight,
                        color: textColor,
                        WebkitTextStroke: textStrokeWidth > 0 ? `${Math.min(textStrokeWidth, 2)}px ${textStrokeColor}` : undefined,
                        textShadow: textShadow ? "2px 2px 6px rgba(0,0,0,0.7)" : textGlow ? `0 0 12px ${textColor}` : undefined,
                        textAlign: textAlign,
                      }}>
                        {textInput || "Preview"}
                      </span>
                    </div>

                    {/* Add button */}
                    <button onClick={addTextOverlay} disabled={!textInput.trim()}
                      className="w-full h-9 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                      style={{ background: ACCENT, color: "#000" }}>
                      Add Text
                    </button>

                    {/* Existing text overlays */}
                    {textOverlays.length > 0 && (
                      <div className="space-y-1 pt-2" style={{ borderTop: "1px solid #222" }}>
                        <span className="text-[10px] font-medium" style={{ color: "#888" }}>Active Overlays</span>
                        {textOverlays.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 rounded-md px-2.5 py-2 group" style={{ background: "#151515", border: "1px solid #222" }}>
                            <Type className="w-3 h-3 flex-shrink-0" style={{ color: "#555" }} />
                            <span className="text-[10px] truncate flex-1" style={{ color: "#aaa", fontFamily: t.font.family }}>{t.text}</span>
                            <span className="text-[8px] flex-shrink-0" style={{ color: "#444" }}>{t.font.label}</span>
                            <button onClick={() => removeTextOverlay(t.id)} className="hover:opacity-70"><X className="w-3 h-3" style={{ color: "#555" }} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ════════ EFFECTS with Intensity ════════ */}
                {activeToolTab === "effects" && (
                  <>
                    <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {["all", "distort", "color", "style", "light"].map(cat => (
                        <button key={cat} onClick={() => setEffectCategory(cat)}
                          className="px-2.5 py-1 text-[9px] font-semibold rounded-md flex-shrink-0 transition-all capitalize"
                          style={{
                            background: effectCategory === cat ? ACCENT_DIM : "transparent",
                            color: effectCategory === cat ? ACCENT : "#666",
                            border: effectCategory === cat ? `1px solid ${ACCENT_BORDER}` : "1px solid transparent",
                          }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {filteredEffects.map((effect) => {
                        const isActive = activeEffects.includes(effect.id);
                        const intensity = effectIntensities[effect.id] ?? 0.7;
                        const IconComponent = EFFECT_ICONS[effect.id] || Sparkles;
                        return (
                          <div key={effect.id} className="rounded-lg overflow-hidden transition-all"
                            style={{
                              background: isActive ? ACCENT_DIM : "#151515",
                              border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                            }}>
                            <button
                              onClick={() => toggleEffect(effect.id)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 transition-all">
                              <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                                style={{ background: isActive ? `${ACCENT}22` : "#1e1e1e", border: `1px solid ${isActive ? ACCENT_BORDER : "#2a2a2a"}` }}>
                                <IconComponent className="w-3.5 h-3.5" style={{ color: isActive ? ACCENT : "#777" }} />
                              </div>
                              <span className="text-[11px] font-medium flex-1 text-left" style={{ color: isActive ? ACCENT : "#aaa" }}>{effect.label}</span>
                              {isActive && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ACCENT }} />}
                            </button>
                            {isActive && (
                              <div className="px-3 pb-2.5 flex items-center gap-2">
                                <span className="text-[9px] flex-shrink-0 w-12" style={{ color: "#555" }}>Intensity</span>
                                <Slider value={[intensity * 100]} onValueChange={v => setEffectIntensity(effect.id, v[0] / 100)} min={10} max={100} step={5} className="flex-1" />
                                <span className="text-[9px] font-mono w-8 text-right" style={{ color: "#555" }}>{Math.round(intensity * 100)}%</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {activeEffects.length > 0 && (
                      <button onClick={() => setActiveEffects([])}
                        className="w-full py-2 text-[10px] font-medium rounded-lg transition-all hover:bg-red-500/10"
                        style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                        Clear All ({activeEffects.length})
                      </button>
                    )}
                  </>
                )}

                {/* ════════ TRANSITIONS with Duration ════════ */}
                {activeToolTab === "transitions" && (
                  <>
                    <p className="text-[10px]" style={{ color: "#666" }}>Applied at the start and end of your clip.</p>
                    <div className="space-y-1">
                      {TRANSITIONS.map((trans) => {
                        const isActive = activeTransition === trans.id;
                        const IconComponent = TRANSITION_ICONS[trans.id] || Layers;
                        return (
                          <button key={trans.id}
                            onClick={() => setActiveTransition(isActive ? null : trans.id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                            style={{
                              background: isActive ? ACCENT_DIM : "#151515",
                              border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                            }}>
                            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                              style={{ background: isActive ? `${ACCENT}22` : "#1e1e1e", border: `1px solid ${isActive ? ACCENT_BORDER : "#2a2a2a"}` }}>
                              <IconComponent className="w-3.5 h-3.5" style={{ color: isActive ? ACCENT : "#777" }} />
                            </div>
                            <span className="text-[11px] font-medium flex-1 text-left" style={{ color: isActive ? ACCENT : "#aaa" }}>{trans.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ACCENT }} />}
                          </button>
                        );
                      })}
                    </div>
                    {activeTransition && (
                      <div className="space-y-1.5 pt-2" style={{ borderTop: "1px solid #222" }}>
                        <div className="flex justify-between">
                          <span className="text-[10px]" style={{ color: "#888" }}>Duration</span>
                          <span className="text-[10px] font-mono" style={{ color: "#555" }}>{transitionDuration.toFixed(1)}s</span>
                        </div>
                        <Slider value={[transitionDuration * 10]} onValueChange={v => setTransitionDuration(v[0] / 10)} min={1} max={30} step={1} />
                        <button onClick={() => setActiveTransition(null)}
                          className="w-full py-2 text-[10px] font-medium rounded-lg transition-all hover:bg-red-500/10"
                          style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                          Remove Transition
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ════════ FILTERS ════════ */}
                {activeToolTab === "filters" && (
                  <>
                    <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {["all", "basic", "cinema", "mood", "film"].map(cat => (
                        <button key={cat} onClick={() => setFilterCategory(cat)}
                          className="px-2.5 py-1 text-[9px] font-semibold rounded-md flex-shrink-0 transition-all capitalize"
                          style={{
                            background: filterCategory === cat ? ACCENT_DIM : "transparent",
                            color: filterCategory === cat ? ACCENT : "#666",
                            border: filterCategory === cat ? `1px solid ${ACCENT_BORDER}` : "1px solid transparent",
                          }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {filteredFilters.map((preset) => {
                        const isActive = activeFilter.name === preset.name;
                        const bg = FILTER_PREVIEWS[preset.name] || `linear-gradient(135deg, ${preset.color}, ${preset.color})`;
                        return (
                          <button key={preset.name}
                            onClick={() => setActiveFilter(preset)}
                            className="flex flex-col items-center gap-1.5 group">
                            <div className="w-full aspect-[4/3] rounded-lg transition-all relative overflow-hidden"
                              style={{
                                background: bg,
                                border: isActive ? `2px solid ${ACCENT}` : "2px solid #2a2a2a",
                                boxShadow: isActive ? `0 0 12px ${ACCENT}44` : "none",
                              }}>
                              {/* Simulated image bars for depth */}
                              <div className="absolute inset-0 flex flex-col justify-end">
                                <div className="h-[30%] w-full" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.5))" }} />
                              </div>
                              {isActive && (
                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: ACCENT }}>
                                  <Check className="w-2.5 h-2.5 text-black" />
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] font-medium" style={{ color: isActive ? ACCENT : "#999" }}>{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* ════════ AUDIO ════════ */}
                {activeToolTab === "audio" && (
                  <>
                    {audioName ? (
                      <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: "#151515", border: "1px solid #2a2a2a" }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(168,85,247,0.1)" }}>
                          <Music className="w-4 h-4" style={{ color: "#a855f7" }} />
                        </div>
                        <span className="text-xs truncate flex-1" style={{ color: "#ccc" }}>{audioName}</span>
                        <button onClick={() => { setAudioFile(null); setAudioName(""); }} className="text-[10px] font-medium" style={{ color: "#ef4444" }}>Remove</button>
                      </div>
                    ) : (
                      <button onClick={() => audioInputRef.current?.click()}
                        className="w-full py-8 rounded-lg flex flex-col items-center gap-3 transition-all hover:bg-white/3"
                        style={{ border: "1px dashed #333", background: "#151515" }}>
                        <Music className="w-6 h-6" style={{ color: "#555" }} />
                        <span className="text-xs" style={{ color: "#888" }}>Add Music Track</span>
                        <span className="text-[10px]" style={{ color: "#444" }}>MP3, WAV, AAC</span>
                      </button>
                    )}
                  </>
                )}

                {/* ════════ ADJUST ════════ */}
                {activeToolTab === "adjust" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: "#888" }}>Adjustments</span>
                      <button onClick={resetColorGrading} className="text-[9px] font-medium px-2 py-0.5 rounded" style={{ color: ACCENT, background: ACCENT_DIM }}>Reset All</button>
                    </div>

                    {ADJUST_SECTIONS.map(section => (
                      <div key={section.id}>
                        {/* Section Header — collapsible */}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between py-1.5"
                          style={{ borderBottom: "1px solid #1e1e1e" }}>
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-sm flex items-center justify-center"
                              style={{
                                background: section.params.some(p => adjustments[p.key] !== DEFAULT_ADJUSTMENTS[p.key]) ? ACCENT : "#333",
                              }}>
                              {section.params.some(p => adjustments[p.key] !== DEFAULT_ADJUSTMENTS[p.key]) && (
                                <Check className="w-2.5 h-2.5 text-black" />
                              )}
                            </div>
                            <span className="text-[10px] font-semibold" style={{ color: "#ccc" }}>{section.label}</span>
                          </div>
                          <ChevronDown className="w-3 h-3 transition-transform" style={{
                            color: "#555",
                            transform: openSections[section.id] ? "rotate(0deg)" : "rotate(-90deg)",
                          }} />
                        </button>

                        {/* Section Content */}
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
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded min-w-[32px] text-center"
                                        style={{
                                          color: isModified ? "#ccc" : "#555",
                                          background: "#1a1a1a",
                                          border: "1px solid #2a2a2a",
                                        }}>
                                        {value}
                                      </span>
                                      {isModified && (
                                        <button onClick={() => updateAdjustment(param.key, DEFAULT_ADJUSTMENTS[param.key])}
                                          className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/5">
                                          <RotateCcw className="w-2.5 h-2.5" style={{ color: "#555" }} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {/* Slider with optional gradient track */}
                                  <div className="relative">
                                    {param.gradient && (
                                      <div className="absolute inset-0 h-[6px] top-[9px] rounded-full opacity-40 pointer-events-none"
                                        style={{ background: param.gradient }} />
                                    )}
                                    <Slider
                                      value={[value]}
                                      onValueChange={(v) => updateAdjustment(param.key, v[0])}
                                      min={param.min} max={param.max} step={1}
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Save as preset button */}
                    {hasAdjustments(adjustments) && (
                      <button
                        onClick={() => toast.success("Preset saved!")}
                        className="w-full mt-2 py-2 rounded-lg text-[10px] font-semibold transition-all"
                        style={{ background: "rgba(20,184,166,0.15)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.25)" }}>
                        Save as preset
                      </button>
                    )}
                  </>
                )}

                {/* ════════ EXPORT ════════ */}
                {activeToolTab === "export" && (
                  <>
                    <div className="space-y-1.5">
                      {EXPORT_QUALITIES.map((q) => (
                        <button key={q.id}
                          onClick={() => setExportQuality(q.id)}
                          className="w-full text-left px-3 py-3 rounded-lg transition-all"
                          style={{
                            background: exportQuality === q.id ? ACCENT_DIM : "#151515",
                            border: exportQuality === q.id ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                          }}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold" style={{ color: exportQuality === q.id ? ACCENT : "#ccc" }}>{q.label}</span>
                            <span className="text-[9px]" style={{ color: "#555" }}>{q.fps}fps</span>
                          </div>
                          <p className="text-[9px] mt-0.5" style={{ color: "#444" }}>
                            {Math.round(q.resolution * 100)}% • {(q.bitrate / 1_000_000).toFixed(0)}Mbps
                          </p>
                        </button>
                      ))}
                    </div>
                    <div className="pt-3 space-y-2" style={{ borderTop: "1px solid #222" }}>
                      <span className="text-[10px] font-medium" style={{ color: "#666" }}>Speed</span>
                      <div className="flex flex-wrap gap-1">
                        {SPEED_OPTIONS.map((s) => (
                          <button key={s} onClick={() => setSpeed(s)}
                            className="px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all"
                            style={{
                              background: speed === s ? ACCENT_DIM : "#151515",
                              color: speed === s ? ACCENT : "#666",
                              border: speed === s ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                            }}>
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ════════ UPSCALE ════════ */}
                {activeToolTab === "upscale" && (
                  <>
                    {!upscaleFile ? (
                      <button onClick={() => upscaleInputRef.current?.click()}
                        className="w-full py-8 rounded-lg flex flex-col items-center gap-3 transition-all hover:bg-white/5"
                        style={{ border: "1px dashed #333", background: "#151515" }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: ACCENT_DIM }}>
                          <ArrowUpCircle className="w-5 h-5" style={{ color: ACCENT }} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium" style={{ color: ACCENT }}>Upload Video to Upscale</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>MP4, MOV, WEBM • Max 2GB</p>
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "#151515", border: "1px solid #2a2a2a" }}>
                          <Film className="w-4 h-4 flex-shrink-0" style={{ color: "#666" }} />
                          <span className="text-[10px] truncate flex-1" style={{ color: "#ccc" }}>{upscaleFile.name}</span>
                          <button onClick={clearUpscale} className="hover:opacity-70"><X className="w-3 h-3" style={{ color: "#555" }} /></button>
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
                                  <span className="block text-[8px] font-normal mt-0.5" style={{ color: "#555" }}>
                                    {m === "2x" ? "HD → Full HD" : "HD → 4K"}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <button onClick={startUpscale}
                              className="w-full h-9 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: ACCENT, color: "#000" }}>
                              <ArrowUpCircle className="w-3.5 h-3.5 inline mr-1.5" />
                              Upscale {upscaleMode}
                            </button>
                          </>
                        )}
                        {upscaleState === "processing" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: ACCENT }} />
                              <span className="text-[10px]" style={{ color: "#ccc" }}>Upscaling {upscaleMode}...</span>
                              <span className="text-[10px] font-mono ml-auto" style={{ color: "#666" }}>{upscaleProgress}%</span>
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
                              className="w-full h-9 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: ACCENT, color: "#000" }}>
                              <Download className="w-3.5 h-3.5 inline mr-1.5" /> Download
                            </button>
                            <button onClick={clearUpscale}
                              className="w-full py-2 text-[10px] rounded-lg transition-all hover:bg-white/5"
                              style={{ color: "#888", border: "1px solid #2a2a2a" }}>
                              Upscale Another
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <input ref={upscaleInputRef} type="file" accept="video/*" onChange={handleUpscaleFile} className="hidden" />
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── CENTER: Player ─── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "#0a0a0a" }}>
          <div className="h-8 flex items-center px-3 flex-shrink-0" style={{ background: "#141414", borderBottom: "1px solid #1e1e1e" }}>
            <span className="text-[11px] font-medium" style={{ color: "#888" }}>Player</span>
            {activeFilter.name !== "none" && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-medium" style={{ background: ACCENT_DIM, color: ACCENT }}>{activeFilter.label}</span>
            )}
            {activeTransition && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-medium" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}>
                {TRANSITIONS.find(t => t.id === activeTransition)?.label}
              </span>
            )}
          </div>

          <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0" style={{ background: "#0a0a0a" }}>
            {videoUrl ? (
              <>
                <video ref={videoRef} src={videoUrl} className="hidden" playsInline preload="auto" />
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain"
                  style={{ cursor: canvasDrag.isDragging() ? "grabbing" : "default" }}
                  onMouseDown={canvasDrag.onMouseDown}
                  onMouseMove={canvasDrag.onMouseMove}
                  onMouseUp={canvasDrag.onMouseUp}
                  onMouseLeave={canvasDrag.onMouseUp}
                />

                <AnimatePresence>
                  {!playing && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>
                {playing && <button onClick={togglePlay} className="absolute inset-0" />}

                {activeEffects.length > 0 && (
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {activeEffects.map(eff => (
                      <span key={eff} className="px-2 py-0.5 rounded text-[8px] font-medium"
                        style={{ background: "rgba(0,0,0,0.6)", color: ACCENT, border: `1px solid ${ACCENT_BORDER}` }}>
                        {EFFECTS.find(e => e.id === eff)?.label} {Math.round((effectIntensities[eff] ?? 0.7) * 100)}%
                      </span>
                    ))}
                  </div>
                )}

                {state === "processing" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: "rgba(0,0,0,0.85)" }}>
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
                    <p className="text-sm font-medium" style={{ color: "#ccc" }}>Exporting {progress}%</p>
                    <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: ACCENT }} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="text-center space-y-4 group cursor-pointer p-10">
                <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center transition-all"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                  <Play className="w-7 h-7" style={{ color: "#444" }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#666" }}>Import media to preview</p>
                </div>
              </button>
            )}

            {/* Shortcuts overlay */}
            <AnimatePresence>
              {showShortcuts && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center p-8" style={{ background: "rgba(0,0,0,0.9)" }}>
                  <div className="max-w-lg w-full rounded-xl p-6" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-sm font-semibold" style={{ color: "#e0e0e0" }}>Keyboard Shortcuts</span>
                      <button onClick={() => setShowShortcuts(false)} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4" style={{ color: "#666" }} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                      {[
                        ["Space", "Play / Pause"], ["← →", "Seek ±1s"], ["Shift+← →", "Seek ±5s"],
                        ["J / K / L", "Back / Play / Fwd"], ["I", "Set In Point"], ["O", "Set Out Point"],
                        ["⌘Z", "Undo"], ["⌘⇧Z", "Redo"], ["M", "Toggle Mute"],
                        ["[ ]", "Speed ↓ / ↑"], ["⌘S", "Export"], ["?", "Shortcuts"],
                      ].map(([key, desc]) => (
                        <div key={key} className="flex items-center gap-3">
                          <kbd className="px-2 py-0.5 rounded font-mono text-[10px] min-w-[44px] text-center" style={{ background: "#222", border: "1px solid #333", color: ACCENT }}>{key}</kbd>
                          <span style={{ color: "#888" }}>{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Player controls */}
          <div className="h-10 flex items-center px-3 gap-3 flex-shrink-0" style={{ background: "#141414", borderTop: "1px solid #1e1e1e" }}>
            <span className="text-[10px] font-mono w-20" style={{ color: "#888" }}>{formatTimecode(currentTime, true)}</span>
            <span style={{ color: "#333" }}>/</span>
            <span className="text-[10px] font-mono w-20" style={{ color: "#555" }}>{formatTimecode(duration, true)}</span>
            <div className="flex-1" />
            <button onClick={() => seekTo(trimStart)} className="p-1 rounded hover:bg-white/5"><SkipBack className="w-4 h-4" style={{ color: "#666" }} /></button>
            <button onClick={togglePlay} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/5" style={{ border: "1px solid #333" }}>
              {playing ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
            </button>
            <button onClick={() => seekTo(trimEnd)} className="p-1 rounded hover:bg-white/5"><SkipForward className="w-4 h-4" style={{ color: "#666" }} /></button>
            <div className="flex-1" />
            <button onClick={() => setMuted(!muted)} className="p-1 rounded hover:bg-white/5">
              {muted ? <VolumeX className="w-4 h-4" style={{ color: "#666" }} /> : <Volume2 className="w-4 h-4" style={{ color: "#666" }} />}
            </button>
            <button onClick={() => setSpeed(SPEED_OPTIONS[(SPEED_OPTIONS.indexOf(speed) + 1) % SPEED_OPTIONS.length])}
              className="px-2 py-0.5 text-[10px] font-semibold rounded transition-all hover:bg-white/5" style={{ color: "#888" }}>
              {speed}x
            </button>
            <button onClick={() => setShowShortcuts(prev => !prev)} className="p-1 rounded hover:bg-white/5">
              <Keyboard className="w-4 h-4" style={{ color: "#666" }} />
            </button>
          </div>
        </div>

        {/* ─── RIGHT PANEL — Details ─── */}
        <div className="w-[260px] flex-shrink-0 flex flex-col" style={{ background: "#131316", borderLeft: "1px solid #1e1e24" }}>
          <div className="h-8 flex items-center px-3" style={{ borderBottom: "1px solid #1e1e24" }}>
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Details</span>
          </div>
          <div className="flex-1 p-3 space-y-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
            {activeMedia ? (
              <div className="space-y-0">
                {[
                  ["Name", activeMedia.name],
                  ["Duration", formatTimecode(activeMedia.duration)],
                  ["Type", activeMedia.type.toUpperCase()],
                  ["Trim", `${formatTimecode(trimStart)} — ${formatTimecode(trimEnd)}`],
                  ["Speed", `${speed}x`],
                  ["Crop", cropPreset === "free" ? "None" : cropPreset],
                  ["Rotation", rotation !== 0 ? `${rotation}°` : "None"],
                  ["Flip", flipH || flipV ? [flipH && "H", flipV && "V"].filter(Boolean).join("+") : "None"],
                  ["Filter", activeFilter.label],
                  ["Effects", activeEffects.length > 0 ? `${activeEffects.length} active` : "None"],
                  ["Transition", activeTransition ? TRANSITIONS.find(t => t.id === activeTransition)?.label ?? "None" : "None"],
                  ["Text Layers", textOverlays.length > 0 ? `${textOverlays.length}` : "None"],
                  ["Segments", segments.length > 0 ? `${segments.length} clips` : "1 clip"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid #1a1a1e" }}>
                    <span className="text-[10px] font-medium" style={{ color: "#555" }}>{label}</span>
                    <span className="text-[10px] font-semibold text-right max-w-[140px] truncate" style={{ color: "#c0c0c8" }}>{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-center pt-8" style={{ color: "#444" }}>No media selected</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TIMELINE ═══ */}
      <div className="flex-shrink-0 flex flex-col" style={{ height: 170, background: "#141414", borderTop: "1px solid #2a2a2a" }}>
        <div className="h-7 flex items-center px-3 gap-1.5 flex-shrink-0" style={{ borderBottom: "1px solid #1e1e1e" }}>
          <button onClick={splitAtPlayhead} className="p-1 rounded hover:bg-white/5"><Scissors className="w-3.5 h-3.5" style={{ color: "#666" }} /></button>
          <button className="p-1 rounded hover:bg-white/5"><Trash2 className="w-3.5 h-3.5" style={{ color: "#666" }} /></button>
          <button className="p-1 rounded hover:bg-white/5"><Copy className="w-3.5 h-3.5" style={{ color: "#666" }} /></button>
          <div className="w-px h-3.5 mx-1" style={{ background: "#2a2a2a" }} />
          <button onClick={() => setMuted(!muted)} className="p-1 rounded hover:bg-white/5">
            <Volume2 className="w-3.5 h-3.5" style={{ color: "#666" }} />
          </button>
          <div className="flex-1" />
          <span className="text-[9px] font-mono" style={{ color: "#555" }}>
            {formatTimecode(trimStart)} — {formatTimecode(trimEnd)}
          </span>
          <div className="w-px h-3.5 mx-1" style={{ background: "#2a2a2a" }} />
          <div className="flex items-center gap-0.5">
            <button onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))} className="p-0.5 rounded hover:bg-white/5">
              <ZoomOut className="w-3 h-3" style={{ color: "#666" }} />
            </button>
            <div className="w-16 h-1 rounded-full mx-1 relative" style={{ background: "#2a2a2a" }}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${((timelineZoom - 0.5) / 3.5) * 100}%`, background: "#555" }} />
            </div>
            <button onClick={() => setTimelineZoom(Math.min(4, timelineZoom + 0.25))} className="p-0.5 rounded hover:bg-white/5">
              <ZoomIn className="w-3 h-3" style={{ color: "#666" }} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Track labels */}
          <div className="w-[70px] flex-shrink-0" style={{ borderRight: "1px solid #1e1e1e" }}>
            {tracks.map((track) => (
              <div key={track.id} className="h-[33px] flex items-center px-2 gap-1" style={{ borderBottom: "1px solid #1a1a1a" }}>
                <button className="p-0.5">
                  {track.visible ? <Eye className="w-2.5 h-2.5" style={{ color: "#555" }} /> : <EyeOff className="w-2.5 h-2.5" style={{ color: "#333" }} />}
                </button>
                <span className="text-[8px] font-medium truncate" style={{ color: "#666" }}>{track.name}</span>
              </div>
            ))}
          </div>

          {/* Tracks area */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden relative" style={{ scrollbarWidth: "none" }}>
            {/* Time ruler — draggable playhead */}
            <div
              className="h-4 flex items-end sticky top-0 z-10 cursor-crosshair"
              style={{ borderBottom: "1px solid #1e1e1e", background: "#141414" }}
              onMouseDown={timelineDrag.startPlayheadDrag}
            >
              {duration > 0 && Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 relative" style={{ width: `${60 * timelineZoom}px` }}>
                  <div className="absolute bottom-0 left-0 w-px h-2" style={{ background: "#2a2a2a" }} />
                  <span className="absolute bottom-0.5 left-1 text-[6px] font-mono" style={{ color: "#444" }}>
                    {Math.floor(i / 60)}:{(i % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>

            {/* Video track */}
            <div ref={timelineRef} onMouseDown={timelineDrag.startPlayheadDrag} className="h-[33px] relative cursor-pointer" style={{ borderBottom: "1px solid #1a1a1a" }}>
              {activeMedia && duration > 0 && segments.length === 0 && (
                <div className="absolute top-1 bottom-1 rounded overflow-hidden flex"
                  style={{
                    left: `${trimStart * 60 * timelineZoom}px`,
                    width: `${(trimEnd - trimStart) * 60 * timelineZoom}px`,
                    background: ACCENT_DIM,
                    border: `1px solid ${ACCENT_BORDER}`,
                  }}>
                  {thumbnails.map((thumb, i) => (
                    <div key={i} className="flex-1 h-full overflow-hidden opacity-60">
                      <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </div>
                  ))}
                  {/* Draggable trim handles */}
                  <div
                    className="absolute inset-y-0 left-0 w-2 cursor-col-resize rounded-l transition-all hover:w-3 z-10 flex items-center justify-center"
                    style={{ background: ACCENT }}
                    onMouseDown={(e) => { saveUndoSnapshot(); timelineDrag.startTrimDrag("trim-start", e); }}
                  >
                    <GripVertical className="w-2 h-2 text-black/50" />
                  </div>
                  <div
                    className="absolute inset-y-0 right-0 w-2 cursor-col-resize rounded-r transition-all hover:w-3 z-10 flex items-center justify-center"
                    style={{ background: ACCENT }}
                    onMouseDown={(e) => { saveUndoSnapshot(); timelineDrag.startTrimDrag("trim-end", e); }}
                  >
                    <GripVertical className="w-2 h-2 text-black/50" />
                  </div>
                </div>
              )}

              {/* Render segments after split */}
              {activeMedia && duration > 0 && segments.length > 0 && segments.map((seg, idx) => (
                <div key={seg.id}
                  className="absolute top-1 bottom-1 rounded overflow-hidden flex group"
                  style={{
                    left: `${seg.sourceStart * 60 * timelineZoom}px`,
                    width: `${(seg.sourceEnd - seg.sourceStart) * 60 * timelineZoom}px`,
                    background: ACCENT_DIM,
                    border: `1px solid ${ACCENT_BORDER}`,
                    marginLeft: idx > 0 ? "1px" : "0",
                  }}>
                  <div className="flex-1 h-full overflow-hidden opacity-50" style={{ background: `hsl(${240 + idx * 30}, 60%, 25%)` }} />
                  {/* Segment label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[7px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {formatTimecode(seg.sourceStart)} – {formatTimecode(seg.sourceEnd)}
                    </span>
                  </div>
                  {/* Delete segment button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSegment(seg.id); }}
                    className="absolute top-0 right-0 w-4 h-4 rounded-bl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    style={{ background: "rgba(239,68,68,0.8)" }}
                  >
                    <X className="w-2 h-2 text-white" />
                  </button>
                </div>
              ))}

              {!activeMedia && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px]" style={{ color: "#333" }}>Drag material here and start to create</span>
                </div>
              )}
            </div>

            {/* Audio track */}
            <div className="h-[33px] relative" style={{ borderBottom: "1px solid #1a1a1a" }}>
              {audioName && duration > 0 && (
                <div className="absolute top-1 bottom-1 left-0 rounded flex items-center px-2 gap-1"
                  style={{ width: `${duration * 60 * timelineZoom}px`, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                  <Music className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(168,85,247,0.5)" }} />
                  <span className="text-[7px] truncate" style={{ color: "rgba(168,85,247,0.5)" }}>{audioName}</span>
                </div>
              )}
            </div>

            {/* Text track */}
            <div className="h-[33px] relative" style={{ borderBottom: "1px solid #1a1a1a" }}>
              {textOverlays.map((t) => (
                <div key={t.id} className="absolute top-1 bottom-1 rounded flex items-center px-2"
                  style={{
                    left: `${t.startTime * 60 * timelineZoom}px`,
                    width: `${Math.max(60, (t.endTime - t.startTime) * 60 * timelineZoom)}px`,
                    background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                  }}>
                  <Type className="w-3 h-3 mr-1 flex-shrink-0" style={{ color: "rgba(34,197,94,0.5)" }} />
                  <span className="text-[7px] truncate" style={{ color: "rgba(34,197,94,0.5)" }}>{t.text}</span>
                </div>
              ))}
            </div>

            {/* Effects track */}
            <div className="h-[33px] relative" style={{ borderBottom: "1px solid #1a1a1a" }}>
              {activeEffects.length > 0 && duration > 0 && (
                <div className="absolute top-1 bottom-1 left-0 rounded flex items-center px-2 gap-1"
                  style={{ width: `${duration * 60 * timelineZoom}px`, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                  <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(251,191,36,0.4)" }} />
                  <span className="text-[7px] truncate" style={{ color: "rgba(251,191,36,0.4)" }}>{activeEffects.map(e => EFFECTS.find(ef => ef.id === e)?.label).join(", ")}</span>
                </div>
              )}
            </div>

            {/* Playhead — draggable */}
            {duration > 0 && (
              <div className="absolute top-0 bottom-0 w-0.5 z-20"
                style={{ left: `${currentTime * 60 * timelineZoom}px`, background: "white", cursor: "col-resize" }}>
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3 h-3 z-30 cursor-col-resize"
                  style={{ background: "white", clipPath: "polygon(0 0, 100% 0, 50% 70%)", boxShadow: "0 0 6px rgba(255,255,255,0.5)" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="video/*,image/*,audio/*" multiple onChange={handleFileSelect} className="hidden" />
      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
    </div>
  );
}
