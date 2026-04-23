import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, DollarSign, Loader2, Clock, Check, X as XIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClippersLayout from '@/components/clippers/ClippersLayout';
import ClipperLockGate from '@/components/clippers/ClipperLockGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Withdrawal {
  id: string;
  amount_cents: number;
  method: string;
  destination: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

const METHODS = [
  { id: 'paypal', label: 'PayPal', placeholder: 'PayPal email' },
  { id: 'bank', label: 'Bank', placeholder: 'Account / IBAN' },
  { id: 'crypto', label: 'Crypto', placeholder: 'Wallet address (USDT)' },
];

const MIN_PAYOUT_CENTS = 1000; // $10

export default function ClippersWithdrawalsPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [showGate, setShowGate] = useState(false);

  const [method, setMethod] = useState('paypal');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [requesting, setRequesting] = useState(false);

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const [pRes, wRes] = await Promise.all([
      supabase.from('clipper_profiles').select('total_earnings_cents').eq('user_id', user.id).maybeSingle(),
      supabase.from('clipper_withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    const earnings = pRes.data?.total_earnings_cents || 0;
    const paidOut = (wRes.data || []).filter((w) => w.status !== 'rejected').reduce((sum, w) => sum + w.amount_cents, 0);
    setBalance(Math.max(0, earnings - paidOut));
    setWithdrawals((wRes.data || []) as Withdrawal[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const submitRequest = async () => {
    if (!user) {
      setShowGate(true);
      return;
    }
    const amtCents = Math.round(parseFloat(amount) * 100);
    if (!amtCents || amtCents < MIN_PAYOUT_CENTS) {
      toast.error(`Minimum payout is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}`);
      return;
    }
    if (amtCents > balance) {
      toast.error('Amount exceeds balance');
      return;
    }
    if (!destination.trim()) {
      toast.error('Enter a destination');
      return;
    }
    setRequesting(true);
    const { error } = await supabase.from('clipper_withdrawals').insert({
      user_id: user.id,
      amount_cents: amtCents,
      method,
      destination: destination.trim(),
    });
    setRequesting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Withdrawal requested');
    setAmount('');
    setDestination('');
    setShowRequest(false);
    load();
  };

  const formatMoney = (c: number) => `$${(c / 100).toFixed(2)}`;

  return (
    <ClippersLayout title="CASHOUT">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="font-display text-3xl mb-1">Withdrawals</h1>
          <p className="text-sm text-muted-foreground">Cash out your clip earnings.</p>
        </div>

        {/* Balance card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-surface-1 via-surface-1 to-gold/10 border border-gold/30 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-3.5 h-3.5 text-gold" />
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Available Balance</span>
            </div>
            <p className="font-display text-5xl text-gold mb-4">{formatMoney(balance)}</p>
            <Button
              onClick={() => (user ? setShowRequest(true) : setShowGate(true))}
              disabled={user && balance < MIN_PAYOUT_CENTS}
              className="bg-gold hover:bg-gold/90 text-gold-foreground font-display tracking-wide h-11 px-6"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Cash Out
            </Button>
            <p className="text-[11px] text-muted-foreground mt-2">
              Min payout {formatMoney(MIN_PAYOUT_CENTS)}
            </p>
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="font-display text-lg mb-3">History</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-surface-1 border border-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !user || withdrawals.length === 0 ? (
            <div className="bg-surface-1 border border-border rounded-2xl p-8 text-center">
              <Wallet className="w-7 h-7 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w) => {
                const sColor =
                  w.status === 'paid'
                    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                    : w.status === 'rejected'
                    ? 'text-destructive border-destructive/40 bg-destructive/10'
                    : 'text-gold border-gold/40 bg-gold/10';
                const SI = w.status === 'paid' ? Check : w.status === 'rejected' ? XIcon : Clock;
                return (
                  <div key={w.id} className="bg-surface-1 border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-display text-lg">{formatMoney(w.amount_cents)}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.method.toUpperCase()} · {new Date(w.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 border rounded-full text-[10px] font-display tracking-wider uppercase flex items-center gap-1 ${sColor}`}>
                      <SI className="w-2.5 h-2.5" />
                      {w.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Request sheet */}
      {showRequest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setShowRequest(false)}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-surface-1 border border-border sm:rounded-2xl rounded-t-3xl p-6 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div>
              <h2 className="font-display text-2xl">Cash Out</h2>
              <p className="text-xs text-muted-foreground">Available: {formatMoney(balance)}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`p-3 rounded-xl border text-sm font-display transition-colors ${
                    method === m.id ? 'border-gold bg-gold/10 text-gold' : 'border-border bg-surface-0 text-muted-foreground hover:border-gold/40'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground tracking-wider uppercase">Amount ($)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                placeholder="10.00"
                className="h-12 bg-surface-0 mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground tracking-wider uppercase">Destination</label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={METHODS.find((m) => m.id === method)?.placeholder}
                className="h-12 bg-surface-0 mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRequest(false)} className="flex-1 h-11">
                Cancel
              </Button>
              <Button onClick={submitRequest} disabled={requesting} className="flex-1 h-11 bg-gold hover:bg-gold/90 text-gold-foreground">
                {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ClipperLockGate
        open={showGate}
        onClose={() => setShowGate(false)}
        onSuccess={load}
        reason="Lock in to request withdrawals."
      />
    </ClippersLayout>
  );
}