import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Save, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
}

interface UnitOption {
  id: string;
  name: string;
}

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
};

export default function EditoriumAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
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
    });
    setShowEditor(true);
  }

  async function handleSave(publishNow: boolean) {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    setSaving(true);

    const payload: any = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      excerpt: form.excerpt.trim() || null,
      body: form.body,
      cover_image_url: form.cover_image_url.trim() || null,
      header_image_url: form.header_image_url.trim() || null,
      unit_id: form.unit_id || null,
      author_name: form.author_name.trim() || 'LOOPGATE Editorial',
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      read_time_minutes: form.read_time_minutes,
      featured: form.featured,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      seo_keywords: form.seo_keywords.split(',').map(t => t.trim()).filter(Boolean),
      status: publishNow ? 'published' : 'draft',
    };

    if (editingId) {
      const { error } = await supabase.from('editorium_articles').update(payload).eq('id', editingId);
      if (error) toast.error('Failed to update');
      else toast.success(publishNow ? 'Published!' : 'Draft saved');
    } else {
      // Need slug placeholder - trigger will generate it
      payload.slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
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
    await supabase.from('editorium_articles').update({ status: newStatus }).eq('id', article.id);
    toast.success(newStatus === 'published' ? 'Published' : 'Unpublished');
    fetchArticles();
  }

  async function toggleFeatured(article: Article) {
    // Unfeature all others first
    if (!article.featured) {
      await supabase.from('editorium_articles').update({ featured: false }).eq('featured', true);
    }
    await supabase.from('editorium_articles').update({ featured: !article.featured }).eq('id', article.id);
    toast.success(article.featured ? 'Unfeatured' : 'Set as featured');
    fetchArticles();
  }

  async function deleteArticle(id: string) {
    if (!confirm('Delete this article?')) return;
    await supabase.from('editorium_articles').delete().eq('id', id);
    toast.success('Deleted');
    fetchArticles();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg">Editorium Articles</h3>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-background text-xs font-bold rounded-sm">
          <Plus className="w-3.5 h-3.5" /> New Article
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : articles.length === 0 ? (
        <p className="text-xs text-muted-foreground">No articles yet. Create your first feature.</p>
      ) : (
        <div className="space-y-2">
          {articles.map(article => (
            <div key={article.id} className="flex items-center gap-3 p-3 bg-surface-1 border border-border/50">
              {article.cover_image_url ? (
                <img src={article.cover_image_url} alt="" className="w-14 h-10 object-cover rounded-sm shrink-0" />
              ) : (
                <div className="w-14 h-10 bg-surface-2 rounded-sm shrink-0 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-muted-foreground/30" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{article.title}</p>
                  {article.featured && <Star className="w-3 h-3 text-gold fill-gold shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={article.status === 'published' ? 'default' : 'secondary'} className="text-[9px]">
                    {article.status}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground">/editorium/{article.slug}</span>
                  <span className="text-[9px] text-muted-foreground">{article.view_count || 0} views</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleFeatured(article)} className="p-1.5 hover:bg-gold/10 rounded-sm transition-colors" title="Toggle featured">
                  <Star className={`w-3.5 h-3.5 ${article.featured ? 'text-gold fill-gold' : 'text-muted-foreground'}`} />
                </button>
                <button onClick={() => toggleStatus(article)} className="p-1.5 hover:bg-surface-2 rounded-sm transition-colors" title="Toggle publish">
                  {article.status === 'published' ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button onClick={() => openEdit(article)} className="p-1.5 hover:bg-surface-2 rounded-sm transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => deleteArticle(article.id)} className="p-1.5 hover:bg-red-500/10 rounded-sm transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-0 border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? 'Edit Article' : 'New Article'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
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
              <Label className="text-xs">{'Body * (supports # headings, > quotes, ![alt](url) images)'}</Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={12} placeholder="Write your article here..." className="bg-surface-1 border-border font-mono text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Cover Image URL</Label>
                <Input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} placeholder="https://..." className="bg-surface-1 border-border" />
              </div>
              <div>
                <Label className="text-xs">Header/Hero Image URL</Label>
                <Input value={form.header_image_url} onChange={e => setForm(f => ({ ...f, header_image_url: e.target.value }))} placeholder="https://..." className="bg-surface-1 border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Featured Unit</Label>
                <select
                  value={form.unit_id}
                  onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}
                  className="w-full h-9 px-3 text-xs bg-surface-1 border border-border rounded-sm text-foreground"
                >
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

            {/* SEO */}
            <div className="border-t border-border/30 pt-3">
              <p className="text-[10px] text-gold uppercase tracking-widest font-bold mb-2">SEO</p>
              <div className="space-y-2">
                <Input value={form.seo_title} onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))} placeholder="SEO Title (max 60 chars)" maxLength={60} className="bg-surface-1 border-border text-xs" />
                <Textarea value={form.seo_description} onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))} placeholder="SEO Description (max 160 chars)" maxLength={160} rows={2} className="bg-surface-1 border-border text-xs" />
                <Input value={form.seo_keywords} onChange={e => setForm(f => ({ ...f, seo_keywords: e.target.value }))} placeholder="SEO Keywords (comma separated)" className="bg-surface-1 border-border text-xs" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="rounded" />
                Mark as hero featured
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => handleSave(false)} disabled={saving} className="flex-1 py-2 bg-surface-2 border border-border text-foreground text-xs font-bold rounded-sm hover:bg-surface-1 transition-colors">
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving} className="flex-1 py-2 bg-gold text-background text-xs font-bold rounded-sm hover:bg-gold/90 transition-colors">
                {saving ? 'Publishing...' : 'Publish Now'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
