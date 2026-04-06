import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, ArrowLeft, Plus, Users, Clock, CheckCircle2, Loader2, 
  Star, Crown, ImagePlus, Search, XCircle, Music, Film, Briefcase, User,
  Flame, ArrowRight
} from 'lucide-react';
import { useCommissions, RATING_PAYOUTS, type SubmissionRating } from '@/hooks/useCommissions';
import { useBountyMarketplace, type MarketplaceBounty, type MissionType } from '@/hooks/useBountyMarketplace';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import CreateBountyModal from '@/components/loopgate/CreateBountyModal';
import { InfinityLoop } from '@/components/loopgate/InfinityLoop';

const TEKO = { fontFamily: 'Teko, sans-serif' };

const TYPE_CONFIG: Record<MissionType, { label: string; icon: typeof Music; color: string; bg: string; border: string }> = {
  artist: { label: 'ARTIST', icon: Music, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  brand: { label: 'BRAND', icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  film: { label: 'FILM', icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  standard: { label: 'BOUNTY', icon: User, color: 'text-foreground', bg: 'bg-muted/30', border: 'border-border/30' },
};

/* ── Mission Card ── */
function MissionCard({ bounty }: { bounty: MarketplaceBounty }) {
  const payout = (bounty.payout_cents / 100).toFixed(0);
  const slotsLeft = bounty.max_slots - bounty.accepted_count;
  const isOpen = bounty.status === 'open' && slotsLeft > 0;
  const mType = (bounty.mission_type as MissionType) || 'standard';
  const tc = TYPE_CONFIG[mType] || TYPE_CONFIG.standard;
  const Icon = tc.icon;

  return (
    <Link to={`/mission/${bounty.id}`}>
      <motion.div whileTap={{ scale: 0.98 }}
        className={`bg-surface-1 border overflow-hidden transition-all ${
          isOpen ? `${tc.border} hover:border-opacity-60` : 'border-border/20 opacity-50'
        }`}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
      >
        {/* Cover */}
        {bounty.cover_url ? (
          <div className="relative h-28 overflow-hidden">
            <img src={bounty.cover_url} alt={bounty.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-transparent" />
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <div className={`${tc.bg} backdrop-blur-sm px-2 py-0.5 border-l-2 ${tc.border}`}>
                <span className={`font-display text-lg ${tc.color}`}>${payout}</span>
              </div>
            </div>
            <div className={`absolute top-2 right-2 ${tc.bg} backdrop-blur-sm px-1.5 py-0.5 flex items-center gap-1`}>
              <Icon className={`w-2.5 h-2.5 ${tc.color}`} />
              <span className={`text-[8px] font-bold uppercase tracking-wider ${tc.color}`}>{tc.label}</span>
            </div>
          </div>
        ) : (
          <div className="px-3 pt-3 flex items-center justify-between">
            <span className={`font-display text-2xl ${tc.color}`}>${payout}</span>
            <div className={`${tc.bg} px-1.5 py-0.5 flex items-center gap-1`}>
              <Icon className={`w-2.5 h-2.5 ${tc.color}`} />
              <span className={`text-[8px] font-bold uppercase tracking-wider ${tc.color}`}>{tc.label}</span>
            </div>
          </div>
        )}

        <div className="p-3 pt-2">
          <h3 className="text-[13px] font-bold text-foreground truncate">{bounty.title}</h3>
          
          {/* Client / Artist */}
          {(bounty.client_name || bounty.artist_name) && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {bounty.client_name || bounty.artist_name}
              {bounty.song_name ? ` · ${bounty.song_name}` : ''}
            </p>
          )}

          {/* Poster */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {bounty.poster_avatar_url ? (
              <img src={bounty.poster_avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                <span className="text-[7px] font-bold">{bounty.poster_username?.charAt(0)?.toUpperCase()}</span>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground">@{bounty.poster_username}</span>
            {bounty.poster_rating_count > 0 && (
              <div className="flex items-center gap-0.5 ml-auto">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-[9px] font-bold text-amber-400">{bounty.poster_rating_avg?.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="w-3 h-3" /> {slotsLeft}/{bounty.max_slots}
            </div>
            {bounty.submission_count > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-400/70">
                <CheckCircle2 className="w-3 h-3" /> {bounty.submission_count}
              </div>
            )}
            {bounty.deadline && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(bounty.deadline), { addSuffix: true })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ── My Mission Row ── */
function MyMissionRow({ bounty, onClose }: { bounty: MarketplaceBounty; onClose: (id: string) => void }) {
  const payout = (bounty.payout_cents / 100).toFixed(0);
  const slotsLeft = bounty.max_slots - bounty.accepted_count;
  const isOpen = bounty.status === 'open';
  const mType = (bounty.mission_type as MissionType) || 'standard';
  const tc = TYPE_CONFIG[mType] || TYPE_CONFIG.standard;
  const Icon = tc.icon;

  return (
    <div className={`flex items-center gap-3 p-3 bg-surface-1 border transition-all ${
      isOpen ? tc.border : 'border-border/20 opacity-50'
    }`}>
      <div className={`w-8 h-8 ${tc.bg} flex items-center justify-center shrink-0 rounded`}>
        <Icon className={`w-4 h-4 ${tc.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <Link to={`/commissions/${bounty.id}`} className="text-[12px] font-bold text-foreground truncate block hover:text-emerald-400 transition-colors">
          {bounty.title}
        </Link>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="text-emerald-400 font-bold">${payout}</span>
          <span>{slotsLeft}/{bounty.max_slots} slots</span>
          <span>{bounty.submission_count} subs</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
          isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted/50 text-muted-foreground'
        }`}>{bounty.status}</span>
        {isOpen && (
          <button onClick={() => onClose(bounty.id)} className="p-1 hover:bg-destructive/10 rounded transition-colors">
            <XCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Category Filter Pill ── */
function CategoryPill({ type, active, count, onClick }: { type: MissionType | 'all'; active: boolean; count: number; onClick: () => void }) {
  if (type === 'all') {
    return (
      <button onClick={onClick} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${
        active ? 'bg-foreground text-background' : 'bg-surface-1 text-muted-foreground border border-border/30 hover:text-foreground'
      }`}>
        All ({count})
      </button>
    );
  }
  const tc = TYPE_CONFIG[type];
  const Icon = tc.icon;
  return (
    <button onClick={onClick} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 ${
      active ? `${tc.bg} ${tc.color} border ${tc.border}` : 'bg-surface-1 text-muted-foreground border border-border/30 hover:text-foreground'
    }`}>
      <Icon className="w-3 h-3" /> {tc.label} ({count})
    </button>
  );
}

export default function CommissionsPage() {
  const { commissions, loading: commLoading } = useCommissions();
  const { bounties, myBounties, loading: bountyLoading, createBounty, closeBounty } = useBountyMarketplace();
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<MissionType | undefined>(undefined);
  const [view, setView] = useState<'browse' | 'my-missions'>('browse');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<MissionType | 'all'>('all');

  const loading = commLoading || bountyLoading;

  // Merge all bounties
  const allBounties = [
    ...bounties,
    ...commissions.filter(c => !(c as any).is_marketplace).map(c => ({ 
      ...c, is_marketplace: false, poster_username: 'Loopgate', poster_avatar_url: null, 
      poster_rating_avg: 0, poster_rating_count: 0, cover_url: null, platform_fee_cents: 0, 
      bounty_type: 'official', requirements: null, reference_urls: null,
      mission_type: 'artist' as MissionType, client_name: null, reference_video_url: null,
    } as unknown as MarketplaceBounty)),
  ].filter(b => b.status === 'open' || b.status === 'filled');

  // Category counts
  const categoryCounts = {
    all: allBounties.length,
    artist: allBounties.filter(b => (b.mission_type || 'standard') === 'artist').length,
    brand: allBounties.filter(b => (b.mission_type || 'standard') === 'brand').length,
    film: allBounties.filter(b => (b.mission_type || 'standard') === 'film').length,
    standard: allBounties.filter(b => !b.mission_type || b.mission_type === 'standard').length,
  };

  // Filter
  const filtered = allBounties.filter(b => {
    if (activeCategory !== 'all') {
      const mt = b.mission_type || 'standard';
      if (mt !== activeCategory) return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || 
           (b.artist_name || '').toLowerCase().includes(q) || 
           (b.poster_username || '').toLowerCase().includes(q) ||
           (b.client_name || '').toLowerCase().includes(q);
  });

  const openCreate = (type?: MissionType) => {
    setCreateType(type);
    setShowCreate(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-950/30 to-background border-b border-emerald-500/10 px-4 pt-4 pb-5">
        <Link to="/hub" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Hub
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" /> MISSIONS
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Paid editing jobs from artists, brands & studios.</p>
          </div>
          {isStaff && (
            <Button onClick={() => openCreate()} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="w-4 h-4 mr-1" /> Post
            </Button>
          )}
        </div>

        {/* Quick-launch tiles — admin only */}
        {isStaff && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {([
              { type: 'artist' as MissionType, label: 'Artist Mission', icon: Music, color: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400' },
              { type: 'brand' as MissionType, label: 'Brand Mission', icon: Briefcase, color: 'border-blue-500/30 bg-blue-500/8 text-blue-400' },
              { type: 'film' as MissionType, label: 'Film Mission', icon: Film, color: 'border-purple-500/30 bg-purple-500/8 text-purple-400' },
            ]).map(tile => {
              const TileIcon = tile.icon;
              return (
                <button
                  key={tile.type}
                  onClick={() => openCreate(tile.type)}
                  className={`border ${tile.color} p-3 rounded-lg flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity`}
                >
                  <TileIcon className="w-5 h-5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{tile.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button onClick={() => setView('browse')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              view === 'browse' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-surface-1 text-muted-foreground border border-border/30 hover:text-foreground'
            }`}>
            Browse
          </button>
          {isStaff && (
            <button onClick={() => setView('my-missions')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                view === 'my-missions' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-surface-1 text-muted-foreground border border-border/30 hover:text-foreground'
              }`}>
              My Missions
            </button>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        {view === 'browse' && (
          <>
            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
              <CategoryPill type="all" active={activeCategory === 'all'} count={categoryCounts.all} onClick={() => setActiveCategory('all')} />
              <CategoryPill type="artist" active={activeCategory === 'artist'} count={categoryCounts.artist} onClick={() => setActiveCategory('artist')} />
              <CategoryPill type="brand" active={activeCategory === 'brand'} count={categoryCounts.brand} onClick={() => setActiveCategory('brand')} />
              <CategoryPill type="film" active={activeCategory === 'film'} count={categoryCounts.film} onClick={() => setActiveCategory('film')} />
              <CategoryPill type="standard" active={activeCategory === 'standard'} count={categoryCounts.standard} onClick={() => setActiveCategory('standard')} />
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search missions..."
                className="pl-9 h-9"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-medium">
                  {activeCategory !== 'all' ? `No ${TYPE_CONFIG[activeCategory].label.toLowerCase()} missions yet` : 'No missions yet'}
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">Be the first to post one</p>
                {isStaff && (
                  <Button onClick={() => openCreate(activeCategory !== 'all' ? activeCategory : undefined)} size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white">
                    Post Mission
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {filtered.map(b => (
                  <MissionCard key={b.id} bounty={b} />
                ))}
              </div>
            )}
          </>
        )}

        {view === 'my-missions' && (
          <>
            {!user ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">Sign in to manage your missions</p>
              </div>
            ) : myBounties.length === 0 ? (
              <div className="text-center py-12">
                <ImagePlus className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">You haven't posted any missions yet</p>
                <Button onClick={() => openCreate()} size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white">
                  Post Your First Mission
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {myBounties.map(b => (
                  <MyMissionRow key={b.id} bounty={b} onClose={async (id) => {
                    try { await closeBounty(id); toast.success('Mission closed'); } catch { toast.error('Failed'); }
                  }} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateBountyModal 
            onClose={() => setShowCreate(false)} 
            onCreate={createBounty}
            defaultType={createType}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
