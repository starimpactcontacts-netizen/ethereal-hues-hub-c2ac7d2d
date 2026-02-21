import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Eye, Calendar, Share2, Users2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import SEO from '@/components/SEO';

interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  body: string;
  cover_image_url: string | null;
  header_image_url: string | null;
  author_name: string;
  published_at: string | null;
  read_time_minutes: number | null;
  view_count: number | null;
  tags: string[] | null;
  unit_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
}

interface UnitInfo {
  id: string;
  name: string;
  avatar_url: string | null;
  member_count: number;
  description: string | null;
}

export default function EditoriumArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [unit, setUnit] = useState<UnitInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchArticle(slug);
  }, [slug]);

  async function fetchArticle(slug: string) {
    const { data } = await supabase
      .from('editorium_articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!data) {
      navigate('/editorium', { replace: true });
      return;
    }

    setArticle(data as Article);
    supabase.rpc('increment_editorium_views', { article_id: data.id });

    if (data.unit_id) {
      const { data: unitData } = await supabase
        .from('crews')
        .select('id, name, avatar_url, member_count, description')
        .eq('id', data.unit_id)
        .maybeSingle();
      if (unitData) setUnit(unitData);
    }

    setLoading(false);
  }

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) return null;

  const heroImg = article.header_image_url || article.cover_image_url;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <SEO
        title={article.seo_title || article.title}
        description={article.seo_description || article.subtitle || `Read about ${article.title} on LOOPGATE Editorium`}
        type="article"
      />

      {/* Hero Image */}
      {heroImg && (
        <div className="relative aspect-[16/8] max-h-[450px] overflow-hidden">
          <img src={heroImg} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          {/* Back button */}
          <Link to="/editorium" className="absolute top-4 left-4 z-10 flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-semibold">Editorium</span>
          </Link>
        </div>
      )}

      {/* Article Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4"
      >
        {/* Header */}
        <div className={heroImg ? '-mt-20 relative z-10' : 'pt-6'}>
          {/* Section label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-destructive uppercase tracking-[0.2em] font-bold">Editorium</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl text-foreground leading-tight">{article.title}</h1>

          {article.subtitle && (
            <p className="text-base text-muted-foreground mt-2">{article.subtitle}</p>
          )}

          {/* Meta */}
          <div className="flex items-center flex-wrap gap-3 mt-4 text-xs text-muted-foreground border-b border-border/40 pb-4">
            <span className="font-semibold text-foreground">{article.author_name}</span>
            {article.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(article.published_at), 'MMM d, yyyy')}
              </span>
            )}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.read_time_minutes || 5} min read</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{(article.view_count || 0).toLocaleString()} views</span>
            <button onClick={handleShare} className="flex items-center gap-1 hover:text-destructive transition-colors ml-auto">
              <Share2 className="w-3 h-3" />
              Share
            </button>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {article.tags.map(tag => (
                <span key={tag} className="text-[9px] bg-surface-1 border border-border/40 px-2 py-0.5 text-muted-foreground uppercase tracking-wider rounded-sm">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="mt-8">
          {article.body.split('\n').map((paragraph, i) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return <div key={i} className="h-4" />;
            if (trimmed.startsWith('# ')) return <h2 key={i} className="font-display text-2xl text-foreground mt-10 mb-3">{trimmed.slice(2)}</h2>;
            if (trimmed.startsWith('## ')) return <h3 key={i} className="font-display text-xl text-foreground mt-8 mb-2">{trimmed.slice(3)}</h3>;
            if (trimmed.startsWith('> ')) return (
              <blockquote key={i} className="border-l-2 border-destructive pl-4 my-5 text-muted-foreground italic text-base">{trimmed.slice(2)}</blockquote>
            );
            if (trimmed.startsWith('![')) {
              const match = trimmed.match(/!\[([^\]]*)\]\(([^)]+)\)/);
              if (match) return <img key={i} src={match[2]} alt={match[1]} className="w-full rounded-sm my-6" />;
            }
            return <p key={i} className="text-[15px] text-muted-foreground leading-[1.8] mb-5">{trimmed}</p>;
          })}
        </div>

        {/* Featured Unit Card */}
        {unit && (
          <Link to={`/units/${unit.id}`} className="block mt-12 mb-6">
            <div className="border border-border/40 bg-surface-1/50 p-5 hover:border-border transition-colors rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] text-destructive uppercase tracking-widest font-bold">Featured Unit</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                {unit.avatar_url ? (
                  <img src={unit.avatar_url} className="w-12 h-12 rounded-full" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                    <Users2 className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-display text-lg text-foreground">{unit.name}</h3>
                  <p className="text-xs text-muted-foreground">{unit.member_count} members</p>
                </div>
              </div>
              {unit.description && (
                <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{unit.description}</p>
              )}
            </div>
          </Link>
        )}
      </motion.div>
    </div>
  );
}
