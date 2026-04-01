import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, Zap, MousePointerClick, BarChart3, ExternalLink, Play, Music, Globe, CheckCircle, Download, Link2, RefreshCw } from 'lucide-react';
import { SiTiktok, SiYoutube, SiInstagram } from '@icons-pack/react-simple-icons';
import { supabase } from '@/integrations/supabase/client';
import viralCartelCrest from '@/assets/viral-cartel-crest.png';

interface CampaignData {
  id: string; name: string; description: string | null; status: string;
  total_views: number; total_impressions: number; total_engagements: number; total_clicks: number;
  budget_cents: number | null; spent_cents: number | null; roi_percentage: number | null;
  goal_views: number; goal_label: string | null; goal_posts: number;
  start_date: string | null; end_date: string | null; cover_image_url: string | null;
  slug: string; featured_artist_id: string | null; incoming_note: string | null;
  client_name: string | null; campaign_type?: string; logo_url?: string | null;
}

interface ArtistData {
  id: string; name: string; slug: string; bio: string | null; avatar_url: string | null;
  banner_url: string | null; genre: string | null; social_links: any;
  monthly_streams: number | null; achievements: any; website_url: string | null; verified: boolean | null;
}

interface EditData {
  id: string; title: string; video_url: string | null; thumbnail_url: string | null;
  platform: string | null; view_count: number; like_count: number; share_count: number;
  comment_count: number; editor_username: string | null; status: string; published_at: string | null;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function getPlatformIcon(platform: string | null) {
  switch (platform?.toLowerCase()) {
    case 'tiktok': return <SiTiktok size={14} />;
    case 'youtube': return <SiYoutube size={14} />;
    case 'instagram': return <SiInstagram size={14} />;
    default: return <Play size={14} />;
  }
}

function getPlatformColor(platform: string | null): string {
  switch (platform?.toLowerCase()) {
    case 'tiktok': return '#000000';
    case 'youtube': return '#FF0000';
    case 'instagram': return '#E4405F';
    default: return '#6B7280';
  }
}

function getPlatformLabel(platform: string | null): string {
  switch (platform?.toLowerCase()) {
    case 'tiktok': return 'TikTok';
    case 'youtube': return 'YouTube';
    case 'instagram': return 'Instagram Reels';
    default: return 'Social Post';
  }
}

function getYouTubeThumbnail(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

function exportCSV(campaign: CampaignData, edits: EditData[]) {
  const rows = [
    ['Content Title', 'Platform', 'Creator', 'Views', 'Likes', 'Shares', 'Comments', 'Published', 'Status', 'URL'],
    ...edits.map((e) => [
      e.title || 'Untitled', getPlatformLabel(e.platform), e.editor_username ? `@${e.editor_username}` : '—',
      String(e.view_count), String(e.like_count), String(e.share_count), String(e.comment_count),
      e.published_at ? new Date(e.published_at).toLocaleDateString() : '—', e.status, e.video_url || '—',
    ]),
    [], ['Campaign Summary'], ['Total Views', String(campaign.total_views)],
    ['Total Impressions', String(campaign.total_impressions)],
    ['Total Engagements', String(campaign.total_engagements)],
    ['ROI', campaign.roi_percentage ? `${campaign.roi_percentage}%` : '—'],
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `${campaign.name.replace(/\s+/g, '-')}-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

const REFRESH_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

function getStoredLastRefresh(slug: string): number {
  try {
    const stored = localStorage.getItem(`campaign_refresh_${slug}`);
    return stored ? parseInt(stored, 10) : 0;
  } catch { return 0; }
}

function setStoredLastRefresh(slug: string) {
  try { localStorage.setItem(`campaign_refresh_${slug}`, String(Date.now())); } catch {}
}

export default function CampaignPortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [edits, setEdits] = useState<EditData[]>([]);
  const [copied, setCopied] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('manage-campaigns', {
        body: { action: 'get-campaign-public', slug }
      });
      if (fetchError) throw fetchError;
      if (data?.error) throw new Error(data.error);
      setCampaign(data.campaign);
      setArtist(data.artist);
      setEdits(data.edits || []);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Failed to fetch campaign:', err);
      setError('Campaign not found');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Manual refresh — triggers instagram-stats then re-fetches
  const handleManualRefresh = useCallback(async () => {
    if (!slug || refreshing) return;
    const lastTime = getStoredLastRefresh(slug);
    if (Date.now() - lastTime < REFRESH_COOLDOWN_MS) return;

    setRefreshing(true);
    try {
      // Trigger Instagram stats refresh
      await supabase.functions.invoke('instagram-stats', {
        body: { action: 'refresh-all' }
      });
      // Then re-fetch campaign data
      await fetchData();
      setStoredLastRefresh(slug);
    } catch (err) {
      console.error('Manual refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [slug, refreshing, fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 minutes (also triggers IG stats)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await supabase.functions.invoke('instagram-stats', { body: { action: 'refresh-all' } });
      } catch {}
      fetchData();
    }, REFRESH_COOLDOWN_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Cooldown timer
  useEffect(() => {
    if (!slug) return;
    const tick = () => {
      const lastTime = getStoredLastRefresh(slug);
      const elapsed = Date.now() - lastTime;
      setCooldownRemaining(elapsed < REFRESH_COOLDOWN_MS ? Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000) : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [slug, refreshing]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="text-center">
          <BarChart3 className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
          <h1 className="text-xl font-black text-neutral-900">{error || 'Not found'}</h1>
          <p className="text-xs text-neutral-400 mt-2">This campaign link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const goalProgress = campaign.goal_views > 0 ? Math.min(100, (campaign.total_views / campaign.goal_views) * 100) : 0;
  const postsProgress = campaign.goal_posts > 0 ? Math.min(100, (edits.length / campaign.goal_posts) * 100) : 0;
  const totalEditViews = edits.reduce((sum, e) => sum + e.view_count, 0);
  const totalLikes = edits.reduce((sum, e) => sum + e.like_count, 0);
  const totalShares = edits.reduce((sum, e) => sum + e.share_count, 0);
  const totalComments = edits.reduce((sum, e) => sum + e.comment_count, 0);
  const engagementRate = totalEditViews > 0 ? (((totalLikes + totalShares + totalComments) / totalEditViews) * 100).toFixed(1) : '0.0';
  const portalUrl = window.location.href;
  const isBrandCampaign = campaign.campaign_type === 'brand' || campaign.campaign_type === 'film';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Top bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(isBrandCampaign && (campaign as any).logo_url) ? (
              <img src={(campaign as any).logo_url} alt="" className="w-8 h-8 object-contain" />
            ) : (
              <img src={viralCartelCrest} alt="" className="w-7 h-7 opacity-40" />
            )}
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black">Campaign Performance Report</p>
              <p className="text-[9px] text-neutral-400">Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-black rounded-md border transition-all"
              style={{ borderColor: copied ? '#10B981' : '#E5E7EB', color: copied ? '#10B981' : '#6B7280', background: copied ? '#F0FDF4' : '#FAFAFA' }}
            >
              <Link2 size={11} /> {copied ? 'Copied!' : 'Share'}
            </button>
            <button onClick={() => exportCSV(campaign, edits)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-black rounded-md border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 transition-all"
            >
              <Download size={11} /> Export CSV
            </button>
          </div>
        </motion.div>

        {/* Brand/Artist Hero Section */}
        {isBrandCampaign ? (
          /* Brand/Film hero - shows logo prominently */
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8"
          >
            <div className="flex items-center gap-5">
              {(campaign as any).logo_url ? (
                <img src={(campaign as any).logo_url} alt={campaign.client_name || ''} className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-neutral-200 flex items-center justify-center flex-shrink-0">
                  <Globe size={24} className="text-neutral-400" />
                </div>
              )}
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-black mb-1">
                  {campaign.campaign_type === 'film' ? 'Film Campaign' : 'Brand Campaign'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-900">{campaign.client_name || campaign.name}</h2>
                {campaign.description && <p className="text-sm text-neutral-500 mt-1">{campaign.description}</p>}
              </div>
            </div>
          </motion.div>
        ) : artist ? (
          /* Artist hero */
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl overflow-hidden border border-neutral-200"
          >
            {artist.banner_url && (
              <div className="h-32 sm:h-40 overflow-hidden relative">
                <img src={artist.banner_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
              </div>
            )}
            <div className={`p-5 sm:p-6 bg-white ${artist.banner_url ? '-mt-10 relative z-10' : ''}`}>
              <div className="flex items-start gap-4">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-neutral-100 border-2 border-white shadow-md flex items-center justify-center flex-shrink-0">
                    <Music size={18} className="text-neutral-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-neutral-900 truncate">{artist.name}</h2>
                    {artist.verified && <CheckCircle size={14} className="text-neutral-900 flex-shrink-0" />}
                  </div>
                  {artist.genre && <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-black">{artist.genre}</span>}
                  {artist.bio && <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2">{artist.bio}</p>}
                  <div className="flex items-center gap-4 mt-3">
                    {artist.monthly_streams && artist.monthly_streams > 0 && (
                      <div>
                        <p className="text-sm font-black text-neutral-900">{formatNumber(artist.monthly_streams)}</p>
                        <p className="text-[7px] uppercase tracking-widest text-neutral-400 font-bold">Monthly Streams</p>
                      </div>
                    )}
                    <a href={`/artist/${artist.slug}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-700 transition-colors font-bold"
                    >
                      <Globe size={10} /> Artist Profile
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Campaign Header + Big Views */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">{campaign.name}</h1>
              {campaign.description && !isBrandCampaign && <p className="text-sm text-neutral-500 mt-1">{campaign.description}</p>}
            </div>
            <span className={`text-[9px] px-3 py-1 uppercase tracking-wider font-black rounded-full flex-shrink-0 ${
              campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              campaign.status === 'completed' ? 'bg-neutral-100 text-neutral-500 border border-neutral-200' :
              'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{
                background: campaign.status === 'active' ? '#10B981' : campaign.status === 'completed' ? '#9CA3AF' : '#F59E0B'
              }} />
              {campaign.status === 'active' ? 'Live Campaign' : campaign.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-400 font-bold">
            {campaign.start_date && (
              <span>{new Date(campaign.start_date).toLocaleDateString()}{campaign.end_date ? ` — ${new Date(campaign.end_date).toLocaleDateString()}` : ' — Ongoing'}</span>
            )}
            {campaign.client_name && !isBrandCampaign && <span>• {campaign.client_name}</span>}
          </div>
        </motion.div>

        {/* ★ BIG Views Generated Counter */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18 }}
          className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8 text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black mb-2">Views Generated</p>
          <p className="text-6xl sm:text-7xl font-black text-neutral-900 tracking-tight tabular-nums leading-none">
            {campaign.total_views > 0 ? formatNumber(campaign.total_views) : '—'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing || cooldownRemaining > 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all ${
                refreshing || cooldownRemaining > 0
                  ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95'
              }`}
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : cooldownRemaining > 0
                ? `${Math.floor(cooldownRemaining / 60)}:${String(cooldownRemaining % 60).padStart(2, '0')}`
                : 'Refresh Stats'}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 text-[9px] text-neutral-400">
            <span className="font-bold">Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Auto-refreshes every 30 min</span>
          </div>
        </motion.div>

        {/* KPI Grid */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Total Reach', raw: campaign.total_views, icon: Eye, sub: 'Organic + Paid Views' },
            { label: 'Impressions', raw: campaign.total_impressions, icon: TrendingUp, sub: 'Feed Appearances' },
            { label: 'Engagements', raw: campaign.total_engagements, icon: Zap, sub: 'Likes, Shares, Comments' },
            { label: 'Click-Through', raw: campaign.total_clicks, icon: MousePointerClick, sub: 'Profile & Link Clicks' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.05 }}
              className="rounded-xl p-4 sm:p-5 border border-neutral-200 bg-white"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-neutral-100">
                  <stat.icon size={14} className="text-neutral-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-neutral-900">{stat.raw > 0 ? formatNumber(stat.raw) : '—'}</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500 mt-1">{stat.label}</p>
              <p className="text-[8px] text-neutral-400 mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Secondary metrics */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Content Pieces', value: String(edits.length), sub: 'Published Edits' },
            { label: 'Engagement Rate', value: `${engagementRate}%`, sub: 'Interactions / Reach' },
            { label: 'ROI', value: campaign.roi_percentage ? `${campaign.roi_percentage}%` : '—', sub: 'Return on Investment' },
            { label: 'Budget Used', value: campaign.budget_cents ? `$${((campaign.spent_cents || 0) / 100).toLocaleString()}` : '—', sub: campaign.budget_cents ? `of $${(campaign.budget_cents / 100).toLocaleString()}` : 'Not Set' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-4 text-center border border-neutral-200 bg-white">
              <p className="text-xl font-black text-neutral-900">{m.value}</p>
              <p className="text-[8px] font-black uppercase tracking-wider text-neutral-500 mt-1">{m.label}</p>
              <p className="text-[8px] text-neutral-400">{m.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* Goal Progress */}
        {(campaign.goal_views > 0 || campaign.goal_posts > 0) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-xl p-5 sm:p-6 space-y-5 border border-neutral-200 bg-white"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Campaign Objectives</p>
            {campaign.goal_views > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-700 font-bold">{campaign.goal_label || 'Views Target'}</span>
                  <span className="text-sm font-black text-neutral-900">{Math.round(goalProgress)}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden bg-neutral-100">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${goalProgress}%` }} transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    className="h-full rounded-full bg-neutral-900"
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-neutral-400 font-bold">{campaign.total_views > 0 ? `${formatNumber(campaign.total_views)} achieved` : 'Awaiting data'}</span>
                  <span className="text-[10px] text-neutral-400 font-bold">Target: {formatNumber(campaign.goal_views)}</span>
                </div>
              </div>
            )}
            {campaign.goal_posts > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-700 font-bold">Content Delivery</span>
                  <span className="text-sm font-black text-neutral-900">{edits.length}/{campaign.goal_posts}</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden bg-neutral-100 relative">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${postsProgress}%` }} transition={{ duration: 1.5, ease: 'easeOut', delay: 0.7 }}
                    className="h-full rounded-full bg-neutral-700 absolute inset-y-0 left-0"
                  />
                </div>
                {campaign.incoming_note && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-600 font-bold">{campaign.incoming_note}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ★ Content Grid (posts as grid tiles) */}
        {edits.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-black text-neutral-900">Content Performance</h3>
                <p className="text-[10px] text-neutral-400 font-bold mt-0.5">
                  {edits.length} published pieces{totalEditViews > 0 ? ` • ${formatNumber(totalEditViews)} combined reach` : ''}
                </p>
              </div>
              <button onClick={() => exportCSV(campaign, edits)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-black rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-all"
              >
                <Download size={11} /> CSV
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {edits.map((edit, i) => {
                const thumb = edit.thumbnail_url || getYouTubeThumbnail(edit.video_url) || null;
                const pColor = getPlatformColor(edit.platform);

                return (
                  <motion.a
                    key={edit.id}
                    href={edit.video_url || '#'}
                    target={edit.video_url ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 + i * 0.03 }}
                    className="group rounded-xl overflow-hidden border border-neutral-200 bg-white hover:shadow-lg hover:border-neutral-300 transition-all cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-200">
                            {getPlatformIcon(edit.platform)}
                          </div>
                        </div>
                      )}
                      {/* Platform badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black backdrop-blur-sm flex items-center gap-1 bg-white/90 shadow-sm"
                        style={{ color: pColor }}
                      >
                        {getPlatformIcon(edit.platform)}
                      </div>
                      {/* External link indicator */}
                      {edit.video_url && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink size={10} className="text-neutral-600" />
                        </div>
                      )}
                    </div>
                    {/* Stats */}
                    <div className="p-3">
                      {edit.editor_username && (
                        <p className="text-[10px] text-neutral-400 font-bold truncate">@{edit.editor_username}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {edit.view_count > 0 && (
                          <span className="text-xs font-black text-neutral-900">{formatNumber(edit.view_count)} <span className="text-neutral-400 font-bold text-[9px]">views</span></span>
                        )}
                        {edit.like_count > 0 && (
                          <span className="text-xs font-black text-neutral-900">{formatNumber(edit.like_count)} <span className="text-neutral-400 font-bold text-[9px]">likes</span></span>
                        )}
                      </div>
                    </div>
                  </motion.a>
                );
              })}
            </div>

            {/* Aggregate footer */}
            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Aggregate Performance</span>
              <div className="flex items-center gap-5 text-[10px]">
                <span className="text-neutral-500"><strong className="text-neutral-900 font-black">{formatNumber(totalEditViews)}</strong> reach</span>
                <span className="text-neutral-500"><strong className="text-neutral-900 font-black">{formatNumber(totalLikes)}</strong> likes</span>
                <span className="text-neutral-500"><strong className="text-neutral-900 font-black">{formatNumber(totalShares)}</strong> shares</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {edits.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="rounded-xl p-10 text-center border border-neutral-200 bg-white"
          >
            <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-neutral-100">
              <BarChart3 size={20} className="text-neutral-400" />
            </div>
            <p className="text-lg font-black text-neutral-900 mb-1">Content Pipeline Initializing</p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Your campaign content is being produced and distributed. Performance metrics will populate in real-time as content goes live.
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 pb-10">
          <img src={viralCartelCrest} alt="" className="w-5 h-5 mx-auto opacity-15 mb-2" />
          <p className="text-[8px] uppercase tracking-[0.3em] text-neutral-300 font-bold">Powered by Viral Cartel Studios</p>
          <p className="text-[7px] text-neutral-300 mt-1">Confidential — For authorized stakeholders only</p>
        </div>
      </div>
    </div>
  );
}
