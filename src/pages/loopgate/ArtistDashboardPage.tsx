import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Eye, TrendingUp, Zap, Play, ExternalLink, ArrowLeft, User, ShoppingBag, ChevronDown, ChevronUp, Target, RefreshCw, Check, Loader2, Music, Trophy, Download, Link2, Share2 } from 'lucide-react';
import { SiTiktok, SiYoutube, SiInstagram } from '@icons-pack/react-simple-icons';
import { useNavigate } from 'react-router-dom';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import { useArtistCampaigns } from '@/hooks/useArtistCampaigns';
import { toast } from 'sonner';
import loopgateBrand from '@/assets/loopgate-brand.png';

const luxuryFont = { fontFamily: "'Bebas Neue', sans-serif" };
const headerFont = { fontFamily: "'Jost', 'Futura', sans-serif", fontWeight: 400, letterSpacing: '0.25em' };

const BG = '#0B1121';
const CARD = '#0F172A';
const BORDER = 'rgba(148,163,184,0.08)';
const ACCENT = '#3B82F6';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function getPlatformIcon(platform: string | null) {
  switch (platform?.toLowerCase()) {
    case 'tiktok': return <SiTiktok size={12} />;
    case 'youtube': return <SiYoutube size={12} />;
    case 'instagram': return <SiInstagram size={12} />;
    default: return <Play size={12} />;
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
    case 'instagram': return 'Reels';
    default: return 'Post';
  }
}

function getEditDisplayTitle(title: string, platform: string | null, index: number): string {
  const t = title?.trim();
  if (!t || t.startsWith('http') || t.startsWith('Featured Drop Edit') || t.startsWith('Submission from')) {
    return `${getPlatformLabel(platform)} Content #${index + 1}`;
  }
  return t;
}

