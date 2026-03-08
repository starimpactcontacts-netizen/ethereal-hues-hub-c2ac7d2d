import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle2, Pencil, Clock, XCircle, DollarSign, ChevronRight } from 'lucide-react';
import { useEditorEarnings } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WalletDrawerProps {
  open: boolean;
  onClose: () => void;
}

const teko: React.CSSProperties = { fontFamily: "'Teko', sans-serif" };

function PayPalLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.536 0-.99.394-1.073.926L7.076 21.337z" fill="#003087"/>
      <path d="M18.166 7.534c-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H7.609c-.536 0-.99.394-1.073.926l-1.22 7.738a.476.476 0 0 0 .47.551h3.306c.47 0 .869-.34.942-.804l.039-.2.747-4.736.048-.26a.953.953 0 0 1 .942-.804h.593c3.842 0 6.852-1.56 7.731-6.073.367-1.884.177-3.457-.794-4.562a3.78 3.78 0 0 0-1.174-1.01z" fill="#0070E0"/>
    </svg>
  );
}

export default function WalletDrawer({ open, onClose }: WalletDrawerProps) {
  const { user } = useAuth();
  const { earnings, payouts, availableBalance, loading: earningsLoading, requestPayout, refresh } = useEditorEarnings();
  const [savedPaypal, setSavedPaypal] = useState('');
  const [paypalInput, setPaypalInput] = useState('');
  const [editingPaypal, setEditingPaypal] = useState(false);
  const [savingPaypal, setSavingPaypal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPaypal, setLoadingPaypal] = useState(true);

  // Refresh earnings + PayPal when drawer opens
  useEffect(() => {
    if (!user || !open) return;
    refresh(); // re-fetch earnings data
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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[70vh] overflow-y-auto"
            style={{ background: 'linear-gradient(180deg, #0a1a0f 0%, #050d08 100%)' }}
          >
            {/* Pull handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 rounded-full bg-emerald-500/30" />
            </div>

            <div className="px-5 pb-8">
              {/* Header — GTA style */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <DollarSign className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight uppercase" style={teko}>
                      MAZE BANK
                    </h2>
                    <p className="text-[9px] text-emerald-500/60 font-bold uppercase tracking-[0.2em] -mt-1">Loopgate Wallet</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 transition-colors rounded-lg">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Balance Card — main focus */}
              <div className="relative rounded-xl overflow-hidden mb-5">
                {/* BG layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-emerald-950/60 to-black/80" />
                <div className="absolute inset-0 border border-emerald-500/20 rounded-xl" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

                <div className="relative p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400/70 mb-1">Available to Withdraw</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-emerald-400" style={teko}>
                      ${(availableBalance / 100).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Breakdown stats */}
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-emerald-500/10">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-400/40">Total Earned</p>
                      <p className="text-lg font-black text-emerald-400/80" style={teko}>${(earnings.earnings_cents / 100).toFixed(2)}</p>
                    </div>
                    {earnings.pending_withdrawal_cents > 0 && (
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-amber-400/50">Pending</p>
                        <p className="text-lg font-black text-amber-400" style={teko}>${(earnings.pending_withdrawal_cents / 100).toFixed(2)}</p>
                      </div>
                    )}
                    {earnings.withdrawn_cents > 0 && (
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-foreground/30">Withdrawn</p>
                        <p className="text-lg font-black text-foreground/50" style={teko}>${(earnings.withdrawn_cents / 100).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PayPal Method */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <PayPalLogo className="w-5 h-5" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">Payout Method</p>
                </div>
                
                {loadingPaypal ? (
                  <div className="flex items-center gap-2 py-3">
                    <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : !savedPaypal || editingPaypal ? (
                  <div className="space-y-3">
                    <Input
                      type="email"
                      value={paypalInput}
                      onChange={e => setPaypalInput(e.target.value)}
                      placeholder="your@paypal.email"
                      className="h-11 text-sm bg-black/40 border-white/10 focus:border-emerald-500/40 rounded-lg"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSavePaypal}
                        disabled={savingPaypal || !paypalInput.trim()}
                        className="flex-1 bg-[#003087] hover:bg-[#003087]/80 text-white text-xs font-bold h-11 rounded-lg"
                      >
                        {savingPaypal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                          <span className="flex items-center gap-2">
                            <PayPalLogo className="w-4 h-4" />
                            Save PayPal
                          </span>
                        )}
                      </Button>
                      {savedPaypal && (
                        <Button
                          onClick={() => { setEditingPaypal(false); setPaypalInput(savedPaypal); }}
                          variant="outline"
                          className="text-xs h-11 rounded-lg border-white/10"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <PayPalLogo className="w-4 h-4" />
                      <span className="text-xs text-foreground font-mono">{savedPaypal}</span>
                    </div>
                    <button
                      onClick={() => setEditingPaypal(true)}
                      className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
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
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 rounded-xl text-sm uppercase tracking-wider mb-4"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Withdraw ${(availableBalance / 100).toFixed(2)}</>
                  )}
                </Button>
              )}

              {availableBalance > 0 && !savedPaypal && !editingPaypal && (
                <p className="text-[10px] text-amber-400 text-center mb-4">Link your PayPal above to withdraw</p>
              )}

              {/* Recent Payouts */}
              {payouts.length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-2">Transactions</p>
                  <div className="space-y-1.5">
                    {payouts.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2.5">
                        {p.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> :
                         p.status === 'rejected' ? <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" /> :
                         <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span className="text-sm font-bold text-foreground flex-1" style={teko}>${(p.amount_cents / 100).toFixed(2)}</span>
                        <span className={`text-[8px] font-black uppercase tracking-wider ${
                          p.status === 'approved' ? 'text-emerald-400' : p.status === 'rejected' ? 'text-destructive' : 'text-amber-400'
                        }`}>
                          {p.status === 'approved' ? 'Paid' : p.status}
                        </span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[9px] text-muted-foreground/30 text-center mt-5">Payouts reviewed within 24 hours</p>
              {/* Safe area bottom padding for mobile */}
              <div className="h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
