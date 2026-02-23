import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Eye, ArrowRight, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import SEO, { pageSEO } from '@/components/SEO';
import editoriumLogo from '@/assets/editorium-logo.png';

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

  // Force white background on parent containers
  useEffect(() => {
    document.documentElement.classList.add('editorium-active');
    document.body.classList.add('editorium-active');
    return () => {
      document.documentElement.classList.remove('editorium-active');
      document.body.classList.remove('editorium-active');
    };
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
  const breaking = articles.filter(a => a.id !== featured?.id).slice(0, 4);
  const rest = articles.filter(a => a.id !== featured?.id && !breaking.find(b => b.id === a.id));

  return (
    <div className="editorium-white min-h-screen pb-20">
      <SEO {...pageSEO.editorium} />

      {/* ═══ TOP BAR ═══ */}
      <div style={{ backgroundColor: '#111111' }} className="py-1.5">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <span style={{ color: '#999', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
            The Editor's World
          </span>
          <span style={{ color: '#999', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Press · Culture · Community
          </span>
        </div>
      </div>

      {/* ═══ MASTHEAD ═══ */}
      <div style={{ borderBottom: '3px solid #111' }} className="py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center">
          <img 
            src={editoriumLogo} 
            alt="EDITORIUM" 
            className="h-12 sm:h-16 object-contain"
            style={{ filter: 'invert(1)' }}
          />
          <div className="flex items-center gap-3 mt-2">
            <span style={{ height: '1px', width: '40px', backgroundColor: '#cc0000' }} />
            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 500 }}>
              By Loopgate
            </p>
            <span style={{ height: '1px', width: '40px', backgroundColor: '#cc0000' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#ddd', borderTopColor: '#cc0000' }} />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 px-4">
          <p style={{ fontSize: '14px', color: '#888' }}>No articles published yet.</p>
          <p style={{ fontSize: '12px', color: '#bbb', marginTop: '4px' }}>The first feature is coming soon.</p>
        </div>
      ) : (
        <>
          {/* ═══ BREAKING NEWS TICKER ═══ */}
          {breaking.length > 0 && (
            <div style={{ borderBottom: '1px solid #e5e5e5' }}>
              <div className="max-w-5xl mx-auto px-4 py-3">
                <div className="flex items-start gap-4">
                  <span 
                    className="shrink-0 px-2.5 py-1 font-bold"
                    style={{ backgroundColor: '#cc0000', color: '#fff', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                  >
                    Breaking
                  </span>
                  <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-6">
                      {breaking.map(article => (
                        <Link key={article.id} to={`/editorium/${article.slug}`} className="shrink-0 max-w-[260px] group">
                          <p style={{ fontSize: '11px', color: '#999', fontWeight: 500 }}>
                            {article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : ''}
                          </p>
                          <p 
                            className="line-clamp-2 group-hover:underline" 
                            style={{ fontSize: '14px', fontWeight: 700, color: '#111', lineHeight: 1.3, marginTop: '2px', fontFamily: "'Inter', sans-serif" }}
                          >
                            {article.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-5xl mx-auto px-4 pt-8">
            {/* ═══ HERO FEATURE ═══ */}
            {featured && (
              <Link to={`/editorium/${featured.slug}`} className="block group mb-10">
                <motion.article
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden"
                >
                  {featured.cover_image_url ? (
                    <div className="aspect-[16/9] sm:aspect-[2/1] overflow-hidden relative">
                      <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)' }} />
                      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                        {featured.unit_name && (
                          <div className="flex items-center gap-2 mb-2">
                            {featured.unit_avatar && (
                              <img src={featured.unit_avatar} className="w-5 h-5 rounded-full border border-white/20" alt="" />
                            )}
                            <span style={{ fontSize: '10px', color: '#cc0000', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>{featured.unit_name}</span>
                          </div>
                        )}
                        <h2 className="font-display text-3xl sm:text-5xl leading-tight" style={{ color: '#fff' }}>{featured.title}</h2>
                        {featured.subtitle && (
                          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', marginTop: '6px', maxWidth: '600px' }}>{featured.subtitle}</p>
                        )}
                        <div className="flex items-center gap-3 mt-3" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{featured.author_name}</span>
                          {featured.published_at && (
                            <span>{formatDistanceToNow(new Date(featured.published_at), { addSuffix: true })}</span>
                          )}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.read_time_minutes || 5} min</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6" style={{ borderBottom: '2px solid #111' }}>
                      <h2 className="font-display text-4xl group-hover:underline" style={{ color: '#111' }}>{featured.title}</h2>
                      {featured.subtitle && <p style={{ fontSize: '15px', color: '#666', marginTop: '6px' }}>{featured.subtitle}</p>}
                    </div>
                  )}
                </motion.article>
              </Link>
            )}

            {/* ═══ SECTION LABEL ═══ */}
            {rest.length > 0 && (
              <div className="flex items-center gap-3 mb-6" style={{ borderBottom: '2px solid #111', paddingBottom: '8px' }}>
                <TrendingUp className="w-4 h-4" style={{ color: '#cc0000' }} />
                <h3 className="font-display text-lg" style={{ color: '#111', letterSpacing: '0.05em' }}>Latest</h3>
              </div>
            )}

            {/* ═══ ARTICLE GRID ═══ */}
            <div className="space-y-0" style={{ borderColor: '#e5e5e5' }}>
              {rest.map((article, i) => (
                <Link key={article.id} to={`/editorium/${article.slug}`} className="block group">
                  <motion.article
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex gap-5 py-5"
                    style={{ borderBottom: '1px solid #e5e5e5' }}
                  >
                    {article.cover_image_url ? (
                      <div className="w-36 h-24 sm:w-44 sm:h-28 shrink-0 overflow-hidden">
                        <img src={article.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="w-36 h-24 sm:w-44 sm:h-28 shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
                        <img src={editoriumLogo} alt="" className="w-16 opacity-10" style={{ filter: 'invert(1)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {article.unit_name && (
                        <span style={{ fontSize: '10px', color: '#cc0000', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>{article.unit_name}</span>
                      )}
                      <h3 
                        className="font-display text-lg sm:text-xl leading-snug line-clamp-2 mt-0.5 group-hover:underline"
                        style={{ color: '#111', textDecorationColor: '#cc0000' }}
                      >
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="line-clamp-2 mt-1" style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>{article.excerpt}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2" style={{ fontSize: '11px', color: '#999' }}>
                        <span style={{ color: '#444', fontWeight: 600 }}>{article.author_name}</span>
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
        </>
      )}
    </div>
  );
}
