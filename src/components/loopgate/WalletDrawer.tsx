import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle2, Pencil, Clock, XCircle, DollarSign, ChevronRight, Shield, HelpCircle, Settings, FileText, Mail } from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
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
  const [showPrefs, setShowPrefs] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [payoutSpeed, setPayoutSpeed] = useState<'instant' | 'standard'>('instant');

  useEffect(() => {
    if (!user || !open) return;
    refresh();
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[85vh] overflow-y-auto bg-[#0a0a0a]"
          >
            {/* Drag handle */}
            <div className="sticky top-0 z-10 bg-[#0a0a0a] flex justify-center pt-3 pb-1 cursor-grab">
              <div className="w-10 h-1 rounded-full bg-white/10" />
            </div>

            <div className="px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-foreground/60" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground tracking-tight uppercase" style={teko}>
                      Wallet
                    </h2>
                    <p className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em] -mt-0.5">Loopgate Payouts</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 transition-colors rounded-lg">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* CENTURION CARD */}
              <div className="relative rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '8.56/5.398', maxHeight: '200px' }}>
                {/* Titanium matte base */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#0d0d0d]" />
                {/* Subtle brushed-metal texture */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.15) 1px, rgba(255,255,255,0.15) 2px)' }} />
                {/* Top edge highlight */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                {/* Border */}
                <div className="absolute inset-0 border border-white/[0.06] rounded-xl" />

                <div className="relative p-5 h-full flex flex-col justify-between">
                  {/* Top row: chip + brand */}
                  <div className="flex items-start justify-between">
                    {/* EMV Chip */}
                    <div className="w-10 h-7 rounded-[4px] bg-gradient-to-br from-[#c9a84c] via-[#d4b85a] to-[#a88a3a] border border-[#8a7030]/40 shadow-sm">
                      <div className="w-full h-full rounded-[4px]" style={{ 
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 5px), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)' 
                      }} />
                    </div>
                    {/* Loopgate brand mark */}
                    <div className="flex items-center gap-1.5">
                      <GateIcon size={14} className="text-white/20" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20" style={teko}>Loopgate</span>
                    </div>
                  </div>

                  {/* Balance — center */}
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/25 mb-0.5">Available Balance</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-white/30 text-lg font-bold" style={teko}>$</span>
                      <span className="text-[40px] font-black text-white leading-none tabular-nums tracking-tight" style={teko}>
                        {(availableBalance / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom row: earned / pending / withdrawn */}
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-5">
                      <div>
                        <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/15">Earned</p>
                        <p className="text-sm font-black text-white/50 tabular-nums leading-tight" style={teko}>${(earnings.earnings_cents / 100).toFixed(2)}</p>
                      </div>
                      {earnings.pending_withdrawal_cents > 0 && (
                        <div>
                          <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-amber-400/30">Pending</p>
                          <p className="text-sm font-black text-amber-400/60 tabular-nums leading-tight" style={teko}>${(earnings.pending_withdrawal_cents / 100).toFixed(2)}</p>
                        </div>
                      )}
                      {earnings.withdrawn_cents > 0 && (
                        <div>
                          <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/10">Paid</p>
                          <p className="text-sm font-black text-white/25 tabular-nums leading-tight" style={teko}>${(earnings.withdrawn_cents / 100).toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                    {/* Card type */}
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10" style={teko}>Centurion</p>
                  </div>
                </div>
              </div>

              {/* Withdraw Button */}
              {availableBalance > 0 && savedPaypal && !editingPaypal && (
                <Button
                  onClick={handleWithdraw}
                  disabled={submitting}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 font-black h-12 rounded-xl text-sm uppercase tracking-wider mb-4"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Withdraw ${(availableBalance / 100).toFixed(2)}</>
                  )}
                </Button>
              )}

              {availableBalance > 0 && !savedPaypal && !editingPaypal && (
                <p className="text-[10px] text-amber-400 text-center mb-4">Link your PayPal below to withdraw</p>
              )}

              {/* PayPal Method */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <PayPalLogo className="w-4 h-4" />
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Payout Method</p>
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
                      className="h-11 text-sm bg-black/40 border-white/[0.06] focus:border-white/20 rounded-lg"
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
                          className="text-xs h-11 rounded-lg border-white/[0.06]"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <PayPalLogo className="w-4 h-4" />
                      <span className="text-xs text-foreground/70 font-mono">{savedPaypal}</span>
                    </div>
                    <button
                      onClick={() => setEditingPaypal(true)}
                      className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground/40" />
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Payouts */}
              {payouts.length > 0 && (
                <div className="mb-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-2">Transactions</p>
                  <div className="space-y-1">
                    {payouts.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2.5">
                        {p.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> :
                         p.status === 'rejected' ? <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" /> :
                         <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span className="text-sm font-bold text-foreground flex-1 tabular-nums" style={teko}>${(p.amount_cents / 100).toFixed(2)}</span>
                        <span className={`text-[8px] font-black uppercase tracking-wider ${
                          p.status === 'approved' ? 'text-emerald-400' : p.status === 'rejected' ? 'text-destructive' : 'text-amber-400'
                        }`}>
                          {p.status === 'approved' ? 'Paid' : p.status}
                        </span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground/20" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings & Support */}
              <div className="border-t border-white/[0.04] pt-4 space-y-1">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-2">Settings & Support</p>
                
                <button onClick={() => setShowPrefs(!showPrefs)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left">
                  <Settings className="w-3.5 h-3.5 text-muted-foreground/40" />
                  <span className="text-xs text-foreground/60 flex-1">Payout Preferences</span>
                  <ChevronRight className={`w-3 h-3 text-muted-foreground/20 transition-transform ${showPrefs ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {showPrefs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 space-y-2">
                        <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-bold">Payout Speed</p>
                        <button
                          onClick={() => setPayoutSpeed('instant')}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border transition-colors text-left ${
                            payoutSpeed === 'instant'
                              ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
                              : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                            payoutSpeed === 'instant' ? 'border-emerald-400' : 'border-muted-foreground/20'
                          }`}>
                            {payoutSpeed === 'instant' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-foreground/80">Instant</p>
                            <p className="text-[9px] text-muted-foreground/40">Processed within 24 hours</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setPayoutSpeed('standard')}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border transition-colors text-left ${
                            payoutSpeed === 'standard'
                              ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
                              : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                            payoutSpeed === 'standard' ? 'border-emerald-400' : 'border-muted-foreground/20'
                          }`}>
                            {payoutSpeed === 'standard' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-foreground/80">Standard</p>
                            <p className="text-[9px] text-muted-foreground/40">Batched weekly on Fridays</p>
                          </div>
                        </button>
                        <p className="text-[8px] text-muted-foreground/20 pt-1">Changes apply to your next withdrawal request.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={() => setShowPolicy(!showPolicy)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground/40" />
                  <span className="text-xs text-foreground/60 flex-1">Payout Policy</span>
                  <ChevronRight className={`w-3 h-3 text-muted-foreground/20 transition-transform ${showPolicy ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {showPolicy && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-foreground/60 mb-0.5">No Minimums</p>
                          <p className="text-[9px] text-muted-foreground/40">Withdraw any amount, anytime. No minimum payout threshold.</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-foreground/60 mb-0.5">Processing Time</p>
                          <p className="text-[9px] text-muted-foreground/40">Instant payouts are reviewed and sent within 24 hours. Standard payouts are batched and processed every Friday.</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-foreground/60 mb-0.5">Chargebacks & Fraud</p>
                          <p className="text-[9px] text-muted-foreground/40">Loopgate reserves the right to reverse payouts tied to fraudulent activity, duplicate submissions, or policy violations.</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-foreground/60 mb-0.5">Earnings Expiry</p>
                          <p className="text-[9px] text-muted-foreground/40">Unclaimed earnings remain available for 12 months. After that, funds may be forfeited.</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-foreground/60 mb-0.5">Tax Responsibility</p>
                          <p className="text-[9px] text-muted-foreground/40">You are responsible for reporting earnings to your local tax authority. Loopgate does not withhold taxes.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={() => window.location.href = 'mailto:team@loopgate.io'}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
                >
                  <Mail className="w-3.5 h-3.5 text-muted-foreground/40" />
                  <span className="text-xs text-foreground/60 flex-1">Contact Support</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/20" />
                </button>

                <a 
                  href="https://discord.gg/loopgate" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40" />
                  <span className="text-xs text-foreground/60 flex-1">Discord Community</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/20" />
                </a>
              </div>

              {/* Trust footer */}
              <div className="flex items-center justify-center gap-1.5 mt-5 pt-3 border-t border-white/[0.03]">
                <Shield className="w-3 h-3 text-muted-foreground/20" />
                <p className="text-[8px] text-muted-foreground/20 font-medium">Payouts reviewed within 24h · Secured by Loopgate</p>
              </div>

              {/* Safe area */}
              <div className="h-8" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
