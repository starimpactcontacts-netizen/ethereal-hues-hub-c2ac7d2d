import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Image as ImageIcon, Newspaper, Flame, Crown, Megaphone, Users2, Sparkles, Film, Music, Gamepad2, ChevronDown, ChevronUp, Upload, Wand2, Loader2, TrendingUp, Video, ExternalLink, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  header_image_url: string | null;
  unit_id: string | null;
  author_name: string;
  status: string;
  tags: string[] | null;
  read_time_minutes: number | null;
  view_count: number | null;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  category: string;
  priority: number;
  is_breaking: boolean;
  is_daily_cover: boolean;
}

interface UnitOption {
  id: string;
  name: string;
}

const ARTICLE_CATEGORIES = [
  { value: 'feature', label: 'Feature', icon: Sparkles, color: '#cc0000' },
  { value: 'daily_cover', label: 'Daily Cover', icon: Crown, color: '#d4a020' },
  { value: 'press_release', label: 'Press Release', icon: Megaphone, color: '#2563eb' },
  { value: 'breaking', label: 'Breaking News', icon: Flame, color: '#ef4444' },
  { value: 'artist_spotlight', label: 'Artist Spotlight', icon: Star, color: '#a855f7' },
  { value: 'unit_showcase', label: 'Unit Showcase', icon: Users2, color: '#10b981' },
  { value: 'film_review', label: 'Film & Cinema', icon: Film, color: '#f59e0b' },
  { value: 'music', label: 'Music Scene', icon: Music, color: '#ec4899' },
  { value: 'gaming', label: 'Game Culture', icon: Gamepad2, color: '#6366f1' },
  { value: 'opinion', label: 'Opinion / Editorial', icon: Newspaper, color: '#64748b' },
];

const emptyForm = {
  title: '',
  subtitle: '',
  excerpt: '',
  body: '',
  cover_image_url: '',
  header_image_url: '',
  unit_id: '',
  author_name: 'LOOPGATE Editorial',
  tags: '',
  read_time_minutes: 5,
  featured: false,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  category: 'feature',
  priority: 0,
  is_breaking: false,
  is_daily_cover: false,
};

async function uploadImage(file: File, prefix: string): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('editorium-images').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) { toast.error('Upload failed: ' + error.message); return null; }
  const { data } = supabase.storage.from('editorium-images').getPublicUrl(path);
  return data.publicUrl;
}

