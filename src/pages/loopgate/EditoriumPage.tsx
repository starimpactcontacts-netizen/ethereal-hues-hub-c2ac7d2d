import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Eye, ArrowRight, Newspaper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import SEO, { pageSEO } from '@/components/SEO';

interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  published_at: string | null;
  read_time_minutes: number | null;
  view_count: number | null;
  tags: string[] | null;
  featured: boolean;
  unit_id: string | null;
  unit_name?: string;
  unit_avatar?: string;
}

export default function EditoriumPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  async function fetchArticles() {
    const { data } = await supabase
      .from('editorium_articles')
      .select('id, title, slug, subtitle, excerpt, cover_image_url, author_name, published_at, read_time_minutes, view_count, tags, featured, unit_id')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (data) {
      const unitIds = [...new Set(data.filter(a => a.unit_id).map(a => a.unit_id!))];
      let unitMap: Record<string, { name: string; avatar_url: string | null }> = {};
      if (unitIds.length > 0) {
        const { data: units } = await supabase
          .from('crews')
          .select('id, name, avatar_url')
          .in('id', unitIds);
        if (units) {
          units.forEach(u => { unitMap[u.id] = { name: u.name, avatar_url: u.avatar_url }; });
        }
      }

      setArticles(data.map(a => ({
        ...a,
        unit_name: a.unit_id ? unitMap[a.unit_id]?.name : undefined,
        unit_avatar: a.unit_id ? unitMap[a.unit_id]?.avatar_url || undefined : undefined,
      })));
    }
    setLoading(false);
  }

  const featured = articles.find(a => a.featured);
  const rest = articles.filter(a => a.id !== featured?.id);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <SEO {...pageSEO.editorium} />

      {/* Masthead — Loopgate brand style */}
      <div className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="font-display text-5xl sm:text-6xl tracking-[0.08em] text-foreground leading-none">EDITORIUM</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="h-px w-8 bg-destructive" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Featured Communities · Culture · Profiles</p>
            <span className="h-px w-8 bg-destructive" />
          </div>
          <div className="mt-5 h-[2px] bg-foreground/10 w-full" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 px-4">
          <Newspaper className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No articles published yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">The first feature is coming soon.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 pt-6">
          {/* Hero Feature */}
          {featured && (
            <Link to={`/editorium/${featured.slug}`} className="block group mb-8">
              <motion.article
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-md"
              >
                {featured.cover_image_url && (
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                      {featured.unit_name && (
                        <div className="flex items-center gap-2 mb-2">
                          {featured.unit_avatar && (
                            <img src={featured.unit_avatar} className="w-5 h-5 rounded-full border border-white/20" alt="" />
                          )}
                          <span className="text-[10px] text-destructive uppercase tracking-wider font-bold">{featured.unit_name}</span>
                        </div>
                      )}
                      <h2 className="font-display text-2xl sm:text-4xl text-white leading-tight">{featured.title}</h2>
                      {featured.subtitle && (
                        <p className="text-sm text-white/70 mt-1 max-w-xl">{featured.subtitle}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-white/50">
                        <span className="font-semibold text-white/70">{featured.author_name}</span>
                        {featured.published_at && (
                          <span>{formatDistanceToNow(new Date(featured.published_at), { addSuffix: true })}</span>
                        )}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.read_time_minutes || 5} min</span>
                      </div>
                    </div>
                  </div>
                )}
                {!featured.cover_image_url && (
                  <div className="p-6 border-b border-foreground/20">
                    <h2 className="font-display text-3xl text-foreground leading-tight group-hover:text-destructive transition-colors">{featured.title}</h2>
                    {featured.subtitle && <p className="text-sm text-muted-foreground mt-1">{featured.subtitle}</p>}
                    {featured.excerpt && <p className="text-sm text-muted-foreground/70 mt-3 line-clamp-2">{featured.excerpt}</p>}
                  </div>
                )}
              </motion.article>
            </Link>
          )}

          {/* Divider */}
          {rest.length > 0 && (
            <div className="border-b border-border/40 mb-6" />
          )}

          {/* Article List */}
          <div className="space-y-0 divide-y divide-border/30">
            {rest.map((article, i) => (
              <Link key={article.id} to={`/editorium/${article.slug}`} className="block group">
                <motion.article
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-5 py-5"
                >
                  {article.cover_image_url ? (
                    <div className="w-32 h-24 shrink-0 overflow-hidden rounded-sm">
                      <img src={article.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ) : (
                    <div className="w-32 h-24 shrink-0 bg-surface-1 flex items-center justify-center rounded-sm">
                      <Newspaper className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {article.unit_name && (
                      <span className="text-[10px] text-destructive uppercase tracking-wider font-bold">{article.unit_name}</span>
                    )}
                    <h3 className="font-display text-base sm:text-lg text-foreground leading-snug group-hover:text-destructive transition-colors line-clamp-2 mt-0.5">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-[13px] text-muted-foreground mt-1 line-clamp-1">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground/60">
                      <span className="text-muted-foreground font-medium">{article.author_name}</span>
                      <span>·</span>
                      <span>{article.read_time_minutes || 5} min read</span>
                      <span>·</span>
                      <span>{article.view_count || 0} views</span>
                    </div>
                  </div>
                </motion.article>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
