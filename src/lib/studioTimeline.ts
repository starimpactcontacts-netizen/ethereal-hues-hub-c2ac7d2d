/**
 * Loopgate Studio — Magnetic Timeline Engine
 * Professional-grade timeline with snap points, ripple editing, and markers
 */

// ─── Types ───
export type TimelineClip = {
  id: string;
  mediaId: string;
  trackId: string;
  start: number;    // Position on timeline (seconds)
  end: number;      // End position on timeline
  sourceStart: number;  // Source media start
  sourceEnd: number;    // Source media end
  locked?: boolean;
};

export type TimelineMarker = {
  id: string;
  time: number;
  label: string;
  color: string;
  type: 'beat' | 'scene' | 'custom';
};

export type SnapPoint = {
  time: number;
  type: 'clip' | 'marker' | 'playhead' | 'beat';
  strength: number; // 0-1, higher = stronger magnet
};

// ─── Config ───
export const SNAP_THRESHOLD = 0.1; // seconds - range to snap
export const SNAP_THRESHOLD_PX = 10; // pixels for UI

// ─── Marker Presets ───
export const MARKER_COLORS = [
  { id: 'red', color: '#EF4444', label: 'Red' },
  { id: 'orange', color: '#F97316', label: 'Orange' },
  { id: 'yellow', color: '#EAB308', label: 'Yellow' },
  { id: 'green', color: '#22C55E', label: 'Green' },
  { id: 'blue', color: '#3B82F6', label: 'Blue' },
  { id: 'purple', color: '#A855F7', label: 'Purple' },
  { id: 'pink', color: '#EC4899', label: 'Pink' },
  { id: 'white', color: '#FFFFFF', label: 'White' },
];

// ─── Core Functions ───

/**
 * Find the closest snap point to a given time
 */
export function findSnapPoint(
  time: number,
  snapPoints: SnapPoint[],
  threshold = SNAP_THRESHOLD
): { snappedTime: number; snapType: SnapPoint['type'] | null } {
  let closestSnap: SnapPoint | null = null;
  let closestDistance = Infinity;

  for (const point of snapPoints) {
    const distance = Math.abs(time - point.time);
    const adjustedThreshold = threshold * (1 + point.strength * 0.5);
    
    if (distance < adjustedThreshold && distance < closestDistance) {
      closestDistance = distance;
      closestSnap = point;
    }
  }

  return {
    snappedTime: closestSnap ? closestSnap.time : time,
    snapType: closestSnap ? closestSnap.type : null,
  };
}

/**
 * Generate snap points from clips, markers, and playhead
 */
export function generateSnapPoints(
  clips: TimelineClip[],
  markers: TimelineMarker[],
  playheadTime: number,
  beatGrid?: number[] // Optional beat times
): SnapPoint[] {
  const points: SnapPoint[] = [];

  // Clip edges
  for (const clip of clips) {
    points.push({ time: clip.start, type: 'clip', strength: 0.8 });
    points.push({ time: clip.end, type: 'clip', strength: 0.8 });
  }

  // Markers
  for (const marker of markers) {
    points.push({ time: marker.time, type: 'marker', strength: 1.0 });
  }

  // Playhead
  points.push({ time: playheadTime, type: 'playhead', strength: 0.6 });

  // Beat grid (if provided)
  if (beatGrid) {
    for (const beat of beatGrid) {
      points.push({ time: beat, type: 'beat', strength: 0.4 });
    }
  }

  return points;
}

/**
 * Ripple edit — shift all clips after a point
 */
export function rippleEdit(
  clips: TimelineClip[],
  afterTime: number,
  deltaTime: number,
  trackId?: string
): TimelineClip[] {
  return clips.map((clip) => {
    // Only affect specified track if provided
    if (trackId && clip.trackId !== trackId) return clip;
    if (clip.locked) return clip;
    
    // Shift clips that start at or after the edit point
    if (clip.start >= afterTime) {
      return {
        ...clip,
        start: Math.max(0, clip.start + deltaTime),
        end: Math.max(0, clip.end + deltaTime),
      };
    }
    return clip;
  });
}

/**
 * Insert clip with ripple — push existing clips right
 */
export function insertClipWithRipple(
  clips: TimelineClip[],
  newClip: TimelineClip
): TimelineClip[] {
  const clipDuration = newClip.end - newClip.start;
  const shiftedClips = rippleEdit(clips, newClip.start, clipDuration, newClip.trackId);
  return [...shiftedClips, newClip];
}

/**
 * Delete clip with ripple — pull clips left
 */
export function deleteClipWithRipple(
  clips: TimelineClip[],
  clipToDelete: TimelineClip
): TimelineClip[] {
  const clipDuration = clipToDelete.end - clipToDelete.start;
  const remaining = clips.filter((c) => c.id !== clipToDelete.id);
  return rippleEdit(remaining, clipToDelete.end, -clipDuration, clipToDelete.trackId);
}

/**
 * Detect clip collisions on the same track
 */
export function detectCollisions(
  clip: TimelineClip,
  otherClips: TimelineClip[]
): TimelineClip[] {
  return otherClips.filter((other) => {
    if (other.id === clip.id) return false;
    if (other.trackId !== clip.trackId) return false;
    
    // Check overlap
    return !(clip.end <= other.start || clip.start >= other.end);
  });
}

/**
 * Auto-arrange clips with magnetic spacing
 */
export function autoArrangeClips(
  clips: TimelineClip[],
  trackId: string,
  gap = 0
): TimelineClip[] {
  const trackClips = clips
    .filter((c) => c.trackId === trackId && !c.locked)
    .sort((a, b) => a.start - b.start);
  
  const otherClips = clips.filter((c) => c.trackId !== trackId || c.locked);
  
  let currentTime = 0;
  const arranged = trackClips.map((clip) => {
    const duration = clip.end - clip.start;
    const newClip = {
      ...clip,
      start: currentTime,
      end: currentTime + duration,
    };
    currentTime += duration + gap;
    return newClip;
  });

  return [...otherClips, ...arranged];
}

/**
 * Split clip at time
 */
export function splitClipAtTime(
  clip: TimelineClip,
  time: number
): [TimelineClip, TimelineClip] | null {
  // Can't split outside clip bounds
  if (time <= clip.start || time >= clip.end) return null;

  const relativeTime = time - clip.start;
  const sourceTime = clip.sourceStart + relativeTime;

  const leftClip: TimelineClip = {
    ...clip,
    id: `${clip.id}-L`,
    end: time,
    sourceEnd: sourceTime,
  };

  const rightClip: TimelineClip = {
    ...clip,
    id: `${clip.id}-R`,
    start: time,
    sourceStart: sourceTime,
  };

  return [leftClip, rightClip];
}

/**
 * Time-to-pixel and pixel-to-time conversions
 */
export function timeToPixel(time: number, zoom: number, offset = 0): number {
  return (time * zoom * 100) - offset;
}

export function pixelToTime(pixel: number, zoom: number, offset = 0): number {
  return (pixel + offset) / (zoom * 100);
}
