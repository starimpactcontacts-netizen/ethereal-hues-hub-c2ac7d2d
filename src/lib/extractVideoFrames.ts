/**
 * Extract evenly-spaced frames from a video file as base64 JPEG strings.
 * Uses a hidden <video> + <canvas> in the browser.
 */
export async function extractVideoFrames(
  file: File,
  frameCount = 12,
  timeoutPerFrame = 6000,
): Promise<string[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  return new Promise<string[]>((resolve, reject) => {
    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || !isFinite(duration)) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not determine video duration'));
        return;
      }

      const canvas = document.createElement('canvas');
      // Cap resolution for performance
      const maxDim = 720;
      const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext('2d')!;

      const frames: string[] = [];
      // Spread frames across 5%-95% of video duration
      const timestamps: number[] = [];
      for (let i = 0; i < frameCount; i++) {
        timestamps.push(frameCount === 1 ? Math.min(duration * 0.1, 0.5) : duration * (0.05 + (0.9 * i) / (frameCount - 1)));
      }

      for (const t of timestamps) {
        try {
          const frame = await captureFrame(video, ctx, canvas, t, timeoutPerFrame);
          frames.push(frame);
        } catch (e) {
          console.warn(`Frame extraction failed at ${t.toFixed(1)}s:`, e);
          // Skip failed frames
        }
      }

      URL.revokeObjectURL(url);
      if (frames.length === 0) {
        reject(new Error('No frames could be extracted'));
      } else {
        resolve(frames);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };

    video.src = url;
  });
}

function captureFrame(
  video: HTMLVideoElement,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  time: number,
  timeout: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Frame capture timeout')), timeout);

    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      clearTimeout(timer);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      resolve(dataUrl);
    };

    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
  });
}

/** Get a single preview frame (for thumbnail display) */
export async function getVideoPreviewFrame(file: File): Promise<string> {
  const frames = await extractVideoFrames(file, 1);
  return frames[0];
}
