import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, TrendingUp, Zap, MousePointerClick, BarChart3, ExternalLink, Play, Music, Globe, CheckCircle } from 'lucide-react';
import { SiTiktok, SiYoutube, SiInstagram } from '@icons-pack/react-simple-icons';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
}

interface ArtistData {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  genre: string | null;
  social_links: any;
  monthly_streams: number | null;
  achievements: any;
  website_url: string | null;
  verified: boolean | null;
}

interface EditData {
  id: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  platform: string | null;
  view_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  editor_username: string | null;
  status: string;
  published_at: string | null;
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

function getPlatformColor(platform: string | null) {
  switch (platform?.toLowerCase()) {
    case 'tiktok': return 'text-cyan-400';
    case 'youtube': return 'text-red-400';
    case 'instagram': return 'text-pink-400';
    default: return 'text-muted-foreground';
  }
}

export default function CampaignPortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [edits, setEdits] = useState<EditData[]>([]);

  // Fetch campaign data immediately on load (no password needed)
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
        <div className="text-center">
          <img src={viralCartelCrest} alt="" className="w-16 h-16 opacity-60 mx-auto mb-4" />
          <h1 className="font-display text-xl text-white/90">{error}</h1>
          <p className="text-xs text-white/30 mt-2">This campaign link may be invalid.</p>
        </div>
      </div>
    );
  }

  // Dashboard view
  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const goalProgress = campaign.goal_views > 0 ? Math.min(100, (campaign.total_views / campaign.goal_views) * 100) : 0;
  const postsProgress = campaign.goal_posts > 0 ? Math.min(100, (edits.length / campaign.goal_posts) * 100) : 0;
  const totalEditViews = edits.reduce((sum, e) => sum + e.view_count, 0);
  const totalLikes = edits.reduce((sum, e) => sum + e.like_count, 0);
  const totalShares = edits.reduce((sum, e) => sum + e.share_count, 0);
  const totalComments = edits.reduce((sum, e) => sum + e.comment_count, 0);

  return (
    <div className="min-h-screen bg-[#060606] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header with Crest + Quick Links */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={viralCartelCrest} alt="" className="w-8 h-8 opacity-40" />
            <span className="text-[8px] uppercase tracking-[0.3em] text-white/20 font-bold">Campaign Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/hub?guest=true"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all bg-white/[0.03]"
            >
              <Globe size={12} /> Browse LOOPGATE
            </a>
            {artist && (
              <a
                href={`/artist/${artist.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-all bg-red-500/[0.03]"
              >
                <Music size={12} /> View Artist
              </a>
            )}
          </div>
        </motion.div>

        {/* Artist Profile Hero */}
        {artist && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden"
          >
            {/* Banner */}
            {artist.banner_url && (
              <div className="h-36 overflow-hidden relative">
                <img src={artist.banner_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060606]" />
              </div>
            )}
            
            <div className={`bg-[#0a0a0a] border border-white/[0.06] p-6 ${artist.banner_url ? '-mt-12 relative z-10 mx-4' : ''}`}>
              <div className="flex items-start gap-4">
                {artist.avatar_url ? (
                  <img 
                    src={artist.avatar_url} 
                    alt={artist.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/10 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center flex-shrink-0">
                    <Music size={20} className="text-white/30" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl text-white truncate">{artist.name}</h2>
                    {artist.verified && <CheckCircle size={14} className="text-red-500 flex-shrink-0" />}
                  </div>
                  {artist.genre && (
                    <span className="text-[10px] uppercase tracking-widest text-red-500/60 font-bold">{artist.genre}</span>
                  )}
                  {artist.bio && (
                    <p className="text-xs text-white/40 mt-2 line-clamp-2">{artist.bio}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3">
                    {artist.monthly_streams && (
                      <div>
                        <p className="font-display text-sm text-white">{formatNumber(artist.monthly_streams)}</p>
                        <p className="text-[7px] uppercase tracking-widest text-white/25">Monthly Streams</p>
                      </div>
                    )}
                    {artist.website_url && (
                      <a 
                        href={artist.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        <Globe size={10} /> Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Campaign Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="font-display text-3xl text-white">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-sm text-white/40 mt-1">{campaign.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold border ${
              campaign.status === 'active' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
              campaign.status === 'completed' ? 'border-white/10 text-white/40 bg-white/[0.02]' :
              'border-yellow-500/30 text-yellow-400 bg-yellow-500/5'
            }`}>{campaign.status}</span>
            {campaign.start_date && (
              <span className="text-[10px] text-white/25">{new Date(campaign.start_date).toLocaleDateString()}{campaign.end_date ? ` — ${new Date(campaign.end_date).toLocaleDateString()}` : ''}</span>
            )}
          </div>
        </motion.div>

        {/* Goal Progress */}
        {(campaign.goal_views > 0 || campaign.goal_posts > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#0a0a0a] border border-white/[0.06] p-5 space-y-4"
          >
            {campaign.goal_views > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">
                    {campaign.goal_label || 'Views Goal'}
                  </span>
                  <span className="font-display text-sm text-white">{Math.round(goalProgress)}%</span>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 rounded-full"
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-white/25">{campaign.total_views > 0 ? `${formatNumber(campaign.total_views)} views` : 'Waiting for update'}</span>
                  <span className="text-[10px] text-white/25">Goal: {formatNumber(campaign.goal_views)}</span>
                </div>
              </div>
            )}
            {campaign.goal_posts > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">Posts Goal</span>
                  <span className="font-display text-sm text-white">{edits.length}/{campaign.goal_posts}</span>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${postsProgress}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.7 }}
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-400 rounded-full absolute inset-y-0 left-0"
                  />
                  {campaign.incoming_note && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, postsProgress + 12)}%` }}
                      transition={{ duration: 1.8, ease: 'easeOut', delay: 0.9 }}
                      className="h-full bg-gradient-to-r from-emerald-500/40 to-emerald-400/60 rounded-full absolute inset-y-0 left-0"
                      style={{ zIndex: 0 }}
                    />
                  )}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-white/25">{edits.length} edits submitted</span>
                  <span className="text-[10px] text-white/25">Goal: {campaign.goal_posts} posts</span>
                </div>
                {campaign.incoming_note && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400/80 font-medium">{campaign.incoming_note}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Analytics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Total Views', raw: campaign.total_views, icon: Eye, accent: 'text-cyan-400' },
            { label: 'Impressions', raw: campaign.total_impressions, icon: TrendingUp, accent: 'text-blue-400' },
            { label: 'Engagements', raw: campaign.total_engagements, icon: Zap, accent: 'text-amber-400' },
            { label: 'Clicks', raw: campaign.total_clicks, icon: MousePointerClick, accent: 'text-green-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="bg-[#0a0a0a] border border-white/[0.06] p-4 hover:border-white/[0.1] transition-colors"
            >
              <stat.icon size={16} className={`${stat.accent} mb-3 opacity-60`} />
              <p className="font-display text-xl text-white">{stat.raw > 0 ? formatNumber(stat.raw) : '?'}</p>
              <p className="text-[8px] uppercase tracking-[0.2em] text-white/25 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ROI + Budget row */}
        {!!(campaign.roi_percentage || campaign.budget_cents) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-3"
          >
            {campaign.roi_percentage != null && campaign.roi_percentage > 0 && (
              <div className="bg-[#0a0a0a] border border-white/[0.06] p-4">
                <BarChart3 size={16} className="text-emerald-400 mb-3 opacity-60" />
                <p className="font-display text-xl text-white">{campaign.roi_percentage}%</p>
                <p className="text-[8px] uppercase tracking-[0.2em] text-white/25 mt-1">ROI</p>
              </div>
            )}
            {campaign.budget_cents != null && campaign.budget_cents > 0 && (
              <div className="bg-[#0a0a0a] border border-white/[0.06] p-4">
                <p className="text-[8px] uppercase tracking-[0.2em] text-white/25 mb-3">Budget Spent</p>
                <p className="font-display text-xl text-white">
                  ${((campaign.spent_cents || 0) / 100).toLocaleString()}
                  <span className="text-sm text-white/25"> / ${(campaign.budget_cents / 100).toLocaleString()}</span>
                </p>
                <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                    style={{ width: `${Math.min(100, ((campaign.spent_cents || 0) / campaign.budget_cents) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Edits / Posts Section */}
        {edits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg text-white">Campaign Posts</h3>
                <p className="text-[10px] text-white/25 mt-0.5">
                  {edits.length} edits{totalEditViews > 0 ? ` • ${formatNumber(totalEditViews)} total views` : ''}{totalLikes > 0 ? ` • ${formatNumber(totalLikes)} likes` : ''}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {edits.map((edit, i) => (
                <motion.div
                  key={edit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="bg-[#0a0a0a] border border-white/[0.06] hover:border-white/[0.1] transition-all group"
                >
                  <div className="flex items-stretch">
                    {/* Thumbnail */}
                    <div className="w-28 sm:w-36 flex-shrink-0 relative bg-white/[0.02] overflow-hidden">
                      {edit.thumbnail_url ? (
                        <img src={edit.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full min-h-[80px] flex items-center justify-center">
                          <Play size={20} className="text-white/15" />
                        </div>
                      )}
                      {/* Platform badge */}
                      <div className={`absolute top-2 left-2 p-1.5 bg-black/60 backdrop-blur-sm ${getPlatformColor(edit.platform)}`}>
                        {getPlatformIcon(edit.platform)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{edit.title}</p>
                          {edit.editor_username && (
                            <p className="text-[10px] text-white/30 mt-0.5">@{edit.editor_username}</p>
                          )}
                        </div>
                        {edit.video_url && (
                          <button 
                            onClick={() => window.open(edit.video_url!, '_blank', 'noopener,noreferrer')}
                            className="p-1.5 bg-white/[0.04] hover:bg-white/[0.08] transition-colors flex-shrink-0"
                          >
                            <ExternalLink size={12} className="text-white/40" />
                          </button>
                        )}
                      </div>

                      {/* Stats row — only show if any stat > 0 */}
                      {(edit.view_count > 0 || edit.like_count > 0 || edit.share_count > 0 || edit.comment_count > 0) && (
                        <div className="flex items-center gap-4 mt-3">
                          {edit.view_count > 0 && (
                            <div>
                              <p className="font-display text-sm text-white">{formatNumber(edit.view_count)}</p>
                              <p className="text-[7px] uppercase tracking-widest text-white/20">Views</p>
                            </div>
                          )}
                          {edit.like_count > 0 && (
                            <div>
                              <p className="font-display text-sm text-white">{formatNumber(edit.like_count)}</p>
                              <p className="text-[7px] uppercase tracking-widest text-white/20">Likes</p>
                            </div>
                          )}
                          {edit.share_count > 0 && (
                            <div>
                              <p className="font-display text-sm text-white">{formatNumber(edit.share_count)}</p>
                              <p className="text-[7px] uppercase tracking-widest text-white/20">Shares</p>
                            </div>
                          )}
                          {edit.comment_count > 0 && (
                            <div>
                              <p className="font-display text-sm text-white">{formatNumber(edit.comment_count)}</p>
                              <p className="text-[7px] uppercase tracking-widest text-white/20">Comments</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 pb-12">
          <img src={viralCartelCrest} alt="" className="w-6 h-6 mx-auto opacity-20 mb-2" />
          <p className="text-[8px] uppercase tracking-[0.3em] text-white/10">Viral Cartel Studios</p>
        </div>
      </div>
    </div>
  );
}
