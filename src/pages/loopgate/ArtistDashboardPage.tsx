import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Eye, TrendingUp, Zap, Play, ExternalLink, ArrowLeft, User, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import { useArtistCampaigns } from '@/hooks/useArtistCampaigns';
import loopgateBrand from '@/assets/loopgate-brand.png';

const luxuryFont = { fontFamily: "'Bebas Neue', sans-serif" };
const headerFont = { fontFamily: "'Jost', 'Futura', sans-serif", fontWeight: 400, letterSpacing: '0.25em' };

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default function ArtistDashboardPage() {
  const navigate = useNavigate();
  const { client, isAuthenticated, isLoading } = useEnterpriseAuth();
  const { campaigns, edits, loading, getEditsForCampaign } = useArtistCampaigns(client?.id);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060606' }}>
        <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/enterprise/account');
    return null;
  }

  // Aggregate stats
  const totalViews = campaigns.reduce((s, c) => s + (c.total_views || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.total_impressions || 0), 0);
  const totalEngagements = campaigns.reduce((s, c) => s + (c.total_engagements || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen relative overflow-hidden pb-20" style={{ background: '#060606' }}>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b border-white/[0.04]" style={{ background: 'rgba(6,6,6,0.85)' }}>
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/enterprise')} className="text-white/20 hover:text-white/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={loopgateBrand} alt="LOOPGATE" className="h-3.5 w-auto opacity-70" />
          </div>
          <span className="text-[8px] text-white/15 uppercase tracking-[0.3em]" style={headerFont}>Dashboard</span>
        </div>
      </header>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] backdrop-blur-2xl" style={{ background: 'rgba(6,6,6,0.92)' }}>
        <div className="max-w-lg mx-auto grid grid-cols-3 items-center h-14">
          <button onClick={() => {}} className="flex flex-col items-center gap-0.5 text-white/80 transition-colors py-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-[7px] uppercase tracking-[0.15em]" style={headerFont}>Dashboard</span>
          </button>
          <button onClick={() => navigate('/enterprise')} className="flex justify-center -mt-4">
            <span className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#E00000] to-[#8B0000] flex items-center justify-center shadow-[0_0_16px_rgba(224,0,0,0.35)]">
              <ShoppingBag className="w-4 h-4 text-white relative z-10" />
            </span>
          </button>
          <button onClick={() => navigate('/enterprise/account')} className="flex flex-col items-center gap-0.5 text-white/30 hover:text-white/70 transition-colors py-1">
            <User className="w-4 h-4" />
            <span className="text-[7px] uppercase tracking-[0.15em]" style={headerFont}>Account</span>
          </button>
        </div>
      </nav>

      <div className="pt-16 px-5 max-w-2xl mx-auto">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-2">
          <p className="text-[8px] text-white/15 uppercase tracking-[0.5em] mb-2" style={headerFont}>Welcome Back</p>
          <h1 className="text-4xl text-white/90 tracking-[-0.01em]" style={luxuryFont}>
            {client?.display_name || client?.email?.split('@')[0] || 'Client'}
          </h1>
          <p className="text-[11px] text-white/20 mt-2">Your campaign performance at a glance.</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-[1px] bg-white/[0.04] mb-8"
        >
          {[
            { value: formatNumber(totalViews), label: 'Total Views', icon: Eye },
            { value: formatNumber(totalImpressions), label: 'Impressions', icon: TrendingUp },
            { value: formatNumber(totalEngagements), label: 'Engagements', icon: Zap },
            { value: String(activeCampaigns), label: 'Active Campaigns', icon: Play },
          ].map(stat => (
            <div key={stat.label} className="p-5 text-center" style={{ background: '#0A0A0A' }}>
              <stat.icon className="w-4 h-4 text-white/10 mx-auto mb-2" />
              <p className="text-2xl text-white/60 tabular-nums" style={luxuryFont}>{stat.value}</p>
              <p className="text-[7px] text-white/12 uppercase tracking-[0.15em] mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Campaigns */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-[9px] text-white/15 uppercase tracking-[0.5em] mb-5" style={headerFont}>Your Campaigns</p>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin mx-auto" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="border border-white/[0.06] p-8 text-center" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <BarChart3 className="w-6 h-6 text-white/10 mx-auto mb-3" />
              <p className="text-lg text-white/40 mb-1" style={luxuryFont}>No Campaigns Yet</p>
              <p className="text-[9px] text-white/15">Your campaigns and analytics will appear here once activated.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign, i) => {
                const campaignEdits = getEditsForCampaign(campaign.id);
                const isExpanded = expandedCampaign === campaign.id;
                const editTotalViews = campaignEdits.reduce((s, e) => s + (e.view_count || 0), 0);

                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="border border-white/[0.06] overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.01)' }}
                  >
                    {/* Campaign Header */}
                    <button
                      onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                      className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="w-10 h-10 border border-white/[0.08] flex items-center justify-center bg-white/[0.02] flex-shrink-0">
                        <BarChart3 className="w-4 h-4 text-white/20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white/70 truncate" style={luxuryFont}>{campaign.name}</p>
                          <span className={`text-[7px] px-1.5 py-0.5 uppercase tracking-wider ${
                            campaign.status === 'active' ? 'bg-green-500/10 text-green-400/70' :
                            campaign.status === 'completed' ? 'bg-white/5 text-white/30' :
                            'bg-yellow-500/10 text-yellow-400/70'
                          }`}>{campaign.status}</span>
                        </div>
                        <div className="flex gap-4 mt-1">
                          <span className="text-[8px] text-white/20">{formatNumber(campaign.total_views)} views</span>
                          <span className="text-[8px] text-white/20">{campaignEdits.length} edits</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-white/15" /> : <ChevronDown className="w-4 h-4 text-white/15" />}
                    </button>

                    {/* Expanded: Campaign Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-t border-white/[0.04]"
                      >
                        {/* Campaign Stats */}
                        <div className="grid grid-cols-4 gap-[1px] bg-white/[0.03]">
                          {[
                            { label: 'Views', value: formatNumber(campaign.total_views) },
                            { label: 'Impressions', value: formatNumber(campaign.total_impressions) },
                            { label: 'Engagements', value: formatNumber(campaign.total_engagements) },
                            { label: 'ROI', value: campaign.roi_percentage ? `${campaign.roi_percentage}%` : '—' },
                          ].map(s => (
                            <div key={s.label} className="p-3 text-center" style={{ background: '#0A0A0A' }}>
                              <p className="text-lg text-white/50 tabular-nums" style={luxuryFont}>{s.value}</p>
                              <p className="text-[6px] text-white/10 uppercase tracking-wider">{s.label}</p>
                            </div>
                          ))}
                        </div>

                        {campaign.description && (
                          <div className="px-4 py-3 border-t border-white/[0.04]">
                            <p className="text-[10px] text-white/20">{campaign.description}</p>
                          </div>
                        )}

                        {/* Linked Edits */}
                        <div className="px-4 py-3 border-t border-white/[0.04]">
                          <p className="text-[7px] text-white/10 uppercase tracking-[0.3em] mb-3" style={headerFont}>Linked Edits</p>
                          {campaignEdits.length === 0 ? (
                            <p className="text-[9px] text-white/15 text-center py-4">No edits linked yet</p>
                          ) : (
                            <div className="space-y-2">
                              {campaignEdits.map(edit => (
                                <div key={edit.id} className="flex items-center gap-3 p-2 border border-white/[0.04] bg-white/[0.01]">
                                  {edit.thumbnail_url ? (
                                    <img src={edit.thumbnail_url} alt="" className="w-12 h-8 object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-12 h-8 bg-white/[0.03] flex items-center justify-center flex-shrink-0">
                                      <Play className="w-3 h-3 text-white/10" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-white/50 truncate">{edit.title}</p>
                                    <div className="flex gap-3 mt-0.5">
                                      <span className="text-[8px] text-white/20">{formatNumber(edit.view_count)} views</span>
                                      <span className="text-[8px] text-white/20">{edit.platform}</span>
                                      {edit.editor_username && (
                                        <span className="text-[8px] text-white/15">@{edit.editor_username}</span>
                                      )}
                                    </div>
                                  </div>
                                  {edit.video_url && (
                                    <a href={edit.video_url} target="_blank" rel="noopener noreferrer" className="text-white/10 hover:text-white/30">
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Edit total views */}
                        {campaignEdits.length > 0 && (
                          <div className="px-4 py-2 border-t border-white/[0.04] flex justify-between">
                            <span className="text-[7px] text-white/10 uppercase tracking-wider">Combined Edit Views</span>
                            <span className="text-[9px] text-white/30 tabular-nums">{formatNumber(editTotalViews)}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Spacer */}
        <div className="h-10" />
      </div>
    </div>
  );
}
