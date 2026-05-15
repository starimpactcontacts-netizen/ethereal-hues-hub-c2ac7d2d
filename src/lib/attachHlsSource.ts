import Hls from "hls.js";
import { isHlsUrl } from "@/lib/bunnyPlayback";

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
export function attachHlsSource(video: HTMLVideoElement, url: string): () => void {
  if (!url) return () => {};

  // Native HLS (Safari + iOS) — let the browser do it.
  const canNative = video.canPlayType("application/vnd.apple.mpegurl") !== "";
  if (!isHlsUrl(url) || canNative) {
    if (video.src !== url) video.src = url;
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
  hls.loadSource(url);
  hls.attachMedia(video);

  return () => {
    try { hls.destroy(); } catch { /* noop */ }
  };
}