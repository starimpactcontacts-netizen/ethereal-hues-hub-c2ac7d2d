import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, BarChart3, Eye, TrendingUp, Zap, MousePointerClick, Edit3, X, ChevronDown, ChevronUp, Copy, Bell, Check, Link2, RefreshCw, Music, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useArtistCampaigns, useUpdateRequests } from '@/hooks/useArtistCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

interface FeaturedArtistOption {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  genre: string | null;
  verified: boolean | null;
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

  // Fetch featured artists and client names
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

  // Create campaign form
  const [newCampaign, setNewCampaign] = useState({ client_name: '', name: '', description: '', goal_views: 0, goal_posts: 0, goal_label: '', featured_artist_id: '' });
  // Add edit form
  const [newEdit, setNewEdit] = useState({ title: '', video_url: '', thumbnail_url: '', platform: 'tiktok', editor_username: '', view_count: 0 });
  // Edit stats form
  const [statsForm, setStatsForm] = useState({ total_views: 0, total_impressions: 0, total_engagements: 0, total_clicks: 0, roi_percentage: 0, goal_views: 0, goal_posts: 0, goal_label: '' });

  const filteredClientNames = newCampaign.client_name.trim()
    ? clientNames.filter(n => n.toLowerCase().includes(newCampaign.client_name.toLowerCase()))
    : [];

