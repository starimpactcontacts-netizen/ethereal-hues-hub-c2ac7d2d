import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ArrowLeft, Plus, Users, Clock, CheckCircle2, Loader2, Send } from 'lucide-react';
import { useCommissions } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

function CreateCommissionModal({ onClose, onCreate }: { onClose: () => void; onCreate: (params: any) => Promise<any> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [artistName, setArtistName] = useState('');
  const [songName, setSongName] = useState('');
  const [payoutDollars, setPayoutDollars] = useState('');
  const [maxSlots, setMaxSlots] = useState('3');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !payoutDollars) return;
    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || null,
        artist_name: artistName.trim() || null,
        song_name: songName.trim() || null,
        payout_cents: Math.round(parseFloat(payoutDollars) * 100),
        max_slots: parseInt(maxSlots) || 3,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });
      toast.success('Commission created!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create');
    }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto overscroll-contain"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border/50 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> New Commission
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Edit for Drake - God's Plan" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief on what you need..." className="min-h-[80px] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Artist</label>
              <Input value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Artist name" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Song</label>
              <Input value={songName} onChange={e => setSongName(e.target.value)} placeholder="Song name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Payout ($) *</label>
              <Input type="number" value={payoutDollars} onChange={e => setPayoutDollars(e.target.value)} placeholder="25" min="1" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Max Slots</label>
              <Input type="number" value={maxSlots} onChange={e => setMaxSlots(e.target.value)} placeholder="3" min="1" max="50" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Deadline (optional)</label>
            <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>

          <Button onClick={handleCreate} disabled={submitting || !title.trim() || !payoutDollars}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Create Commission</>}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CommissionsPage() {
  const { commissions, loading, createCommission } = useCommissions();
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'filled' | 'closed'>('all');

  const filtered = commissions.filter(c => {
    if (filter === 'open') return c.status === 'open';
    if (filter === 'filled') return c.status === 'filled';
    if (filter === 'closed') return c.status === 'closed';
    return true;
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
              <DollarSign className="w-6 h-6 text-emerald-400" /> COMMISSIONS
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Get paid to edit. Submit your work, get accepted, earn money.</p>
          </div>
          {isStaff && (
            <Button onClick={() => setShowCreate(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3">
          {(['all', 'open', 'filled', 'closed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                filter === f ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-surface-1 text-muted-foreground border border-border/30 hover:text-foreground'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No commissions yet</p>
          </div>
        ) : (
          filtered.map(c => {
            const payout = (c.payout_cents / 100).toFixed(0);
            const slotsLeft = c.max_slots - c.accepted_count;
            const isOpen = c.status === 'open' && slotsLeft > 0;

            return (
              <Link key={c.id} to={`/commissions/${c.id}`}>
                <motion.div whileTap={{ scale: 0.98 }}
                  className={`bg-surface-1 border rounded-lg p-4 transition-colors ${
                    isOpen ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-border/30 opacity-70'
                  }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-base text-foreground truncate">{c.title}</h3>
                      {c.artist_name && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{c.artist_name}{c.song_name ? ` · ${c.song_name}` : ''}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" /> {slotsLeft}/{c.max_slots} slots
                        </div>
                        {c.submission_count > 0 && (
                          <div className="flex items-center gap-1 text-xs text-emerald-400/80">
                            <CheckCircle2 className="w-3 h-3" /> {c.submission_count} submitted
                          </div>
                        )}
                        {c.deadline && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(c.deadline), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="font-display text-lg text-emerald-400">{payout}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateCommissionModal onClose={() => setShowCreate(false)} onCreate={createCommission} />
        )}
      </AnimatePresence>
    </div>
  );
}
