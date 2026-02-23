import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Eye, Calendar, Share2, Users2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import editoriumLogo from '@/assets/editorium-logo.png';

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

  // Force white background on parent containers
  useEffect(() => {
    document.documentElement.classList.add('editorium-active');
    document.body.classList.add('editorium-active');
    return () => {
      document.documentElement.classList.remove('editorium-active');
      document.body.classList.remove('editorium-active');
    };
  }, []);

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fff' }}>
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#ddd', borderTopColor: '#cc0000' }} />
      </div>
    );
  }

  if (!article) return null;

  const heroImg = article.header_image_url || article.cover_image_url;

  return (
    <div className="editorium-white min-h-screen pb-20">
      <SEO
        title={article.seo_title || article.title}
        description={article.seo_description || article.subtitle || `Read about ${article.title} on LOOPGATE Editorium`}
        type="article"
      />

      {/* ═══ TOP NAV BAR ═══ */}
      <div style={{ borderBottom: '3px solid #111' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/editorium" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4" style={{ color: '#666' }} />
            <img src={editoriumLogo} alt="EDITORIUM" className="h-6" style={{ filter: 'invert(1)' }} />
          </Link>
          <button onClick={handleShare} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity" style={{ fontSize: '11px', color: '#666', fontWeight: 600 }}>
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* ═══ HERO IMAGE ═══ */}
      {heroImg && (
        <div className="relative aspect-[16/8] max-h-[500px] overflow-hidden">
          <img src={heroImg} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* ═══ ARTICLE CONTENT ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto px-4"
      >
        <div className="pt-6">
          {/* Section label */}
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: '10px', color: '#cc0000', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 }}>Editorium</span>
            {article.tags && article.tags.length > 0 && (
              <>
                <span style={{ color: '#ccc' }}>·</span>
                <span style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  {article.tags[0]}
                </span>
              </>
            )}
          </div>

          <h1 
            className="font-display text-4xl md:text-5xl leading-tight"
            style={{ color: '#111' }}
          >
            {article.title}
          </h1>

          {article.subtitle && (
            <p style={{ 
              fontSize: '17px', 
              color: '#555', 
              marginTop: '10px',
              lineHeight: 1.5 
            }}>
              {article.subtitle}
            </p>
          )}
        </div>

        {/* ═══ META BAR ═══ */}
        <div 
          className="flex items-center flex-wrap gap-3 mt-6 pb-4"
          style={{ borderBottom: '1px solid #e5e5e5', fontSize: '12px', color: '#888' }}
        >
          <span style={{ fontWeight: 700, color: '#111' }}>{article.author_name}</span>
          {article.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(article.published_at), 'MMM d, yyyy')}
            </span>
          )}
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.read_time_minutes || 5} min read</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{((article.view_count || 0) * 3 + 127).toLocaleString()} views</span>
        </div>

        {/* ═══ TAGS ═══ */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {article.tags.map(tag => (
              <span 
                key={tag} 
                className="px-2.5 py-0.5"
                style={{ fontSize: '9px', backgroundColor: '#f5f5f5', color: '#666', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600, border: '1px solid #e5e5e5' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ═══ BODY ═══ */}
        <div className="mt-8">
          {article.body.split('\n').map((paragraph, i) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return <div key={i} className="h-4" />;
            
            if (trimmed.startsWith('# ')) return <h2 key={i} className="font-display text-2xl mt-10 mb-3" style={{ color: '#111' }}>{trimmed.slice(2)}</h2>;
            if (trimmed.startsWith('## ')) return <h3 key={i} className="font-display text-xl mt-8 mb-2" style={{ color: '#111' }}>{trimmed.slice(3)}</h3>;
            
            if (trimmed.startsWith('> ')) return (
              <blockquote key={i} className="pl-4 my-5 italic" style={{ borderLeft: '3px solid #cc0000', fontSize: '16px', color: '#555', lineHeight: 1.7 }}>{trimmed.slice(2)}</blockquote>
            );
            
            if (trimmed.startsWith('![')) {
              const match = trimmed.match(/!\[([^\]]*)\]\(([^)]+)\)/);
              if (match) return <img key={i} src={match[2]} alt={match[1]} className="w-full my-6" />;
            }

            const isLikelyHeading = trimmed.length <= 60 && 
              !trimmed.endsWith('.') && !trimmed.endsWith(',') && !trimmed.endsWith('!') && !trimmed.endsWith('?') &&
              !trimmed.endsWith(':') && !trimmed.endsWith(';') &&
              !trimmed.startsWith('"') && !trimmed.startsWith("'") &&
              !trimmed.startsWith('—') && !trimmed.startsWith('-') &&
              trimmed.split(' ').length >= 2 && trimmed.split(' ').length <= 10;

            if (isLikelyHeading) {
              return <h3 key={i} className="font-display text-xl mt-8 mb-2" style={{ color: '#111' }}>{trimmed}</h3>;
            }

            if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
                (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
              return (
                <blockquote key={i} className="pl-4 my-5 italic" style={{ borderLeft: '3px solid #cc0000', color: '#555', fontSize: '16px', lineHeight: 1.7 }}>
                  {trimmed}
                </blockquote>
              );
            }

            const renderInlineFormatting = (text: string) => {
              const parts: React.ReactNode[] = [];
              let remaining = text;
              let key = 0;
              
              while (remaining.length > 0) {
                const urlMatch = remaining.match(/(https?:\/\/[^\s<>"']+)/);
                const boldMatch = remaining.match(/(\*\*|__)(.+?)\1/);
                const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/);
                
                const candidates = [
                  urlMatch && urlMatch.index !== undefined ? { type: 'url', match: urlMatch, idx: urlMatch.index } : null,
                  boldMatch && boldMatch.index !== undefined ? { type: 'bold', match: boldMatch, idx: boldMatch.index } : null,
                  italicMatch && italicMatch.index !== undefined ? { type: 'italic', match: italicMatch, idx: italicMatch.index } : null,
                ].filter(Boolean).sort((a, b) => a!.idx - b!.idx);
                
                if (candidates.length === 0) {
                  parts.push(<span key={key++}>{remaining}</span>);
                  break;
                }
                
                const winner = candidates[0]!;
                if (winner.idx > 0) {
                  parts.push(<span key={key++}>{remaining.slice(0, winner.idx)}</span>);
                }
                
                if (winner.type === 'url') {
                  const url = winner.match[1];
                  parts.push(
                    <a key={key++} href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#cc0000', textDecoration: 'underline' }} className="hover:opacity-70 break-all cursor-pointer">
                      {url}
                    </a>
                  );
                  remaining = remaining.slice(winner.idx + winner.match[0].length);
                } else if (winner.type === 'bold') {
                  parts.push(<strong key={key++} style={{ color: '#111', fontWeight: 700 }}>{winner.match[2]}</strong>);
                  remaining = remaining.slice(winner.idx + winner.match[0].length);
                } else {
                  parts.push(<em key={key++} className="italic">{winner.match[1] || winner.match[2]}</em>);
                  remaining = remaining.slice(winner.idx + winner.match[0].length);
                }
              }
              
              return parts.length === 1 && typeof parts[0] === 'string' ? text : <>{parts}</>;
            };

            if (trimmed.startsWith('—')) {
              return (
                <p key={i} className="italic pl-4 mt-1 mb-5" style={{ fontSize: '13px', color: '#999' }}>{trimmed}</p>
              );
            }

            return <p key={i} className="mb-5" style={{ fontSize: '16px', color: '#333', lineHeight: 1.85, fontFamily: "'Inter', sans-serif" }}>{renderInlineFormatting(trimmed)}</p>;
          })}
        </div>

        {/* ═══ FEATURED UNIT ═══ */}
        {unit && (
          <Link to={`/units/${unit.id}`} className="block mt-12 mb-6">
            <div className="p-5 hover:shadow-md transition-shadow" style={{ border: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: '9px', color: '#cc0000', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 }}>Featured Unit</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                {unit.avatar_url ? (
                  <img src={unit.avatar_url} className="w-12 h-12 rounded-full" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#eee' }}>
                    <Users2 className="w-5 h-5" style={{ color: '#bbb' }} />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-display text-lg" style={{ color: '#111' }}>{unit.name}</h3>
                  <p style={{ fontSize: '12px', color: '#888' }}>{unit.member_count} members</p>
                </div>
              </div>
              {unit.description && (
                <p className="line-clamp-2 mt-2" style={{ fontSize: '13px', color: '#666' }}>{unit.description}</p>
              )}
            </div>
          </Link>
        )}
      </motion.div>
    </div>
  );
}