  const handleCreateCampaign = async () => {
    if (!newCampaign.client_name.trim() || !newCampaign.name) {
      toast.error('Enter a client name and campaign name');
      return;
    }
    try {
      const params: Record<string, unknown> = { ...newCampaign };
      if (!params.featured_artist_id) delete params.featured_artist_id;
      await createCampaign(params);
      toast.success('Campaign created');
      setNewCampaign({ client_name: '', name: '', description: '', goal_views: 0, goal_posts: 0, goal_label: '', featured_artist_id: '' });
      setShowCreateForm(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddEdit = async (campaignId: string) => {
    if (!newEdit.title) {
      toast.error('Enter edit title');
      return;
    }
    try {
      await addEdit({ campaign_id: campaignId, ...newEdit });
      toast.success('Edit added');
      setNewEdit({ title: '', video_url: '', thumbnail_url: '', platform: 'tiktok', editor_username: '', view_count: 0 });
      setShowAddEditForm(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateStats = async (campaignId: string) => {
    try {
      await updateCampaign(campaignId, statsForm);
      toast.success('Stats updated');
      setEditingStats(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Delete this campaign and all linked edits?')) return;
    try {
      await deleteCampaign(campaignId);
      toast.success('Campaign deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteEdit = async (editId: string) => {
    if (!confirm('Remove this edit?')) return;
    try {
      await deleteEdit(editId);
      toast.success('Edit removed');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateEditViews = async (editId: string, view_count: number) => {
    try {
      await updateEdit(editId, { view_count });
      toast.success('Views updated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyCampaignLink = (slug: string | null) => {
    if (!slug) return;
    const url = `${window.location.origin}/campaign/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Campaign link copied!');
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/ops-panel/a7c92ff31b')}
            className="h-8 w-8 mt-0.5"
            aria-label="Back to admin panel"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="font-display text-2xl">Campaign Manager</h2>
            <p className="text-xs text-muted-foreground mt-1">Manage artist/client campaigns, edits, and analytics</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={refresh} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {pendingRequests.length > 0 && (
            <Button
              onClick={() => setActiveTab('requests')}
              variant="outline"
              className="gap-2 border-gold/30 text-gold"
            >
              <Bell className="w-4 h-4" />
              {pendingRequests.length} Update Request{pendingRequests.length > 1 ? 's' : ''}
            </Button>
          )}
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gold hover:bg-gold/90 text-background gap-2"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border border-border">
        {(['campaigns', 'requests'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-wider font-bold transition-colors ${
              activeTab === tab ? 'bg-surface-1 text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'requests' && pendingRequests.length > 0 ? `Requests (${pendingRequests.length})` : tab}
          </button>
        ))}
      </div>

      {/* ═══ REQUESTS TAB ═══ */}
      {activeTab === 'requests' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Dashboard Update Requests</p>
            <Button size="sm" variant="ghost" onClick={refreshRequests} className="h-7 text-[9px] gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No update requests yet.</p>
          ) : (
            <div className="space-y-2">
              {requests.map(req => {
                const clientInfo = (req as any).enterprise_clients;
                return (
                  <div key={req.id} className={`bg-surface-1 border p-4 flex items-center gap-4 ${req.status === 'pending' ? 'border-gold/30' : 'border-border'}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${req.status === 'pending' ? 'bg-gold animate-pulse' : 'bg-muted-foreground/30'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">{clientInfo?.display_name || clientInfo?.email || 'Unknown'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{req.message || 'Update requested'}</p>
                      <p className="text-[8px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
                    </div>
                    {req.status === 'pending' ? (
                      <Button
                        size="sm"
                        onClick={() => resolveRequest(req.id)}
                        className="h-7 text-[9px] bg-gold text-background gap-1"
                      >
                        <Check className="w-3 h-3" /> Resolve
                      </Button>
                    ) : (
                      <span className="text-[8px] text-muted-foreground uppercase">Resolved</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ CAMPAIGNS TAB ═══ */}
      {activeTab === 'campaigns' && (
        <>
          {/* Create Campaign Form */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-surface-1 border border-border p-4 space-y-3"
            >
              <h3 className="font-display text-sm">Create Campaign</h3>
              
              {/* Client Name with Autocomplete */}
              <div className="relative">
                <label className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1">Client Name</label>
                <Input
                  placeholder="Type client name..."
                  value={newCampaign.client_name}
                  onChange={e => { setNewCampaign(p => ({ ...p, client_name: e.target.value })); setShowClientSuggestions(true); }}
                  onFocus={() => setShowClientSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                  className="bg-surface-0"
                />
                {showClientSuggestions && filteredClientNames.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-surface-1 border border-border max-h-32 overflow-y-auto">
                    {filteredClientNames.map(name => (
                      <button
                        key={name}
                        onMouseDown={() => { setNewCampaign(p => ({ ...p, client_name: name })); setShowClientSuggestions(false); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-surface-0 text-foreground"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Input
                placeholder="Campaign Name"
                value={newCampaign.name}
                onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))}
                className="bg-surface-0"
              />
              <Input
                placeholder="Description (optional)"
                value={newCampaign.description}
                onChange={e => setNewCampaign(p => ({ ...p, description: e.target.value }))}
                className="bg-surface-0"
              />
              
              {/* Featured Artist Selector */}
              <div>
                <label className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1">Featured Artist</label>
                <select
                  value={newCampaign.featured_artist_id}
                  onChange={e => setNewCampaign(p => ({ ...p, featured_artist_id: e.target.value }))}
                  className="w-full bg-surface-0 border border-border text-sm p-2 text-foreground"
                >
                  <option value="">None (no artist profile)</option>
                  {artists.map(a => (
                    <option key={a.id} value={a.id}>{a.name}{a.genre ? ` (${a.genre})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1">Goal Views</label>
                  <Input
                    type="number"
                    placeholder="e.g. 1000000"
                    value={newCampaign.goal_views || ''}
                    onChange={e => setNewCampaign(p => ({ ...p, goal_views: Number(e.target.value) }))}
                    className="bg-surface-0"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1">Goal Posts</label>
                  <Input
                    type="number"
                    placeholder="e.g. 20"
                    value={newCampaign.goal_posts || ''}
                    onChange={e => setNewCampaign(p => ({ ...p, goal_posts: Number(e.target.value) }))}
                    className="bg-surface-0"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1">Goal Label</label>
                  <Input
                    placeholder="e.g. 1M Views by March"
                    value={newCampaign.goal_label}
                    onChange={e => setNewCampaign(p => ({ ...p, goal_label: e.target.value }))}
                    className="bg-surface-0"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateCampaign} size="sm" className="bg-gold hover:bg-gold/90 text-background">Create</Button>
                <Button onClick={() => setShowCreateForm(false)} size="sm" variant="outline">Cancel</Button>
              </div>
            </motion.div>
          )}

          {/* Campaigns List */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="bg-surface-1 border border-border p-8 text-center">
              <BarChart3 className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No campaigns yet. Create one to get started.</p>
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

                return (
                  <div key={campaign.id} className="bg-surface-1 border border-border overflow-hidden">
                    {/* Campaign Row */}
                    <div className="flex items-center gap-3 p-4">
                      <button
                        onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <div className="w-8 h-8 bg-surface-0 border border-border flex items-center justify-center flex-shrink-0">
                          {artistInfo?.avatar_url ? (
                            <img src={artistInfo.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm truncate">{campaign.name}</span>
                            {artistInfo && (
                              <span className="text-[8px] px-1.5 py-0.5 bg-surface-0 border border-border text-muted-foreground truncate max-w-[80px]">
                                <Music className="w-2.5 h-2.5 inline mr-0.5" />{artistInfo.name}
                              </span>
                            )}
                            <span className={`text-[8px] px-1.5 py-0.5 uppercase tracking-wider border ${
                              campaign.status === 'active' ? 'border-green-500/30 text-green-400' :
                              campaign.status === 'completed' ? 'border-border text-muted-foreground' :
                              'border-yellow-500/30 text-yellow-400'
                            }`}>{campaign.status}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {(campaign as any).client_name || clientInfo?.display_name || clientInfo?.email || 'Unknown client'} • {campaignEdits.length} edits • {formatNumber(campaign.total_views)} views
                            {campaign.goal_views > 0 && ` • ${Math.round(goalProgress)}% to goal`}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      {/* Campaign Link Button */}
                      {campaign.slug && (
                        <Button 
                          onClick={() => copyCampaignLink(campaign.slug)} 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[9px] gap-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                        >
                          <Link2 className="w-3 h-3" /> Copy Link
                        </Button>
                      )}
                      <Button onClick={() => handleDeleteCampaign(campaign.id)} size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Goal Progress Bars */}
                    {(campaign.goal_views > 0 || (campaign as any).goal_posts > 0) && (
                      <div className="px-4 pb-2 space-y-1">
                        {campaign.goal_views > 0 && (
                          <div className="flex items-center gap-2">
                            <Eye className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <div className="h-1.5 bg-surface-0 overflow-hidden flex-1">
                              <div 
                                className="h-full bg-gradient-to-r from-gold/60 to-gold transition-all"
                                style={{ width: `${goalProgress}%` }}
                              />
                            </div>
                            <span className="text-[8px] text-muted-foreground w-8 text-right">{Math.round(goalProgress)}%</span>
                          </div>
                        )}
                        {(campaign as any).goal_posts > 0 && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <div className="h-1.5 bg-surface-0 overflow-hidden flex-1">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-500/60 to-cyan-400 transition-all"
                                style={{ width: `${postsProgress}%` }}
                              />
                            </div>
                            <span className="text-[8px] text-muted-foreground w-16 text-right">{campaignEdits.length}/{(campaign as any).goal_posts}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="border-t border-border">
                        {/* Campaign Link Info */}
                        {campaign.slug && (
                          <div className="px-4 py-2 border-b border-border bg-surface-0/50 flex items-center gap-2">
                            <Link2 className="w-3 h-3 text-muted-foreground" />
                            <code className="text-[10px] text-cyan-400 flex-1 truncate">/campaign/{campaign.slug}</code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyCampaignLink(campaign.slug)}
                              className="h-6 text-[9px] gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </Button>
                          </div>
                        )}

                        {/* Stats Editor */}
                        <div className="p-4 border-b border-border">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Campaign Analytics</p>
                            {editingStats === campaign.id ? (
                              <div className="flex gap-1">
                                <Button size="sm" onClick={() => handleUpdateStats(campaign.id)} className="h-6 text-[10px] bg-gold text-background">
                                  <Save className="w-3 h-3 mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingStats(null)} className="h-6 text-[10px]">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
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
                                  });
                                }}
                                className="h-6 text-[10px]"
                              >
                                <Edit3 className="w-3 h-3 mr-1" /> Edit Stats
                              </Button>
                            )}
                          </div>

                          {editingStats === campaign.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {[
                                  { key: 'total_views', label: 'Views', icon: Eye },
                                  { key: 'total_impressions', label: 'Impressions', icon: TrendingUp },
                                  { key: 'total_engagements', label: 'Engagements', icon: Zap },
                                  { key: 'total_clicks', label: 'Clicks', icon: MousePointerClick },
                                  { key: 'roi_percentage', label: 'ROI %', icon: BarChart3 },
                                ].map(f => (
                                  <div key={f.key}>
                                    <label className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1">{f.label}</label>
                                    <Input
                                      type="number"
                                      value={(statsForm as any)[f.key]}
                                      onChange={e => setStatsForm(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                                      className="bg-surface-0 h-8 text-xs"
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
                                <div>
                                  <label className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1">Goal Views</label>
                                  <Input
                                    type="number"
                                    value={statsForm.goal_views}
                                    onChange={e => setStatsForm(p => ({ ...p, goal_views: Number(e.target.value) }))}
                                    className="bg-surface-0 h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1">Goal Posts</label>
                                  <Input
                                    type="number"
                                    value={statsForm.goal_posts}
                                    onChange={e => setStatsForm(p => ({ ...p, goal_posts: Number(e.target.value) }))}
                                    className="bg-surface-0 h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1">Goal Label</label>
                                  <Input
                                    value={statsForm.goal_label}
                                    onChange={e => setStatsForm(p => ({ ...p, goal_label: e.target.value }))}
                                    placeholder="e.g. 1M Views by March"
                                    className="bg-surface-0 h-8 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { label: 'Views', value: formatNumber(campaign.total_views), icon: Eye },
                                { label: 'Impressions', value: formatNumber(campaign.total_impressions), icon: TrendingUp },
                                { label: 'Engagements', value: formatNumber(campaign.total_engagements), icon: Zap },
                                { label: 'Clicks', value: formatNumber(campaign.total_clicks), icon: MousePointerClick },
                                { label: 'ROI', value: campaign.roi_percentage ? `${campaign.roi_percentage}%` : '—', icon: BarChart3 },
                              ].map(s => (
                                <div key={s.label} className="bg-surface-0 border border-border p-2 text-center">
                                  <s.icon className="w-3 h-3 text-muted-foreground mx-auto mb-1" />
                                  <p className="font-display text-sm">{s.value}</p>
                                  <p className="text-[7px] text-muted-foreground uppercase">{s.label}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Edits Section */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Linked Edits ({campaignEdits.length})</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowAddEditForm(showAddEditForm === campaign.id ? null : campaign.id)}
                              className="h-6 text-[10px] gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Edit
                            </Button>
                          </div>

                          {/* Add Edit Form */}
                          {showAddEditForm === campaign.id && (
                            <div className="bg-surface-0 border border-border p-3 space-y-2 mb-3">
                              <Input placeholder="Edit Title *" value={newEdit.title} onChange={e => setNewEdit(p => ({ ...p, title: e.target.value }))} className="bg-background h-8 text-xs" />
                              <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Video URL" value={newEdit.video_url} onChange={e => setNewEdit(p => ({ ...p, video_url: e.target.value }))} className="bg-background h-8 text-xs" />
                                <Input placeholder="Thumbnail URL" value={newEdit.thumbnail_url} onChange={e => setNewEdit(p => ({ ...p, thumbnail_url: e.target.value }))} className="bg-background h-8 text-xs" />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <select value={newEdit.platform} onChange={e => setNewEdit(p => ({ ...p, platform: e.target.value }))} className="bg-background border border-border text-xs p-1.5 text-foreground">
                                  <option value="tiktok">TikTok</option>
                                  <option value="youtube">YouTube</option>
                                  <option value="instagram">Instagram</option>
                                  <option value="twitter">Twitter/X</option>
                                </select>
                                <Input placeholder="Editor @username" value={newEdit.editor_username} onChange={e => setNewEdit(p => ({ ...p, editor_username: e.target.value }))} className="bg-background h-8 text-xs" />
                                <Input type="number" placeholder="Views" value={newEdit.view_count || ''} onChange={e => setNewEdit(p => ({ ...p, view_count: Number(e.target.value) }))} className="bg-background h-8 text-xs" />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleAddEdit(campaign.id)} className="h-7 text-[10px] bg-gold text-background">Add Edit</Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowAddEditForm(null)} className="h-7 text-[10px]">Cancel</Button>
                              </div>
                            </div>
                          )}

                          {/* Edits List */}
                          {campaignEdits.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground text-center py-4">No edits linked yet</p>
                          ) : (
                            <div className="space-y-1.5">
                              {campaignEdits.map(edit => (
                                <div key={edit.id} className="flex items-center gap-3 p-2 bg-surface-0 border border-border">
                                  <div className="w-10 h-7 bg-background flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {edit.thumbnail_url ? (
                                      <img src={edit.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <BarChart3 className="w-3 h-3 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-foreground truncate">{edit.title}</p>
                                    <p className="text-[8px] text-muted-foreground">{edit.platform} • @{edit.editor_username || '—'} • {formatNumber(edit.view_count)} views</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      defaultValue={edit.view_count}
                                      className="w-20 h-6 text-[10px] bg-background"
                                      onBlur={e => {
                                        const val = Number(e.target.value);
                                        if (val !== edit.view_count) handleUpdateEditViews(edit.id, val);
                                      }}
                                    />
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteEdit(edit.id)} className="h-6 w-6 p-0 text-destructive">
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
