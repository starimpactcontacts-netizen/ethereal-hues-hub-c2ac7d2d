/**
 * Canvas text overlay dragging for Loopgate Studio
 * Allows users to drag text overlays directly on the video canvas.
 */
import { useRef, useCallback } from "react";
import type { TextOverlay } from "./types";

interface UseCanvasDragOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  textOverlays: TextOverlay[];
  currentTime: number;
  onUpdateOverlay: (id: string, updates: Partial<TextOverlay>) => void;
}

export function useCanvasDrag({ canvasRef, textOverlays, currentTime, onUpdateOverlay }: UseCanvasDragOptions) {
  const draggingId = useRef<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: ((e.clientX - rect.left) * scaleX) / canvas.width,
      y: ((e.clientY - rect.top) * scaleY) / canvas.height,
    };
  }, [canvasRef]);

  const findOverlayAt = useCallback((nx: number, ny: number): TextOverlay | null => {
    // Find visible overlays at current time, check if click is near their position
    const visible = textOverlays.filter(t => currentTime >= t.startTime && currentTime <= t.endTime);
    // Check in reverse order (top-most first)
    for (let i = visible.length - 1; i >= 0; i--) {
      const t = visible[i];
      const dx = Math.abs(nx - t.x);
      const dy = Math.abs(ny - t.y);
      // Hit area ~10% of canvas
      if (dx < 0.15 && dy < 0.08) return t;
    }
    return null;
  }, [textOverlays, currentTime]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    const overlay = findOverlayAt(coords.x, coords.y);
    if (overlay) {
      e.preventDefault();
      e.stopPropagation();
      draggingId.current = overlay.id;
      dragOffset.current = { x: coords.x - overlay.x, y: coords.y - overlay.y };
    }
  }, [getCanvasCoords, findOverlayAt]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingId.current) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    e.preventDefault();
    const newX = Math.max(0.05, Math.min(0.95, coords.x - dragOffset.current.x));
    const newY = Math.max(0.05, Math.min(0.95, coords.y - dragOffset.current.y));
    onUpdateOverlay(draggingId.current, { x: newX, y: newY });
  }, [getCanvasCoords, onUpdateOverlay]);

  const onMouseUp = useCallback(() => {
    draggingId.current = null;
  }, []);

  const isDragging = useCallback(() => draggingId.current !== null, []);

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    isDragging,
  };
}
