import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, ArrowLeft, Plus, Users, Clock, CheckCircle2, Loader2, 
  Star, AlertTriangle, Crown, ImagePlus, Search, Crosshair, ChevronRight,
  Settings, XCircle, Eye
} from 'lucide-react';
import { useCommissions, RATING_PAYOUTS, type SubmissionRating } from '@/hooks/useCommissions';
import { useBountyMarketplace, type MarketplaceBounty } from '@/hooks/useBountyMarketplace';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import CreateBountyModal from '@/components/loopgate/CreateBountyModal';
import { InfinityLoop } from '@/components/loopgate/InfinityLoop';

/* ── Bounty Card ── */
function BountyCard({ bounty }: { bounty: MarketplaceBounty }) {
  const payout = (bounty.payout_cents / 100).toFixed(0);
  const slotsLeft = bounty.max_slots - bounty.accepted_count;
  const isOpen = bounty.status === 'open' && slotsLeft > 0;

  return (
    <Link to={`/commissions/${bounty.id}`}>
      <motion.div whileTap={{ scale: 0.98 }}
        className={`bg-surface-1 border overflow-hidden transition-all ${
          isOpen ? 'border-emerald-500/15 hover:border-emerald-500/40' : 'border-border/30 opacity-60'
        }`}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
      >
        {/* Cover */}
        {bounty.cover_url ? (
          <div className="relative h-28 overflow-hidden">
            <img src={bounty.cover_url} alt={bounty.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-transparent" />
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 border-l-2 border-emerald-500">
              <span className="font-display text-lg text-emerald-400">${payout}</span>
            </div>
            {bounty.poster_rating_count > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-[9px] font-bold text-amber-400">{bounty.poster_rating_avg.toFixed(1)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 pt-3 flex items-center justify-between">
            <span className="font-display text-2xl text-emerald-400">${payout}</span>
            {bounty.poster_rating_count > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-[9px] font-bold text-amber-400">{bounty.poster_rating_avg.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        <div className="p-3 pt-2">
          <h3 className="text-[13px] font-bold text-foreground truncate">{bounty.title}</h3>
          
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
          </div>

          {bounty.artist_name && (
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              {bounty.artist_name}{bounty.song_name ? ` · ${bounty.song_name}` : ''}
            </p>
          )}

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

/* ── My Bounty Row (management) ── */
function MyBountyRow({ bounty, onClose }: { bounty: MarketplaceBounty; onClose: (id: string) => void }) {
  const payout = (bounty.payout_cents / 100).toFixed(0);
  const slotsLeft = bounty.max_slots - bounty.accepted_count;
  const isOpen = bounty.status === 'open';

  return (
    <div className={`flex items-center gap-3 p-3 bg-surface-1 border transition-all ${
      isOpen ? 'border-emerald-500/15' : 'border-border/30 opacity-60'
    }`}>
      {bounty.cover_url && (
        <img src={bounty.cover_url} alt="" className="w-10 h-10 object-cover rounded shrink-0" />
      )}
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

export default function CommissionsPage() {
  const { commissions, loading: commLoading, createCommission } = useCommissions();
  const { bounties, myBounties, loading: bountyLoading, createBounty, closeBounty } = useBountyMarketplace();
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<'browse' | 'my-bounties' | 'staff'>('browse');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const loading = commLoading || bountyLoading;

  // Merge: marketplace bounties + staff commissions
  const allBounties = [
    ...bounties,
    ...commissions.filter(c => !(c as any).is_marketplace).map(c => ({ ...c, is_marketplace: false, poster_username: 'Loopgate', poster_avatar_url: null, poster_rating_avg: 0, poster_rating_count: 0, cover_url: null, platform_fee_cents: 0, bounty_type: 'official', requirements: null, reference_urls: null } as unknown as MarketplaceBounty)),
  ].filter(b => b.status === 'open' || b.status === 'filled');

  const filtered = allBounties.filter(b => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || (b.artist_name || '').toLowerCase().includes(q) || (b.poster_username || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-950/40 to-background border-b border-emerald-500/10 px-4 pt-4 pb-4">
        <Link to="/hub" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Hub
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground flex items-center gap-2">
              <InfinityLoop size={24} /> BOUNTIES
            </h1>
            <p className="text-xs text-muted-foreground mt-1">The marketplace — post jobs, find edits, get paid.</p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Plus className="w-4 h-4 mr-1" /> Post
          </Button>
        </div>

        {/* Warning */}
        <div className="flex items-center gap-2 mt-3 bg-amber-500/8 border border-amber-500/15 px-3 py-2 rounded">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="text-[9px] text-amber-400/70">
            Bounties are honor-system. Loopgate takes 10% fee. Rate posters to build trust.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {(['browse', 'my-bounties'] as const).map(t => (
            <button key={t} onClick={() => setView(t)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                view === t ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-surface-1 text-muted-foreground border border-border/30 hover:text-foreground'
              }`}>
              {t === 'browse' ? 'Browse' : 'My Bounties'}
            </button>
          ))}
          {isStaff && (
            <button onClick={() => setView('staff')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                view === 'staff' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-surface-1 text-muted-foreground border border-border/30 hover:text-foreground'
              }`}>
              <Crown className="w-3 h-3 inline mr-1" /> Staff
            </button>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        {view === 'browse' && (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search bounties..."
                className="pl-9 h-9"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No bounties yet</p>
                <Button onClick={() => setShowCreate(true)} size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white">
                  Post First Bounty
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {filtered.map(b => (
                  <BountyCard key={b.id} bounty={b} />
                ))}
              </div>
            )}
          </>
        )}

        {view === 'my-bounties' && (
          <>
            {!user ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">Sign in to manage your bounties</p>
              </div>
            ) : myBounties.length === 0 ? (
              <div className="text-center py-12">
                <ImagePlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">You haven't posted any bounties yet</p>
                <Button onClick={() => setShowCreate(true)} size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white">
                  Post Your First Bounty
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {myBounties.map(b => (
                  <MyBountyRow key={b.id} bounty={b} onClose={async (id) => {
                    try { await closeBounty(id); toast.success('Bounty closed'); } catch { toast.error('Failed'); }
                  }} />
                ))}
              </div>
            )}
          </>
        )}

        {view === 'staff' && isStaff && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Staff commissions (non-marketplace):</p>
            {commissions.filter(c => !(c as any).is_marketplace).map(c => {
              const payout = (c.payout_cents / 100).toFixed(0);
              const slotsLeft = c.max_slots - c.accepted_count;
              return (
                <Link key={c.id} to={`/commissions/${c.id}`}>
                  <div className="flex items-center gap-3 p-3 bg-surface-1 border border-border/30 hover:border-emerald-500/30 transition-all">
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-bold text-foreground truncate block">{c.title}</span>
                      <span className="text-[10px] text-muted-foreground">{slotsLeft}/{c.max_slots} slots · {c.submission_count} subs</span>
                    </div>
                    <span className="font-display text-lg text-emerald-400">${payout}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateBountyModal onClose={() => setShowCreate(false)} onCreate={createBounty} />
        )}
      </AnimatePresence>
    </div>
  );
}
