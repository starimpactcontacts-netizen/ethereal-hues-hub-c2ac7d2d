import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Send, Loader2, CheckCircle2, Pencil, Clock, XCircle } from 'lucide-react';
import { useEditorEarnings } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

interface WalletDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function WalletDrawer({ open, onClose }: WalletDrawerProps) {
  const { user } = useAuth();
  const { earnings, payouts, availableBalance, requestPayout, refresh } = useEditorEarnings();
  const [savedPaypal, setSavedPaypal] = useState('');
  const [paypalInput, setPaypalInput] = useState('');
  const [editingPaypal, setEditingPaypal] = useState(false);
  const [savingPaypal, setSavingPaypal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPaypal, setLoadingPaypal] = useState(true);

  // Load saved PayPal email
  useEffect(() => {
    if (!user || !open) return;
    const load = async () => {
      setLoadingPaypal(true);
      const { data } = await supabase
        .from('profiles')
        .select('paypal_email')
        .eq('id', user.id)
        .single();
      const email = (data as any)?.paypal_email || '';
      setSavedPaypal(email);
      setPaypalInput(email);
      setLoadingPaypal(false);
    };
    load();
  }, [user, open]);

  const handleSavePaypal = async () => {
    if (!user || !paypalInput.trim()) return;
    setSavingPaypal(true);
    const { error } = await supabase
      .from('profiles')
      .update({ paypal_email: paypalInput.trim() } as any)
      .eq('id', user.id);
    if (error) {
      toast.error('Failed to save PayPal email');
    } else {
      setSavedPaypal(paypalInput.trim());
      setEditingPaypal(false);
      toast.success('PayPal email saved');
    }
    setSavingPaypal(false);
  };

  const handleWithdraw = async () => {
    if (!savedPaypal || availableBalance <= 0) return;
    setSubmitting(true);
    try {
      await requestPayout(savedPaypal, availableBalance);
      toast.success(`Payout of $${(availableBalance / 100).toFixed(2)} requested!`);
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-emerald-500/20 rounded-t-2xl max-h-[85vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-foreground/10" />
            </div>

            <div className="px-4 pb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <h2 className="font-display text-lg text-foreground">WALLET</h2>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-surface-2 transition-colors rounded">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Balance */}
              <div className="bg-gradient-to-br from-emerald-950/60 to-surface-1 border border-emerald-500/20 rounded-xl p-4 mb-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/60 mb-0.5">Available</p>
                <span className="font-display text-3xl text-emerald-400">${(availableBalance / 100).toFixed(2)}</span>
                <div className="flex gap-3 mt-2 text-[9px] text-muted-foreground">
                  <span>Earned: ${(earnings.earnings_cents / 100).toFixed(2)}</span>
                  {earnings.pending_withdrawal_cents > 0 && (
                    <span className="text-amber-400">Pending: ${(earnings.pending_withdrawal_cents / 100).toFixed(2)}</span>
                  )}
                </div>
              </div>

              {/* PayPal Section */}
              <div className="bg-surface-1 border border-border/30 rounded-lg p-3 mb-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Payout Method</p>
                
                {loadingPaypal ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : !savedPaypal || editingPaypal ? (
                  <div className="space-y-2">
                    <Input
                      type="email"
                      value={paypalInput}
                      onChange={e => setPaypalInput(e.target.value)}
                      placeholder="your@paypal.email"
                      className="h-9 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSavePaypal}
                        disabled={savingPaypal || !paypalInput.trim()}
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-8"
                      >
                        {savingPaypal ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                      </Button>
                      {savedPaypal && (
                        <Button
                          onClick={() => { setEditingPaypal(false); setPaypalInput(savedPaypal); }}
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">PayPal</span>
                      <span className="text-xs text-foreground font-mono">{savedPaypal}</span>
                    </div>
                    <button
                      onClick={() => setEditingPaypal(true)}
                      className="p-1 hover:bg-surface-2 rounded transition-colors"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Withdraw Button */}
              {availableBalance > 0 && savedPaypal && !editingPaypal && (
                <Button
                  onClick={handleWithdraw}
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 mb-3"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Withdraw ${(availableBalance / 100).toFixed(2)}</>
                  )}
                </Button>
              )}

              {availableBalance > 0 && !savedPaypal && !editingPaypal && (
                <p className="text-[10px] text-amber-400 text-center mb-3">Add your PayPal email above to withdraw</p>
              )}

              {/* Recent Payouts */}
              {payouts.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Recent</p>
                  <div className="space-y-1.5">
                    {payouts.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-2 bg-surface-1 border border-border/20 rounded-lg px-3 py-2">
                        {p.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> :
                         p.status === 'rejected' ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> :
                         <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span className="text-xs font-bold text-foreground flex-1">${(p.amount_cents / 100).toFixed(2)}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider ${
                          p.status === 'approved' ? 'text-emerald-400' : p.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {p.status === 'approved' ? 'Paid' : p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[9px] text-muted-foreground/50 text-center mt-4">Payouts reviewed within 24 hours</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
