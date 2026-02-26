import { useNavigate } from "react-router-dom";
import { Newspaper, Eye, Clock, ArrowUpRight } from "lucide-react";
import editoriumLogo from "@/assets/editorium-logo.png";

export interface EditoriumArticle {
  id: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string | null;
  author_name: string | null;
  view_count: number;
  read_time_minutes: number | null;
  slug: string;
  published_at: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  daily_cover: 'Daily Cover',
  feature: 'Feature',
  artist_spotlight: 'Spotlight',
  unit_showcase: 'Unit',
  music: 'Music',
  culture: 'Culture',
  tech: 'Tech',
  opinion: 'Opinion',
  press_release: 'Press',
};

export default function EditoriumPickCard({ article }: { article: EditoriumArticle }) {
  const navigate = useNavigate();

  const categoryLabel = CATEGORY_LABELS[article.category || ''] || 'Article';

  return (
    <button
      onClick={() => navigate(`/editorium/${article.slug}`)}
      className="w-full text-left border-b border-border/20 hover:bg-muted/5 transition-colors"
    >
      {/* Header badge */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
        <img src={editoriumLogo} alt="Editorium" className="h-3.5 opacity-60" />
        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Weekly Pick</span>
        <div className="flex-1" />
        <span className="text-[10px] font-semibold text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full">{categoryLabel}</span>
      </div>

      {/* Cover image */}
      {article.cover_image_url && (
        <div className="px-4 pt-1 pb-2">
          <div className="relative rounded-xl overflow-hidden aspect-[2/1] bg-muted/20">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-[15px] font-bold text-foreground leading-snug line-clamp-2 drop-shadow-sm">
                {article.title}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* No cover fallback */}
      {!article.cover_image_url && (
        <div className="px-4 pb-2">
          <h3 className="text-[15px] font-bold text-foreground leading-snug line-clamp-2">
            {article.title}
          </h3>
        </div>
      )}

      {/* Subtitle + meta */}
      <div className="px-4 pb-3">
        {article.subtitle && (
          <p className="text-[12px] text-muted-foreground/70 leading-relaxed line-clamp-2 mb-2">
            {article.subtitle}
          </p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
          {article.author_name && (
            <span className="font-medium">By {article.author_name}</span>
          )}
          {article.read_time_minutes && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {article.read_time_minutes} min
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Eye className="w-2.5 h-2.5" />
            {article.view_count}
          </span>
          <div className="flex-1" />
          <span className="flex items-center gap-0.5 text-primary/60 font-semibold">
            Read <ArrowUpRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
