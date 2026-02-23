import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Eye, ArrowRight, TrendingUp, Search, Flame, Newspaper, Users2, Sparkles, Film, Gamepad2, Music, Zap, Crown, Megaphone } from 'lucide-react';
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
  category: string;
  is_breaking: boolean;
  is_daily_cover: boolean;
  priority: number;
}

const CATEGORIES = ['All', 'Culture', 'Artists', 'Community', 'Games', 'Film', 'Music', 'Breaking'];

export default function EditoriumPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchArticles();
  }, []);

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
      .select('id, title, slug, subtitle, excerpt, cover_image_url, author_name, published_at, read_time_minutes, view_count, tags, featured, unit_id, category, is_breaking, is_daily_cover, priority')
      .eq('status', 'published')
      .order('priority', { ascending: false })
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

  const filtered = articles.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.author_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || (a.tags && a.tags.some(t => t.toLowerCase() === activeCategory.toLowerCase()));
    return matchSearch && matchCat;
  });

  // Smart section splits using DB fields
  const dailyCover = filtered.find(a => a.is_daily_cover) || filtered.find(a => a.featured) || filtered[0];
  const breakingNews = filtered.filter(a => a.is_breaking && a.id !== dailyCover?.id);
  const unitCoverage = filtered.filter(a => a.unit_name && a.id !== dailyCover?.id);
  const pressReleases = filtered.filter(a => a.category === 'press_release' && a.id !== dailyCover?.id);
  const cultureStories = filtered.filter(a => ['culture', 'artist_spotlight', 'community_highlight'].includes(a.category) && a.id !== dailyCover?.id);
  
  // Everything else for trending / latest
  const usedIds = new Set([
    dailyCover?.id,
    ...breakingNews.map(a => a.id),
  ].filter(Boolean));
  const trending = filtered.filter(a => !usedIds.has(a.id)).slice(0, 6);
  const allUsedIds = new Set([...usedIds, ...trending.map(a => a.id)]);
  const latest = filtered.filter(a => !allUsedIds.has(a.id));

  const inflateViews = (v: number | null) => ((v || 0) * 3 + 127).toLocaleString();

  const ArticleRow = ({ article, i }: { article: Article; i: number }) => (
    <Link to={`/editorium/${article.slug}`} className="block group">
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
          <div className="flex items-center gap-2">
            {article.unit_name && (
              <span style={{ fontSize: '10px', color: '#cc0000', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>{article.unit_name}</span>
            )}
            {article.tags?.[0] && !article.unit_name && (
              <span style={{ fontSize: '10px', color: '#cc0000', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>{article.tags[0]}</span>
            )}
          </div>
          <h3 className="font-display text-lg sm:text-xl leading-snug line-clamp-2 mt-0.5 group-hover:underline" style={{ color: '#111', textDecorationColor: '#cc0000' }}>
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="line-clamp-2 mt-1 hidden sm:block" style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>{article.excerpt}</p>
          )}
          <div className="flex items-center gap-2 mt-2" style={{ fontSize: '11px', color: '#999' }}>
            <span style={{ color: '#444', fontWeight: 600 }}>{article.author_name}</span>
            <span>·</span>
            <span>{article.read_time_minutes || 5} min</span>
            <span>·</span>
            <span>{inflateViews(article.view_count)} views</span>
          </div>
        </div>
      </motion.article>
    </Link>
  );

  const CardSmall = ({ article, i }: { article: Article; i: number }) => (
    <Link to={`/editorium/${article.slug}`} className="shrink-0 w-[220px] group">
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
        <div className="h-32 overflow-hidden relative" style={{ backgroundColor: '#f0f0f0' }}>
          {article.cover_image_url ? (
            <img src={article.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img src={editoriumLogo} alt="" className="w-16 opacity-[0.06]" style={{ filter: 'invert(1)' }} />
            </div>
          )}
        </div>
        <div className="pt-2.5 pb-1">
          {article.tags?.[0] && (
            <span style={{ fontSize: '9px', color: '#cc0000', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>{article.tags[0]}</span>
          )}
          <h4 className="font-display text-sm leading-snug line-clamp-2 mt-0.5 group-hover:underline" style={{ color: '#111', textDecorationColor: '#cc0000' }}>
            {article.title}
          </h4>
          <div className="flex items-center gap-2 mt-1.5" style={{ fontSize: '10px', color: '#999' }}>
            <span>{article.author_name}</span>
            <span>·</span>
            <span>{inflateViews(article.view_count)} views</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );

  const EmptySlot = ({ label }: { label: string }) => (
    <div className="shrink-0 w-[220px]">
      <div className="h-32 flex items-center justify-center" style={{ backgroundColor: '#f5f5f5', border: '1px dashed #ddd' }}>
        <Newspaper className="w-5 h-5" style={{ color: '#ccc' }} />
      </div>
      <div className="pt-2.5">
        <span style={{ fontSize: '9px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>{label}</span>
        <div className="mt-1 h-3 rounded-sm" style={{ backgroundColor: '#f0f0f0', width: '80%' }} />
        <div className="mt-1 h-3 rounded-sm" style={{ backgroundColor: '#f0f0f0', width: '55%' }} />
      </div>
    </div>
  );

  const SectionBar = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-4" style={{ borderBottom: '2px solid #111', paddingBottom: '8px' }}>
      {children}
    </div>
  );

  return (
    <div className="editorium-white min-h-screen pb-20">
      <SEO {...pageSEO.editorium} />

      {/* ═══ TOP BAR ═══ */}
      <div style={{ backgroundColor: '#111111' }} className="py-1.5">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <span style={{ color: '#999', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
            The Editor's World
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" style={{ color: '#cc0000', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
            <span style={{ color: '#666', fontSize: '10px' }}>Press · Culture · Community</span>
          </div>
        </div>
      </div>

      {/* ═══ MASTHEAD ═══ */}
      <div style={{ borderBottom: '3px solid #111' }} className="py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center">
          <img src={editoriumLogo} alt="EDITORIUM" className="h-12 sm:h-16 object-contain" style={{ filter: 'invert(1)' }} />
          <div className="flex items-center gap-3 mt-2">
            <span style={{ height: '1px', width: '40px', backgroundColor: '#cc0000' }} />
            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 500 }}>By Loopgate</p>
            <span style={{ height: '1px', width: '40px', backgroundColor: '#cc0000' }} />
          </div>
        </div>
      </div>

      {/* ═══ SEARCH BAR ═══ */}
      <div style={{ borderBottom: '1px solid #e5e5e5' }} className="py-3">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#999' }} />
            <input
              type="text"
              placeholder="Search articles, artists, units..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 outline-none"
              style={{ backgroundColor: '#f8f8f8', border: '1px solid #e5e5e5', fontSize: '13px', color: '#111', fontFamily: "'Inter', sans-serif" }}
            />
          </div>
        </div>
      </div>

      {/* ═══ CATEGORY TABS ═══ */}
      <div style={{ borderBottom: '1px solid #e5e5e5' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="shrink-0 py-3 px-4 transition-colors relative"
                style={{
                  fontSize: '11px',
                  fontWeight: activeCategory === cat ? 700 : 500,
                  color: activeCategory === cat ? '#cc0000' : '#888',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {cat}
                {activeCategory === cat && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: '#cc0000' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#ddd', borderTopColor: '#cc0000' }} />
        </div>
      ) : (
        <>
          {/* ═══ BREAKING NEWS TICKER ═══ */}
          {breakingNews.length > 0 && (
            <div style={{ borderBottom: '1px solid #e5e5e5' }}>
              <div className="max-w-5xl mx-auto px-4 py-3">
                <div className="flex items-start gap-4">
                  <span className="shrink-0 px-2.5 py-1 font-bold" style={{ backgroundColor: '#cc0000', color: '#fff', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Breaking
                  </span>
                  <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-6">
                      {breakingNews.slice(0, 4).map(article => (
                        <Link key={article.id} to={`/editorium/${article.slug}`} className="shrink-0 max-w-[260px] group">
                          <p style={{ fontSize: '11px', color: '#999', fontWeight: 500 }}>
                            {article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : ''}
                          </p>
                          <p className="line-clamp-2 group-hover:underline" style={{ fontSize: '14px', fontWeight: 700, color: '#111', lineHeight: 1.3, marginTop: '2px' }}>
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

          {/* Fallback ticker from trending if no breaking articles */}
          {breakingNews.length === 0 && trending.length > 1 && (
            <div style={{ borderBottom: '1px solid #e5e5e5' }}>
              <div className="max-w-5xl mx-auto px-4 py-3">
                <div className="flex items-start gap-4">
                  <span className="shrink-0 px-2.5 py-1 font-bold" style={{ backgroundColor: '#cc0000', color: '#fff', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Now
                  </span>
                  <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-6">
                      {trending.slice(0, 4).map(article => (
                        <Link key={article.id} to={`/editorium/${article.slug}`} className="shrink-0 max-w-[260px] group">
                          <p style={{ fontSize: '11px', color: '#999', fontWeight: 500 }}>
                            {article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : ''}
                          </p>
                          <p className="line-clamp-2 group-hover:underline" style={{ fontSize: '14px', fontWeight: 700, color: '#111', lineHeight: 1.3, marginTop: '2px' }}>
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

            {/* ═══ DAILY COVER / HERO ═══ */}
            {dailyCover && (
              <Link to={`/editorium/${dailyCover.slug}`} className="block group mb-10">
                <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden">
                  {dailyCover.cover_image_url ? (
                    <>
                      <div className="aspect-[16/9] sm:aspect-[2/1] overflow-hidden relative">
                        <img src={dailyCover.cover_image_url} alt={dailyCover.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 text-white font-bold" style={{ backgroundColor: '#cc0000', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                            {dailyCover.is_daily_cover ? 'Daily Cover' : dailyCover.category === 'press_release' ? 'Press Release' : 'Featured'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-4">
                        {dailyCover.unit_name && (
                          <div className="flex items-center gap-2 mb-1">
                            {dailyCover.unit_avatar && <img src={dailyCover.unit_avatar} className="w-4 h-4 rounded-full" alt="" />}
                            <span style={{ fontSize: '10px', color: '#cc0000', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>{dailyCover.unit_name}</span>
                          </div>
                        )}
                        <h2 className="font-display text-3xl sm:text-5xl leading-tight group-hover:underline" style={{ color: '#111', textDecorationColor: '#cc0000' }}>{dailyCover.title}</h2>
                        {dailyCover.subtitle && (
                          <p style={{ color: '#555', fontSize: '15px', marginTop: '6px', maxWidth: '700px' }}>{dailyCover.subtitle}</p>
                        )}
                        <div className="flex items-center gap-3 mt-3" style={{ fontSize: '11px', color: '#999' }}>
                          <span style={{ fontWeight: 600, color: '#333' }}>{dailyCover.author_name}</span>
                          {dailyCover.published_at && <span>{formatDistanceToNow(new Date(dailyCover.published_at), { addSuffix: true })}</span>}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{dailyCover.read_time_minutes || 5} min</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{inflateViews(dailyCover.view_count)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-6" style={{ borderBottom: '2px solid #111' }}>
                      <h2 className="font-display text-4xl group-hover:underline" style={{ color: '#111' }}>{dailyCover.title}</h2>
                      {dailyCover.subtitle && <p style={{ fontSize: '15px', color: '#666', marginTop: '6px' }}>{dailyCover.subtitle}</p>}
                    </div>
                  )}
                </motion.article>
              </Link>
            )}

            {/* ═══ TRENDING ═══ */}
            {trending.length > 0 && (
              <div className="mb-10">
                <SectionBar>
                  <Flame className="w-4 h-4" style={{ color: '#cc0000' }} />
                  <h3 className="font-display text-lg" style={{ color: '#111', letterSpacing: '0.05em' }}>Trending Now</h3>
                  <span className="ml-auto" style={{ fontSize: '10px', color: '#999' }}>{trending.length} stories</span>
                </SectionBar>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {trending.map((article, i) => (
                    <CardSmall key={article.id} article={article} i={i} />
                  ))}
                  {trending.length < 4 && ['Coming Soon', 'Awaiting Story', 'Next Drop'].slice(0, 4 - trending.length).map(label => (
                    <EmptySlot key={label} label={label} />
                  ))}
                </div>
              </div>
            )}

            {/* ═══ UNIT COVERAGE ═══ */}
            {unitCoverage.length > 0 && (
              <div className="mb-10">
                <SectionBar>
                  <Users2 className="w-4 h-4" style={{ color: '#cc0000' }} />
                  <h3 className="font-display text-lg" style={{ color: '#111', letterSpacing: '0.05em' }}>Unit Coverage</h3>
                  <span className="ml-auto" style={{ fontSize: '10px', color: '#999' }}>{unitCoverage.length} stories</span>
                </SectionBar>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {unitCoverage.slice(0, 6).map((article, i) => (
                    <Link key={article.id} to={`/editorium/${article.slug}`} className="group">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <div className="aspect-[16/10] overflow-hidden relative" style={{ backgroundColor: '#f0f0f0' }}>
                          {article.cover_image_url ? (
                            <img src={article.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <img src={editoriumLogo} alt="" className="w-16 opacity-[0.06]" style={{ filter: 'invert(1)' }} />
                            </div>
                          )}
                        </div>
                        <div className="pt-3">
                          <div className="flex items-center gap-2 mb-1">
                            {article.unit_avatar && <img src={article.unit_avatar} className="w-4 h-4 rounded-full" alt="" />}
                            <span style={{ fontSize: '10px', color: '#cc0000', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{article.unit_name}</span>
                          </div>
                          <h4 className="font-display text-base leading-snug line-clamp-2 group-hover:underline" style={{ color: '#111', textDecorationColor: '#cc0000' }}>
                            {article.title}
                          </h4>
                          {article.excerpt && (
                            <p className="line-clamp-2 mt-1" style={{ fontSize: '12px', color: '#666', lineHeight: 1.4 }}>{article.excerpt}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5" style={{ fontSize: '10px', color: '#999' }}>
                            <span>{article.author_name}</span>
                            <span>·</span>
                            <span>{inflateViews(article.view_count)} views</span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ PRESS RELEASES ═══ */}
            {pressReleases.length > 0 && (
              <div className="mb-10">
                <SectionBar>
                  <Megaphone className="w-4 h-4" style={{ color: '#cc0000' }} />
                  <h3 className="font-display text-lg" style={{ color: '#111', letterSpacing: '0.05em' }}>Press Releases</h3>
                </SectionBar>
                <div className="space-y-0">
                  {pressReleases.slice(0, 5).map((article, i) => (
                    <ArticleRow key={article.id} article={article} i={i} />
                  ))}
                </div>
              </div>
            )}

            {/* ═══ CULTURE & ARTISTS ═══ */}
            {cultureStories.length > 0 && (
              <div className="mb-10">
                <SectionBar>
                  <Sparkles className="w-4 h-4" style={{ color: '#cc0000' }} />
                  <h3 className="font-display text-lg" style={{ color: '#111', letterSpacing: '0.05em' }}>Culture & Artists</h3>
                  <span className="ml-auto" style={{ fontSize: '10px', color: '#999' }}>{cultureStories.length} features</span>
                </SectionBar>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {cultureStories.slice(0, 6).map((article, i) => (
                    <CardSmall key={article.id} article={article} i={i} />
                  ))}
                  {cultureStories.length < 3 && ['Artist Spotlight', 'Culture Feature'].slice(0, 3 - cultureStories.length).map(label => (
                    <EmptySlot key={label} label={label} />
                  ))}
                </div>
              </div>
            )}

            {/* ═══ LATEST ═══ */}
            {latest.length > 0 && (
              <div className="mb-10">
                <SectionBar>
                  <TrendingUp className="w-4 h-4" style={{ color: '#cc0000' }} />
                  <h3 className="font-display text-lg" style={{ color: '#111', letterSpacing: '0.05em' }}>Latest</h3>
                </SectionBar>
                <div className="space-y-0">
                  {latest.map((article, i) => (
                    <ArticleRow key={article.id} article={article} i={i} />
                  ))}
                </div>
              </div>
            )}

            {/* ═══ EMPTY STATE ═══ */}
            {articles.length === 0 && (
              <div className="mb-10">
                <SectionBar>
                  <Newspaper className="w-4 h-4" style={{ color: '#cc0000' }} />
                  <h3 className="font-display text-lg" style={{ color: '#111' }}>Featured Stories</h3>
                </SectionBar>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {['Press Release', 'Artist Feature', 'Unit Spotlight', 'Breaking News', 'Culture Report'].map((label, i) => (
                    <div key={i} className="shrink-0 w-[220px]">
                      <div className="h-32 flex items-center justify-center relative" style={{ backgroundColor: '#f5f5f5', border: '1px dashed #ddd' }}>
                        <Newspaper className="w-6 h-6" style={{ color: '#ddd' }} />
                        {i === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5" style={{ backgroundColor: '#cc0000', color: '#fff', fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Next Up
                          </span>
                        )}
                      </div>
                      <div className="pt-2.5">
                        <span style={{ fontSize: '9px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>{label}</span>
                        <div className="mt-1.5 h-3 rounded-sm" style={{ backgroundColor: '#f0f0f0', width: `${80 - i * 8}%` }} />
                        <div className="mt-1 h-3 rounded-sm" style={{ backgroundColor: '#f0f0f0', width: `${55 - i * 5}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ FOOTER ═══ */}
            <div className="text-center py-8" style={{ borderTop: '2px solid #111' }}>
              <img src={editoriumLogo} alt="" className="h-6 mx-auto" style={{ filter: 'invert(1)', opacity: 0.4 }} />
              <p style={{ fontSize: '10px', color: '#888', marginTop: '8px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Press · Culture · Community · Artists · Film · Games
              </p>
              <p style={{ fontSize: '9px', color: '#999', marginTop: '4px' }}>© 2026 Loopgate Editorium. All rights reserved.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
