import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, Eye, TrendingUp, Zap, MousePointerClick, Edit3, X, ChevronDown, ChevronUp, Copy, Bell, Check, RefreshCw, Music, FileText, ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useArtistCampaigns, useUpdateRequests } from '@/hooks/useArtistCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

async function uploadLogoFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('campaign-logos').upload(fileName, file, { upsert: true });
  if (error) throw new Error('Upload failed: ' + error.message);
  const { data: urlData } = supabase.storage.from('campaign-logos').getPublicUrl(fileName);
  return urlData.publicUrl;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

/* ─── Custom SVG Icons ─── */
function CampaignIcon({ className = '', size = 20 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function StatsIcon({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1" y="9" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.4" />
      <rect x="5.5" y="5" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.6" />
      <rect x="10" y="1" width="3" height="14" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function LinkIcon({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M6 10L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 11l1.5-1.5a2.83 2.83 0 000-4L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 5L5.5 6.5a2.83 2.83 0 000 4L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface FeaturedArtistOption {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  genre: string | null;
  verified: boolean | null;
}

interface ArtistSong {
  id: string;
  song_name: string;
  title: string;
}

export default function CampaignAdminPage() {
  const navigate = useNavigate();
  const { campaigns, edits, loading, createCampaign, updateCampaign, deleteCampaign, addEdit, updateEdit, deleteEdit, getEditsForCampaign, refresh } = useArtistCampaigns();
  const { requests, resolveRequest, refresh: refreshRequests } = useUpdateRequests();
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddEditForm, setShowAddEditForm] = useState<string | null>(null);
  const [editingStats, setEditingStats] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'requests'>('campaigns');
  const [artists, setArtists] = useState<FeaturedArtistOption[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [artistRes, clientRes] = await Promise.all([
          supabase.functions.invoke('manage-campaigns', { body: { action: 'get-featured-artists' } }),
          supabase.functions.invoke('manage-campaigns', { body: { action: 'get-client-names' } }),
        ]);
        setArtists(artistRes.data?.artists || []);
        setClientNames(clientRes.data?.names || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    }
    fetchData();
  }, []);

  const [newCampaign, setNewCampaign] = useState({ client_name: '', name: '', description: '', goal_views: 0, goal_posts: 0, goal_label: '', featured_artist_id: '', campaign_type: 'artist' as 'artist' | 'brand' | 'film', logo_url: '' });
  const [newEdit, setNewEdit] = useState({ title: '', video_url: '', thumbnail_url: '', platform: 'tiktok', editor_username: '', view_count: 0 });
  const [statsForm, setStatsForm] = useState({ total_views: 0, total_impressions: 0, total_engagements: 0, total_clicks: 0, roi_percentage: 0, goal_views: 0, goal_posts: 0, goal_label: '', incoming_note: '', campaign_type: 'artist', logo_url: '' });
  const [artistSongs, setArtistSongs] = useState<ArtistSong[]>([]);

  useEffect(() => {
    if (!newCampaign.featured_artist_id) { setArtistSongs([]); return; }
    async function fetchSongs() {
      try {
        const { data } = await supabase.from('featured_drops').select('id, song_name, title').eq('artist_id', newCampaign.featured_artist_id).order('created_at', { ascending: false });
        setArtistSongs(data || []);
      } catch (err) { console.error('Failed to fetch songs:', err); }
    }
    fetchSongs();
  }, [newCampaign.featured_artist_id]);

  const filteredClientNames = newCampaign.client_name.trim() ? clientNames.filter(n => n.toLowerCase().includes(newCampaign.client_name.toLowerCase())) : [];

  const handleCreateCampaign = async () => {
    if (!newCampaign.client_name.trim() || !newCampaign.name) { toast.error('Enter a client name and campaign name'); return; }
    try {
      const params: Record<string, unknown> = { ...newCampaign };
      if (!params.featured_artist_id) delete params.featured_artist_id;
      await createCampaign(params);
      toast.success('Campaign created');
      setNewCampaign({ client_name: '', name: '', description: '', goal_views: 0, goal_posts: 0, goal_label: '', featured_artist_id: '', campaign_type: 'artist', logo_url: '' });
      setShowCreateForm(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAddEdit = async (campaignId: string) => {
    if (!newEdit.title) { toast.error('Enter edit title'); return; }
    try {
      await addEdit({ campaign_id: campaignId, ...newEdit });
      toast.success('Edit added');
      setNewEdit({ title: '', video_url: '', thumbnail_url: '', platform: 'tiktok', editor_username: '', view_count: 0 });
      setShowAddEditForm(null);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateStats = async (campaignId: string) => {
    try { await updateCampaign(campaignId, statsForm); toast.success('Stats updated'); setEditingStats(null); } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Delete this campaign and all linked edits?')) return;
    try { await deleteCampaign(campaignId); toast.success('Campaign deleted'); } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteEdit = async (editId: string) => {
    if (!confirm('Remove this edit?')) return;
    try { await deleteEdit(editId); toast.success('Edit removed'); } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateEditViews = async (editId: string, view_count: number) => {
    try { await updateEdit(editId, { view_count }); toast.success('Views updated'); } catch (err: any) { toast.error(err.message); }
  };

  const copyCampaignLink = (slug: string | null) => {
    if (!slug) return;
    navigator.clipboard.writeText(`${window.location.origin}/campaign/${slug}`);
    toast.success('Campaign link copied!');
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-5 pb-8">
      {/* ═══ HEADER ═══ */}
      <div className="relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-card via-card to-card/80 p-5 sm:p-6">
        {/* Tactical corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-gold/20 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-gold/20 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-gold/20 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-gold/20 rounded-br-lg" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/ops-panel/a7c92ff31b')}
              className="w-9 h-9 flex items-center justify-center rounded border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
              aria-label="Back to admin panel"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <CampaignIcon className="text-gold" size={22} />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl tracking-wide uppercase text-foreground">
                  Campaign Manager
                </h1>
                <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">
                  Analytics · Edits · Client Portals
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { refresh(); refreshRequests(); }}
              className="h-9 px-3 flex items-center gap-2 rounded border border-border/50 bg-background/40 hover:bg-background/70 text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            {pendingRequests.length > 0 && (
              <button
                onClick={() => setActiveTab('requests')}
                className="h-9 px-3 flex items-center gap-2 rounded border border-gold/30 bg-gold/5 hover:bg-gold/10 text-xs text-gold transition-all animate-pulse"
              >
                <Bell className="w-3.5 h-3.5" />
                {pendingRequests.length} Request{pendingRequests.length > 1 ? 's' : ''}
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="h-9 px-4 flex items-center gap-2 rounded bg-gold hover:bg-gold/90 text-background text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_-4px_hsl(var(--gold)/0.3)]"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex rounded-lg overflow-hidden border border-border/40">
        {(['campaigns', 'requests'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] uppercase tracking-[0.12em] font-bold transition-all relative ${
              activeTab === tab
                ? 'bg-card text-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="campaign-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold"
              />
            )}
            {tab === 'requests' && pendingRequests.length > 0 ? (
              <span className="flex items-center justify-center gap-1.5">
                Requests
                <span className="w-4 h-4 rounded-full bg-gold text-background text-[8px] font-black flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              </span>
            ) : tab}
          </button>
        ))}
      </div>

      {/* ═══ REQUESTS TAB ═══ */}
      <AnimatePresence mode="wait">
        {activeTab === 'requests' && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-bold flex items-center gap-2">
                <Bell className="w-3 h-3 text-gold" /> Dashboard Update Requests
              </p>
              <button onClick={refreshRequests} className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            {requests.length === 0 ? (
              <div className="rounded-lg border border-border/30 bg-card/50 p-10 text-center">
                <Bell className="w-5 h-5 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No update requests yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map(req => {
                  const clientInfo = (req as any).enterprise_clients;
                  const isPending = req.status === 'pending';
                  return (
                    <div
                      key={req.id}
                      className={`rounded-lg border p-4 flex items-center gap-4 transition-all ${
                        isPending
                          ? 'border-gold/25 bg-gold/[0.03] hover:bg-gold/[0.06]'
                          : 'border-border/30 bg-card/30'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPending ? 'bg-gold animate-pulse' : 'bg-muted-foreground/20'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold">{clientInfo?.display_name || clientInfo?.email || 'Unknown'}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{req.message || 'Update requested'}</p>
                        <p className="text-[8px] text-muted-foreground/60 mt-0.5">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
                      </div>
                      {isPending ? (
                        <button
                          onClick={() => resolveRequest(req.id)}
                          className="h-7 px-3 rounded bg-gold text-background text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-gold/90 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Resolve
                        </button>
                      ) : (
                        <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">Resolved</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ CAMPAIGNS TAB ═══ */}
        {activeTab === 'campaigns' && (
          <motion.div
            key="campaigns"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {/* Create Campaign Form */}
            <AnimatePresence>
              {showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="rounded-lg border border-gold/20 bg-gradient-to-b from-gold/[0.04] to-transparent overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gold/10 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5 text-gold" />
                      </div>
                      <h3 className="font-display text-sm uppercase tracking-wider">Create Campaign</h3>
                    </div>

                    {/* Client Name */}
                    <div className="relative">
                      <label className="text-[8px] text-muted-foreground uppercase tracking-[0.12em] font-bold block mb-1.5">Client Name</label>
                      <Input
                        placeholder="Type client name..."
                        value={newCampaign.client_name}
                        onChange={e => { setNewCampaign(p => ({ ...p, client_name: e.target.value })); setShowClientSuggestions(true); }}
                        onFocus={() => setShowClientSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                        className="bg-background/60 border-border/40 h-10"
                      />
                      {showClientSuggestions && filteredClientNames.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 rounded-lg bg-card border border-border/50 max-h-32 overflow-y-auto shadow-xl">
                          {filteredClientNames.map(name => (
                            <button
                              key={name}
                              onMouseDown={() => { setNewCampaign(p => ({ ...p, client_name: name })); setShowClientSuggestions(false); }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-gold/10 text-foreground transition-colors"
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Campaign Type */}
                    <div>
                      <label className="text-[8px] text-muted-foreground uppercase tracking-[0.12em] font-bold block mb-1.5">Campaign Type</label>
                      <div className="flex gap-2">
                        {(['artist', 'brand', 'film'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setNewCampaign(p => ({ ...p, campaign_type: type }))}
                            className={`flex-1 h-10 rounded-md border text-xs font-bold uppercase tracking-wider transition-all ${
                              newCampaign.campaign_type === type
                                ? 'border-gold bg-gold/10 text-gold'
                                : 'border-border/40 bg-background/60 text-muted-foreground hover:border-border/60'
                            }`}
                          >
                            {type === 'artist' ? '🎵 Artist' : type === 'brand' ? '🏢 Brand' : '🎬 Film'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo URL (for brand/film) */}
                    {newCampaign.campaign_type !== 'artist' && (
                      <div>
                        <label className="text-[8px] text-muted-foreground uppercase tracking-[0.12em] font-bold block mb-1.5">
                          Company Logo URL
                        </label>
                        <Input
                          placeholder="https://example.com/logo.png"
                          value={newCampaign.logo_url}
                          onChange={e => setNewCampaign(p => ({ ...p, logo_url: e.target.value }))}
                          className="bg-background/60 border-border/40 h-10"
                        />
                        {newCampaign.logo_url && (
                          <div className="mt-2 flex items-center gap-2">
                            <img src={newCampaign.logo_url} alt="Logo preview" className="h-8 w-auto object-contain rounded border border-border/30 bg-background/60 p-1" />
                            <span className="text-[8px] text-muted-foreground">Preview</span>
                          </div>
                        )}
                      </div>
                    )}

                    {newCampaign.campaign_type === 'artist' ? (
                      <>
                        {/* Featured Artist — only for artist campaigns */}
                        <div>
                          <label className="text-[8px] text-muted-foreground uppercase tracking-[0.12em] font-bold block mb-1.5">Featured Artist</label>
                          <select
                            value={newCampaign.featured_artist_id}
                            onChange={e => setNewCampaign(p => ({ ...p, featured_artist_id: e.target.value, name: '' }))}
                            className="w-full bg-background/60 border border-border/40 rounded-md text-sm h-10 px-3 text-foreground"
                          >
                            <option value="">None (no artist profile)</option>
                            {artists.map(a => (
                              <option key={a.id} value={a.id}>{a.name}{a.genre ? ` · ${a.genre}` : ''}</option>
                            ))}
                          </select>
                        </div>

                        {/* Song — only for artist campaigns */}
                        <div>
                          <label className="text-[8px] text-muted-foreground uppercase tracking-[0.12em] font-bold block mb-1.5">Song</label>
                          {newCampaign.featured_artist_id && artistSongs.length > 0 ? (
                            <select
                              value={newCampaign.name}
                              onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))}
                              className="w-full bg-background/60 border border-border/40 rounded-md text-sm h-10 px-3 text-foreground"
                            >
                              <option value="">Select a song</option>
                              {artistSongs.map(s => (
                                <option key={s.id} value={s.song_name}>{s.song_name}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              placeholder={newCampaign.featured_artist_id ? 'No drops found — type manually' : 'Select an artist first or type manually'}
                              value={newCampaign.name}
                              onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))}
                              className="bg-background/60 border-border/40 h-10"
                            />
                          )}
                        </div>
                      </>
                    ) : (
                      /* Campaign Name — for brand/film campaigns */
                      <div>
                        <label className="text-[8px] text-muted-foreground uppercase tracking-[0.12em] font-bold block mb-1.5">Campaign Name</label>
                        <Input
                          placeholder={`e.g. ${newCampaign.campaign_type === 'brand' ? 'Summer Promo 2026' : 'Official Trailer Launch'}`}
                          value={newCampaign.name}
                          onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))}
                          className="bg-background/60 border-border/40 h-10"
                        />
                      </div>
                    )}

                    <Input
                      placeholder="Description (optional)"
                      value={newCampaign.description}
                      onChange={e => setNewCampaign(p => ({ ...p, description: e.target.value }))}
                      className="bg-background/60 border-border/40 h-10"
                    />

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: 'goal_views', label: 'Goal Views', placeholder: '1000000' },
                        { key: 'goal_posts', label: 'Goal Posts', placeholder: '20' },
                        { key: 'goal_label', label: 'Goal Label', placeholder: '1M Views by March', type: 'text' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="text-[8px] text-muted-foreground uppercase tracking-[0.12em] font-bold block mb-1.5">{f.label}</label>
                          <Input
                            type={f.type || 'number'}
                            placeholder={f.placeholder}
                            value={(newCampaign as any)[f.key] || ''}
                            onChange={e => setNewCampaign(p => ({ ...p, [f.key]: f.type === 'text' ? e.target.value : Number(e.target.value) }))}
                            className="bg-background/60 border-border/40 h-9 text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button onClick={handleCreateCampaign} className="h-9 px-5 rounded bg-gold hover:bg-gold/90 text-background text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_16px_-4px_hsl(var(--gold)/0.3)]">
                        Create Campaign
                      </button>
                      <button onClick={() => setShowCreateForm(false)} className="h-9 px-4 rounded border border-border/40 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Campaigns List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="rounded-lg border border-border/30 bg-card/40 p-12 text-center">
                <CampaignIcon className="text-muted-foreground/20 mx-auto mb-3" size={32} />
                <p className="text-sm text-muted-foreground">No campaigns yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Create one to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map(campaign => {
                  const campaignEdits = getEditsForCampaign(campaign.id);
                  const isExpanded = expandedCampaign === campaign.id;
                  const clientInfo = (campaign as any).enterprise_clients;
                  const artistInfo = (campaign as any).featured_artists;
                  const goalProgress = campaign.goal_views > 0 ? Math.min(100, (campaign.total_views / campaign.goal_views) * 100) : 0;
                  const postsProgress = (campaign as any).goal_posts > 0 ? Math.min(100, (campaignEdits.length / (campaign as any).goal_posts) * 100) : 0;
                          const campaignType = (campaign as any).campaign_type || 'artist';
                          const logoUrl = (campaign as any).logo_url;

                          return (
                    <motion.div
                      key={campaign.id}
                      layout
                      className={`rounded-lg border overflow-hidden transition-all ${
                        isExpanded ? 'border-gold/20 bg-card/80 shadow-[0_0_30px_-10px_hsl(var(--gold)/0.08)]' : 'border-border/30 bg-card/40 hover:border-border/60 hover:bg-card/60'
                      }`}
                    >
                      {/* Campaign Row */}
                      <div className="flex items-center gap-3 p-4">
                        <button
                          onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                          className="flex-1 flex items-center gap-3 text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-background/60 border border-border/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {logoUrl && campaignType !== 'artist' ? (
                              <img src={logoUrl} alt="" className="w-full h-full object-contain p-1" />
                            ) : artistInfo?.avatar_url ? (
                              <img src={artistInfo.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <CampaignIcon className="text-muted-foreground/40" size={18} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display text-sm sm:text-base tracking-wide uppercase truncate group-hover:text-gold transition-colors">
                                {campaign.name}
                              </span>
                              {artistInfo && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/8 border border-amber-500/15 text-amber-400/80 truncate max-w-[80px] flex items-center gap-0.5">
                                  <Music className="w-2.5 h-2.5" />{artistInfo.name}
                                </span>
                              )}
                              <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border ${
                                campaign.status === 'active' ? 'border-emerald-500/25 text-emerald-400 bg-emerald-500/8' :
                                campaign.status === 'completed' ? 'border-border/30 text-muted-foreground bg-muted/20' :
                                'border-yellow-500/25 text-yellow-400 bg-yellow-500/8'
                              }`}>{campaign.status}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border ${
                                campaignType === 'brand' ? 'border-blue-500/25 text-blue-400 bg-blue-500/8' :
                                campaignType === 'film' ? 'border-purple-500/25 text-purple-400 bg-purple-500/8' :
                                'border-amber-500/25 text-amber-400 bg-amber-500/8'
                              }`}>
                                {campaignType === 'brand' ? '🏢' : campaignType === 'film' ? '🎬' : '🎵'} {campaignType}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {(campaign as any).client_name || clientInfo?.display_name || clientInfo?.email || 'Unknown client'} · {campaignEdits.length} edits · {formatNumber(campaign.total_views)} views
                              {campaign.goal_views > 0 && ` · ${Math.round(goalProgress)}% to goal`}
                            </p>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {campaign.slug && (
                            <>
                              <button
                                onClick={() => copyCampaignLink(campaign.slug)}
                                className="h-7 px-2 rounded border border-cyan-500/20 text-cyan-400/80 hover:bg-cyan-500/10 text-[9px] flex items-center gap-1 transition-colors"
                                title="Copy Link"
                              >
                                <LinkIcon className="text-cyan-400/80" size={12} /> <span className="hidden sm:inline">Link</span>
                              </button>
                              <button
                                onClick={() => window.open(`/campaign/${campaign.slug}`, '_blank')}
                                className="h-7 px-2 rounded border border-emerald-500/20 text-emerald-400/80 hover:bg-emerald-500/10 text-[9px] flex items-center gap-1 transition-colors"
                                title="Open Dashboard"
                              >
                                <Eye className="w-3 h-3" /> <span className="hidden sm:inline">Portal</span>
                              </button>
                            </>
                          )}
                          {artistInfo?.slug && (
                            <button
                              onClick={() => window.open(`/artist/${artistInfo.slug}`, '_blank')}
                              className="h-7 px-2 rounded border border-amber-500/20 text-amber-400/80 hover:bg-amber-500/10 text-[9px] flex items-center gap-1 transition-colors"
                              title="View Artist"
                            >
                              <Music className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="h-7 w-7 rounded flex items-center justify-center text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Goal Progress */}
                      {(campaign.goal_views > 0 || (campaign as any).goal_posts > 0) && (
                        <div className="px-4 pb-3 space-y-1.5">
                          {campaign.goal_views > 0 && (
                            <div className="flex items-center gap-2">
                              <Eye className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                              <div className="h-1.5 rounded-full bg-background/60 overflow-hidden flex-1">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${goalProgress}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className="h-full rounded-full bg-gradient-to-r from-gold/50 to-gold"
                                />
                              </div>
                              <span className="text-[8px] text-muted-foreground/60 w-8 text-right font-mono">{Math.round(goalProgress)}%</span>
                            </div>
                          )}
                          {(campaign as any).goal_posts > 0 && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                              <div className="h-1.5 rounded-full bg-background/60 overflow-hidden flex-1">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${postsProgress}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-500/50 to-cyan-400"
                                />
                              </div>
                              <span className="text-[8px] text-muted-foreground/60 w-16 text-right font-mono">{campaignEdits.length}/{(campaign as any).goal_posts}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expanded Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/20 overflow-hidden"
                          >
                            {/* Campaign Slug */}
                            {campaign.slug && (
                              <div className="px-4 py-2.5 border-b border-border/20 bg-background/30 flex items-center gap-2">
                                <LinkIcon className="text-muted-foreground/40" size={12} />
                                <code className="text-[10px] text-cyan-400/70 flex-1 truncate font-mono">/campaign/{campaign.slug}</code>
                                <button
                                  onClick={() => copyCampaignLink(campaign.slug)}
                                  className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                >
                                  <Copy className="w-3 h-3" /> Copy
                                </button>
                              </div>
                            )}

                            {/* Stats */}
                            <div className="p-4 border-b border-border/20">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-bold flex items-center gap-1.5">
                                  <StatsIcon className="text-gold/70" /> Campaign Analytics
                                </p>
                                {editingStats === campaign.id ? (
                                  <div className="flex gap-1">
                                    <button onClick={() => handleUpdateStats(campaign.id)} className="h-6 px-2.5 rounded bg-gold text-background text-[9px] font-bold flex items-center gap-1 hover:bg-gold/90 transition-colors">
                                      <Save className="w-3 h-3" /> Save
                                    </button>
                                    <button onClick={() => setEditingStats(null)} className="h-6 px-2 rounded text-muted-foreground hover:text-foreground transition-colors">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingStats(campaign.id);
                                      setStatsForm({
                                        total_views: campaign.total_views,
                                        total_impressions: campaign.total_impressions,
                                        total_engagements: campaign.total_engagements,
                                        total_clicks: campaign.total_clicks,
                                        roi_percentage: campaign.roi_percentage,
                                        goal_views: campaign.goal_views,
                                        goal_posts: (campaign as any).goal_posts || 0,
                                        goal_label: campaign.goal_label || '',
                                        incoming_note: (campaign as any).incoming_note || '',
                                        campaign_type: (campaign as any).campaign_type || 'artist',
                                        logo_url: (campaign as any).logo_url || '',
                                      });
                                    }}
                                    className="h-6 px-2 rounded text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                  >
                                    <Edit3 className="w-3 h-3" /> Edit
                                  </button>
                                )}
                              </div>

                              {editingStats === campaign.id ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {[
                                      { key: 'total_views', label: 'Views' },
                                      { key: 'total_impressions', label: 'Impressions' },
                                      { key: 'total_engagements', label: 'Engagements' },
                                      { key: 'total_clicks', label: 'Clicks' },
                                      { key: 'roi_percentage', label: 'ROI %' },
                                    ].map(f => (
                                      <div key={f.key}>
                                        <label className="text-[7px] text-muted-foreground uppercase tracking-wider block mb-1">{f.label}</label>
                                        <Input
                                          type="number"
                                          value={(statsForm as any)[f.key]}
                                          onChange={e => setStatsForm(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                                          className="bg-background/60 h-8 text-xs border-border/30"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/20">
                                    <div>
                                      <label className="text-[7px] text-muted-foreground uppercase tracking-wider block mb-1">Goal Views</label>
                                      <Input type="number" value={statsForm.goal_views} onChange={e => setStatsForm(p => ({ ...p, goal_views: Number(e.target.value) }))} className="bg-background/60 h-8 text-xs border-border/30" />
                                    </div>
                                    <div>
                                      <label className="text-[7px] text-muted-foreground uppercase tracking-wider block mb-1">Goal Posts</label>
                                      <Input type="number" value={statsForm.goal_posts} onChange={e => setStatsForm(p => ({ ...p, goal_posts: Number(e.target.value) }))} className="bg-background/60 h-8 text-xs border-border/30" />
                                    </div>
                                    <div>
                                      <label className="text-[7px] text-muted-foreground uppercase tracking-wider block mb-1">Goal Label</label>
                                      <Input value={statsForm.goal_label} onChange={e => setStatsForm(p => ({ ...p, goal_label: e.target.value }))} placeholder="e.g. 1M Views" className="bg-background/60 h-8 text-xs border-border/30" />
                                    </div>
                                  </div>
                                  <div className="pt-2 border-t border-border/20">
                                    <label className="text-[7px] text-emerald-400 uppercase tracking-wider block mb-1">📢 Incoming Note (shown to client)</label>
                                    <Input
                                      value={statsForm.incoming_note}
                                      onChange={e => setStatsForm(p => ({ ...p, incoming_note: e.target.value }))}
                                      placeholder="e.g. 3 edits incoming today"
                                      className="bg-background/60 h-8 text-xs border-emerald-500/20 focus:border-emerald-500/40"
                                    />
                                  </div>
                                  <div className="pt-2 border-t border-border/20">
                                    <label className="text-[7px] text-muted-foreground uppercase tracking-wider block mb-1">Campaign Type & Logo</label>
                                    <div className="flex gap-2 items-end">
                                      <div className="flex gap-1">
                                        {(['artist', 'brand', 'film'] as const).map(type => (
                                          <button
                                            key={type}
                                            onClick={() => setStatsForm(p => ({ ...p, campaign_type: type }))}
                                            className={`h-8 px-2.5 rounded-md border text-[9px] font-bold uppercase tracking-wider transition-all ${
                                              statsForm.campaign_type === type
                                                ? 'border-gold bg-gold/10 text-gold'
                                                : 'border-border/30 bg-background/60 text-muted-foreground'
                                            }`}
                                          >
                                            {type}
                                          </button>
                                        ))}
                                      </div>
                                      {statsForm.campaign_type !== 'artist' && (
                                        <Input
                                          value={statsForm.logo_url}
                                          onChange={e => setStatsForm(p => ({ ...p, logo_url: e.target.value }))}
                                          placeholder="Company logo URL"
                                          className="bg-background/60 h-8 text-xs border-border/30 flex-1"
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-5 gap-2">
                                  {[
                                    { label: 'Views', value: formatNumber(campaign.total_views), color: 'text-gold' },
                                    { label: 'Impressions', value: formatNumber(campaign.total_impressions), color: 'text-cyan-400' },
                                    { label: 'Engagements', value: formatNumber(campaign.total_engagements), color: 'text-emerald-400' },
                                    { label: 'Clicks', value: formatNumber(campaign.total_clicks), color: 'text-amber-400' },
                                    { label: 'ROI', value: campaign.roi_percentage ? `${campaign.roi_percentage}%` : '—', color: 'text-foreground' },
                                  ].map(s => (
                                    <div key={s.label} className="rounded-lg bg-background/40 border border-border/20 p-2.5 text-center">
                                      <p className={`font-display text-base sm:text-lg ${s.color}`}>{s.value}</p>
                                      <p className="text-[7px] text-muted-foreground/60 uppercase tracking-wider mt-0.5">{s.label}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Edits */}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-bold">Linked Edits ({campaignEdits.length})</p>
                                <button
                                  onClick={() => setShowAddEditForm(showAddEditForm === campaign.id ? null : campaign.id)}
                                  className="h-6 px-2.5 rounded border border-border/30 text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                >
                                  <Plus className="w-3 h-3" /> Add Edit
                                </button>
                              </div>

                              {/* Add Edit Form */}
                              <AnimatePresence>
                                {showAddEditForm === campaign.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="rounded-lg bg-background/40 border border-border/20 p-3 space-y-2 mb-3 overflow-hidden"
                                  >
                                    <Input placeholder="Edit Title *" value={newEdit.title} onChange={e => setNewEdit(p => ({ ...p, title: e.target.value }))} className="bg-background/60 h-8 text-xs border-border/30" />
                                    <div className="grid grid-cols-2 gap-2">
                                      <Input placeholder="Video URL" value={newEdit.video_url} onChange={e => setNewEdit(p => ({ ...p, video_url: e.target.value }))} className="bg-background/60 h-8 text-xs border-border/30" />
                                      <Input placeholder="Thumbnail URL" value={newEdit.thumbnail_url} onChange={e => setNewEdit(p => ({ ...p, thumbnail_url: e.target.value }))} className="bg-background/60 h-8 text-xs border-border/30" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <select value={newEdit.platform} onChange={e => setNewEdit(p => ({ ...p, platform: e.target.value }))} className="bg-background/60 border border-border/30 rounded-md text-xs h-8 px-2 text-foreground">
                                        <option value="tiktok">TikTok</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="twitter">Twitter/X</option>
                                      </select>
                                      <Input placeholder="Editor @username" value={newEdit.editor_username} onChange={e => setNewEdit(p => ({ ...p, editor_username: e.target.value }))} className="bg-background/60 h-8 text-xs border-border/30" />
                                      <Input type="number" placeholder="Views" value={newEdit.view_count || ''} onChange={e => setNewEdit(p => ({ ...p, view_count: Number(e.target.value) }))} className="bg-background/60 h-8 text-xs border-border/30" />
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                      <button onClick={() => handleAddEdit(campaign.id)} className="h-7 px-3 rounded bg-gold text-background text-[9px] font-bold uppercase tracking-wider hover:bg-gold/90 transition-colors">Add Edit</button>
                                      <button onClick={() => setShowAddEditForm(null)} className="h-7 px-3 rounded text-[9px] text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Edits List */}
                              {campaignEdits.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground/40 text-center py-6">No edits linked yet</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {campaignEdits.map(edit => (
                                    <div key={edit.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-background/30 border border-border/15 hover:border-border/30 transition-colors">
                                      <div className="w-12 h-8 rounded bg-background/60 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {edit.thumbnail_url ? (
                                          <img src={edit.thumbnail_url} alt="" className="w-full h-full object-cover rounded" />
                                        ) : (
                                          <StatsIcon className="text-muted-foreground/30" size={12} />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-foreground truncate font-medium">{edit.title}</p>
                                        <p className="text-[8px] text-muted-foreground/60">{edit.platform} · @{edit.editor_username || '—'} · {formatNumber(edit.view_count)} views</p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          defaultValue={edit.view_count}
                                          className="w-20 h-6 text-[10px] bg-background/60 border-border/20 rounded"
                                          onBlur={e => {
                                            const val = Number(e.target.value);
                                            if (val !== edit.view_count) handleUpdateEditViews(edit.id, val);
                                          }}
                                        />
                                        <button onClick={() => handleDeleteEdit(edit.id)} className="h-6 w-6 rounded flex items-center justify-center text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-colors">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
