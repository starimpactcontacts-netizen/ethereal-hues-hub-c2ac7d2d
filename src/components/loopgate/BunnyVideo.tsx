import { useEffect, useRef } from 'react';
import { attachHlsSource } from '@/lib/attachHlsSource';

interface Props {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  poster?: string;
  playsInline?: boolean;
}

/** Native <video> wired up to Bunny Stream (MP4 with HLS fallback). */
export default function BunnyVideo({
  src,
  className,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  poster,
  playsInline = true,
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    const cleanup = attachHlsSource(v, src);
    return () => cleanup();
  }, [src]);

  return (
    <video
      ref={ref}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      poster={poster}
      playsInline={playsInline}
    />
  );
}