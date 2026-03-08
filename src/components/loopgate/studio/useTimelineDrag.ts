/**
 * Timeline playhead & trim handle dragging for Loopgate Studio
 */
import { useRef, useCallback, useState } from "react";

type DragTarget = "playhead" | "trim-start" | "trim-end" | null;

interface UseTimelineDragOptions {
  timelineRef: React.RefObject<HTMLDivElement>;
  duration: number;
  onSeek: (time: number) => void;
  onTrimStartChange: (time: number) => void;
  onTrimEndChange: (time: number) => void;
  trimStart: number;
  trimEnd: number;
}

export function useTimelineDrag({
  timelineRef,
  duration,
  onSeek,
  onTrimStartChange,
  onTrimEndChange,
  trimStart,
  trimEnd,
}: UseTimelineDragOptions) {
  const dragTarget = useRef<DragTarget>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getTimeFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!timelineRef.current || !duration) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return pct * duration;
  }, [timelineRef, duration]);

  const startPlayheadDrag = useCallback((e: React.MouseEvent) => {
    dragTarget.current = "playhead";
    setIsDragging(true);
    const time = getTimeFromEvent(e);
    onSeek(time);

    const onMove = (ev: MouseEvent) => {
      if (dragTarget.current !== "playhead") return;
      const t = getTimeFromEvent(ev);
      onSeek(t);
    };
    const onUp = () => {
      dragTarget.current = null;
      setIsDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [getTimeFromEvent, onSeek]);

  const startTrimDrag = useCallback((handle: "trim-start" | "trim-end", e: React.MouseEvent) => {
    e.stopPropagation();
    dragTarget.current = handle;
    setIsDragging(true);

    const onMove = (ev: MouseEvent) => {
      const t = getTimeFromEvent(ev);
      if (dragTarget.current === "trim-start") {
        onTrimStartChange(Math.max(0, Math.min(t, trimEnd - 0.1)));
      } else if (dragTarget.current === "trim-end") {
        onTrimEndChange(Math.max(trimStart + 0.1, Math.min(t, duration)));
      }
    };
    const onUp = () => {
      dragTarget.current = null;
      setIsDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [getTimeFromEvent, onTrimStartChange, onTrimEndChange, trimStart, trimEnd, duration]);

  return {
    startPlayheadDrag,
    startTrimDrag,
    isDragging,
  };
}
