import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, ExternalLink } from 'lucide-react';
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
  qoi_score: number | null;
  headline: string | null;
  source_label: string | null;
  featured_date: string;
}

function PickCard({ edit }: { edit: IndexedEdit }) {
  const { thumbnail } = useThumbnail(edit.submission_url, edit.platform);
  const coverImg = edit.thumbnail_url || thumbnail;
  const hasScore = edit.qoi_score !== null && edit.qoi_score > 0;

  return (
    <a
      href={edit.submission_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative w-[200px] flex-shrink-0 snap-start border border-border/20 bg-surface-1/60 hover:border-red-500/30 transition-all duration-300 overflow-hidden"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
    >
      {/* Thumbnail */}
      <div className="h-[110px] w-full overflow-hidden bg-black relative">
        {coverImg ? (
          <img
            src={coverImg}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-950/40 via-black to-red-950/20 flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest" style={{ fontFamily: 'Teko, sans-serif' }}>
              {edit.platform}
            </span>
          </div>
        )}

        {/* QOI badge */}
        {hasScore && (
          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
            <Trophy size={9} className="text-gold" />
            <span className="text-[10px] font-bold text-gold">{Math.round(edit.qoi_score!)}</span>
          </div>
        )}

        {/* External link icon */}
        <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={11} className="text-white drop-shadow-lg" />
        </div>

        {/* Source label */}
        {edit.source_label && (
          <div className="absolute bottom-1.5 left-1.5">
            <span className="text-[7px] font-bold uppercase tracking-wider bg-red-500/80 text-white px-1 py-0.5 rounded-sm">
              {edit.source_label}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-2.5 py-2 border-t border-border/10">
        {edit.headline && (
          <p className="text-[10px] text-foreground/70 line-clamp-1 mb-1">{edit.headline}</p>
        )}
        <div className="flex items-center gap-1.5">
          {edit.avatar_url ? (
            <img src={edit.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover ring-1 ring-white/10" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-[7px] font-bold text-red-400">{edit.username.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="text-[10px] font-bold text-foreground truncate">{edit.username}</span>
          <span className={cn(
            "ml-auto text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-sm",
            "bg-white/[0.05] text-muted-foreground"
          )}>
            {edit.platform}
          </span>
        </div>
      </div>
    </a>
  );
}

export default function EditoriumPicks({ limit = 10 }: { limit?: number }) {
  const [edits, setEdits] = useState<IndexedEdit[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex gap-2.5 pl-4 overflow-x-auto scrollbar-hide">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[200px] h-[155px] flex-shrink-0 bg-surface-1 animate-pulse rounded-sm" />
        ))}
      </div>
    );
  }

  if (edits.length === 0) return null;

  return (
    <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
      {edits.map((edit) => (
        <PickCard key={edit.id} edit={edit} />
      ))}
    </div>
  );
}
