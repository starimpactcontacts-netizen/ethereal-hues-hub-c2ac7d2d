import Hls from "hls.js";
import { isHlsUrl } from "@/lib/bunnyPlayback";

export type HlsAttachHandlers = {
  onReady?: () => void;
  onError?: (message: string) => void;
};

export type PreloadedBunnyVideo = {
  element: HTMLVideoElement;
  ready: Promise<void>;
  dispose: () => void;
};

/**
 * Attach a video URL to a <video> element with HLS support.
 *
 * - Safari (and iOS): plays HLS natively, just sets `src`.
 * - Chrome/Firefox/Android: uses hls.js with low-latency tuning so the first
 *   segment starts streaming immediately, no full buffering required.
 * - Plain MP4/webm/etc: just sets `src`.
 *
 * Returns a cleanup function that detaches hls.js (call on unmount / src change).
 */
export function attachHlsSource(video: HTMLVideoElement, url: string, handlers: HlsAttachHandlers = {}): () => void {
  if (!url) return () => {};

  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.playsInline = true;
  console.info('[Bunny Video] Requesting CDN URL:', url);

  // Native HLS (Safari + iOS) — let the browser do it.
  const canNative = video.canPlayType("application/vnd.apple.mpegurl") !== "";
  if (!isHlsUrl(url) || canNative) {
    if (video.src !== url) video.src = url;
    video.load();
    return () => {};
  }

  if (!Hls.isSupported()) {
    // Last resort — try setting the src and hope.
    if (video.src !== url) video.src = url;
    return () => {};
  }

  const hls = new Hls({
    // Low-latency-ish tuning: start playing as soon as the first segment arrives.
    enableWorker: true,
    lowLatencyMode: false,
    maxBufferLength: 30,
    backBufferLength: 10,
    startLevel: -1, // auto bitrate
    // ABR aggressiveness — pick lower bitrate fast on weak connections.
    abrEwmaDefaultEstimate: 1_000_000,
  });
  hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
    console.info('[Bunny Video] HLS manifest loaded:', url, `levels=${data.levels.length}`);
    handlers.onReady?.();
  });
  hls.on(Hls.Events.LEVEL_LOADED, (_, data) => {
    console.info('[Bunny Video] HLS level ready:', url, `level=${data.level}`);
    handlers.onReady?.();
  });
  hls.on(Hls.Events.ERROR, (_, data) => {
    const message = `${data.type}:${data.details}${data.fatal ? ':fatal' : ''}`;
    console.error('[Bunny Video] HLS error:', message, url);
    if (data.fatal) handlers.onError?.(message);
  });
  hls.loadSource(url);
  hls.attachMedia(video);

  return () => {
    try { hls.destroy(); } catch { /* noop */ }
  };
}

export function preloadBunnyVideo(url: string, timeoutMs = 2_000): PreloadedBunnyVideo {
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.setAttribute("webkit-playsinline", "true");
  video.style.cssText = "position:fixed;left:-2px;top:-2px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;";
  document.body.appendChild(video);

  let cleanup = () => {};
  let settled = false;
  const ready = new Promise<void>((resolve) => {
    const markReady = () => {
      if (settled) return;
      settled = true;
      console.info('[Bunny Video] Preload ready:', url);
      resolve();
      video.pause();
      try { video.currentTime = 0; } catch { /* ignore */ }
    };
    const markSlow = () => {
      if (settled) return;
      console.error('[Bunny Video] Preload exceeded 2s:', url);
      resolve();
    };
    const timer = window.setTimeout(markSlow, timeoutMs);
    const done = () => {
      window.clearTimeout(timer);
      markReady();
    };
    video.addEventListener("loadeddata", done, { once: true });
    video.addEventListener("canplay", done, { once: true });
    video.addEventListener("playing", done, { once: true });
    video.addEventListener("error", () => {
      window.clearTimeout(timer);
      console.error('[Bunny Video] Preload failed:', url, video.error?.message || video.error?.code || 'unknown');
      markSlow();
    }, { once: true });
    cleanup = attachHlsSource(video, url, { onReady: done, onError: markSlow });
    video.load();
    video.play().catch(() => { /* muted autoplay may still be blocked; preload continues */ });
  });

  return {
    element: video,
    ready,
    dispose: () => {
      cleanup();
      video.remove();
    },
  };
}