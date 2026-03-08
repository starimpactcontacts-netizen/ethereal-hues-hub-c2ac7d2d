/**
 * Shared types for Loopgate Studio NLE
 */
import type { StudioFont } from "@/lib/studioFonts";

export type TextOverlay = {
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

export type MediaItem = {
  id: string;
  file: File;
  url: string;
  thumbnail: string;
  duration: number;
  name: string;
  type: "video" | "audio" | "image";
};

export type ClipSegment = {
  id: string;
  mediaId: string;
  sourceStart: number;
  sourceEnd: number;
  trackPosition: number;
  duration: number;
};

export type TimelineTrack = {
  id: string;
  name: string;
  type: "video" | "audio" | "text" | "effect";
  visible: boolean;
  locked: boolean;
};

export type ToolTab = "media" | "audio" | "text" | "effects" | "transitions" | "filters" | "adjust" | "export" | "upscale";
export type EffectIntensity = Record<string, number>;

export type EditorSnapshot = {
  textOverlays: TextOverlay[];
  trimStart: number;
  trimEnd: number;
  activeFilter: string;
  activeEffects: string[];
  effectIntensities: EffectIntensity;
  adjustments: Record<string, number>;
  speed: number;
  segments: ClipSegment[];
};
