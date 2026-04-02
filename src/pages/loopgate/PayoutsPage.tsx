import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ArrowLeft, CheckCircle2, XCircle, Clock, Loader2, Wallet, Send, ExternalLink } from 'lucide-react';
import { useEditorEarnings, usePayoutQueue, type PayoutRequest } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

function EditorCashout() {
  const { earnings, payouts, loading, requestPayout, availableBalance } = useEditorEarnings();
  const [paypalEmail, setPaypalEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCashout = async () => {
    if (!paypalEmail.trim() || availableBalance <= 0) return;
    setSubmitting(true);
    try {
      await requestPayout(paypalEmail.trim(), availableBalance);
      toast.success(`Payout request for $${(availableBalance / 100).toFixed(2)} submitted!`);
      setPaypalEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request payout');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <div className="bg-gradient-to-br from-emerald-950/60 to-surface-1 border border-emerald-500/20 rounded-xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60 mb-1">Your Balance</p>
        <div className="flex items-baseline gap-1">
          <DollarSign className="w-6 h-6 text-emerald-400" />
          <span className="font-display text-4xl text-foreground">{(availableBalance / 100).toFixed(2)}</span>
        </div>
        <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
          <span>Total earned: ${(earnings.earnings_cents / 100).toFixed(2)}</span>
          {earnings.pending_withdrawal_cents > 0 && (
            <span className="text-amber-400">Pending: ${(earnings.pending_withdrawal_cents / 100).toFixed(2)}</span>
          )}
          {earnings.withdrawn_cents > 0 && (
            <span>Withdrawn: ${(earnings.withdrawn_cents / 100).toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Cashout form */}
      {availableBalance > 0 && (
        <div className="bg-surface-1 border border-emerald-500/20 rounded-lg p-4 space-y-3">
          <h3 className="font-display text-sm text-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" /> Cash Out via PayPal
          </h3>
          <Input
            type="email"
            value={paypalEmail}
            onChange={e => setPaypalEmail(e.target.value)}
            placeholder="Your PayPal email address"
            className="h-10"
          />
          <Button
            onClick={handleCashout}
            disabled={submitting || !paypalEmail.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <><Send className="w-4 h-4 mr-2" /> Transfer ${(availableBalance / 100).toFixed(2)} to PayPal</>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">Payouts are reviewed and sent manually within 24 hours</p>
        </div>
      )}

      {/* Payout history */}
      {payouts.length > 0 && (
        <div>
          <h3 className="font-display text-sm text-foreground mb-3">Payout History</h3>
          <div className="space-y-2">
            {payouts.map(p => (
              <div key={p.id} className={`bg-surface-1 border rounded-lg p-3 flex items-center gap-3 ${
                p.status === 'approved' ? 'border-emerald-500/20' :
                p.status === 'rejected' ? 'border-red-500/20 opacity-60' : 'border-amber-500/20'
              }`}>
                {p.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> :
                 p.status === 'rejected' ? <XCircle className="w-4 h-4 text-red-400 shrink-0" /> :
                 <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">${(p.amount_cents / 100).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">{p.paypal_email} · {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                  p.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10' :
                  p.status === 'rejected' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10'
                }`}>
                  {p.status === 'approved' ? 'Paid' : p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPayoutQueue() {
  const { requests, loading, reviewPayout } = usePayoutQueue();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id);
    try {
      await reviewPayout(id, status, notes[id]);
      toast.success(status === 'approved' ? 'Payout approved — send PayPal now!' : 'Payout rejected');
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    }
    setProcessing(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;

  const pending = requests.filter(r => r.status === 'pending');
  const reviewed = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm text-foreground flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-amber-400" />
        Pending Payouts ({pending.length})
      </h3>

      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No pending payout requests</p>
      ) : (
        pending.map(req => (
          <div key={req.id} className="bg-surface-1 border border-amber-500/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {req.avatar_url ? (
                    <img src={req.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{req.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">@{req.username}</span>
                  <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-xl text-emerald-400">${(req.amount_cents / 100).toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-background/50 border border-border/30 rounded p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">PayPal Email</p>
              <p className="text-sm text-foreground font-mono">{req.paypal_email}</p>
            </div>

            <Input
              value={notes[req.id] || ''}
              onChange={e => setNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
              placeholder="Admin notes (optional)"
              className="h-8 text-xs"
            />

            <div className="flex gap-2">
              <Button
                onClick={() => handleReview(req.id, 'rejected')}
                disabled={processing === req.id}
                variant="outline"
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </Button>
              <Button
                onClick={() => handleReview(req.id, 'approved')}
                disabled={processing === req.id}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                {processing === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                  <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve & Pay</>
                )}
              </Button>
            </div>
          </div>
        ))
      )}

      {/* Reviewed history */}
      {reviewed.length > 0 && (
        <div>
          <h3 className="font-display text-sm text-foreground mb-3 mt-6">Processed</h3>
          <div className="space-y-2">
            {reviewed.slice(0, 20).map(req => (
              <div key={req.id} className={`bg-surface-1 border rounded-lg p-3 flex items-center gap-3 ${
                req.status === 'approved' ? 'border-emerald-500/20' : 'border-red-500/20 opacity-60'
              }`}>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {req.avatar_url ? (
                    <img src={req.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{req.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground">@{req.username}</span>
                  <p className="text-[10px] text-muted-foreground">${(req.amount_cents / 100).toFixed(2)} → {req.paypal_email}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                  req.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                }`}>
                  {req.status === 'approved' ? 'Paid' : 'Rejected'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PayoutsPage() {
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-b from-emerald-950/40 to-background border-b border-emerald-500/10 px-4 pt-4 pb-4">
        <Link to="/hub" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Hub
        </Link>
        <h1 className="font-display text-2xl text-foreground flex items-center gap-2">
          <Wallet className="w-6 h-6 text-emerald-400" /> {isStaff ? 'PAYOUT QUEUE' : 'MY EARNINGS'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {isStaff ? 'Review and process editor payout requests' : 'View your earnings and cash out via PayPal'}
        </p>
      </div>

      <div className="px-4 mt-4">
        {isStaff ? <AdminPayoutQueue /> : <EditorCashout />}
      </div>
    </div>
  );
}