export default function EditoriumAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSeo, setShowSeo] = useState(false);
  const [polishing, setPolishing] = useState<string | null>(null);
  const [boostingId, setBoostingId] = useState<string | null>(null);
  const [boostAmount, setBoostAmount] = useState('');
  // File upload state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchArticles();
    fetchUnits();
  }, []);

  async function fetchArticles() {
    const { data } = await supabase
      .from('editorium_articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setArticles(data as Article[]);
    setLoading(false);
  }

  async function fetchUnits() {
    const { data } = await supabase.from('crews').select('id, name').order('name');
    if (data) setUnits(data);
  }

  function openCreate(preset?: string) {
    setEditingId(null);
    setForm({ ...emptyForm, category: preset || 'feature' });
    setCoverFile(null); setCoverPreview(null);
    setHeaderFile(null); setHeaderPreview(null);
    setShowEditor(true);
  }

  function openEdit(article: Article) {
    setEditingId(article.id);
    setForm({
      title: article.title,
      subtitle: article.subtitle || '',
      excerpt: article.excerpt || '',
      body: article.body,
      cover_image_url: article.cover_image_url || '',
      header_image_url: article.header_image_url || '',
      unit_id: article.unit_id || '',
      author_name: article.author_name,
      tags: (article.tags || []).join(', '),
      read_time_minutes: article.read_time_minutes || 5,
      featured: article.featured,
      seo_title: article.seo_title || '',
      seo_description: article.seo_description || '',
      seo_keywords: (article.seo_keywords || []).join(', '),
      category: article.category || 'feature',
      priority: article.priority || 0,
      is_breaking: article.is_breaking || false,
      is_daily_cover: article.is_daily_cover || false,
    });
    setCoverFile(null); setCoverPreview(article.cover_image_url || null);
    setHeaderFile(null); setHeaderPreview(article.header_image_url || null);
    setShowEditor(true);
  }

  function handleFileSelect(file: File, type: 'cover' | 'header') {
    const url = URL.createObjectURL(file);
    if (type === 'cover') { setCoverFile(file); setCoverPreview(url); }
    else { setHeaderFile(file); setHeaderPreview(url); }
  }

  async function handleSave(publishNow: boolean) {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    setSaving(true);

    // Upload images if new files selected
    let coverUrl = form.cover_image_url;
    let headerUrl = form.header_image_url;

    if (coverFile) {
      setUploading(true);
      const url = await uploadImage(coverFile, 'covers');
      if (url) coverUrl = url;
      setUploading(false);
    }
    if (headerFile) {
      setUploading(true);
      const url = await uploadImage(headerFile, 'headers');
      if (url) headerUrl = url;
      setUploading(false);
    }

    const payload: any = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      excerpt: form.excerpt.trim() || null,
      body: form.body,
      cover_image_url: coverUrl?.trim() || null,
      header_image_url: headerUrl?.trim() || null,
      unit_id: form.unit_id || null,
      author_name: form.author_name.trim() || 'LOOPGATE Editorial',
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      read_time_minutes: form.read_time_minutes,
      featured: form.featured,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      seo_keywords: form.seo_keywords.split(',').map(t => t.trim()).filter(Boolean),
      status: publishNow ? 'published' : 'draft',
      category: form.category,
      priority: form.priority,
      is_breaking: form.is_breaking,
      is_daily_cover: form.is_daily_cover,
    };

    if (publishNow && !editingId) {
      payload.published_at = new Date().toISOString();
    }

    if (editingId) {
      const { error } = await supabase.from('editorium_articles').update(payload).eq('id', editingId);
      if (error) toast.error('Failed to update');
      else toast.success(publishNow ? 'Published!' : 'Draft saved');
    } else {
      payload.slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
      const { error } = await supabase.from('editorium_articles').insert(payload);
      if (error) toast.error('Failed to create: ' + error.message);
      else toast.success(publishNow ? 'Published!' : 'Draft saved');
    }

    setSaving(false);
    setShowEditor(false);
    fetchArticles();
  }

  async function toggleStatus(article: Article) {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    const update: any = { status: newStatus };
    if (newStatus === 'published' && !article.published_at) update.published_at = new Date().toISOString();
    await supabase.from('editorium_articles').update(update).eq('id', article.id);
    toast.success(newStatus === 'published' ? 'Published' : 'Unpublished');
    fetchArticles();
  }

  async function toggleFeatured(article: Article) {
    if (!article.featured) {
      await supabase.from('editorium_articles').update({ featured: false }).eq('featured', true);
    }
    await supabase.from('editorium_articles').update({ featured: !article.featured }).eq('id', article.id);
    toast.success(article.featured ? 'Unfeatured' : 'Set as featured');
    fetchArticles();
  }

  async function toggleBreaking(article: Article) {
    await supabase.from('editorium_articles').update({ is_breaking: !article.is_breaking }).eq('id', article.id);
    toast.success(article.is_breaking ? 'Removed from breaking' : 'Added to breaking ticker');
    fetchArticles();
  }

  async function toggleDailyCover(article: Article) {
    if (!article.is_daily_cover) {
      await supabase.from('editorium_articles').update({ is_daily_cover: false }).eq('is_daily_cover', true);
    }
    await supabase.from('editorium_articles').update({ is_daily_cover: !article.is_daily_cover }).eq('id', article.id);
    toast.success(article.is_daily_cover ? 'Removed daily cover' : 'Set as daily cover');
    fetchArticles();
  }

  async function deleteArticle(id: string) {
    if (!confirm('Delete this article?')) return;
    await supabase.from('editorium_articles').delete().eq('id', id);
    toast.success('Deleted');
    fetchArticles();
  }

  // ═══ AUTO POLISH ═══
  async function autoPolish(article: Article) {
    setPolishing(article.id);
    try {
      const { data, error } = await supabase.functions.invoke('polish-article', {
        body: { title: article.title, body: article.body },
      });
      if (error) throw error;
      const polished = data?.polished;
      if (!polished) { toast.error('Polish failed — no response'); return; }

      // Calculate read time from word count
      const wordCount = polished.split(/\s+/).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 250));

      await supabase.from('editorium_articles').update({ body: polished, read_time_minutes: readTime }).eq('id', article.id);
      toast.success('Article polished ✨');
      fetchArticles();
    } catch (e: any) {
      toast.error('Polish failed: ' + e.message);
    } finally {
      setPolishing(null);
    }
  }

  async function boostViews(articleId: string) {
    const amount = parseInt(boostAmount);
    if (!amount || amount < 1) { toast.error('Enter a valid number'); return; }
    const article = articles.find(a => a.id === articleId);
    const newCount = (article?.view_count || 0) + amount;
    await supabase.from('editorium_articles').update({ view_count: newCount }).eq('id', articleId);
    toast.success(`+${amount} views added`);
    setBoostingId(null);
    setBoostAmount('');
    fetchArticles();
  }

  const getCategoryInfo = (cat: string) => ARTICLE_CATEGORIES.find(c => c.value === cat) || ARTICLE_CATEGORIES[0];

  const filtered = articles.filter(a => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    drafts: articles.filter(a => a.status === 'draft').length,
    breaking: articles.filter(a => a.is_breaking).length,
    dailyCover: articles.find(a => a.is_daily_cover),
  };

  // ═══ INDEXED EDITS STATE ═══
  const [indexedEdits, setIndexedEdits] = useState<any[]>([]);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editSearchResults, setEditSearchResults] = useState<any[]>([]);
  const [searchingEdits, setSearchingEdits] = useState(false);
  const [showEditIndexer, setShowEditIndexer] = useState(false);

  useEffect(() => {
    if (showEditIndexer) fetchIndexedEdits();
  }, [showEditIndexer]);

  async function fetchIndexedEdits() {
    const { data } = await supabase
      .from('featured_submissions')
      .select('*')
      .eq('is_editorium_indexed' as any, true)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setIndexedEdits(data);
  }

  async function searchEditsForIndex() {
    if (!editSearchQuery.trim()) return;
    setSearchingEdits(true);
    const { data } = await supabase
      .from('featured_submissions')
      .select('*')
      .or(`username.ilike.%${editSearchQuery}%,submission_url.ilike.%${editSearchQuery}%`)
      .not('rating', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);
    setEditSearchResults(data || []);
    setSearchingEdits(false);
  }

  async function toggleEditIndex(edit: any) {
    const newVal = !edit.is_editorium_indexed;
    await supabase.from('featured_submissions').update({ is_editorium_indexed: newVal }).eq('id', edit.id);
    toast.success(newVal ? 'Edit indexed on Editorium' : 'Edit removed from Editorium');
    fetchIndexedEdits();
    if (editSearchResults.length > 0) {
      setEditSearchResults(prev => prev.map(e => e.id === edit.id ? { ...e, is_editorium_indexed: newVal } : e));
    }
  }

  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg">Editorium</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats.total} articles · {stats.published} published · {stats.drafts} drafts · {stats.breaking} breaking
          </p>
        </div>
        <button onClick={() => openCreate()} className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-white text-xs font-bold">
          <Plus className="w-3.5 h-3.5" /> New Article
        </button>
      </div>

      {/* ═══ EDIT INDEXER — Feature edits on Editorium ═══ */}
      <div className="p-3 bg-surface-1 border border-purple-500/20">
        <button onClick={() => setShowEditIndexer(!showEditIndexer)} className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-400">Index Edits on Editorium</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {indexedEdits.length} indexed
            </span>
          </div>
          {showEditIndexer ? <ChevronUp className="w-3.5 h-3.5 text-purple-400" /> : <ChevronDown className="w-3.5 h-3.5 text-purple-400" />}
        </button>
        
        {showEditIndexer && (
          <div className="mt-3 space-y-3">
            {/* Search for edits */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <input
                  value={editSearchQuery}
                  onChange={e => setEditSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchEditsForIndex()}
                  placeholder="Search by username or URL..."
                  className="w-full h-8 pl-8 pr-3 text-[11px] bg-surface-0 border border-border text-foreground"
                />
              </div>
              <button onClick={searchEditsForIndex} disabled={searchingEdits} className="px-3 h-8 text-[10px] font-bold bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/20">
                {searchingEdits ? '...' : 'Search'}
              </button>
            </div>

            {/* Search results */}
            {editSearchResults.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Search Results</p>
                {editSearchResults.map(edit => (
                  <div key={edit.id} className="flex items-center gap-2 p-2 bg-surface-0 border border-border/40">
                    {edit.thumbnail_url ? (
                      <img src={edit.thumbnail_url} alt="" className="w-12 h-8 object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-8 bg-surface-2 shrink-0 flex items-center justify-center">
                        <Video className="w-3 h-3 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">@{edit.username}</p>
                      <div className="flex items-center gap-2">
                        {edit.rating && <span className="text-[9px] font-bold text-gold">{edit.rating}</span>}
                        <span className="text-[9px] text-muted-foreground">{edit.platform || 'unknown'}</span>
                        <a href={edit.submission_url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-purple-400 hover:underline flex items-center gap-0.5">
                          View <ExternalLink className="w-2 h-2" />
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleEditIndex(edit)}
                      className={`px-2 py-1 text-[9px] font-bold transition-colors ${
                        edit.is_editorium_indexed
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-500/30'
                          : 'bg-surface-2 text-muted-foreground border border-border hover:border-purple-500/50'
                      }`}
                    >
                      {edit.is_editorium_indexed ? '✓ Indexed' : 'Index'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Currently indexed */}
            {indexedEdits.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Currently Indexed</p>
                {indexedEdits.map(edit => (
                  <div key={edit.id} className="flex items-center gap-2 p-2 bg-purple-500/5 border border-purple-500/10">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">@{edit.username}</p>
                      <span className="text-[9px] text-muted-foreground">{edit.rating || 'Unrated'} · {edit.platform || 'unknown'}</span>
                    </div>
                    <button onClick={() => toggleEditIndex(edit)} className="px-2 py-1 text-[9px] text-red-400 hover:bg-red-500/10 border border-border transition-colors">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ QUICK CREATE BY TYPE ═══ */}
      <div className="grid grid-cols-5 gap-1.5">
        {ARTICLE_CATEGORIES.slice(0, 5).map(cat => (
          <button
            key={cat.value}
            onClick={() => openCreate(cat.value)}
            className="flex flex-col items-center gap-1 py-2.5 px-1 bg-surface-1 border border-border/30 hover:border-border transition-colors group"
          >
            <cat.icon className="w-4 h-4 transition-colors" style={{ color: cat.color }} />
            <span className="text-[9px] text-muted-foreground group-hover:text-foreground font-medium text-center leading-tight">{cat.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {ARTICLE_CATEGORIES.slice(5).map(cat => (
          <button
            key={cat.value}
            onClick={() => openCreate(cat.value)}
            className="flex flex-col items-center gap-1 py-2.5 px-1 bg-surface-1 border border-border/30 hover:border-border transition-colors group"
          >
            <cat.icon className="w-4 h-4 transition-colors" style={{ color: cat.color }} />
            <span className="text-[9px] text-muted-foreground group-hover:text-foreground font-medium text-center leading-tight">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* ═══ DAILY COVER STATUS ═══ */}
      <div className="p-3 bg-surface-1 border border-gold/20">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-gold" />
          <span className="text-xs font-bold text-gold">Daily Cover</span>
        </div>
        {stats.dailyCover ? (
          <p className="text-xs text-foreground mt-1 truncate">{stats.dailyCover.title}</p>
        ) : (
          <p className="text-[10px] text-muted-foreground mt-1">No daily cover set — assign one from the list below</p>
        )}
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="h-7 px-2 text-[10px] bg-surface-1 border border-border rounded-sm text-foreground"
        >
          <option value="all">All Categories</option>
          {ARTICLE_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-7 px-2 text-[10px] bg-surface-1 border border-border rounded-sm text-foreground"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} results</span>
      </div>

      {/* ═══ ARTICLE LIST ═══ */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No articles match filters.</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(article => {
            const catInfo = getCategoryInfo(article.category);
            return (
              <div key={article.id} className="flex items-center gap-3 p-2.5 bg-surface-1 border border-border/50 hover:border-border/80 transition-colors">
                {article.cover_image_url ? (
                  <img src={article.cover_image_url} alt="" className="w-16 h-11 object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-11 bg-surface-2 shrink-0 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <catInfo.icon className="w-3 h-3 shrink-0" style={{ color: catInfo.color }} />
                    <p className="text-xs font-semibold text-foreground truncate">{article.title}</p>
                    {article.featured && <Star className="w-3 h-3 text-gold fill-gold shrink-0" />}
                    {article.is_daily_cover && <Crown className="w-3 h-3 text-gold shrink-0" />}
                    {article.is_breaking && <Flame className="w-3 h-3 text-red-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <Badge variant={article.status === 'published' ? 'default' : 'secondary'} className="text-[8px] h-4">
                      {article.status}
                    </Badge>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: catInfo.color + '18', color: catInfo.color, fontWeight: 600 }}>
                      {catInfo.label}
                    </span>
                    <button 
                      onClick={() => { setBoostingId(boostingId === article.id ? null : article.id); setBoostAmount(''); }}
                      className="text-[9px] text-muted-foreground hover:text-emerald-400 transition-colors flex items-center gap-0.5"
                      title="Boost views"
                    >
                      <TrendingUp className="w-2.5 h-2.5" />
                      {(article.view_count || 0).toLocaleString()} views
                    </button>
                    {article.published_at && (
                      <span className="text-[9px] text-muted-foreground">{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
                    )}
                  </div>
                  {boostingId === article.id && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        value={boostAmount}
                        onChange={e => setBoostAmount(e.target.value)}
                        placeholder="+ views"
                        className="w-20 h-5 px-1.5 text-[9px] bg-surface-2 border border-border text-foreground"
                        min="1"
                        autoFocus
                      />
                      <button onClick={() => boostViews(article.id)} className="h-5 px-2 text-[8px] font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                        ADD
                      </button>
                      <button onClick={() => setBoostingId(null)} className="h-5 px-1.5 text-[8px] text-muted-foreground hover:text-foreground">✕</button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {/* Auto Polish button */}
                  {article.status === 'published' && (
                    <button
                      onClick={() => autoPolish(article)}
                      disabled={polishing === article.id}
                      className="p-1.5 rounded-sm transition-colors hover:bg-purple-500/10"
                      title="Auto Polish"
                    >
                      {polishing === article.id ? (
                        <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3 text-purple-400" />
                      )}
                    </button>
                  )}
                  <button onClick={() => toggleDailyCover(article)} className={`p-1.5 rounded-sm transition-colors ${article.is_daily_cover ? 'bg-gold/20' : 'hover:bg-surface-2'}`} title="Daily cover">
                    <Crown className={`w-3 h-3 ${article.is_daily_cover ? 'text-gold' : 'text-muted-foreground/50'}`} />
                  </button>
                  <button onClick={() => toggleBreaking(article)} className={`p-1.5 rounded-sm transition-colors ${article.is_breaking ? 'bg-red-500/20' : 'hover:bg-surface-2'}`} title="Breaking news">
                    <Flame className={`w-3 h-3 ${article.is_breaking ? 'text-red-400' : 'text-muted-foreground/50'}`} />
                  </button>
                  <button onClick={() => toggleFeatured(article)} className={`p-1.5 rounded-sm transition-colors ${article.featured ? 'bg-gold/20' : 'hover:bg-surface-2'}`} title="Hero featured">
                    <Star className={`w-3 h-3 ${article.featured ? 'text-gold fill-gold' : 'text-muted-foreground/50'}`} />
                  </button>
                  <button onClick={() => toggleStatus(article)} className="p-1.5 hover:bg-surface-2 rounded-sm transition-colors" title="Toggle publish">
                    {article.status === 'published' ? <EyeOff className="w-3 h-3 text-muted-foreground" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                  </button>
                  <button onClick={() => openEdit(article)} className="p-1.5 hover:bg-surface-2 rounded-sm transition-colors">
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteArticle(article.id)} className="p-1.5 hover:bg-red-500/10 rounded-sm transition-colors">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ EDITOR MODAL ═══ */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-0 border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? 'Edit Article' : 'New Article'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Category selector */}
            <div>
              <Label className="text-xs mb-1.5 block">Article Type</Label>
              <div className="grid grid-cols-5 gap-1">
                {ARTICLE_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                    className={`flex flex-col items-center gap-0.5 py-2 px-1 border transition-colors ${form.category === cat.value ? 'border-foreground bg-surface-2' : 'border-border/30 bg-surface-1 hover:border-border'}`}
                  >
                    <cat.icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                    <span className="text-[8px] font-medium text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Flags row */}
            <div className="flex items-center gap-4 p-2.5 bg-surface-1 border border-border/30">
              <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                <input type="checkbox" checked={form.is_daily_cover} onChange={e => setForm(f => ({ ...f, is_daily_cover: e.target.checked }))} className="rounded" />
                <Crown className="w-3 h-3 text-gold" />
                Daily Cover
              </label>
              <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                <input type="checkbox" checked={form.is_breaking} onChange={e => setForm(f => ({ ...f, is_breaking: e.target.checked }))} className="rounded" />
                <Flame className="w-3 h-3 text-red-400" />
                Breaking News
              </label>
              <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="rounded" />
                <Star className="w-3 h-3 text-gold" />
                Hero Featured
              </label>
              <div className="ml-auto flex items-center gap-1">
                <Label className="text-[9px] text-muted-foreground">Priority</Label>
                <Input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))} className="w-14 h-6 text-[10px] bg-surface-0 border-border" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="The Rise of Elite Editing Units" className="bg-surface-1 border-border" />
            </div>
            <div>
              <Label className="text-xs">Subtitle</Label>
              <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="How competitive editing crews are reshaping digital culture" className="bg-surface-1 border-border" />
            </div>
            <div>
              <Label className="text-xs">Excerpt (preview text)</Label>
              <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} placeholder="A brief summary shown in article listings..." className="bg-surface-1 border-border" />
            </div>
            <div>
              <Label className="text-xs">{'Body * (# headings, > quotes, **bold**, *italic*, ![alt](url) images)'}</Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={12} placeholder="Write your article here..." className="bg-surface-1 border-border font-mono text-xs" />
            </div>

            {/* ═══ IMAGE UPLOAD SECTION ═══ */}
            <div className="grid grid-cols-2 gap-3">
              {/* Cover Image */}
              <div>
                <Label className="text-xs mb-1.5 block">Cover Image</Label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, 'cover'); }}
                />
                {coverPreview || form.cover_image_url ? (
                  <div className="relative group">
                    <img src={coverPreview || form.cover_image_url} alt="" className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => coverInputRef.current?.click()} className="px-2 py-1 bg-white/20 text-white text-[10px] font-bold backdrop-blur-sm">
                        Replace
                      </button>
                      <button onClick={() => { setCoverFile(null); setCoverPreview(null); setForm(f => ({ ...f, cover_image_url: '' })); }} className="px-2 py-1 bg-red-500/40 text-white text-[10px] font-bold backdrop-blur-sm">
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-border/50 hover:border-border bg-surface-1 flex flex-col items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground">Drop or click to upload</span>
                  </button>
                )}
              </div>

              {/* Header/Hero Image */}
              <div>
                <Label className="text-xs mb-1.5 block">Header / Hero Image</Label>
                <input
                  ref={headerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, 'header'); }}
                />
                {headerPreview || form.header_image_url ? (
                  <div className="relative group">
                    <img src={headerPreview || form.header_image_url} alt="" className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => headerInputRef.current?.click()} className="px-2 py-1 bg-white/20 text-white text-[10px] font-bold backdrop-blur-sm">
                        Replace
                      </button>
                      <button onClick={() => { setHeaderFile(null); setHeaderPreview(null); setForm(f => ({ ...f, header_image_url: '' })); }} className="px-2 py-1 bg-red-500/40 text-white text-[10px] font-bold backdrop-blur-sm">
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => headerInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-border/50 hover:border-border bg-surface-1 flex flex-col items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground">Drop or click to upload</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Featured Unit</Label>
                <select value={form.unit_id} onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))} className="w-full h-9 px-3 text-xs bg-surface-1 border border-border rounded-sm text-foreground">
                  <option value="">None</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Author Name</Label>
                <Input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} className="bg-surface-1 border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tags (comma separated)</Label>
                <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="culture, units, featured" className="bg-surface-1 border-border" />
              </div>
              <div>
                <Label className="text-xs">Read Time (min)</Label>
                <Input type="number" value={form.read_time_minutes} onChange={e => setForm(f => ({ ...f, read_time_minutes: parseInt(e.target.value) || 5 }))} className="bg-surface-1 border-border" />
              </div>
            </div>

            {/* SEO Collapsible */}
            <button type="button" onClick={() => setShowSeo(!showSeo)} className="flex items-center gap-2 w-full border-t border-border/30 pt-3">
              <p className="text-[10px] text-gold uppercase tracking-widest font-bold">SEO Settings</p>
              {showSeo ? <ChevronUp className="w-3 h-3 text-gold" /> : <ChevronDown className="w-3 h-3 text-gold" />}
            </button>
            {showSeo && (
              <div className="space-y-2">
                <Input value={form.seo_title} onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))} placeholder="SEO Title (max 60 chars)" maxLength={60} className="bg-surface-1 border-border text-xs" />
                <Textarea value={form.seo_description} onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))} placeholder="SEO Description (max 160 chars)" maxLength={160} rows={2} className="bg-surface-1 border-border text-xs" />
                <Input value={form.seo_keywords} onChange={e => setForm(f => ({ ...f, seo_keywords: e.target.value }))} placeholder="SEO Keywords (comma separated)" className="bg-surface-1 border-border text-xs" />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={() => handleSave(false)} disabled={saving || uploading} className="flex-1 py-2.5 bg-surface-2 border border-border text-foreground text-xs font-bold hover:bg-surface-1 transition-colors">
                {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving || uploading} className="flex-1 py-2.5 bg-destructive text-white text-xs font-bold hover:bg-destructive/90 transition-colors">
                {uploading ? 'Uploading...' : saving ? 'Publishing...' : 'Publish Now'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
