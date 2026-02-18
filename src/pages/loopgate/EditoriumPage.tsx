import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Eye, ArrowRight, Newspaper, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import SEO from '@/components/SEO';
import loopgateBrand from '@/assets/loopgate-brand.png';

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
      // Fetch unit names for articles with unit_id
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
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title="Editorium"
        description="Featured stories on the world's top editing communities and units. The definitive source for competitive editing culture."
      />

      {/* Masthead */}
      <div className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Newspaper className="w-5 h-5 text-gold" />
            <h1 className="font-display text-3xl tracking-[0.15em] text-foreground">EDITORIUM</h1>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Featured Communities · Culture · Profiles</p>
          <div className="mt-3 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 px-4">
          <Newspaper className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No articles published yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">The first feature is coming soon.</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          {/* Hero Feature */}
          {featured && (
            <Link to={`/editorium/${featured.slug}`} className="block group mb-6">
              <motion.article
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden border border-border/50 hover:border-gold/30 transition-all"
              >
                {featured.cover_image_url && (
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    <div className="absolute top-3 left-3 bg-gold px-2 py-0.5">
                      <span className="text-[9px] font-bold text-background uppercase tracking-widest">Featured</span>
                    </div>
                  </div>
                )}
                <div className="p-5 relative">
                  {featured.unit_name && (
                    <div className="flex items-center gap-2 mb-2">
                      {featured.unit_avatar && (
                        <img src={featured.unit_avatar} className="w-5 h-5 rounded-full" alt="" />
                      )}
                      <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">{featured.unit_name}</span>
                    </div>
                  )}
                  <h2 className="font-display text-2xl text-foreground leading-tight group-hover:text-gold transition-colors">{featured.title}</h2>
                  {featured.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">{featured.subtitle}</p>
                  )}
                  {featured.excerpt && (
                    <p className="text-sm text-muted-foreground/80 mt-3 line-clamp-2">{featured.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 mt-4 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground/70">{featured.author_name}</span>
                    {featured.published_at && (
                      <span>{formatDistanceToNow(new Date(featured.published_at), { addSuffix: true })}</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.read_time_minutes || 5} min</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{featured.view_count || 0}</span>
                  </div>
                </div>
              </motion.article>
            </Link>
          )}

          {/* Article Grid */}
          <div className="space-y-4">
            {rest.map((article, i) => (
              <Link key={article.id} to={`/editorium/${article.slug}`} className="block group">
                <motion.article
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4 border border-border/30 hover:border-gold/20 transition-all p-3"
                >
                  {article.cover_image_url ? (
                    <div className="w-28 h-20 shrink-0 overflow-hidden bg-surface-1">
                      <img src={article.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ) : (
                    <div className="w-28 h-20 shrink-0 bg-surface-1 flex items-center justify-center">
                      <img src={loopgateBrand} alt="" className="w-16 opacity-20" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {article.unit_name && (
                      <span className="text-[9px] text-gold uppercase tracking-wider font-semibold">{article.unit_name}</span>
                    )}
                    <h3 className="font-display text-sm text-foreground leading-tight group-hover:text-gold transition-colors line-clamp-2">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[9px] text-muted-foreground">
                      <span>{article.author_name}</span>
                      <span>·</span>
                      <span>{article.read_time_minutes || 5} min read</span>
                      <span>·</span>
                      <span>{article.view_count || 0} views</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 self-center shrink-0" />
                </motion.article>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
