/**
 * ThumbnailImage — Unified thumbnail display component for Loopgate.
 *
 * Features:
 * - 16:9 aspect ratio with rounded corners & uniform shadow
 * - Smooth fade-in on load
 * - Automatic fallback to Loopgate placeholder on error (zero broken icons)
 * - Optional admin debug overlay showing thumbnailStatus + sourceUrl
 * - Shimmer placeholder while loading
 */

import { useState, useCallback } from 'react';
import { Play } from 'lucide-react';
import { LOOPGATE_PLACEHOLDER, type ThumbnailStatus } from '@/lib/thumbnail';
import { cn } from '@/lib/utils';

interface ThumbnailImageProps {
  src: string | null;
  alt?: string;
  status?: ThumbnailStatus;
  sourceUrl?: string | null;
  showDebug?: boolean;
  className?: string;
  onClick?: () => void;
  /** Overlay content rendered on top of the image (scores, rank badges, etc.) */
  children?: React.ReactNode;
}

export default function ThumbnailImage({
  src,
  alt = 'Thumbnail',
  status,
  sourceUrl,
  showDebug = false,
  className,
  onClick,
  children,
}: ThumbnailImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const displaySrc = errored || !src ? LOOPGATE_PLACEHOLDER : src;
  const isPlaceholder = displaySrc === LOOPGATE_PLACEHOLDER;

  const handleError = useCallback(() => {
    if (!errored) setErrored(true);
  }, [errored]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className={cn(
        'relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-sm bg-surface-2 group',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {/* Shimmer while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-surface-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-5 h-5 text-muted-foreground/30" />
          </div>
        </div>
      )}

      {/* Image */}
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full transition-opacity duration-300',
          isPlaceholder ? 'object-contain p-6 opacity-30' : 'object-cover',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Play overlay on hover (non-placeholder) */}
      {onClick && !isPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
          </div>
        </div>
      )}

      {/* Slot for score badges, rank, platform label etc. */}
      {children}

      {/* Admin debug overlay */}
      {showDebug && status && (
        <div className="absolute top-0 left-0 bg-black/80 text-[8px] text-green-400 font-mono px-1 py-0.5 rounded-br max-w-full truncate z-20">
          {status}{sourceUrl ? ` · ${sourceUrl.slice(0, 40)}…` : ''}
        </div>
      )}
    </div>
  );
}
