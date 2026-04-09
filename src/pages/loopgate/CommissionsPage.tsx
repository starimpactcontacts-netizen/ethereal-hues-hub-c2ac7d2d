import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, ArrowLeft, Plus, Users, Clock, CheckCircle2, Loader2, 
  Star, XCircle, Music, Film, Briefcase, User, Shield, Eye,
  Trash2, ToggleLeft, ToggleRight, Pencil, FolderOpen
} from 'lucide-react';
import { useCommissions, type SubmissionRating } from '@/hooks/useCommissions';
import { useBountyMarketplace, type MarketplaceBounty, type MissionType } from '@/hooks/useBountyMarketplace';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import CreateBountyModal from '@/components/loopgate/CreateBountyModal';

const TEKO = { fontFamily: 'Teko, sans-serif' };

const TYPE_CONFIG: Record<MissionType, { label: string; icon: typeof Music; color: string; bg: string; border: string }> = {
  artist: { label: 'ARTIST', icon: Music, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  brand: { label: 'BRAND', icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  film: { label: 'FILM', icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  standard: { label: 'BOUNTY', icon: User, color: 'text-foreground', bg: 'bg-muted/30', border: 'border-border/30' },
};

/* ── Admin Mission Row ── */
function AdminMissionRow({ bounty, onClose, onView, onEdit }: { 
  bounty: MarketplaceBounty; 
  onClose: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (bounty: MarketplaceBounty) => void;
}) {
  const payout = (bounty.payout_cents / 100).toFixed(0);
  const slotsLeft = bounty.max_slots - bounty.accepted_count;
  const isOpen = bounty.status === 'open';
  const mType = (bounty.mission_type as MissionType) || 'standard';
  const tc = TYPE_CONFIG[mType] || TYPE_CONFIG.standard;
  const Icon = tc.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface-1 border rounded-xl overflow-hidden transition-all ${
        isOpen ? tc.border : 'border-border/20 opacity-60'
      }`}
    >
      <div className="flex items-stretch">
        {/* Cover thumb */}
        {bounty.cover_url ? (
          <div className="w-20 h-auto shrink-0 relative">
            <img src={bounty.cover_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-1/60" />
          </div>
        ) : (
          <div className={`w-20 shrink-0 ${tc.bg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${tc.color}`} />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${tc.bg} ${tc.color}`}>
                  {tc.label}
                </span>
                <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  isOpen ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted/50 text-muted-foreground'
                }`}>
                  {bounty.status}
                </span>
              </div>
              <h3 className="text-[13px] font-bold text-foreground truncate">{bounty.title}</h3>
              {(bounty.client_name || bounty.artist_name) && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {bounty.client_name || bounty.artist_name}
                  {bounty.song_name ? ` · ${bounty.song_name}` : ''}
                </p>
              )}
            </div>
            <span className="text-emerald-400 font-bold text-lg shrink-0" style={TEKO}>${payout}</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="w-3 h-3" /> {slotsLeft}/{bounty.max_slots} slots
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CheckCircle2 className="w-3 h-3" /> {bounty.submission_count} subs
            </div>
            {bounty.deadline && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(bounty.deadline), { addSuffix: true })}
              </div>
            )}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(bounty.created_at), { addSuffix: true })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2.5">
            <button 
              onClick={() => onView(bounty.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-surface-2 hover:bg-muted/50 text-foreground transition-colors"
            >
              <Eye className="w-3 h-3" /> View
            </button>
            <button 
              onClick={() => onEdit(bounty)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            {isOpen && (
              <button 
                onClick={() => onClose(bounty.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              >
                <XCircle className="w-3 h-3" /> Close
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CommissionsPage() {
  const { commissions, loading: commLoading } = useCommissions();
  const { bounties, myBounties, loading: bountyLoading, createBounty, closeBounty } = useBountyMarketplace();
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<MissionType | undefined>(undefined);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [editingMission, setEditingMission] = useState<MarketplaceBounty | null>(null);

  const loading = commLoading || bountyLoading;

  // All missions (marketplace)
  const allMissions = bounties;
  const openMissions = allMissions.filter(b => b.status === 'open');
  const closedMissions = allMissions.filter(b => b.status !== 'open');
  
  const displayedMissions = filter === 'open' ? openMissions : filter === 'closed' ? closedMissions : allMissions;

  const totalPayout = allMissions.reduce((sum, b) => sum + b.payout_cents, 0);
  const totalSubs = allMissions.reduce((sum, b) => sum + b.submission_count, 0);

  const openCreate = (type?: MissionType) => {
    setCreateType(type);
    setShowCreate(true);
  };

  // Not staff? Block access
  if (!loading && !isStaff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400/30 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-1">Admin Access Only</h2>
          <p className="text-sm text-muted-foreground mb-4">This page is restricted to platform administrators.</p>
          <Button onClick={() => navigate('/hub')} variant="outline">Back to Hub</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/30">
        <Link to="/hub" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Hub
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Admin Panel</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Mission Control</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Drop, manage, and close paid missions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3">
        {[
          { label: 'Total', value: allMissions.length, color: 'text-foreground' },
          { label: 'Open', value: openMissions.length, color: 'text-emerald-400' },
          { label: 'Subs', value: totalSubs, color: 'text-blue-400' },
          { label: 'Payouts', value: `$${(totalPayout / 100).toFixed(0)}`, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-surface-1 border border-border/20 rounded-xl p-2.5 text-center">
            <p className={`text-lg font-bold ${s.color}`} style={TEKO}>{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Drop New Mission — Quick Actions */}
      <div className="px-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Drop New Mission</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { type: 'artist' as MissionType, label: 'Artist', icon: Music, gradient: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20', textColor: 'text-emerald-400' },
            { type: 'brand' as MissionType, label: 'Brand', icon: Briefcase, gradient: 'from-blue-500/20 to-blue-500/5 border-blue-500/20', textColor: 'text-blue-400' },
            { type: 'film' as MissionType, label: 'Film', icon: Film, gradient: 'from-purple-500/20 to-purple-500/5 border-purple-500/20', textColor: 'text-purple-400' },
          ]).map(tile => {
            const TileIcon = tile.icon;
            return (
              <motion.button
                key={tile.type}
                whileTap={{ scale: 0.95 }}
                onClick={() => openCreate(tile.type)}
                className={`bg-gradient-to-b ${tile.gradient} border rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity`}
              >
                <div className={`w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center`}>
                  <TileIcon className={`w-5 h-5 ${tile.textColor}`} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${tile.textColor}`}>{tile.label}</span>
              </motion.button>
            );
          })}
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => openCreate()}
          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Custom Mission
        </motion.button>
      </div>

      {/* Filter tabs */}
      <div className="px-4 mb-3">
        <div className="flex gap-1.5 bg-surface-1 border border-border/20 rounded-xl p-1">
          {(['all', 'open', 'closed'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                filter === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f} ({f === 'all' ? allMissions.length : f === 'open' ? openMissions.length : closedMissions.length})
            </button>
          ))}
        </div>
      </div>

      {/* Mission List */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : displayedMissions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              {filter === 'open' ? 'No open missions' : filter === 'closed' ? 'No closed missions' : 'No missions yet'}
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">Drop your first mission above</p>
          </div>
        ) : (
          displayedMissions.map(b => (
            <AdminMissionRow 
              key={b.id} 
              bounty={b} 
              onView={(id) => navigate(`/commissions/${id}`)}
              onEdit={(bounty) => setEditingMission(bounty)}
              onClose={async (id) => {
                try { 
                  await closeBounty(id); 
                  toast.success('Mission closed'); 
                } catch { 
                  toast.error('Failed to close'); 
                }
              }} 
            />
          ))
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

      {editingMission && (
        <MissionEditDialog
          mission={editingMission}
          onClose={() => setEditingMission(null)}
          onSaved={() => {
            setEditingMission(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

/* ─── Mission Edit Dialog ─── */
function MissionEditDialog({ mission, onClose, onSaved }: { mission: MarketplaceBounty; onClose: () => void; onSaved: () => void }) {
  const mType = (mission.mission_type as MissionType) || 'standard';
  const tc = TYPE_CONFIG[mType] || TYPE_CONFIG.standard;
  const isFilm = mType === 'film';
  const isBrand = mType === 'brand';
  const isArtist = mType === 'artist';

  const [form, setForm] = useState({
    title: mission.title || '',
    description: mission.description || '',
    song_name: mission.song_name || '',
    artist_name: mission.artist_name || '',
    client_name: mission.client_name || '',
    max_slots: mission.max_slots,
    payout_cents: mission.payout_cents,
    cover_url: (mission as any).cover_url || '',
    scenepack_url: (mission as any).scenepack_url || '',
    scenepack_youtube_url: (mission as any).scenepack_youtube_url || '',
    scenepack_gdrive_url: (mission as any).scenepack_gdrive_url || '',
    custom_payouts: (mission.custom_payouts || { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 }) as Record<string, number>,
  });
  const [saving, setSaving] = useState(false);
  const RATINGS = ['S', 'A', 'B', 'C', 'D', 'F'];

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('commissions').update({
      title: form.title,
      description: form.description || null,
      song_name: form.song_name || null,
      artist_name: form.artist_name || null,
      client_name: form.client_name || null,
      max_slots: form.max_slots,
      payout_cents: form.payout_cents,
      cover_url: form.cover_url || null,
      scenepack_url: form.scenepack_url || null,
      scenepack_youtube_url: form.scenepack_youtube_url || null,
      scenepack_gdrive_url: form.scenepack_gdrive_url || null,
      custom_payouts: form.custom_payouts,
    } as any).eq('id', mission.id);
    if (error) toast.error(error.message);
    else { toast.success('Mission updated!'); onSaved(); }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto pb-24">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil size={18} className={tc.color} /> Edit {tc.label} Mission
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Type badge */}
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${tc.bg} ${tc.color}`}>
            {(() => { const Icon = tc.icon; return <Icon className="w-3 h-3" />; })()}
            {tc.label} Campaign
          </div>

          {/* Core Info */}
          <div className="space-y-2">
            <Label className={`text-xs font-bold ${tc.color}`}>📋 Core Info</Label>
            <div>
              <Label className="text-[10px]">Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>

            {/* Film/Brand: Client Name */}
            {(isFilm || isBrand) && (
              <div>
                <Label className="text-[10px]">{isFilm ? 'Production / Studio' : 'Brand Name'}</Label>
                <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} 
                  placeholder={isFilm ? 'e.g. WeirdCity Studios' : 'e.g. Nike'} className="mt-1 h-8 text-xs" />
              </div>
            )}

            {/* Artist: Artist + Song */}
            {isArtist && (
              <>
                <div>
                  <Label className="text-[10px]">Artist Name</Label>
                  <Input value={form.artist_name} onChange={e => setForm({ ...form, artist_name: e.target.value })} className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Song Name</Label>
                  <Input value={form.song_name} onChange={e => setForm({ ...form, song_name: e.target.value })} className="mt-1 h-8 text-xs" />
                </div>
              </>
            )}

            {/* Standard: show both */}
            {mType === 'standard' && (
              <>
                <div>
                  <Label className="text-[10px]">Song Name</Label>
                  <Input value={form.song_name} onChange={e => setForm({ ...form, song_name: e.target.value })} className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Artist / Client Name</Label>
                  <Input value={form.artist_name} onChange={e => setForm({ ...form, artist_name: e.target.value })} className="mt-1 h-8 text-xs" />
                </div>
              </>
            )}

            <div>
              <Label className="text-[10px]">{isFilm ? 'Series Brief / Description' : isBrand ? 'Campaign Brief' : 'Mission Brief'}</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder={isFilm ? 'Describe the series, tone, and what editors should capture...' : isBrand ? 'Brand guidelines, tone, deliverables...' : 'Mission brief...'} 
                className="mt-1 text-xs" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Max Slots</Label>
                <Input type="number" value={form.max_slots} onChange={e => setForm({ ...form, max_slots: Number(e.target.value) })} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Total Payout (cents)</Label>
                <Input type="number" value={form.payout_cents} onChange={e => setForm({ ...form, payout_cents: Number(e.target.value) })} className="mt-1 h-8 text-xs" />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="border-t border-border pt-3 space-y-2">
            <Label className="text-xs font-bold text-blue-400">🖼 Media</Label>
            <div>
              <Label className="text-[10px]">Cover Image URL</Label>
              <Input value={form.cover_url} onChange={e => setForm({ ...form, cover_url: e.target.value })}
                placeholder="Image URL" className="mt-1 h-8 text-xs" />
            </div>
            {form.cover_url && (
              <div className="rounded-lg border border-border overflow-hidden">
                <img src={form.cover_url} alt="Cover" className="w-full h-24 object-cover" />
              </div>
            )}
          </div>

          {/* Scenepacks */}
          <div className="border-t border-border pt-3 space-y-2">
            <Label className="text-xs font-bold text-amber-400">📦 {isFilm ? 'Footage / Assets' : 'Scenepacks'}</Label>
            <div>
              <Label className="text-[10px]">YouTube Scenepack URL</Label>
              <Input value={form.scenepack_youtube_url} onChange={e => setForm({ ...form, scenepack_youtube_url: e.target.value })}
                placeholder="https://youtube.com/..." className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">{isFilm ? 'Footage Link (Google Drive)' : 'Google Drive Scenepack URL'}</Label>
              <Input value={form.scenepack_gdrive_url} onChange={e => setForm({ ...form, scenepack_gdrive_url: e.target.value })}
                placeholder="https://drive.google.com/..." className="mt-1 h-8 text-xs" />
            </div>
          </div>

          {/* Payouts */}
          <div className="border-t border-border pt-3">
            <Label className="text-xs text-emerald-400 font-bold">💰 Payout per Rating (cents)</Label>
            <p className="text-[9px] text-muted-foreground mb-2">1000 = $10, 500 = $5</p>
            <div className="grid grid-cols-3 gap-2">
              {RATINGS.map(r => (
                <div key={r} className="flex items-center gap-1.5">
                  <span className={`text-xs font-black w-4 ${r === 'S' ? 'text-amber-400' : r === 'A' ? 'text-emerald-400' : r === 'B' ? 'text-blue-400' : 'text-muted-foreground'}`}>{r}</span>
                  <Input type="number" value={form.custom_payouts[r] || 0}
                    onChange={e => setForm({ ...form, custom_payouts: { ...form.custom_payouts, [r]: Number(e.target.value) } })}
                    className="h-8 text-xs" />
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Mission'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
