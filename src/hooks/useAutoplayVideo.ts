import { useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to a <video> element.
 *
 * Bandwidth-saving behavior:
 * - When the video is NOT near the viewport, its `src` is not attached at all,
 *   so the browser never makes a network request for it. This means scrolling
 *   past a feed video = zero egress.
 * - When it scrolls within ~600px of the viewport, the `src` is attached and
 *   the browser can begin a tiny metadata fetch.
 * - When ≥50% visible, it plays (muted). When out of view, it pauses.
 * - When far out of view again, the `src` is detached and buffers are released
 *   so background buffering stops.
 *
 * Pass the video URL as `src` to opt into true lazy loading. Omit it to keep
 * the legacy play/pause-only behavior (backwards compatible).
 */
export function useAutoplayVideo(enabled: boolean | string | undefined = true, src?: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Allow legacy 2nd-arg-less usage: useAutoplayVideo(true)
  const isEnabled = typeof enabled === 'string' ? !!enabled : !!enabled;
  const lazySrc = typeof enabled === 'string' ? enabled : src;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isEnabled) return;

    // Preload window: attach src when within 600px of viewport
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (!lazySrc) return;
        if (entry.isIntersecting) {
          if (el.getAttribute('src') !== lazySrc) {
            el.setAttribute('src', lazySrc);
            el.load();
          }
        } else {
          // Far out of view → drop src to stop any buffering
          if (el.getAttribute('src')) {
            el.pause();
            el.removeAttribute('src');
            el.load();
          }
        }
      },
      { rootMargin: '600px 0px' }
    );

    // Play window: only play when actually visible
    const play = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.5 }
    );

    preload.observe(el);
    play.observe(el);
    return () => {
      preload.disconnect();
      play.disconnect();
    };
  }, [isEnabled, lazySrc]);

  return videoRef;
}