function exportCampaignCSV(campaign: any, edits: any[]) {
  const rows = [
    ['Content Title', 'Platform', 'Creator', 'Views', 'Likes', 'Shares', 'Comments', 'Published', 'URL'],
    ...edits.map((e, i) => [
      getEditDisplayTitle(e.title, e.platform, i),
      getPlatformLabel(e.platform),
      e.editor_username ? `@${e.editor_username}` : '—',
      String(e.view_count || 0),
      String(e.like_count || 0),
      String(e.share_count || 0),
      String(e.comment_count || 0),
      e.published_at ? new Date(e.published_at).toLocaleDateString() : '—',
      e.video_url || '—',
    ]),
    [],
    ['Summary'],
    ['Total Views', String(campaign.total_views)],
    ['Total Impressions', String(campaign.total_impressions)],
    ['Total Engagements', String(campaign.total_engagements)],
    ['ROI', campaign.roi_percentage ? `${campaign.roi_percentage}%` : '—'],
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${campaign.name.replace(/\s+/g, '-')}-report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ArtistDashboardPage() {
  const navigate = useNavigate();
  const { client, isAuthenticated, isLoading } = useEnterpriseAuth();
  const { campaigns, edits, loading, getEditsForCampaign, requestUpdate } = useArtistCampaigns(client?.id);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [requestingUpdate, setRequestingUpdate] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/enterprise/account');
    return null;
  }

  const handleRequestUpdate = async (campaignId?: string) => {
    if (!client?.id) return;
    setRequestingUpdate(true);
    try {
      await requestUpdate(client.id, campaignId, 'Please update my campaign metrics with the latest data.');
      toast.success('Update requested! Our team will refresh your metrics shortly.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send request');
    } finally {
      setRequestingUpdate(false);
    }
  };

  const totalViews = campaigns.reduce((s, c) => s + (c.total_views || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.total_impressions || 0), 0);
  const totalEngagements = campaigns.reduce((s, c) => s + (c.total_engagements || 0), 0);
  const totalEdits = edits.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalGoalViews = campaigns.reduce((s, c) => s + (c.goal_views || 0), 0);
  const overallProgress = totalGoalViews > 0 ? Math.min(100, (totalViews / totalGoalViews) * 100) : 0;

  return (
    <div className="min-h-screen relative overflow-hidden pb-20" style={{ background: BG }}>
      {/* Subtle ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[400px] rounded-full blur-[160px]" style={{ background: 'rgba(59,130,246,0.04)' }} />
      </div>

      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl" style={{ background: 'rgba(11,17,33,0.88)', borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/enterprise')} className="text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={loopgateBrand} alt="LOOPGATE" className="h-3.5 w-auto opacity-70" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRequestUpdate()}
              disabled={requestingUpdate}
              className="flex items-center gap-1.5 text-[9px] text-slate-500 hover:text-slate-300 uppercase tracking-[0.15em] transition-colors disabled:opacity-30"
            >
              {requestingUpdate ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Request Update
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl" style={{ background: 'rgba(11,17,33,0.92)', borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-lg mx-auto grid grid-cols-3 items-center h-14">
          <button className="flex flex-col items-center gap-0.5 text-blue-400 transition-colors py-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-[7px] uppercase tracking-[0.15em]" style={headerFont}>Dashboard</span>
          </button>
          <button onClick={() => navigate('/enterprise')} className="flex justify-center -mt-4">
            <span className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #1D4ED8)` }}
            >
              <ShoppingBag className="w-4 h-4 text-white relative z-10" />
            </span>
          </button>
          <button onClick={() => navigate('/enterprise/account')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-300 transition-colors py-1">
            <User className="w-4 h-4" />
            <span className="text-[7px] uppercase tracking-[0.15em]" style={headerFont}>Account</span>
          </button>
        </div>
      </nav>

      <div className="relative pt-16 px-5 max-w-2xl mx-auto">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 pt-2">
          <p className="text-[9px] text-slate-500 uppercase tracking-[0.4em] mb-2" style={headerFont}>Campaign Analytics</p>
          <h1 className="text-4xl text-white tracking-[-0.01em]" style={luxuryFont}>
            {client?.display_name || client?.email?.split('@')[0] || 'Client'}
          </h1>
          <p className="text-xs text-slate-500 mt-2">Real-time performance metrics across all campaigns.</p>
        </motion.div>

        {/* Overall Goal */}
        {totalGoalViews > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="mb-6 rounded-xl p-5 relative overflow-hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: ACCENT, opacity: 0.6 }} />
                <p className="text-[10px] text-blue-400/60 uppercase tracking-[0.2em] font-semibold">Overall Campaign Goal</p>
              </div>
              <p className="text-2xl text-white tabular-nums" style={luxuryFont}>{Math.round(overallProgress)}%</p>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.08)' }}>
              <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{ background: `linear-gradient(90deg, ${ACCENT}, #10B981)` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-slate-500">{formatNumber(totalViews)} views achieved</span>
              <span className="text-[10px] text-slate-500">{formatNumber(totalGoalViews)} target</span>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {[
            { value: formatNumber(totalViews), label: 'Total Reach', icon: Eye, color: '#3B82F6' },
            { value: formatNumber(totalImpressions), label: 'Impressions', icon: TrendingUp, color: '#8B5CF6' },
            { value: formatNumber(totalEngagements), label: 'Engagements', icon: Zap, color: '#F59E0B' },
            { value: String(totalEdits), label: 'Content Pieces', icon: Play, color: '#10B981' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-4 relative overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-[30px] opacity-10" style={{ background: stat.color }} />
              <div className="w-6 h-6 rounded-lg flex items-center justify-center mb-2" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl text-white tabular-nums" style={luxuryFont}>{stat.value}</p>
              <p className="text-[8px] text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Quick Stats Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex justify-between items-center rounded-xl px-4 py-3 mb-8"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-amber-500/40" />
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">{activeCampaigns} Active</span>
          </div>
          <div className="h-4 w-px" style={{ background: BORDER }} />
          <div className="flex items-center gap-1.5">
            <Music className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">{campaigns.length} Campaigns</span>
          </div>
          <div className="h-4 w-px" style={{ background: BORDER }} />
          <div className="flex items-center gap-1.5">
            <Play className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">{totalEdits} Edits</span>
          </div>
        </motion.div>

        {/* Campaigns */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] mb-5 font-semibold" style={headerFont}>Your Campaigns</p>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                <BarChart3 className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
              <p className="text-lg text-white mb-1" style={luxuryFont}>No Campaigns Yet</p>
              <p className="text-[10px] text-slate-500">Your campaigns and performance analytics will appear here once activated.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign, i) => {
                const campaignEdits = getEditsForCampaign(campaign.id);
                const isExpanded = expandedCampaign === campaign.id;
                const editTotalViews = campaignEdits.reduce((s, e) => s + (e.view_count || 0), 0);
                const goalProgress = campaign.goal_views > 0 ? Math.min(100, (campaign.total_views / campaign.goal_views) * 100) : 0;
                const remaining = campaign.goal_views > campaign.total_views ? campaign.goal_views - campaign.total_views : 0;
                const slug = (campaign as any).slug;

                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="rounded-xl overflow-hidden"
                    style={{ background: CARD, border: `1px solid ${BORDER}` }}
                  >
                    {/* Campaign Header */}
                    <button
                      onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                      className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <BarChart3 className="w-4 h-4" style={{ color: ACCENT }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white truncate font-semibold">{campaign.name}</p>
                          <span className={`text-[7px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                            campaign.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                            campaign.status === 'completed' ? 'bg-slate-500/15 text-slate-400' :
                            'bg-amber-500/15 text-amber-400'
                          }`}>{campaign.status === 'active' ? 'Live' : campaign.status}</span>
                        </div>
                        <div className="flex gap-4 mt-1">
                          <span className="text-[9px] text-slate-500">{formatNumber(campaign.total_views)} reach</span>
                          <span className="text-[9px] text-slate-500">{campaignEdits.length} edits</span>
                          {campaign.goal_views > 0 && (
                            <span className="text-[9px] text-blue-400/50">{Math.round(goalProgress)}% to goal</span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>

                    {/* Goal Progress Bar */}
                    {campaign.goal_views > 0 && (
                      <div className="px-4 pb-2">
                        <div className="h-1.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(148,163,184,0.06)' }}>
                          <div className="h-full rounded-full absolute inset-y-0 left-0 transition-all duration-1000"
                            style={{ width: `${goalProgress}%`, background: `linear-gradient(90deg, ${ACCENT}, #10B981)` }}
                          />
                        </div>
                        {(campaign as any).incoming_note && (
                          <div className="pt-1.5 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[9px] text-emerald-400 font-medium">{(campaign as any).incoming_note}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded */}
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        style={{ borderTop: `1px solid ${BORDER}` }}
                      >
                        {/* Quick Actions Bar */}
                        <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(59,130,246,0.03)' }}>
                          {slug && (
                            <a href={`/campaign/${slug}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] uppercase tracking-wider font-bold rounded-md transition-all"
                              style={{ background: 'rgba(59,130,246,0.12)', color: ACCENT, border: '1px solid rgba(59,130,246,0.2)' }}
                            >
                              <ExternalLink size={10} /> View Live Report
                            </a>
                          )}
                          <button onClick={() => {
                            if (slug) {
                              navigator.clipboard.writeText(`${window.location.origin}/campaign/${slug}`);
                              toast.success('Campaign link copied!');
                            }
                          }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] uppercase tracking-wider font-bold rounded-md transition-all"
                            style={{ background: 'rgba(148,163,184,0.06)', color: '#94a3b8', border: `1px solid ${BORDER}` }}
                          >
                            <Link2 size={10} /> Copy Link
                          </button>
                          <button onClick={() => exportCampaignCSV(campaign, campaignEdits)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] uppercase tracking-wider font-bold rounded-md transition-all"
                            style={{ background: 'rgba(148,163,184,0.06)', color: '#94a3b8', border: `1px solid ${BORDER}` }}
                          >
                            <Download size={10} /> Export CSV
                          </button>
                        </div>

                        {/* Campaign Stats */}
                        <div className="grid grid-cols-4 gap-[1px]" style={{ background: BORDER }}>
                          {[
                            { label: 'Reach', value: formatNumber(campaign.total_views) },
                            { label: 'Impressions', value: formatNumber(campaign.total_impressions) },
                            { label: 'Engagements', value: formatNumber(campaign.total_engagements) },
                            { label: 'ROI', value: campaign.roi_percentage ? `${campaign.roi_percentage}%` : '—' },
                          ].map(s => (
                            <div key={s.label} className="p-3 text-center" style={{ background: CARD }}>
                              <p className="text-lg text-white tabular-nums" style={luxuryFont}>{s.value}</p>
                              <p className="text-[7px] text-slate-500 uppercase tracking-wider">{s.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Goal Section */}
                        {campaign.goal_views > 0 && (
                          <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}`, background: 'rgba(59,130,246,0.02)' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-3 h-3" style={{ color: ACCENT, opacity: 0.5 }} />
                              <span className="text-[9px] text-blue-400/50 uppercase tracking-[0.15em] font-semibold">
                                {campaign.goal_label || 'Campaign Goal'}
                              </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(148,163,184,0.06)' }}>
                              <div className="h-full rounded-full" style={{ width: `${goalProgress}%`, background: `linear-gradient(90deg, ${ACCENT}, #10B981)` }} />
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[9px] text-slate-500">{formatNumber(campaign.total_views)} / {formatNumber(campaign.goal_views)}</span>
                              {remaining > 0 ? (
                                <span className="text-[9px] text-blue-400/50">{formatNumber(remaining)} remaining</span>
                              ) : (
                                <span className="text-[9px] text-emerald-400/70 flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> Goal Exceeded
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {campaign.description && (
                          <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                            <p className="text-[10px] text-slate-400">{campaign.description}</p>
                          </div>
                        )}

                        {/* Edits */}
                        <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                          <p className="text-[8px] text-slate-500 uppercase tracking-[0.2em] mb-3 font-semibold">Content Performance</p>
                          {campaignEdits.length === 0 ? (
                            <p className="text-[10px] text-slate-600 text-center py-4 italic">Content pipeline initializing…</p>
                          ) : (
                            <div className="space-y-2">
                              {campaignEdits.map((edit, ei) => {
                                const pColor = getPlatformColor(edit.platform);
                                return (
                                  <div key={edit.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(148,163,184,0.04)', border: `1px solid ${BORDER}` }}>
                                    {edit.thumbnail_url ? (
                                      <img src={edit.thumbnail_url} alt="" className="w-14 h-9 object-cover rounded flex-shrink-0" />
                                    ) : (
                                      <div className="w-14 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${pColor}10` }}>
                                        <span style={{ color: pColor }}>{getPlatformIcon(edit.platform)}</span>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] text-white truncate font-medium">{getEditDisplayTitle(edit.title, edit.platform, ei)}</p>
                                      <div className="flex gap-3 mt-0.5">
                                        {edit.view_count > 0 && <span className="text-[8px] text-slate-500">{formatNumber(edit.view_count)} reach</span>}
                                        <span className="text-[8px]" style={{ color: `${pColor}80` }}>{getPlatformLabel(edit.platform)}</span>
                                        {edit.editor_username && <span className="text-[8px] text-slate-600">@{edit.editor_username}</span>}
                                      </div>
                                    </div>
                                    {edit.video_url && (
                                      <a href={edit.video_url} target="_blank" rel="noopener noreferrer"
                                        className="p-1.5 rounded-md transition-colors" style={{ background: 'rgba(59,130,246,0.08)' }}
                                      >
                                        <ExternalLink className="w-3 h-3" style={{ color: ACCENT }} />
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {campaignEdits.length > 0 && (
                          <div className="px-4 py-2 flex justify-between" style={{ borderTop: `1px solid ${BORDER}` }}>
                            <span className="text-[8px] text-slate-600 uppercase tracking-wider">Combined Content Reach</span>
                            <span className="text-[10px] text-slate-300 tabular-nums font-semibold">{formatNumber(editTotalViews)}</span>
                          </div>
                        )}

                        {/* Request Update */}
                        <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                          <button
                            onClick={() => handleRequestUpdate(campaign.id)}
                            disabled={requestingUpdate}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[9px] text-slate-400 hover:text-slate-200 uppercase tracking-[0.15em] transition-all disabled:opacity-30"
                            style={{ background: 'rgba(148,163,184,0.04)', border: `1px solid ${BORDER}` }}
                          >
                            {requestingUpdate ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Request Metrics Update
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-10 pt-6 pb-4 text-center" style={{ borderTop: `1px solid ${BORDER}` }}
        >
          <img src={loopgateBrand} alt="LOOPGATE" className="h-3 w-auto opacity-20 mx-auto mb-2" />
          <p className="text-[7px] text-slate-600 uppercase tracking-[0.4em]" style={headerFont}>Campaign Analytics Dashboard</p>
        </motion.div>

        <div className="h-10" />
      </div>
    </div>
  );
}
