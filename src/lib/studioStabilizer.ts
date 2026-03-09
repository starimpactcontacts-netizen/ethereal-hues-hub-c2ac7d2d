/**
 * Loopgate Studio — Video Stabilization Engine
 * Optical-flow-free stabilization using canvas motion estimation
 */

export type StabilizerConfig = {
  smoothing: number;  // 0-1 (higher = smoother but more crop)
  cropAmount: number; // 0-0.3 (how much to crop for stabilization room)
  enabled: boolean;
};

export const DEFAULT_STABILIZER: StabilizerConfig = {
  smoothing: 0.5,
  cropAmount: 0.1,
  enabled: false,
};

type MotionVector = { dx: number; dy: number };

/**
 * Estimate motion between two frames by comparing block averages
 * (Lightweight approach for browser without WebAssembly/WASM optical flow)
 */
export function estimateMotion(
  prevData: ImageData,
  currData: ImageData,
  blockSize = 32
): MotionVector {
  const w = prevData.width;
  const h = prevData.height;
  const searchRange = 8;
  let bestDx = 0, bestDy = 0, bestSAD = Infinity;

  // Sample center region only for speed
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  const regionW = Math.min(w, blockSize * 4);
  const regionH = Math.min(h, blockSize * 4);
  const startX = cx - regionW / 2;
  const startY = cy - regionH / 2;

  for (let dy = -searchRange; dy <= searchRange; dy += 2) {
    for (let dx = -searchRange; dx <= searchRange; dx += 2) {
      let sad = 0;
      let count = 0;

      for (let by = startY; by < startY + regionH; by += blockSize) {
        for (let bx = startX; bx < startX + regionW; bx += blockSize) {
          const sx = bx + dx;
          const sy = by + dy;
          if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;

          const prevIdx = (by * w + bx) * 4;
          const currIdx = (sy * w + sx) * 4;

          // Compare luma
          const prevLuma = prevData.data[prevIdx] * 0.299 + prevData.data[prevIdx + 1] * 0.587 + prevData.data[prevIdx + 2] * 0.114;
          const currLuma = currData.data[currIdx] * 0.299 + currData.data[currIdx + 1] * 0.587 + currData.data[currIdx + 2] * 0.114;

          sad += Math.abs(prevLuma - currLuma);
          count++;
        }
      }

      if (count > 0) {
        sad /= count;
        if (sad < bestSAD) {
          bestSAD = sad;
          bestDx = dx;
          bestDy = dy;
        }
      }
    }
  }

  return { dx: bestDx, dy: bestDy };
}

/**
 * Smooth motion vectors using exponential moving average
 */
export class MotionSmoother {
  private smoothX = 0;
  private smoothY = 0;
  private smoothing: number;

  constructor(smoothing = 0.5) {
    this.smoothing = smoothing;
  }

  update(motion: MotionVector): MotionVector {
    const alpha = this.smoothing;
    this.smoothX = alpha * this.smoothX + (1 - alpha) * motion.dx;
    this.smoothY = alpha * this.smoothY + (1 - alpha) * motion.dy;

    return {
      dx: this.smoothX - motion.dx,
      dy: this.smoothY - motion.dy,
    };
  }

  reset() {
    this.smoothX = 0;
    this.smoothY = 0;
  }
}

/**
 * Apply stabilization correction to canvas
 */
export function applyStabilization(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  correction: MotionVector,
  cropAmount: number
): void {
  const scale = 1 / (1 - cropAmount);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(scale, scale);
  ctx.translate(-canvas.width / 2 + correction.dx, -canvas.height / 2 + correction.dy);
}
