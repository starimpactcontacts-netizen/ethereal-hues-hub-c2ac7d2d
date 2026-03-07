import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, Zap, MousePointerClick, BarChart3, ExternalLink, Play, Music, Globe, CheckCircle, Download, Link2, Share2 } from 'lucide-react';
import { SiTiktok, SiYoutube, SiInstagram } from '@icons-pack/react-simple-icons';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import viralCartelCrest from '@/assets/viral-cartel-crest.png';

interface CampaignData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  total_views: number;
  total_impressions: number;
  total_engagements: number;
  total_clicks: number;
  budget_cents: number | null;
  spent_cents: number | null;
  roi_percentage: number | null;
  goal_views: number;
  goal_label: string | null;
  goal_posts: number;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  slug: string;
  featured_artist_id: string | null;
  incoming_note: string | null;
  client_name: string | null;
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
    case 'tiktok': return '#25F4EE';
    case 'youtube': return '#FF0000';
    case 'instagram': return '#E4405F';
    default: return '#94a3b8';
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

function getEditDisplayTitle(edit: EditData, index: number): string {
  const t = edit.title?.trim();
  if (!t || t.startsWith('http') || t.startsWith('Featured Drop Edit')) {
    const platformLabel = getPlatformLabel(edit.platform);
    return `${platformLabel} Campaign Content #${index + 1}`;
  }
  return t;
}

