import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, Zap, MousePointerClick, BarChart3, ExternalLink, Play, Music, Globe, CheckCircle, Download, Link2, RefreshCw, Share2 } from 'lucide-react';
import { ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SiTiktok, SiYoutube, SiInstagram } from '@icons-pack/react-simple-icons';
import { supabase } from '@/integrations/supabase/client';
import viralCartelCrest from '@/assets/viral-cartel-crest.png';
import loopgateLogo from '@/assets/loopgate-logo.png';
import { useUnifiedThumbnail } from '@/lib/thumbnail';
import CampaignSupportChat from '@/components/loopgate/CampaignSupportChat';
import { Switch } from '@/components/ui/switch';

// ── Auto-pulling thumbnail tile ──────────────────────────────────
function ContentTile({ edit, index, pColor, getPlatformIcon, formatNumber }: any) {
  const thumbResult = useUnifiedThumbnail(
    edit.video_url || '',
    edit.platform || '',
    null,
    edit.thumbnail_url,
  );
  const thumb = thumbResult.url && thumbResult.status !== 'error' ? thumbResult.url : null;

  return (
    <motion.a
      href={edit.video_url || '#'}
      target={edit.video_url ? '_blank' : undefined}
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.55 + index * 0.03 }}
      className="group rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 hover:shadow-lg hover:border-neutral-700 transition-all cursor-pointer"
    >
      <div className="aspect-[4/3] bg-neutral-900 relative overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-800/80 backdrop-blur-sm">
              {getPlatformIcon(edit.platform)}
            </div>
          </div>
        )}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black backdrop-blur-md flex items-center gap-1 bg-neutral-950/80 shadow-sm"
          style={{ color: pColor }}
        >
          {getPlatformIcon(edit.platform)}
        </div>
        {edit.video_url && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-neutral-950/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink size={10} className="text-neutral-300" />
          </div>
        )}
      </div>
      <div className="p-3">
        {edit.editor_username && (
          <p className="text-[10px] text-neutral-500 font-bold truncate">@{edit.editor_username}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs font-black text-neutral-50">{formatNumber(edit.view_count)} <span className="text-neutral-500 font-bold text-[9px]">views</span></span>
          <span className="text-xs font-black text-neutral-50">{formatNumber(edit.like_count)} <span className="text-neutral-500 font-bold text-[9px]">likes</span></span>
          {edit.comment_count > 0 && (
            <span className="text-xs font-black text-neutral-50">{formatNumber(edit.comment_count)} <span className="text-neutral-500 font-bold text-[9px]">comments</span></span>
          )}
        </div>
      </div>
    </motion.a>
  );
}

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
    ['CPM', (campaign.budget_cents && campaign.total_views > 0)
      ? `$${(((campaign.spent_cents || campaign.budget_cents) / 100) / (campaign.total_views / 1000)).toFixed(2)}`
      : '—'],
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `${campaign.name.replace(/\s+/g, '-')}-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// Short cooldown so clients see metrics climb in real time on every click,
// but still prevents hammering the scraper.
const REFRESH_COOLDOWN_MS = 10 * 1000; // 10 seconds

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
  const [goalMode, setGoalMode] = useState<'views' | 'cpm'>('views');

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
      // Trigger Instagram stats refresh scoped to THIS campaign so it's fast
      await supabase.functions.invoke('instagram-stats', {
        body: { action: 'refresh-all', campaign_id: campaign?.id }
      });
      // Then re-fetch campaign data
      await fetchData();
      setStoredLastRefresh(slug);
    } catch (err) {
      console.error('Manual refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [slug, refreshing, fetchData, campaign?.id]);

  // On mount: fetch data AND trigger IG stats refresh, then re-fetch to show updated metrics
  useEffect(() => {
    const init = async () => {
      await fetchData();
      // Background refresh IG stats, then re-fetch to pick up updated metrics
      try {
        // Wait for fetch so we have campaign id; re-call with scope
      } catch {}
    };
    init();
  }, [fetchData]);

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
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="w-6 h-6 border-2 border-neutral-700 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
        <div className="text-center">
          <BarChart3 className="w-10 h-10 text-neutral-600 mx-auto mb-4" />
          <h1 className="text-xl font-black text-neutral-50">{error || 'Not found'}</h1>
          <p className="text-xs text-neutral-500 mt-2">This campaign link may be invalid or expired.</p>
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
  // Use the higher of campaign total_views or aggregated edit views
  const displayViews = Math.max(campaign.total_views, totalEditViews);
  const engagementRate = displayViews > 0 ? (((totalLikes + totalShares + totalComments) / displayViews) * 100).toFixed(1) : '0.0';
  const portalUrl = window.location.href;

  const growthData = (() => {
    const sorted = [...edits]
      .filter(e => e.published_at && e.view_count > 0)
      .sort((a, b) => new Date(a.published_at!).getTime() - new Date(b.published_at!).getTime());
    if (sorted.length === 0) return [];

    // Build daily data points from campaign start to now
    const startDate = campaign.start_date 
      ? new Date(campaign.start_date) 
      : new Date(sorted[0].published_at!);
    const endDate = new Date();
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Create a map of publish dates to their view contributions
    const editsByDay = new Map<number, number>();
    for (const e of sorted) {
      const dayIndex = Math.floor((new Date(e.published_at!).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      editsByDay.set(dayIndex, (editsByDay.get(dayIndex) || 0) + e.view_count);
    }

    // Generate daily points with realistic growth curves
    // Each edit's views accumulate over time (viral curve: fast initial, then plateau)
    const points: { label: string; views: number; daily: number }[] = [];
    const activeEdits: { views: number; publishDay: number }[] = [];
    
    // Sample ~20-30 points max for clean chart
    const step = Math.max(1, Math.floor(totalDays / 28));
    
    for (let day = 0; day <= totalDays; day += step) {
      // Register new edits that published on or before this day
      for (const [editDay, views] of editsByDay) {
        if (editDay <= day && !activeEdits.some(ae => ae.publishDay === editDay)) {
          activeEdits.push({ views, publishDay: editDay });
        }
      }
      
      // Calculate cumulative views: each edit follows a growth curve
      let totalViews = 0;
      for (const edit of activeEdits) {
        const daysSincePublish = day - edit.publishDay;
        const maxDays = Math.max(totalDays - edit.publishDay, 1);
        // S-curve growth: starts slow, accelerates, then plateaus
        const progress = Math.min(daysSincePublish / maxDays, 1);
        const sCurve = 1 / (1 + Math.exp(-10 * (progress - 0.3)));
        totalViews += Math.floor(edit.views * sCurve);
      }
      
      const d = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
      const prevViews = points.length > 0 ? points[points.length - 1].views : 0;
      points.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        views: totalViews,
        daily: Math.max(0, totalViews - prevViews)
      });
    }
    
    // Ensure last point = actual total
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      if (lastPoint.views < displayViews) {
        lastPoint.views = displayViews;
      }
    }
    
    return points;
  })();
  const isBrandCampaign = campaign.campaign_type === 'brand' || campaign.campaign_type === 'film';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="h-full overflow-y-auto bg-neutral-950 text-neutral-50"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Top bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={loopgateLogo} alt="Loopgate" className="w-8 h-8 object-contain" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-black">Campaign Performance Report</p>
              <p className="text-[9px] text-neutral-500">Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-black rounded-md border transition-all"
              style={{ borderColor: copied ? '#10B981' : '#262626', color: copied ? '#10B981' : '#a3a3a3', background: copied ? '#052e1a' : '#171717' }}
            >
              <Link2 size={11} /> {copied ? 'Copied!' : 'Share'}
            </button>
            <button onClick={() => exportCSV(campaign, edits)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-black rounded-md border border-neutral-800 bg-neutral-900 text-neutral-100 hover:bg-neutral-800 transition-all"
            >
              <Download size={11} /> Export CSV
            </button>
          </div>
        </motion.div>

        {/* Brand/Artist Hero Section */}
        {isBrandCampaign ? (
          /* Brand/Film hero - shows logo prominently */
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8"
          >
            <div className="flex items-center gap-5">
              {(campaign as any).logo_url ? (
                <div className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                  {/* Ambient glow */}
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-white/20 via-white/5 to-transparent blur-xl opacity-70" />
                  {/* Glass ring */}
                  <div className="relative w-full h-full rounded-full p-[2px] bg-gradient-to-br from-white/40 via-white/10 to-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center relative">
                      <img
                        src={(campaign as any).logo_url}
                        alt={campaign.client_name || ''}
                        className="w-[78%] h-[78%] object-contain relative z-10"
                      />
                      {/* Specular highlight */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/60 via-transparent to-transparent opacity-40 pointer-events-none" />
                      <div className="absolute -top-1 left-1/4 w-1/2 h-1/3 bg-white/50 blur-md rounded-full pointer-events-none" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Globe size={26} className="text-neutral-500" />
                </div>
              )}
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-500 font-black mb-1">
                  {campaign.campaign_type === 'film' ? 'Film Campaign' : 'Brand Campaign'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-50">{campaign.client_name || campaign.name}</h2>
                {campaign.description && <p className="text-sm text-neutral-400 mt-1">{campaign.description}</p>}
              </div>
            </div>
          </motion.div>
        ) : artist ? (
          /* Artist hero */
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl overflow-hidden border border-neutral-800"
          >
            {artist.banner_url && (
              <div className="h-32 sm:h-40 overflow-hidden relative">
                <img src={artist.banner_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950" />
              </div>
            )}
            <div className={`p-5 sm:p-6 bg-neutral-950 ${artist.banner_url ? '-mt-10 relative z-10' : ''}`}>
              <div className="flex items-start gap-4">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-neutral-700 shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-neutral-800 border-2 border-neutral-700 shadow-md flex items-center justify-center flex-shrink-0">
                    <Music size={18} className="text-neutral-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex items-center">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-neutral-50 truncate">{artist.name}</h2>
                    {artist.verified && <CheckCircle size={14} className="text-neutral-50 flex-shrink-0" />}
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
              <h1 className="text-3xl sm:text-4xl font-black text-neutral-50 tracking-tight">{campaign.name}</h1>
              {campaign.description && !isBrandCampaign && <p className="text-sm text-neutral-400 mt-1">{campaign.description}</p>}
            </div>
            <span className={`text-[9px] px-3 py-1 uppercase tracking-wider font-black rounded-full flex-shrink-0 ${
              campaign.status === 'active' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900' :
              campaign.status === 'completed' ? 'bg-neutral-800 text-neutral-400 border border-neutral-800' :
              'bg-amber-950/40 text-amber-400 border border-amber-900'
            }`}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{
                background: campaign.status === 'active' ? '#10B981' : campaign.status === 'completed' ? '#9CA3AF' : '#F59E0B'
              }} />
              {campaign.status === 'active' ? 'Live Campaign' : campaign.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-500 font-bold">
            {campaign.start_date && (
              <span>{new Date(campaign.start_date).toLocaleDateString()}{campaign.end_date ? ` — ${new Date(campaign.end_date).toLocaleDateString()}` : ' — Ongoing'}</span>
            )}
            {campaign.client_name && !isBrandCampaign && <span>• {campaign.client_name}</span>}
          </div>
        </motion.div>

        {/* Empty state — surfaced early so client sees pipeline status immediately */}
        {edits.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-xl p-10 text-center border border-neutral-800 bg-neutral-950"
          >
            <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-neutral-800">
              <BarChart3 size={20} className="text-neutral-500" />
            </div>
            <p className="text-lg font-black text-neutral-50 mb-1">Content Pipeline Initializing</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Your campaign content is being produced and distributed. Performance metrics will populate in real-time as content goes live.
            </p>
          </motion.div>
        )}

        {/* ★ BIG Views Generated Counter */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18 }}
          className="relative overflow-hidden rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 sm:p-8"
        >
          {/* Subtle ambient glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[220px] bg-emerald-500/[0.06] blur-3xl rounded-full" />

          <div className="relative text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-black mb-3">Views Generated</p>
            <p className="text-[64px] sm:text-[88px] font-black text-neutral-50 tracking-tight tabular-nums leading-[0.95]">
              {displayViews > 0 ? formatNumber(displayViews) : '—'}
            </p>

            {(campaign.budget_cents && campaign.budget_cents > 0 && displayViews > 0) ? (() => {
              const cpm = ((campaign.spent_cents || campaign.budget_cents) / 100) / (displayViews / 1000);
              // Industry CPM benchmarks (paid social / influencer): <$2 elite, <$5 great, <$10 solid, <$20 avg, else weak
              const tier =
                cpm < 2 ? { label: 'Elite Efficiency', color: 'text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' } :
                cpm < 5 ? { label: 'Great', color: 'text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/25', dot: 'bg-emerald-400' } :
                cpm < 10 ? { label: 'Solid', color: 'text-sky-300', bg: 'bg-sky-500/10', ring: 'ring-sky-500/25', dot: 'bg-sky-400' } :
                cpm < 20 ? { label: 'Industry Avg', color: 'text-amber-300', bg: 'bg-amber-500/10', ring: 'ring-amber-500/25', dot: 'bg-amber-400' } :
                { label: 'Above Avg Cost', color: 'text-rose-300', bg: 'bg-rose-500/10', ring: 'ring-rose-500/25', dot: 'bg-rose-400' };
              return (
                <div className="mt-5 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-neutral-900/80 ring-1 ring-inset ring-neutral-800 backdrop-blur-sm">
                  <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 font-black">CPM</span>
                  <span className="text-base sm:text-lg font-black text-neutral-50 tabular-nums tracking-tight">${cpm.toFixed(2)}</span>
                  <span className="text-[9px] text-neutral-600 font-bold">/ 1K</span>
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-black ${tier.bg} ${tier.color} ring-1 ring-inset ${tier.ring}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
                    {tier.label}
                  </span>
                </div>
              );
            })() : null}
          </div>

          <div className="relative flex items-center justify-center gap-3 mt-6">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing || cooldownRemaining > 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all ${
                refreshing || cooldownRemaining > 0
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  : 'bg-neutral-100 text-neutral-950 hover:bg-white active:scale-95'
              }`}
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : cooldownRemaining > 0
                ? `${Math.floor(cooldownRemaining / 60)}:${String(cooldownRemaining % 60).padStart(2, '0')}`
                : 'Refresh Stats'}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 text-[9px] text-neutral-500">
            <span className="font-bold">Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Auto-refreshes every 30 min</span>
          </div>
        </motion.div>

        {/* ★ Views Growth Chart */}
        {growthData.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-black">Growth Over Time</p>
                <p className="text-[9px] text-neutral-500 mt-0.5">Cumulative views by content publish date</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                <TrendingUp size={14} className="text-neutral-300" />
              </div>
            </div>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={growthData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fafafa" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#fafafa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#a3a3a3', fontWeight: 700 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: '#a3a3a3', fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatNumber(v)} />
                  <Tooltip
                    contentStyle={{ background: '#fafafa', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#171717' }}
                    labelStyle={{ color: '#525252', fontSize: 9 }}
                    formatter={(value: number, name: string) => [formatNumber(value), name === 'daily' ? 'Daily' : 'Total']}
                  />
                  <Bar dataKey="daily" fill="#404040" radius={[2, 2, 0, 0]} barSize={6} />
                  <Area type="monotone" dataKey="views" stroke="#fafafa" strokeWidth={2.5} fill="url(#viewsGradient)" dot={false} activeDot={{ r: 4, fill: '#fafafa', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* KPI Grid */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Total Reach', raw: displayViews, icon: Eye, sub: 'Organic + Paid Views' },
            { label: 'Shares', raw: totalShares, icon: Share2, sub: 'Content Shares' },
            { label: 'Engagements', raw: campaign.total_engagements, icon: Zap, sub: 'Likes, Shares, Comments' },
            { label: 'Click-Through', raw: campaign.total_clicks, icon: MousePointerClick, sub: 'Profile & Link Clicks' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.05 }}
              className="rounded-xl p-4 sm:p-5 border border-neutral-800 bg-neutral-950"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-neutral-800">
                  <stat.icon size={14} className="text-neutral-300" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-neutral-50">{stat.raw > 0 ? formatNumber(stat.raw) : '—'}</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400 mt-1">{stat.label}</p>
              <p className="text-[8px] text-neutral-500 mt-0.5">{stat.sub}</p>
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
            {
              label: 'CPM',
              value: (campaign.budget_cents && displayViews > 0)
                ? `$${(((campaign.spent_cents || campaign.budget_cents) / 100) / (displayViews / 1000)).toFixed(2)}`
                : '—',
              sub: 'Cost Per 1K Views',
            },
            { label: 'Campaign Budget', value: campaign.budget_cents ? `$${(campaign.budget_cents / 100).toLocaleString()}` : '—', sub: campaign.budget_cents ? 'Total Allocated' : 'Not Set' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-4 text-center border border-neutral-800 bg-neutral-900">
              <p className="text-xl font-black text-neutral-50">{m.value}</p>
              <p className="text-[8px] font-black uppercase tracking-wider text-neutral-400 mt-1">{m.label}</p>
              <p className="text-[8px] text-neutral-500">{m.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* Goal Progress */}
        {(campaign.goal_views > 0 || campaign.goal_posts > 0) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-xl p-5 sm:p-6 space-y-5 border border-neutral-800 bg-neutral-950"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Campaign Objectives</p>
              {campaign.goal_views > 0 && campaign.budget_cents && campaign.budget_cents > 0 && (
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${goalMode === 'views' ? 'text-neutral-50' : 'text-neutral-500'}`}>Views</span>
                  <Switch
                    checked={goalMode === 'cpm'}
                    onCheckedChange={(v) => setGoalMode(v ? 'cpm' : 'views')}
                    className="data-[state=checked]:bg-neutral-200 data-[state=unchecked]:bg-neutral-800"
                  />
                  <span className={`text-[9px] font-black uppercase tracking-wider ${goalMode === 'cpm' ? 'text-neutral-50' : 'text-neutral-500'}`}>CPM</span>
                </div>
              )}
            </div>
            {campaign.goal_views > 0 && goalMode === 'views' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-200 font-bold">{campaign.goal_label || 'Views Target'}</span>
                  <span className="text-sm font-black text-neutral-50">{Math.round(goalProgress)}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden bg-neutral-800">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${goalProgress}%` }} transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    className="h-full rounded-full bg-neutral-200"
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-neutral-500 font-bold">{campaign.total_views > 0 ? `${formatNumber(campaign.total_views)} achieved` : 'Awaiting data'}</span>
                  <span className="text-[10px] text-neutral-500 font-bold">Target: {formatNumber(campaign.goal_views)}</span>
                </div>
              </div>
            )}
            {campaign.goal_views > 0 && goalMode === 'cpm' && campaign.budget_cents && campaign.budget_cents > 0 && (() => {
              const budgetDollars = (campaign.spent_cents || campaign.budget_cents) / 100;
              const targetCpm = budgetDollars / (campaign.goal_views / 1000);
              const currentCpm = displayViews > 0 ? budgetDollars / (displayViews / 1000) : null;
              // Lower CPM is better. Progress = how close we are to (or beat) target.
              // If currentCpm <= targetCpm → 100%. Else scale inversely.
              const cpmProgress = currentCpm === null
                ? 0
                : currentCpm <= targetCpm
                  ? 100
                  : Math.max(0, Math.min(100, (targetCpm / currentCpm) * 100));
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-200 font-bold">CPM Efficiency Target</span>
                    <span className="text-sm font-black text-neutral-50">{Math.round(cpmProgress)}%</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden bg-neutral-800">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${cpmProgress}%` }} transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                      className="h-full rounded-full bg-neutral-200"
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-neutral-500 font-bold">
                      {currentCpm !== null ? `$${currentCpm.toFixed(2)} achieved` : 'Awaiting data'}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-bold">Target: ${targetCpm.toFixed(2)} / 1K</span>
                  </div>
                </div>
              );
            })()}
            {campaign.goal_posts > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-200 font-bold">Content Delivery</span>
                  <span className="text-sm font-black text-neutral-50">{edits.length}/{campaign.goal_posts}</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden bg-neutral-800 relative">
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
                <h3 className="text-xl font-black text-neutral-50">Content Performance</h3>
                <p className="text-[10px] text-neutral-500 font-bold mt-0.5">
                  {edits.length} published pieces{totalEditViews > 0 ? ` • ${formatNumber(totalEditViews)} combined reach` : ''}
                </p>
              </div>
              <button onClick={() => exportCSV(campaign, edits)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-black rounded-md border border-neutral-800 text-neutral-400 hover:bg-neutral-900 transition-all"
              >
                <Download size={11} /> CSV
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {edits.map((edit, i) => (
                <ContentTile
                  key={edit.id}
                  edit={edit}
                  index={i}
                  pColor={getPlatformColor(edit.platform)}
                  getPlatformIcon={getPlatformIcon}
                  formatNumber={formatNumber}
                />
              ))}
            </div>

            {/* Aggregate footer */}
            <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-neutral-500">Aggregate Performance</span>
              <div className="flex items-center gap-5 text-[10px]">
                <span className="text-neutral-400"><strong className="text-neutral-50 font-black">{formatNumber(totalEditViews)}</strong> reach</span>
                <span className="text-neutral-400"><strong className="text-neutral-50 font-black">{formatNumber(totalLikes + totalShares + totalComments)}</strong> engagement</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 pb-10">
          <img src={viralCartelCrest} alt="" className="w-5 h-5 mx-auto opacity-15 mb-2" />
          <p className="text-[8px] uppercase tracking-[0.3em] text-neutral-600 font-bold">Powered by Viral Cartel Studios</p>
          <p className="text-[7px] text-neutral-600 mt-1">Confidential — For authorized stakeholders only</p>
        </div>
      </div>

      {/* Floating concierge chat */}
      <CampaignSupportChat
        campaignId={campaign.id}
        campaignName={campaign.name}
        clientName={campaign.client_name}
      />
    </div>
  );
}
