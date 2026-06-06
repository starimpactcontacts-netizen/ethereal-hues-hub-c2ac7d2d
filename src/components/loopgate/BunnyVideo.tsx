import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
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
  onLoadedMetadata?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onPlay?: () => void;
  onPause?: () => void;
}

/** Native <video> wired up to Bunny Stream (MP4 with HLS fallback). */
const BunnyVideo = forwardRef<HTMLVideoElement, Props>(function BunnyVideo({
  src,
  className,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  poster,
  playsInline = true,
  onLoadedMetadata,
  onTimeUpdate,
  onPlay,
  onPause,
}, externalRef) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useImperativeHandle(externalRef, () => ref.current as HTMLVideoElement, []);

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
      onLoadedMetadata={onLoadedMetadata}
      onTimeUpdate={onTimeUpdate}
      onPlay={onPlay}
      onPause={onPause}
    />
  );
});

export default BunnyVideo;