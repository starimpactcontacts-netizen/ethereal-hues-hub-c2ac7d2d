import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, ExternalLink, Volume2, VolumeX, Play } from 'lucide-react';
import { useThumbnail } from '@/hooks/useThumbnail';
import { cn } from '@/lib/utils';

interface IndexedEdit {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  platform: string;
  submission_url: string;
  thumbnail_url: string | null;
  video_url: string | null;
  autoplay_with_sound: boolean | null;
  qoi_score: number | null;
  headline: string | null;
  source_label: string | null;
  featured_date: string;
}

/**
 * Vertical autoplay video card — TikTok-style, sound on by default
 * when scrolled into view. Click to unmute toggle, link icon to open source.
 */
function PickVideoCard({
  edit,
  isMuted,
  onToggleMute,
}: {
  edit: IndexedEdit;
  isMuted: boolean;
  onToggleMute: () => void;
}) {
  const { thumbnail } = useThumbnail(edit.submission_url, edit.platform);
  const coverImg = edit.thumbnail_url || thumbnail;
  const hasScore = edit.qoi_score !== null && (edit.qoi_score ?? 0) > 0;
  const hasVideo = !!edit.video_url;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // IntersectionObserver — autoplay when ≥60% visible
  useEffect(() => {
    const v = videoRef.current;
    const c = containerRef.current;
    if (!v || !c || !hasVideo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) {
          v.play().then(() => setIsPlaying(true)).catch(() => {
            // Browser blocked sound autoplay → fall back to muted
            v.muted = true;
            v.play().then(() => setIsPlaying(true)).catch(() => {});
          });
        } else {
          v.pause();
          setIsPlaying(false);
        }
      },
      { threshold: [0, 0.6, 1] }
    );

    observer.observe(c);
    return () => observer.disconnect();
  }, [hasVideo]);

  // Sync mute state from parent (shared across all cards)
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  return (
    <div
      ref={containerRef}
      className="group relative w-[200px] aspect-[9/16] flex-shrink-0 snap-start rounded-2xl overflow-hidden bg-black border border-border/20"
    >
      {/* Media */}
      {hasVideo ? (
        <video
          ref={videoRef}
          src={edit.video_url!}
          poster={coverImg || undefined}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          playsInline
          preload="metadata"
          onClick={onToggleMute}
        />
      ) : coverImg ? (
        <a
          href={edit.submission_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0"
        >
          <img src={coverImg} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Play size={20} className="text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        </a>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-black to-red-950/20 flex items-center justify-center">
          <span className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: 'Teko, sans-serif' }}>
            {edit.platform}
          </span>
        </div>
      )}

      {/* Top gradient + badges */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-2.5 flex items-start justify-between pointer-events-none">
        {edit.source_label && (
          <span className="text-[8px] font-bold uppercase tracking-wider bg-red-500/90 text-white px-1.5 py-0.5 rounded">
            {edit.source_label}
          </span>
        )}
        {hasScore && (
          <div className="ml-auto bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Trophy size={10} className="text-gold" />
            <span className="text-[10px] font-bold text-gold">{Math.round(edit.qoi_score!)}</span>
          </div>
        )}
      </div>

      {/* Mute toggle (videos only) */}
      {hasVideo && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="absolute top-10 right-2 z-10 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={12} className="text-white" /> : <Volume2 size={12} className="text-white" />}
        </button>
      )}

      {/* Open source link */}
      <a
        href={edit.submission_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-10 left-2 z-10 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Open original"
      >
        <ExternalLink size={12} className="text-white" />
      </a>

      {/* Bottom overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-10">
        {edit.headline && (
          <p className="text-[11px] text-white/85 line-clamp-2 mb-1.5 leading-snug">{edit.headline}</p>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
            <span className="text-[8px] font-black text-white">L</span>
          </div>
          <span className="text-[10px] font-black tracking-[0.15em] text-white truncate uppercase" style={{ fontFamily: 'Teko, sans-serif' }}>
            LOOPGATE · EDITORIUM
          </span>
          <span className="ml-auto text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/70">
            {edit.platform}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EditoriumPicks({ limit = 10 }: { limit?: number }) {
  const [edits, setEdits] = useState<IndexedEdit[]>([]);
  const [loading, setLoading] = useState(true);
  // Default muted because most browsers block sound-on autoplay; user taps to enable
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('editorium_indexed_edits')
        .select('*')
        .eq('is_active', true)
        .order('featured_date', { ascending: false })
        .limit(limit);
      setEdits((data as IndexedEdit[]) || []);
      setLoading(false);
    })();
  }, [limit]);

  if (loading) {
    return (
      <div className="flex gap-3 pl-4 overflow-x-auto scrollbar-hide">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-[260px] aspect-[9/16] flex-shrink-0 bg-surface-1 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (edits.length === 0) return null;

  return (
    <div className="flex gap-3 pl-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
      {edits.map((edit) => (
        <PickVideoCard
          key={edit.id}
          edit={edit}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((m) => !m)}
        />
      ))}
    </div>
  );
}
