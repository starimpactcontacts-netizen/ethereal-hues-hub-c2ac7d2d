import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import editoriumLogo from '@/assets/editorium-logo.png';

interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  cover_image_url: string | null;
  author_name: string;
  published_at: string | null;
  read_time_minutes: number | null;
  view_count: number | null;
  tags: string[] | null;
}

export default function EditoriumCarousel() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    supabase
      .from('editorium_articles')
      .select('id, title, slug, subtitle, cover_image_url, author_name, published_at, read_time_minutes, view_count, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setArticles(data as Article[]);
      });
  }, []);

  if (articles.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.22 }}
      className="pt-5 pb-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2.5">
          <img src={editoriumLogo} alt="" className="h-4 opacity-80" />
          <span className="text-[10px] text-muted-foreground bg-surface-1 px-1.5 py-0.5">{articles.length} articles</span>
        </div>
        <Link to="/editorium" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 uppercase tracking-wider">
          Read All <ArrowRight size={10} />
        </Link>
      </div>

      {/* Carousel */}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
        {articles.map((article, i) => (
          <Link key={article.id} to={`/editorium/${article.slug}`} className="shrink-0 group">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22 + i * 0.05 }}
              className="w-[220px] bg-surface-1/60 border border-border/40 hover:border-foreground/20 transition-all overflow-hidden"
            >
              {/* Cover */}
              <div className="h-28 overflow-hidden relative bg-surface-2">
                {article.cover_image_url ? (
                  <img src={article.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img src={editoriumLogo} alt="" className="w-20 opacity-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-1 to-transparent" />
                <div className="absolute top-1.5 left-1.5 bg-foreground px-1.5 py-0.5">
                  <span className="text-[7px] font-bold text-background uppercase tracking-wider">Feature</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-display text-xs text-foreground leading-tight line-clamp-2 group-hover:text-gold transition-colors">{article.title}</p>
                <div className="flex items-center gap-2 mt-2 text-[9px] text-muted-foreground">
                  <span>{article.author_name}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{article.read_time_minutes || 5}m read</span>
                  {(article.view_count || 0) > 0 && (
                    <>
                      <span>·</span>
                      <span>{(article.view_count || 0).toLocaleString()} views</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
