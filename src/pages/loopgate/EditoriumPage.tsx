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
    <div className="min-h-screen bg-white text-gray-900 pb-20">
      <SEO
        title="Editorium"
        description="Featured stories on the world's top editing communities and units. The definitive source for competitive editing culture."
      />

      {/* Forbes-style Masthead */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <h1 className="font-display text-4xl tracking-[0.12em] text-gray-900">EDITORIUM</h1>
          <p className="text-[11px] text-gray-500 uppercase tracking-[0.25em] mt-1">Featured Communities · Culture · Profiles</p>
          <div className="mt-4 h-[2px] bg-gray-900 w-full" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 px-4">
          <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No articles published yet.</p>
          <p className="text-xs text-gray-400 mt-1">The first feature is coming soon.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 pt-6">
          {/* Hero Feature */}
          {featured && (
            <Link to={`/editorium/${featured.slug}`} className="block group mb-8">
              <motion.article
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden"
              >
                {featured.cover_image_url && (
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {featured.unit_name && (
                        <div className="flex items-center gap-2 mb-2">
                          {featured.unit_avatar && (
                            <img src={featured.unit_avatar} className="w-5 h-5 rounded-full border border-white/30" alt="" />
                          )}
                          <span className="text-[10px] text-red-500 uppercase tracking-wider font-bold">{featured.unit_name}</span>
                        </div>
                      )}
                      <h2 className="font-display text-3xl md:text-4xl text-white leading-tight">{featured.title}</h2>
                      {featured.subtitle && (
                        <p className="text-sm text-white/80 mt-1">{featured.subtitle}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-white/60">
                        <span className="font-semibold text-white/80">{featured.author_name}</span>
                        {featured.published_at && (
                          <span>{formatDistanceToNow(new Date(featured.published_at), { addSuffix: true })}</span>
                        )}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.read_time_minutes || 5} min</span>
                      </div>
                    </div>
                  </div>
                )}
                {!featured.cover_image_url && (
                  <div className="p-6 border-b-2 border-gray-900">
                    <h2 className="font-display text-3xl text-gray-900 leading-tight group-hover:text-red-600 transition-colors">{featured.title}</h2>
                    {featured.subtitle && <p className="text-sm text-gray-600 mt-1">{featured.subtitle}</p>}
                    {featured.excerpt && <p className="text-sm text-gray-500 mt-3 line-clamp-2">{featured.excerpt}</p>}
                  </div>
                )}
              </motion.article>
            </Link>
          )}

          {/* Divider */}
          {rest.length > 0 && (
            <div className="border-b border-gray-200 mb-6" />
          )}

          {/* Article List */}
          <div className="space-y-0 divide-y divide-gray-100">
            {rest.map((article, i) => (
              <Link key={article.id} to={`/editorium/${article.slug}`} className="block group">
                <motion.article
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-5 py-5"
                >
                  {article.cover_image_url ? (
                    <div className="w-32 h-24 shrink-0 overflow-hidden">
                      <img src={article.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ) : (
                    <div className="w-32 h-24 shrink-0 bg-gray-100 flex items-center justify-center">
                      <Newspaper className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {article.unit_name && (
                      <span className="text-[10px] text-red-600 uppercase tracking-wider font-bold">{article.unit_name}</span>
                    )}
                    <h3 className="font-semibold text-base text-gray-900 leading-snug group-hover:text-red-600 transition-colors line-clamp-2 mt-0.5">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-[13px] text-gray-500 mt-1 line-clamp-1">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                      <span className="text-gray-600 font-medium">{article.author_name}</span>
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