function getYouTubeThumbnail(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

// CSV export utility
function exportCSV(campaign: CampaignData, edits: EditData[]) {
  const rows = [
    ['Content Title', 'Platform', 'Creator', 'Views', 'Likes', 'Shares', 'Comments', 'Published', 'Status', 'URL'],
    ...edits.map((e, i) => [
      getEditDisplayTitle(e, i),
      getPlatformLabel(e.platform),
      e.editor_username ? `@${e.editor_username}` : '—',
      String(e.view_count),
      String(e.like_count),
      String(e.share_count),
      String(e.comment_count),
      e.published_at ? new Date(e.published_at).toLocaleDateString() : '—',
      e.status,
      e.video_url || '—',
    ]),
    [],
    ['Campaign Summary'],
    ['Total Views', String(campaign.total_views)],
    ['Total Impressions', String(campaign.total_impressions)],
    ['Total Engagements', String(campaign.total_engagements)],
    ['Total Clicks', String(campaign.total_clicks)],
    ['ROI', campaign.roi_percentage ? `${campaign.roi_percentage}%` : '—'],
    ['Budget', campaign.budget_cents ? `$${(campaign.budget_cents / 100).toFixed(2)}` : '—'],
    ['Spent', campaign.spent_cents ? `$${(campaign.spent_cents / 100).toFixed(2)}` : '—'],
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${campaign.name.replace(/\s+/g, '-')}-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const BG = '#0B1121';
const CARD = '#0F172A';
const BORDER = 'rgba(148,163,184,0.08)';
const ACCENT = '#3B82F6';

export default function CampaignPortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [edits, setEdits] = useState<EditData[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function fetchData() {
      try {
        const { data, error: fetchError } = await supabase.functions.invoke('manage-campaigns', {
          body: { action: 'get-campaign-public', slug }
        });
        if (fetchError) throw fetchError;
        if (data?.error) throw new Error(data.error);
        setCampaign(data.campaign);
        setArtist(data.artist);
        setEdits(data.edits || []);
      } catch (err: any) {
        console.error('Failed to fetch campaign:', err);
        setError('Campaign not found');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BG }}>
        <div className="text-center">
          <BarChart3 className="w-10 h-10 text-blue-500/20 mx-auto mb-4" />
          <h1 className="font-display text-xl text-white/90">{error || 'Not found'}</h1>
          <p className="text-xs text-slate-400 mt-2">This campaign link may be invalid or expired.</p>
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      {/* Subtle gradient bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] rounded-full blur-[180px]" style={{ background: 'rgba(59,130,246,0.04)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full blur-[150px]" style={{ background: 'rgba(16,185,129,0.03)' }} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Top bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={viralCartelCrest} alt="" className="w-7 h-7 opacity-50" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-semibold">Campaign Performance Report</p>
              <p className="text-[9px] text-slate-600">Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold rounded-md transition-all"
              style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.08)', color: copied ? '#10B981' : '#94a3b8', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : BORDER}` }}
            >
              <Link2 size={11} /> {copied ? 'Copied!' : 'Share'}
            </button>
            <button
              onClick={() => exportCSV(campaign, edits)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold rounded-md transition-all"
              style={{ background: 'rgba(59,130,246,0.1)', color: ACCENT, border: '1px solid rgba(59,130,246,0.2)' }}
            >
              <Download size={11} /> Export CSV
            </button>
          </div>
        </motion.div>

        {/* Artist Hero */}
        {artist && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            {artist.banner_url && (
              <div className="h-32 sm:h-40 overflow-hidden relative">
                <img src={artist.banner_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${CARD})` }} />
              </div>
            )}
            <div className={`p-5 sm:p-6 ${artist.banner_url ? '-mt-10 relative z-10' : ''}`}>
              <div className="flex items-start gap-4">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-700 flex-shrink-0 shadow-lg"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center flex-shrink-0">
                    <Music size={18} className="text-slate-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl text-white truncate">{artist.name}</h2>
                    {artist.verified && <CheckCircle size={14} className="text-blue-500 flex-shrink-0" />}
                  </div>
                  {artist.genre && <span className="text-[10px] uppercase tracking-widest text-blue-400/60 font-bold">{artist.genre}</span>}
                  {artist.bio && <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{artist.bio}</p>}
                  <div className="flex items-center gap-4 mt-3">
                    {artist.monthly_streams && (
                      <div>
                        <p className="font-display text-sm text-white">{formatNumber(artist.monthly_streams)}</p>
                        <p className="text-[7px] uppercase tracking-widest text-slate-500">Monthly Streams</p>
                      </div>
                    )}
                    <a href={`/artist/${artist.slug}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-blue-400/60 hover:text-blue-400 transition-colors"
                    >
                      <Globe size={10} /> Artist Profile
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Campaign Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-white">{campaign.name}</h1>
              {campaign.description && <p className="text-sm text-slate-400 mt-1">{campaign.description}</p>}
            </div>
            <span className={`text-[9px] px-3 py-1 uppercase tracking-wider font-bold rounded-full flex-shrink-0 ${
              campaign.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
              campaign.status === 'completed' ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30' :
              'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{
                background: campaign.status === 'active' ? '#10B981' : campaign.status === 'completed' ? '#64748b' : '#F59E0B'
              }} />
              {campaign.status === 'active' ? 'Live Campaign' : campaign.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
            {campaign.start_date && (
              <span>{new Date(campaign.start_date).toLocaleDateString()}{campaign.end_date ? ` — ${new Date(campaign.end_date).toLocaleDateString()}` : ' — Ongoing'}</span>
            )}
            {campaign.client_name && <span>• {campaign.client_name}</span>}
          </div>
        </motion.div>

        {/* KPI Grid */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Total Reach', raw: campaign.total_views, icon: Eye, color: '#3B82F6', sub: 'Organic + Paid Views' },
            { label: 'Impressions', raw: campaign.total_impressions, icon: TrendingUp, color: '#8B5CF6', sub: 'Feed Appearances' },
            { label: 'Engagements', raw: campaign.total_engagements, icon: Zap, color: '#F59E0B', sub: 'Likes, Shares, Comments' },
            { label: 'Click-Through', raw: campaign.total_clicks, icon: MousePointerClick, color: '#10B981', sub: 'Profile & Link Clicks' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="rounded-xl p-4 sm:p-5 relative overflow-hidden"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-[40px] opacity-10" style={{ background: stat.color }} />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                  <stat.icon size={14} style={{ color: stat.color }} />
                </div>
              </div>
              <p className="font-display text-2xl text-white">{stat.raw > 0 ? formatNumber(stat.raw) : '—'}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mt-1">{stat.label}</p>
              <p className="text-[8px] text-slate-600 mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Secondary metrics row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Content Pieces', value: String(edits.length), sub: 'Published Edits' },
            { label: 'Engagement Rate', value: `${engagementRate}%`, sub: 'Interactions / Reach' },
            { label: 'ROI', value: campaign.roi_percentage ? `${campaign.roi_percentage}%` : '—', sub: 'Return on Investment' },
            { label: 'Budget Utilization', value: campaign.budget_cents ? `$${((campaign.spent_cents || 0) / 100).toLocaleString()}` : '—', sub: campaign.budget_cents ? `of $${(campaign.budget_cents / 100).toLocaleString()}` : 'Not Set' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-4 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <p className="font-display text-lg text-white">{m.value}</p>
              <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400 mt-1">{m.label}</p>
              <p className="text-[8px] text-slate-600">{m.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* Goal Progress */}
        {(campaign.goal_views > 0 || campaign.goal_posts > 0) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-xl p-5 sm:p-6 space-y-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Campaign Objectives</p>

            {campaign.goal_views > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-300 font-medium">{campaign.goal_label || 'Views Target'}</span>
                  <span className="font-display text-sm text-white">{Math.round(goalProgress)}%</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.08)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${ACCENT}, #10B981)` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-slate-500">{campaign.total_views > 0 ? `${formatNumber(campaign.total_views)} achieved` : 'Awaiting data'}</span>
                  <span className="text-[10px] text-slate-500">Target: {formatNumber(campaign.goal_views)}</span>
                </div>
              </div>
            )}

            {campaign.goal_posts > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-300 font-medium">Content Delivery</span>
                  <span className="font-display text-sm text-white">{edits.length}/{campaign.goal_posts}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(148,163,184,0.08)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${postsProgress}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.7 }}
                    className="h-full rounded-full absolute inset-y-0 left-0"
                    style={{ background: 'linear-gradient(90deg, #8B5CF6, #EC4899)' }}
                  />
                  {campaign.incoming_note && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, postsProgress + 12)}%` }}
                      transition={{ duration: 1.8, ease: 'easeOut', delay: 0.9 }}
                      className="h-full rounded-full absolute inset-y-0 left-0 opacity-40"
                      style={{ background: 'linear-gradient(90deg, #10B981, #34D399)' }}
                    />
                  )}
                </div>
                {campaign.incoming_note && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-medium">{campaign.incoming_note}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Content Performance Table */}
        {edits.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="p-5 sm:p-6 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg text-white">Content Performance</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {edits.length} published pieces{totalEditViews > 0 ? ` • ${formatNumber(totalEditViews)} combined reach` : ''}
                </p>
              </div>
              <button onClick={() => exportCSV(campaign, edits)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold rounded-md transition-all"
                style={{ background: 'rgba(148,163,184,0.06)', color: '#94a3b8', border: `1px solid ${BORDER}` }}
              >
                <Download size={11} /> CSV
              </button>
            </div>

            <div className="divide-y" style={{ borderColor: BORDER }}>
              {edits.map((edit, i) => {
                const displayTitle = getEditDisplayTitle(edit, i);
                const thumb = edit.thumbnail_url || getYouTubeThumbnail(edit.video_url) || null;
                const hasStats = edit.view_count > 0 || edit.like_count > 0 || edit.share_count > 0 || edit.comment_count > 0;
                const pColor = getPlatformColor(edit.platform);

                return (
                  <motion.div
                    key={edit.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.03 }}
                    className="flex items-stretch hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Thumbnail */}
                    <div className="w-32 sm:w-40 flex-shrink-0 relative overflow-hidden" style={{ background: 'rgba(148,163,184,0.04)' }}>
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover min-h-[90px]" />
                      ) : (
                        <div className="w-full h-full min-h-[90px] flex flex-col items-center justify-center gap-1">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${pColor}15` }}>
                            {getPlatformIcon(edit.platform)}
                          </div>
                          <span className="text-[8px] text-slate-600 uppercase tracking-wider">{getPlatformLabel(edit.platform)}</span>
                        </div>
                      )}
                      {/* Platform pill overlay */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold backdrop-blur-sm flex items-center gap-1"
                        style={{ background: 'rgba(0,0,0,0.7)', color: pColor }}
                      >
                        {getPlatformIcon(edit.platform)}
                        <span className="hidden sm:inline">{getPlatformLabel(edit.platform)}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 min-w-0 flex flex-col justify-center">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{displayTitle}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {edit.editor_username && (
                              <span className="text-[10px] text-slate-500">@{edit.editor_username}</span>
                            )}
                            {edit.published_at && (
                              <span className="text-[10px] text-slate-600">{new Date(edit.published_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        {edit.video_url && (
                          <a href={edit.video_url} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            style={{ background: 'rgba(59,130,246,0.1)' }}
                          >
                            <ExternalLink size={13} style={{ color: ACCENT }} />
                          </a>
                        )}
                      </div>

                      {/* Metrics bar */}
                      {hasStats ? (
                        <div className="flex items-center gap-5 mt-3">
                          {edit.view_count > 0 && (
                            <div>
                              <p className="font-display text-sm text-white">{formatNumber(edit.view_count)}</p>
                              <p className="text-[7px] uppercase tracking-widest text-slate-500">Reach</p>
                            </div>
                          )}
                          {edit.like_count > 0 && (
                            <div>
                              <p className="font-display text-sm text-white">{formatNumber(edit.like_count)}</p>
                              <p className="text-[7px] uppercase tracking-widest text-slate-500">Likes</p>
                            </div>
                          )}
                          {edit.share_count > 0 && (
                            <div>
                              <p className="font-display text-sm text-white">{formatNumber(edit.share_count)}</p>
                              <p className="text-[7px] uppercase tracking-widest text-slate-500">Shares</p>
                            </div>
                          )}
                          {edit.comment_count > 0 && (
                            <div>
                              <p className="font-display text-sm text-white">{formatNumber(edit.comment_count)}</p>
                              <p className="text-[7px] uppercase tracking-widest text-slate-500">Comments</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-600 mt-2 italic">Performance data syncing…</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Aggregate footer */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}`, background: 'rgba(59,130,246,0.03)' }}>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Aggregate Content Performance</span>
              <div className="flex items-center gap-5 text-[10px]">
                <span className="text-slate-300"><strong className="text-white">{formatNumber(totalEditViews)}</strong> reach</span>
                <span className="text-slate-300"><strong className="text-white">{formatNumber(totalLikes)}</strong> likes</span>
                <span className="text-slate-300"><strong className="text-white">{formatNumber(totalShares)}</strong> shares</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {edits.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="rounded-xl p-10 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
              <BarChart3 size={20} style={{ color: ACCENT }} />
            </div>
            <p className="font-display text-lg text-white mb-1">Content Pipeline Initializing</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your campaign content is being produced and distributed. Performance metrics will populate in real-time as content goes live across platforms.
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 pb-10">
          <img src={viralCartelCrest} alt="" className="w-5 h-5 mx-auto opacity-20 mb-2" />
          <p className="text-[8px] uppercase tracking-[0.3em] text-slate-600">Powered by Viral Cartel Studios</p>
          <p className="text-[7px] text-slate-700 mt-1">Confidential — For authorized stakeholders only</p>
        </div>
      </div>
    </div>
  );
}
