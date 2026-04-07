import { useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to a <video> element.
 * When ≥50% visible → play (muted). When out of view → pause.
 */
export function useAutoplayVideo(enabled = true) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  return videoRef;
}
